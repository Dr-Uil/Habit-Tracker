import type { BodyLog, Goal, Questionnaire } from '../types';

/* ────────────────────────────────────────────────────────────────────────────
 * Estimativas (não substituem nutricionista):
 *  • Metabolismo basal: Mifflin-St Jeor (1990) ou Katch-McArdle se % de gordura informado.
 *  • Proteína: 1,6–2,2 g/kg para ganho de massa (Morton 2018); em déficit, faixa alta
 *    (~2,0–2,4 g/kg; Helms 2014). Obesidade: calculado sobre um “peso de referência”.
 *  • Distribuição: ~0,4 g/kg por refeição em 3–5 refeições (Schoenfeld & Aragon 2018).
 *  • Gordura ≥ ~0,8 g/kg (mín. ~22% das kcal) para saúde hormonal; carboidrato completa.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface NutritionPlan {
  method: string;
  bmr: number;
  tdee: number;
  kcal: number;
  adjustmentPct: number;
  adjustmentLabel: string;
  refWeight: number;
  proteinG: number;
  proteinRange: [number, number];
  fatG: number;
  carbG: number;
  fiberG: number;
  waterL: number;
  meals: number;
  proteinPerMeal: number;
  carbPerMeal: number;
  caffeineMg: [number, number];
  expectedRate: string;
  warnings: string[];
}

const ACTIVITY: Record<Questionnaire['activityLevel'], number> = {
  sedentario: 1.2,
  leve: 1.35,
  moderado: 1.5,
  alto: 1.65,
};

export function bmi(weightKg: number, heightCm: number) {
  const h = heightCm / 100;
  return weightKg / (h * h);
}

export function nutritionPlan(q: Questionnaire, currentWeight = q.weightKg): NutritionPlan {
  const w = currentWeight;
  const h = q.heightCm;
  const warnings: string[] = [];
  const imc = bmi(w, h);

  let bmr: number;
  let method: string;
  if (q.bodyFatPct && q.bodyFatPct > 3 && q.bodyFatPct < 60) {
    const lbm = w * (1 - q.bodyFatPct / 100);
    bmr = 370 + 21.6 * lbm;
    method = 'Katch-McArdle (usa massa magra)';
  } else {
    bmr = 10 * w + 6.25 * h - 5 * q.age + (q.sex === 'M' ? 5 : -161);
    method = 'Mifflin-St Jeor';
  }
  const factor = ACTIVITY[q.activityLevel] + 0.025 * q.daysPerWeek + 0.015 * q.extraCardioDays;
  const tdee = bmr * factor;

  const highFat = (q.bodyFatPct ?? 0) > (q.sex === 'M' ? 22 : 32) || imc >= 28;
  let adj = 0;
  let label = 'manutenção';
  switch (q.goal) {
    case 'hipertrofia':
      if (highFat) {
        adj = -0.05;
        label = '−5% (recomposição leve)';
        warnings.push('Com o percentual de gordura/IMC atual, um superávit tende a acumular mais gordura. Sugerimos um leve déficit (recomposição): quem está começando ou retornando ganha massa muscular mesmo assim.');
      } else {
        adj = q.experience === 'iniciante' ? 0.1 : q.experience === 'intermediario' ? 0.07 : 0.05;
        label = `+${Math.round(adj * 100)}% (superávit leve)`;
      }
      break;
    case 'recomposicao':
      adj = imc < 22 ? 0 : -0.1;
      label = adj === 0 ? 'manutenção' : '−10% (déficit leve)';
      break;
    case 'emagrecimento':
      adj = -0.2;
      label = '−20% (déficit moderado)';
      break;
    case 'condicionamento':
      adj = 0;
      label = 'manutenção';
      break;
  }
  let kcal = tdee * (1 + adj);
  if (q.goal === 'emagrecimento' && tdee - kcal > 750) kcal = tdee - 750;
  const floor = Math.max(bmr, q.sex === 'M' ? 1500 : 1200);
  if (kcal < floor) {
    kcal = floor;
    warnings.push('As calorias foram limitadas a um mínimo seguro. Déficits muito grandes aumentam a perda de massa muscular.');
  }

  const refWeight = imc > 30 ? 27.5 * (h / 100) ** 2 : w;
  const perKg = q.goal === 'emagrecimento' || q.goal === 'recomposicao' ? 2.0 : q.goal === 'hipertrofia' ? 1.8 : 1.6;
  const proteinG = Math.round(refWeight * perKg);
  const proteinRange: [number, number] = [Math.round(refWeight * 1.6), Math.round(refWeight * (adj < 0 ? 2.4 : 2.2))];

  let fatG = Math.max(0.8 * refWeight, (0.22 * kcal) / 9);
  fatG = Math.min(fatG, (0.35 * kcal) / 9);
  let carbG = (kcal - proteinG * 4 - fatG * 9) / 4;
  if (carbG < 80) {
    carbG = 80;
    fatG = Math.max(0, (kcal - proteinG * 4 - carbG * 4) / 9);
  }
  const meals = 4;

  const rateByGoal: Record<Goal, string> = {
    emagrecimento: `perder ~0,5–1% do peso por semana (≈ ${(w * 0.005).toFixed(1).replace('.', ',')}–${(w * 0.01).toFixed(1).replace('.', ',')} kg/semana)`,
    recomposicao: 'peso quase estável (±0,25%/semana), com a cintura diminuindo e as cargas subindo',
    hipertrofia: highFat
      ? 'peso estável ou caindo devagar, com cargas subindo'
      : q.experience === 'iniciante'
        ? `ganhar ~1–1,5% do peso por mês (≈ ${(w * 0.01).toFixed(1).replace('.', ',')}–${(w * 0.015).toFixed(1).replace('.', ',')} kg/mês)`
        : q.experience === 'intermediario'
          ? `ganhar ~0,5–1% do peso por mês (≈ ${(w * 0.005).toFixed(1).replace('.', ',')}–${(w * 0.01).toFixed(1).replace('.', ',')} kg/mês)`
          : 'ganhar ~0,25–0,5% do peso por mês',
    condicionamento: 'peso estável, com melhora do fôlego e da frequência cardíaca de repouso',
  };

  return {
    method,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    kcal: Math.round(kcal / 10) * 10,
    adjustmentPct: adj,
    adjustmentLabel: label,
    refWeight: Math.round(refWeight),
    proteinG,
    proteinRange,
    fatG: Math.round(fatG),
    carbG: Math.round(carbG),
    fiberG: Math.round((kcal / 1000) * 14),
    waterL: Math.round(w * 0.035 * 10) / 10,
    meals,
    proteinPerMeal: Math.round(proteinG / meals),
    carbPerMeal: Math.round(carbG / meals),
    caffeineMg: [Math.round(w * 3), Math.round(w * 6)],
    expectedRate: rateByGoal[q.goal],
    warnings,
  };
}

/* ───────────── Tendência de peso ───────────── */

export interface WeightTrend {
  weeklyKg: number;
  weeklyPct: number;
  days: number;
  latest: number;
}

export function weightTrend(logs: BodyLog[]): WeightTrend | null {
  const sorted = [...logs].sort((x, y) => x.date.localeCompare(y.date));
  if (sorted.length < 3) return null;
  const lastDate = new Date(sorted[sorted.length - 1].date + 'T12:00:00').getTime();
  const recent = sorted.filter((l) => lastDate - new Date(l.date + 'T12:00:00').getTime() <= 28 * 86400000);
  if (recent.length < 3) return null;
  const xs = recent.map((l) => (new Date(l.date + 'T12:00:00').getTime() - lastDate) / 86400000);
  const ys = recent.map((l) => l.weightKg);
  const span = xs[xs.length - 1] - xs[0];
  if (span < 10) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0;
  let den = 0;
  xs.forEach((x, i) => {
    num += (x - mx) * (ys[i] - my);
    den += (x - mx) ** 2;
  });
  const slope = den ? num / den : 0;
  const weeklyKg = slope * 7;
  const latest = ys[ys.length - 1];
  return { weeklyKg, weeklyPct: (weeklyKg / latest) * 100, days: Math.round(span), latest };
}

export function trendAdvice(q: Questionnaire, t: WeightTrend | null): { tone: 'ok' | 'warn' | 'info'; text: string } {
  if (!t)
    return {
      tone: 'info',
      text: 'Registre seu peso 3–4×/semana (de manhã, em jejum, após ir ao banheiro) por ~2 semanas para o app avaliar se as calorias estão certas.',
    };
  const pct = t.weeklyPct;
  const fmt = `${pct > 0 ? '+' : ''}${pct.toFixed(2).replace('.', ',')}%/semana (${t.weeklyKg > 0 ? '+' : ''}${t.weeklyKg.toFixed(2).replace('.', ',')} kg)`;
  switch (q.goal) {
    case 'emagrecimento':
      if (pct < -1.1) return { tone: 'warn', text: `Tendência ${fmt}: rápido demais, maior risco de perder músculo. Some ~150–200 kcal/dia (de preferência carboidrato perto do treino).` };
      if (pct <= -0.4) return { tone: 'ok', text: `Tendência ${fmt}: no alvo. Mantenha!` };
      return { tone: 'warn', text: `Tendência ${fmt}: perda lenta/estagnada. Reduza ~150–200 kcal/dia ou some ~2.000 passos/dia. Confira também se o registro está fiel (beliscos, óleo, bebidas).` };
    case 'hipertrofia': {
      const hi = q.experience === 'iniciante' ? 0.4 : q.experience === 'intermediario' ? 0.25 : 0.12;
      if (pct > hi * 1.5) return { tone: 'warn', text: `Tendência ${fmt}: ganho rápido demais (provavelmente mais gordura). Reduza ~100–150 kcal/dia.` };
      if (pct < 0.03) return { tone: 'warn', text: `Tendência ${fmt}: peso não está subindo. Some ~150 kcal/dia (ex.: 1 banana + 1 colher de pasta de amendoim).` };
      return { tone: 'ok', text: `Tendência ${fmt}: ganho no ritmo ideal para massa magra.` };
    }
    case 'recomposicao':
      if (pct < -0.6) return { tone: 'warn', text: `Tendência ${fmt}: perdendo rápido para uma recomposição. Some ~100–200 kcal/dia.` };
      if (pct > 0.3) return { tone: 'warn', text: `Tendência ${fmt}: subindo. Reduza ~100–150 kcal/dia.` };
      return { tone: 'ok', text: `Tendência ${fmt}: estável — ótimo para recomposição. Acompanhe a cintura e as cargas.` };
    default:
      if (Math.abs(pct) > 0.4) return { tone: 'warn', text: `Tendência ${fmt}: ajuste ~100–150 kcal/dia para estabilizar.` };
      return { tone: 'ok', text: `Tendência ${fmt}: estável.` };
  }
}

/* ───────────── Alimentos (porções aproximadas, Tabela TACO/rotulagem) ───────────── */

export const PROTEIN_FOODS: { food: string; portion: string; protein: number }[] = [
  { food: 'Peito de frango grelhado', portion: '100 g', protein: 31 },
  { food: 'Patinho/carne magra grelhada', portion: '100 g', protein: 32 },
  { food: 'Tilápia/peixe branco', portion: '100 g', protein: 26 },
  { food: 'Atum em água (drenado)', portion: '1 lata (~120 g)', protein: 28 },
  { food: 'Ovo inteiro', portion: '1 unidade', protein: 6 },
  { food: 'Claras', portion: '3 unidades', protein: 10 },
  { food: 'Whey protein', portion: '1 dose (30 g)', protein: 22 },
  { food: 'Iogurte proteico/grego zero', portion: '1 pote (~160 g)', protein: 13 },
  { food: 'Queijo cottage', portion: '100 g', protein: 11 },
  { food: 'Leite', portion: '1 copo (240 ml)', protein: 8 },
  { food: 'Queijo minas frescal', portion: '2 fatias (60 g)', protein: 10 },
  { food: 'Feijão cozido', portion: '1 concha (100 g)', protein: 5 },
  { food: 'Lentilha/grão-de-bico cozido', portion: '100 g', protein: 7 },
  { food: 'Tofu', portion: '100 g', protein: 10 },
];

export const CARB_FOODS: { food: string; portion: string; carbs: number }[] = [
  { food: 'Arroz cozido', portion: '4 col. sopa (100 g)', carbs: 28 },
  { food: 'Feijão cozido', portion: '1 concha (100 g)', carbs: 14 },
  { food: 'Batata-doce/inglesa cozida', portion: '100 g', carbs: 19 },
  { food: 'Mandioca/aipim cozido', portion: '100 g', carbs: 30 },
  { food: 'Macarrão cozido', portion: '100 g', carbs: 30 },
  { food: 'Pão francês', portion: '1 unidade (50 g)', carbs: 29 },
  { food: 'Pão integral', portion: '2 fatias', carbs: 24 },
  { food: 'Tapioca (goma)', portion: '2 col. sopa (30 g)', carbs: 26 },
  { food: 'Aveia em flocos', portion: '3 col. sopa (30 g)', carbs: 17 },
  { food: 'Banana', portion: '1 média', carbs: 22 },
  { food: 'Fruta (maçã, laranja)', portion: '1 média', carbs: 15 },
];
