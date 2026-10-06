import type { Questionnaire } from '../../types';

export const baseQ: Questionnaire = {
  name: 'Teste',
  sex: 'M',
  age: 38,
  weightKg: 88,
  heightCm: 178,
  experience: 'intermediario',
  goal: 'recomposicao',
  daysPerWeek: 4,
  sessionMinutes: 60,
  extraCardioDays: 1,
  equipment: 'academia',
  limitations: [],
  priorityMuscles: [],
  cardioModes: ['esteira', 'bike'],
  preferredTime: 'tarde',
  activityLevel: 'leve',
  sleepHours: 7,
  supersets: true,
};
