import React, { useMemo, useState } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';
import {
  Match,
  MatchStatus,
  Player,
  PlayerMatchStat,
  Team,
  TournamentConfig,
} from '../types/tournament';

interface MatchScorecardModalProps {
  match: Match;
  teams: Team[];
  players: Player[];
  config: TournamentConfig;
  onClose: () => void;
  onSave: (updatedMatch: Match) => void;
}

function ensurePlayerStat(
  stats: Record<string, PlayerMatchStat>,
  player: Player
): PlayerMatchStat {
  return (
    stats[player.id] ?? {
      playerId: player.id,
      teamId: player.teamId,
      arrimesBuenos: 0,
      arrimesIntentados: 0,
      bochesRastrerosBuenos: 0,
      bochesRastrerosIntentados: 0,
      bochesAereosBuenos: 0,
      bochesAereosIntentados: 0,
    }
  );
}

type StatCategory = 'arrimes' | 'bochesRastreros' | 'bochesAereos';

export const MatchScorecardModal: React.FC<MatchScorecardModalProps> = ({
  match,
  teams,
  players,
  config,
  onClose,
  onSave,
}) => {
  const homeTeam = teams.find((t) => t.id === match.homeTeamId);
  const awayTeam = teams.find((t) => t.id === match.awayTeamId);

  const [court, setCourt] = useState(match.court);
  const [timeSlot, setTimeSlot] = useState(match.timeSlot);
  const [date, setDate] = useState(match.date);
  const [status, setStatus] = useState<MatchStatus>(match.status);
  const [homeScore, setHomeScore] = useState<string>(
    match.homeScore !== null ? String(match.homeScore) : ''
  );
  const [awayScore, setAwayScore] = useState<string>(
    match.awayScore !== null ? String(match.awayScore) : ''
  );
  const [notes, setNotes] = useState(match.notes ?? '');
  const [activeTeamTab, setActiveTeamTab] = useState<'home' | 'away'>('home');
  const [playerStats, setPlayerStats] = useState<Record<string, PlayerMatchStat>>(
    () => ({ ...match.playerStats })
  );
  const [errorMsg, setErrorMsg] = useState<string>('');

  const homePlayers = useMemo(
    () => players.filter((p) => p.teamId === match.homeTeamId),
    [players, match.homeTeamId]
  );
  const awayPlayers = useMemo(
    () => players.filter((p) => p.teamId === match.awayTeamId),
    [players, match.awayTeamId]
  );

  const adjustStat = (
    player: Player,
    category: StatCategory,
    deltaBuenos: number,
    deltaIntentados: number
  ) => {
    setPlayerStats((prev) => {
      const curr = ensurePlayerStat(prev, player);
      const next = { ...curr };

      if (category === 'arrimes') {
        const nextI = Math.max(0, curr.arrimesIntentados + deltaIntentados);
        const nextB = Math.max(0, Math.min(nextI, curr.arrimesBuenos + deltaBuenos));
        next.arrimesIntentados = nextI;
        next.arrimesBuenos = nextB;
      } else if (category === 'bochesRastreros') {
        const nextI = Math.max(
          0,
          curr.bochesRastrerosIntentados + deltaIntentados
        );
        const nextB = Math.max(
          0,
          Math.min(nextI, curr.bochesRastrerosBuenos + deltaBuenos)
        );
        next.bochesRastrerosIntentados = nextI;
        next.bochesRastrerosBuenos = nextB;
      } else {
        const nextI = Math.max(0, curr.bochesAereosIntentados + deltaIntentados);
        const nextB = Math.max(
          0,
          Math.min(nextI, curr.bochesAereosBuenos + deltaBuenos)
        );
        next.bochesAereosIntentados = nextI;
        next.bochesAereosBuenos = nextB;
      }

      return { ...prev, [player.id]: next };
    });
  };

  const setDirectStat = (
    player: Player,
    field: keyof Omit<PlayerMatchStat, 'playerId' | 'teamId'>,
    rawValue: string
  ) => {
    const val = Math.max(0, parseInt(rawValue || '0', 10) || 0);
    setPlayerStats((prev) => {
      const curr = ensurePlayerStat(prev, player);
      const next = { ...curr, [field]: val };

      if (field === 'arrimesBuenos' && next.arrimesIntentados < val) {
        next.arrimesIntentados = val;
      }
      if (field === 'arrimesIntentados' && next.arrimesBuenos > val) {
        next.arrimesBuenos = val;
      }
      if (
        field === 'bochesRastrerosBuenos' &&
        next.bochesRastrerosIntentados < val
      ) {
        next.bochesRastrerosIntentados = val;
      }
      if (
        field === 'bochesRastrerosIntentados' &&
        next.bochesRastrerosBuenos > val
      ) {
        next.bochesRastrerosBuenos = val;
      }
      if (field === 'bochesAereosBuenos' && next.bochesAereosIntentados < val) {
        next.bochesAereosIntentados = val;
      }
      if (field === 'bochesAereosIntentados' && next.bochesAereosBuenos > val) {
        next.bochesAereosBuenos = val;
      }

      return { ...prev, [player.id]: next };
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedHome = homeScore.trim() === '' ? null : Number(homeScore);
    const parsedAway = awayScore.trim() === '' ? null : Number(awayScore);

    if (status === 'finalizado') {
      if (parsedHome === null || parsedAway === null) {
        setErrorMsg(
          'Ingresa los tantos de ambos equipos para marcar el partido como finalizado.'
        );
        return;
      }
      if (parsedHome === parsedAway) {
        setErrorMsg(
          'En bolas criollas un partido finalizado no puede terminar empatado.'
        );
        return;
      }
    }

    onSave({
      ...match,
      court,
      timeSlot,
      date,
      status,
      homeScore: parsedHome,
      awayScore: parsedAway,
      notes: notes.trim() || undefined,
      playerStats,
    });
  };

  const visibleRoster = activeTeamTab === 'home' ? homePlayers : awayPlayers;
  const activeTeam = activeTeamTab === 'home' ? homeTeam : awayTeam;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="acta-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2
              id="acta-modal-title"
              className="text-base font-bold text-slate-900"
            >
              Acta de Partido — Jornada {match.jornada}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {homeTeam?.name ?? 'Local'} vs {awayTeam?.name ?? 'Visitante'} ·{' '}
              Meta: {config.targetTantos} tantos
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70"
            aria-label="Cerrar acta"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Scoreboard + Schedule metadata */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <div className="text-xs font-semibold text-slate-500 mb-3">
                Marcador Oficial (Tantos)
              </div>
              <div className="grid grid-cols-11 items-center gap-3">
                <div className="col-span-5">
                  <label className="block text-xs font-medium text-slate-700 mb-1 truncate">
                    {homeTeam?.name} (Local)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={homeScore}
                    onChange={(e) => {
                      setHomeScore(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="0"
                    className="w-full px-3 py-2.5 text-xl font-bold font-mono tabular-nums text-center bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div className="col-span-1 text-center text-sm font-semibold text-slate-400 pt-5">
                  vs
                </div>
                <div className="col-span-5">
                  <label className="block text-xs font-medium text-slate-700 mb-1 truncate">
                    {awayTeam?.name} (Visitante)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={awayScore}
                    onChange={(e) => {
                      setAwayScore(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="0"
                    className="w-full px-3 py-2.5 text-xl font-bold font-mono tabular-nums text-center bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 border border-slate-200 rounded-xl p-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Cancha
                </label>
                <select
                  value={court}
                  onChange={(e) => setCourt(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  {config.courts.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Horario
                </label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  {config.timeSlots.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Estado
                </label>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as MatchStatus);
                    setErrorMsg('');
                  }}
                  className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="programado">Programado</option>
                  <option value="en_juego">En juego</option>
                  <option value="finalizado">Finalizado</option>
                </select>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="px-4 py-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Player technical stats recorder */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Estadísticas Técnicas por Jugador
                </h3>
                <p className="text-xs text-slate-500">
                  Registra Buenos (B) e Intentados (I) en Arrimes, Boches
                  Rastreros y Boches Aéreos.
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveTeamTab('home')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    activeTeamTab === 'home'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {homeTeam?.shortName ?? 'Local'} · {homeTeam?.name}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTeamTab('away')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    activeTeamTab === 'away'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {awayTeam?.shortName ?? 'Visitante'} · {awayTeam?.name}
                </button>
              </div>
            </div>

            {visibleRoster.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                {activeTeam?.name} aún no tiene jugadores en su planilla. Agrega
                jugadores en la sección &ldquo;Equipos y Planillas&rdquo;.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="py-2.5 px-4">Jugador</th>
                      <th className="py-2.5 px-3 text-center">
                        Arrimes (B / I)
                      </th>
                      <th className="py-2.5 px-3 text-center">
                        Boches Rastreros (B / I)
                      </th>
                      <th className="py-2.5 px-3 text-center">
                        Boches Aéreos (B / I)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {visibleRoster.map((player) => {
                      const st = ensurePlayerStat(playerStats, player);
                      return (
                        <tr key={player.id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-4 min-w-[180px]">
                            <div className="font-medium text-slate-900">
                              <span className="font-mono text-slate-400 mr-1.5">
                                #{player.number}
                              </span>
                              {player.name}
                            </div>
                            <div className="text-slate-500 mt-0.5">
                              {player.role}
                            </div>
                          </td>

                          {/* Arrimes */}
                          <td className="py-2.5 px-3">
                            <StatStepperCell
                              buenos={st.arrimesBuenos}
                              intentados={st.arrimesIntentados}
                              onGood={() => adjustStat(player, 'arrimes', 1, 1)}
                              onMiss={() => adjustStat(player, 'arrimes', 0, 1)}
                              onChangeBuenos={(v) =>
                                setDirectStat(player, 'arrimesBuenos', v)
                              }
                              onChangeIntentados={(v) =>
                                setDirectStat(player, 'arrimesIntentados', v)
                              }
                            />
                          </td>

                          {/* Boches Rastreros */}
                          <td className="py-2.5 px-3">
                            <StatStepperCell
                              buenos={st.bochesRastrerosBuenos}
                              intentados={st.bochesRastrerosIntentados}
                              onGood={() =>
                                adjustStat(player, 'bochesRastreros', 1, 1)
                              }
                              onMiss={() =>
                                adjustStat(player, 'bochesRastreros', 0, 1)
                              }
                              onChangeBuenos={(v) =>
                                setDirectStat(player, 'bochesRastrerosBuenos', v)
                              }
                              onChangeIntentados={(v) =>
                                setDirectStat(
                                  player,
                                  'bochesRastrerosIntentados',
                                  v
                                )
                              }
                            />
                          </td>

                          {/* Boches Aéreos */}
                          <td className="py-2.5 px-3">
                            <StatStepperCell
                              buenos={st.bochesAereosBuenos}
                              intentados={st.bochesAereosIntentados}
                              onGood={() =>
                                adjustStat(player, 'bochesAereos', 1, 1)
                              }
                              onMiss={() =>
                                adjustStat(player, 'bochesAereos', 0, 1)
                              }
                              onChangeBuenos={(v) =>
                                setDirectStat(player, 'bochesAereosBuenos', v)
                              }
                              onChangeIntentados={(v) =>
                                setDirectStat(player, 'bochesAereosIntentados', v)
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Observaciones del Acta (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Partido definido en la última mano, buen estado de cancha..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-medium text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Check className="w-3.5 h-3.5" />
            Guardar Acta
          </button>
        </div>
      </div>
    </div>
  );
};

interface StatStepperCellProps {
  buenos: number;
  intentados: number;
  onGood: () => void;
  onMiss: () => void;
  onChangeBuenos: (val: string) => void;
  onChangeIntentados: (val: string) => void;
}

const StatStepperCell: React.FC<StatStepperCellProps> = ({
  buenos,
  intentados,
  onGood,
  onMiss,
  onChangeBuenos,
  onChangeIntentados,
}) => {
  const pct = intentados > 0 ? ((buenos / intentados) * 100).toFixed(0) : '0';

  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[175px]">
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          value={buenos}
          onChange={(e) => onChangeBuenos(e.target.value)}
          aria-label="Buenos"
          className="w-11 px-1.5 py-1 text-xs font-mono tabular-nums text-center border border-slate-300 rounded bg-white"
        />
        <span className="text-slate-400 font-mono">/</span>
        <input
          type="number"
          min={0}
          value={intentados}
          onChange={(e) => onChangeIntentados(e.target.value)}
          aria-label="Intentados"
          className="w-11 px-1.5 py-1 text-xs font-mono tabular-nums text-center border border-slate-300 rounded bg-white"
        />
        <span className="text-[11px] font-mono tabular-nums text-slate-500 w-9 text-right">
          {pct}%
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onGood}
          className="px-2 py-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded flex items-center gap-0.5 whitespace-nowrap"
          title="Sumar 1 lanzamiento bueno e intentado"
        >
          <Plus className="w-3 h-3" />
          Bueno
        </button>
        <button
          type="button"
          onClick={onMiss}
          className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded flex items-center gap-0.5 whitespace-nowrap"
          title="Sumar 1 lanzamiento fallado (intentado)"
        >
          <Minus className="w-3 h-3" />
          Fallo
        </button>
      </div>
    </div>
  );
};
