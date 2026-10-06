import type { EquipmentAccess, Exercise, LoadType, Muscle, Pattern } from '../types';

/**
 * Base de exercícios. Dentro de cada padrão, a ordem da lista é a ordem de preferência
 * (o gerador escolhe o primeiro disponível e não usado ainda no programa).
 */
export const EXERCISES: Exercise[] = [
  // ───────────── Agachamento (squat) ─────────────
  {
    id: 'agachamento_hack', name: 'Agachamento no hack', pattern: 'squat', kind: 'compound', load: 'maquina', skill: 1,
    muscles: { quadriceps: 1, gluteos: 0.5 },
    cues: ['Pés na largura dos ombros, no meio da plataforma', 'Desça controlado (2–3 s) até onde mantiver a lombar apoiada', 'Suba empurrando o chão, sem travar os joelhos'],
  },
  {
    id: 'agachamento_livre', name: 'Agachamento livre (barra)', pattern: 'squat', kind: 'compound', load: 'barra', skill: 3,
    muscles: { quadriceps: 1, gluteos: 0.5 }, avoid: ['lombar'],
    cues: ['Barra apoiada no trapézio, peito aberto', 'Inspire e trave o abdômen antes de descer', 'Joelhos acompanham a direção dos pés; desça até a coxa ficar paralela ou abaixo'],
  },
  {
    id: 'leg_press', name: 'Leg press 45°', pattern: 'squat', kind: 'compound', load: 'maquina', skill: 1,
    muscles: { quadriceps: 1, gluteos: 0.5 },
    cues: ['Lombar e quadril sempre colados no encosto', 'Desça até ~90° de joelho ou mais, sem o quadril “enrolar”', 'Não trave os joelhos no topo'],
  },
  {
    id: 'agachamento_smith', name: 'Agachamento no Smith', pattern: 'squat', kind: 'compound', load: 'maquina', skill: 2,
    muscles: { quadriceps: 1, gluteos: 0.5 },
    cues: ['Pés levemente à frente da barra', 'Desça controlado com tronco firme', 'Amplitude completa e confortável'],
  },
  {
    id: 'agachamento_goblet', name: 'Agachamento goblet (halter)', pattern: 'squat', kind: 'compound', load: 'halter', skill: 1,
    muscles: { quadriceps: 1, gluteos: 0.5 },
    cues: ['Segure o halter junto ao peito', 'Cotovelos por dentro dos joelhos no fundo', 'Desça em 3 s, suba forte'],
  },
  {
    id: 'agachamento_pc', name: 'Agachamento com pausa (peso corporal/mochila)', pattern: 'squat', kind: 'compound', load: 'peso_corporal', skill: 1,
    muscles: { quadriceps: 1, gluteos: 0.5 },
    cues: ['Desça em 3 s e pause 1 s embaixo', 'Use mochila com peso quando passar de 20 repetições', 'Mantenha o calcanhar no chão'],
  },

  // ───────────── Dobradiça de quadril (hinge) ─────────────
  {
    id: 'stiff_barra', name: 'Levantamento terra romeno (RDL) com barra', pattern: 'hinge', kind: 'compound', load: 'barra', skill: 2,
    muscles: { posteriores: 1, gluteos: 0.5 }, avoid: ['lombar'], lengthened: true,
    cues: ['Joelhos levemente flexionados e fixos', 'Leve o quadril para trás com a barra rente às pernas', 'Desça até sentir alongar o posterior (geralmente abaixo do joelho), coluna neutra'],
  },
  {
    id: 'stiff_halter', name: 'RDL com halteres', pattern: 'hinge', kind: 'compound', load: 'halter', skill: 2,
    muscles: { posteriores: 1, gluteos: 0.5 }, avoid: ['lombar'], lengthened: true,
    cues: ['Halteres rentes às coxas', 'Quadril para trás, coluna neutra', 'Pare quando o quadril não for mais para trás'],
  },
  {
    id: 'hiperextensao_45', name: 'Extensão de quadril no banco 45°', pattern: 'hinge', kind: 'compound', load: 'maquina', skill: 1,
    muscles: { gluteos: 1, posteriores: 0.5 },
    cues: ['Apoio logo abaixo do quadril', 'Movimento vem do quadril, não da lombar', 'Aperte o glúteo no topo, sem hiperestender a coluna'],
  },
  {
    id: 'rdl_unilateral', name: 'RDL unilateral (halter ou mochila)', pattern: 'hinge', kind: 'compound', load: 'peso_corporal', skill: 2,
    muscles: { posteriores: 1, gluteos: 0.5 }, unilateral: true, lengthened: true,
    cues: ['Apoie-se levemente numa parede se precisar', 'Quadril alinhado, sem girar', 'Desça até alongar o posterior da perna de apoio'],
  },

  // ───────────── Afundo / unilateral (lunge) ─────────────
  {
    id: 'bulgaro', name: 'Agachamento búlgaro (halteres)', pattern: 'lunge', kind: 'compound', load: 'halter', skill: 2,
    muscles: { quadriceps: 1, gluteos: 1 }, avoid: ['joelho'], unilateral: true, lengthened: true,
    cues: ['Pé de trás apoiado no banco', 'Tronco levemente inclinado à frente = mais glúteo', 'Desça até o joelho de trás quase tocar o chão'],
  },
  {
    id: 'step_up', name: 'Subida no banco (step-up)', pattern: 'lunge', kind: 'compound', load: 'halter', skill: 1,
    muscles: { quadriceps: 1, gluteos: 1 }, unilateral: true,
    cues: ['Banco na altura do joelho', 'Empurre pelo calcanhar da perna de cima', 'Desça devagar, sem impulso da perna de baixo'],
  },
  {
    id: 'afundo_caminhando', name: 'Afundo caminhando', pattern: 'lunge', kind: 'compound', load: 'halter', skill: 2,
    muscles: { quadriceps: 1, gluteos: 1 }, avoid: ['joelho'], unilateral: true,
    cues: ['Passos longos', 'Joelho de trás quase toca o chão', 'Tronco firme'],
  },
  {
    id: 'bulgaro_pc', name: 'Búlgaro com peso corporal/mochila', pattern: 'lunge', kind: 'compound', load: 'peso_corporal', skill: 2,
    muscles: { quadriceps: 1, gluteos: 1 }, avoid: ['joelho'], unilateral: true, lengthened: true,
    cues: ['Pé de trás numa cadeira/sofá', 'Descida em 3 s', 'Acrescente mochila quando ficar fácil'],
  },

  // ───────────── Extensão de joelho ─────────────
  {
    id: 'cadeira_extensora', name: 'Cadeira extensora', pattern: 'knee_ext', kind: 'isolation', load: 'maquina', skill: 1,
    muscles: { quadriceps: 1 },
    cues: ['Encosto ajustado: joelho alinhado ao eixo da máquina', 'Segure 1 s em cima', 'Desça controlado até o fundo (alongamento)'],
  },
  {
    id: 'sissy_assistido', name: 'Sissy squat assistido', pattern: 'knee_ext', kind: 'isolation', load: 'peso_corporal', skill: 2,
    muscles: { quadriceps: 1 }, avoid: ['joelho'], lengthened: true,
    cues: ['Segure num batente', 'Incline o corpo para trás enquanto os joelhos vão à frente', 'Amplitude que for confortável'],
  },

  // ───────────── Flexão de joelho ─────────────
  {
    id: 'cadeira_flexora', name: 'Cadeira flexora (sentado)', pattern: 'knee_flex', kind: 'isolation', load: 'maquina', skill: 1,
    muscles: { posteriores: 1 }, lengthened: true,
    cues: ['Sentado, o posterior trabalha mais alongado (mais hipertrofia que deitado)', 'Incline o tronco levemente à frente', 'Volte devagar até estender totalmente'],
  },
  {
    id: 'mesa_flexora', name: 'Mesa flexora (deitado)', pattern: 'knee_flex', kind: 'isolation', load: 'maquina', skill: 1,
    muscles: { posteriores: 1 },
    cues: ['Quadril colado no banco', 'Flexione até o máximo', 'Descida em 2–3 s'],
  },
  {
    id: 'flexora_halter', name: 'Flexora com halter (deitado no banco)', pattern: 'knee_flex', kind: 'isolation', load: 'halter', skill: 2,
    muscles: { posteriores: 1 },
    cues: ['Halter preso entre os pés', 'Quadril no banco', 'Movimento lento'],
  },
  {
    id: 'flexora_deslizando', name: 'Flexão de joelhos deslizando (toalha/slider)', pattern: 'knee_flex', kind: 'isolation', load: 'peso_corporal', skill: 1,
    muscles: { posteriores: 1, gluteos: 0.5 },
    cues: ['Deitado, quadril elevado', 'Puxe os calcanhares em direção ao glúteo', 'Volte devagar'],
  },
  {
    id: 'nordica', name: 'Flexão nórdica (excêntrica assistida)', pattern: 'knee_flex', kind: 'isolation', load: 'peso_corporal', skill: 3,
    muscles: { posteriores: 1 }, avoid: ['joelho'], lengthened: true,
    cues: ['Calcanhares presos', 'Desça o mais devagar possível', 'Use as mãos para voltar'],
  },

  // ───────────── Elevação pélvica ─────────────
  {
    id: 'elevacao_pelvica', name: 'Elevação pélvica (hip thrust) com barra', pattern: 'hip_thrust', kind: 'compound', load: 'barra', skill: 2,
    muscles: { gluteos: 1, posteriores: 0.5 },
    cues: ['Escápulas no banco, barra no quadril com proteção', 'Queixo levemente para baixo, costelas “fechadas”', 'Pause 1 s no topo apertando o glúteo'],
  },
  {
    id: 'elevacao_pelvica_maquina', name: 'Elevação pélvica na máquina/Smith', pattern: 'hip_thrust', kind: 'compound', load: 'maquina', skill: 1,
    muscles: { gluteos: 1, posteriores: 0.5 },
    cues: ['Canelas verticais no topo', 'Pause 1 s no topo', 'Não hiperestenda a lombar'],
  },
  {
    id: 'hip_thrust_halter', name: 'Elevação pélvica com halter', pattern: 'hip_thrust', kind: 'compound', load: 'halter', skill: 1,
    muscles: { gluteos: 1, posteriores: 0.5 },
    cues: ['Halter sobre o quadril', 'Suba até alinhar tronco e coxas', 'Pausa no topo'],
  },
  {
    id: 'ponte_unilateral', name: 'Ponte de glúteo unilateral', pattern: 'hip_thrust', kind: 'compound', load: 'peso_corporal', skill: 1,
    muscles: { gluteos: 1, posteriores: 0.5 }, unilateral: true,
    cues: ['Ombros no sofá ou no chão', 'Uma perna estendida', 'Pause 2 s no topo'],
  },

  // ───────────── Abdução de quadril ─────────────
  {
    id: 'abdutora', name: 'Cadeira abdutora', pattern: 'abduction', kind: 'isolation', load: 'maquina', skill: 1,
    muscles: { gluteos: 1 },
    cues: ['Tronco levemente inclinado à frente para mais glúteo', 'Abra até o máximo e segure 1 s', 'Volte devagar'],
  },
  {
    id: 'abducao_elastico', name: 'Abdução com mini band', pattern: 'abduction', kind: 'isolation', load: 'elastico', skill: 1,
    muscles: { gluteos: 1 },
    cues: ['Elástico acima dos joelhos', 'Deitado de lado ou sentado', 'Movimento lento e completo'],
  },

  // ───────────── Panturrilha ─────────────
  {
    id: 'panturrilha_em_pe', name: 'Panturrilha em pé (máquina/Smith)', pattern: 'calf', kind: 'isolation', load: 'maquina', skill: 1,
    muscles: { panturrilhas: 1 }, lengthened: true,
    cues: ['Pause 1–2 s embaixo, no alongamento máximo', 'Suba o máximo', 'Sem quicar'],
  },
  {
    id: 'panturrilha_leg', name: 'Panturrilha no leg press', pattern: 'calf', kind: 'isolation', load: 'maquina', skill: 1,
    muscles: { panturrilhas: 1 }, lengthened: true,
    cues: ['Ponta dos pés na borda da plataforma', 'Alongue bem embaixo', 'Joelhos estendidos (não travados)'],
  },
  {
    id: 'panturrilha_sentado', name: 'Panturrilha sentado', pattern: 'calf', kind: 'isolation', load: 'maquina', skill: 1,
    muscles: { panturrilhas: 1 },
    cues: ['Foca no sóleo', 'Pausa embaixo', 'Amplitude total'],
  },
  {
    id: 'panturrilha_halter', name: 'Panturrilha unilateral no degrau (halter)', pattern: 'calf', kind: 'isolation', load: 'halter', skill: 1,
    muscles: { panturrilhas: 1 }, unilateral: true, lengthened: true,
    cues: ['Calcanhar abaixo do degrau no alongamento', 'Pausa de 1–2 s embaixo', 'Segure em algo com a outra mão'],
  },
  {
    id: 'panturrilha_degrau', name: 'Panturrilha no degrau (peso corporal)', pattern: 'calf', kind: 'isolation', load: 'peso_corporal', skill: 1,
    muscles: { panturrilhas: 1 }, lengthened: true,
    cues: ['Faça unilateral quando passar de 20 repetições', 'Pausa embaixo', 'Amplitude completa'],
  },

  // ───────────── Empurrar horizontal ─────────────
  {
    id: 'supino_halter', name: 'Supino reto com halteres', pattern: 'h_push', kind: 'compound', load: 'halter', skill: 1,
    muscles: { peito: 1, triceps: 0.5, ombros: 0.5 }, lengthened: true,
    cues: ['Escápulas para trás e para baixo', 'Desça até alongar bem o peito (cotovelos ~45° do tronco)', 'Empurre juntando levemente os halteres'],
  },
  {
    id: 'supino_reto', name: 'Supino reto (barra)', pattern: 'h_push', kind: 'compound', load: 'barra', skill: 2,
    muscles: { peito: 1, triceps: 0.5, ombros: 0.5 }, avoid: ['ombro'],
    cues: ['Pés firmes, escápulas retraídas', 'Barra toca a parte baixa do peito', 'Cotovelos ~45–70° do tronco'],
  },
  {
    id: 'supino_maquina', name: 'Supino máquina (chest press)', pattern: 'h_push', kind: 'compound', load: 'maquina', skill: 1,
    muscles: { peito: 1, triceps: 0.5, ombros: 0.5 },
    cues: ['Pegada na altura do meio do peito', 'Escápulas encaixadas no banco', 'Volte até alongar o peito'],
  },
  {
    id: 'flexao', name: 'Flexão de braços', pattern: 'h_push', kind: 'compound', load: 'peso_corporal', skill: 1,
    muscles: { peito: 1, triceps: 0.5, ombros: 0.5 },
    cues: ['Corpo em prancha', 'Peito quase no chão', 'Apoie os joelhos ou eleve as mãos se precisar facilitar'],
  },

  // ───────────── Empurrar inclinado ─────────────
  {
    id: 'supino_inclinado_halter', name: 'Supino inclinado com halteres (30°)', pattern: 'incline_push', kind: 'compound', load: 'halter', skill: 1,
    muscles: { peito: 1, ombros: 0.5, triceps: 0.5 }, lengthened: true,
    cues: ['Banco a ~30° (mais que isso vira ombro)', 'Desça até alongar o peito', 'Escápulas fixas'],
  },
  {
    id: 'supino_inclinado_smith', name: 'Supino inclinado no Smith ou barra', pattern: 'incline_push', kind: 'compound', load: 'barra', skill: 2,
    muscles: { peito: 1, ombros: 0.5, triceps: 0.5 }, avoid: ['ombro'],
    cues: ['Barra desce na parte alta do peito', 'Cotovelos levemente fechados', 'Controle a descida'],
  },
  {
    id: 'supino_inclinado_maquina', name: 'Supino inclinado máquina', pattern: 'incline_push', kind: 'compound', load: 'maquina', skill: 1,
    muscles: { peito: 1, ombros: 0.5, triceps: 0.5 },
    cues: ['Banco ajustado para a pegada ficar na altura da parte alta do peito', 'Amplitude completa', 'Sem tirar as costas do banco'],
  },
  {
    id: 'flexao_pes_elevados', name: 'Flexão com pés elevados', pattern: 'incline_push', kind: 'compound', load: 'peso_corporal', skill: 2,
    muscles: { peito: 1, ombros: 0.5, triceps: 0.5 },
    cues: ['Pés num banco/sofá', 'Corpo alinhado', 'Desça até perto do chão'],
  },

  // ───────────── Empurrar vertical ─────────────
  {
    id: 'desenvolvimento_halter', name: 'Desenvolvimento com halteres (sentado)', pattern: 'v_push', kind: 'compound', load: 'halter', skill: 1,
    muscles: { ombros: 1, triceps: 0.5 }, avoid: ['ombro'],
    cues: ['Banco a ~80°', 'Cotovelos levemente à frente do corpo', 'Desça até a altura das orelhas'],
  },
  {
    id: 'desenvolvimento_maquina', name: 'Desenvolvimento máquina', pattern: 'v_push', kind: 'compound', load: 'maquina', skill: 1,
    muscles: { ombros: 1, triceps: 0.5 }, avoid: ['ombro'],
    cues: ['Pegada logo acima dos ombros no início', 'Não arqueie a lombar', 'Controle a descida'],
  },
  {
    id: 'flexao_pike', name: 'Flexão pike', pattern: 'v_push', kind: 'compound', load: 'peso_corporal', skill: 2,
    muscles: { ombros: 1, triceps: 0.5 }, avoid: ['ombro', 'punho'],
    cues: ['Quadril alto, corpo em “V” invertido', 'Cabeça desce à frente das mãos', 'Eleve os pés para dificultar'],
  },

  // ───────────── Crucifixo ─────────────
  {
    id: 'crossover', name: 'Crucifixo no cabo (crossover)', pattern: 'chest_fly', kind: 'isolation', load: 'cabo', skill: 1,
    muscles: { peito: 1 }, lengthened: true,
    cues: ['Polias na altura do ombro ou um pouco abaixo', 'Cotovelos levemente flexionados e fixos', 'Abra até alongar bem o peito'],
  },
  {
    id: 'peck_deck', name: 'Voador (peck deck)', pattern: 'chest_fly', kind: 'isolation', load: 'maquina', skill: 1,
    muscles: { peito: 1 },
    cues: ['Pegadas na altura do peito', 'Abra até sentir alongar', 'Feche sem bater as pegadas'],
  },
  {
    id: 'crucifixo_halter', name: 'Crucifixo com halteres', pattern: 'chest_fly', kind: 'isolation', load: 'halter', skill: 1,
    muscles: { peito: 1 }, lengthened: true,
    cues: ['Cotovelos levemente flexionados', 'Desça até alongar o peito, sem dor no ombro', 'Suba em arco'],
  },
  {
    id: 'crucifixo_elastico', name: 'Crucifixo com elástico', pattern: 'chest_fly', kind: 'isolation', load: 'elastico', skill: 1,
    muscles: { peito: 1 },
    cues: ['Elástico preso atrás, na altura do peito', 'Braços em arco', 'Segure 1 s na frente'],
  },

  // ───────────── Puxar horizontal (remadas) ─────────────
  {
    id: 'remada_maquina', name: 'Remada máquina (peito apoiado)', pattern: 'h_pull', kind: 'compound', load: 'maquina', skill: 1,
    muscles: { costas: 1, biceps: 0.5 },
    cues: ['Peito apoiado = poupa a lombar', 'Puxe os cotovelos para trás', 'Deixe as escápulas abrirem na volta (alongamento)'],
  },
  {
    id: 'remada_baixa', name: 'Remada baixa no cabo (triângulo)', pattern: 'h_pull', kind: 'compound', load: 'cabo', skill: 1,
    muscles: { costas: 1, biceps: 0.5 }, lengthened: true,
    cues: ['Tronco firme, leve inclinação à frente na volta', 'Puxe até o umbigo', 'Estique bem os braços na volta'],
  },
  {
    id: 'remada_unilateral', name: 'Remada unilateral com halter (apoio no banco)', pattern: 'h_pull', kind: 'compound', load: 'halter', skill: 1,
    muscles: { costas: 1, biceps: 0.5 }, unilateral: true, lengthened: true,
    cues: ['Mão e joelho no banco', 'Puxe o halter em direção ao quadril', 'Desça até alongar a dorsal'],
  },
  {
    id: 'remada_curvada', name: 'Remada curvada (barra)', pattern: 'h_pull', kind: 'compound', load: 'barra', skill: 3,
    muscles: { costas: 1, biceps: 0.5 }, avoid: ['lombar'],
    cues: ['Tronco a ~45°, coluna neutra', 'Puxe a barra até o abdômen', 'Sem roubar com o tronco'],
  },
  {
    id: 'remada_elastico', name: 'Remada com elástico', pattern: 'h_pull', kind: 'compound', load: 'elastico', skill: 1,
    muscles: { costas: 1, biceps: 0.5 },
    cues: ['Elástico preso na altura do peito ou nos pés', 'Puxe os cotovelos para trás', 'Segure 1 s'],
  },
  {
    id: 'remada_invertida', name: 'Remada invertida (mesa firme/barra baixa)', pattern: 'h_pull', kind: 'compound', load: 'peso_corporal', skill: 2,
    muscles: { costas: 1, biceps: 0.5 },
    cues: ['Corpo reto', 'Peito em direção à barra/mesa', 'Joelhos flexionados facilitam'],
  },

  // ───────────── Puxar vertical ─────────────
  {
    id: 'puxada_frente', name: 'Puxada frontal (pulldown)', pattern: 'v_pull', kind: 'compound', load: 'cabo', skill: 1,
    muscles: { costas: 1, biceps: 0.5 }, lengthened: true,
    cues: ['Pegada um pouco mais aberta que os ombros', 'Puxe até a parte alta do peito, peito “para cima”', 'Suba até esticar os braços (alongamento)'],
  },
  {
    id: 'barra_fixa', name: 'Barra fixa (livre ou assistida)', pattern: 'v_pull', kind: 'compound', load: 'peso_corporal', skill: 2, gymOnly: true,
    muscles: { costas: 1, biceps: 0.5 }, lengthened: true,
    cues: ['Use a máquina graviton ou elástico se não fizer 6+', 'Desça até esticar os braços', 'Peito em direção à barra'],
  },
  {
    id: 'puxada_unilateral', name: 'Puxada unilateral no cabo (ajoelhado)', pattern: 'v_pull', kind: 'compound', load: 'cabo', skill: 1,
    muscles: { costas: 1, biceps: 0.5 }, unilateral: true, lengthened: true,
    cues: ['Polia alta, ajoelhado de lado', 'Cotovelo desce em direção ao quadril', 'Deixe o braço subir bem na volta'],
  },
  {
    id: 'pullover_cabo', name: 'Pullover no cabo (braços estendidos)', pattern: 'v_pull', kind: 'isolation', load: 'cabo', skill: 1,
    muscles: { costas: 1 }, lengthened: true,
    cues: ['Braços quase estendidos', 'Leve a barra até as coxas', 'Volte até alongar a dorsal'],
  },
  {
    id: 'pullover_halter', name: 'Pullover com halter', pattern: 'v_pull', kind: 'isolation', load: 'halter', skill: 1,
    muscles: { costas: 1, peito: 0.5 }, lengthened: true, avoid: ['ombro'],
    cues: ['Deitado no banco', 'Halter desce atrás da cabeça com cotovelos levemente flexionados', 'Amplitude confortável'],
  },
  {
    id: 'puxada_elastico', name: 'Puxada alta com elástico', pattern: 'v_pull', kind: 'compound', load: 'elastico', skill: 1,
    muscles: { costas: 1, biceps: 0.5 },
    cues: ['Elástico preso no alto da porta', 'Puxe os cotovelos para baixo e para trás', 'Volte devagar'],
  },

  // ───────────── Elevação lateral ─────────────
  {
    id: 'elevacao_lateral_cabo', name: 'Elevação lateral no cabo (unilateral)', pattern: 'lateral_raise', kind: 'isolation', load: 'cabo', skill: 1,
    muscles: { ombros: 1 }, unilateral: true, lengthened: true,
    cues: ['Polia baixa, cabo passando atrás ou à frente do corpo', 'Suba até a altura do ombro', 'Desça em 2–3 s'],
  },
  {
    id: 'elevacao_lateral_halter', name: 'Elevação lateral com halteres', pattern: 'lateral_raise', kind: 'isolation', load: 'halter', skill: 1,
    muscles: { ombros: 1 },
    cues: ['Leve inclinação à frente', 'Cotovelos guiam o movimento', 'Carga leve, controle total'],
  },
  {
    id: 'elevacao_lateral_maquina', name: 'Elevação lateral na máquina', pattern: 'lateral_raise', kind: 'isolation', load: 'maquina', skill: 1,
    muscles: { ombros: 1 },
    cues: ['Ombro alinhado ao eixo da máquina', 'Sobe até a altura do ombro', 'Desce devagar'],
  },
  {
    id: 'elevacao_lateral_elastico', name: 'Elevação lateral com elástico', pattern: 'lateral_raise', kind: 'isolation', load: 'elastico', skill: 1,
    muscles: { ombros: 1 },
    cues: ['Pise no elástico', 'Suba até a altura do ombro', 'Desça controlando'],
  },

  // ───────────── Deltoide posterior ─────────────
  {
    id: 'crucifixo_inverso_maquina', name: 'Crucifixo inverso (peck deck invertido)', pattern: 'rear_delt', kind: 'isolation', load: 'maquina', skill: 1,
    muscles: { ombros: 1 },
    cues: ['Peito no encosto', 'Abra os braços pensando em “afastar” as mãos', 'Sem encolher os ombros'],
  },
  {
    id: 'face_pull', name: 'Face pull no cabo', pattern: 'rear_delt', kind: 'isolation', load: 'cabo', skill: 1,
    muscles: { ombros: 1, costas: 0.5 },
    cues: ['Corda na altura do rosto', 'Puxe abrindo as mãos ao lado das orelhas', 'Ótimo para a saúde do ombro'],
  },
  {
    id: 'crucifixo_inverso_halter', name: 'Crucifixo inverso com halteres (banco inclinado)', pattern: 'rear_delt', kind: 'isolation', load: 'halter', skill: 1,
    muscles: { ombros: 1 },
    cues: ['Peito apoiado no banco inclinado', 'Braços abrem para os lados', 'Carga leve'],
  },
  {
    id: 'pull_apart', name: 'Pull-apart com elástico', pattern: 'rear_delt', kind: 'isolation', load: 'elastico', skill: 1,
    muscles: { ombros: 1, costas: 0.5 },
    cues: ['Braços estendidos à frente', 'Abra o elástico até o peito', 'Volte devagar'],
  },

  // ───────────── Bíceps ─────────────
  {
    id: 'rosca_inclinada', name: 'Rosca alternada no banco inclinado', pattern: 'biceps', kind: 'isolation', load: 'halter', skill: 1,
    muscles: { biceps: 1 }, lengthened: true,
    cues: ['Banco a ~45–60°, braços pendurados atrás do tronco', 'Bíceps trabalha alongado', 'Sem balançar'],
  },
  {
    id: 'rosca_cabo', name: 'Rosca no cabo (de costas para a polia)', pattern: 'biceps', kind: 'isolation', load: 'cabo', skill: 1,
    muscles: { biceps: 1 }, lengthened: true, unilateral: true,
    cues: ['Polia baixa atrás do corpo', 'Cotovelo um pouco atrás do tronco', 'Suba sem mover o cotovelo'],
  },
  {
    id: 'rosca_direta', name: 'Rosca direta (barra W)', pattern: 'biceps', kind: 'isolation', load: 'barra', skill: 1,
    muscles: { biceps: 1 }, avoid: ['punho'],
    cues: ['Cotovelos fixos ao lado do corpo', 'Sem jogar o tronco', 'Desça até estender'],
  },
  {
    id: 'rosca_martelo', name: 'Rosca martelo', pattern: 'biceps', kind: 'isolation', load: 'halter', skill: 1,
    muscles: { biceps: 1 },
    cues: ['Pegada neutra (polegar para cima)', 'Trabalha braquial e braquiorradial', 'Controle a descida'],
  },
  {
    id: 'rosca_scott', name: 'Rosca Scott (máquina ou barra)', pattern: 'biceps', kind: 'isolation', load: 'maquina', skill: 1,
    muscles: { biceps: 1 }, lengthened: true, avoid: ['cotovelo'],
    cues: ['Axila encostada no apoio', 'Desça quase até estender', 'Suba sem tirar os braços do apoio'],
  },
  {
    id: 'rosca_elastico', name: 'Rosca com elástico', pattern: 'biceps', kind: 'isolation', load: 'elastico', skill: 1,
    muscles: { biceps: 1 },
    cues: ['Pise no elástico', 'Cotovelos fixos', 'Segure 1 s em cima'],
  },

  // ───────────── Tríceps ─────────────
  {
    id: 'triceps_overhead_cabo', name: 'Tríceps acima da cabeça no cabo (corda)', pattern: 'triceps', kind: 'isolation', load: 'cabo', skill: 1,
    muscles: { triceps: 1 }, lengthened: true,
    cues: ['De costas para a polia, braços acima da cabeça', 'Posição alongada: ~40% mais hipertrofia que o pulley comum', 'Estenda totalmente os cotovelos'],
  },
  {
    id: 'triceps_frances_halter', name: 'Tríceps francês com halter (sentado)', pattern: 'triceps', kind: 'isolation', load: 'halter', skill: 1,
    muscles: { triceps: 1 }, lengthened: true, avoid: ['cotovelo'],
    cues: ['Halter atrás da cabeça com as duas mãos', 'Cotovelos apontando para cima', 'Desça até alongar bem'],
  },
  {
    id: 'triceps_pulley', name: 'Tríceps na polia (corda ou barra)', pattern: 'triceps', kind: 'isolation', load: 'cabo', skill: 1,
    muscles: { triceps: 1 },
    cues: ['Cotovelos colados ao corpo', 'Estenda totalmente', 'Volte até ~90°'],
  },
  {
    id: 'triceps_testa', name: 'Tríceps testa (barra W)', pattern: 'triceps', kind: 'isolation', load: 'barra', skill: 2,
    muscles: { triceps: 1 }, lengthened: true, avoid: ['cotovelo'],
    cues: ['Leve a barra um pouco atrás da cabeça', 'Cotovelos fixos', 'Controle total'],
  },
  {
    id: 'triceps_banco', name: 'Mergulho no banco', pattern: 'triceps', kind: 'isolation', load: 'peso_corporal', skill: 1,
    muscles: { triceps: 1 }, avoid: ['ombro'],
    cues: ['Mãos no banco/cadeira atrás do corpo', 'Desça até ~90° de cotovelo', 'Ombros longe das orelhas'],
  },
  {
    id: 'triceps_elastico', name: 'Tríceps acima da cabeça com elástico', pattern: 'triceps', kind: 'isolation', load: 'elastico', skill: 1,
    muscles: { triceps: 1 }, lengthened: true,
    cues: ['Elástico preso embaixo, puxado por trás da cabeça', 'Cotovelos para cima', 'Estenda totalmente'],
  },

  // ───────────── Core ─────────────
  {
    id: 'abdominal_cabo', name: 'Abdominal ajoelhado no cabo', pattern: 'core', kind: 'isolation', load: 'cabo', skill: 1,
    muscles: { abdomen: 1 },
    cues: ['Corda atrás da cabeça', 'Enrole a coluna levando costelas ao quadril', 'Quadril parado'],
  },
  {
    id: 'dead_bug', name: 'Dead bug', pattern: 'core', kind: 'isolation', load: 'peso_corporal', skill: 1,
    muscles: { abdomen: 1 },
    cues: ['Lombar colada no chão o tempo todo', 'Estenda braço e perna opostos devagar', 'Expire ao estender'],
  },
  {
    id: 'elevacao_pernas', name: 'Elevação de pernas (banco ou suspenso)', pattern: 'core', kind: 'isolation', load: 'peso_corporal', skill: 2,
    muscles: { abdomen: 1 }, avoid: ['lombar'],
    cues: ['Enrole o quadril no final', 'Sem balanço', 'Joelhos flexionados facilitam'],
  },
  {
    id: 'prancha', name: 'Prancha (30–60 s, contração máxima)', pattern: 'core', kind: 'isolation', load: 'peso_corporal', skill: 1,
    muscles: { abdomen: 1 },
    cues: ['Contraia glúteos e abdômen forte', 'Corpo alinhado', 'Conte repetições como segundos ÷ 4 (ex.: 40 s ≈ 10)'],
  },
  {
    id: 'pallof', name: 'Pallof press (antirrotação)', pattern: 'core', kind: 'isolation', load: 'elastico', skill: 1,
    muscles: { abdomen: 1 },
    cues: ['De lado para o cabo/elástico', 'Estenda os braços sem deixar o tronco girar', 'Segure 2 s'],
  },
];

export const EXERCISE_MAP: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

export function getExercise(id: string): Exercise {
  const ex = EXERCISE_MAP[id];
  if (!ex) throw new Error(`Exercício desconhecido: ${id}`);
  return ex;
}

const LOADS_BY_ACCESS: Record<EquipmentAccess, LoadType[]> = {
  academia: ['barra', 'halter', 'maquina', 'cabo', 'peso_corporal', 'elastico'],
  halteres: ['halter', 'peso_corporal', 'elastico'],
  casa: ['peso_corporal', 'elastico'],
};

export function isAvailable(ex: Exercise, access: EquipmentAccess): boolean {
  if (ex.gymOnly && access !== 'academia') return false;
  return LOADS_BY_ACCESS[access].includes(ex.load);
}

export const PATTERN_LABEL: Record<Pattern, string> = {
  squat: 'Agachamento',
  hinge: 'Dobradiça de quadril',
  lunge: 'Unilateral de pernas',
  knee_ext: 'Extensão de joelho',
  knee_flex: 'Flexão de joelho',
  hip_thrust: 'Elevação pélvica',
  abduction: 'Abdução de quadril',
  calf: 'Panturrilha',
  h_push: 'Empurrar horizontal',
  incline_push: 'Empurrar inclinado',
  v_push: 'Empurrar vertical',
  chest_fly: 'Crucifixo',
  h_pull: 'Remada',
  v_pull: 'Puxada vertical',
  lateral_raise: 'Elevação lateral',
  rear_delt: 'Deltoide posterior',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  core: 'Core/abdômen',
};

export const MUSCLE_LABEL: Record<Muscle, string> = {
  peito: 'Peito',
  costas: 'Costas',
  ombros: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  quadriceps: 'Quadríceps',
  posteriores: 'Posteriores',
  gluteos: 'Glúteos',
  panturrilhas: 'Panturrilhas',
  abdomen: 'Abdômen',
};

export const ALL_MUSCLES: Muscle[] = ['peito', 'costas', 'ombros', 'biceps', 'triceps', 'quadriceps', 'posteriores', 'gluteos', 'panturrilhas', 'abdomen'];
