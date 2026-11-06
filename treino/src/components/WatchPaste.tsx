import { useState } from 'react';
import type { WatchData } from '../types';
import { parseWatchText } from '../logic/watch';
import { Button, Sheet } from './ui';

/** Botão que lê o que o atalho do iPhone copiou e preenche FC/calorias/tempo. */
export function WatchPaste({ onData }: { onData: (d: WatchData) => void }) {
  const [status, setStatus] = useState<'idle' | 'ok' | 'manual' | 'fail'>('idle');
  const [help, setHelp] = useState(false);

  const apply = (text: string) => {
    const d = parseWatchText(text);
    if (d) {
      onData(d);
      setStatus('ok');
    } else setStatus('fail');
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) apply(text);
      else setStatus('manual');
    } catch {
      setStatus('manual');
    }
  };

  return (
    <div className="mb-3">
      <Button variant="secondary" full onClick={paste}>
        ⌚ Colar dados do relógio
      </Button>
      {status === 'ok' && <p className="mt-1.5 text-xs text-emerald-300">✓ Dados colados. Confira os campos abaixo.</p>}
      {(status === 'manual' || status === 'fail') && (
        <div className="mt-2">
          <p className="mb-1 text-xs text-amber-300">
            {status === 'fail' ? 'Não encontrei dados no texto copiado. Rode o atalho “Dados do treino” e tente de novo, ou cole aqui:' : 'Toque e segure no campo abaixo → “Colar”:'}
          </p>
          <textarea
            rows={2}
            onChange={(e) => e.target.value.trim() && apply(e.target.value)}
            placeholder="cole aqui o texto do atalho"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-sm outline-none focus:border-accent"
          />
        </div>
      )}
      <button onClick={() => setHelp(true)} className="mt-1.5 text-xs text-accent underline">
        Como criar o atalho no iPhone (uma vez só)
      </button>
      {help && <ShortcutHelp onClose={() => setHelp(false)} />}
    </div>
  );
}

const STEPS: { t: string; d?: string }[] = [
  { t: 'Abra o app Atalhos → toque em “+” → dê o nome “Dados do treino”.' },
  { t: 'Adicione “Pedir Entrada”', d: 'Tipo: Número · Pergunta: “Quantos minutos durou o treino?” · Resposta padrão: 60.' },
  { t: 'Adicione “Ajustar Data”', d: 'Subtrair [Entrada Fornecida] minutos de [Data Atual].' },
  { t: 'Adicione “Encontrar Amostras de Saúde”', d: 'Filtros: Tipo é “Frequência Cardíaca” · Data de Início é posterior a [Data Ajustada].' },
  { t: 'Adicione “Obter Detalhes de Amostras de Saúde”', d: 'Detalhe: Valor.' },
  { t: 'Adicione “Calcular Estatísticas” → Média', d: 'Depois “Definir Variável” com o nome fcm.' },
  { t: 'Adicione de novo “Calcular Estatísticas” → Máximo', d: 'Entrada: o mesmo Valor do passo 5. Depois “Definir Variável” com o nome fcmax.' },
  { t: 'Repita os passos 4 e 5 com Tipo “Energia Ativa”', d: 'Depois “Calcular Estatísticas” → Soma e “Definir Variável” com o nome kcal.' },
  { t: 'Adicione “Texto” com exatamente:', d: 'treino fcm=[fcm] fcmax=[fcmax] kcal=[kcal] min=[Entrada Fornecida]  (os colchetes são as variáveis — toque nelas na barra acima do teclado).' },
  { t: 'Adicione “Copiar para Área de Transferência”.' },
  { t: 'Adicione “Mostrar Notificação”', d: '“Dados copiados! Volte ao Treino e toque em Colar dados do relógio.”' },
];

function ShortcutHelp({ onClose }: { onClose: () => void }) {
  return (
    <Sheet open onClose={onClose} title="Atalho “Dados do treino”">
      <div className="space-y-4 text-sm text-slate-300">
        <p>
          O app Atalhos lê do app <b>Saúde</b> os batimentos e as calorias do período do treino e copia para o Treino. Funciona com o <b>Apple Watch</b> e com a <b>Mi Band</b>, se o app dela (Mi Fitness/Zepp Life) estiver
          enviando dados ao Saúde.
        </p>
        <ol className="space-y-2">
          {STEPS.map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="w-5 shrink-0 font-bold text-accent">{i + 1}</span>
              <span>
                <b>{s.t}</b>
                {s.d && <span className="block text-xs text-slate-400">{s.d}</span>}
              </span>
            </li>
          ))}
        </ol>
        <div className="rounded-xl bg-slate-950 p-3 text-xs leading-relaxed text-slate-400">
          <b className="text-slate-200">Como usar no dia a dia</b>
          <br />
          1. No relógio, inicie um treino no app <b>Treino</b> (ex.: “Musculação Tradicional”) — assim ele mede os batimentos o tempo todo.
          <br />
          2. Ao terminar, rode o atalho (pelo app Atalhos, pela tela inicial ou dizendo “E aí Siri, dados do treino”).
          <br />
          3. Volte ao Treino → Finalizar → “⌚ Colar dados do relógio”.
          <br />
          Na 1ª vez o iPhone pede permissão para o atalho ler o Saúde: toque em Permitir. Os nomes das ações podem variar um pouco conforme a versão do iOS.
        </div>
      </div>
    </Sheet>
  );
}
