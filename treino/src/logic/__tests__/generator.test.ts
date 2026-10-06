import { describe, expect, it } from 'vitest';
import { generateProgram, finisherBase } from '../generator';
import { getExercise, isAvailable } from '../../data/exercises';
import type { EquipmentAccess, Experience, Goal, Questionnaire } from '../../types';
import { baseQ } from './fixtures';

const DAYS = [2, 3, 4, 5, 6];
const MINUTES = [40, 50, 60, 70, 80];
const LEVELS: Experience[] = ['iniciante', 'intermediario', 'avancado'];
const GOALS: Goal[] = ['hipertrofia', 'recomposicao', 'emagrecimento', 'condicionamento'];
const ACCESS: EquipmentAccess[] = ['academia', 'halteres', 'casa'];

function* combos(): Generator<Questionnaire> {
  for (const daysPerWeek of DAYS)
    for (const sessionMinutes of MINUTES)
      for (const experience of LEVELS)
        for (const goal of GOALS)
          for (const equipment of ACCESS) yield { ...baseQ, daysPerWeek, sessionMinutes, experience, goal, equipment };
}

describe('generateProgram', () => {
  it('cria uma sessão por dia de treino e respeita o tempo disponível', () => {
    for (const q of combos()) {
      const p = generateProgram(q);
      expect(p.sessions).toHaveLength(q.daysPerWeek);
      for (const s of p.sessions) {
        expect(s.exercises.length).toBeGreaterThanOrEqual(3);
        // tolerância de 3 min sobre o tempo informado
        expect(s.estimatedMinutes, `${q.daysPerWeek}d ${q.sessionMinutes}min ${q.experience} ${q.goal} ${q.equipment} ${s.name}`).toBeLessThanOrEqual(q.sessionMinutes + 3);
      }
    }
  });

  it('só usa exercícios disponíveis para o equipamento e sem repetir na mesma sessão', () => {
    for (const q of combos()) {
      const p = generateProgram(q);
      for (const s of p.sessions) {
        const ids = s.exercises.map((e) => e.exerciseId);
        expect(new Set(ids).size).toBe(ids.length);
        for (const id of ids) expect(isAvailable(getExercise(id), q.equipment)).toBe(true);
      }
    }
  });

  it('treina cada grande grupo muscular pelo menos 2× por semana com 60 min na academia', () => {
    for (const daysPerWeek of DAYS) {
      const p = generateProgram({ ...baseQ, daysPerWeek, sessionMinutes: 60 });
      for (const mu of ['peito', 'costas', 'quadriceps', 'posteriores', 'gluteos'] as const) {
        const freq = p.sessions.filter((s) => s.exercises.some((e) => (getExercise(e.exerciseId).muscles[mu] ?? 0) >= 0.5)).length;
        expect(freq, `${daysPerWeek} dias, ${mu}`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('mantém o volume semanal dentro (ou perto) da faixa alvo', () => {
    const p = generateProgram({ ...baseQ, daysPerWeek: 4, sessionMinutes: 70 });
    for (const mu of ['peito', 'costas', 'quadriceps', 'gluteos'] as const) {
      expect(p.weeklyVolume[mu]!).toBeGreaterThanOrEqual(p.volumeTarget[mu][0] - 2);
      expect(p.weeklyVolume[mu]!).toBeLessThanOrEqual(p.volumeTarget[mu][1] + 2);
    }
  });

  it('evita exercícios contraindicados pelas limitações', () => {
    const p = generateProgram({ ...baseQ, limitations: ['joelho', 'ombro', 'lombar'] });
    for (const s of p.sessions)
      for (const e of s.exercises) {
        const avoid = getExercise(e.exerciseId).avoid ?? [];
        expect(avoid.some((l) => ['joelho', 'ombro', 'lombar'].includes(l))).toBe(false);
      }
  });

  it('dá mais volume aos músculos prioritários', () => {
    const normal = generateProgram({ ...baseQ, sessionMinutes: 70 });
    const prio = generateProgram({ ...baseQ, sessionMinutes: 70, priorityMuscles: ['gluteos'] });
    expect(prio.weeklyVolume.gluteos!).toBeGreaterThan(normal.weeklyVolume.gluteos!);
  });

  it('reserva tempo de cardio conforme o objetivo', () => {
    expect(finisherBase({ ...baseQ, goal: 'emagrecimento', sessionMinutes: 60 })).toBe(10);
    expect(finisherBase({ ...baseQ, goal: 'emagrecimento', sessionMinutes: 75 })).toBe(15);
    expect(finisherBase({ ...baseQ, goal: 'hipertrofia', sessionMinutes: 60 })).toBe(0);
    expect(finisherBase({ ...baseQ, goal: 'emagrecimento', sessionMinutes: 45 })).toBe(0);
  });
});
