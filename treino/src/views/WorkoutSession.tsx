import { useEffect, useMemo, useState } from 'react';
import { getExercise, MUSCLE_LABEL, PATTERN_LABEL } from '../data/exercises';
import { RIR_SCALE } from '../data/science';
import { alternatives, CARDIO_MODE_LABEL, groupExercises, repRange, restFor } from '../logic/generator';
import { blockInfo, exerciseHistory, suggest, type Suggestion } from '../logic/progression';
import { doneSets, prsInWorkout, workoutVolume } from '../logic/stats';
import { fmtKg, uid } from '../logic/util';
import { useProfile } from '../store';
import type { ActiveWorkout, Muscle, Prescription, SetLog, WorkoutLog } from '../types';
import { Badge, Button, Card, Chip, Sheet, cx } from '../components/ui';

/* ───────────── som/vibração do fim do descanso ───────────── */
let audioCtx: AudioContext | null = null;
function unlockAudio() {
  try {
    audioCtx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch {
    /* sem áudio */
  }
}
function beep() {
  try {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    [0, 0.25, 0.5].forEach((d, i) => {
      const o = audioCtx!.createOscillator();
      const g = audioCtx!.createGain();
      o.frequency.value = i === 2 ? 1320 : 880;
      g.gain.setValueAtTime(0.0001, t + d);
      g.gain.exponentialRampToValueAtTime(0.3, t + d + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.18);
      o.connect(g).connect(audioCtx!.destination);
      o.start(t + d);
      o.stop(t + d + 0.2);
    });
  } catch {
    /* ignore */
  }
  navigator.vibrate?.([200, 100, 200, 100, 300]);
}

function fmtClock(sec: number) {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function useNow(interval = 250) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return now;
}

const TREND_TONE: Record<Suggestion['trend'], 'accent' | 'ok' | 'warn' | 'info' | 'default'> = {
  primeira: 'info',
  subir: 'ok',
  manter: 'default',
  reduzir: 'warn',
  deload: 'info',
  reps: 'default',
};

export function WorkoutSession() {
  const { profile, update } = useProfile();
  const aw = profile.activeWorkout!;
  const session = profile.program.sessions.find((s) => s.id === aw.sessionId);
  const info = blockInfo(profile);
  const targetRir = aw.deload ? 4 : info.targetRir;
  const [infoEx, setInfoEx] = useState<string | null>(null);
  const [swapIdx, setSwapIdx] = useState<number | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const now = useNow(1000);

  const setAw = (fn: (a: ActiveWorkout) => ActiveWorkout) => update((p) => (p.activeWorkout ? { ...p, activeWorkout: fn(p.activeWorkout) } : p));

  const updateSet = (ei: number, si: number, patch: Partial<SetLog>) =>
    setAw((a) => ({
      ...a,
      exercises: a.exercises.map((e, i) => (i !== ei ? e : { ...e, sets: e.sets.map((st, j) => (j !== si ? st : { ...st, ...patch })) })),
    }));

  const suggestions = useMemo(
    () => aw.exercises.map((e) => suggest(e.prescription, profile.workouts, aw.deload, targetRir)),
    [aw.exercises, profile.workouts, aw.deload, targetRir],
  );

  const completeSet = (ei: number, si: number) => {
    unlockAudio();
    const e = aw.exercises[ei];
    const st = e.sets[si];
    if (st.done) {
      updateSet(ei, si, { done: false });
      return;
    }
    const target = suggestions[ei].repsTarget[si] ?? e.prescription.repMin;
    // propaga a carga para as séries seguintes ainda vazias
    setAw((a) => {
      const exs = a.exercises.map((ex, i) => {
        if (i !== ei) return ex;
        const sets = ex.sets.map((s, j) => {
          if (j === si) return { ...s, done: true, reps: s.reps ?? target };
          if (j > si && !s.done && s.weight == null && st.weight != null) return { ...s, weight: st.weight };
          return s;
        });
        return { ...ex, sets };
      });
      // descanso: em bi-set, só uma transição curta entre o 1º e o 2º exercício
      const pr = e.prescription;
      let rest = pr.restSec;
      if (pr.superset) {
        const next = a.exercises[ei + 1];
        if (next && next.prescription.superset === pr.superset) rest = 15;
      }
      return { ...a, exercises: exs, restEndsAt: Date.now() + rest * 1000, restTotal: rest };
    });
  };

  const addSet = (ei: number) =>
    setAw((a) => ({
      ...a,
      exercises: a.exercises.map((e, i) => {
        if (i !== ei) return e;
        const lastSet = e.sets[e.sets.length - 1];
        return { ...e, sets: [...e.sets, { weight: lastSet?.weight ?? null, reps: null, rir: null, done: false }] };
      }),
    }));
  const removeSet = (ei: number) =>
    setAw((a) => ({ ...a, exercises: a.exercises.map((e, i) => (i !== ei || e.sets.length <= 1 ? e : { ...e, sets: e.sets.slice(0, -1) })) }));

  const swap = (ei: number, newId: string, permanent: boolean) => {
    const ex = getExercise(newId);
    const old = aw.exercises[ei];
    const [repMin, repMax] = repRange(ex, old.prescription.role, profile.questionnaire);
    const newPr: Prescription = { ...old.prescription, exerciseId: newId, pattern: ex.pattern, repMin, repMax, restSec: restFor(ex, old.prescription.role, profile.questionnaire) };
    const sug = suggest(newPr, profile.workouts, aw.deload, targetRir);
    update((p) => {
      const a = p.activeWorkout!;
      const exercises = a.exercises.map((e, i) =>
        i !== ei ? e : { ...e, exerciseId: newId, prescription: newPr, sets: e.sets.map((s) => (s.done ? s : { ...s, weight: sug.weight })) },
      );
      let program = p.program;
      if (permanent) {
        program = {
          ...program,
          sessions: program.sessions.map((s) =>
            s.id !== a.sessionId ? s : { ...s, exercises: s.exercises.map((pr) => (pr.key === old.key ? { ...newPr, sets: pr.sets } : pr)) },
          ),
        };
      }
      return { ...p, program, activeWorkout: { ...a, exercises } };
    });
    setSwapIdx(null);
  };

  const elapsedMin = Math.floor((now - new Date(aw.startedAt).getTime()) / 60000);
  const totalSets = aw.exercises.reduce((acc, e) => acc + e.sets.length, 0);
  const completed = doneSets(aw);
  const groups = groupExercises(aw.exercises.map((e) => e.prescription));
  let flatIndex = 0;

  return (
    <div className="mx-auto max-w-lg px-4 pb-40">
      <header className="safe-top sticky top-0 z-20 -mx-4 border-b border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate font-semibold">{session?.name ?? 'Treino'}</div>
            <div className="text-xs text-slate-400">
              ⏱ {elapsedMin} min · {completed}/{totalSets} séries · {aw.deload ? 'Deload' : `RIR ${targetRir}`}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" className="px-3 text-xs" onClick={() => setConfirmCancel(true)} aria-label="Descartar treino">
              ✕
            </Button>
            <Button className="px-4" onClick={() => setFinishing(true)}>
              Finalizar
            </Button>
          </div>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full bg-accent transition-all" style={{ width: `${(completed / Math.max(1, totalSets)) * 100}%` }} />
        </div>
      </header>

      <Card className="mt-4 text-sm text-slate-300">
        🔥 <b>Aquecimento (5 min):</b> 3–5 min de cardio leve + mobilidade. No 1º exercício, faça 2 séries de aproximação (~50% e ~75% da carga com poucas repetições) antes das séries válidas.
      </Card>

      {groups.map((g) => (
        <div key={g[0].key} className={cx('mt-4', g.length > 1 && 'rounded-3xl border border-dashed border-accent/40 p-2')}>
          {g.length > 1 && <div className="px-2 pb-2 pt-1 text-xs font-semibold text-accent">BI-SET {g[0].superset} — alterne os exercícios, descanse após o par</div>}
          <div className="space-y-3">
            {g.map((_, gi) => {
              const ei = flatIndex++;
              const e = aw.exercises[ei];
              const ex = getExercise(e.exerciseId);
              const pr = e.prescription;
              const sug = suggestions[ei];
              const hist = exerciseHistory(profile.workouts, e.exerciseId)[0];
              const allDone = e.sets.every((s) => s.done);
              return (
                <Card key={e.key} className={cx(allDone && 'opacity-70')}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {g.length > 1 && <Badge tone="accent">{`${pr.superset}${gi + 1}`}</Badge>}
                        <h3 className="font-semibold leading-tight">{ex.name}</h3>
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {e.sets.length} × {pr.repMin}–{pr.repMax} reps · RIR {targetRir} · descanso {fmtClock(pr.restSec)}
                        {ex.unilateral && ' · cada lado'}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button onClick={() => setInfoEx(e.exerciseId)} className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs" aria-label="Como fazer">
                        ℹ️
                      </button>
                      <button onClick={() => setSwapIdx(ei)} className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs" aria-label="Trocar exercício">
                        🔄
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl bg-slate-950/60 p-2.5 text-xs leading-relaxed text-slate-300">
                    <Badge tone={TREND_TONE[sug.trend]}>
                      {{ primeira: '1ª vez', subir: '↑ subir carga', manter: '→ manter', reduzir: '↓ reduzir', deload: 'deload', reps: '+ reps' }[sug.trend]}
                    </Badge>{' '}
                    {sug.message}
                    {hist && (
                      <div className="mt-1 text-slate-500">
                        Última vez: {hist.sets.map((s) => `${fmtKg(s.weight)}kg×${s.reps}`).join(' · ')}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-[1.5rem_1fr_1fr_3.2rem_2.75rem] items-center gap-2 text-[11px] uppercase tracking-wide text-slate-500">
                    <span>#</span>
                    <span>{ex.load === 'halter' ? 'kg (cada)' : 'kg'}</span>
                    <span>reps</span>
                    <span>RIR</span>
                    <span />
                  </div>
                  <div className="mt-1 space-y-2">
                    {e.sets.map((st, si) => (
                      <div key={si} className="grid grid-cols-[1.5rem_1fr_1fr_3.2rem_2.75rem] items-center gap-2">
                        <span className="text-sm text-slate-500">{si + 1}</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={st.weight ?? ''}
                          placeholder={sug.weight != null ? String(sug.weight) : '—'}
                          onChange={(ev) => updateSet(ei, si, { weight: ev.target.value === '' ? null : Number(ev.target.value) })}
                          className={cx('w-full rounded-lg border bg-slate-950 px-2 py-2.5 text-center text-base tabular-nums outline-none focus:border-accent', st.done ? 'border-accent/40' : 'border-slate-700')}
                        />
                        <input
                          type="number"
                          inputMode="numeric"
                          value={st.reps ?? ''}
                          placeholder={String(sug.repsTarget[si] ?? pr.repMin)}
                          onChange={(ev) => updateSet(ei, si, { reps: ev.target.value === '' ? null : Number(ev.target.value) })}
                          className={cx('w-full rounded-lg border bg-slate-950 px-2 py-2.5 text-center text-base tabular-nums outline-none focus:border-accent', st.done ? 'border-accent/40' : 'border-slate-700')}
                        />
                        <select
                          value={st.rir ?? ''}
                          onChange={(ev) => updateSet(ei, si, { rir: ev.target.value === '' ? null : Number(ev.target.value) })}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-1 py-2.5 text-center text-sm outline-none"
                          aria-label="Repetições na reserva"
                        >
                          <option value="">–</option>
                          {[0, 1, 2, 3, 4].map((r) => (
                            <option key={r} value={r}>
                              {r === 4 ? '4+' : r}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => completeSet(ei, si)}
                          className={cx('h-11 rounded-lg text-lg font-bold transition', st.done ? 'bg-accent text-slate-950' : 'bg-slate-800 text-slate-400')}
                          aria-label="Concluir série"
                        >
                          ✓
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2 text-xs">
                    <button onClick={() => addSet(ei)} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800">
                      + série
                    </button>
                    {e.sets.length > 1 && (
                      <button onClick={() => removeSet(ei)} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800">
                        − série
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {session?.finisher && (
        <Card className="mt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold">❤️ {session.finisher.title}</div>
              <div className="text-xs text-slate-400">{CARDIO_MODE_LABEL[session.finisher.mode]}</div>
              <p className="mt-2 text-sm text-slate-300">{session.finisher.details}</p>
            </div>
            <button
              onClick={() => setAw((a) => ({ ...a, cardioDone: !a.cardioDone }))}
              className={cx('h-11 w-11 shrink-0 rounded-lg text-lg font-bold', aw.cardioDone ? 'bg-accent text-slate-950' : 'bg-slate-800 text-slate-400')}
              aria-label="Cardio feito"
            >
              ✓
            </button>
          </div>
        </Card>
      )}

      <div className="mt-6">
        <Button full onClick={() => setFinishing(true)}>
          Finalizar treino
        </Button>
      </div>

      <RestTimer aw={aw} setAw={setAw} />

      <Sheet open={!!infoEx} onClose={() => setInfoEx(null)} title={infoEx ? getExercise(infoEx).name : ''}>
        {infoEx && <ExerciseInfo id={infoEx} />}
      </Sheet>

      <Sheet open={swapIdx != null} onClose={() => setSwapIdx(null)} title="Trocar exercício">
        {swapIdx != null && (
          <div className="space-y-2">
            <p className="text-sm text-slate-400">Aparelho ocupado ou desconfortável? Escolha uma alternativa que treina o mesmo músculo.</p>
            {alternatives(aw.exercises[swapIdx].exerciseId, profile.questionnaire).map((alt) => (
              <div key={alt.id} className="rounded-xl border border-slate-800 p-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{alt.name}</span>
                  {alt.lengthened && <Badge tone="accent">alongado</Badge>}
                </div>
                <div className="mt-2 flex gap-2">
                  <Button variant="secondary" className="flex-1 py-2" onClick={() => swap(swapIdx, alt.id, false)}>
                    Só hoje
                  </Button>
                  <Button className="flex-1 py-2" onClick={() => swap(swapIdx, alt.id, true)}>
                    Trocar no plano
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Sheet>

      <Sheet open={confirmCancel} onClose={() => setConfirmCancel(false)} title="Descartar treino?">
        <p className="text-sm text-slate-400">As séries registradas neste treino serão perdidas.</p>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" full onClick={() => setConfirmCancel(false)}>
            Continuar treinando
          </Button>
          <Button variant="danger" full onClick={() => update((p) => ({ ...p, activeWorkout: undefined }))}>
            Descartar
          </Button>
        </div>
      </Sheet>

      {finishing && <FinishSheet onClose={() => setFinishing(false)} />}
    </div>
  );
}

function RestTimer({ aw, setAw }: { aw: ActiveWorkout; setAw: (fn: (a: ActiveWorkout) => ActiveWorkout) => void }) {
  const now = useNow(250);
  const [rung, setRung] = useState<number | null>(null);
  const endsAt = aw.restEndsAt;
  const remaining = endsAt ? (endsAt - now) / 1000 : 0;

  useEffect(() => {
    if (endsAt && remaining <= 0 && rung !== endsAt) {
      setRung(endsAt);
      beep();
      const t = setTimeout(() => setAw((a) => (a.restEndsAt === endsAt ? { ...a, restEndsAt: undefined } : a)), 6000);
      return () => clearTimeout(t);
    }
  }, [endsAt, remaining, rung, setAw]);

  if (!endsAt) return null;
  const total = aw.restTotal ?? 90;
  const over = remaining <= 0;
  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-slate-800 bg-slate-950/95 px-4 pt-3 backdrop-blur">
      <div className="mx-auto max-w-lg">
        <div className="h-1 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full bg-accent transition-all" style={{ width: `${over ? 100 : (1 - remaining / total) * 100}%` }} />
        </div>
        <div className="flex items-center justify-between gap-3 py-2">
          <div>
            <div className="text-xs text-slate-400">{over ? 'Descanso concluído' : total <= 15 ? 'Transição do bi-set' : 'Descanso'}</div>
            <div className={cx('text-3xl font-bold tabular-nums', over && 'text-accent')}>{over ? 'Bora! 💪' : fmtClock(remaining)}</div>
          </div>
          <div className="flex gap-2">
            {!over && (
              <>
                <Button variant="secondary" className="px-3" onClick={() => setAw((a) => ({ ...a, restEndsAt: (a.restEndsAt ?? Date.now()) - 15000 }))}>
                  −15s
                </Button>
                <Button variant="secondary" className="px-3" onClick={() => setAw((a) => ({ ...a, restEndsAt: (a.restEndsAt ?? Date.now()) + 15000, restTotal: (a.restTotal ?? 90) + 15 }))}>
                  +15s
                </Button>
              </>
            )}
            <Button variant="ghost" className="px-3" onClick={() => setAw((a) => ({ ...a, restEndsAt: undefined }))}>
              {over ? 'OK' : 'Pular'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ExerciseInfo({ id }: { id: string }) {
  const ex = getExercise(id);
  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap gap-1.5">
        <Badge>{PATTERN_LABEL[ex.pattern]}</Badge>
        <Badge>{ex.kind === 'compound' ? 'Multiarticular' : 'Isolado'}</Badge>
        {ex.lengthened && <Badge tone="accent">ênfase no alongamento</Badge>}
        {ex.unilateral && <Badge tone="info">unilateral</Badge>}
      </div>
      <div>
        <div className="mb-1 text-xs uppercase tracking-wide text-slate-500">Músculos</div>
        <div className="text-slate-300">
          {(Object.entries(ex.muscles) as [Muscle, number][])
            .map(([mu, w]) => `${MUSCLE_LABEL[mu]}${w < 1 ? ' (secundário)' : ''}`)
            .join(' · ')}
        </div>
      </div>
      <div>
        <div className="mb-1 text-xs uppercase tracking-wide text-slate-500">Execução</div>
        <ul className="list-disc space-y-1 pl-5 text-slate-300">
          {ex.cues.map((c) => (
            <li key={c}>{c}</li>
          ))}
          <li>Controle a descida (~2–3 s) e suba com intenção, sem perder a técnica.</li>
        </ul>
      </div>
      <div>
        <div className="mb-1 text-xs uppercase tracking-wide text-slate-500">Escala RIR (repetições na reserva)</div>
        <div className="space-y-1">
          {RIR_SCALE.map((r) => (
            <div key={r.rir} className="flex gap-2 text-slate-300">
              <span className="w-6 font-bold text-accent">{r.rir}</span>
              <span>{r.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FinishSheet({ onClose }: { onClose: () => void }) {
  const { profile, update } = useProfile();
  const aw = profile.activeWorkout!;
  const [rpe, setRpe] = useState<number | undefined>();
  const [notes, setNotes] = useState('');
  const session = profile.program.sessions.find((s) => s.id === aw.sessionId);
  const volume = workoutVolume(aw);
  const sets = doneSets(aw);
  const prs = prsInWorkout(profile.workouts, aw);
  const minutes = Math.round((Date.now() - new Date(aw.startedAt).getTime()) / 60000);

  const save = () => {
    const log: WorkoutLog = {
      id: uid(),
      programId: aw.programId,
      sessionId: aw.sessionId,
      sessionName: session?.name ?? 'Treino',
      startedAt: aw.startedAt,
      finishedAt: new Date().toISOString(),
      blockWeek: aw.blockWeek,
      deload: aw.deload,
      exercises: aw.exercises.map(({ key, exerciseId, sets }) => ({ key, exerciseId, sets })),
      cardioDone: aw.cardioDone,
      rpe,
      notes: notes.trim() || undefined,
    };
    update((p) => ({ ...p, workouts: [...p.workouts, log], activeWorkout: undefined }));
  };

  return (
    <Sheet open onClose={onClose} title="Finalizar treino">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-slate-950 p-3">
          <div className="text-xl font-bold">{minutes}</div>
          <div className="text-xs text-slate-400">minutos</div>
        </div>
        <div className="rounded-xl bg-slate-950 p-3">
          <div className="text-xl font-bold">{sets}</div>
          <div className="text-xs text-slate-400">séries</div>
        </div>
        <div className="rounded-xl bg-slate-950 p-3">
          <div className="text-xl font-bold">{volume >= 1000 ? `${(volume / 1000).toFixed(1).replace('.', ',')}t` : volume}</div>
          <div className="text-xs text-slate-400">{volume >= 1000 ? 'toneladas' : 'kg movidos'}</div>
        </div>
      </div>
      {prs.length > 0 && (
        <div className="mt-3 rounded-xl border border-accent/40 bg-accent/10 p-3 text-sm">
          🏆 <b>Recorde pessoal</b> (1RM estimado) em: {prs.map((id) => getExercise(id).name).join(', ')}
        </div>
      )}
      {sets === 0 && <p className="mt-3 text-sm text-amber-300">Nenhuma série marcada como concluída (✓).</p>}
      <div className="mt-4">
        <div className="mb-2 text-sm text-slate-400">Quão puxado foi o treino? (0–10)</div>
        <div className="flex flex-wrap gap-1.5">
          {[5, 6, 7, 8, 9, 10].map((n) => (
            <Chip key={n} active={rpe === n} onClick={() => setRpe(n)} className="w-11 text-center">
              {n}
            </Chip>
          ))}
        </div>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Anotações (opcional): dores, sono, energia…"
        className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm outline-none focus:border-accent"
        rows={3}
      />
      <div className="mt-4 flex gap-2">
        <Button variant="secondary" onClick={onClose}>
          Voltar
        </Button>
        <Button full onClick={save} disabled={sets === 0}>
          Salvar treino ✓
        </Button>
      </div>
    </Sheet>
  );
}
