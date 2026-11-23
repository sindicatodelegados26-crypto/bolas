import {
  AggregatedPlayerStats,
  HeadToHeadCell,
  Match,
  Player,
  StandingsRow,
  Team,
  TournamentConfig,
} from '../types/tournament';

interface RawStanding {
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
}

function getFinishedMatches(matches: Match[]): Match[] {
  return matches
    .filter(
      (m) =>
        m.status === 'finalizado' &&
        m.homeScore !== null &&
        m.awayScore !== null &&
        m.homeScore !== m.awayScore
    )
    .sort((a, b) => a.jornada - b.jornada || a.date.localeCompare(b.date));
}

function computeMiniH2H(
  groupIds: Set<string>,
  finishedMatches: Match[],
  pointsPerWin: number
): Map<string, { pts: number; wins: number; dif: number; tf: number }> {
  const stats = new Map<string, { pts: number; wins: number; dif: number; tf: number }>();
  for (const id of groupIds) {
    stats.set(id, { pts: 0, wins: 0, dif: 0, tf: 0 });
  }

  for (const m of finishedMatches) {
    if (!groupIds.has(m.homeTeamId) || !groupIds.has(m.awayTeamId)) continue;
    const hs = m.homeScore!;
    const as = m.awayScore!;
    const hStat = stats.get(m.homeTeamId)!;
    const aStat = stats.get(m.awayTeamId)!;

    hStat.tf += hs;
    hStat.dif += hs - as;
    aStat.tf += as;
    aStat.dif += as - hs;

    if (hs > as) {
      hStat.wins += 1;
      hStat.pts += pointsPerWin;
    } else {
      aStat.wins += 1;
      aStat.pts += pointsPerWin;
    }
  }

  return stats;
}

/**
 * Recursively resolves ties within a group of teams that have identical main PTS:
 * 1. Juegos Entre Sí (Head-to-Head points, then Head-to-Head point difference)
 * 2. Averaje General (General DIF = TF - TC, then Ratio AVE = TF / TC, then TF)
 */
function resolveTiedGroup(
  group: RawStanding[],
  finishedMatches: Match[],
  pointsPerWin: number
): { row: RawStanding; tieReason?: 'Duelo directo' | 'Averaje general' | 'Empate' }[] {
  if (group.length <= 1) {
    return group.map((row) => ({ row }));
  }

  const groupIds = new Set(group.map((g) => g.team.id));
  const h2h = computeMiniH2H(groupIds, finishedMatches, pointsPerWin);

  // Check if any H2H games were actually played between teams in this group
  const anyH2HPlayed = Array.from(h2h.values()).some((v) => v.pts > 0 || v.dif !== 0);

  // Sort by H2H PTS -> H2H DIF -> H2H TF first
  const sortedByH2H = [...group].sort((a, b) => {
    const ha = h2h.get(a.team.id)!;
    const hb = h2h.get(b.team.id)!;
    if (hb.pts !== ha.pts) return hb.pts - ha.pts;
    if (hb.dif !== ha.dif) return hb.dif - ha.dif;
    if (hb.tf !== ha.tf) return hb.tf - ha.tf;
    return 0;
  });

  // Partition into sub-buckets that are still tied on H2H
  const h2hBuckets: RawStanding[][] = [];
  for (const item of sortedByH2H) {
    const hi = h2h.get(item.team.id)!;
    const prevBucket = h2hBuckets[h2hBuckets.length - 1];
    if (!prevBucket) {
      h2hBuckets.push([item]);
    } else {
      const hp = h2h.get(prevBucket[0].team.id)!;
      if (hi.pts === hp.pts && hi.dif === hp.dif && hi.tf === hp.tf) {
        prevBucket.push(item);
      } else {
        h2hBuckets.push([item]);
      }
    }
  }

  const result: { row: RawStanding; tieReason?: 'Duelo directo' | 'Averaje general' | 'Empate' }[] = [];

  for (const bucket of h2hBuckets) {
    if (bucket.length === 1) {
      result.push({
        row: bucket[0],
        tieReason: anyH2HPlayed && h2hBuckets.length > 1 ? 'Duelo directo' : 'Averaje general',
      });
    } else if (bucket.length < group.length && anyH2HPlayed) {
      // A subset separated cleanly by H2H, recursively resolve the remaining tied subset
      const subResolved = resolveTiedGroup(bucket, finishedMatches, pointsPerWin);
      for (const item of subResolved) {
        result.push({
          row: item.row,
          tieReason: item.tieReason ?? 'Duelo directo',
        });
      }
    } else {
      // H2H did not break the tie (e.g., circular tie or haven't played each other yet)
      // Break by General Average: DIF (TF - TC) -> Ratio (TF / TC) -> TF -> JG -> Name
      const sortedByAvg = [...bucket].sort((a, b) => {
        if (b.dif !== a.dif) return b.dif - a.dif;
        if (b.ave !== a.ave) return b.ave - a.ave;
        if (b.tf !== a.tf) return b.tf - a.tf;
        if (b.jg !== a.jg) return b.jg - a.jg;
        return a.team.name.localeCompare(b.team.name, 'es');
      });

      for (let i = 0; i < sortedByAvg.length; i++) {
        const curr = sortedByAvg[i];
        const prev = sortedByAvg[i - 1];
        const next = sortedByAvg[i + 1];
        const exactSameAvg =
          (prev && prev.dif === curr.dif && prev.ave === curr.ave && prev.tf === curr.tf) ||
          (next && next.dif === curr.dif && next.ave === curr.ave && next.tf === curr.tf);

        result.push({
          row: curr,
          tieReason: exactSameAvg ? 'Empate' : 'Averaje general',
        });
      }
    }
  }

  return result;
}

/**
 * Computes official Standings ordered by:
 * 1. Puntos (PTS)
 * 2. Juegos Entre Sí (Duelo Directo)
 * 3. Averaje (Diferencia TF - TC, luego Cociente TF / TC)
 */
export function computeStandings(
  teams: Team[],
  matches: Match[],
  config: TournamentConfig
): StandingsRow[] {
  const finished = getFinishedMatches(matches);
  const rawMap = new Map<string, RawStanding>();

  for (const team of teams) {
    rawMap.set(team.id, {
      team,
      jj: 0,
      jg: 0,
      jp: 0,
      pts: 0,
      tf: 0,
      tc: 0,
      dif: 0,
      ave: 0,
      streak: [],
    });
  }

  for (const m of finished) {
    const home = rawMap.get(m.homeTeamId);
    const away = rawMap.get(m.awayTeamId);
    if (!home || !away) continue;

    const hs = m.homeScore!;
    const as = m.awayScore!;

    home.jj += 1;
    away.jj += 1;
    home.tf += hs;
    home.tc += as;
    away.tf += as;
    away.tc += hs;

    if (hs > as) {
      home.jg += 1;
      home.pts += config.pointsPerWin;
      home.streak.push('G');
      away.jp += 1;
      away.streak.push('P');
    } else {
      away.jg += 1;
      away.pts += config.pointsPerWin;
      away.streak.push('G');
      home.jp += 1;
      home.streak.push('P');
    }
  }

  const allRaw = Array.from(rawMap.values()).map((r) => ({
    ...r,
    dif: r.tf - r.tc,
    ave: r.tc === 0 ? (r.tf > 0 ? r.tf : 0) : r.tf / r.tc,
    streak: r.streak.slice(-5),
  }));

  // Group by PTS descending
  allRaw.sort((a, b) => b.pts - a.pts);

  const ptsGroups: RawStanding[][] = [];
  for (const r of allRaw) {
    const lastGroup = ptsGroups[ptsGroups.length - 1];
    if (!lastGroup || lastGroup[0].pts !== r.pts) {
      ptsGroups.push([r]);
    } else {
      lastGroup.push(r);
    }
  }

  const ordered: StandingsRow[] = [];
  let rankCounter = 1;

  for (const grp of ptsGroups) {
    const resolved = resolveTiedGroup(grp, finished, config.pointsPerWin);
    for (const item of resolved) {
      ordered.push({
        rank: rankCounter++,
        ...item.row,
        tieReason: grp.length > 1 ? item.tieReason : undefined,
      });
    }
  }

  return ordered;
}

/**
 * Builds Head-to-Head Matrix across all teams from finalized matches.
 */
export function computeHeadToHeadMatrix(
  teams: Team[],
  matches: Match[]
): Record<string, Record<string, HeadToHeadCell>> {
  const finished = getFinishedMatches(matches);
  const matrix: Record<string, Record<string, HeadToHeadCell>> = {};

  for (const t1 of teams) {
    matrix[t1.id] = {};
    for (const t2 of teams) {
      matrix[t1.id][t2.id] = { wins: 0, losses: 0, tf: 0, tc: 0, played: 0 };
    }
  }

  for (const m of finished) {
    const hCell = matrix[m.homeTeamId]?.[m.awayTeamId];
    const aCell = matrix[m.awayTeamId]?.[m.homeTeamId];
    if (!hCell || !aCell) continue;

    const hs = m.homeScore!;
    const as = m.awayScore!;

    hCell.played += 1;
    aCell.played += 1;
    hCell.tf += hs;
    hCell.tc += as;
    aCell.tf += as;
    aCell.tc += hs;

    if (hs > as) {
      hCell.wins += 1;
      aCell.losses += 1;
    } else {
      aCell.wins += 1;
      hCell.losses += 1;
    }
  }

  return matrix;
}

/**
 * Aggregates all players' technical statistics across matches:
 * Arrimes, Boches Rastreros, and Boches Aéreos.
 */
export function computePlayerStats(
  players: Player[],
  teams: Team[],
  matches: Match[]
): AggregatedPlayerStats[] {
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const accMap = new Map<
    string,
    {
      pj: number;
      ab: number;
      ai: number;
      brb: number;
      bri: number;
      bab: number;
      bai: number;
    }
  >();

  for (const p of players) {
    accMap.set(p.id, { pj: 0, ab: 0, ai: 0, brb: 0, bri: 0, bab: 0, bai: 0 });
  }

  for (const m of matches) {
    if (m.status === 'programado') continue;
    for (const [playerId, stat] of Object.entries(m.playerStats || {})) {
      const acc = accMap.get(playerId);
      if (!acc) continue;
      const totalActions =
        stat.arrimesIntentados +
        stat.bochesRastrerosIntentados +
        stat.bochesAereosIntentados;

      if (totalActions > 0 || m.status === 'finalizado') {
        if (totalActions > 0) acc.pj += 1;
        acc.ab += stat.arrimesBuenos;
        acc.ai += stat.arrimesIntentados;
        acc.brb += stat.bochesRastrerosBuenos;
        acc.bri += stat.bochesRastrerosIntentados;
        acc.bab += stat.bochesAereosBuenos;
        acc.bai += stat.bochesAereosIntentados;
      }
    }
  }

  return players
    .map((player) => {
      const team = teamMap.get(player.teamId);
      if (!team) return null;
      const acc = accMap.get(player.id)!;
      const totalBochesBuenos = acc.brb + acc.bab;
      const totalBochesIntentados = acc.bri + acc.bai;
      const totalAccionesBuenas = acc.ab + totalBochesBuenos;
      const totalAccionesIntentadas = acc.ai + totalBochesIntentados;

      return {
        player,
        team,
        pj: acc.pj,
        arrimesBuenos: acc.ab,
        arrimesIntentados: acc.ai,
        arrimesPct: acc.ai > 0 ? (acc.ab / acc.ai) * 100 : 0,
        bochesRastrerosBuenos: acc.brb,
        bochesRastrerosIntentados: acc.bri,
        bochesRastrerosPct: acc.bri > 0 ? (acc.brb / acc.bri) * 100 : 0,
        bochesAereosBuenos: acc.bab,
        bochesAereosIntentados: acc.bai,
        bochesAereosPct: acc.bai > 0 ? (acc.bab / acc.bai) * 100 : 0,
        totalBochesBuenos,
        totalBochesIntentados,
        totalBochesPct:
          totalBochesIntentados > 0 ? (totalBochesBuenos / totalBochesIntentados) * 100 : 0,
        totalAccionesBuenas,
        totalAccionesIntentadas,
        efectividadGlobal:
          totalAccionesIntentadas > 0
            ? (totalAccionesBuenas / totalAccionesIntentadas) * 100
            : 0,
      };
    })
    .filter((x): x is AggregatedPlayerStats => x !== null);
}
