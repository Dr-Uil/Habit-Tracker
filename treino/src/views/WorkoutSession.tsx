import { useEffect, useMemo, useState } from 'react';
import { EXERCISES, getExercise, MUSCLE_LABEL, PATTERN_LABEL } from '../data/exercises';
import { RIR_SCALE } from '../data/science';
import { alternatives, CARDIO_MODE_LABEL, groupExercises, repRange, restFor } from '../logic/generator';
import { bestE1rm, blockInfo, exerciseHistory, suggest, type Suggestion } from '../logic/progression';
import { doneSets, prsInWorkout, workoutVolume } from '../logic/stats';
import { fmtKg, localDate, uid } from '../logic/util';
import { useProfile } from '../store';
import type { ActiveWorkout, Muscle, Prescription, Questionnaire, SetLog, WorkoutLog } from '../types';
import { Badge, Button, Card, Chip, Collapsible, Sheet, cx } from '../components/ui';

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

const isLight = (exerciseId: string) => {
  const l = getExercise(exerciseId).load;
  return l === 'peso_corporal' || l === 'elastico';
};

/** Prescrição para um exercício adicionado livremente (treino avulso). */
export function freePrescription(exerciseId: string, q: Questionnaire): Prescription {
  const ex = getExercise(exerciseId);
  const role = ex.kind === 'compound' ? 'secondary' : 'accessory';
  const [repMin, repMax] = repRange(ex, role, q);
  return { key: uid(), exerciseId, pattern: ex.pattern, role, sets: 3, repMin, repMax, restSec: restFor(ex, role, q) };
}

export function WorkoutSession() {
  const { profile, update } = useProfile();
  const aw = profile.activeWorkout!;
  const session = aw.free ? undefined : profile.program.sessions.find((s) => s.id === aw.sessionId);
  const title = session?.name ?? (aw.retro ? 'Registrar treino feito' : 'Treino avulso');
  const info = blockInfo(profile);
  const targetRir = aw.deload ? 4 : info.targetRir;
  const [infoEx, setInfoEx] = useState<string | null>(null);
  const [swapIdx, setSwapIdx] = useState<number | null>(null);
  const [adding, setAdding] = useState(aw.free === true && aw.exercises.length === 0);
  const [finishing, setFinishing] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const now = useNow(1000);

  const setAw = (fn: (a: ActiveWorkout) => ActiveWorkout) => update((p) => (p.activeWorkout ? { ...p, activeWorkout: fn(p.activeWorkout) } : p));
  const setExercise = (ei: number, fn: (e: ActiveWorkout['exercises'][number]) => ActiveWorkout['exercises'][number]) =>
    setAw((a) => ({ ...a, exercises: a.exercises.map((e, i) => (i === ei ? fn(e) : e)) }));

  const suggestions = useMemo(
    () => aw.exercises.map((e) => suggest(e.prescription, profile.workouts, aw.deload, targetRir)),
    [aw.exercises, profile.workouts, aw.deload, targetRir],
  );

  const startRest = (a: ActiveWorkout, ei: number, last: boolean): ActiveWorkout => {
    if (a.retro) return a;
    const pr = a.exercises[ei].prescription;
    let rest = pr.restSec;
    if (pr.superset && !last) {
      const next = a.exercises[ei + 1];
      if (next && next.prescription.superset === pr.superset) rest = 15;
    }
    return { ...a, restEndsAt: Date.now() + rest * 1000, restTotal: rest };
  };

  /** Preenche peso/reps vazios com a sugestão (ou com a série anterior). */
  const fillSet = (ei: number, si: number, sets: SetLog[]): SetLog => {
    const st = sets[si];
    const sug = suggestions[ei];
    const prevW = si > 0 ? sets[si - 1].weight : null;
    return {
      ...st,
      weight: st.weight ?? prevW ?? sug.weight ?? (isLight(aw.exercises[ei].exerciseId) ? 0 : null),
      reps: st.reps ?? sug.repsTarget[si] ?? aw.exercises[ei].prescription.repMin,
    };
  };

  const toggleSet = (ei: number, si: number) => {
    unlockAudio();
    const e = aw.exercises[ei];
    if (e.sets[si].done) {
      setExercise(ei, (ex) => ({ ...ex, sets: ex.sets.map((s, j) => (j === si ? { ...s, done: false } : s)) }));
      return;
    }
    setAw((a) => {
      const ex = a.exercises[ei];
      const filled = fillSet(ei, si, ex.sets);
      const sets = ex.sets.map((s, j) => {
        if (j === si) return { ...filled, done: true };
        // propaga a carga para as séries seguintes ainda vazias
        if (j > si && !s.done && s.weight == null && filled.weight != null) return { ...s, weight: filled.weight };
        return s;
      });
      const next = { ...a, exercises: a.exercises.map((x, i) => (i === ei ? { ...x, sets } : x)) };
      return startRest(next, ei, false);
    });
  };

  const completeExercise = (ei: number) => {
    unlockAudio();
    setAw((a) => {
      const ex = a.exercises[ei];
      const sets: SetLog[] = [];
      ex.sets.forEach((s, j) => sets.push(s.done ? s : { ...fillSet(ei, j, [...sets, ...ex.sets.slice(j)]), done: true }));
      const next = { ...a, exercises: a.exercises.map((x, i) => (i === ei ? { ...x, sets } : x)) };
      return startRest(next, ei, true);
    });
  };

  const updateSet = (ei: number, si: number, patch: Partial<SetLog>) =>
    setExercise(ei, (e) => ({ ...e, sets: e.sets.map((st, j) => (j !== si ? st : { ...st, ...patch })) }));
  const addSet = (ei: number) =>
    setExercise(ei, (e) => ({ ...e, sets: [...e.sets, { weight: e.sets[e.sets.length - 1]?.weight ?? null, reps: null, rir: null, done: false }] }));
  const removeSet = (ei: number) => setExercise(ei, (e) => (e.sets.length <= 1 ? e : { ...e, sets: e.sets.slice(0, -1) }));
  const removeExercise = (ei: number) => setAw((a) => ({ ...a, exercises: a.exercises.filter((_, i) => i !== ei) }));

  const addExercise = (exerciseId: string) => {
    const pr = freePrescription(exerciseId, profile.questionnaire);
    const sug = suggest(pr, profile.workouts, false, targetRir);
    setAw((a) => ({
      ...a,
      exercises: [...a.exercises, { key: pr.key, exerciseId, prescription: pr, sets: Array.from({ length: 3 }, () => ({ weight: sug.weight, reps: null, rir: null, done: false })) }],
    }));
    setAdding(false);
  };

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
      if (permanent && !a.free) {
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
            <div className="truncate font-semibold">{title}</div>
            <div className="text-xs text-slate-400">
              {!aw.retro && `⏱ ${elapsedMin} min · `}
              {completed}/{totalSets} séries{!aw.free && ` · ${aw.deload ? 'Deload' : `RIR ${targetRir}`}`}
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

      {aw.retro ? (
        <Card className="mt-4 text-sm text-slate-300">
          📝 Adicione os exercícios que você fez, preencha <b>peso</b> e <b>repetições</b> de cada série e toque em <b>✓</b>. Na hora de finalizar você escolhe a data.
        </Card>
      ) : (
        <Collapsible className="mt-4" icon="🔥" title="Aquecimento (5 min)">
          <p className="text-sm text-slate-300">3–5 min de cardio leve + mobilidade. No 1º exercício, faça 2 séries de aproximação (~50% e ~75% da carga, poucas repetições) antes das séries válidas.</p>
        </Collapsible>
      )}

      {groups.map((g) => (
        <div key={g[0].key} className={cx('mt-4', g.length > 1 && 'rounded-3xl border border-dashed border-accent/40 p-2')}>
          {g.length > 1 && <div className="px-2 pb-2 pt-1 text-xs font-semibold text-accent">BI-SET {g[0].superset} — alterne os dois, descanse depois do par</div>}
          <div className="space-y-3">
            {g.map((_, gi) => {
              const ei = flatIndex++;
              return (
                <ExerciseCard
                  key={aw.exercises[ei].key}
                  aw={aw}
                  ei={ei}
                  label={g.length > 1 ? `${g[0].superset}${gi + 1}` : undefined}
                  sug={suggestions[ei]}
                  targetRir={targetRir}
                  onToggleSet={(si) => toggleSet(ei, si)}
                  onUpdateSet={(si, patch) => updateSet(ei, si, patch)}
                  onAddSet={() => addSet(ei)}
                  onRemoveSet={() => removeSet(ei)}
                  onComplete={() => completeExercise(ei)}
                  onInfo={() => setInfoEx(aw.exercises[ei].exerciseId)}
                  onSwap={() => setSwapIdx(ei)}
                />
              );
            })}
          </div>
        </div>
      ))}

      <div className="mt-4">
        <Button variant="secondary" full onClick={() => setAdding(true)}>
          ➕ Adicionar exercício
        </Button>
      </div>

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
                  {!aw.free && (
                    <Button className="flex-1 py-2" onClick={() => swap(swapIdx, alt.id, true)}>
                      Trocar no plano
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button
              variant="danger"
              full
              onClick={() => {
                removeExercise(swapIdx);
                setSwapIdx(null);
              }}
            >
              Tirar este exercício do treino de hoje
            </Button>
          </div>
        )}
      </Sheet>

      {adding && <AddExerciseSheet onClose={() => setAdding(false)} onPick={addExercise} />}

      <Sheet open={confirmCancel} onClose={() => setConfirmCancel(false)} title="Descartar treino?">
        <p className="text-sm text-slate-400">As séries registradas neste treino serão perdidas.</p>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" full onClick={() => setConfirmCancel(false)}>
            Continuar
          </Button>
          <Button variant="danger" full onClick={() => update((p) => ({ ...p, activeWorkout: undefined }))}>
            Descartar
          </Button>
        </div>
      </Sheet>

      {finishing && <FinishSheet onClose={() => setFinishing(false)} title={title} />}
    </div>
  );
}

/* ───────────── Cartão de exercício ───────────── */

function ExerciseCard({
  aw,
  ei,
  label,
  sug,
  targetRir,
  onToggleSet,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onComplete,
  onInfo,
  onSwap,
}: {
  aw: ActiveWorkout;
  ei: number;
  label?: string;
  sug: Suggestion;
  targetRir: number;
  onToggleSet: (si: number) => void;
  onUpdateSet: (si: number, patch: Partial<SetLog>) => void;
  onAddSet: () => void;
  onRemoveSet: () => void;
  onComplete: () => void;
  onInfo: () => void;
  onSwap: () => void;
}) {
  const { profile } = useProfile();
  const e = aw.exercises[ei];
  const ex = getExercise(e.exerciseId);
  const pr = e.prescription;
  const allDone = e.sets.length > 0 && e.sets.every((s) => s.done);
  const [editing, setEditing] = useState(false);
  const [why, setWhy] = useState(false);
  const hist = exerciseHistory(profile.workouts, e.exerciseId)[0];

  // comparação com a última vez (1RM estimado)
  const nowBest = bestE1rm(e.sets);
  const prevBest = hist ? Math.max(...hist.sets.map((s) => s.weight * (1 + Math.min(s.reps, 15) / 30))) : 0;
  const allTimeBest = Math.max(
    0,
    ...profile.workouts.flatMap((w) => w.exercises.filter((x) => x.exerciseId === e.exerciseId).map((x) => bestE1rm(x.sets))),
  );

  if (allDone && !editing) {
    const diff = nowBest - prevBest;
    return (
      <Card className="border-accent/30 bg-accent/5" onClick={() => setEditing(true)}>
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent font-bold text-slate-950">✓</span>
          <div className="min-w-0 flex-1">
            <div className="font-semibold leading-tight">{ex.name}</div>
            <div className="mt-1 text-sm tabular-nums text-slate-300">
              {e.sets.map((s) => (isLight(e.exerciseId) && !s.weight ? `${s.reps}` : `${fmtKg(s.weight ?? 0)}kg×${s.reps}`)).join(' · ')}
            </div>
            <div className="mt-1 text-xs">
              {prevBest === 0 ? (
                <span className="text-sky-300">Primeiro registro — base para as próximas sugestões</span>
              ) : nowBest > allTimeBest + 0.01 ? (
                <span className="text-accent">🏆 Recorde pessoal! (+{fmtKg(Math.round(diff * 10) / 10)} kg no 1RM estimado)</span>
              ) : diff > 0.01 ? (
                <span className="text-emerald-300">↑ Mais forte que a última vez (+{fmtKg(Math.round(diff * 10) / 10)} kg no 1RM estimado)</span>
              ) : diff < -0.01 ? (
                <span className="text-slate-400">Um pouco abaixo da última vez — normal em dias cansados</span>
              ) : (
                <span className="text-slate-400">Igual à última vez</span>
              )}
            </div>
          </div>
          <span className="text-xs text-slate-500">editar</span>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {label && <Badge tone="accent">{label}</Badge>}
            <h3 className="font-semibold leading-tight">{ex.name}</h3>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {e.sets.length} séries de {pr.repMin}–{pr.repMax} reps{!aw.free && ` · sobrar ${targetRir}`}
            {!aw.retro && ` · descanso ${fmtClock(pr.restSec)}`}
            {ex.unilateral && ' · cada lado'}
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button onClick={onInfo} className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs" aria-label="Como fazer">
            ℹ️
          </button>
          <button onClick={onSwap} className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs" aria-label="Trocar exercício">
            🔄
          </button>
        </div>
      </div>

      <button onClick={() => setWhy(!why)} className="mt-3 w-full rounded-xl bg-slate-950/60 p-2.5 text-left text-xs text-slate-300">
        <span className="flex items-center gap-2">
          <Badge tone={TREND_TONE[sug.trend]}>{{ primeira: '1ª vez', subir: '↑ subir', manter: '→ manter', reduzir: '↓ reduzir', deload: 'deload', reps: '+ reps' }[sug.trend]}</Badge>
          <span className="flex-1">{sug.short}</span>
          <span className="text-slate-500">{why ? '▴' : 'ⓘ'}</span>
        </span>
        {why && (
          <span className="mt-2 block leading-relaxed">
            {sug.message}
            {hist && <span className="mt-1 block text-slate-500">Última vez: {hist.sets.map((s) => `${fmtKg(s.weight)}kg×${s.reps}`).join(' · ')}</span>}
          </span>
        )}
      </button>

      <div className="mt-3 grid grid-cols-[1.5rem_1fr_1fr_3.2rem_2.75rem] items-center gap-2 text-[11px] text-slate-500">
        <span>Série</span>
        <span className="text-center">Peso (kg){ex.load === 'halter' ? ' cada' : ''}</span>
        <span className="text-center">Repetições</span>
        <span className="text-center">Sobrou</span>
        <span className="text-center">Feito</span>
      </div>
      <div className="mt-1 space-y-2">
        {e.sets.map((st, si) => (
          <div key={si} className="grid grid-cols-[1.5rem_1fr_1fr_3.2rem_2.75rem] items-center gap-2">
            <span className="text-center text-sm text-slate-500">{si + 1}</span>
            <input
              type="number"
              inputMode="decimal"
              value={st.weight ?? ''}
              placeholder={sug.weight != null ? String(sug.weight) : 'kg'}
              onChange={(ev) => onUpdateSet(si, { weight: ev.target.value === '' ? null : Number(ev.target.value) })}
              className={cx('w-full rounded-lg border bg-slate-950 px-2 py-2.5 text-center text-base tabular-nums outline-none focus:border-accent', st.done ? 'border-accent/50' : 'border-slate-700')}
            />
            <input
              type="number"
              inputMode="numeric"
              value={st.reps ?? ''}
              placeholder={String(sug.repsTarget[si] ?? pr.repMin)}
              onChange={(ev) => onUpdateSet(si, { reps: ev.target.value === '' ? null : Number(ev.target.value) })}
              className={cx('w-full rounded-lg border bg-slate-950 px-2 py-2.5 text-center text-base tabular-nums outline-none focus:border-accent', st.done ? 'border-accent/50' : 'border-slate-700')}
            />
            <select
              value={st.rir ?? ''}
              onChange={(ev) => onUpdateSet(si, { rir: ev.target.value === '' ? null : Number(ev.target.value) })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-1 py-2.5 text-center text-sm outline-none"
              aria-label="Repetições que ainda sobrariam"
            >
              <option value="">–</option>
              {[0, 1, 2, 3, 4].map((r) => (
                <option key={r} value={r}>
                  {r === 4 ? '4+' : r}
                </option>
              ))}
            </select>
            <button
              onClick={() => onToggleSet(si)}
              className={cx('h-11 rounded-lg text-lg font-bold transition', st.done ? 'bg-accent text-slate-950' : 'bg-slate-800 text-slate-400')}
              aria-label="Concluir série"
            >
              ✓
            </button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button onClick={onAddSet} className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-800">
          + série
        </button>
        {e.sets.length > 1 && (
          <button onClick={onRemoveSet} className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-800">
            − série
          </button>
        )}
        <div className="flex-1" />
        {allDone ? (
          <Button variant="secondary" className="py-2" onClick={() => setEditing(false)}>
            OK
          </Button>
        ) : (
          <Button
            className="py-2"
            onClick={() => {
              onComplete();
              setEditing(false);
            }}
          >
            ✓ Concluir exercício
          </Button>
        )}
      </div>
      {ei === 0 && <p className="mt-2 text-[11px] leading-snug text-slate-500">Digite o peso e as repetições que você realmente fez. Campos vazios usam o valor sugerido (em cinza).</p>}
    </Card>
  );
}

/* ───────────── Adicionar exercício (busca) ───────────── */

function AddExerciseSheet({ onClose, onPick }: { onClose: () => void; onPick: (id: string) => void }) {
  const [term, setTerm] = useState('');
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const t = norm(term.trim());
  const list = EXERCISES.filter((e) => !t || norm(`${e.name} ${PATTERN_LABEL[e.pattern]} ${Object.keys(e.muscles).join(' ')}`).includes(t));
  const byGroup = new Map<string, typeof list>();
  for (const e of list) {
    const main = (Object.entries(e.muscles) as [Muscle, number][]).find(([, w]) => w >= 1)?.[0] ?? 'abdomen';
    const k = MUSCLE_LABEL[main];
    byGroup.set(k, [...(byGroup.get(k) ?? []), e]);
  }
  return (
    <Sheet open onClose={onClose} title="Adicionar exercício">
      <input
        autoFocus
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Buscar: supino, tríceps, ombro…"
        className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 outline-none focus:border-accent"
      />
      {list.length === 0 && <p className="text-sm text-slate-400">Nada encontrado. Tente outro nome (ex.: “crucifixo”, “remada”).</p>}
      <div className="space-y-4">
        {[...byGroup.entries()].map(([group, items]) => (
          <div key={group}>
            <div className="mb-1 text-xs uppercase tracking-wide text-slate-500">{group}</div>
            <div className="space-y-1">
              {items.map((e) => (
                <button key={e.id} onClick={() => onPick(e.id)} className="w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-slate-800 active:bg-slate-800">
                  {e.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Sheet>
  );
}

/* ───────────── Cronômetro ───────────── */

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
      <Collapsible title="O que é “sobrou” (RIR)?" className="bg-slate-950/50">
        <div className="space-y-1">
          {RIR_SCALE.map((r) => (
            <div key={r.rir} className="flex gap-2 text-slate-300">
              <span className="w-6 font-bold text-accent">{r.rir}</span>
              <span>{r.label}</span>
            </div>
          ))}
        </div>
      </Collapsible>
    </div>
  );
}

/* ───────────── Finalizar ───────────── */

function FinishSheet({ onClose, title }: { onClose: () => void; title: string }) {
  const { profile, update } = useProfile();
  const aw = profile.activeWorkout!;
  const [rpe, setRpe] = useState<number | undefined>();
  const [notes, setNotes] = useState('');
  const today = localDate();
  const [date, setDate] = useState(today);
  const [retroMinutes, setRetroMinutes] = useState(60);
  const volume = workoutVolume(aw);
  const sets = doneSets(aw);
  const prs = prsInWorkout(profile.workouts, aw);
  const minutes = aw.retro ? retroMinutes : Math.round((Date.now() - new Date(aw.startedAt).getTime()) / 60000);

  const save = () => {
    const finished = date === today ? new Date() : new Date(`${date}T19:00:00`);
    const started = new Date(finished.getTime() - minutes * 60000);
    const log: WorkoutLog = {
      id: uid(),
      programId: aw.programId,
      free: aw.free || undefined,
      sessionId: aw.sessionId,
      sessionName: title === 'Registrar treino feito' ? 'Treino avulso' : title,
      startedAt: aw.retro ? started.toISOString() : aw.startedAt,
      finishedAt: finished.toISOString(),
      blockWeek: aw.blockWeek,
      deload: aw.deload,
      exercises: aw.exercises.map(({ key, exerciseId, sets }) => ({ key, exerciseId, sets })).filter((e) => e.sets.some((s) => s.done)),
      cardioDone: aw.cardioDone,
      rpe,
      notes: notes.trim() || undefined,
    };
    // mantém o histórico em ordem cronológica (registros de dias anteriores)
    update((p) => ({ ...p, workouts: [...p.workouts, log].sort((x, y) => x.finishedAt.localeCompare(y.finishedAt)), activeWorkout: undefined }));
  };

  return (
    <Sheet open onClose={onClose} title="Finalizar treino">
      {(aw.retro || aw.free) && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm text-slate-400">Data do treino</span>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value || today)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 outline-none focus:border-accent"
            />
          </label>
          {aw.retro && (
            <label className="block">
              <span className="mb-1 block text-sm text-slate-400">Duração (min)</span>
              <input
                type="number"
                inputMode="numeric"
                value={retroMinutes}
                onChange={(e) => setRetroMinutes(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 outline-none focus:border-accent"
              />
            </label>
          )}
        </div>
      )}
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
          🏆 <b>Recorde pessoal</b> em: {prs.map((id) => getExercise(id).name).join(', ')}
        </div>
      )}
      {sets === 0 && <p className="mt-3 text-sm text-amber-300">Nenhuma série marcada como feita (✓). Toque em “✓ Concluir exercício” em cada exercício que você fez.</p>}
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
        rows={2}
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
