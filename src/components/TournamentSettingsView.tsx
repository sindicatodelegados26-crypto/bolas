import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  RefreshCw,
  RotateCcw,
  Download,
  Upload,
  Check,
} from 'lucide-react';
import { TournamentConfig } from '../types/tournament';

interface TournamentSettingsViewProps {
  config: TournamentConfig;
  onSaveAndRegenerate: (newConfig: TournamentConfig) => void;
  onSaveConfigOnly: (newConfig: TournamentConfig) => void;
  onResetScoresOnly: () => void;
  onRestoreDemoData: () => void;
  onExportJson: () => void;
  onImportJson: (jsonText: string) => { ok: boolean; message: string };
}

export const TournamentSettingsView: React.FC<TournamentSettingsViewProps> = ({
  config,
  onSaveAndRegenerate,
  onSaveConfigOnly,
  onResetScoresOnly,
  onRestoreDemoData,
  onExportJson,
  onImportJson,
}) => {
  const [draft, setDraft] = useState<TournamentConfig>(() => ({
    ...config,
    courts: [...config.courts],
    timeSlots: [...config.timeSlots],
  }));
  const [newCourt, setNewCourt] = useState('');
  const [newSlot, setNewSlot] = useState('');
  const [feedback, setFeedback] = useState<string>('');

  const addCourt = () => {
    const val = newCourt.trim();
    if (!val || draft.courts.includes(val)) return;
    setDraft({ ...draft, courts: [...draft.courts, val] });
    setNewCourt('');
  };

  const removeCourt = (idx: number) => {
    if (draft.courts.length <= 1) return;
    setDraft({
      ...draft,
      courts: draft.courts.filter((_, i) => i !== idx),
    });
  };

  const addTimeSlot = () => {
    const val = newSlot.trim();
    if (!val || draft.timeSlots.includes(val)) return;
    setDraft({ ...draft, timeSlots: [...draft.timeSlots, val] });
    setNewSlot('');
  };

  const removeTimeSlot = (idx: number) => {
    if (draft.timeSlots.length <= 1) return;
    setDraft({
      ...draft,
      timeSlots: draft.timeSlots.filter((_, i) => i !== idx),
    });
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = onImportJson(String(reader.result || ''));
      setFeedback(res.message);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {feedback && (
        <div className="px-4 py-3 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback('')}
            className="text-emerald-700 underline ml-4"
          >
            Ocultar
          </button>
        </div>
      )}

      {/* General parameters */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Parámetros del Torneo
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configura las reglas de puntuación, cantidad de vueltas, canchas y
            horarios nocturnos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nombre del Torneo
            </label>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tantos por Partido (Meta)
            </label>
            <input
              type="number"
              min={10}
              max={40}
              value={draft.targetTantos}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  targetTantos: Math.max(1, Number(e.target.value) || 20),
                })
              }
              className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Puntos por Victoria
            </label>
            <select
              value={draft.pointsPerWin}
              onChange={(e) =>
                setDraft({ ...draft, pointsPerWin: Number(e.target.value) })
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value={2}>2 puntos por juego ganado</option>
              <option value={3}>3 puntos por juego ganado</option>
              <option value={1}>1 punto por juego ganado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Formato de Vueltas
            </label>
            <select
              value={draft.vueltas}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  vueltas: Number(e.target.value) as 1 | 2 | 4,
                })
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value={1}>1 Vuelta (Todos contra todos simple)</option>
              <option value={2}>2 Vueltas (Ida y vuelta)</option>
              <option value={4}>
                4 Vueltas (Equilibrio exacto en 4 canchas)
              </option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Fecha de Inicio
              </label>
              <input
                type="date"
                value={draft.startDate}
                onChange={(e) =>
                  setDraft({ ...draft, startDate: e.target.value })
                }
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Días entre Jornadas
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={draft.daysBetweenJornadas}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    daysBetweenJornadas: Math.max(
                      1,
                      Number(e.target.value) || 7
                    ),
                  })
                }
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Courts & TimeSlots */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-3 border-t border-slate-200">
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2">
              Canchas Disponibles ({draft.courts.length})
            </div>
            <div className="space-y-1.5 mb-2.5">
              {draft.courts.map((c, i) => (
                <div
                  key={`${c}-${i}`}
                  className="flex items-center justify-between px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <span className="font-medium text-slate-800">{c}</span>
                  {draft.courts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCourt(i)}
                      className="text-slate-400 hover:text-red-600"
                      aria-label={`Eliminar ${c}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCourt}
                onChange={(e) => setNewCourt(e.target.value)}
                placeholder="Ej. Cancha 5"
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              />
              <button
                type="button"
                onClick={addCourt}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar
              </button>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2">
              Horarios de Juego ({draft.timeSlots.length})
            </div>
            <div className="space-y-1.5 mb-2.5">
              {draft.timeSlots.map((s, i) => (
                <div
                  key={`${s}-${i}`}
                  className="flex items-center justify-between px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <span className="font-mono font-medium text-slate-800">
                    {s}
                  </span>
                  {draft.timeSlots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTimeSlot(i)}
                      className="text-slate-400 hover:text-red-600"
                      aria-label={`Eliminar ${s}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSlot}
                onChange={(e) => setNewSlot(e.target.value)}
                placeholder="Ej. 08:00 PM"
                className="flex-1 px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
              />
              <button
                type="button"
                onClick={addTimeSlot}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => {
              onSaveConfigOnly(draft);
              setFeedback(
                'Configuración general guardada sin modificar el calendario actual.'
              );
            }}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 whitespace-nowrap"
          >
            <Check className="w-3.5 h-3.5" />
            Guardar Solo Parámetros
          </button>
          <button
            type="button"
            onClick={() => {
              onSaveAndRegenerate(draft);
              setFeedback(
                'Configuración aplicada y calendario equilibrado regenerado.'
              );
            }}
            className="px-4 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center gap-1.5 whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Guardar y Regenerar Calendario
          </button>
        </div>
      </div>

      {/* Backup & Maintenance */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Respaldo y Reinicio del Torneo
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Todos los datos se guardan automáticamente en este navegador. Puedes
            descargar un respaldo completo o reiniciar marcadores para comenzar
            un nuevo campeonato.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onExportJson}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Descargar Respaldo JSON
          </button>

          <label className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
            <Upload className="w-3.5 h-3.5" />
            Importar Respaldo JSON
            <input
              type="file"
              accept="application/json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              onResetScoresOnly();
              setFeedback(
                'Todos los partidos quedaron en estado Programado con marcadores limpios.'
              );
            }}
            className="px-3.5 py-2 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 flex items-center gap-1.5 whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpiar Resultados (Conservar Equipos)
          </button>

          <button
            type="button"
            onClick={() => {
              onRestoreDemoData();
              setFeedback('Datos iniciales de ejemplo restaurados.');
            }}
            className="px-3.5 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 whitespace-nowrap"
          >
            Restaurar Ejemplo Inicial
          </button>
        </div>
      </div>
    </div>
  );
};
