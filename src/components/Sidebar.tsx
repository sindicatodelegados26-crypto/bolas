import React from 'react';
import {
  CalendarDays,
  Trophy,
  Users,
  BarChart3,
  Settings,
  X,
} from 'lucide-react';

export type NavSection =
  | 'calendario'
  | 'clasificacion'
  | 'equipos'
  | 'estadisticas'
  | 'configuracion';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  tournamentName: string;
  teamCount: number;
  playedCount: number;
  totalMatches: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'calendario', label: 'Calendario y Canchas', icon: CalendarDays },
  { id: 'clasificacion', label: 'Clasificación', icon: Trophy },
  { id: 'equipos', label: 'Equipos y Planillas', icon: Users },
  { id: 'estadisticas', label: 'Estadísticas Técnicas', icon: BarChart3 },
  { id: 'configuracion', label: 'Configuración', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  tournamentName,
  teamCount,
  playedCount,
  totalMatches,
  mobileOpen,
  onCloseMobile,
}) => {
  const navContent = (
    <div className="flex h-full flex-col justify-between bg-white border-r border-slate-200">
      <div>
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-200">
          <div className="min-w-0">
            <span className="block text-base font-bold tracking-tight text-slate-900 font-display truncate">
              Bolas Criollas
            </span>
            <span className="block text-xs text-slate-500 truncate mt-0.5">
              {tournamentName}
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1" aria-label="Navegación principal">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectSection(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50/70">
        <div className="text-xs font-medium text-slate-500 mb-2">
          Resumen del Torneo
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-slate-500">Equipos</div>
            <div className="text-base font-semibold text-slate-900 font-mono tabular-nums mt-0.5">
              {teamCount}
            </div>
          </div>
          <div>
            <div className="text-slate-500">Partidos</div>
            <div className="text-base font-semibold text-slate-900 font-mono tabular-nums mt-0.5">
              {playedCount}/{totalMatches}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {navContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] h-full z-10">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
};
