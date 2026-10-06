import { CARB_FOODS, PROTEIN_FOODS, nutritionPlan, trendAdvice, weightTrend } from '../logic/nutrition';
import { useProfile } from '../store';
import { Badge, Card, SectionTitle, cx } from '../components/ui';

function Macro({ label, grams, kcal, total, color }: { label: string; grams: number; kcal: number; total: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-semibold tabular-nums">
          {grams} g <span className="text-xs font-normal text-slate-500">({Math.round((kcal / total) * 100)}%)</span>
        </span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-slate-800">
        <div className="h-full rounded-full" style={{ width: `${(kcal / total) * 100}%`, background: color }} />
      </div>
    </div>
  );
}

export function NutritionView() {
  const { profile } = useProfile();
  const q = profile.questionnaire;
  const lastWeight = [...profile.bodyLogs].sort((a, b) => a.date.localeCompare(b.date)).pop()?.weightKg ?? q.weightKg;
  const n = nutritionPlan(q, lastWeight);
  const advice = trendAdvice(q, weightTrend(profile.bodyLogs));
  const lateTraining = q.preferredTime === 'tarde' || q.preferredTime === 'noite';

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Meta diária</div>
            <div className="text-4xl font-bold tabular-nums">
              {n.kcal.toLocaleString('pt-BR')} <span className="text-lg font-normal text-slate-400">kcal</span>
            </div>
          </div>
          <Badge tone="accent">{n.adjustmentLabel}</Badge>
        </div>
        <div className="mt-1 text-xs text-slate-500">
          Gasto estimado: {n.tdee.toLocaleString('pt-BR')} kcal/dia ({n.method}, peso {String(lastWeight).replace('.', ',')} kg)
        </div>
        <div className="mt-4 space-y-3">
          <Macro label="🥩 Proteína" grams={n.proteinG} kcal={n.proteinG * 4} total={n.kcal} color="#f472b6" />
          <Macro label="🍚 Carboidrato" grams={n.carbG} kcal={n.carbG * 4} total={n.kcal} color="#38bdf8" />
          <Macro label="🥑 Gordura" grams={n.fatG} kcal={n.fatG * 9} total={n.kcal} color="#fbbf24" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl bg-slate-950 p-2">
            <div className="text-slate-500">Fibras</div>
            <div className="text-base font-bold">{n.fiberG} g</div>
          </div>
          <div className="rounded-xl bg-slate-950 p-2">
            <div className="text-slate-500">Água</div>
            <div className="text-base font-bold">~{String(n.waterL).replace('.', ',')} L</div>
          </div>
          <div className="rounded-xl bg-slate-950 p-2">
            <div className="text-slate-500">Proteína/refeição</div>
            <div className="text-base font-bold">~{n.proteinPerMeal} g</div>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-400">
          Proteína: {n.proteinRange[0]}–{n.proteinRange[1]} g/dia é a faixa com evidência; o app sugere {n.proteinG} g. Ritmo esperado: {n.expectedRate}.
          {n.refWeight !== Math.round(lastWeight) && ` (Proteína calculada sobre peso de referência de ${n.refWeight} kg.)`}
        </p>
        {n.warnings.map((w) => (
          <p key={w} className="mt-2 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-200">
            {w}
          </p>
        ))}
      </Card>

      <Card className={cx(advice.tone === 'ok' && 'border-emerald-500/30', advice.tone === 'warn' && 'border-amber-500/30')}>
        <div className="text-xs uppercase tracking-wide text-slate-500">Ajuste automático pelas suas pesagens</div>
        <p className="mt-1 text-sm leading-relaxed text-slate-200">
          {advice.tone === 'ok' ? '✅ ' : advice.tone === 'warn' ? '⚠️ ' : 'ℹ️ '}
          {advice.text}
        </p>
      </Card>

      <div>
        <SectionTitle>Como montar o dia ({n.meals} refeições)</SectionTitle>
        <Card className="space-y-3 text-sm text-slate-300">
          <p>
            Cada refeição: <b>~{n.proteinPerMeal} g de proteína</b> + <b>~{n.carbPerMeal} g de carboidrato</b> + vegetais à vontade. Distribuir a proteína em 3–5 refeições aproveita melhor a síntese muscular.
          </p>
          <div className="rounded-xl bg-slate-950 p-3">
            <div className="mb-1 font-semibold">🍽️ Método do prato (para quem não quer contar)</div>
            <p className="text-xs text-slate-400">½ prato de vegetais/salada · ¼ de proteína (palma da mão = ~25–30 g de proteína) · ¼ de carboidrato (arroz, feijão, batata, mandioca) · 1 polegar de gordura boa (azeite, castanhas).</p>
          </div>
          <div className="space-y-2">
            <div className="rounded-xl bg-slate-950 p-3">
              <b>Café da manhã</b>
              <p className="text-xs text-slate-400">Ovos mexidos + pão integral/tapioca + fruta; ou iogurte proteico + aveia + whey.</p>
            </div>
            <div className="rounded-xl bg-slate-950 p-3">
              <b>Almoço</b>
              <p className="text-xs text-slate-400">Arroz + feijão + frango/carne/peixe + salada e legumes. O feijão com arroz é uma ótima base — some a carne magra.</p>
            </div>
            <div className="rounded-xl bg-slate-950 p-3">
              <b>Pré-treino {lateTraining ? '(lanche da tarde, 60–90 min antes)' : '(30–90 min antes)'}</b>
              <p className="text-xs text-slate-400">Carboidrato fácil + proteína: banana com aveia e whey/iogurte, ou pão com queijo/peito de peru. Evite muita gordura/fibra logo antes.</p>
            </div>
            <div className="rounded-xl bg-slate-950 p-3">
              <b>Pós-treino {lateTraining ? '(jantar)' : ''}</b>
              <p className="text-xs text-slate-400">Proteína (~{n.proteinPerMeal} g) + carboidrato para repor: carne/peixe + batata/mandioca/arroz + vegetais. Não precisa ser “na hora”: até ~2 h depois está ótimo.</p>
            </div>
            <div className="rounded-xl bg-slate-950 p-3">
              <b>Ceia (opcional)</b>
              <p className="text-xs text-slate-400">Iogurte, cottage ou leite: proteína de digestão lenta antes de dormir ajuda a fechar a meta do dia.</p>
            </div>
          </div>
        </Card>
      </div>

      <div>
        <SectionTitle>Fontes de proteína</SectionTitle>
        <Card className="divide-y divide-slate-800 p-0">
          {PROTEIN_FOODS.map((f) => (
            <div key={f.food} className="flex justify-between gap-3 px-4 py-2 text-sm">
              <span className="text-slate-300">
                {f.food} <span className="text-xs text-slate-500">· {f.portion}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums">{f.protein} g</span>
            </div>
          ))}
        </Card>
      </div>

      <div>
        <SectionTitle>Fontes de carboidrato</SectionTitle>
        <Card className="divide-y divide-slate-800 p-0">
          {CARB_FOODS.map((f) => (
            <div key={f.food} className="flex justify-between gap-3 px-4 py-2 text-sm">
              <span className="text-slate-300">
                {f.food} <span className="text-xs text-slate-500">· {f.portion}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums">{f.carbs} g</span>
            </div>
          ))}
        </Card>
      </div>

      <div>
        <SectionTitle>Suplementos com evidência forte</SectionTitle>
        <div className="space-y-2">
          <Card className="text-sm">
            <div className="font-semibold">💊 Creatina monoidratada — 3 a 5 g/dia</div>
            <p className="mt-1 text-slate-300">O suplemento mais estudado para força e massa muscular, seguro para adultos saudáveis. Todo dia, em qualquer horário (não precisa de “saturação”). Benefícios também para mulheres. Pode subir ~1 kg de água no início — é normal.</p>
          </Card>
          <Card className="text-sm">
            <div className="font-semibold">☕ Cafeína — {n.caffeineMg[0]}–{n.caffeineMg[1]} mg, 30–60 min antes</div>
            <p className="mt-1 text-slate-300">
              Melhora força e resistência. Comece pela dose menor (1 xícara de café coado ≈ 80–100 mg).
              {lateTraining && ' Como vocês treinam à tarde, atenção ao sono: cafeína pode atrapalhar por até ~8–9 h. Use dose pequena ou deixe para os treinos mais cedo.'}
            </p>
          </Card>
          <Card className="text-sm">
            <div className="font-semibold">🥛 Whey protein — se faltar proteína na comida</div>
            <p className="mt-1 text-slate-300">É comida prática, não mágica. Útil para bater a meta diária de proteína.</p>
          </Card>
          <Card className="text-sm text-slate-400">
            Sem evidência relevante para hipertrofia em pessoas bem alimentadas: BCAA, glutamina, “termogênicos”, “pré-hormonais”. Vitamina D e ferro apenas se exames indicarem deficiência.
          </Card>
        </div>
      </div>

      <div>
        <SectionTitle>Regras de ouro</SectionTitle>
        <Card className="space-y-2 text-sm text-slate-300">
          <p>✅ Bata a proteína todo dia — é o fator nutricional nº 1 para manter/ganhar músculo.</p>
          <p>✅ Durma 7–9 h: pouco sono reduz síntese muscular e aumenta a fome.</p>
          <p>✅ Álcool atrapalha a recuperação; se beber, que seja pouco e longe do treino.</p>
          <p>✅ Pese-se 3–4×/semana e olhe a média semanal. O app ajusta as calorias pela tendência.</p>
          <p>✅ 80/20: comida de verdade na maior parte do tempo; flexibilidade no resto ajuda a manter por anos.</p>
          <p className="text-xs text-slate-500">Estimativas educativas, não substituem avaliação de nutricionista/médico — especialmente com doenças crônicas, gestação ou uso de medicamentos.</p>
        </Card>
      </div>
    </div>
  );
}
