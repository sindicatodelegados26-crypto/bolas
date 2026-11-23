import React, { useMemo, useState } from 'react';
import { ArrowUpDown, Download, Search } from 'lucide-react';
import {
  AggregatedPlayerStats,
  Match,
  Player,
  Team,
} from '../types/tournament';
import { computePlayerStats } from '../utils/standings';
import { exportPlayerStatsCsv } from '../utils/exportUtils';

interface PlayerStatsViewProps {
  players: Player[];
  teams: Team[];
  matches: Match[];
}

type SortKey =
  | 'arrimesPct'
  | 'arrimesBuenos'
  | 'bochesRastrerosPct'
  | 'bochesRastrerosBuenos'
  | 'bochesAereosPct'
  | 'bochesAereosBuenos'
  | 'totalBochesPct'
  | 'efectividadGlobal'
  | 'pj';

export const PlayerStatsView: React.FC<PlayerStatsViewProps> = ({
  players,
  teams,
  matches,
}) => {
  const [search, setSearch] = useState('');
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('efectividadGlobal');
  const [sortAsc, setSortAsc] = useState(false);

  const allStats = useMemo(
    () => computePlayerStats(players, teams, matches),
    [players, teams, matches]
  );

  // Category Leaders (minimum 3 attempts to qualify when available)
  const leaders = useMemo(() => {
    const qualified = (
      getterAttempts: (s: AggregatedPlayerStats) => number,
      getterPct: (s: AggregatedPlayerStats) => number,
      getterGood: (s: AggregatedPlayerStats) => number
    ) => {
      const pool = allStats.filter((s) => getterAttempts(s) >= 3);
      const fallback = pool.length > 0 ? pool : allStats.filter((s) => getterAttempts(s) > 0);
      if (fallback.length === 0) return null;
      return [...fallback].sort(
        (a, b) =>
          getterPct(b) - getterPct(a) || getterGood(b) - getterGood(a)
      )[0];
    };

    return {
      arrime: qualified(
        (s) => s.arrimesIntentados,
        (s) => s.arrimesPct,
        (s) => s.arrimesBuenos
      ),
      rastrero: qualified(
        (s) => s.bochesRastrerosIntentados,
        (s) => s.bochesRastrerosPct,
        (s) => s.bochesRastrerosBuenos
      ),
      aereo: qualified(
        (s) => s.bochesAereosIntentados,
        (s) => s.bochesAereosPct,
        (s) => s.bochesAereosBuenos
      ),
      global: qualified(
        (s) => s.totalAccionesIntentadas,
        (s) => s.efectividadGlobal,
        (s) => s.totalAccionesBuenas
      ),
    };
  }, [allStats]);

  const filteredStats = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = allStats.filter((s) => {
      if (filterTeam !== 'all' && s.team.id !== filterTeam) return false;
      if (filterRole !== 'all' && s.player.role !== filterRole) return false;
      if (
        q &&
        !s.player.name.toLowerCase().includes(q) &&
        !s.team.name.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });

    list.sort((a, b) => {
      const diff = a[sortKey] - b[sortKey];
      return sortAsc ? diff : -diff;
    });

    return list;
  }, [allStats, search, filterTeam, filterRole, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Leaders Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <LeaderTile
          category="Líder en Arrimes"
          stat={leaders.arrime}
          metricText={
            leaders.arrime
              ? `${leaders.arrime.arrimesPct.toFixed(1)}%`
              : '—'
          }
          detailText={
            leaders.arrime
              ? `${leaders.arrime.arrimesBuenos} de ${leaders.arrime.arrimesIntentados} buenos`
              : 'Sin registros'
          }
        />
        <LeaderTile
          category="Líder en Boches Rastreros"
          stat={leaders.rastrero}
          metricText={
            leaders.rastrero
              ? `${leaders.rastrero.bochesRastrerosPct.toFixed(1)}%`
              : '—'
          }
          detailText={
            leaders.rastrero
              ? `${leaders.rastrero.bochesRastrerosBuenos} de ${leaders.rastrero.bochesRastrerosIntentados} pegados`
              : 'Sin registros'
          }
        />
        <LeaderTile
          category="Líder en Boches Aéreos"
          stat={leaders.aereo}
          metricText={
            leaders.aereo
              ? `${leaders.aereo.bochesAereosPct.toFixed(1)}%`
              : '—'
          }
          detailText={
            leaders.aereo
              ? `${leaders.aereo.bochesAereosBuenos} de ${leaders.aereo.bochesAereosIntentados} al vuelo`
              : 'Sin registros'
          }
        />
        <LeaderTile
          category="Efectividad Global"
          stat={leaders.global}
          metricText={
            leaders.global
              ? `${leaders.global.efectividadGlobal.toFixed(1)}%`
              : '—'
          }
          detailText={
            leaders.global
              ? `${leaders.global.totalAccionesBuenas} de ${leaders.global.totalAccionesIntentadas} acciones`
              : 'Sin registros'
          }
        />
      </div>

      {/* Filters & Export */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar jugador o equipo..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 w-56"
            />
          </div>

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
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            aria-label="Filtrar por especialidad"
          >
            <option value="all">Todas las especialidades</option>
            <option value="Arrimador">Arrimador</option>
            <option value="Bochador">Bochador</option>
            <option value="Mixto">Mixto</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => exportPlayerStatsCsv(filteredStats)}
          className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start md:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          Exportar Estadísticas CSV
        </button>
      </div>

      {/* Main Technical Stats Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Rendimiento Técnico por Jugador ({filteredStats.length})
            </h3>
            <p className="text-xs text-slate-500">
              Para actualizar estadísticas de un partido, abre su Acta desde el
              Calendario.
            </p>
          </div>
        </div>

        {filteredStats.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No se encontraron jugadores con los filtros aplicados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Jugador</th>
                  <th className="py-3 px-3">Equipo</th>
                  <th className="py-3 px-3 text-right font-mono">
                    <SortBtn
                      label="PJ"
                      active={sortKey === 'pj'}
                      onClick={() => toggleSort('pj')}
                    />
                  </th>
                  <th className="py-3 px-3 text-right font-mono">
                    <SortBtn
                      label="Arrimes (B/I)"
                      active={sortKey === 'arrimesBuenos'}
                      onClick={() => toggleSort('arrimesBuenos')}
                    />
                  </th>
                  <th className="py-3 px-3 text-right font-mono">
                    <SortBtn
                      label="% Arr"
                      active={sortKey === 'arrimesPct'}
                      onClick={() => toggleSort('arrimesPct')}
                    />
                  </th>
                  <th className="py-3 px-3 text-right font-mono">
                    <SortBtn
                      label="B. Rastreros"
                      active={sortKey === 'bochesRastrerosBuenos'}
                      onClick={() => toggleSort('bochesRastrerosBuenos')}
                    />
                  </th>
                  <th className="py-3 px-3 text-right font-mono">
                    <SortBtn
                      label="% Rast"
                      active={sortKey === 'bochesRastrerosPct'}
                      onClick={() => toggleSort('bochesRastrerosPct')}
                    />
                  </th>
                  <th className="py-3 px-3 text-right font-mono">
                    <SortBtn
                      label="B. Aéreos"
                      active={sortKey === 'bochesAereosBuenos'}
                      onClick={() => toggleSort('bochesAereosBuenos')}
                    />
                  </th>
                  <th className="py-3 px-3 text-right font-mono">
                    <SortBtn
                      label="% Aér"
                      active={sortKey === 'bochesAereosPct'}
                      onClick={() => toggleSort('bochesAereosPct')}
                    />
                  </th>
                  <th className="py-3 px-3 text-right font-mono">
                    <SortBtn
                      label="% Boches"
                      active={sortKey === 'totalBochesPct'}
                      onClick={() => toggleSort('totalBochesPct')}
                    />
                  </th>
                  <th className="py-3 px-4 text-right font-mono text-slate-900">
                    <SortBtn
                      label="% Global"
                      active={sortKey === 'efectividadGlobal'}
                      onClick={() => toggleSort('efectividadGlobal')}
                    />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredStats.map((s) => (
                  <tr key={s.player.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 min-w-[175px]">
                      <div className="font-medium text-slate-900">
                        <span className="font-mono text-slate-400 mr-1.5">
                          #{s.player.number}
                        </span>
                        {s.player.name}
                      </div>
                      <div className="text-slate-500 mt-0.5">
                        {s.player.role}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-sm shrink-0"
                          style={{ backgroundColor: s.team.color }}
                        />
                        <span>{s.team.shortName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                      {s.pj}
                    </td>

                    {/* Arrimes */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                      {s.arrimesBuenos}/{s.arrimesIntentados}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-medium text-slate-900">
                      {s.arrimesIntentados > 0
                        ? `${s.arrimesPct.toFixed(1)}%`
                        : '—'}
                    </td>

                    {/* Boches Rastreros */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                      {s.bochesRastrerosBuenos}/{s.bochesRastrerosIntentados}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-medium text-slate-900">
                      {s.bochesRastrerosIntentados > 0
                        ? `${s.bochesRastrerosPct.toFixed(1)}%`
                        : '—'}
                    </td>

                    {/* Boches Aéreos */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                      {s.bochesAereosBuenos}/{s.bochesAereosIntentados}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-medium text-slate-900">
                      {s.bochesAereosIntentados > 0
                        ? `${s.bochesAereosPct.toFixed(1)}%`
                        : '—'}
                    </td>

                    {/* Total Boches */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                      {s.totalBochesIntentados > 0
                        ? `${s.totalBochesPct.toFixed(1)}%`
                        : '—'}
                    </td>

                    {/* Global */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-emerald-700 bg-slate-50/60">
                      {s.totalAccionesIntentadas > 0
                        ? `${s.efectividadGlobal.toFixed(1)}%`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const LeaderTile: React.FC<{
  category: string;
  stat: AggregatedPlayerStats | null;
  metricText: string;
  detailText: string;
}> = ({ category, stat, metricText, detailText }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-2">
    <div className="text-xs font-medium text-slate-500">{category}</div>
    <div className="flex items-baseline justify-between gap-2">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-900 truncate">
          {stat ? stat.player.name : 'Sin datos'}
        </div>
        <div className="text-xs text-slate-500 truncate mt-0.5">
          {stat ? stat.team.name : '—'}
        </div>
      </div>
      <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 shrink-0">
        {metricText}
      </div>
    </div>
    <div className="text-xs text-slate-500 font-mono tabular-nums pt-1 border-t border-slate-100">
      {detailText}
    </div>
  </div>
);

const SortBtn: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-1 hover:text-slate-900 transition-colors whitespace-nowrap ${
      active ? 'text-emerald-700 font-bold' : ''
    }`}
  >
    <span>{label}</span>
    <ArrowUpDown className="w-3 h-3 opacity-60" />
  </button>
);
