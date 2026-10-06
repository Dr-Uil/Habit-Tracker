import { describe, expect, it } from 'vitest';
import { nutritionPlan, weightTrend, trendAdvice } from '../nutrition';
import { baseQ } from './fixtures';

describe('nutritionPlan', () => {
  it('fecha as calorias com os macros', () => {
    const n = nutritionPlan(baseQ);
    const kcal = n.proteinG * 4 + n.carbG * 4 + n.fatG * 9;
    expect(Math.abs(kcal - n.kcal)).toBeLessThan(40);
  });
  it('déficit para emagrecimento e superávit para hipertrofia (pessoa magra)', () => {
    const lean = { ...baseQ, weightKg: 70, heightCm: 178 };
    expect(nutritionPlan({ ...lean, goal: 'emagrecimento' }).kcal).toBeLessThan(nutritionPlan({ ...lean, goal: 'hipertrofia' }).kcal);
    expect(nutritionPlan({ ...lean, goal: 'hipertrofia' }).adjustmentPct).toBeGreaterThan(0);
  });
  it('proteína entre 1,6 e 2,4 g/kg', () => {
    for (const goal of ['hipertrofia', 'recomposicao', 'emagrecimento', 'condicionamento'] as const) {
      const n = nutritionPlan({ ...baseQ, weightKg: 70, goal });
      expect(n.proteinG / 70).toBeGreaterThanOrEqual(1.6);
      expect(n.proteinG / 70).toBeLessThanOrEqual(2.4);
    }
  });
});

describe('weightTrend', () => {
  it('calcula a tendência semanal', () => {
    const logs = [0, 7, 14, 21].map((d, i) => ({ date: `2026-03-${String(1 + d).padStart(2, '0')}`, weightKg: 80 - i * 0.5 }));
    const t = weightTrend(logs)!;
    expect(t.weeklyKg).toBeCloseTo(-0.5, 2);
    expect(trendAdvice({ ...baseQ, goal: 'emagrecimento' }, t).tone).toBe('ok');
  });
  it('precisa de dados suficientes', () => {
    expect(weightTrend([{ date: '2026-03-01', weightKg: 80 }])).toBeNull();
  });
});
