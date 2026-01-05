
export enum GoalFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  frequency: GoalFrequency;
  target: number; // e.g., 209 for gym, 3 for books
  unit: string;   // e.g., 'vezes', 'livros', 'R$'
}

export interface DailyLog {
  date: string; // ISO format YYYY-MM-DD
  completedGoalIds: string[];
}

export interface ProgressState {
  logs: DailyLog[];
  year: number;
}
