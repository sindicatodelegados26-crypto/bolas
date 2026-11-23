import React, { useEffect, useMemo, useState } from 'react';
import { Menu, Plus, X } from 'lucide-react';
import {
  Match,
  Player,
  Team,
  TournamentConfig,
} from './types/tournament';
import { buildInitialSeedState } from './data/seedData';
import { generateBalancedSchedule } from './utils/scheduler';
import { NavSection, Sidebar } from './components/Sidebar';
import { CalendarView } from './components/CalendarView';
import { StandingsView } from './components/StandingsView';
import { TeamsRosterView } from './components/TeamsRosterView';
import { PlayerStatsView } from './components/PlayerStatsView';
import { TournamentSettingsView } from './components/TournamentSettingsView';
import { MatchScorecardModal } from './components/MatchScorecardModal';

const STORAGE_KEY = 'bolas_criollas_torneo_v1';

interface StoredState {
  config: TournamentConfig;
  teams: Team[];
  players: Player[];
  matches: Match[];
}

function loadInitialState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredState;
      if (
        parsed &&
        parsed.config &&
        Array.isArray(parsed.teams) &&
        Array.isArray(parsed.players) &&
        Array.isArray(parsed.matches)
      ) {
        return parsed;
      }
    }
  } catch {
    // fallback to seed
  }
  return buildInitialSeedState();
}

const SECTION_TITLES: Record<NavSection, string> = {
  calendario: 'Calendario y Canchas',
  clasificacion: 'Tabla de Clasificación',
  equipos: 'Equipos y Planillas',
  estadisticas: 'Estadísticas Técnicas',
  configuracion: 'Configuración del Torneo',
};

const EXTRA_TEAM_COLORS = [
  '#9333EA',
  '#0369A1',
  '#BE123C',
  '#4D7C0F',
  '#C2410C',
  '#0F766E',
];

/**
 * Preserves previously recorded match scores & player stats when regenerating
 * the schedule if the exact same pair of teams had recorded results.
 */
function mergeExistingResults(
  newMatches: Match[],
  oldMatches: Match[]
): Match[] {
  const poolByPair = new Map<string, Match[]>();

  for (const m of oldMatches) {
    if (m.status === 'programado' && m.homeScore === null) continue;
    const key = [m.homeTeamId, m.awayTeamId].sort().join('__');
    const arr = poolByPair.get(key) ?? [];
    arr.push(m);
    poolByPair.set(key, arr);
  }

  return newMatches.map((nm) => {
    const key = [nm.homeTeamId, nm.awayTeamId].sort().join('__');
    const pool = poolByPair.get(key);
    if (!pool || pool.length === 0) return nm;

    const prev = pool.shift()!;
    const sameOrientation = prev.homeTeamId === nm.homeTeamId;
    return {
      ...nm,
      status: prev.status,
      homeScore: sameOrientation ? prev.homeScore : prev.awayScore,
      awayScore: sameOrientation ? prev.awayScore : prev.homeScore,
      playerStats: prev.playerStats,
      notes: prev.notes,
    };
  });
}

export default function App() {
  const [state, setState] = useState<StoredState>(loadInitialState);
  const [activeSection, setActiveSection] = useState<NavSection>('calendario');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [quickAddTeamOpen, setQuickAddTeamOpen] = useState(false);

  // Quick Add Team modal fields
  const [qaName, setQaName] = useState('');
  const [qaShort, setQaShort] = useState('');
  const [qaCaptain, setQaCaptain] = useState('');
  const [qaAutoRegenerate, setQaAutoRegenerate] = useState(true);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage quota issues
    }
  }, [state]);

  const playedCount = useMemo(
    () => state.matches.filter((m) => m.status === 'finalizado').length,
    [state.matches]
  );

  const hasUnsyncedTeamsForSchedule = useMemo(() => {
    if (state.teams.length < 2) return false;
    const scheduledIds = new Set<string>();
    for (const m of state.matches) {
      scheduledIds.add(m.homeTeamId);
      scheduledIds.add(m.awayTeamId);
    }
    return state.teams.some((t) => !scheduledIds.has(t.id));
  }, [state.teams, state.matches]);

  const handleRegenerateSchedule = (
    overrideVueltas?: 1 | 2 | 4,
    overrideConfig?: TournamentConfig,
    overrideTeams?: Team[]
  ) => {
    const nextConfig: TournamentConfig = {
      ...(overrideConfig ?? state.config),
      ...(overrideVueltas ? { vueltas: overrideVueltas } : {}),
    };
    const targetTeams = overrideTeams ?? state.teams;
    const freshMatches = generateBalancedSchedule(targetTeams, nextConfig);
    const mergedMatches = mergeExistingResults(freshMatches, state.matches);

    setState((prev) => ({
      ...prev,
      config: nextConfig,
      teams: targetTeams,
      matches: mergedMatches,
    }));
  };

  const handleSaveMatch = (updatedMatch: Match) => {
    setState((prev) => ({
      ...prev,
      matches: prev.matches.map((m) =>
        m.id === updatedMatch.id ? updatedMatch : m
      ),
    }));
    setEditingMatch(null);
  };

  const handleAddTeam = (
    teamInput: Omit<Team, 'id'>,
    autoRegenerate = false
  ) => {
    const newTeam: Team = {
      ...teamInput,
      id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    const nextTeams = [...state.teams, newTeam];

    if (autoRegenerate) {
      handleRegenerateSchedule(undefined, undefined, nextTeams);
    } else {
      setState((prev) => ({
        ...prev,
        teams: nextTeams,
      }));
    }
  };

  const handleUpdateTeam = (updated: Team) => {
    setState((prev) => ({
      ...prev,
      teams: prev.teams.map((t) => (t.id === updated.id ? updated : t)),
    }));
  };

  const handleDeleteTeam = (teamId: string) => {
    setState((prev) => {
      const nextTeams = prev.teams.filter((t) => t.id !== teamId);
      const nextPlayers = prev.players.filter((p) => p.teamId !== teamId);
      const nextMatches = prev.matches.filter(
        (m) => m.homeTeamId !== teamId && m.awayTeamId !== teamId
      );
      return {
        ...prev,
        teams: nextTeams,
        players: nextPlayers,
        matches: nextMatches,
      };
    });
  };

  const handleAddPlayer = (playerInput: Omit<Player, 'id'>) => {
    const newPlayer: Player = {
      ...playerInput,
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setState((prev) => ({
      ...prev,
      players: [...prev.players, newPlayer],
    }));
  };

  const handleUpdatePlayer = (updated: Player) => {
    setState((prev) => ({
      ...prev,
      players: prev.players.map((p) => (p.id === updated.id ? updated : p)),
    }));
  };

  const handleDeletePlayer = (playerId: string) => {
    setState((prev) => ({
      ...prev,
      players: prev.players.filter((p) => p.id !== playerId),
    }));
  };

  const handleQuickAddTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = qaName.trim();
    if (!trimmed) return;
    const short =
      qaShort.trim().toUpperCase().slice(0, 4) ||
      trimmed.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() ||
      'EQP';
    const color =
      EXTRA_TEAM_COLORS[state.teams.length % EXTRA_TEAM_COLORS.length];

    handleAddTeam(
      {
        name: trimmed,
        shortName: short,
        color,
        coachOrCaptain: qaCaptain.trim() || undefined,
      },
      qaAutoRegenerate
    );

    setQaName('');
    setQaShort('');
    setQaCaptain('');
    setQuickAddTeamOpen(false);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'respaldo_torneo_bolas_criollas.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (
    jsonText: string
  ): { ok: boolean; message: string } => {
    try {
      const parsed = JSON.parse(jsonText) as StoredState;
      if (
        !parsed ||
        !parsed.config ||
        !Array.isArray(parsed.teams) ||
        !Array.isArray(parsed.players) ||
        !Array.isArray(parsed.matches)
      ) {
        return {
          ok: false,
          message: 'El archivo JSON no tiene el formato válido del torneo.',
        };
      }
      setState(parsed);
      return { ok: true, message: 'Respaldo importado correctamente.' };
    } catch {
      return { ok: false, message: 'Error al leer el archivo JSON.' };
    }
  };

  const handleResetScoresOnly = () => {
    setState((prev) => ({
      ...prev,
      matches: prev.matches.map((m) => ({
        ...m,
        homeScore: null,
        awayScore: null,
        status: 'programado',
        playerStats: {},
        notes: undefined,
      })),
    }));
  };

  const handleRestoreDemoData = () => {
    setState(buildInitialSeedState());
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        tournamentName={state.config.name}
        teamCount={state.teams.length}
        playedCount={playedCount}
        totalMatches={state.matches.length}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Context Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="text-xs text-slate-500 truncate">
                {state.config.name}
                <span aria-hidden="true"> / </span>
                <span className="text-slate-700 font-medium">
                  {SECTION_TITLES[activeSection]}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 truncate">
                {SECTION_TITLES[activeSection]}
              </h1>
            </div>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setQuickAddTeamOpen(true)}
              className="px-4 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar Equipo
            </button>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          {activeSection === 'calendario' && (
            <CalendarView
              teams={state.teams}
              matches={state.matches}
              config={state.config}
              onSelectMatch={(m) => setEditingMatch(m)}
              onRegenerateSchedule={(vueltas) =>
                handleRegenerateSchedule(vueltas)
              }
            />
          )}

          {activeSection === 'clasificacion' && (
            <StandingsView
              teams={state.teams}
              matches={state.matches}
              config={state.config}
            />
          )}

          {activeSection === 'equipos' && (
            <TeamsRosterView
              teams={state.teams}
              players={state.players}
              hasUnsyncedTeamsForSchedule={hasUnsyncedTeamsForSchedule}
              onAddTeam={(t) => handleAddTeam(t, false)}
              onUpdateTeam={handleUpdateTeam}
              onDeleteTeam={handleDeleteTeam}
              onAddPlayer={handleAddPlayer}
              onUpdatePlayer={handleUpdatePlayer}
              onDeletePlayer={handleDeletePlayer}
              onRegenerateSchedule={() => handleRegenerateSchedule()}
            />
          )}

          {activeSection === 'estadisticas' && (
            <PlayerStatsView
              players={state.players}
              teams={state.teams}
              matches={state.matches}
            />
          )}

          {activeSection === 'configuracion' && (
            <TournamentSettingsView
              config={state.config}
              onSaveAndRegenerate={(newCfg) =>
                handleRegenerateSchedule(undefined, newCfg)
              }
              onSaveConfigOnly={(newCfg) =>
                setState((prev) => ({ ...prev, config: newCfg }))
              }
              onResetScoresOnly={handleResetScoresOnly}
              onRestoreDemoData={handleRestoreDemoData}
              onExportJson={handleExportJson}
              onImportJson={handleImportJson}
            />
          )}
        </main>
      </div>

      {/* Match Scorecard & Player Stats Modal */}
      {editingMatch && (
        <MatchScorecardModal
          match={editingMatch}
          teams={state.teams}
          players={state.players}
          config={state.config}
          onClose={() => setEditingMatch(null)}
          onSave={handleSaveMatch}
        />
      )}

      {/* Quick Add Team Modal */}
      {quickAddTeamOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-add-team-title"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
              <h2
                id="quick-add-team-title"
                className="text-sm font-bold text-slate-900"
              >
                Agregar Equipo al Torneo
              </h2>
              <button
                type="button"
                onClick={() => setQuickAddTeamOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddTeamSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nombre del equipo
                </label>
                <input
                  type="text"
                  required
                  value={qaName}
                  onChange={(e) => setQaName(e.target.value)}
                  placeholder="Ej. Club Deportivo Cordillera"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Siglas
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={qaShort}
                    onChange={(e) => setQaShort(e.target.value.toUpperCase())}
                    placeholder="CDC"
                    className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Delegado / Capitán
                  </label>
                  <input
                    type="text"
                    value={qaCaptain}
                    onChange={(e) => setQaCaptain(e.target.value)}
                    placeholder="Opcional"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={qaAutoRegenerate}
                  onChange={(e) => setQaAutoRegenerate(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                />
                <span>
                  Regenerar y equilibrar automáticamente el calendario en las{' '}
                  {state.config.courts.length} canchas y horarios (
                  {state.config.timeSlots.join(' / ')}) incluyendo al nuevo
                  equipo.
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickAddTeamOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg"
                >
                  Agregar Equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
