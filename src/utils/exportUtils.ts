import { AggregatedPlayerStats, Match, Player, StandingsRow, Team } from '../types/tournament';

function escapeCsv(val: string | number): string {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportStandingsCsv(rows: StandingsRow[]): void {
  const headers = ['Pos', 'Equipo', 'JJ', 'JG', 'JP', 'PTS', 'TF', 'TC', 'DIF', 'Averaje', 'Desempate'];
  const lines = rows.map((r) =>
    [
      r.rank,
      r.team.name,
      r.jj,
      r.jg,
      r.jp,
      r.pts,
      r.tf,
      r.tc,
      r.dif,
      r.ave.toFixed(3),
      r.tieReason ?? '',
    ]
      .map(escapeCsv)
      .join(',')
  );
  downloadFile([headers.join(','), ...lines].join('\n'), 'clasificacion_torneo.csv', 'text/csv;charset=utf-8;');
}

export function exportPlayerStatsCsv(stats: AggregatedPlayerStats[]): void {
  const headers = [
    'Jugador',
    'Numero',
    'Equipo',
    'Rol',
    'PJ',
    'Arrimes Buenos',
    'Arrimes Intentados',
    '% Arrimes',
    'Boches Rastreros Buenos',
    'Boches Rastreros Intentados',
    '% Rastreros',
    'Boches Aereos Buenos',
    'Boches Aereos Intentados',
    '% Aereos',
    'Total Boches Buenos',
    'Total Boches Intentados',
    '% Total Boches',
    '% Global',
  ];
  const lines = stats.map((s) =>
    [
      s.player.name,
      s.player.number,
      s.team.name,
      s.player.role,
      s.pj,
      s.arrimesBuenos,
      s.arrimesIntentados,
      s.arrimesPct.toFixed(1),
      s.bochesRastrerosBuenos,
      s.bochesRastrerosIntentados,
      s.bochesRastrerosPct.toFixed(1),
      s.bochesAereosBuenos,
      s.bochesAereosIntentados,
      s.bochesAereosPct.toFixed(1),
      s.totalBochesBuenos,
      s.totalBochesIntentados,
      s.totalBochesPct.toFixed(1),
      s.efectividadGlobal.toFixed(1),
    ]
      .map(escapeCsv)
      .join(',')
  );
  downloadFile([headers.join(','), ...lines].join('\n'), 'estadisticas_jugadores.csv', 'text/csv;charset=utf-8;');
}

export function exportTeamRosterCsv(team: Team, players: Player[]): void {
  const headers = ['Numero', 'Nombre', 'Rol', 'Capitan', 'Estado'];
  const lines = players.map((p) =>
    [p.number, p.name, p.role, p.isCaptain ? 'Sí' : 'No', p.active ? 'Activo' : 'Suplente']
      .map(escapeCsv)
      .join(',')
  );
  const slug = team.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  downloadFile([headers.join(','), ...lines].join('\n'), `planilla_${slug}.csv`, 'text/csv;charset=utf-8;');
}

export function exportScheduleCsv(matches: Match[], teams: Team[]): void {
  const teamMap = new Map(teams.map((t) => [t.id, t.name]));
  const headers = ['Jornada', 'Vuelta', 'Fecha', 'Hora', 'Cancha', 'Local', 'Tantos Local', 'Tantos Visitante', 'Visitante', 'Estado'];
  const lines = matches.map((m) =>
    [
      m.jornada,
      m.vuelta,
      m.date,
      m.timeSlot,
      m.court,
      teamMap.get(m.homeTeamId) ?? m.homeTeamId,
      m.homeScore ?? '',
      m.awayScore ?? '',
      teamMap.get(m.awayTeamId) ?? m.awayTeamId,
      m.status,
    ]
      .map(escapeCsv)
      .join(',')
  );
  downloadFile([headers.join(','), ...lines].join('\n'), 'calendario_torneo.csv', 'text/csv;charset=utf-8;');
}
