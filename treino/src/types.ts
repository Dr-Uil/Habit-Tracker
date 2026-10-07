export type Sex = 'M' | 'F';
export type Experience = 'iniciante' | 'intermediario' | 'avancado';
export type Goal = 'hipertrofia' | 'recomposicao' | 'emagrecimento' | 'condicionamento';
export type EquipmentAccess = 'academia' | 'halteres' | 'casa';
export type Limitation = 'joelho' | 'ombro' | 'lombar' | 'cotovelo' | 'punho';
export type CardioMode = 'esteira' | 'bike' | 'eliptico' | 'escada' | 'remo' | 'corrida_rua' | 'caminhada';
export type TimeOfDay = 'manha' | 'tarde' | 'noite' | 'variavel';
export type ActivityLevel = 'sedentario' | 'leve' | 'moderado' | 'alto';

export type Muscle =
  | 'peito'
  | 'costas'
  | 'ombros'
  | 'biceps'
  | 'triceps'
  | 'quadriceps'
  | 'posteriores'
  | 'gluteos'
  | 'panturrilhas'
  | 'abdomen';

export type Pattern =
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'knee_ext'
  | 'knee_flex'
  | 'hip_thrust'
  | 'abduction'
  | 'calf'
  | 'h_push'
  | 'incline_push'
  | 'v_push'
  | 'chest_fly'
  | 'h_pull'
  | 'v_pull'
  | 'lateral_raise'
  | 'front_raise'
  | 'shrug'
  | 'rear_delt'
  | 'biceps'
  | 'triceps'
  | 'core';

export type LoadType = 'barra' | 'halter' | 'maquina' | 'cabo' | 'peso_corporal' | 'elastico';

export interface Exercise {
  id: string;
  name: string;
  /** outros nomes usados nas academias (aparecem na busca) */
  aliases?: string[];
  pattern: Pattern;
  kind: 'compound' | 'isolation';
  load: LoadType;
  /** 1 = músculo principal, 0.5 = secundário (contagem fracionada de séries) */
  muscles: Partial<Record<Muscle, number>>;
  avoid?: Limitation[];
  /** 1 = fácil, 2 = moderado, 3 = técnico */
  skill: 1 | 2 | 3;
  /** Ênfase em posição alongada do músculo (evidência de maior hipertrofia) */
  lengthened?: boolean;
  /** Só existe em academia, mesmo sendo peso corporal (ex.: barra fixa) */
  gymOnly?: boolean;
  unilateral?: boolean;
  cues: string[];
}

export interface Questionnaire {
  name: string;
  sex: Sex;
  age: number;
  weightKg: number;
  heightCm: number;
  bodyFatPct?: number;
  experience: Experience;
  goal: Goal;
  daysPerWeek: number;
  sessionMinutes: number;
  extraCardioDays: number;
  equipment: EquipmentAccess;
  limitations: Limitation[];
  priorityMuscles: Muscle[];
  cardioModes: CardioMode[];
  preferredTime: TimeOfDay;
  activityLevel: ActivityLevel;
  sleepHours: number;
  supersets: boolean;
}

export type SlotRole = 'main' | 'secondary' | 'accessory';

export interface Prescription {
  /** chave estável dentro do programa (sessão + posição) */
  key: string;
  exerciseId: string;
  pattern: Pattern;
  role: SlotRole;
  sets: number;
  repMin: number;
  repMax: number;
  restSec: number;
  /** grupo de bi-set (mesma letra = executar alternado) */
  superset?: string;
  priority?: boolean;
}

export type SessionFocus = 'full' | 'upper' | 'lower' | 'push' | 'pull' | 'legs';

export interface CardioPrescription {
  id: string;
  kind: 'zona2' | 'hiit' | 'hiit_curto' | 'caminhada';
  title: string;
  minutes: number;
  mode: CardioMode;
  details: string;
}

export interface Session {
  id: string;
  name: string;
  focus: SessionFocus;
  exercises: Prescription[];
  finisher?: CardioPrescription;
  estimatedMinutes: number;
}

export interface Program {
  id: string;
  createdAt: string;
  genVersion?: number;
  variant?: number;
  splitName: string;
  splitWhy: string;
  sessions: Session[];
  extraCardio: CardioPrescription[];
  weeklyVolume: Partial<Record<Muscle, number>>;
  volumeTarget: Record<Muscle, [number, number]>;
  weekdays: string[][]; // por dia da semana (0=Seg) lista de rótulos
  stepsTarget: number;
  cardioMinutesWeek: number;
  hrMax: number;
  notes: string[];
}

export interface SetLog {
  weight: number | null;
  reps: number | null;
  rir?: number | null;
  done: boolean;
}

export interface ExerciseLog {
  key: string;
  exerciseId: string;
  sets: SetLog[];
}

export interface WorkoutLog {
  id: string;
  programId: string;
  free?: boolean;
  sessionId: string;
  sessionName: string;
  startedAt: string;
  finishedAt: string;
  blockWeek: number;
  deload: boolean;
  exercises: ExerciseLog[];
  cardioDone?: boolean;
  rpe?: number;
  notes?: string;
}

export interface ActiveWorkout {
  programId: string;
  sessionId: string;
  /** treino avulso (fora da sequência do plano) */
  free?: boolean;
  /** registro de um treino já feito: sem cronômetro, com escolha de data */
  retro?: boolean;
  startedAt: string;
  blockWeek: number;
  deload: boolean;
  exercises: (ExerciseLog & { prescription: Prescription })[];
  cardioDone?: boolean;
  restEndsAt?: number;
  restTotal?: number;
}

export interface BodyLog {
  date: string; // YYYY-MM-DD
  weightKg: number;
  waistCm?: number;
}

export interface CardioLog {
  id: string;
  date: string;
  kind: CardioPrescription['kind'] | 'outro';
  minutes: number;
  mode: CardioMode;
}

export interface Profile {
  id: string;
  createdAt: string;
  color: string;
  questionnaire: Questionnaire;
  program: Program;
  workouts: WorkoutLog[];
  bodyLogs: BodyLog[];
  cardioLogs: CardioLog[];
  activeWorkout?: ActiveWorkout;
}

export interface AppData {
  version: 1;
  profiles: Profile[];
  activeProfileId?: string;
  lastBackupAt?: string;
}
