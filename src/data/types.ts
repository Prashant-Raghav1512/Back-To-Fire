export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Program {
  id: string;
  title: string;
  duration: string;
  difficulty: Difficulty;
  description: string;
  features: string[];
  icon: string;
}

export interface Exercise {
  id: string;
  name: string;
  difficulty: Difficulty;
  muscleGroup: string;
  description: string;
  image: string;
  steps: string[];
}
