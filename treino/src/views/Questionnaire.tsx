import { useState } from 'react';
import type { ActivityLevel, CardioMode, EquipmentAccess, Experience, Goal, Limitation, Muscle, Questionnaire as Q, Sex, TimeOfDay } from '../types';
import { Button, Chip, NumberField, OptionCard, Stepper, cx } from '../components/ui';
import { MUSCLE_LABEL, ALL_MUSCLES } from '../data/exercises';
import { CARDIO_MODE_LABEL } from '../logic/generator';

export const PROFILE_COLORS = ['#a3e635', '#f472b6', '#38bdf8', '#fbbf24', '#a78bfa', '#34d399', '#fb7185'];

const DEFAULT_Q: Q = {
  name: '',
  sex: 'M',
  age: 35,
  weightKg: 75,
  heightCm: 170,
  experience: 'iniciante',
  goal: 'recomposicao',
  daysPerWeek: 3,
  sessionMinutes: 60,
  extraCardioDays: 1,
  equipment: 'academia',
  limitations: [],
  priorityMuscles: [],
  cardioModes: ['esteira', 'bike'],
  preferredTime: 'tarde',
  activityLevel: 'leve',
  sleepHours: 7,
  supersets: true,
};

const STEPS = ['Perfil', 'Corpo', 'Experiência', 'Objetivo', 'Agenda', 'Equipamento', 'Corpo & foco', 'Hábitos'];

export function Questionnaire({
  initial,
  initialColor,
  onDone,
  onCancel,
}: {
  initial?: Q;
  initialColor?: string;
  onDone: (q: Q, color: string) => void;
  onCancel?: () => void;
}) {
  const [q, setQ] = useState<Q>(initial ?? DEFAULT_Q);
  const [color, setColor] = useState(initialColor ?? PROFILE_COLORS[0]);
  const [step, setStep] = useState(0);
  const set = <K extends keyof Q>(k: K, v: Q[K]) => setQ((prev) => ({ ...prev, [k]: v }));
  const toggle = <T,>(arr: T[], v: T, max = 99) => (arr.includes(v) ? arr.filter((x) => x !== v) : arr.length >= max ? arr : [...arr, v]);

  const valid = [
    q.name.trim().length > 0,
    q.age >= 14 && q.age <= 90 && q.weightKg >= 30 && q.weightKg <= 250 && q.heightCm >= 120 && q.heightCm <= 230,
    true,
    true,
    true,
    true,
    true,
    true,
  ];
  const last = step === STEPS.length - 1;

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-6 pt-4" style={{ ['--accent' as string]: color }}>
      <div className="mb-4 flex items-center gap-3">
        {onCancel && (
          <button onClick={onCancel} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800">
            ✕
          </button>
        )}
        <div className="flex flex-1 gap-1">
          {STEPS.map((_, i) => (
            <div key={i} className={cx('h-1.5 flex-1 rounded-full', i <= step ? 'bg-accent' : 'bg-slate-800')} />
          ))}
        </div>
        <span className="text-xs text-slate-500">
          {step + 1}/{STEPS.length}
        </span>
      </div>

      <div className="flex-1 space-y-4">
        {step === 0 && (
          <>
            <h1 className="text-2xl font-bold">Vamos montar seu treino 💪</h1>
            <p className="text-slate-400">São 8 perguntas rápidas. Com elas o app monta séries, repetições, descanso, cardio e metas de nutrição com base nos estudos mais sólidos da área.</p>
            <label className="block">
              <span className="mb-1 block text-sm text-slate-400">Nome do perfil</span>
              <input
                autoFocus
                value={q.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Seu nome"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-lg outline-none focus:border-accent"
              />
            </label>
            <div>
              <span className="mb-2 block text-sm text-slate-400">Cor do perfil</span>
              <div className="flex flex-wrap gap-3">
                {PROFILE_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cx('h-10 w-10 rounded-full ring-offset-2 ring-offset-slate-950 transition', color === c && 'ring-2 ring-white')}
                    style={{ background: c }}
                    aria-label={`Cor ${c}`}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="text-2xl font-bold">Sobre seu corpo</h1>
            <p className="text-sm text-slate-400">Usado para calcular calorias, proteína e zonas de frequência cardíaca.</p>
            <div className="grid grid-cols-2 gap-2">
              {(['M', 'F'] as Sex[]).map((s) => (
                <Chip key={s} active={q.sex === s} onClick={() => set('sex', s)} className="py-3 text-center">
                  {s === 'M' ? '♂ Masculino' : '♀ Feminino'}
                </Chip>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <NumberField label="Idade" value={q.age} onChange={(v) => set('age', v ?? 0)} suffix="anos" />
              <NumberField label="Peso" value={q.weightKg} onChange={(v) => set('weightKg', v ?? 0)} suffix="kg" />
              <NumberField label="Altura" value={q.heightCm} onChange={(v) => set('heightCm', v ?? 0)} suffix="cm" />
            </div>
            <NumberField
              label="% de gordura (opcional — se tiver bioimpedância/dobras)"
              value={q.bodyFatPct}
              onChange={(v) => set('bodyFatPct', v)}
              suffix="%"
              placeholder="deixe em branco se não souber"
            />
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-2xl font-bold">Experiência com musculação</h1>
            {(
              [
                ['iniciante', '🌱', 'Iniciante', 'Menos de 6 meses de treino regular, ou voltando após uma pausa longa.'],
                ['intermediario', '🌿', 'Intermediário', '6 meses a 2–3 anos treinando com regularidade; conhece os exercícios básicos.'],
                ['avancado', '🌳', 'Avançado', 'Mais de 3 anos de treino consistente; progresso já é lento.'],
              ] as [Experience, string, string, string][]
            ).map(([v, icon, t, d]) => (
              <OptionCard key={v} active={q.experience === v} onClick={() => set('experience', v)} icon={icon} title={t} desc={d} />
            ))}
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-2xl font-bold">Objetivo principal</h1>
            {(
              [
                ['hipertrofia', '💪', 'Ganhar massa muscular', 'Prioridade em hipertrofia, com leve superávit calórico.'],
                ['recomposicao', '⚖️', 'Ganhar músculo e perder gordura', 'Recomposição corporal: déficit leve + treino pesado + proteína alta.'],
                ['emagrecimento', '🔥', 'Perder peso (gordura)', 'Déficit moderado, mais cardio, mantendo a musculação para preservar músculo.'],
                ['condicionamento', '❤️', 'Saúde e condicionamento', 'Equilíbrio entre força, fôlego e saúde cardiovascular.'],
              ] as [Goal, string, string, string][]
            ).map(([v, icon, t, d]) => (
              <OptionCard key={v} active={q.goal === v} onClick={() => set('goal', v)} icon={icon} title={t} desc={d} />
            ))}
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="text-2xl font-bold">Sua agenda</h1>
            <div className="space-y-5">
              <div>
                <div className="mb-2 text-sm text-slate-400">Dias de musculação por semana</div>
                <Stepper value={q.daysPerWeek} onChange={(v) => set('daysPerWeek', v)} min={2} max={6} suffix="dias" />
              </div>
              <div>
                <div className="mb-2 text-sm text-slate-400">Tempo por sessão (incluindo aquecimento e cardio do dia)</div>
                <Stepper value={q.sessionMinutes} onChange={(v) => set('sessionMinutes', v)} min={30} max={100} step={5} suffix="min" />
              </div>
              <div>
                <div className="mb-2 text-sm text-slate-400">Dias extras que conseguem fazer só cardio (opcional)</div>
                <Stepper value={q.extraCardioDays} onChange={(v) => set('extraCardioDays', v)} min={0} max={3} suffix="dias" />
                <p className="mt-2 text-xs text-slate-500">Sessões de 30–45 min: caminhada, bike, HIIT. Se não der, tudo bem — o plano funciona sem elas.</p>
              </div>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h1 className="text-2xl font-bold">Onde vocês treinam?</h1>
            {(
              [
                ['academia', '🏢', 'Academia completa', 'Máquinas, cabos, barras e halteres.'],
                ['halteres', '🏠', 'Casa com halteres', 'Halteres ajustáveis, banco e elásticos.'],
                ['casa', '🤸', 'Casa sem equipamento', 'Peso corporal e elásticos.'],
              ] as [EquipmentAccess, string, string, string][]
            ).map(([v, icon, t, d]) => (
              <OptionCard key={v} active={q.equipment === v} onClick={() => set('equipment', v)} icon={icon} title={t} desc={d} />
            ))}
            <OptionCard
              active={q.supersets}
              onClick={() => set('supersets', !q.supersets)}
              icon={q.supersets ? '✅' : '⬜'}
              title="Usar bi-sets para economizar tempo"
              desc="Alterna 2 exercícios de músculos diferentes (ex.: bíceps + tríceps). Mesmo resultado, ~30% menos tempo."
            />
          </>
        )}

        {step === 6 && (
          <>
            <h1 className="text-2xl font-bold">Limitações e prioridades</h1>
            <div>
              <div className="mb-2 text-sm text-slate-400">Alguma articulação que costuma doer? (evitaremos exercícios que a sobrecarregam)</div>
              <div className="flex flex-wrap gap-2">
                {(['joelho', 'ombro', 'lombar', 'cotovelo', 'punho'] as Limitation[]).map((l) => (
                  <Chip key={l} active={q.limitations.includes(l)} onClick={() => set('limitations', toggle(q.limitations, l))}>
                    {l[0].toUpperCase() + l.slice(1)}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-sm text-slate-400">Músculos que quer priorizar (até 3) — recebem mais volume</div>
              <div className="flex flex-wrap gap-2">
                {ALL_MUSCLES.map((mu: Muscle) => (
                  <Chip key={mu} active={q.priorityMuscles.includes(mu)} onClick={() => set('priorityMuscles', toggle(q.priorityMuscles, mu, 3))}>
                    {MUSCLE_LABEL[mu]}
                  </Chip>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 7 && (
          <>
            <h1 className="text-2xl font-bold">Hábitos e preferências</h1>
            <div>
              <div className="mb-2 text-sm text-slate-400">Cardio que você gosta/tem acesso</div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(CARDIO_MODE_LABEL) as CardioMode[]).map((md) => (
                  <Chip key={md} active={q.cardioModes.includes(md)} onClick={() => set('cardioModes', toggle(q.cardioModes, md))}>
                    {CARDIO_MODE_LABEL[md]}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-sm text-slate-400">Horário em que costuma treinar</div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ['manha', '🌅 Manhã'],
                    ['tarde', '☀️ Tarde'],
                    ['noite', '🌙 Noite'],
                    ['variavel', '🔄 Varia'],
                  ] as [TimeOfDay, string][]
                ).map(([v, t]) => (
                  <Chip key={v} active={q.preferredTime === v} onClick={() => set('preferredTime', v)} className="text-center">
                    {t}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-sm text-slate-400">Fora da academia, seu dia a dia é…</div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ['sedentario', 'Sentado a maior parte', '< 5 mil passos'],
                    ['leve', 'Pouco ativo', '5–7 mil passos'],
                    ['moderado', 'Ativo', '7–10 mil passos'],
                    ['alto', 'Muito ativo/trabalho físico', '> 10 mil passos'],
                  ] as [ActivityLevel, string, string][]
                ).map(([v, t, d]) => (
                  <Chip key={v} active={q.activityLevel === v} onClick={() => set('activityLevel', v)}>
                    <span className="block">{t}</span>
                    <span className="block text-xs text-slate-500">{d}</span>
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-sm text-slate-400">Horas de sono por noite (média)</div>
              <Stepper value={q.sleepHours} onChange={(v) => set('sleepHours', v)} min={4} max={10} step={0.5} suffix="h" />
            </div>
          </>
        )}
      </div>

      <div className="mt-6 flex gap-2">
        {step > 0 && (
          <Button variant="secondary" onClick={() => setStep(step - 1)}>
            Voltar
          </Button>
        )}
        <Button full disabled={!valid[step]} onClick={() => (last ? onDone({ ...q, name: q.name.trim() }, color) : setStep(step + 1))}>
          {last ? (initial ? 'Salvar e gerar novo plano' : 'Gerar meu plano ✨') : 'Continuar'}
        </Button>
      </div>
    </div>
  );
}
