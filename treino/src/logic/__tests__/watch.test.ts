import { describe, expect, it } from 'vitest';
import { parseWatchText } from '../watch';

describe('parseWatchText', () => {
  it('lê o texto do atalho (vírgula decimal do iPhone em português)', () => {
    expect(parseWatchText('treino fcm=128,4 fcmax=165 kcal=410,2 min=62')).toEqual({ avgHr: 128, maxHr: 165, kcal: 410, minutes: 62 });
  });
  it('aceita ponto decimal e separador de milhar', () => {
    expect(parseWatchText('treino fcm=131.6 fcmax=172 kcal=1.034 min=75')).toEqual({ avgHr: 132, maxHr: 172, kcal: 1034, minutes: 75 });
  });
  it('aceita rótulos por extenso', () => {
    expect(parseWatchText('FC média: 120 bpm\nFC máxima: 158\nCalorias ativas: 350\nDuração: 55 min')).toEqual({ avgHr: 120, maxHr: 158, kcal: 350, minutes: 55 });
  });
  it('ignora texto sem dados ou valores absurdos', () => {
    expect(parseWatchText('bom dia')).toBeNull();
    expect(parseWatchText('fcm=900')).toBeNull();
  });
  it('variáveis vazias do atalho não quebram', () => {
    expect(parseWatchText('treino fcm= fcmax= kcal=300 min=40')).toEqual({ avgHr: undefined, maxHr: undefined, kcal: 300, minutes: 40 });
  });
});
