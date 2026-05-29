export interface JobAssignment {
  name: string;
  job: string;
}

export interface LeaderboardStats {
  t1: number;
  t2: number;
  t3: number;
  khoi: number;
  co: number;
  red: number;
  early: number;
  calc: number;
  retry: number;
  sabotage: number;
  rules: number;
  frame: number;
}

export interface LeaderboardEntry {
  id: string;
  team: string;
  score: number;
  jobs: JobAssignment[];
  createdAt: Date;
  stats?: LeaderboardStats;
}
