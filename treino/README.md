# 🏋️ Treino Casal

App de musculação + cardio **baseado em evidências**, com um perfil para cada pessoa.
Um questionário curto gera o plano completo (divisão, exercícios, séries, repetições,
descanso, intensidade, cardio e metas de nutrição), e o app acompanha a progressão de carga.

## O que ele faz

- **Perfis separados** (ex.: você e sua esposa), cada um com cor, plano e histórico próprios.
- **Questionário de 8 passos**: corpo, experiência, objetivo, dias/semana, tempo por sessão,
  equipamento, limitações articulares, músculos prioritários, cardio preferido, horário, sono.
- **Gerador de programa**
  - Divisão conforme os dias: Full Body (2–3), Superior/Inferior (4), U/L + PPL (5), PPL 2× (6).
  - Cada músculo ≥ 2×/semana; volume semanal por músculo dentro da faixa da literatura
    (8–12 séries iniciante, 10–16 intermediário, 12–20 avançado; +4 nos prioritários).
  - Ajusta séries/exercícios para **caber no tempo** informado (aquecimento e cardio incluídos)
    e usa bi-sets de músculos não concorrentes para economizar tempo.
  - Reps 6–10 nos multiarticulares, 10–20 nos isolados; descanso 2–3 min / ~90 s.
  - Prioriza exercícios com ênfase no músculo alongado; evita exercícios que sobrecarregam
    joelho/ombro/lombar/cotovelo/punho quando informado.
  - Blocos de 6 semanas: RIR 3 → 1 e deload na 6ª semana.
- **Execução do treino**: carga sugerida por série (dupla progressão), registro de kg/reps/RIR,
  cronômetro de descanso automático com som e vibração, troca de exercício (só hoje ou no plano).
- **Progresso**: 1RM estimado por exercício, peso corporal e cintura, séries por semana, recordes.
- **Cardio**: Zona 2 e HIIT (4×4 norueguês) com zonas de FC, meta de passos, dias extras.
- **Nutrição**: calorias (Mifflin-St Jeor/Katch-McArdle), proteína 1,6–2,4 g/kg, macros,
  distribuição por refeição, alimentos brasileiros, suplementos com evidência e **ajuste
  automático pelas pesagens**.
- **Guia**: princípios científicos com 30+ referências (meta-análises e revisões).
- Funciona offline (PWA), dados salvos no aparelho, **backup/importação em JSON** para levar
  para outro celular.

## Rodar localmente

```bash
cd treino
npm install
npm run dev      # http://localhost:3001
npm test         # testes da lógica (gerador, progressão, nutrição)
npm run build    # site estático em dist/
npm run build:single  # um único index.html autocontido em dist-single/
```

## Publicar (para usar no celular)

- **GitHub Pages**: <https://dr-uil.github.io/Habit-Tracker/> — o workflow
  `.github/workflows/deploy-treino.yml` reconstrói e publica no branch `gh-pages` a cada push
  na `main` que altere `treino/`.
- Ou suba a pasta `dist/` em qualquer hospedagem estática (Netlify, Vercel, Cloudflare Pages).

No celular, abra o link e use “Adicionar à tela inicial” para instalar como app.

## Estrutura

```
src/
  data/exercises.ts    base de 80+ exercícios (músculos, padrão, contraindicações, dicas)
  data/science.ts      princípios, dicas de horário e referências
  logic/generator.ts   montagem do programa (volume, tempo, cardio, agenda)
  logic/progression.ts blocos/RIR, próxima sessão, sugestão de carga
  logic/nutrition.ts   calorias, macros, tendência de peso
  views/               telas (questionário, hoje, treino, plano, progresso, nutrição, guia)
```

> Conteúdo educativo; não substitui avaliação médica, de nutricionista ou de profissional de
> educação física.
