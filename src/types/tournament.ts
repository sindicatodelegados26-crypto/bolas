export type PlayerRole = 'Arrimador' | 'Bochador' | 'Mixto';

export interface Player {
  id: string;
  teamId: string;
  name: string;
  number: string;
  role: PlayerRole;
  isCaptain: boolean;
  active: boolean;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string;
  coachOrCaptain?: string;
}

export interface PlayerMatchStat {
  playerId: string;
  teamId: string;
  arrimesBuenos: number;
  arrimesIntentados: number;
  bochesRastrerosBuenos: number;
  bochesRastrerosIntentados: number;
  bochesAereosBuenos: number;
  bochesAereosIntentados: number;
}

export type MatchStatus = 'programado' | 'en_juego' | 'finalizado';

export interface Match {
  id: string;
  jornada: number;
  vuelta: number;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. '07:00 PM' | '09:00 PM'
  court: string; // e.g. 'Cancha 1'
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  playerStats: Record<string, PlayerMatchStat>;
  notes?: string;
}

export interface TournamentConfig {
  name: string;
  targetTantos: number;
  pointsPerWin: number;
  courts: string[];
  timeSlots: string[];
  vueltas: 1 | 2 | 4;
  startDate: string; // YYYY-MM-DD
  daysBetweenJornadas: number;
}

export interface StandingsRow {
  rank: number;
  team: Team;
  jj: number;
  jg: number;
  jp: number;
  pts: number;
  tf: number;
  tc: number;
  dif: number;
  ave: number;
  streak: ('G' | 'P')[];
  tieReason?: 'Duelo directo' | 'Averaje general' | 'Empate';
}

export interface HeadToHeadCell {
  wins: number;
  losses: number;
  tf: number;
  tc: number;
  played: number;
}

export interface AggregatedPlayerStats {
  player: Player;
  team: Team;
  pj: number;
  arrimesBuenos: number;
  arrimesIntentados: number;
  arrimesPct: number;
  bochesRastrerosBuenos: number;
  bochesRastrerosIntentados: number;
  bochesRastrerosPct: number;
  bochesAereosBuenos: number;
  bochesAereosIntentados: number;
  bochesAereosPct: number;
  totalBochesBuenos: number;
  totalBochesIntentados: number;
  totalBochesPct: number;
  totalAccionesBuenas: number;
  totalAccionesIntentadas: number;
  efectividadGlobal: number;
}

export interface TeamBalanceRow {
  team: Team;
  totalMatches: number;
  byCourt: Record<string, number>;
  byTimeSlot: Record<string, number>;
}
