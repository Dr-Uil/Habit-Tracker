import { useMemo, useState } from 'react';
import { getExercise } from '../data/exercises';
import { bestE1rm } from '../logic/progression';
import { doneSets, weeklySetsHistory, workoutVolume, weekStreak } from '../logic/stats';
import { fmtDate, fmtKg } from '../logic/util';
import { weightTrend } from '../logic/nutrition';
import { useProfile } from '../store';
import { Button, Card, SectionTitle, Sheet, Stat, cx } from '../components/ui';
import { LineChart } from '../components/LineChart';
import { WeightSheet } from './TodayView';

export function ProgressView() {
  const { profile, update } = useProfile();
  const [weightOpen, setWeightOpen] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const ws = profile.workouts;

  const exercisesDone = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of ws) for (const e of w.exercises) if (e.sets.some((s) => s.done)) map.set(e.exerciseId, (map.get(e.exerciseId) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  }, [ws]);
  const [exId, setExId] = useState<string | null>(null);
  const selected = exId ?? exercisesDone[0] ?? null;

  const exPoints = useMemo(() => {
    if (!selected) return [];
    return ws
      .map((w) => {
        const e = w.exercises.find((x) => x.exerciseId === selected);
        if (!e) return null;
        const v = bestE1rm(e.sets);
        return v > 0 ? { x: new Date(w.finishedAt).getTime(), y: Math.round(v * 10) / 10 } : null;
      })
      .filter((p): p is { x: number; y: number } => !!p);
  }, [ws, selected]);

  const exRows = useMemo(() => {
    if (!selected) return [];
    return ws
      .flatMap((w) => w.exercises.filter((e) => e.exerciseId === selected).map((e) => ({ date: w.finishedAt, sets: e.sets.filter((s) => s.done) })))
      .filter((r) => r.sets.length)
      .reverse()
      .slice(0, 8);
  }, [ws, selected]);

  const bodyPoints = [...profile.bodyLogs].sort((a, b) => a.date.localeCompare(b.date)).map((b) => ({ x: new Date(b.date + 'T12:00:00').getTime(), y: b.weightKg }));
  const waistPoints = profile.bodyLogs.filter((b) => b.waistCm).map((b) => ({ x: new Date(b.date + 'T12:00:00').getTime(), y: b.waistCm! }));
  const trend = weightTrend(profile.bodyLogs);
  const weekly = weeklySetsHistory(profile, 8);
  const maxSets = Math.max(1, ...weekly.map((w) => w.sets));
  const now = new Date();
  const thisMonth = ws.filter((w) => {
    const d = new Date(w.finishedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const totalVolume = ws.reduce((a, w) => a + workoutVolume(w), 0);
  const detailW = ws.find((w) => w.id === detail);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Treinos no total" value={ws.length} />
        <Stat label="Neste mês" value={thisMonth} />
        <Stat label="Semanas seguidas na meta" value={`🔥 ${weekStreak(profile)}`} />
        <Stat label="Carga total movida" value={totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1).replace('.', ',')} t` : `${totalVolume} kg`} />
      </div>

      <div>
        <SectionTitle
          right={
            <button className="text-xs text-accent" onClick={() => setWeightOpen(true)}>
              + registrar
            </button>
          }
        >
          Peso corporal
        </SectionTitle>
        <Card>
          <LineChart points={bodyPoints} unit="kg" />
          {trend && (
            <div className="mt-2 text-xs text-slate-400">
              Tendência (últimas 4 semanas): {trend.weeklyKg > 0 ? '+' : ''}
              {trend.weeklyKg.toFixed(2).replace('.', ',')} kg/semana
            </div>
          )}
          {waistPoints.length > 1 && (
            <div className="mt-4 border-t border-slate-800 pt-3">
              <div className="mb-1 text-xs uppercase tracking-wide text-slate-500">Cintura</div>
              <LineChart points={waistPoints} unit="cm" height={120} />
            </div>
          )}
        </Card>
      </div>

      <div>
        <SectionTitle>Progressão de carga</SectionTitle>
        {exercisesDone.length === 0 ? (
          <Card className="text-sm text-slate-400">Conclua seu primeiro treino para ver a evolução de cada exercício aqui.</Card>
        ) : (
          <Card>
            <select
              value={selected ?? ''}
              onChange={(e) => setExId(e.target.value)}
              className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-accent"
            >
              {exercisesDone.map((id) => (
                <option key={id} value={id}>
                  {getExercise(id).name}
                </option>
              ))}
            </select>
            <div className="mb-1 text-xs text-slate-500">1RM estimado (fórmula de Epley) — sobe quando você ganha carga ou repetições</div>
            <LineChart points={exPoints} unit="kg" />
            <div className="mt-3 space-y-1.5">
              {exRows.map((r, i) => (
                <div key={i} className="flex justify-between gap-3 text-xs">
                  <span className="shrink-0 text-slate-500">{fmtDate(r.date)}</span>
                  <span className="text-right tabular-nums text-slate-300">{r.sets.map((s) => `${fmtKg(s.weight ?? 0)}×${s.reps}`).join('  ')}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <div>
        <SectionTitle>Séries por semana</SectionTitle>
        <Card>
          <div className="flex h-32 items-end gap-2">
            {weekly.map((w, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] tabular-nums text-slate-400">{w.sets || ''}</span>
                <div className={cx('w-full rounded-t-md', i === weekly.length - 1 ? 'bg-accent' : 'bg-accent/40')} style={{ height: `${(w.sets / maxSets) * 96}px`, minHeight: w.sets ? 4 : 0 }} />
                <span className="text-[10px] text-slate-500">{w.week.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <SectionTitle>Histórico</SectionTitle>
        {ws.length === 0 ? (
          <Card className="text-sm text-slate-400">Nenhum treino ainda.</Card>
        ) : (
          <div className="space-y-2">
            {[...ws]
              .reverse()
              .slice(0, 30)
              .map((w) => (
                <Card key={w.id} className="flex items-center justify-between py-3" onClick={() => setDetail(w.id)}>
                  <div>
                    <div className="font-medium">{w.sessionName}</div>
                    <div className="text-xs text-slate-500">
                      {fmtDate(w.finishedAt)} · {doneSets(w)} séries · sem. {w.blockWeek}
                      {w.rpe ? ` · esforço ${w.rpe}` : ''}
                    </div>
                  </div>
                  <span className="text-sm tabular-nums text-slate-300">{workoutVolume(w).toLocaleString('pt-BR')} kg</span>
                </Card>
              ))}
          </div>
        )}
        {profile.cardioLogs.length > 0 && (
          <Card className="mt-3">
            <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">Cardio registrado</div>
            {[...profile.cardioLogs]
              .reverse()
              .slice(0, 10)
              .map((c) => (
                <div key={c.id} className="flex justify-between py-1 text-sm">
                  <span className="text-slate-300">
                    {fmtDate(c.date)} · {{ zona2: 'Zona 2', hiit: 'HIIT', hiit_curto: 'HIIT', caminhada: 'Caminhada', outro: 'Cardio' }[c.kind]}
                  </span>
                  <span className="text-slate-400">{c.minutes} min</span>
                </div>
              ))}
          </Card>
        )}
      </div>

      {weightOpen && <WeightSheet open onClose={() => setWeightOpen(false)} />}

      <Sheet open={!!detailW} onClose={() => setDetail(null)} title={detailW ? `${detailW.sessionName} · ${fmtDate(detailW.finishedAt)}` : ''}>
        {detailW && (
          <div className="space-y-3 text-sm">
            {detailW.exercises.map((e) => (
              <div key={e.key}>
                <div className="font-medium">{getExercise(e.exerciseId).name}</div>
                <div className="text-xs tabular-nums text-slate-400">
                  {e.sets
                    .filter((s) => s.done)
                    .map((s) => `${fmtKg(s.weight ?? 0)}kg×${s.reps}${s.rir != null ? ` @RIR${s.rir}` : ''}`)
                    .join(' · ') || '—'}
                </div>
              </div>
            ))}
            {detailW.notes && <p className="rounded-xl bg-slate-950 p-3 text-slate-300">📝 {detailW.notes}</p>}
            <Button
              variant="danger"
              full
              onClick={() => {
                if (confirm('Excluir este treino do histórico?')) {
                  update((p) => ({ ...p, workouts: p.workouts.filter((w) => w.id !== detailW.id) }));
                  setDetail(null);
                }
              }}
            >
              Excluir treino
            </Button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
