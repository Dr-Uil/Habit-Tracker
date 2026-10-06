import { EXERCISES, getExercise, isAvailable, ALL_MUSCLES } from '../data/exercises';
import type {
  CardioMode,
  CardioPrescription,
  Exercise,
  Muscle,
  Pattern,
  Prescription,
  Program,
  Questionnaire,
  Session,
  SessionFocus,
  SlotRole,
} from '../types';
import { uid } from './util';

/* ────────────────────────────────────────────────────────────────────────────
 * Regras (resumo da literatura — detalhes e referências em data/science.ts)
 *  • Frequência: cada músculo ≥ 2×/semana (Schoenfeld 2016).
 *  • Volume: ~10–20 séries “duras” por músculo/semana; iniciantes respondem bem
 *    com menos (Schoenfeld 2017; Baz-Valle 2022). Contagem fracionada: músculo
 *    secundário conta 0,5 série.
 *  • Repetições: 6–30 reps geram hipertrofia semelhante se perto da falha
 *    (Schoenfeld 2017/2021). Usamos 6–10 nos multiarticulares e 10–20 nos isolados.
 *  • Proximidade da falha: 0–3 repetições na reserva (RIR) (Refalo 2023; Robinson 2024).
 *  • Descanso: 2–3 min nos multiarticulares, ~90 s nos isolados (Schoenfeld 2016; Singer 2024).
 *  • Bi-sets de músculos não concorrentes economizam tempo sem perder volume (Iversen 2021).
 * ──────────────────────────────────────────────────────────────────────────── */

interface Slot {
  pattern: Pattern;
  role: SlotRole;
}
interface Template {
  name: string;
  focus: SessionFocus;
  slots: Slot[];
}

const m = (pattern: Pattern): Slot => ({ pattern, role: 'main' });
const s = (pattern: Pattern): Slot => ({ pattern, role: 'secondary' });
const a = (pattern: Pattern): Slot => ({ pattern, role: 'accessory' });

const SPLITS: Record<number, { name: string; why: string; templates: Template[] }> = {
  2: {
    name: 'Full Body A/B',
    why: 'Com 2 dias, treinar o corpo inteiro em cada sessão garante frequência de 2×/semana por músculo — depois do volume total, é o que mais importa para hipertrofia.',
    templates: [
      { name: 'A — Corpo inteiro', focus: 'full', slots: [m('squat'), m('h_push'), s('h_pull'), s('hinge'), a('lateral_raise'), a('biceps'), a('triceps'), a('calf')] },
      { name: 'B — Corpo inteiro', focus: 'full', slots: [m('hip_thrust'), m('incline_push'), s('v_pull'), s('lunge'), a('knee_flex'), a('lateral_raise'), a('triceps'), a('biceps'), a('core')] },
    ],
  },
  3: {
    name: 'Full Body A/B/C',
    why: 'Full body 3× por semana treina cada músculo 2–3× com sessões curtas e eficientes — ideal para 3 dias e tempo limitado.',
    templates: [
      { name: 'A — Corpo inteiro', focus: 'full', slots: [m('squat'), m('h_push'), s('v_pull'), a('knee_flex'), a('lateral_raise'), a('triceps'), a('calf')] },
      { name: 'B — Corpo inteiro', focus: 'full', slots: [m('hinge'), m('h_pull'), s('incline_push'), s('lunge'), a('biceps'), a('rear_delt'), a('core')] },
      { name: 'C — Corpo inteiro', focus: 'full', slots: [m('hip_thrust'), m('v_pull'), s('h_push'), a('knee_ext'), a('lateral_raise'), a('biceps'), a('triceps'), a('calf')] },
    ],
  },
  4: {
    name: 'Superior / Inferior (2×)',
    why: 'Superior/Inferior 2× por semana: cada músculo é treinado 2×, o volume fica bem distribuído e cada sessão cabe em ~60 min.',
    templates: [
      { name: 'A — Superior', focus: 'upper', slots: [m('h_push'), m('h_pull'), s('v_pull'), s('v_push'), a('lateral_raise'), a('triceps'), a('biceps')] },
      { name: 'B — Inferior', focus: 'lower', slots: [m('squat'), m('hinge'), a('knee_ext'), a('knee_flex'), a('calf'), a('core')] },
      { name: 'C — Superior', focus: 'upper', slots: [m('incline_push'), m('v_pull'), s('h_pull'), a('chest_fly'), a('lateral_raise'), a('biceps'), a('triceps'), a('rear_delt')] },
      { name: 'D — Inferior', focus: 'lower', slots: [m('squat'), s('hip_thrust'), s('lunge'), a('knee_flex'), a('knee_ext'), a('calf'), a('abduction'), a('core')] },
    ],
  },
  5: {
    name: 'Superior/Inferior + Empurrar/Puxar/Pernas',
    why: 'Combina Superior/Inferior com Empurrar/Puxar/Pernas: frequência de ~2×/semana por músculo com mais volume por grupo.',
    templates: [
      { name: 'A — Superior', focus: 'upper', slots: [m('h_push'), m('h_pull'), s('v_pull'), a('lateral_raise'), a('triceps'), a('biceps')] },
      { name: 'B — Inferior', focus: 'lower', slots: [m('squat'), m('hinge'), a('knee_flex'), a('calf'), a('core')] },
      { name: 'C — Empurrar', focus: 'push', slots: [m('incline_push'), s('v_push'), a('chest_fly'), a('lateral_raise'), a('triceps')] },
      { name: 'D — Puxar', focus: 'pull', slots: [m('v_pull'), s('h_pull'), a('rear_delt'), a('biceps'), a('core')] },
      { name: 'E — Pernas', focus: 'legs', slots: [m('squat'), s('hip_thrust'), s('lunge'), a('knee_ext'), a('knee_flex'), a('calf'), a('abduction')] },
    ],
  },
  6: {
    name: 'Empurrar / Puxar / Pernas (2×)',
    why: 'PPL 2× por semana: alta frequência e volume para quem consegue treinar 6 dias.',
    templates: [
      { name: 'A — Empurrar', focus: 'push', slots: [m('h_push'), s('incline_push'), a('lateral_raise'), a('triceps'), a('chest_fly')] },
      { name: 'B — Puxar', focus: 'pull', slots: [m('v_pull'), s('h_pull'), a('rear_delt'), a('biceps'), a('core')] },
      { name: 'C — Pernas', focus: 'legs', slots: [m('squat'), s('hinge'), a('knee_ext'), a('knee_flex'), a('calf')] },
      { name: 'D — Empurrar', focus: 'push', slots: [m('incline_push'), s('v_push'), a('chest_fly'), a('lateral_raise'), a('triceps')] },
      { name: 'E — Puxar', focus: 'pull', slots: [m('h_pull'), s('v_pull'), a('rear_delt'), a('biceps'), a('core')] },
      { name: 'F — Pernas', focus: 'legs', slots: [m('hinge'), s('hip_thrust'), s('lunge'), a('knee_flex'), a('knee_ext'), a('calf'), a('abduction')] },
    ],
  },
};

const FALLBACK: Partial<Record<Pattern, Pattern[]>> = {
  squat: ['lunge'],
  hinge: ['hip_thrust', 'knee_flex'],
  lunge: ['squat', 'hip_thrust'],
  knee_ext: ['lunge', 'squat'],
  knee_flex: ['hinge'],
  hip_thrust: ['hinge', 'lunge'],
  abduction: ['hip_thrust'],
  h_push: ['incline_push'],
  incline_push: ['h_push'],
  v_push: ['lateral_raise'],
  chest_fly: ['h_push'],
  h_pull: ['v_pull'],
  v_pull: ['h_pull'],
  rear_delt: ['h_pull'],
};

const PRIORITY_PATTERN: Record<Muscle, Pattern[]> = {
  peito: ['chest_fly', 'incline_push'],
  costas: ['v_pull', 'h_pull'],
  ombros: ['lateral_raise'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  quadriceps: ['knee_ext', 'lunge'],
  posteriores: ['knee_flex', 'hinge'],
  gluteos: ['hip_thrust', 'abduction', 'lunge'],
  panturrilhas: ['calf'],
  abdomen: ['core'],
};

const FOCUS_MUSCLES: Record<SessionFocus, Muscle[]> = {
  full: ALL_MUSCLES,
  upper: ['peito', 'costas', 'ombros', 'biceps', 'triceps', 'abdomen'],
  lower: ['quadriceps', 'posteriores', 'gluteos', 'panturrilhas', 'abdomen'],
  push: ['peito', 'ombros', 'triceps'],
  pull: ['costas', 'biceps', 'ombros', 'abdomen'],
  legs: ['quadriceps', 'posteriores', 'gluteos', 'panturrilhas', 'abdomen'],
};

export const BLOCK_LENGTH = 6;

/* ───────────── Volume ───────────── */

export function volumeTargets(q: Questionnaire): Record<Muscle, [number, number]> {
  const base: [number, number] = q.experience === 'iniciante' ? [8, 12] : q.experience === 'intermediario' ? [10, 16] : [12, 20];
  const out = {} as Record<Muscle, [number, number]>;
  for (const mu of ALL_MUSCLES) {
    let t: [number, number] = [...base];
    if (mu === 'panturrilhas' || mu === 'abdomen') t = [Math.max(4, base[0] - 4), base[1] - 4];
    if (q.priorityMuscles.includes(mu)) t = [t[0] + 4, t[1] + 4];
    out[mu] = t;
  }
  return out;
}

function perSessionCap(q: Questionnaire) {
  return q.experience === 'iniciante' ? 8 : 10;
}

function setCap(role: SlotRole) {
  return role === 'main' ? 5 : 4;
}

export function weeklyVolume(sessions: { exercises: Prescription[] }[]): Partial<Record<Muscle, number>> {
  const v: Partial<Record<Muscle, number>> = {};
  for (const ses of sessions)
    for (const p of ses.exercises) {
      const ex = getExercise(p.exerciseId);
      for (const [mu, w] of Object.entries(ex.muscles) as [Muscle, number][]) v[mu] = (v[mu] ?? 0) + w * p.sets;
    }
  return v;
}

function sessionMuscle(ses: { exercises: Prescription[] }, mu: Muscle) {
  return ses.exercises.reduce((acc, p) => acc + (getExercise(p.exerciseId).muscles[mu] ?? 0) * p.sets, 0);
}

/* ───────────── Tempo ───────────── */

const WARMUP_SEC = 4 * 60 + 2 * 60; // aquecimento geral + séries de aproximação
const SETUP_SEC = 40;

function workSec(ex: Exercise) {
  return (ex.kind === 'compound' ? 40 : 35) * (ex.unilateral ? 1.7 : 1);
}

export function groupExercises(exs: Prescription[]): Prescription[][] {
  const groups: Prescription[][] = [];
  for (const p of exs) {
    const last = groups[groups.length - 1];
    if (p.superset && last && last[0].superset === p.superset) last.push(p);
    else groups.push([p]);
  }
  return groups;
}

export function estimateMinutes(exs: Prescription[]): number {
  let sec = WARMUP_SEC;
  for (const g of groupExercises(exs)) {
    if (g.length === 1) {
      const p = g[0];
      sec += SETUP_SEC + p.sets * (workSec(getExercise(p.exerciseId)) + p.restSec);
    } else {
      const sets = Math.max(...g.map((p) => p.sets));
      const work = g.reduce((acc, p) => acc + workSec(getExercise(p.exerciseId)) + 15, 0);
      const rest = Math.max(...g.map((p) => p.restSec));
      sec += SETUP_SEC * g.length + sets * (work + rest);
    }
  }
  return Math.round(sec / 60);
}

type Region = 'upper' | 'lower' | 'core';
const UPPER_MUSCLES: Muscle[] = ['peito', 'costas', 'ombros', 'biceps', 'triceps'];

function region(ex: Exercise): Region {
  const primary = (Object.entries(ex.muscles) as [Muscle, number][]).filter(([, w]) => w >= 1).map(([mu]) => mu);
  if (primary.every((mu) => mu === 'abdomen')) return 'core';
  return primary.some((mu) => UPPER_MUSCLES.includes(mu)) ? 'upper' : 'lower';
}

const portable = (ex: Exercise) => ex.load === 'peso_corporal' || ex.load === 'elastico' || ex.load === 'halter';

/**
 * Bi-set só faz sentido se os músculos não competem (preserva as repetições — Iversen 2021)
 * E se for prático na academia: nunca duas máquinas (você ocuparia dois aparelhos e eles
 * costumam ficar longe), e superior com superior / inferior com inferior (mesma área).
 * Core sem aparelho combina com qualquer coisa.
 */
export function canPair(a: Exercise, b: Exercise): boolean {
  const overlap = Object.keys(a.muscles).some((k) => (b.muscles as Record<string, number>)[k]);
  if (overlap) return false;
  if (a.load === 'maquina' && b.load === 'maquina') return false;
  const ra = region(a);
  const rb = region(b);
  if (ra === 'core' || rb === 'core') {
    const core = ra === 'core' ? a : b;
    const other = ra === 'core' ? b : a;
    return portable(core) || core.load === other.load;
  }
  return ra === rb;
}

function assignSupersets(exs: Prescription[], enabled: boolean) {
  for (const p of exs) delete p.superset;
  if (!enabled) return;
  let label = 0;
  let i = 0;
  while (i < exs.length - 1) {
    const p1 = exs[i];
    const p2 = exs[i + 1];
    if (p1.role === 'accessory' && p2.role === 'accessory' && canPair(getExercise(p1.exerciseId), getExercise(p2.exerciseId))) {
      const tag = String.fromCharCode(65 + label++);
      p1.superset = tag;
      p2.superset = tag;
      i += 2;
      continue;
    }
    i += 1;
  }
}

/* ───────────── Prescrição de reps e descanso ───────────── */

const REP_OVERRIDE: Record<string, [number, number]> = {
  nordica: [3, 8],
  barra_fixa: [5, 12],
  prancha: [8, 12],
};

export function repRange(ex: Exercise, role: SlotRole, q: Questionnaire): [number, number] {
  if (REP_OVERRIDE[ex.id]) return REP_OVERRIDE[ex.id];
  const light = ex.load === 'peso_corporal' || ex.load === 'elastico';
  if (light) return ex.kind === 'compound' ? [10, 20] : [12, 25];
  if (['lateral_raise', 'front_raise', 'rear_delt', 'calf', 'abduction'].includes(ex.pattern)) return [12, 20];
  if (ex.pattern === 'core') return [10, 15];
  if (ex.kind === 'isolation') return [10, 15];
  if (role === 'main') {
    if (q.experience === 'iniciante' || ex.pattern === 'hip_thrust' || ex.unilateral) return [8, 12];
    return [6, 10];
  }
  return [8, 12];
}

export function restFor(ex: Exercise, role: SlotRole, q: Questionnaire): number {
  const light = (ex.load === 'peso_corporal' || ex.load === 'elastico') && !REP_OVERRIDE[ex.id];
  if (light) return ex.kind === 'compound' ? 90 : 75;
  if (ex.kind === 'compound') {
    if (role === 'main') return q.experience === 'avancado' ? 180 : q.experience === 'intermediario' ? 150 : 120;
    return q.experience === 'iniciante' ? 105 : 120;
  }
  return 90;
}

function initialSets(role: SlotRole, q: Questionnaire) {
  if (role === 'main') return q.experience === 'avancado' ? 4 : 3;
  if (role === 'secondary') return 3;
  return q.experience === 'iniciante' ? 2 : 3;
}

/* ───────────── Seleção de exercícios ───────────── */

export function candidates(pattern: Pattern, q: Questionnaire, role: SlotRole = 'accessory'): Exercise[] {
  const list = EXERCISES.filter(
    (e) => e.pattern === pattern && isAvailable(e, q.equipment) && !(e.avoid ?? []).some((l) => q.limitations.includes(l)),
  );
  if (q.experience === 'iniciante' && role === 'main') {
    return [...list.filter((e) => e.skill < 3), ...list.filter((e) => e.skill === 3)];
  }
  return list;
}

/** Alternativas para trocar um exercício (mesmo padrão + padrões substitutos). */
export function alternatives(exerciseId: string, q: Questionnaire): Exercise[] {
  const ex = getExercise(exerciseId);
  const pats = [ex.pattern, ...(FALLBACK[ex.pattern] ?? [])];
  const seen = new Set<string>([exerciseId]);
  const out: Exercise[] = [];
  for (const p of pats)
    for (const c of candidates(p, q))
      if (!seen.has(c.id)) {
        seen.add(c.id);
        out.push(c);
      }
  return out;
}

function pick(pattern: Pattern, role: SlotRole, q: Questionnaire, used: Set<string>, variant = 0): Exercise | null {
  for (const p of [pattern, ...(FALLBACK[pattern] ?? [])]) {
    let list = candidates(p, q, role);
    if (list.length === 0) continue;
    if (variant) {
      const k = variant % list.length;
      list = [...list.slice(k), ...list.slice(0, k)];
    }
    const fresh = list.find((e) => !used.has(e.id));
    return fresh ?? list[0];
  }
  return null;
}

/* ───────────── Cardio ───────────── */

export function hrMax(age: number) {
  return Math.round(208 - 0.7 * age); // Tanaka 2001
}

function modeOrder(q: Questionnaire, context: 'pos_pernas' | 'geral' | 'hiit'): CardioMode[] {
  const prefs = q.cardioModes.length ? [...q.cardioModes] : (['esteira', 'bike'] as CardioMode[]);
  const knee = q.limitations.includes('joelho');
  const order: Record<typeof context, CardioMode[]> = {
    // Bike/elíptico/remo interferem menos na hipertrofia de pernas que corrida (Wilson 2012)
    pos_pernas: ['bike', 'eliptico', 'remo', 'caminhada', 'esteira', 'escada', 'corrida_rua'],
    geral: ['esteira', 'bike', 'eliptico', 'caminhada', 'remo', 'escada', 'corrida_rua'],
    hiit: ['bike', 'remo', 'eliptico', 'esteira', 'escada', 'corrida_rua'],
  };
  let list = order[context].filter((md) => prefs.includes(md));
  if (knee) list = list.filter((md) => md !== 'corrida_rua' && md !== 'escada');
  if (list.length === 0) list = knee ? ['bike', 'eliptico'] : context === 'hiit' ? ['bike'] : ['caminhada'];
  return list;
}

export const CARDIO_MODE_LABEL: Record<CardioMode, string> = {
  esteira: 'Esteira',
  bike: 'Bicicleta ergométrica',
  eliptico: 'Elíptico/transport',
  escada: 'Escada (simulador)',
  remo: 'Remo ergômetro',
  corrida_rua: 'Corrida na rua',
  caminhada: 'Caminhada (inclinada ou rua)',
};

function zona2(q: Questionnaire, minutes: number, mode: CardioMode): CardioPrescription {
  const hr = hrMax(q.age);
  return {
    id: uid(),
    kind: 'zona2',
    title: `Cardio Zona 2 — ${minutes} min`,
    minutes,
    mode,
    details: `Intensidade moderada: FC ${Math.round(hr * 0.6)}–${Math.round(hr * 0.7)} bpm (60–70% da FCmáx). Teste da fala: dá para conversar em frases curtas. Melhora a base aeróbia, a recuperação e o gasto calórico sem atrapalhar a musculação.`,
  };
}

function hiitCurto(q: Questionnaire, mode: CardioMode): CardioPrescription {
  const hr = hrMax(q.age);
  return {
    id: uid(),
    kind: 'hiit_curto',
    title: 'HIIT curto — 17 min',
    minutes: 17,
    mode,
    details: `3 min leve + 8 × (30 s forte a ~90% da FCmáx ≈ ${Math.round(hr * 0.9)} bpm / 60 s bem leve) + 2 min de volta à calma. Forte = difícil manter conversa.`,
  };
}

function hiit4x4(q: Questionnaire, mode: CardioMode): CardioPrescription {
  const hr = hrMax(q.age);
  return {
    id: uid(),
    kind: 'hiit',
    title: 'HIIT 4×4 (protocolo norueguês) — 35 min',
    minutes: 35,
    mode,
    details: `10 min de aquecimento + 4 × (4 min a 85–95% da FCmáx ≈ ${Math.round(hr * 0.85)}–${Math.round(hr * 0.95)} bpm, com 3 min de recuperação ativa a ~70%) + 3 min de volta à calma. Um dos protocolos que mais melhora o VO₂máx (Helgerud 2007).`,
  };
}

/* ───────────── Programa ───────────── */

export function finisherBase(q: Questionnaire): number {
  let f = 0;
  if (q.goal === 'emagrecimento' || q.goal === 'condicionamento') f = q.sessionMinutes >= 70 ? 15 : 10;
  else if (q.goal === 'recomposicao') f = 10;
  else if (q.sessionMinutes >= 70) f = 10;
  if (q.sessionMinutes - f < 40) f = Math.max(0, q.sessionMinutes - 40);
  return f < 8 ? 0 : f;
}

/**
 * Gera o programa completo. `variant` > 0 faz um rodízio dos exercícios escolhidos
 * (útil para variar a cada novo bloco mantendo a mesma estrutura).
 */
export function generateProgram(q: Questionnaire, variant = 0): Program {
  const days = Math.min(6, Math.max(2, Math.round(q.daysPerWeek)));
  const split = SPLITS[days];
  const used = new Set<string>();
  const targets = volumeTargets(q);
  const finisher = finisherBase(q);
  const budget = q.sessionMinutes - finisher;

  // 1) Montagem inicial
  const sessions: Session[] = split.templates.map((t, ti) => {
    const slots: (Slot & { priority?: boolean })[] = [...t.slots];

    // Músculos prioritários: garante um exercício direto em cada sessão compatível
    for (const mu of q.priorityMuscles) {
      if (!FOCUS_MUSCLES[t.focus].includes(mu)) continue;
      const already = slots.some((sl) => {
        const ex = pick(sl.pattern, sl.role, q, new Set());
        return ex && ex.muscles[mu] === 1;
      });
      if (already) continue;
      const pattern = PRIORITY_PATTERN[mu].find((p) => !slots.some((sl) => sl.pattern === p)) ?? PRIORITY_PATTERN[mu][0];
      const lastNonAcc = slots.reduce((idx, sl, i) => (sl.role !== 'accessory' ? i : idx), -1);
      slots.splice(lastNonAcc + 1, 0, { pattern, role: 'accessory', priority: true });
    }

    const exercises: Prescription[] = [];
    slots.forEach((sl, i) => {
      const ex = pick(sl.pattern, sl.role, q, used, variant);
      if (!ex) return;
      if (exercises.some((p) => p.exerciseId === ex.id)) return;
      used.add(ex.id);
      const [repMin, repMax] = repRange(ex, sl.role, q);
      const isPriority = sl.priority || q.priorityMuscles.some((mu) => ex.muscles[mu] === 1);
      exercises.push({
        key: `s${ti}-${i}`,
        exerciseId: ex.id,
        pattern: ex.pattern,
        role: sl.role,
        sets: initialSets(sl.role, q),
        repMin,
        repMax,
        restSec: restFor(ex, sl.role, q),
        priority: isPriority || undefined,
      });
    });
    return { id: `ses-${ti}`, name: t.name, focus: t.focus, exercises, estimatedMinutes: 0 };
  });

  const time = (ses: Session) => {
    assignSupersets(ses.exercises, q.supersets);
    return estimateMinutes(ses.exercises);
  };

  // 2) Ajuste ao tempo disponível
  for (const ses of sessions) {
    let guard = 0;
    while (time(ses) > budget + 2 && guard++ < 50) {
      const ex = ses.exercises;
      const lastIdx = (pred: (p: Prescription) => boolean) => {
        for (let i = ex.length - 1; i >= 0; i--) if (pred(ex[i])) return i;
        return -1;
      };
      let i = lastIdx((p) => p.role === 'accessory' && !p.priority && p.sets > 2);
      if (i >= 0) { ex[i].sets--; continue; }
      i = lastIdx((p) => p.role === 'secondary' && p.sets > 2);
      if (i >= 0) { ex[i].sets--; continue; }
      if (ex.length > 4) {
        i = lastIdx((p) => p.role === 'accessory' && !p.priority);
        if (i >= 0) { ex.splice(i, 1); continue; }
      }
      i = lastIdx((p) => p.role === 'accessory' && p.sets > 2);
      if (i >= 0) { ex[i].sets--; continue; }
      i = lastIdx((p) => p.role === 'main' && p.sets > 3);
      if (i >= 0) { ex[i].sets--; continue; }
      if (ex.length > 3) {
        i = lastIdx((p) => p.role === 'accessory');
        if (i >= 0) { ex.splice(i, 1); continue; }
      }
      i = lastIdx((p) => p.role === 'main' && p.sets > 2);
      if (i >= 0) { ex[i].sets--; continue; }
      break;
    }
  }

  // 3) Completa o volume semanal onde estiver abaixo da meta (prioritários primeiro)
  const cap = perSessionCap(q);
  for (let iter = 0; iter < 300; iter++) {
    const vol = weeklyVolume(sessions);
    const deficits = ALL_MUSCLES.filter((mu) => (vol[mu] ?? 0) < targets[mu][0]).sort((x, y) => {
      const px = q.priorityMuscles.includes(x) ? 1 : 0;
      const py = q.priorityMuscles.includes(y) ? 1 : 0;
      if (px !== py) return py - px;
      return (vol[x] ?? 0) - targets[x][0] - ((vol[y] ?? 0) - targets[y][0]);
    });
    let applied = false;
    for (const mu of deficits) {
      let best: { ses: Session; p: Prescription; slack: number } | null = null;
      for (const ses of sessions) {
        const base = time(ses);
        if (sessionMuscle(ses, mu) + 1 > cap) continue;
        for (const p of ses.exercises) {
          const ex = getExercise(p.exerciseId);
          if (ex.muscles[mu] !== 1 || p.sets >= setCap(p.role)) continue;
          const exceeds = (Object.entries(ex.muscles) as [Muscle, number][]).some(
            ([mm, w]) => mm !== mu && (vol[mm] ?? 0) + w > targets[mm][1],
          );
          if (exceeds) continue;
          p.sets++;
          const after = time(ses);
          p.sets--;
          time(ses);
          if (after > budget + 2) continue;
          const slack = budget - after;
          if (!best || slack > best.slack || (slack === best.slack && base < time(best.ses))) best = { ses, p, slack };
        }
      }
      if (best) {
        best.p.sets++;
        applied = true;
        break;
      }
    }
    if (!applied) break;
  }

  // 4) Cardio
  const hr = hrMax(q.age);
  const allowHiit = q.experience !== 'iniciante' && q.goal !== 'hipertrofia';
  let hiitPlaced = false;
  for (const ses of sessions) {
    ses.estimatedMinutes = time(ses);
    if (finisher === 0) continue;
    const isLeg = ses.focus === 'lower' || ses.focus === 'legs';
    const slack = Math.max(0, budget - ses.estimatedMinutes);
    let minutes = finisher;
    if (q.goal !== 'hipertrofia') minutes = Math.min(25, finisher + slack);
    if (q.goal === 'hipertrofia' && isLeg) continue; // cardio longe do treino de pernas
    if (allowHiit && !hiitPlaced && !isLeg && minutes >= 17) {
      ses.finisher = hiitCurto(q, modeOrder(q, 'hiit')[0]);
      hiitPlaced = true;
    } else {
      ses.finisher = zona2(q, Math.round(minutes), modeOrder(q, isLeg ? 'pos_pernas' : 'geral')[0]);
    }
    ses.estimatedMinutes += ses.finisher.minutes;
  }

  const extraCardio: CardioPrescription[] = [];
  const extras = Math.max(0, Math.min(3, q.extraCardioDays));
  for (let i = 0; i < extras; i++) {
    if (i === 0 && allowHiit) extraCardio.push(hiit4x4(q, modeOrder(q, 'hiit')[0]));
    else if (i === 2) extraCardio.push({ ...zona2(q, 45, modeOrder(q, 'geral').includes('caminhada') ? 'caminhada' : modeOrder(q, 'geral')[0]), kind: 'caminhada', title: 'Caminhada longa / Zona 2 — 45 min' });
    else extraCardio.push(zona2(q, q.goal === 'hipertrofia' ? 30 : 40, modeOrder(q, 'geral')[0]));
  }

  // Minutos “equivalentes moderados” (vigoroso conta em dobro — OMS 2020)
  const eq = (c: CardioPrescription) => (c.kind === 'hiit' || c.kind === 'hiit_curto' ? c.minutes * 2 : c.minutes);
  const cardioMinutesWeek =
    sessions.reduce((acc, ses) => acc + (ses.finisher ? eq(ses.finisher) : 0), 0) + extraCardio.reduce((acc, c) => acc + eq(c), 0);

  const weekdays = buildWeekdays(sessions, extraCardio);

  const stepsTarget = q.goal === 'emagrecimento' ? 9000 : q.goal === 'hipertrofia' ? 7000 : 8000;

  const notes = buildNotes(q, cardioMinutesWeek);

  return {
    id: uid(),
    createdAt: new Date().toISOString(),
    genVersion: GEN_VERSION,
    variant,
    splitName: split.name,
    splitWhy: split.why,
    sessions,
    extraCardio,
    weeklyVolume: weeklyVolume(sessions),
    volumeTarget: targets,
    weekdays,
    stepsTarget,
    cardioMinutesWeek,
    hrMax: hr,
    notes,
  };
}

/* ───────────── Agenda semanal ───────────── */

const LIFT_DAYS: Record<number, number[]> = { 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5] };

/**
 * Distribui os dias de cardio extra nos dias de descanso da musculação, de preferência
 * entre dois dias de treino e nunca dois cardios seguidos (domingo fica para descanso).
 * O HIIT vai para um dia que não antecede treino de pernas, quando possível.
 */
export function buildWeekdays(sessions: Session[], extraCardio: CardioPrescription[]): string[][] {
  const lifts = LIFT_DAYS[sessions.length] ?? LIFT_DAYS[3];
  const isLift = (d: number) => lifts.includes(d);
  const legsOn = (d: number) => {
    const i = lifts.indexOf(d);
    if (i < 0) return false;
    const f = sessions[i].focus;
    return f === 'lower' || f === 'legs' || f === 'full';
  };
  const weekdays: string[][] = Array.from({ length: 7 }, () => []);
  lifts.forEach((d, i) => weekdays[d].push(`Treino ${sessions[i].name}`));

  const free = [0, 1, 2, 3, 4, 5, 6].filter((d) => !isLift(d));
  const chosen: number[] = [];
  for (let k = 0; k < extraCardio.length && chosen.length < free.length; k++) {
    let best = -1;
    let bestScore = -Infinity;
    for (const d of free) {
      if (chosen.includes(d)) continue;
      const dist = chosen.length ? Math.min(...chosen.map((c) => Math.min(Math.abs(c - d), 7 - Math.abs(c - d)))) : 7;
      const score = Math.min(dist, 2) * 10 + (isLift((d + 6) % 7) && isLift((d + 1) % 7) ? 5 : 0) - (d === 6 ? 4 : 0) - d * 0.1;
      if (score > bestScore) {
        bestScore = score;
        best = d;
      }
    }
    chosen.push(best);
  }
  chosen.sort((x, y) => x - y);

  const remaining = [...extraCardio];
  const hiitIdx = remaining.findIndex((c) => c.kind === 'hiit');
  const assign: [number, CardioPrescription][] = [];
  if (hiitIdx >= 0 && chosen.length) {
    const day = chosen.find((d) => !legsOn((d + 1) % 7)) ?? chosen[0];
    assign.push([day, remaining.splice(hiitIdx, 1)[0]]);
    chosen.splice(chosen.indexOf(day), 1);
  }
  chosen.forEach((d, i) => remaining[i] && assign.push([d, remaining[i]]));
  for (const [d, c] of assign) weekdays[d].push(c.title);

  weekdays.forEach((w) => {
    if (w.length === 0) w.push('Descanso ativo (passos/caminhada leve)');
  });
  return weekdays;
}

/** Versão do gerador: programas antigos são atualizados (bi-sets/agenda) sem perder o bloco. */
export const GEN_VERSION = 2;

export function refreshProgram(q: Questionnaire, p: Program): Program {
  if ((p.genVersion ?? 1) >= GEN_VERSION) return p;
  return reassignSupersets(q, p);
}

/** Recalcula bi-sets, tempos e agenda mantendo exercícios, séries e o id do programa (o bloco continua). */
export function reassignSupersets(q: Questionnaire, p: Program): Program {
  const sessions = p.sessions.map((s) => {
    const exercises = s.exercises.map((e) => ({ ...e }));
    assignSupersets(exercises, q.supersets);
    return { ...s, exercises, estimatedMinutes: estimateMinutes(exercises) + (s.finisher?.minutes ?? 0) };
  });
  return { ...p, sessions, weekdays: buildWeekdays(sessions, p.extraCardio), genVersion: GEN_VERSION };
}

function buildNotes(q: Questionnaire, cardioMin: number): string[] {
  const n: string[] = [];
  if (q.experience === 'iniciante')
    n.push('Nas 2 primeiras semanas, priorize aprender a técnica com cargas moderadas (3 repetições na reserva). Iniciantes ganham muito com pouco volume — consistência é o principal.');
  if (q.limitations.length)
    n.push(`Exercícios que costumam irritar ${q.limitations.join(', ')} foram evitados. Dor articular aguda (não confundir com a “queimação” muscular) = pare o exercício e use a troca de exercício. Persistindo, procure um fisioterapeuta/médico.`);
  if (q.priorityMuscles.length)
    n.push('Os músculos prioritários recebem um exercício direto em cada sessão compatível e um volume semanal maior (+4 séries na meta).');
  if (q.sleepHours < 7)
    n.push('Você relatou dormir menos de 7 h. Privação de sono reduz a síntese de proteína muscular e aumenta a fome: tentar chegar a 7–9 h é um dos “suplementos” mais potentes.');
  if (cardioMin < 150)
    n.push(`O plano tem ~${cardioMin} min/semana de cardio “equivalente moderado”. A OMS recomenda 150–300 min: complete com caminhadas e passos diários (meta de passos no plano).`);
  if (q.goal === 'emagrecimento' || q.goal === 'recomposicao')
    n.push('Para perder gordura mantendo músculo: musculação pesada (não troque por séries leves “para definir”), proteína alta e déficit calórico moderado. O cardio ajuda, mas a dieta é o fator principal.');
  if (q.supersets)
    n.push('Bi-sets (mesma letra): faça uma série do 1º, ~15 s de transição, uma série do 2º e só então descanse. Economiza ~30% do tempo sem perder resultado, pois os músculos não competem. O app só junta exercícios da mesma área e nunca duas máquinas, para você não “segurar” dois aparelhos.');
  return n;
}
