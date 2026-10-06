import { PRINCIPLES, REFERENCES, RIR_SCALE } from '../data/science';
import { Card, SectionTitle } from '../components/ui';

const refIndex = Object.fromEntries(REFERENCES.map((r, i) => [r.id, i + 1]));

export function GuideView() {
  return (
    <div className="space-y-4">
      <Card className="text-sm leading-relaxed text-slate-300">
        Este app monta o treino com base em <b>revisões sistemáticas e meta-análises</b> — o nível mais alto de evidência em ciência do exercício. Abaixo, o que foi usado e por quê. Os números entre colchetes remetem às referências no fim da página.
      </Card>

      <div>
        <SectionTitle>Como usar o app no treino</SectionTitle>
        <Card className="space-y-2 text-sm text-slate-300">
          <p>
            <b>1.</b> Toque em <b>Começar treino</b>. Cada exercício mostra séries × repetições, a meta de esforço (RIR) e a carga sugerida.
          </p>
          <p>
            <b>2.</b> Faça a série, ajuste kg e repetições e toque em <b>✓</b>. O cronômetro de descanso começa sozinho e vibra/apita no fim.
          </p>
          <p>
            <b>3.</b> Se conseguir, anote o <b>RIR</b> (quantas repetições ainda sairiam). Ajuda a calibrar a intensidade.
          </p>
          <p>
            <b>4.</b> Aparelho ocupado? Toque em 🔄 para trocar por uma alternativa equivalente.
          </p>
          <p>
            <b>5.</b> Ao finalizar, o app calcula a carga do próximo treino: bateu o topo da faixa em todas as séries → sobe a carga; senão → tenta +1 repetição.
          </p>
        </Card>
      </div>

      <div>
        <SectionTitle>Escala de esforço (RIR)</SectionTitle>
        <Card className="space-y-1.5 text-sm">
          {RIR_SCALE.map((r) => (
            <div key={r.rir} className="flex gap-3">
              <span className="w-7 font-bold text-accent">{r.rir}</span>
              <span className="text-slate-300">{r.label}</span>
            </div>
          ))}
          <p className="pt-2 text-xs text-slate-500">
            Dica: quem está começando costuma subestimar o quanto aguenta. De vez em quando, na última série de um exercício isolado (ex.: cadeira extensora), vá até a falha para calibrar sua percepção.
          </p>
        </Card>
      </div>

      <div>
        <SectionTitle>Técnica que faz diferença</SectionTitle>
        <Card className="space-y-2 text-sm text-slate-300">
          <p>🐢 <b>Descida controlada</b> (~2–3 s) e subida firme. Não precisa ser superlenta: cadências entre ~0,5 e 8 s por repetição dão hipertrofia parecida [{refIndex.schoenfeld2015tempo}].</p>
          <p>📏 <b>Amplitude completa</b>, com ênfase no alongamento (parte de baixo do movimento) — é onde está o maior estímulo.</p>
          <p>🔥 <b>Aquecimento:</b> 3–5 min de cardio leve + 1–3 séries de aproximação no primeiro exercício de cada grupo muscular.</p>
          <p>🩹 <b>Dor articular ≠ queimação muscular.</b> Dor pontual na articulação: pare, troque o exercício e, se persistir, procure um profissional.</p>
        </Card>
      </div>

      <div>
        <SectionTitle>A ciência por trás do seu plano</SectionTitle>
        <div className="space-y-2">
          {PRINCIPLES.map((p) => (
            <Card key={p.title}>
              <div className="font-semibold">
                {p.icon} {p.title}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">{p.body}</p>
              <div className="mt-2 text-xs text-slate-500">Referências: {p.refs.map((r) => `[${refIndex[r]}]`).join(' ')}</div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>Referências</SectionTitle>
        <Card>
          <ol className="space-y-2 text-xs leading-relaxed text-slate-400">
            {REFERENCES.map((r, i) => (
              <li key={r.id} className="flex gap-2">
                <span className="shrink-0 text-slate-500">[{i + 1}]</span>
                <span>{r.text}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <p className="px-2 pb-4 text-center text-xs text-slate-600">
        Conteúdo educativo. Antes de iniciar um programa de exercícios, especialmente com doenças cardiovasculares, metabólicas, lesões ou gestação, consulte um médico. Um profissional de educação física pode corrigir sua técnica presencialmente.
      </p>
    </div>
  );
}
