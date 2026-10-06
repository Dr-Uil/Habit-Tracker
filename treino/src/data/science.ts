import type { Questionnaire } from '../types';

export interface Reference {
  id: string;
  text: string;
}

export const REFERENCES: Reference[] = [
  { id: 'schoenfeld2017vol', text: 'Schoenfeld BJ, Ogborn D, Krieger JW. Dose-response relationship between weekly resistance training volume and increases in muscle mass: a systematic review and meta-analysis. J Sports Sci. 2017.' },
  { id: 'bazvalle2022', text: 'Baz-Valle E, Balsalobre-Fernández C, Alix-Fages C, Santos-Concejero J. A systematic review of the effects of different resistance training volumes on muscle hypertrophy. J Hum Kinet. 2022.' },
  { id: 'schoenfeld2016freq', text: 'Schoenfeld BJ, Ogborn D, Krieger JW. Effects of resistance training frequency on measures of muscle hypertrophy: a systematic review and meta-analysis. Sports Med. 2016.' },
  { id: 'schoenfeld2017load', text: 'Schoenfeld BJ, Grgic J, Ogborn D, Krieger JW. Strength and hypertrophy adaptations between low- vs. high-load resistance training: a systematic review and meta-analysis. J Strength Cond Res. 2017.' },
  { id: 'refalo2023', text: 'Refalo MC, Helms ER, Trexler ET, Hamilton DL, Fyfe JJ. Influence of resistance training proximity-to-failure on skeletal muscle hypertrophy: a systematic review with meta-analysis. Sports Med. 2023.' },
  { id: 'robinson2024', text: 'Robinson ZP, Pelland JC, Remmert JF, et al. Exploring the dose–response relationship between estimated resistance training proximity to failure, strength gain, and muscle hypertrophy: a series of meta-regressions. Sports Med. 2024.' },
  { id: 'schoenfeld2016rest', text: 'Schoenfeld BJ, Pope ZK, Benik FM, et al. Longer interset rest periods enhance muscle strength and hypertrophy in resistance-trained men. J Strength Cond Res. 2016.' },
  { id: 'singer2024', text: 'Singer A, Wolf M, Generoso L, et al. Give it a rest: a systematic review with Bayesian meta-analysis on the effect of inter-set rest interval duration on muscle hypertrophy. Front Sports Act Living. 2024.' },
  { id: 'maeo2021', text: 'Maeo S, Huang M, Wu Y, et al. Greater hamstrings muscle hypertrophy but similar damage protein responses after training at long vs short muscle lengths. Med Sci Sports Exerc. 2021.' },
  { id: 'maeo2023', text: 'Maeo S, Wu Y, Huang M, et al. Triceps brachii hypertrophy is substantially greater after elbow extension training performed in the overhead versus neutral arm position. Eur J Sport Sci. 2023.' },
  { id: 'pedrosa2022', text: 'Pedrosa GF, Lima FV, Schoenfeld BJ, et al. Partial range of motion training elicits favorable improvements in muscular adaptations when carried out at long muscle lengths. Eur J Sport Sci. 2022.' },
  { id: 'schoenfeld2015tempo', text: 'Schoenfeld BJ, Ogborn DI, Krieger JW. Effect of repetition duration during resistance training on muscle hypertrophy: a systematic review and meta-analysis. Sports Med. 2015.' },
  { id: 'iversen2021', text: 'Iversen VM, Norum M, Schoenfeld BJ, Fimland MS. No time to lift? Designing time-efficient training programs for strength and hypertrophy: a narrative review. Sports Med. 2021.' },
  { id: 'plotkin2022', text: 'Plotkin D, Coleman M, Van Every D, et al. Progressive overload without progressing load? The effects of load or repetition progression on muscular adaptations. PeerJ. 2022.' },
  { id: 'bell2023', text: 'Bell L, Strafford BW, Coleman M, Androulakis Korakakis P, Nolan D. Integrating deloading into strength and physique sports training programmes: an international Delphi consensus approach. Sports Med Open. 2023.' },
  { id: 'roberts2020', text: 'Roberts BM, Nuckols G, Krieger JW. Sex differences in resistance training: a systematic review and meta-analysis. J Strength Cond Res. 2020.' },
  { id: 'schumann2022', text: 'Schumann M, Feuerbacher JF, Sünkeler M, et al. Compatibility of concurrent aerobic and strength training for skeletal muscle size and function: an updated systematic review and meta-analysis. Sports Med. 2022.' },
  { id: 'wilson2012', text: 'Wilson JM, Marin PJ, Rhea MR, et al. Concurrent training: a meta-analysis examining interference of aerobic and resistance exercises. J Strength Cond Res. 2012.' },
  { id: 'helgerud2007', text: 'Helgerud J, Høydal K, Wang E, et al. Aerobic high-intensity intervals improve VO2max more than moderate training. Med Sci Sports Exerc. 2007.' },
  { id: 'who2020', text: 'Bull FC, Al-Ansari SS, Biddle S, et al. World Health Organization 2020 guidelines on physical activity and sedentary behaviour. Br J Sports Med. 2020.' },
  { id: 'paluch2022', text: 'Paluch AE, Bajpai S, Bassett DR, et al. Daily steps and all-cause mortality: a meta-analysis of 15 international cohorts. Lancet Public Health. 2022.' },
  { id: 'tanaka2001', text: 'Tanaka H, Monahan KD, Seals DR. Age-predicted maximal heart rate revisited. J Am Coll Cardiol. 2001.' },
  { id: 'grgic2019', text: 'Grgic J, Lazinica B, Garofolini A, et al. The effects of time of day-specific resistance training on adaptations in skeletal muscle hypertrophy and muscle strength: a systematic review and meta-analysis. Chronobiol Int. 2019.' },
  { id: 'kuusmaa2016', text: 'Küüsmaa M, Schumann M, Sedliak M, et al. Effects of morning versus evening combined strength and endurance training on physical performance, muscle hypertrophy, and serum hormone concentrations. Appl Physiol Nutr Metab. 2016.' },
  { id: 'stutz2019', text: 'Stutz J, Eiholzer R, Spengler CM. Effects of evening exercise on sleep in healthy participants: a systematic review and meta-analysis. Sports Med. 2019.' },
  { id: 'gardiner2023', text: 'Gardiner C, Weakley J, Burke LM, et al. The effect of caffeine on subsequent sleep: a systematic review and meta-analysis. Sleep Med Rev. 2023.' },
  { id: 'schoenfeld2014fast', text: 'Schoenfeld BJ, Aragon AA, Wilborn CD, Krieger JW, Sonmez GT. Body composition changes associated with fasted versus non-fasted aerobic exercise. J Int Soc Sports Nutr. 2014.' },
  { id: 'morton2018', text: 'Morton RW, Murphy KT, McKellar SR, et al. A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. Br J Sports Med. 2018.' },
  { id: 'helms2014', text: 'Helms ER, Zinn C, Rowlands DS, Brown SR. A systematic review of dietary protein during caloric restriction in resistance trained lean athletes: a case for higher intakes. Int J Sport Nutr Exerc Metab. 2014.' },
  { id: 'schoenfeld2018prot', text: 'Schoenfeld BJ, Aragon AA. How much protein can the body use in a single meal for muscle-building? Implications for daily protein distribution. J Int Soc Sports Nutr. 2018.' },
  { id: 'kreider2017', text: 'Kreider RB, Kalman DS, Antonio J, et al. International Society of Sports Nutrition position stand: safety and efficacy of creatine supplementation in exercise, training, and medicine. J Int Soc Sports Nutr. 2017.' },
  { id: 'guest2021', text: 'Guest NS, VanDusseldorp TA, Nelson MT, et al. International Society of Sports Nutrition position stand: caffeine and exercise performance. J Int Soc Sports Nutr. 2021.' },
  { id: 'mifflin1990', text: 'Mifflin MD, St Jeor ST, Hill LA, et al. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr. 1990.' },
  { id: 'lamon2021', text: 'Lamon S, Morabito A, Arentson-Lantz E, et al. The effect of acute sleep deprivation on skeletal muscle protein synthesis and the hormonal environment. Physiol Rep. 2021.' },
];

export interface Principle {
  title: string;
  icon: string;
  body: string;
  refs: string[];
}

export const PRINCIPLES: Principle[] = [
  {
    title: 'Volume semanal: o principal motor',
    icon: '📊',
    body: 'O número de séries “duras” (perto da falha) por músculo por semana tem relação dose-resposta com a hipertrofia. Faixa prática: ~10–20 séries/semana; iniciantes crescem com menos (8–12). O app conta séries de forma fracionada (o tríceps no supino conta meia série) e mostra o seu volume na aba Plano.',
    refs: ['schoenfeld2017vol', 'bazvalle2022'],
  },
  {
    title: 'Frequência: 2× por semana por músculo',
    icon: '📅',
    body: 'Com o mesmo volume, treinar cada músculo ao menos 2×/semana tende a ser superior a 1×. Por isso, com 3–4 dias usamos Full Body ou Superior/Inferior, e não a “divisão de um músculo por dia”.',
    refs: ['schoenfeld2016freq'],
  },
  {
    title: 'Repetições: de 6 a 30 funcionam — se for perto da falha',
    icon: '🔁',
    body: 'Cargas pesadas e leves geram hipertrofia semelhante quando as séries terminam perto da falha; cargas pesadas dão mais força. Usamos 6–10 reps nos multiarticulares (força + eficiência) e 10–20 nos isolados (mais seguro para articulações).',
    refs: ['schoenfeld2017load'],
  },
  {
    title: 'Intensidade: 0–3 repetições na reserva (RIR)',
    icon: '🎯',
    body: 'Treinar mais perto da falha aumenta a hipertrofia, mas ir à falha total em tudo gera fadiga desproporcional. O app usa RIR 3 → 1 ao longo do bloco. RIR 2 = você conseguiria fazer mais 2 repetições com boa técnica.',
    refs: ['refalo2023', 'robinson2024'],
  },
  {
    title: 'Descanso: 2–3 min nos básicos, ~90 s nos isolados',
    icon: '⏱️',
    body: 'Descansos curtos demais (≤ 60 s) reduzem o volume que você consegue fazer. Descanso maior nos multiarticulares mantém as cargas altas; nos isolados, ~90 s é suficiente. O cronômetro do app já vem com o tempo certo para cada exercício.',
    refs: ['schoenfeld2016rest', 'singer2024'],
  },
  {
    title: 'Músculo alongado cresce mais',
    icon: '🦵',
    body: 'Exercícios que trabalham o músculo em posição alongada (cadeira flexora sentado, tríceps acima da cabeça, rosca inclinada, RDL) mostraram maior hipertrofia. Esses exercícios são priorizados (selo “alongado”).',
    refs: ['maeo2021', 'maeo2023', 'pedrosa2022'],
  },
  {
    title: 'Pouco tempo? Bi-sets e foco no essencial',
    icon: '⚡',
    body: 'Alternar exercícios de músculos que não competem (ex.: bíceps + tríceps, panturrilha + ombro) corta ~30% do tempo da sessão mantendo o volume. O gerador ajusta séries e exercícios para caber no tempo que vocês informaram.',
    refs: ['iversen2021'],
  },
  {
    title: 'Sobrecarga progressiva (dupla progressão)',
    icon: '📈',
    body: 'Primeiro suba as repetições dentro da faixa; quando bater o topo em todas as séries, aumente a carga e recomece embaixo. Progredir em repetições ou em carga gera resultados parecidos — o importante é progredir. O app sugere a carga de cada série com base no último treino.',
    refs: ['plotkin2022'],
  },
  {
    title: 'Deload a cada 6 semanas',
    icon: '🔋',
    body: 'Uma semana mais leve (metade das séries, longe da falha) a cada 4–8 semanas ajuda a dissipar a fadiga, cuidar das articulações e manter a motivação. O app faz isso automaticamente na 6ª semana do bloco.',
    refs: ['bell2023'],
  },
  {
    title: 'Homens e mulheres: mesmo treino, mesmas regras',
    icon: '👫',
    body: 'Mulheres ganham massa muscular em proporção semelhante aos homens com o mesmo tipo de treino. Não existe “treino feminino”: o que muda são as prioridades individuais (ex.: glúteos), que vocês escolheram no questionário.',
    refs: ['roberts2020'],
  },
  {
    title: 'Cardio + musculação combinam',
    icon: '❤️',
    body: 'Treino concorrente não atrapalha a hipertrofia de forma relevante, desde que o volume de cardio seja moderado. Bike/elíptico interferem menos que corrida, e fazer o cardio depois da musculação (ou em outro dia) preserva o desempenho nos pesos. HIIT 4×4 é excelente para o VO₂máx; a OMS recomenda 150–300 min/semana de atividade moderada.',
    refs: ['schumann2022', 'wilson2012', 'helgerud2007', 'who2020'],
  },
  {
    title: 'Passos diários contam muito',
    icon: '🚶',
    body: 'Mais passos por dia estão associados a menor mortalidade, com benefício crescente até ~8–10 mil passos. É também a forma mais fácil de aumentar o gasto calórico sem atrapalhar a recuperação.',
    refs: ['paluch2022'],
  },
];

export interface TimingTip {
  title: string;
  icon: string;
  text: string;
}

export function timingTips(q: Questionnaire): TimingTip[] {
  const tips: TimingTip[] = [];
  const pref = q.preferredTime;
  tips.push({
    title: 'Musculação: fim da tarde é o pico de desempenho',
    icon: '🏋️',
    text:
      (pref === 'tarde'
        ? 'Ótima notícia: vocês já treinam no melhor horário. '
        : '') +
      'Força e potência costumam ser maiores entre ~14h e 19h (temperatura corporal mais alta). Para hipertrofia, porém, o horário em si faz pouca diferença no longo prazo — o corpo se adapta ao horário em que treina. Consistência > horário.',
  });
  tips.push({
    title: 'Cardio leve (Zona 2/caminhada): qualquer hora',
    icon: '🚶',
    text: 'Encaixe onde for mais fácil: de manhã, no almoço ou após a musculação. Fazer em jejum não aumenta a perda de gordura — escolha pelo que for mais prático.',
  });
  tips.push({
    title: 'HIIT: depois dos pesos ou em outro dia',
    icon: '🔥',
    text: 'Nunca antes do treino de pernas. Se for no mesmo dia, faça depois da musculação ou separe por ~6 h. Os dias extras de cardio do plano já estão longe dos treinos de pernas sempre que possível.',
  });
  tips.push({
    title: 'Sono: o treino não pode roubar sono',
    icon: '😴',
    text: 'Treinar à noite não prejudica o sono para a maioria — evite só exercício muito intenso na última hora antes de deitar. Cafeína pode atrapalhar o sono por até ~8–9 h: se treinar depois das 16h, prefira dose pequena ou café sem cafeína.',
  });
  if (pref === 'manha')
    tips.push({
      title: 'Treino de manhã cedo',
      icon: '🌅',
      text: 'Aqueça um pouco mais (8–10 min) e faça mais séries de aproximação: a força costuma ser menor cedo, mas melhora com o hábito. Um lanche leve com carboidrato e proteína 30–60 min antes ajuda.',
    });
  if (pref === 'variavel')
    tips.push({
      title: 'Horário variável',
      icon: '🔄',
      text: 'Sem problema: o programa avança por treino feito, não por dia da semana. Só tente manter ~48 h entre treinos que repetem o mesmo grupo muscular pesado.',
    });
  return tips;
}

export const RIR_SCALE: { rir: string; label: string }[] = [
  { rir: '0', label: 'Falha: não sairia mais nenhuma repetição' },
  { rir: '1', label: 'Sairia mais 1 repetição' },
  { rir: '2', label: 'Sairiam mais 2 repetições' },
  { rir: '3', label: 'Sairiam mais 3 — esforço firme, mas confortável' },
  { rir: '4+', label: 'Fácil — aquecimento/deload' },
];
