import { describe, expect, it } from 'vitest';
import { feedbackContext, parseFeedback } from '../feedback';
import { suggest } from '../progression';
import type { Prescription, WorkoutLog } from '../../types';

const now = new Date('2026-11-04T20:00:00Z').getTime();
const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString();

function log(exerciseId: string, sets: [number, number][], d: number, notes?: string, rpe?: number): WorkoutLog {
  return {
    id: Math.random().toString(),
    programId: 'p',
    sessionId: 's',
    sessionName: 'A',
    startedAt: daysAgo(d),
    finishedAt: daysAgo(d),
    blockWeek: 1,
    deload: false,
    exercises: [{ key: 'k', exerciseId, sets: sets.map(([weight, reps]) => ({ weight, reps, done: true })) }],
    notes,
    rpe,
  };
}

const supino: Prescription = { key: 'k', exerciseId: 'supino_halter', pattern: 'h_push', role: 'main', sets: 3, repMin: 6, repMax: 10, restSec: 150 };
const hack: Prescription = { key: 'h', exerciseId: 'agachamento_hack', pattern: 'squat', role: 'main', sets: 3, repMin: 6, repMax: 10, restSec: 150 };

describe('parseFeedback', () => {
  it('entende dor por região, cansaço e treino fácil', () => {
    expect(parseFeedback({ notes: 'Senti dor no joelho direito' }).pain).toEqual(['joelho']);
    expect(parseFeedback({ notes: 'Ombro incomodando no supino' }).pain).toEqual(['ombro']);
    expect(parseFeedback({ notes: 'sem dor hoje' }).pain).toEqual([]);
    expect(parseFeedback({ notes: 'Dormi mal' }).fatigue).toBe(true);
    expect(parseFeedback({ rpe: 10 }).fatigue).toBe(true);
    expect(parseFeedback({ notes: 'Treino fácil' }).easy).toBe(true);
  });
});

describe('suggest com observações', () => {
  it('sem observações, igual à dupla progressão', () => {
    const ws = [log('supino_halter', [[20, 10], [20, 10], [20, 10]], 2)];
    expect(suggest(supino, ws, false, 2, feedbackContext(ws, now)).weight).toBe(22);
  });
  it('dor no ombro: não sobe e reduz ~10% no supino, mas não mexe no agachamento', () => {
    const ws = [log('supino_halter', [[20, 10], [20, 10], [20, 10]], 2, 'dor no ombro'), log('agachamento_hack', [[100, 10], [100, 10], [100, 10]], 1)];
    const ctx = feedbackContext(ws, now);
    const s = suggest(supino, ws, false, 2, ctx);
    expect(s.trend).toBe('cuidado');
    expect(s.weight!).toBeLessThan(20);
    expect(suggest(hack, ws, false, 2, ctx).trend).toBe('subir');
  });
  it('“sem dor” num treino posterior libera a progressão', () => {
    const ws = [log('supino_halter', [[20, 10], [20, 10], [20, 10]], 4, 'dor no ombro'), log('supino_halter', [[20, 10], [20, 10], [20, 10]], 1, 'sem dor')];
    expect(suggest(supino, ws, false, 2, feedbackContext(ws, now)).trend).toBe('subir');
  });
  it('cansaço segura a carga em vez de subir', () => {
    const ws = [log('supino_halter', [[20, 10], [20, 10], [20, 10]], 1, 'dormi mal, cansado')];
    const s = suggest(supino, ws, false, 2, feedbackContext(ws, now));
    expect(s.trend).toBe('manter');
    expect(s.weight).toBe(20);
  });
  it('treino fácil libera subir a 1 repetição do topo', () => {
    const ws = [log('supino_halter', [[20, 9], [20, 9], [20, 9]], 1, undefined, 6)];
    expect(suggest(supino, ws, false, 2, feedbackContext(ws, now)).trend).toBe('subir');
    expect(suggest(supino, ws, false, 2).trend).toBe('manter');
  });
  it('cansaço em 2 de 3 treinos sugere modo leve; dor antiga (>10 dias) expira', () => {
    const ws = [log('supino_halter', [[20, 8]], 12, 'dor no ombro'), log('supino_halter', [[20, 8]], 5, undefined, 9), log('supino_halter', [[20, 8]], 2, 'exausto')];
    const ctx = feedbackContext(ws, now);
    expect(ctx.overreaching).toBe(true);
    expect(ctx.painRegions).toEqual([]);
  });
});
