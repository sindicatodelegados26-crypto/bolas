import React, { useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  UserPlus,
  Download,
  Printer,
  RefreshCw,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import { Player, PlayerRole, Team } from '../types/tournament';
import { exportTeamRosterCsv } from '../utils/exportUtils';

interface TeamsRosterViewProps {
  teams: Team[];
  players: Player[];
  hasUnsyncedTeamsForSchedule: boolean;
  onAddTeam: (team: Omit<Team, 'id'>) => void;
  onUpdateTeam: (team: Team) => void;
  onDeleteTeam: (teamId: string) => void;
  onAddPlayer: (player: Omit<Player, 'id'>) => void;
  onUpdatePlayer: (player: Player) => void;
  onDeletePlayer: (playerId: string) => void;
  onRegenerateSchedule: () => void;
}

const PRESET_COLORS = [
  '#15803D',
  '#1D4ED8',
  '#B45309',
  '#B91C1C',
  '#0F766E',
  '#4338CA',
  '#9333EA',
  '#0369A1',
  '#BE123C',
  '#4D7C0F',
];

export const TeamsRosterView: React.FC<TeamsRosterViewProps> = ({
  teams,
  players,
  hasUnsyncedTeamsForSchedule,
  onAddTeam,
  onUpdateTeam,
  onDeleteTeam,
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer,
  onRegenerateSchedule,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    teams[0]?.id ?? ''
  );
  const [showAddTeamForm, setShowAddTeamForm] = useState(false);

  // Add Team form state
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamShort, setNewTeamShort] = useState('');
  const [newTeamColor, setNewTeamColor] = useState(
    PRESET_COLORS[teams.length % PRESET_COLORS.length]
  );
  const [newTeamCaptain, setNewTeamCaptain] = useState('');

  // Edit Team state
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamShort, setEditTeamShort] = useState('');

  // Add Player form state
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState('');
  const [newPlayerRole, setNewPlayerRole] = useState<PlayerRole>('Mixto');
  const [newPlayerCaptain, setNewPlayerCaptain] = useState(false);

  // Edit Player inline state
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editPlayerDraft, setEditPlayerDraft] = useState<Player | null>(null);

  const selectedTeam = useMemo(
    () => teams.find((t) => t.id === selectedTeamId) ?? teams[0],
    [teams, selectedTeamId]
  );

  const teamPlayers = useMemo(() => {
    if (!selectedTeam) return [];
    return players
      .filter((p) => p.teamId === selectedTeam.id)
      .sort((a, b) => Number(a.number || 99) - Number(b.number || 99));
  }, [players, selectedTeam]);

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTeamName.trim();
    if (!trimmed) return;
    const short =
      newTeamShort.trim().toUpperCase().slice(0, 4) ||
      trimmed.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() ||
      'EQP';

    onAddTeam({
      name: trimmed,
      shortName: short,
      color: newTeamColor,
      coachOrCaptain: newTeamCaptain.trim() || undefined,
    });

    setNewTeamName('');
    setNewTeamShort('');
    setNewTeamCaptain('');
    setNewTeamColor(PRESET_COLORS[(teams.length + 1) % PRESET_COLORS.length]);
    setShowAddTeamForm(false);
  };

  const handleCreatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !newPlayerName.trim()) return;
    onAddPlayer({
      teamId: selectedTeam.id,
      name: newPlayerName.trim(),
      number: newPlayerNumber.trim() || String(teamPlayers.length + 1).padStart(2, '0'),
      role: newPlayerRole,
      isCaptain: newPlayerCaptain,
      active: true,
    });
    setNewPlayerName('');
    setNewPlayerNumber('');
    setNewPlayerCaptain(false);
  };

  return (
    <div className="space-y-6">
      {/* Unsynced schedule banner when user adds or removes teams */}
      {hasUnsyncedTeamsForSchedule && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div>
            <div className="text-sm font-semibold text-amber-900">
              Lista de equipos actualizada ({teams.length} equipos)
            </div>
            <div className="text-xs text-amber-800 mt-0.5">
              Regenera el calendario para incluir a todos los equipos por igual
              en las canchas y horarios.
            </div>
          </div>
          <button
            type="button"
            onClick={onRegenerateSchedule}
            className="px-4 py-2 text-xs font-medium text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerar Calendario Ahora
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Teams list column */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 bg-slate-50">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Equipos Inscritos ({teams.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowAddTeamForm((v) => !v)}
              className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar Equipo
            </button>
          </div>

          {showAddTeamForm && (
            <form
              onSubmit={handleCreateTeam}
              className="p-4 border-b border-slate-200 bg-emerald-50/40 space-y-3"
            >
              <div className="text-xs font-semibold text-slate-800">
                Nuevo Equipo
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Nombre del equipo
                </label>
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Ej. Club Deportivo Mérida"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">
                    Siglas (3-4 letras)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={newTeamShort}
                    onChange={(e) => setNewTeamShort(e.target.value.toUpperCase())}
                    placeholder="CDM"
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">
                    Color distintivo
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {PRESET_COLORS.slice(0, 6).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewTeamColor(c)}
                        className={`w-5 h-5 rounded-sm border ${
                          newTeamColor === c
                            ? 'ring-2 ring-offset-1 ring-slate-900 border-white'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                        aria-label={`Color ${c}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">
                  Delegado / Capitán (opcional)
                </label>
                <input
                  type="text"
                  value={newTeamCaptain}
                  onChange={(e) => setNewTeamCaptain(e.target.value)}
                  placeholder="Nombre del delegado"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddTeamForm(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg"
                >
                  Guardar Equipo
                </button>
              </div>
            </form>
          )}

          <div className="divide-y divide-slate-200">
            {teams.map((team) => {
              const count = players.filter((p) => p.teamId === team.id).length;
              const isSelected = selectedTeam?.id === team.id;
              const isEditing = editingTeamId === team.id;

              return (
                <div
                  key={team.id}
                  className={`px-4 py-3 transition-colors ${
                    isSelected ? 'bg-emerald-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editTeamName}
                          onChange={(e) => setEditTeamName(e.target.value)}
                          className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                        />
                        <input
                          type="text"
                          maxLength={4}
                          value={editTeamShort}
                          onChange={(e) =>
                            setEditTeamShort(e.target.value.toUpperCase())
                          }
                          className="w-16 px-2 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingTeamId(null)}
                          className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (editTeamName.trim()) {
                              onUpdateTeam({
                                ...team,
                                name: editTeamName.trim(),
                                shortName:
                                  editTeamShort.trim() || team.shortName,
                              });
                            }
                            setEditingTeamId(null);
                          }}
                          className="text-xs font-medium text-emerald-700 hover:text-emerald-800 px-2 py-1"
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedTeamId(team.id)}
                        className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                      >
                        <span
                          className="w-3 h-3 rounded-sm shrink-0"
                          style={{ backgroundColor: team.color }}
                        />
                        <div className="min-w-0">
                          <div
                            className={`text-sm truncate ${
                              isSelected
                                ? 'font-semibold text-slate-900'
                                : 'font-medium text-slate-800'
                            }`}
                          >
                            {team.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            <span className="font-mono">{team.shortName}</span>
                            <span aria-hidden="true"> · </span>
                            <span>{count} jugadores</span>
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTeamId(team.id);
                            setEditTeamName(team.name);
                            setEditTeamShort(team.shortName);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded"
                          title="Editar nombre del equipo"
                          aria-label={`Editar ${team.name}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {teams.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteTeam(team.id);
                              if (selectedTeamId === team.id) {
                                const remaining = teams.find(
                                  (t) => t.id !== team.id
                                );
                                if (remaining) setSelectedTeamId(remaining.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                            title="Eliminar equipo"
                            aria-label={`Eliminar ${team.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Team Roster (Planilla de Jugadores) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
          {!selectedTeam ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Selecciona o agrega un equipo para administrar su planilla de
              jugadores.
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-sm shrink-0"
                    style={{ backgroundColor: selectedTeam.color }}
                  />
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Planilla Oficial — {selectedTeam.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {teamPlayers.length} jugadores inscritos
                      {selectedTeam.coachOrCaptain
                        ? ` · Delegado: ${selectedTeam.coachOrCaptain}`
                        : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 no-print">
                  <button
                    type="button"
                    onClick={() => exportTeamRosterCsv(selectedTeam, teamPlayers)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Exportar CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Imprimir
                  </button>
                </div>
              </div>

              {/* Add Player Quick Form */}
              <form
                onSubmit={handleCreatePlayer}
                className="p-4 border-b border-slate-200 bg-slate-50/40 no-print"
              >
                <div className="text-xs font-semibold text-slate-700 mb-2.5 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-emerald-700" />
                  Agregar Jugador a la Planilla
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  <div className="sm:col-span-5">
                    <label className="block text-xs text-slate-600 mb-1">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      required
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      placeholder="Nombre y apellido del jugador"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-600 mb-1">
                      N° Franela
                    </label>
                    <input
                      type="text"
                      maxLength={3}
                      value={newPlayerNumber}
                      onChange={(e) => setNewPlayerNumber(e.target.value)}
                      placeholder="Ej. 10"
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs text-slate-600 mb-1">
                      Especialidad
                    </label>
                    <select
                      value={newPlayerRole}
                      onChange={(e) =>
                        setNewPlayerRole(e.target.value as PlayerRole)
                      }
                      className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      <option value="Arrimador">Arrimador</option>
                      <option value="Bochador">Bochador</option>
                      <option value="Mixto">Mixto</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      className="w-full px-3 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap"
                    >
                      + Inscribir
                    </button>
                  </div>
                </div>
                <label className="inline-flex items-center gap-2 mt-2.5 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPlayerCaptain}
                    onChange={(e) => setNewPlayerCaptain(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                  />
                  Capitán de equipo
                </label>
              </form>

              {/* Players Table */}
              {teamPlayers.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  Esta planilla aún no tiene jugadores inscritos. Usa el
                  formulario superior para agregar al primer jugador.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                        <th className="py-3 px-4 w-16 font-mono">N°</th>
                        <th className="py-3 px-4">Jugador</th>
                        <th className="py-3 px-4">Especialidad</th>
                        <th className="py-3 px-4">Rol en Equipo</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4 text-right no-print">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {teamPlayers.map((player) => {
                        const isEditing = editingPlayerId === player.id;
                        if (isEditing && editPlayerDraft) {
                          return (
                            <tr key={player.id} className="bg-emerald-50/40">
                              <td className="py-2 px-4">
                                <input
                                  type="text"
                                  maxLength={3}
                                  value={editPlayerDraft.number}
                                  onChange={(e) =>
                                    setEditPlayerDraft({
                                      ...editPlayerDraft,
                                      number: e.target.value,
                                    })
                                  }
                                  className="w-12 px-2 py-1 text-xs font-mono border border-slate-300 rounded bg-white"
                                />
                              </td>
                              <td className="py-2 px-4">
                                <input
                                  type="text"
                                  value={editPlayerDraft.name}
                                  onChange={(e) =>
                                    setEditPlayerDraft({
                                      ...editPlayerDraft,
                                      name: e.target.value,
                                    })
                                  }
                                  className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white"
                                />
                              </td>
                              <td className="py-2 px-4">
                                <select
                                  value={editPlayerDraft.role}
                                  onChange={(e) =>
                                    setEditPlayerDraft({
                                      ...editPlayerDraft,
                                      role: e.target.value as PlayerRole,
                                    })
                                  }
                                  className="px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                                >
                                  <option value="Arrimador">Arrimador</option>
                                  <option value="Bochador">Bochador</option>
                                  <option value="Mixto">Mixto</option>
                                </select>
                              </td>
                              <td className="py-2 px-4 text-xs">
                                <label className="inline-flex items-center gap-1.5">
                                  <input
                                    type="checkbox"
                                    checked={editPlayerDraft.isCaptain}
                                    onChange={(e) =>
                                      setEditPlayerDraft({
                                        ...editPlayerDraft,
                                        isCaptain: e.target.checked,
                                      })
                                    }
                                  />
                                  Capitán
                                </label>
                              </td>
                              <td className="py-2 px-4">
                                <select
                                  value={
                                    editPlayerDraft.active ? 'activo' : 'suplente'
                                  }
                                  onChange={(e) =>
                                    setEditPlayerDraft({
                                      ...editPlayerDraft,
                                      active: e.target.value === 'activo',
                                    })
                                  }
                                  className="px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                                >
                                  <option value="activo">Activo</option>
                                  <option value="suplente">Suplente</option>
                                </select>
                              </td>
                              <td className="py-2 px-4 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (editPlayerDraft.name.trim()) {
                                      onUpdatePlayer(editPlayerDraft);
                                    }
                                    setEditingPlayerId(null);
                                    setEditPlayerDraft(null);
                                  }}
                                  className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded mr-1"
                                  aria-label="Guardar cambios"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPlayerId(null);
                                    setEditPlayerDraft(null);
                                  }}
                                  className="p-1.5 text-slate-500 hover:bg-slate-200 rounded"
                                  aria-label="Cancelar"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={player.id} className="hover:bg-slate-50/70">
                            <td className="py-3 px-4 font-mono tabular-nums text-slate-500">
                              #{player.number}
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-900">
                              {player.name}
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-700">
                              {player.role}
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-600">
                              {player.isCaptain ? 'Capitán' : 'Jugador'}
                            </td>
                            <td className="py-3 px-4 text-xs">
                              <span
                                className={
                                  player.active
                                    ? 'text-emerald-700 font-medium'
                                    : 'text-slate-500'
                                }
                              >
                                {player.active ? 'Activo' : 'Suplente'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap no-print">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPlayerId(player.id);
                                  setEditPlayerDraft({ ...player });
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded mr-1"
                                title="Editar jugador"
                                aria-label={`Editar ${player.name}`}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeletePlayer(player.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                                title="Quitar de planilla"
                                aria-label={`Eliminar ${player.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
