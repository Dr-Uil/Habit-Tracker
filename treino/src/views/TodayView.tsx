import { useState } from 'react';
import { getExercise } from '../data/exercises';
import { PRINCIPLES, timingTips } from '../data/science';
import { CARDIO_MODE_LABEL } from '../logic/generator';
import { blockInfo, nextSessionIndex } from '../logic/progression';
import { buildActiveWorkout, cardioInWeek, doneSets, workoutsInWeek, workoutVolume, weekStreak } from '../logic/stats';
import { fmtDate, localDate, uid } from '../logic/util';
import { useProfile } from '../store';
import type { CardioLog, CardioMode } from '../types';
import { Badge, Button, Card, Chip, NumberField, Ring, SectionTitle, Sheet } from '../components/ui';

export function TodayView() {
  const { profile, update } = useProfile();
  const q = profile.questionnaire;
  const info = blockInfo(profile);
  const nextIdx = nextSessionIndex(profile);
  const [chosen, setChosen] = useState<number | null>(null);
  const [pickOpen, setPickOpen] = useState(false);
  const [cardioOpen, setCardioOpen] = useState(false);
  const [weightOpen, setWeightOpen] = useState(false);
  const idx = chosen ?? nextIdx;
  const ses = profile.program.sessions[idx];
  const weekCount = workoutsInWeek(profile).length;
  const cardioWeek = cardioInWeek(profile);
  const streak = weekStreak(profile);

  const start = () => update((p) => ({ ...p, activeWorkout: buildActiveWorkout(p, idx) }));

  // dica do dia: alterna entre princípios e dicas de horário
  const tips = [...timingTips(q).map((t) => ({ title: t.title, icon: t.icon, body: t.text })), ...PRINCIPLES];
  const dayNum = Math.floor(Date.now() / 86400000);
  const tip = tips[dayNum % tips.length];
  const recent = [...profile.workouts].reverse().slice(0, 4);
  const todayStr = localDate();
  const todayWeight = profile.bodyLogs.find((b) => b.date === todayStr);

  return (
    <div className="space-y-4">
      <Card className="flex items-center gap-4">
        <Ring value={weekCount / q.daysPerWeek} size={72}>
          <span>
            {weekCount}/{q.daysPerWeek}
          </span>
        </Ring>
        <div className="min-w-0 flex-1">
          <div className="text-sm text-slate-400">Treinos nesta semana</div>
          <div className="mt-0.5 font-semibold">
            Bloco {info.block} · Semana {info.week} de 6
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {info.deload ? <Badge tone="info">Semana de deload</Badge> : <Badge tone="accent">Meta: RIR {info.targetRir}</Badge>}
            {streak > 0 && <Badge tone="ok">🔥 {streak} sem. seguidas</Badge>}
            {cardioWeek.length > 0 && <Badge>❤️ {cardioWeek.reduce((a, c) => a + c.minutes, 0)} min cardio extra</Badge>}
          </div>
        </div>
      </Card>

      {info.deload && (
        <Card className="border-sky-500/30 bg-sky-500/5 text-sm text-sky-100">
          🔋 <b>Semana de deload.</b> Metade das séries, mesmas cargas, longe da falha. Parece “fácil demais” — e é para ser. Na próxima semana começa um novo bloco.
        </Card>
      )}

      <div>
        <SectionTitle
          right={
            <button className="text-xs text-accent" onClick={() => setPickOpen(true)}>
              escolher outro
            </button>
          }
        >
          {chosen == null ? 'Próximo treino' : 'Treino escolhido'}
        </SectionTitle>
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-bold">{ses.name}</div>
              <div className="text-sm text-slate-400">
                ~{ses.estimatedMinutes} min · {ses.exercises.length} exercícios
              </div>
            </div>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm">
            {ses.exercises.map((e) => (
              <li key={e.key} className="flex justify-between gap-3">
                <span className="truncate text-slate-300">
                  {e.superset && <span className="mr-1 text-xs text-accent">{e.superset}</span>}
                  {getExercise(e.exerciseId).name}
                </span>
                <span className="shrink-0 tabular-nums text-slate-500">
                  {info.deload ? Math.ceil(e.sets / 2) : e.sets}×{e.repMin}–{e.repMax}
                </span>
              </li>
            ))}
            {ses.finisher && (
              <li className="flex justify-between gap-3 border-t border-slate-800 pt-1.5">
                <span className="text-slate-300">❤️ {ses.finisher.title}</span>
                <span className="text-slate-500">{CARDIO_MODE_LABEL[ses.finisher.mode].split(' ')[0]}</span>
              </li>
            )}
          </ul>
          <Button full className="mt-4 py-4 text-base" onClick={start}>
            ▶ Começar treino
          </Button>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={() => setCardioOpen(true)}>
          ❤️ Registrar cardio
        </Button>
        <Button variant="secondary" onClick={() => setWeightOpen(true)}>
          ⚖️ {todayWeight ? `${String(todayWeight.weightKg).replace('.', ',')} kg hoje` : 'Peso de hoje'}
        </Button>
      </div>

      <div>
        <SectionTitle>Dica do dia</SectionTitle>
        <Card>
          <div className="font-semibold">
            {tip.icon} {tip.title}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">{tip.body}</p>
        </Card>
      </div>

      {recent.length > 0 && (
        <div>
          <SectionTitle>Últimos treinos</SectionTitle>
          <div className="space-y-2">
            {recent.map((w) => (
              <Card key={w.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">{w.sessionName}</div>
                  <div className="text-xs text-slate-500">
                    {fmtDate(w.finishedAt)} · {doneSets(w)} séries{w.deload ? ' · deload' : ''}
                  </div>
                </div>
                <div className="text-right text-sm tabular-nums text-slate-300">{workoutVolume(w).toLocaleString('pt-BR')} kg</div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Sheet open={pickOpen} onClose={() => setPickOpen(false)} title="Qual treino hoje?">
        <p className="mb-3 text-sm text-slate-400">A ordem sugerida é a melhor para recuperação, mas você pode trocar se precisar.</p>
        <div className="space-y-2">
          {profile.program.sessions.map((s, i) => (
            <Chip
              key={s.id}
              active={i === idx}
              className="flex w-full justify-between"
              onClick={() => {
                setChosen(i === nextIdx ? null : i);
                setPickOpen(false);
              }}
            >
              <span>{s.name}</span>
              <span className="text-xs text-slate-500">{i === nextIdx ? 'sugerido' : `~${s.estimatedMinutes} min`}</span>
            </Chip>
          ))}
        </div>
      </Sheet>

      {cardioOpen && <CardioSheet open onClose={() => setCardioOpen(false)} />}
      {weightOpen && <WeightSheet open onClose={() => setWeightOpen(false)} />}
    </div>
  );
}

function CardioSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, update } = useProfile();
  const plan = profile.program.extraCardio;
  const [kind, setKind] = useState<CardioLog['kind']>(plan[0]?.kind ?? 'zona2');
  const [minutes, setMinutes] = useState<number | undefined>(plan[0]?.minutes ?? 30);
  const [mode, setMode] = useState<CardioMode>(plan[0]?.mode ?? 'esteira');
  const save = () => {
    if (!minutes) return;
    update((p) => ({ ...p, cardioLogs: [...p.cardioLogs, { id: uid(), date: localDate(), kind, minutes, mode }] }));
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title="Registrar cardio">
      {plan.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="text-xs uppercase tracking-wide text-slate-500">Do seu plano</div>
          {plan.map((c) => (
            <Card
              key={c.id}
              className="py-3"
              onClick={() => {
                setKind(c.kind);
                setMinutes(c.minutes);
                setMode(c.mode);
              }}
            >
              <div className="font-medium">{c.title}</div>
              <div className="mt-1 text-xs text-slate-400">{c.details}</div>
            </Card>
          ))}
        </div>
      )}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['zona2', 'Zona 2'],
              ['hiit', 'HIIT'],
              ['caminhada', 'Caminhada'],
              ['outro', 'Outro'],
            ] as [CardioLog['kind'], string][]
          ).map(([k, t]) => (
            <Chip key={k} active={kind === k || (k === 'hiit' && kind === 'hiit_curto')} onClick={() => setKind(k)}>
              {t}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(CARDIO_MODE_LABEL) as CardioMode[]).map((md) => (
            <Chip key={md} active={mode === md} onClick={() => setMode(md)}>
              {CARDIO_MODE_LABEL[md]}
            </Chip>
          ))}
        </div>
        <NumberField label="Duração" value={minutes} onChange={setMinutes} suffix="min" />
        <Button full onClick={save} disabled={!minutes}>
          Salvar
        </Button>
      </div>
    </Sheet>
  );
}

export function WeightSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, update } = useProfile();
  const today = localDate();
  const existing = profile.bodyLogs.find((b) => b.date === today);
  const last = [...profile.bodyLogs].sort((a, b) => a.date.localeCompare(b.date)).pop();
  const [w, setW] = useState<number | undefined>(existing?.weightKg ?? last?.weightKg ?? profile.questionnaire.weightKg);
  const [waist, setWaist] = useState<number | undefined>(existing?.waistCm);
  const save = () => {
    if (!w) return;
    update((p) => ({
      ...p,
      bodyLogs: [...p.bodyLogs.filter((b) => b.date !== today), { date: today, weightKg: w, waistCm: waist }].sort((a, b) => a.date.localeCompare(b.date)),
    }));
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title="Peso e medidas de hoje">
      <p className="mb-3 text-sm text-slate-400">Melhor horário: ao acordar, após ir ao banheiro, antes de comer. O que importa é a média/tendência, não um dia isolado.</p>
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Peso" value={w} onChange={setW} suffix="kg" />
        <NumberField label="Cintura (opcional)" value={waist} onChange={setWaist} suffix="cm" />
      </div>
      <Button full className="mt-4" onClick={save} disabled={!w}>
        Salvar
      </Button>
    </Sheet>
  );
}
