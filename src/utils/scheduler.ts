import { Match, Team, TeamBalanceRow, TournamentConfig } from '../types/tournament';

const BYE_ID = '__BYE__';

function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

interface RawPairing {
  jornada: number;
  vuelta: number;
  homeTeamId: string;
  awayTeamId: string;
}

/**
 * Generates standard Berger circle-method round-robin rounds.
 * Alternates home/away across vueltas and within rounds.
 */
function generateBergerPairings(teams: Team[], vueltas: number): RawPairing[] {
  if (teams.length < 2) return [];

  const ids = teams.map((t) => t.id);
  const hasBye = ids.length % 2 !== 0;
  if (hasBye) {
    ids.push(BYE_ID);
  }

  const n = ids.length;
  const roundsPerVuelta = n - 1;
  const half = n / 2;
  const allPairings: RawPairing[] = [];

  for (let v = 1; v <= vueltas; v++) {
    const rotating = ids.slice(1);
    const fixed = ids[0];

    for (let r = 0; r < roundsPerVuelta; r++) {
      const roundList = [fixed, ...rotating];
      const jornadaNum = (v - 1) * roundsPerVuelta + (r + 1);

      for (let i = 0; i < half; i++) {
        let home = roundList[i];
        let away = roundList[n - 1 - i];

        if (home === BYE_ID || away === BYE_ID) continue;

        // Alternate home/away cleanly
        const swapBase = i === 0 ? r % 2 === 1 : (r + i) % 2 === 1;
        const swapVuelta = v % 2 === 0;
        if (swapBase !== swapVuelta) {
          [home, away] = [away, home];
        }

        allPairings.push({
          jornada: jornadaNum,
          vuelta: v,
          homeTeamId: home,
          awayTeamId: away,
        });
      }

      // Rotate clockwise: move last element to front of rotating array
      const last = rotating.pop()!;
      rotating.unshift(last);
    }
  }

  return allPairings;
}

/**
 * Computes balance penalty across all teams for court & time slot distribution.
 * Minimizes max-min spread per team first, then variance, then global court balance.
 */
function computeScheduleCost(
  matches: Match[],
  teams: Team[],
  courts: string[],
  timeSlots: string[]
): number {
  const teamCourt: Record<string, Record<string, number>> = {};
  const teamSlot: Record<string, Record<string, number>> = {};
  const globalCourt: Record<string, number> = {};
  const globalSlot: Record<string, number> = {};

  for (const c of courts) globalCourt[c] = 0;
  for (const s of timeSlots) globalSlot[s] = 0;

  for (const t of teams) {
    teamCourt[t.id] = {};
    teamSlot[t.id] = {};
    for (const c of courts) teamCourt[t.id][c] = 0;
    for (const s of timeSlots) teamSlot[t.id][s] = 0;
  }

  for (const m of matches) {
    if (teamCourt[m.homeTeamId]) {
      teamCourt[m.homeTeamId][m.court] = (teamCourt[m.homeTeamId][m.court] || 0) + 1;
      teamSlot[m.homeTeamId][m.timeSlot] = (teamSlot[m.homeTeamId][m.timeSlot] || 0) + 1;
    }
    if (teamCourt[m.awayTeamId]) {
      teamCourt[m.awayTeamId][m.court] = (teamCourt[m.awayTeamId][m.court] || 0) + 1;
      teamSlot[m.awayTeamId][m.timeSlot] = (teamSlot[m.awayTeamId][m.timeSlot] || 0) + 1;
    }
    globalCourt[m.court] = (globalCourt[m.court] || 0) + 1;
    globalSlot[m.timeSlot] = (globalSlot[m.timeSlot] || 0) + 1;
  }

  let cost = 0;

  // Strongly penalize spread & variance per team on courts and timeSlots
  for (const t of teams) {
    const cVals = courts.map((c) => teamCourt[t.id][c] || 0);
    const cMax = Math.max(...cVals);
    const cMin = Math.min(...cVals);
    const cAvg = cVals.reduce((a, b) => a + b, 0) / Math.max(1, courts.length);
    const cVar = cVals.reduce((acc, v) => acc + (v - cAvg) ** 2, 0);
    cost += (cMax - cMin) * 25 + cVar * 12;

    const sVals = timeSlots.map((s) => teamSlot[t.id][s] || 0);
    const sMax = Math.max(...sVals);
    const sMin = Math.min(...sVals);
    const sAvg = sVals.reduce((a, b) => a + b, 0) / Math.max(1, timeSlots.length);
    const sVar = sVals.reduce((acc, v) => acc + (v - sAvg) ** 2, 0);
    cost += (sMax - sMin) * 35 + sVar * 18;
  }

  // Global court & slot balance
  const gcVals = courts.map((c) => globalCourt[c] || 0);
  const gcAvg = gcVals.reduce((a, b) => a + b, 0) / Math.max(1, courts.length);
  cost += gcVals.reduce((acc, v) => acc + (v - gcAvg) ** 2, 0) * 3;

  const gsVals = timeSlots.map((s) => globalSlot[s] || 0);
  const gsAvg = gsVals.reduce((a, b) => a + b, 0) / Math.max(1, timeSlots.length);
  cost += gsVals.reduce((acc, v) => acc + (v - gsAvg) ** 2, 0) * 2;

  return cost;
}

/**
 * Generates a balanced tournament schedule distributing every team
 * as evenly as mathematically possible across all courts and time slots.
 */
export function generateBalancedSchedule(
  teams: Team[],
  config: TournamentConfig
): Match[] {
  const courts = config.courts.length > 0 ? config.courts : ['Cancha 1', 'Cancha 2', 'Cancha 3', 'Cancha 4'];
  const timeSlots = config.timeSlots.length > 0 ? config.timeSlots : ['07:00 PM', '09:00 PM'];
  const rawPairings = generateBergerPairings(teams, config.vueltas);

  if (rawPairings.length === 0) return [];

  // Group pairings by jornada
  const byJornada = new Map<number, RawPairing[]>();
  for (const p of rawPairings) {
    const arr = byJornada.get(p.jornada) ?? [];
    arr.push(p);
    byJornada.set(p.jornada, arr);
  }

  const slotsPerDay = courts.length * timeSlots.length;
  const sortedJornadas = Array.from(byJornada.keys()).sort((a, b) => a - b);

  // Deterministic pseudo-random helper for multi-start orderings
  const seededShuffle = <T,>(arr: T[], seed: number): T[] => {
    const copy = [...arr];
    let s = seed + 1;
    for (let i = copy.length - 1; i > 0; i--) {
      s = (s * 1664525 + 1013904223) % 4294967296;
      const j = s % (i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  let bestMatches: Match[] = [];
  let bestGlobalCost = Number.POSITIVE_INFINITY;

  const TRIALS = 16;
  for (let trial = 0; trial < TRIALS; trial++) {
    const teamCourtCounts: Record<string, Record<string, number>> = {};
    const teamSlotCounts: Record<string, Record<string, number>> = {};
    const globalCourtCounts: Record<string, number> = {};
    const globalSlotCounts: Record<string, number> = {};

    for (const c of courts) globalCourtCounts[c] = 0;
    for (const s of timeSlots) globalSlotCounts[s] = 0;
    for (const t of teams) {
      teamCourtCounts[t.id] = {};
      teamSlotCounts[t.id] = {};
      for (const c of courts) teamCourtCounts[t.id][c] = 0;
      for (const s of timeSlots) teamSlotCounts[t.id][s] = 0;
    }

    const trialMatches: Match[] = [];
    let dayOffset = 0;

    for (const jornadaNum of sortedJornadas) {
      const pairings = byJornada.get(jornadaNum)!;
      const totalSubDays = Math.ceil(pairings.length / slotsPerDay);
      const usedSlotsPerSubDay: Set<string>[] = Array.from(
        { length: totalSubDays },
        () => new Set<string>()
      );

      const orderedPairings =
        trial === 0 ? [...pairings] : seededShuffle(pairings, trial * 97 + jornadaNum);

      const courtOrderTrial =
        trial === 0 ? courts : seededShuffle(courts, trial * 31 + jornadaNum);
      const slotOrderTrial =
        trial === 0 ? timeSlots : seededShuffle(timeSlots, trial * 53 + jornadaNum);

      orderedPairings.forEach((p, idx) => {
        const subDay = Math.floor(idx / slotsPerDay);
        const usedSet = usedSlotsPerSubDay[subDay];

        let bestCourt = courtOrderTrial[0];
        let bestSlot = slotOrderTrial[0];
        let bestScore = Number.POSITIVE_INFINITY;

        for (const s of slotOrderTrial) {
          for (const c of courtOrderTrial) {
            const key = `${c}__${s}`;
            if (usedSet.has(key)) continue;

            const homeC = teamCourtCounts[p.homeTeamId]?.[c] ?? 0;
            const awayC = teamCourtCounts[p.awayTeamId]?.[c] ?? 0;
            const homeS = teamSlotCounts[p.homeTeamId]?.[s] ?? 0;
            const awayS = teamSlotCounts[p.awayTeamId]?.[s] ?? 0;
            const globC = globalCourtCounts[c] ?? 0;
            const globS = globalSlotCounts[s] ?? 0;

            const score =
              (homeC ** 2 + awayC ** 2) * 14 +
              (homeC + awayC) * 10 +
              (homeS ** 2 + awayS ** 2) * 18 +
              (homeS + awayS) * 12 +
              globC * 2.5 +
              globS * 1.5;

            if (score < bestScore) {
              bestScore = score;
              bestCourt = c;
              bestSlot = s;
            }
          }
        }

        usedSet.add(`${bestCourt}__${bestSlot}`);

        if (teamCourtCounts[p.homeTeamId]) {
          teamCourtCounts[p.homeTeamId][bestCourt] += 1;
          teamSlotCounts[p.homeTeamId][bestSlot] += 1;
        }
        if (teamCourtCounts[p.awayTeamId]) {
          teamCourtCounts[p.awayTeamId][bestCourt] += 1;
          teamSlotCounts[p.awayTeamId][bestSlot] += 1;
        }
        globalCourtCounts[bestCourt] += 1;
        globalSlotCounts[bestSlot] += 1;

        const matchDate = addDays(
          config.startDate,
          (dayOffset + subDay) * config.daysBetweenJornadas
        );

        trialMatches.push({
          id: `m-j${jornadaNum}-${p.homeTeamId}-${p.awayTeamId}-${idx}`,
          jornada: jornadaNum,
          vuelta: p.vuelta,
          date: matchDate,
          timeSlot: bestSlot,
          court: bestCourt,
          homeTeamId: p.homeTeamId,
          awayTeamId: p.awayTeamId,
          homeScore: null,
          awayScore: null,
          status: 'programado',
          playerStats: {},
        });
      });

      dayOffset += totalSubDays;
    }

    let currentCost = computeScheduleCost(trialMatches, teams, courts, timeSlots);
    const byDateGroup = new Map<string, number[]>();
    trialMatches.forEach((m, idx) => {
      const k = `${m.jornada}_${m.date}`;
      const arr = byDateGroup.get(k) ?? [];
      arr.push(idx);
      byDateGroup.set(k, arr);
    });

    for (let pass = 0; pass < 20; pass++) {
      let improved = false;

      for (const [, indices] of byDateGroup.entries()) {
        const occupied = new Set(
          indices.map((idx) => `${trialMatches[idx].court}__${trialMatches[idx].timeSlot}`)
        );

        for (const idx of indices) {
          const m = trialMatches[idx];
          let currCourt = m.court;
          let currSlot = m.timeSlot;

          for (const c of courts) {
            for (const s of timeSlots) {
              const key = `${c}__${s}`;
              if (occupied.has(key)) continue;

              m.court = c;
              m.timeSlot = s;
              const newCost = computeScheduleCost(trialMatches, teams, courts, timeSlots);
              if (newCost < currentCost - 0.001) {
                occupied.delete(`${currCourt}__${currSlot}`);
                occupied.add(key);
                currCourt = c;
                currSlot = s;
                currentCost = newCost;
                improved = true;
              } else {
                m.court = currCourt;
                m.timeSlot = currSlot;
              }
            }
          }
        }

        for (let i = 0; i < indices.length; i++) {
          for (let j = i + 1; j < indices.length; j++) {
            const mA = trialMatches[indices[i]];
            const mB = trialMatches[indices[j]];

            const origACourt = mA.court;
            const origASlot = mA.timeSlot;
            const origBCourt = mB.court;
            const origBSlot = mB.timeSlot;

            const candidates: Array<[string, string, string, string]> = [
              [origBCourt, origBSlot, origACourt, origASlot],
            ];
            if (
              !occupied.has(`${origBCourt}__${origASlot}`) &&
              !occupied.has(`${origACourt}__${origBSlot}`)
            ) {
              candidates.push([origBCourt, origASlot, origACourt, origBSlot]);
            }
            if (
              !occupied.has(`${origACourt}__${origBSlot}`) &&
              !occupied.has(`${origBCourt}__${origASlot}`)
            ) {
              candidates.push([origACourt, origBSlot, origBCourt, origASlot]);
            }

            let bestCand: [string, string, string, string] | null = null;
            for (const cand of candidates) {
              mA.court = cand[0];
              mA.timeSlot = cand[1];
              mB.court = cand[2];
              mB.timeSlot = cand[3];
              const newCost = computeScheduleCost(trialMatches, teams, courts, timeSlots);
              if (newCost < currentCost - 0.001) {
                currentCost = newCost;
                bestCand = cand;
                improved = true;
              }
            }

            if (bestCand) {
              occupied.delete(`${origACourt}__${origASlot}`);
              occupied.delete(`${origBCourt}__${origBSlot}`);
              mA.court = bestCand[0];
              mA.timeSlot = bestCand[1];
              mB.court = bestCand[2];
              mB.timeSlot = bestCand[3];
              occupied.add(`${mA.court}__${mA.timeSlot}`);
              occupied.add(`${mB.court}__${mB.timeSlot}`);
            } else {
              mA.court = origACourt;
              mA.timeSlot = origASlot;
              mB.court = origBCourt;
              mB.timeSlot = origBSlot;
            }
          }
        }
      }

      if (!improved) break;
    }

    if (currentCost < bestGlobalCost) {
      bestGlobalCost = currentCost;
      bestMatches = trialMatches;
    }
  }

  // Sort neatly by jornada -> date -> timeSlot -> court
  const slotOrder = new Map(timeSlots.map((s, i) => [s, i]));
  const courtOrder = new Map(courts.map((c, i) => [c, i]));

  bestMatches.sort((a, b) => {
    if (a.jornada !== b.jornada) return a.jornada - b.jornada;
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    const sA = slotOrder.get(a.timeSlot) ?? 99;
    const sB = slotOrder.get(b.timeSlot) ?? 99;
    if (sA !== sB) return sA - sB;
    return (courtOrder.get(a.court) ?? 99) - (courtOrder.get(b.court) ?? 99);
  });

  return bestMatches;
}

/**
 * Computes how evenly every team is scheduled across all courts and time slots.
 */
export function computeCourtAndTimeBalance(
  teams: Team[],
  matches: Match[],
  courts: string[],
  timeSlots: string[]
): TeamBalanceRow[] {
  return teams.map((team) => {
    const byCourt: Record<string, number> = {};
    const byTimeSlot: Record<string, number> = {};
    for (const c of courts) byCourt[c] = 0;
    for (const s of timeSlots) byTimeSlot[s] = 0;

    let totalMatches = 0;
    for (const m of matches) {
      if (m.homeTeamId === team.id || m.awayTeamId === team.id) {
        totalMatches += 1;
        byCourt[m.court] = (byCourt[m.court] || 0) + 1;
        byTimeSlot[m.timeSlot] = (byTimeSlot[m.timeSlot] || 0) + 1;
      }
    }

    return {
      team,
      totalMatches,
      byCourt,
      byTimeSlot,
    };
  });
}

/**
 * Returns which team (if any) rests (BYE) on a given jornada when team count is odd.
 */
export function getByeTeamsForJornada(teams: Team[], jornadaMatches: Match[]): Team[] {
  const playingIds = new Set<string>();
  for (const m of jornadaMatches) {
    playingIds.add(m.homeTeamId);
    playingIds.add(m.awayTeamId);
  }
  return teams.filter((t) => !playingIds.has(t.id));
}
