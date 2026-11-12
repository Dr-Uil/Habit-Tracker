import { describe, expect, it } from 'vitest';
import { weeklySetsHistory, workoutsInWeek, weekStart } from '../stats';
import { generateProgram } from '../generator';
import type { Profile, WorkoutLog } from '../../types';
import { baseQ } from './fixtures';

const program = generateProgram(baseQ);
function w(finished: Date, free = false): WorkoutLog {
  return {
    id: Math.random().toString(),
    programId: free ? 'avulso' : program.id,
    free: free || undefined,
    sessionId: 's',
    sessionName: 'A',
    startedAt: finished.toISOString(),
    finishedAt: finished.toISOString(),
    blockWeek: 1,
    deload: false,
    exercises: [{ key: 'k', exerciseId: 'supino_halter', sets: [{ weight: 20, reps: 10, done: true }, { weight: 20, reps: 10, done: true }, { weight: 20, reps: 10, done: false }] }],
  };
}
const profile = (workouts: WorkoutLog[]): Profile => ({ id: 'p', createdAt: '', color: '#fff', questionnaire: baseQ, program, workouts, bodyLogs: [], cardioLogs: [] });

describe('contagem da semana', () => {
  it('conta o treino salvo hoje, os avulsos e os registrados em dias anteriores da mesma semana', () => {
    const now = new Date();
    const monday = weekStart(now);
    const lastWeek = new Date(monday.getTime() - 86400000);
    const p = profile([w(lastWeek), w(new Date(monday.getTime() + 3600000), true), w(now)]);
    expect(workoutsInWeek(p)).toHaveLength(2);
    const wk = weeklySetsHistory(p, 1)[0];
    expect(wk.sets).toBe(4); // só séries marcadas como feitas
    expect(wk.byMuscle.peito).toBe(4);
  });
});
