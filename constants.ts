
import { Goal, GoalFrequency } from './types';

export const GOALS_2026: Goal[] = [
  // Diários
  { id: 'hab-1', title: 'Ler e Orar', description: 'Todos os dias', frequency: GoalFrequency.DAILY, target: 1, unit: 'dia' },
  { id: 'hab-2', title: 'Acordar às 06h', description: 'Acordar cedo todos os dias', frequency: GoalFrequency.DAILY, target: 1, unit: 'dia' },
  { id: 'hab-3', title: 'Sem celular às 23h', description: 'Desconectar para dormir melhor', frequency: GoalFrequency.DAILY, target: 1, unit: 'dia' },
  { id: 'hab-4', title: 'Estudar Inglês', description: '20 minutos por dia', frequency: GoalFrequency.DAILY, target: 1, unit: 'sessão' },
  
  // Semanais
  { id: 'hab-5', title: 'Cardio', description: '40 minutos, 3x na semana', frequency: GoalFrequency.WEEKLY, target: 3, unit: 'vezes' },
  { id: 'hab-6', title: 'Tempo com Crianças', description: 'Qualidade (1h+), 2x na semana', frequency: GoalFrequency.WEEKLY, target: 2, unit: 'vezes' },
  { id: 'hab-7', title: 'Estudar Guitarra', description: '30 minutos, 3x na semana', frequency: GoalFrequency.WEEKLY, target: 3, unit: 'vezes' },
  { id: 'hab-8', title: 'Artigo Farmácia', description: 'Ler artigo, 3x na semana', frequency: GoalFrequency.WEEKLY, target: 3, unit: 'vezes' },
  
  // Mensais
  { id: 'hab-9', title: 'Dia com Ana', description: 'Cinema, café, série (1x mês)', frequency: GoalFrequency.MONTHLY, target: 1, unit: 'encontro' },
  { id: 'hab-10', title: 'Faturamento Empresa', description: 'R$ 5.000,00 por mês', frequency: GoalFrequency.MONTHLY, target: 5000, unit: 'reais' },
  
  // Anuais
  { id: 'hab-11', title: 'Academia', description: 'Ir 209 vezes no ano', frequency: GoalFrequency.YEARLY, target: 209, unit: 'vezes' },
  { id: 'hab-12', title: 'Livros Novos', description: 'Ler pelo menos 3 livros', frequency: GoalFrequency.YEARLY, target: 3, unit: 'livros' },
  { id: 'hab-13', title: 'Curso/Novo Saber', description: 'Fazer um curso ou aprender algo novo', frequency: GoalFrequency.YEARLY, target: 1, unit: 'curso' },
];
