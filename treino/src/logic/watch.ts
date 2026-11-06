import type { WatchData } from '../types';

/* ────────────────────────────────────────────────────────────────────────────
 * Lê o texto copiado pelo atalho “Dados do treino” (app Atalhos do iPhone), ex.:
 *   "treino fcm=128,4 fcmax=165 kcal=410,2 min=62"
 * Também aceita rótulos por extenso (“FC média: 128”, “Calorias: 410”…).
 * ──────────────────────────────────────────────────────────────────────────── */

function toNumber(raw: string): number | undefined {
  let s = raw.trim();
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}\.\d{3}$/.test(s)) s = s.replace('.', ''); // 1.234 = mil duzentos e trinta e quatro
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

const NUM = '([0-9]+(?:[.,][0-9]+)*)';

function find(text: string, patterns: string[]): number | undefined {
  for (const p of patterns) {
    const m = text.match(new RegExp(`(?:^|[^a-z])(?:${p})\\s*[=:]?\\s*${NUM}`, 'i'));
    if (m) {
      const n = toNumber(m[1]);
      if (n != null) return n;
    }
  }
  return undefined;
}

const inRange = (n: number | undefined, lo: number, hi: number) => (n != null && n >= lo && n <= hi ? Math.round(n) : undefined);

export function parseWatchText(raw: string): WatchData | null {
  const text = raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
  const data: WatchData = {
    maxHr: inRange(find(text, ['fcmax', 'fc max(?:ima)?', 'freq(?:uencia)? cardiaca max(?:ima)?', 'max(?:ima)? hr', 'bpm max']), 40, 240),
    avgHr: inRange(find(text, ['fcm(?!ax)', 'fc med(?:ia)?', 'freq(?:uencia)? cardiaca med(?:ia)?', 'avg hr', 'media']), 30, 230),
    kcal: inRange(find(text, ['kcal', 'calorias(?: ativas)?', 'energia ativa', 'cal']), 1, 5000),
    minutes: inRange(find(text, ['min(?:utos)?', 'duracao', 'tempo']), 1, 600),
  };
  return Object.values(data).some((v) => v != null) ? data : null;
}
