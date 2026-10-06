import { getExercise } from '../data/exercises';
import type { Exercise, Prescription, Profile, WorkoutLog } from '../types';
import { BLOCK_LENGTH } from './generator';

/* ────────────────────────────────────────────────────────────────────────────
 * Periodização em blocos de 6 semanas, guiada por RIR (repetições na reserva):
 * a proximidade da falha aumenta ao longo do bloco e a 6ª semana é um deload
 * (metade das séries, mesma carga, longe da falha) — Bell 2023 (consenso Delphi).
 * A "semana" avança por treinos concluídos, não pelo calendário, para respeitar
 * semanas em que vocês treinaram menos.
 * ──────────────────────────────────────────────────────────────────────────── */

const RIR_TABLE: Record<'iniciante' | 'outros', number[]> = {
  iniciante: [3, 3, 2, 2, 2],
  outros: [3, 2, 2, 1, 1],
};

export interface BlockInfo {
  week: number; // 1..6
  block: number; // 1..
  deload: boolean;
  targetRir: number;
  sessionsDone: number;
  sessionsThisWeek: number;
}

export function programWorkouts(p: Profile): WorkoutLog[] {
  return p.workouts.filter((w) => w.programId === p.program.id);
}

export function blockInfo(p: Profile): BlockInfo {
  const perWeek = p.program.sessions.length;
  const done = programWorkouts(p).length;
  const weekIdx = Math.floor(done / perWeek);
  const week = (weekIdx % BLOCK_LENGTH) + 1;
  const deload = week === BLOCK_LENGTH;
  const table = p.questionnaire.experience === 'iniciante' ? RIR_TABLE.iniciante : RIR_TABLE.outros;
  return {
    week,
    block: Math.floor(weekIdx / BLOCK_LENGTH) + 1,
    deload,
    targetRir: deload ? 4 : table[week - 1],
    sessionsDone: done,
    sessionsThisWeek: done % perWeek,
  };
}

export function nextSessionIndex(p: Profile): number {
  const ws = programWorkouts(p);
  if (ws.length === 0) return 0;
  const last = ws[ws.length - 1];
  const idx = p.program.sessions.findIndex((s) => s.id === last.sessionId);
  return (idx + 1) % p.program.sessions.length;
}

export function effectiveSets(pr: Prescription, deload: boolean) {
  return deload ? Math.max(1, Math.ceil(pr.sets / 2)) : pr.sets;
}

/* ───────────── Sugestão de carga (dupla progressão) ───────────── */

export function loadIncrement(ex: Exercise, weight: number): number {
  const lower = ['squat', 'hinge', 'lunge', 'hip_thrust'].includes(ex.pattern);
  switch (ex.load) {
    case 'barra':
      return lower ? 5 : 2.5;
    case 'halter':
      return weight < 10 ? 1 : 2;
    case 'maquina':
      return lower ? 5 : 2.5;
    case 'cabo':
      return 2.5;
    default:
      return 0;
  }
}

function roundTo(n: number, step: number) {
  if (step <= 0) return Math.round(n * 2) / 2;
  return Math.max(0, Math.round(n / step) * step);
}

export interface Suggestion {
  weight: number | null;
  repsTarget: number[]; // por série
  message: string;
  trend: 'primeira' | 'subir' | 'manter' | 'reduzir' | 'deload' | 'reps';
}

/** Última execução registrada deste exercício (qualquer sessão), mais recente primeiro. */
export function exerciseHistory(workouts: WorkoutLog[], exerciseId: string) {
  const out: { date: string; sets: { weight: number; reps: number; rir?: number | null }[] }[] = [];
  for (let i = workouts.length - 1; i >= 0; i--) {
    const w = workouts[i];
    for (const e of w.exercises) {
      if (e.exerciseId !== exerciseId) continue;
      const sets = e.sets
        .filter((st) => st.done && st.reps != null && st.reps > 0)
        .map((st) => ({ weight: st.weight ?? 0, reps: st.reps as number, rir: st.rir }));
      if (sets.length) out.push({ date: w.finishedAt, sets });
    }
  }
  return out;
}

export function suggest(pr: Prescription, workouts: WorkoutLog[], deload: boolean, targetRir: number): Suggestion {
  const ex = getExercise(pr.exerciseId);
  const nSets = effectiveSets(pr, deload);
  const hist = exerciseHistory(workouts, pr.exerciseId);
  const base = Array(nSets).fill(pr.repMax) as number[];

  if (hist.length === 0) {
    return {
      weight: null,
      repsTarget: Array(nSets).fill(pr.repMin),
      trend: 'primeira',
      message: `Primeira vez: faça 1–2 séries leves de aproximação e escolha uma carga em que você consiga ${pr.repMin}–${pr.repMax} repetições deixando ~${Math.max(2, targetRir)} na reserva. Anote o que fizer — o app calcula a próxima.`,
    };
  }

  const last = hist[0].sets;
  const topWeight = Math.max(...last.map((s) => s.weight));
  const working = last.filter((s) => s.weight === topWeight);
  const bodyweight = ex.load === 'peso_corporal' || ex.load === 'elastico' || topWeight === 0;

  if (deload) {
    return {
      weight: topWeight,
      repsTarget: Array(nSets).fill(pr.repMin),
      trend: 'deload',
      message: 'Semana de deload: mesma carga, metade das séries e ~4 repetições na reserva. Serve para dissipar a fadiga e voltar mais forte.',
    };
  }

  const allTop = working.length >= Math.min(nSets, last.length) && working.every((s) => s.reps >= pr.repMax);
  const lowCount = working.filter((s) => s.reps < pr.repMin).length;

  if (bodyweight) {
    if (allTop) {
      return {
        weight: topWeight,
        repsTarget: base,
        trend: 'reps',
        message: `Você passou de ${pr.repMax} repetições: hora de dificultar (mochila com peso, elástico mais forte, descida mais lenta ou variação mais difícil).`,
      };
    }
    const targets = Array.from({ length: nSets }, (_, i) => Math.min(pr.repMax, (last[i]?.reps ?? last[last.length - 1].reps) + 1));
    return { weight: topWeight, repsTarget: targets, trend: 'reps', message: 'Tente 1 repetição a mais por série do que da última vez, com a mesma técnica.' };
  }

  if (allTop) {
    const inc = loadIncrement(ex, topWeight);
    const next = roundTo(topWeight + Math.max(inc, topWeight * 0.025), inc || 0.5);
    return {
      weight: next,
      repsTarget: Array(nSets).fill(pr.repMin),
      trend: 'subir',
      message: `Você bateu ${pr.repMax} repetições em todas as séries com ${topWeight} kg → suba para ${next} kg e recomece perto de ${pr.repMin} repetições.`,
    };
  }

  if (lowCount >= Math.ceil(working.length / 2)) {
    const inc = loadIncrement(ex, topWeight);
    const next = roundTo(topWeight * 0.92, inc || 0.5);
    return {
      weight: next,
      repsTarget: Array(nSets).fill(pr.repMin),
      trend: 'reduzir',
      message: `Na última vez a maioria das séries ficou abaixo de ${pr.repMin} repetições. Reduza para ~${next} kg e foque na técnica — progredir depois é mais rápido do que insistir.`,
    };
  }

  const targets = Array.from({ length: nSets }, (_, i) => {
    const prev = last[i]?.reps ?? last[last.length - 1].reps;
    return Math.min(pr.repMax, prev + 1);
  });
  return {
    weight: topWeight,
    repsTarget: targets,
    trend: 'manter',
    message: `Mantenha ${topWeight} kg e tente +1 repetição por série (meta: chegar a ${pr.repMax} em todas para subir a carga).`,
  };
}

/* ───────────── Métricas ───────────── */

/** 1RM estimado (Epley). Só faz sentido até ~12 reps; acima disso limitamos. */
export function e1rm(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  return weight * (1 + Math.min(reps, 15) / 30);
}

export function bestE1rm(sets: { weight: number | null; reps: number | null; done: boolean }[]): number {
  return Math.max(0, ...sets.filter((s) => s.done).map((s) => e1rm(s.weight ?? 0, s.reps ?? 0)));
}
