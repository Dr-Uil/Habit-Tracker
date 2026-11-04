import type { Exercise, WorkoutLog } from '../types';

/* ────────────────────────────────────────────────────────────────────────────
 * Leitura do que a pessoa informa ao finalizar o treino (esforço 0–10 e
 * observações) para ajustar as próximas sugestões:
 *  • dor numa região → não sobe carga nos exercícios que a sobrecarregam (−10%)
 *  • treino muito puxado / cansaço / sono ruim → segura a progressão
 *  • treino fácil → libera subir a carga um pouco antes
 *  • fadiga repetida → sugere fazer o próximo treino em modo leve
 * ──────────────────────────────────────────────────────────────────────────── */

export type BodyRegion = 'joelho' | 'ombro' | 'lombar' | 'cotovelo' | 'punho' | 'quadril';

export const REGION_LABEL: Record<BodyRegion, string> = {
  joelho: 'joelho',
  ombro: 'ombro',
  lombar: 'lombar',
  cotovelo: 'cotovelo',
  punho: 'punho',
  quadril: 'quadril',
};

const REGION_WORDS: Record<BodyRegion, RegExp> = {
  joelho: /joelh/,
  ombro: /ombr/,
  lombar: /lombar|coluna|costas baixa|lombo/,
  cotovelo: /cotovel/,
  punho: /punho|pulso/,
  quadril: /quadril|virilha/,
};

const NO_PAIN = /sem dor|nenhuma dor|nao doeu|nao senti dor|dor passou|sem incomodo/;
const PAIN = /\bdor\b|\bdores\b|doeu|doendo|incomod|lesao|lesion|machuc|fisgada|pontada|inflam|tendinite|torci|travou/;
const FATIGUE = /cansad|exaust|sem energia|pouca energia|fadiga|dormi mal|dormi pouco|sono ruim|insonia|doente|gripad|resfriad|estressad|sem forca|muito pesado|puxado demais|destruid|morto/;
const EASY = /facil|leve demais|tranquilo|sobrou muito|poderia mais|deu pra mais|muito leve/;

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export interface WorkoutFeedback {
  pain: BodyRegion[];
  painGeneral: boolean;
  fatigue: boolean;
  easy: boolean;
}

export function parseFeedback(w: Pick<WorkoutLog, 'notes' | 'rpe'>): WorkoutFeedback {
  const t = norm(w.notes ?? '');
  const noPain = NO_PAIN.test(t);
  const hasPain = !noPain && PAIN.test(t);
  const pain = hasPain ? (Object.keys(REGION_WORDS) as BodyRegion[]).filter((r) => REGION_WORDS[r].test(t)) : [];
  return {
    pain,
    painGeneral: hasPain && pain.length === 0,
    fatigue: FATIGUE.test(t) || (w.rpe != null && w.rpe >= 9),
    easy: !FATIGUE.test(t) && (EASY.test(t) || (w.rpe != null && w.rpe <= 6)),
  };
}

/** Regiões articulares que o exercício mais sobrecarrega. */
export function exerciseRegions(ex: Exercise): BodyRegion[] {
  const r = new Set<BodyRegion>((ex.avoid ?? []) as BodyRegion[]);
  switch (ex.pattern) {
    case 'squat':
    case 'lunge':
    case 'knee_ext':
      r.add('joelho');
      break;
    case 'knee_flex':
      r.add('joelho');
      break;
    case 'hinge':
      r.add('lombar');
      r.add('quadril');
      break;
    case 'hip_thrust':
    case 'abduction':
      r.add('quadril');
      break;
    case 'h_push':
    case 'incline_push':
    case 'v_push':
    case 'chest_fly':
    case 'lateral_raise':
    case 'front_raise':
      r.add('ombro');
      break;
    case 'triceps':
    case 'biceps':
      r.add('cotovelo');
      break;
  }
  if (ex.load === 'barra' && (ex.pattern === 'squat' || ex.pattern === 'h_pull')) r.add('lombar');
  return [...r];
}

export interface FeedbackContext {
  /** dor relatada recentemente, por região */
  painRegions: BodyRegion[];
  /** último treino muito puxado ou cansaço relatado */
  fatigued: boolean;
  /** último treino relatado como fácil */
  easy: boolean;
  /** fadiga em 2 dos últimos 3 treinos → sugerir treino leve */
  overreaching: boolean;
  /** frases para mostrar o que o app entendeu */
  reasons: string[];
}

export const EMPTY_CONTEXT: FeedbackContext = { painRegions: [], fatigued: false, easy: false, overreaching: false, reasons: [] };

const DAY = 86400000;

export function feedbackContext(workouts: WorkoutLog[], now = Date.now()): FeedbackContext {
  const recent = [...workouts].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt));
  if (recent.length === 0) return EMPTY_CONTEXT;
  const age = (w: WorkoutLog) => now - new Date(w.finishedAt).getTime();
  const reasons: string[] = [];

  // Dor: vale por 10 dias, até um treino posterior dizer "sem dor" para a mesma região
  const pain = new Set<BodyRegion>();
  const cleared = new Set<BodyRegion | 'all'>();
  let painGeneral = false;
  for (const w of recent) {
    if (age(w) > 10 * DAY) break;
    const t = norm(w.notes ?? '');
    if (NO_PAIN.test(t)) {
      const regions = (Object.keys(REGION_WORDS) as BodyRegion[]).filter((r) => REGION_WORDS[r].test(t));
      if (regions.length) regions.forEach((r) => cleared.add(r));
      else cleared.add('all');
    }
    const fb = parseFeedback(w);
    for (const r of fb.pain) if (!cleared.has(r) && !cleared.has('all')) pain.add(r);
    if (fb.painGeneral && !cleared.has('all') && w === recent[0]) painGeneral = true;
  }
  if (pain.size) reasons.push(`Dor relatada (${[...pain].map((r) => REGION_LABEL[r]).join(', ')}): sem aumento de carga nos exercícios que sobrecarregam essa região, e −10% para treinar sem dor.`);
  if (painGeneral) reasons.push('Você relatou dor no último treino. Se for numa articulação, escreva onde (ex.: “dor no ombro”) para o app ajustar os exercícios certos.');

  const last = recent[0];
  const lastFb = parseFeedback(last);
  const fresh = age(last) <= 5 * DAY;
  const fatigued = fresh && lastFb.fatigue;
  const easy = fresh && lastFb.easy;
  if (fatigued) reasons.push('Último treino muito puxado ou cansaço relatado: as cargas ficam iguais hoje (sem subir). Priorize sono e alimentação.');
  if (easy) reasons.push('Último treino pareceu fácil: o app libera subir a carga quando você ficar a 1 repetição do topo da faixa.');

  const last3 = recent.filter((w) => age(w) <= 14 * DAY).slice(0, 3);
  const overreaching = last3.filter((w) => parseFeedback(w).fatigue).length >= 2;
  if (overreaching) reasons.push('Cansaço em 2 dos últimos 3 treinos: considere fazer o próximo em modo leve (metade das séries).');

  return { painRegions: [...pain], fatigued, easy, overreaching, reasons };
}
