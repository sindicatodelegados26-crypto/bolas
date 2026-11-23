import React, { useMemo } from 'react';
import { Download, Trophy } from 'lucide-react';
import { Match, Team, TournamentConfig } from '../types/tournament';
import {
  computeHeadToHeadMatrix,
  computeStandings,
} from '../utils/standings';
import { exportStandingsCsv } from '../utils/exportUtils';

interface StandingsViewProps {
  teams: Team[];
  matches: Match[];
  config: TournamentConfig;
}

export const StandingsView: React.FC<StandingsViewProps> = ({
  teams,
  matches,
  config,
}) => {
  const standings = useMemo(
    () => computeStandings(teams, matches, config),
    [teams, matches, config]
  );

  const h2hMatrix = useMemo(
    () => computeHeadToHeadMatrix(teams, matches),
    [teams, matches]
  );

  // Order matrix teams in the exact standings rank order
  const rankedTeams = useMemo(() => standings.map((s) => s.team), [standings]);

  return (
    <div className="space-y-6">
      {/* Header / Tie-break explanation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-700" />
            Tabla de Clasificación Oficial
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Orden de clasificación: 1. Puntos ({config.pointsPerWin} pts por
            victoria) · 2. Juegos entre sí (duelo directo) · 3. Averaje general
            (diferencia de tantos TF − TC y cociente TF / TC).
          </p>
        </div>

        <button
          type="button"
          onClick={() => exportStandingsCsv(standings)}
          className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          Exportar CSV
        </button>
      </div>

      {/* Main Standings Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {standings.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No hay equipos registrados aún.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 w-12 font-mono">Pos</th>
                  <th className="py-3 px-4">Equipo</th>
                  <th className="py-3 px-3 text-right font-mono" title="Juegos Jugados">
                    JJ
                  </th>
                  <th className="py-3 px-3 text-right font-mono" title="Juegos Ganados">
                    JG
                  </th>
                  <th className="py-3 px-3 text-right font-mono" title="Juegos Perdidos">
                    JP
                  </th>
                  <th className="py-3 px-3 text-right font-mono text-slate-900" title="Puntos">
                    PTS
                  </th>
                  <th className="py-3 px-3 text-right font-mono" title="Tantos a Favor">
                    TF
                  </th>
                  <th className="py-3 px-3 text-right font-mono" title="Tantos en Contra">
                    TC
                  </th>
                  <th className="py-3 px-3 text-right font-mono" title="Diferencia de Tantos">
                    DIF
                  </th>
                  <th className="py-3 px-3 text-right font-mono" title="Cociente TF / TC">
                    AVE
                  </th>
                  <th className="py-3 px-4">Racha</th>
                  <th className="py-3 px-4">Desempate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {standings.map((row) => (
                  <tr
                    key={row.team.id}
                    className={`hover:bg-slate-50/70 ${
                      row.rank <= 4 ? 'bg-white' : 'bg-slate-50/30'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono tabular-nums font-semibold text-slate-900">
                      {row.rank}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 min-w-[180px]">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: row.team.color }}
                          aria-hidden="true"
                        />
                        <span className="truncate">{row.team.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                      {row.jj}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-700 font-medium">
                      {row.jg}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">
                      {row.jp}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900 bg-slate-50/60">
                      {row.pts}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                      {row.tf}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                      {row.tc}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-mono tabular-nums font-medium ${
                        row.dif > 0
                          ? 'text-emerald-700'
                          : row.dif < 0
                          ? 'text-red-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {row.dif > 0 ? `+${row.dif}` : row.dif}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                      {row.jj > 0 ? row.ave.toFixed(3) : '0.000'}
                    </td>
                    <td className="py-3 px-4">
                      {row.streak.length === 0 ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        <div className="flex items-center gap-1 font-mono text-xs">
                          {row.streak.map((res, i) => (
                            <span
                              key={i}
                              className={`font-semibold ${
                                res === 'G'
                                  ? 'text-emerald-700'
                                  : 'text-red-600'
                              }`}
                            >
                              {res}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {row.tieReason ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Head-to-Head Matrix */}
      {rankedTeams.length >= 2 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-900">
              Matriz de Juegos Entre Sí (Duelo Directo)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Cada celda muestra el balance del equipo de la fila frente al
              rival de la columna: Juegos Ganados-Perdidos y Tantos (Favor:Contra).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Equipo \ Rival</th>
                  {rankedTeams.map((opp) => (
                    <th
                      key={opp.id}
                      className="py-3 px-3 text-center font-mono whitespace-nowrap"
                      title={opp.name}
                    >
                      {opp.shortName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {rankedTeams.map((rowTeam) => (
                  <tr key={rowTeam.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-sm shrink-0"
                          style={{ backgroundColor: rowTeam.color }}
                        />
                        <span>{rowTeam.name}</span>
                      </div>
                    </td>
                    {rankedTeams.map((colTeam) => {
                      if (rowTeam.id === colTeam.id) {
                        return (
                          <td
                            key={colTeam.id}
                            className="py-3 px-3 text-center bg-slate-100 text-slate-400 font-mono"
                          >
                            —
                          </td>
                        );
                      }
                      const cell = h2hMatrix[rowTeam.id]?.[colTeam.id];
                      if (!cell || cell.played === 0) {
                        return (
                          <td
                            key={colTeam.id}
                            className="py-3 px-3 text-center text-slate-400 font-mono"
                          >
                            0-0
                          </td>
                        );
                      }

                      const ahead = cell.wins > cell.losses;
                      const behind = cell.losses > cell.wins;

                      return (
                        <td
                          key={colTeam.id}
                          className="py-2.5 px-3 text-center font-mono tabular-nums"
                        >
                          <div
                            className={`font-semibold ${
                              ahead
                                ? 'text-emerald-700'
                                : behind
                                ? 'text-red-700'
                                : 'text-slate-700'
                            }`}
                          >
                            {cell.wins}-{cell.losses}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {cell.tf}:{cell.tc}
                          </div>
                        </td>
                      );
                    })}
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
