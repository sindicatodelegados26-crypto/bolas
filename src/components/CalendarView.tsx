import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Download,
  RefreshCw,
  ClipboardEdit,
  Scale,
  Filter,
} from 'lucide-react';
import { Match, Team, TournamentConfig } from '../types/tournament';
import {
  computeCourtAndTimeBalance,
  getByeTeamsForJornada,
} from '../utils/scheduler';
import { exportScheduleCsv } from '../utils/exportUtils';

interface CalendarViewProps {
  teams: Team[];
  matches: Match[];
  config: TournamentConfig;
  onSelectMatch: (match: Match) => void;
  onRegenerateSchedule: (vueltas?: 1 | 2 | 4) => void;
}

function formatDateEs(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString('es-VE', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

const STATUS_LABELS: Record<Match['status'], string> = {
  programado: 'Programado',
  en_juego: 'En juego',
  finalizado: 'Finalizado',
};

export const CalendarView: React.FC<CalendarViewProps> = ({
  teams,
  matches,
  config,
  onSelectMatch,
  onRegenerateSchedule,
}) => {
  const [subTab, setSubTab] = useState<'jornadas' | 'equilibrio'>('jornadas');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [filterCourt, setFilterCourt] = useState<string>('all');
  const [filterTime, setFilterTime] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterJornada, setFilterJornada] = useState<string>('all');

  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  const jornadasList = useMemo(() => {
    const set = new Set<number>();
    matches.forEach((m) => set.add(m.jornada));
    return Array.from(set).sort((a, b) => a - b);
  }, [matches]);

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (filterJornada !== 'all' && m.jornada !== Number(filterJornada)) {
        return false;
      }
      if (
        filterTeam !== 'all' &&
        m.homeTeamId !== filterTeam &&
        m.awayTeamId !== filterTeam
      ) {
        return false;
      }
      if (filterCourt !== 'all' && m.court !== filterCourt) return false;
      if (filterTime !== 'all' && m.timeSlot !== filterTime) return false;
      if (filterStatus !== 'all' && m.status !== filterStatus) return false;
      return true;
    });
  }, [matches, filterJornada, filterTeam, filterCourt, filterTime, filterStatus]);

  const groupedByJornada = useMemo(() => {
    const map = new Map<number, Match[]>();
    for (const m of filteredMatches) {
      const arr = map.get(m.jornada) ?? [];
      arr.push(m);
      map.set(m.jornada, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [filteredMatches]);

  const balanceRows = useMemo(
    () =>
      computeCourtAndTimeBalance(teams, matches, config.courts, config.timeSlots),
    [teams, matches, config.courts, config.timeSlots]
  );

  const hasFilters =
    filterTeam !== 'all' ||
    filterCourt !== 'all' ||
    filterTime !== 'all' ||
    filterStatus !== 'all' ||
    filterJornada !== 'all';

  return (
    <div className="space-y-6">
      {/* Control strip */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setSubTab('jornadas')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                subTab === 'jornadas'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Jornadas ({matches.length})
            </button>
            <button
              type="button"
              onClick={() => setSubTab('equilibrio')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                subTab === 'equilibrio'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              Equilibrio de Canchas y Horarios
            </button>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {([1, 2, 4] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onRegenerateSchedule(v)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  config.vueltas === v
                    ? 'bg-emerald-700 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {v === 1 ? '1 Vuelta' : v === 2 ? '2 Vueltas' : '4 Vueltas'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onRegenerateSchedule()}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerar Equilibrado
          </button>
          <button
            type="button"
            onClick={() => exportScheduleCsv(matches, teams)}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
        </div>
      </div>

      {subTab === 'jornadas' ? (
        <>
          {/* Filter toolbar */}
          <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Filtros:</span>
            </div>

            <select
              value={filterJornada}
              onChange={(e) => setFilterJornada(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              aria-label="Filtrar por jornada"
            >
              <option value="all">Todas las jornadas</option>
              {jornadasList.map((j) => (
                <option key={j} value={String(j)}>
                  Jornada {j}
                </option>
              ))}
            </select>

            <select
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              aria-label="Filtrar por equipo"
            >
              <option value="all">Todos los equipos</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <select
              value={filterCourt}
              onChange={(e) => setFilterCourt(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              aria-label="Filtrar por cancha"
            >
              <option value="all">Todas las canchas</option>
              {config.courts.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={filterTime}
              onChange={(e) => setFilterTime(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              aria-label="Filtrar por horario"
            >
              <option value="all">Todos los horarios</option>
              {config.timeSlots.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              aria-label="Filtrar por estado"
            >
              <option value="all">Todos los estados</option>
              <option value="programado">Programado</option>
              <option value="en_juego">En juego</option>
              <option value="finalizado">Finalizado</option>
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setFilterJornada('all');
                  setFilterTeam('all');
                  setFilterCourt('all');
                  setFilterTime('all');
                  setFilterStatus('all');
                }}
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 px-2 py-1 whitespace-nowrap"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Jornadas listing */}
          {groupedByJornada.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <p className="text-sm text-slate-600">
                No hay partidos que coincidan con los filtros seleccionados.
              </p>
              {teams.length < 2 && (
                <p className="text-xs text-slate-500 mt-2">
                  Agrega al menos 2 equipos para generar un calendario.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {groupedByJornada.map(([jornadaNum, jMatches]) => {
                const allJornadaMatches = matches.filter(
                  (m) => m.jornada === jornadaNum
                );
                const byeTeams = getByeTeamsForJornada(teams, allJornadaMatches);
                const firstDate = jMatches[0]?.date ?? '';
                const vueltaNum = jMatches[0]?.vuelta ?? 1;

                // Group by timeSlot inside jornada
                const byTimeSlot = config.timeSlots
                  .map((slot) => ({
                    slot,
                    items: jMatches.filter((m) => m.timeSlot === slot),
                  }))
                  .filter((g) => g.items.length > 0);

                // Include any custom time slots not in config.timeSlots
                const knownSlots = new Set(config.timeSlots);
                const extraMatches = jMatches.filter(
                  (m) => !knownSlots.has(m.timeSlot)
                );
                if (extraMatches.length > 0) {
                  byTimeSlot.push({ slot: 'Otro horario', items: extraMatches });
                }

                return (
                  <section
                    key={jornadaNum}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-50 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-semibold text-slate-900">
                          Jornada {jornadaNum}
                        </h3>
                        <span className="text-xs text-slate-500">
                          Vuelta {vueltaNum}
                          <span aria-hidden="true"> · </span>
                          {formatDateEs(firstDate)}
                        </span>
                      </div>

                      {byeTeams.length > 0 && (
                        <div className="text-xs text-slate-600">
                          Descansa:{' '}
                          <span className="font-medium text-slate-900">
                            {byeTeams.map((b) => b.name).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="divide-y divide-slate-200">
                      {byTimeSlot.map((group) => (
                        <div key={group.slot} className="p-4 sm:p-5">
                          <div className="text-xs font-semibold text-slate-500 font-mono tabular-nums mb-3">
                            Horario {group.slot}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                            {group.items.map((match) => {
                              const home = teamMap.get(match.homeTeamId);
                              const away = teamMap.get(match.awayTeamId);
                              if (!home || !away) return null;

                              const isFinished =
                                match.status === 'finalizado' &&
                                match.homeScore !== null &&
                                match.awayScore !== null;
                              const homeWon =
                                isFinished && match.homeScore! > match.awayScore!;
                              const awayWon =
                                isFinished && match.awayScore! > match.homeScore!;

                              return (
                                <div
                                  key={match.id}
                                  className="border border-slate-200 rounded-lg p-3.5 hover:border-slate-300 transition-colors bg-white flex flex-col justify-between gap-3"
                                >
                                  {/* Unboxed metadata header */}
                                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                                    <div className="truncate">
                                      <span className="font-medium text-slate-700">
                                        {match.court}
                                      </span>
                                      <span aria-hidden="true"> · </span>
                                      <span className="font-mono tabular-nums">
                                        {match.timeSlot}
                                      </span>
                                    </div>
                                    <span
                                      className={`font-medium shrink-0 ${
                                        match.status === 'finalizado'
                                          ? 'text-emerald-700'
                                          : match.status === 'en_juego'
                                          ? 'text-amber-700'
                                          : 'text-slate-500'
                                      }`}
                                    >
                                      {STATUS_LABELS[match.status]}
                                    </span>
                                  </div>

                                  {/* Teams and Score */}
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span
                                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                                          style={{ backgroundColor: home.color }}
                                          aria-hidden="true"
                                        />
                                        <span
                                          className={`text-sm truncate ${
                                            homeWon
                                              ? 'font-semibold text-slate-900'
                                              : 'font-medium text-slate-700'
                                          }`}
                                        >
                                          {home.name}
                                        </span>
                                      </div>
                                      <span
                                        className={`text-sm font-mono tabular-nums shrink-0 ${
                                          homeWon
                                            ? 'font-bold text-emerald-700'
                                            : 'font-medium text-slate-700'
                                        }`}
                                      >
                                        {match.homeScore !== null
                                          ? match.homeScore
                                          : '—'}
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span
                                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                                          style={{ backgroundColor: away.color }}
                                          aria-hidden="true"
                                        />
                                        <span
                                          className={`text-sm truncate ${
                                            awayWon
                                              ? 'font-semibold text-slate-900'
                                              : 'font-medium text-slate-700'
                                          }`}
                                        >
                                          {away.name}
                                        </span>
                                      </div>
                                      <span
                                        className={`text-sm font-mono tabular-nums shrink-0 ${
                                          awayWon
                                            ? 'font-bold text-emerald-700'
                                            : 'font-medium text-slate-700'
                                        }`}
                                      >
                                        {match.awayScore !== null
                                          ? match.awayScore
                                          : '—'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Action footer */}
                                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <span className="text-xs text-slate-400 font-mono tabular-nums">
                                      {formatDateEs(match.date)}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => onSelectMatch(match)}
                                      className="px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                                    >
                                      <ClipboardEdit className="w-3.5 h-3.5" />
                                      {isFinished
                                        ? 'Ver / Editar Acta'
                                        : 'Anotar Acta'}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Court and Time Balance Matrix */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-900">
              Matriz de Equilibrio por Cancha y Horario
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Distribución matemática de partidos por equipo en las{' '}
              {config.courts.length} canchas y los horarios{' '}
              {config.timeSlots.join(' y ')}. Con 4 vueltas cada equipo juega
              exactamente la misma cantidad de veces en cada cancha y horario.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Equipo</th>
                  <th className="py-3 px-3 text-right font-mono">Total PJ</th>
                  {config.courts.map((c) => (
                    <th key={c} className="py-3 px-3 text-right font-mono">
                      {c}
                    </th>
                  ))}
                  {config.timeSlots.map((s) => (
                    <th
                      key={s}
                      className="py-3 px-3 text-right font-mono bg-slate-100/70"
                    >
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {balanceRows.map((row) => (
                  <tr key={row.team.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: row.team.color }}
                        />
                        <span>{row.team.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {row.totalMatches}
                    </td>
                    {config.courts.map((c) => (
                      <td
                        key={c}
                        className="py-3 px-3 text-right font-mono tabular-nums text-slate-700"
                      >
                        {row.byCourt[c] ?? 0}
                      </td>
                    ))}
                    {config.timeSlots.map((s) => (
                      <td
                        key={s}
                        className="py-3 px-3 text-right font-mono tabular-nums text-slate-800 bg-slate-50/50"
                      >
                        {row.byTimeSlot[s] ?? 0}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
