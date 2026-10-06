import { describe, expect, it } from 'vitest';
import { suggest, e1rm, blockInfo } from '../progression';
import { generateProgram } from '../generator';
import type { Prescription, Profile, WorkoutLog } from '../../types';
import { baseQ } from './fixtures';

const pr: Prescription = { key: 'k', exerciseId: 'supino_halter', pattern: 'h_push', role: 'main', sets: 3, repMin: 6, repMax: 10, restSec: 150 };

function log(sets: [number, number][], exerciseId = 'supino_halter'): WorkoutLog {
  return {
    id: Math.random().toString(),
    programId: 'p',
    sessionId: 's',
    sessionName: 'A',
    startedAt: '2026-01-01T10:00:00Z',
    finishedAt: '2026-01-01T11:00:00Z',
    blockWeek: 1,
    deload: false,
    exercises: [{ key: 'k', exerciseId, sets: sets.map(([weight, reps]) => ({ weight, reps, done: true })) }],
  };
}

describe('suggest (dupla progressão)', () => {
  it('sem histórico pede para escolher a carga', () => {
    const s = suggest(pr, [], false, 2);
    expect(s.trend).toBe('primeira');
    expect(s.weight).toBeNull();
  });
  it('sobe a carga quando bate o topo da faixa em todas as séries', () => {
    const s = suggest(pr, [log([[20, 10], [20, 10], [20, 10]])], false, 2);
    expect(s.trend).toBe('subir');
    expect(s.weight).toBe(22);
  });
  it('mantém a carga e pede +1 repetição dentro da faixa', () => {
    const s = suggest(pr, [log([[20, 9], [20, 8], [20, 7]])], false, 2);
    expect(s.trend).toBe('manter');
    expect(s.weight).toBe(20);
    expect(s.repsTarget).toEqual([10, 9, 8]);
  });
  it('reduz a carga quando a maioria das séries fica abaixo do mínimo', () => {
    const s = suggest(pr, [log([[30, 5], [30, 4], [30, 6]])], false, 2);
    expect(s.trend).toBe('reduzir');
    expect(s.weight!).toBeLessThan(30);
  });
  it('no deload mantém a carga e corta as séries pela metade', () => {
    const s = suggest(pr, [log([[20, 10], [20, 10], [20, 10]])], true, 4);
    expect(s.trend).toBe('deload');
    expect(s.weight).toBe(20);
    expect(s.repsTarget).toHaveLength(2);
  });
});

describe('e1rm', () => {
  it('usa Epley', () => {
    expect(e1rm(100, 10)).toBeCloseTo(133.33, 1);
    expect(e1rm(0, 10)).toBe(0);
  });
});

describe('blockInfo', () => {
  it('avança a semana a cada N treinos e faz deload na 6ª', () => {
    const program = generateProgram(baseQ);
    const mk = (n: number): Profile => ({
      id: 'x',
      createdAt: '',
      color: '#fff',
      questionnaire: baseQ,
      program,
      workouts: Array.from({ length: n }, () => ({ ...log([[10, 10]]), programId: program.id })),
      bodyLogs: [],
      cardioLogs: [],
    });
    expect(blockInfo(mk(0)).week).toBe(1);
    expect(blockInfo(mk(4)).week).toBe(2);
    expect(blockInfo(mk(20)).deload).toBe(true);
    expect(blockInfo(mk(24)).week).toBe(1);
    expect(blockInfo(mk(24)).block).toBe(2);
  });
});
