import { getExercise } from '../data/exercises';
import type { ActiveWorkout, Muscle, Profile, WorkoutLog } from '../types';
import { bestE1rm, blockInfo, effectiveSets, suggest } from './progression';
import { localDate } from './util';

export function workoutVolume(w: Pick<WorkoutLog, 'exercises'>): number {
  let v = 0;
  for (const e of w.exercises) for (const s of e.sets) if (s.done) v += (s.weight ?? 0) * (s.reps ?? 0);
  return Math.round(v);
}

export function doneSets(w: Pick<WorkoutLog, 'exercises'>): number {
  return w.exercises.reduce((acc, e) => acc + e.sets.filter((s) => s.done).length, 0);
}

/** Segunda-feira 00:00 (local) da semana da data. */
export function weekStart(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x;
}

export function workoutsInWeek(p: Profile, ref = new Date()): WorkoutLog[] {
  const start = weekStart(ref).getTime();
  const end = start + 7 * 86400000;
  return p.workouts.filter((w) => {
    const t = new Date(w.finishedAt).getTime();
    return t >= start && t < end;
  });
}

export function cardioInWeek(p: Profile, ref = new Date()) {
  const start = localDate(weekStart(ref));
  const endD = weekStart(ref);
  endD.setDate(endD.getDate() + 7);
  const end = localDate(endD);
  return p.cardioLogs.filter((c) => c.date >= start && c.date < end);
}

/** Semanas consecutivas (até a atual) em que a meta de treinos foi cumprida. */
export function weekStreak(p: Profile): number {
  const target = p.questionnaire.daysPerWeek;
  let streak = 0;
  const ref = weekStart(new Date());
  // semana atual conta só se já bateu a meta
  if (workoutsInWeek(p, ref).length >= target) streak++;
  for (let i = 1; i < 104; i++) {
    const d = new Date(ref);
    d.setDate(d.getDate() - 7 * i);
    if (workoutsInWeek(p, d).length >= target) streak++;
    else break;
  }
  return streak;
}

/** Exercícios em que o treino bateu o melhor 1RM estimado anterior. */
export function prsInWorkout(history: WorkoutLog[], w: Pick<WorkoutLog, 'exercises'>): string[] {
  const out: string[] = [];
  for (const e of w.exercises) {
    const now = bestE1rm(e.sets);
    if (now <= 0) continue;
    let prev = 0;
    for (const h of history) for (const he of h.exercises) if (he.exerciseId === e.exerciseId) prev = Math.max(prev, bestE1rm(he.sets));
    if (prev > 0 && now > prev + 0.01) out.push(e.exerciseId);
  }
  return out;
}

export function buildActiveWorkout(p: Profile, sessionIndex: number): ActiveWorkout {
  const info = blockInfo(p);
  const ses = p.program.sessions[sessionIndex];
  return {
    programId: p.program.id,
    sessionId: ses.id,
    startedAt: new Date().toISOString(),
    blockWeek: info.week,
    deload: info.deload,
    exercises: ses.exercises.map((pr) => {
      const sug = suggest(pr, p.workouts, info.deload, info.targetRir);
      const n = effectiveSets(pr, info.deload);
      return {
        key: pr.key,
        exerciseId: pr.exerciseId,
        prescription: pr,
        sets: Array.from({ length: n }, () => ({ weight: sug.weight, reps: null, rir: null, done: false })),
      };
    }),
  };
}

/** Séries feitas por músculo nas últimas N semanas (contagem fracionada). */
export function weeklySetsHistory(p: Profile, weeks = 8): { week: Date; sets: number; byMuscle: Partial<Record<Muscle, number>> }[] {
  const out = [];
  const ref = weekStart(new Date());
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(ref);
    d.setDate(d.getDate() - 7 * i);
    const ws = workoutsInWeek(p, d);
    const byMuscle: Partial<Record<Muscle, number>> = {};
    let sets = 0;
    for (const w of ws)
      for (const e of w.exercises) {
        const n = e.sets.filter((s) => s.done).length;
        sets += n;
        const ex = getExercise(e.exerciseId);
        for (const [mu, wt] of Object.entries(ex.muscles) as [Muscle, number][]) byMuscle[mu] = (byMuscle[mu] ?? 0) + wt * n;
      }
    out.push({ week: d, sets, byMuscle });
  }
  return out;
}
