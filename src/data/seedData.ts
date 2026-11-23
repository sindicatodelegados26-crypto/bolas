import { Match, Player, PlayerMatchStat, Team, TournamentConfig } from '../types/tournament';
import { generateBalancedSchedule } from '../utils/scheduler';

export const DEFAULT_CONFIG: TournamentConfig = {
  name: 'Copa Liga Nocturna de Bolas Criollas',
  targetTantos: 20,
  pointsPerWin: 2,
  courts: ['Cancha 1', 'Cancha 2', 'Cancha 3', 'Cancha 4'],
  timeSlots: ['07:00 PM', '09:00 PM'],
  vueltas: 2,
  startDate: '2026-11-27',
  daysBetweenJornadas: 7,
};

export const INITIAL_TEAMS: Team[] = [
  { id: 't1', name: 'Club Los Laureles', shortName: 'LAU', color: '#15803D', coachOrCaptain: 'Carlos Mendoza' },
  { id: 't2', name: 'Deportivo El Samán', shortName: 'SAM', color: '#1D4ED8', coachOrCaptain: 'Rafael Briceño' },
  { id: 't3', name: 'Atlético La Palma', shortName: 'PAL', color: '#B45309', coachOrCaptain: 'Luis Zambrano' },
  { id: 't4', name: 'Unión Central', shortName: 'UNI', color: '#B91C1C', coachOrCaptain: 'José Gregorio Páez' },
  { id: 't5', name: 'Caciques del Valle', shortName: 'CAC', color: '#0F766E', coachOrCaptain: 'Miguel Ángel Rojas' },
  { id: 't6', name: 'Halcones de Oriente', shortName: 'HAL', color: '#4338CA', coachOrCaptain: 'Pedro Castellanos' },
];

export const INITIAL_PLAYERS: Player[] = [
  // Club Los Laureles (t1)
  { id: 'p101', teamId: 't1', name: 'Carlos Mendoza', number: '04', role: 'Arrimador', isCaptain: true, active: true },
  { id: 'p102', teamId: 't1', name: 'Andrés Quintero', number: '07', role: 'Bochador', isCaptain: false, active: true },
  { id: 'p103', teamId: 't1', name: 'Héctor Villalobos', number: '11', role: 'Mixto', isCaptain: false, active: true },
  { id: 'p104', teamId: 't1', name: 'Jesús Ramírez', number: '15', role: 'Arrimador', isCaptain: false, active: true },
  { id: 'p105', teamId: 't1', name: 'Marcos Delgado', number: '21', role: 'Bochador', isCaptain: false, active: true },
  { id: 'p106', teamId: 't1', name: 'Ricardo Morales', number: '28', role: 'Mixto', isCaptain: false, active: true },

  // Deportivo El Samán (t2)
  { id: 'p201', teamId: 't2', name: 'Rafael Briceño', number: '02', role: 'Bochador', isCaptain: true, active: true },
  { id: 'p202', teamId: 't2', name: 'Víctor Alvarado', number: '05', role: 'Arrimador', isCaptain: false, active: true },
  { id: 'p203', teamId: 't2', name: 'Óscar Hernández', number: '09', role: 'Mixto', isCaptain: false, active: true },
  { id: 'p204', teamId: 't2', name: 'Daniel Contreras', number: '14', role: 'Arrimador', isCaptain: false, active: true },
  { id: 'p205', teamId: 't2', name: 'Jorge Salcedo', number: '19', role: 'Bochador', isCaptain: false, active: true },
  { id: 'p206', teamId: 't2', name: 'Eduardo Peña', number: '24', role: 'Mixto', isCaptain: false, active: true },

  // Atlético La Palma (t3)
  { id: 'p301', teamId: 't3', name: 'Luis Zambrano', number: '01', role: 'Arrimador', isCaptain: true, active: true },
  { id: 'p302', teamId: 't3', name: 'Fernando Gutiérrez', number: '06', role: 'Bochador', isCaptain: false, active: true },
  { id: 'p303', teamId: 't3', name: 'Gabriel Rangel', number: '10', role: 'Mixto', isCaptain: false, active: true },
  { id: 'p304', teamId: 't3', name: 'César Colmenares', number: '13', role: 'Bochador', isCaptain: false, active: true },
  { id: 'p305', teamId: 't3', name: 'Tomás Medina', number: '18', role: 'Arrimador', isCaptain: false, active: true },
  { id: 'p306', teamId: 't3', name: 'Simón Parra', number: '22', role: 'Mixto', isCaptain: false, active: true },

  // Unión Central (t4)
  { id: 'p401', teamId: 't4', name: 'José Gregorio Páez', number: '03', role: 'Mixto', isCaptain: true, active: true },
  { id: 'p402', teamId: 't4', name: 'Roberto Blanco', number: '08', role: 'Bochador', isCaptain: false, active: true },
  { id: 'p403', teamId: 't4', name: 'Alfonso Torrealba', number: '12', role: 'Arrimador', isCaptain: false, active: true },
  { id: 'p404', teamId: 't4', name: 'Néstor Jiménez', number: '16', role: 'Arrimador', isCaptain: false, active: true },
  { id: 'p405', teamId: 't4', name: 'Wilmer Suárez', number: '20', role: 'Bochador', isCaptain: false, active: true },
  { id: 'p406', teamId: 't4', name: 'Francisco Acosta', number: '25', role: 'Mixto', isCaptain: false, active: true },

  // Caciques del Valle (t5)
  { id: 'p501', teamId: 't5', name: 'Miguel Ángel Rojas', number: '05', role: 'Bochador', isCaptain: true, active: true },
  { id: 'p502', teamId: 't5', name: 'Gustavo Méndez', number: '07', role: 'Arrimador', isCaptain: false, active: true },
  { id: 'p503', teamId: 't5', name: 'Juan Carlos Silva', number: '11', role: 'Mixto', isCaptain: false, active: true },
  { id: 'p504', teamId: 't5', name: 'Enrique Navarro', number: '17', role: 'Arrimador', isCaptain: false, active: true },
  { id: 'p505', teamId: 't5', name: 'Raúl Chirinos', number: '23', role: 'Bochador', isCaptain: false, active: true },
  { id: 'p506', teamId: 't5', name: 'Diego Márquez', number: '29', role: 'Mixto', isCaptain: false, active: true },

  // Halcones de Oriente (t6)
  { id: 'p601', teamId: 't6', name: 'Pedro Castellanos', number: '04', role: 'Arrimador', isCaptain: true, active: true },
  { id: 'p602', teamId: 't6', name: 'Orlando Díaz', number: '08', role: 'Bochador', isCaptain: false, active: true },
  { id: 'p603', teamId: 't6', name: 'Leonardo Barrios', number: '10', role: 'Mixto', isCaptain: false, active: true },
  { id: 'p604', teamId: 't6', name: 'Sergio Rivas', number: '14', role: 'Bochador', isCaptain: false, active: true },
  { id: 'p605', teamId: 't6', name: 'Darío Camacho', number: '19', role: 'Arrimador', isCaptain: false, active: true },
  { id: 'p606', teamId: 't6', name: 'Iván Herrera', number: '27', role: 'Mixto', isCaptain: false, active: true },
];

function buildRealisticStatsForMatch(
  homeTeamId: string,
  awayTeamId: string,
  homeWon: boolean,
  players: Player[],
  seedOffset: number
): Record<string, PlayerMatchStat> {
  const stats: Record<string, PlayerMatchStat> = {};
  const homePlayers = players.filter((p) => p.teamId === homeTeamId);
  const awayPlayers = players.filter((p) => p.teamId === awayTeamId);

  const assignTeam = (teamPlayers: Player[], isWinner: boolean) => {
    teamPlayers.slice(0, 4).forEach((p, idx) => {
      const boost = isWinner ? 1 : 0;
      const v = (seedOffset + idx) % 3;
      if (p.role === 'Arrimador') {
        const ai = 9 + v;
        const ab = Math.min(ai, 6 + boost + (idx % 2));
        const bri = 3 + (v % 2);
        const brb = Math.min(bri, 1 + boost);
        const bai = 1;
        const bab = isWinner && idx === 0 ? 1 : 0;
        stats[p.id] = {
          playerId: p.id,
          teamId: p.teamId,
          arrimesBuenos: ab,
          arrimesIntentados: ai,
          bochesRastrerosBuenos: brb,
          bochesRastrerosIntentados: bri,
          bochesAereosBuenos: bab,
          bochesAereosIntentados: bai,
        };
      } else if (p.role === 'Bochador') {
        const ai = 3 + (v % 2);
        const ab = Math.min(ai, 2 + (boost && idx % 2 === 0 ? 1 : 0));
        const bri = 6 + v;
        const brb = Math.min(bri, 4 + boost);
        const bai = 5 + (v % 3);
        const bab = Math.min(bai, 3 + boost);
        stats[p.id] = {
          playerId: p.id,
          teamId: p.teamId,
          arrimesBuenos: ab,
          arrimesIntentados: ai,
          bochesRastrerosBuenos: brb,
          bochesRastrerosIntentados: bri,
          bochesAereosBuenos: bab,
          bochesAereosIntentados: bai,
        };
      } else {
        const ai = 6 + v;
        const ab = Math.min(ai, 4 + boost);
        const bri = 4 + (v % 2);
        const brb = Math.min(bri, 2 + boost);
        const bai = 3 + (v % 2);
        const bab = Math.min(bai, 2);
        stats[p.id] = {
          playerId: p.id,
          teamId: p.teamId,
          arrimesBuenos: ab,
          arrimesIntentados: ai,
          bochesRastrerosBuenos: brb,
          bochesRastrerosIntentados: bri,
          bochesAereosBuenos: bab,
          bochesAereosIntentados: bai,
        };
      }
    });
  };

  assignTeam(homePlayers, homeWon);
  assignTeam(awayPlayers, !homeWon);
  return stats;
}

export function buildInitialSeedState(): {
  config: TournamentConfig;
  teams: Team[];
  players: Player[];
  matches: Match[];
} {
  const config = { ...DEFAULT_CONFIG };
  const teams = INITIAL_TEAMS.map((t) => ({ ...t }));
  const players = INITIAL_PLAYERS.map((p) => ({ ...p }));
  const matches = generateBalancedSchedule(teams, config);

  // Populate Jornadas 1 and 2 with realistic finalized scores and player stats
  // so standings (including Head-to-Head and Average tiebreakers) & stats are alive immediately.
  const scoreTemplates: Array<[number, number]> = [
    [20, 14],
    [16, 20],
    [20, 17],
    [20, 12],
    [18, 20],
    [20, 15],
  ];

  let templateIdx = 0;
  for (const m of matches) {
    if (m.jornada <= 2) {
      const [hs, as] = scoreTemplates[templateIdx % scoreTemplates.length];
      m.homeScore = hs;
      m.awayScore = as;
      m.status = 'finalizado';
      m.playerStats = buildRealisticStatsForMatch(
        m.homeTeamId,
        m.awayTeamId,
        hs > as,
        players,
        templateIdx
      );
      templateIdx += 1;
    }
  }

  return { config, teams, players, matches };
}
