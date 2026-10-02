import React, { useState } from 'react';
import {
  ToothCondition,
  ToothState,
  ToothSurfaceKey,
  OdontogramData,
} from '../types';
import {
  Sparkles,
  Info,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit3,
} from 'lucide-react';
import { api } from '../services/api';

interface OdontogramProps {
  odontogram?: OdontogramData;
  onChange?: (updatedOdontogram: OdontogramData) => void;
  onAddTreatmentForTooth?: (toothNumber: number, condition: ToothCondition) => void;
  readOnly?: boolean;
}

const CONDITION_COLORS: Record<ToothCondition, { bg: string; fill: string; border: string; label: string; text: string }> = {
  healthy: { bg: 'bg-slate-100', fill: '#f8fafc', border: '#cbd5e1', label: 'Sano', text: 'text-slate-600' },
  caries: { bg: 'bg-rose-500', fill: '#ef4444', border: '#b91c1c', label: 'Caries activa', text: 'text-rose-700' },
  restored: { bg: 'bg-sky-500', fill: '#0284c7', border: '#0369a1', label: 'Obturación / Resina', text: 'text-sky-700' },
  endodontics: { bg: 'bg-amber-500', fill: '#f59e0b', border: '#d97706', label: 'Endodoncia', text: 'text-amber-700' },
  crown: { bg: 'bg-purple-500', fill: '#a855f7', border: '#7e22ce', label: 'Corona / Prótesis', text: 'text-purple-700' },
  implant: { bg: 'bg-emerald-500', fill: '#10b981', border: '#047857', label: 'Implante Dental', text: 'text-emerald-700' },
  extraction_needed: { bg: 'bg-orange-600', fill: '#ea580c', border: '#c2410c', label: 'Extracción indicada', text: 'text-orange-700' },
  absent: { bg: 'bg-slate-400', fill: '#94a3b8', border: '#64748b', label: 'Pieza Ausente', text: 'text-slate-500' },
  bridge: { bg: 'bg-indigo-500', fill: '#6366f1', border: '#4338ca', label: 'Póntico / Puente', text: 'text-indigo-700' },
  sealant: { bg: 'bg-cyan-500', fill: '#06b6d4', border: '#0e7490', label: 'Sellante de fosas', text: 'text-cyan-700' },
  fracture: { bg: 'bg-pink-500', fill: '#ec4899', border: '#be185d', label: 'Fractura dental', text: 'text-pink-700' },
  orthodontics: { bg: 'bg-teal-500', fill: '#14b8a6', border: '#0f766e', label: 'En Ortodoncia', text: 'text-teal-700' },
};

// Adult FDI Teeth arranged by quadrants
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

// Pediatric FDI Teeth
const PED_UPPER_RIGHT = [55, 54, 53, 52, 51];
const PED_UPPER_LEFT = [61, 62, 63, 64, 65];
const PED_LOWER_RIGHT = [85, 84, 83, 82, 81];
const PED_LOWER_LEFT = [71, 72, 73, 74, 75];

export const Odontogram: React.FC<OdontogramProps> = ({
  paciente,
  odontogram = {},
  onChange,
  onAddTreatmentForTooth,
  readOnly = false,
}) => {
  const [selectedTool, setSelectedTool] = useState<ToothCondition>('caries');
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [showPediatric, setShowPediatric] = useState(false);
  const [toothNoteInput, setToothNoteInput] = useState('');

  const safeOdontogram = odontogram || {};

  const getToothState = (num: number): ToothState => {
    const raw = safeOdontogram[num] || {
      toothNumber: num,
      surfaces: {},
    };
    return {
      ...raw,
      surfaces: raw.surfaces || {},
    };
  };

  const handleSurfaceClick = async (toothNum: number, surface: ToothSurfaceKey, e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly) {
      setSelectedTooth(toothNum);
      return;
    }

    const current = getToothState(toothNum);
    const currentSurfaces = current.surfaces || {};
    const currentSurfaceCondition = currentSurfaces[surface];
    const newCondition = currentSurfaceCondition === selectedTool ? undefined : selectedTool;

    const updated: ToothState = {
      ...current,
      surfaces: {
        ...currentSurfaces,
        [surface]: newCondition,
      },
      lastUpdated: new Date().toISOString(),
    };

    const newOdontogram = { ...safeOdontogram, [toothNum]: updated };
    if (onChange) onChange(newOdontogram);
  const respuesta = await api.saveOdontogram(paciente,newOdontogram);
    setSelectedTooth(toothNum);


    if (onChange) {
            const odo:any = await api.getOdontogram(paciente);
            console.log("odo",odo.data)
      onChange(odo.data ?? odo.data);
    }

  };

  const handleWholeToothCondition = (toothNum: number, condition: ToothCondition) => {
    if (readOnly) return;
    const current = getToothState(toothNum);
    const newCondition = current.wholeToothCondition === condition ? undefined : condition;

    const updated: ToothState = {
      ...current,
      wholeToothCondition: newCondition,
      lastUpdated: new Date().toISOString(),
    };

    const newOdontogram = { ...safeOdontogram, [toothNum]: updated };
    if (onChange) onChange(newOdontogram);
    setSelectedTooth(toothNum);
    console.log("toothNum",toothNum);
  };

  const handleClearTooth = (toothNum: number) => {
    if (readOnly) return;
    const newOdontogram = { ...safeOdontogram };
    delete newOdontogram[toothNum];
    if (onChange) onChange(newOdontogram);
    setToothNoteInput('');
  };

  const handleSaveNote = async () => {
    if (!selectedTooth) return;
    const current = getToothState(selectedTooth);
    const updated: ToothState = {
      ...current,
      notes: toothNoteInput,
      lastUpdated: new Date().toISOString(),
    };
    if (onChange) onChange({ ...safeOdontogram, [selectedTooth]: updated });

    const respuesta = await api.saveOdontogram(paciente,Odontogram);
    //setSelectedTooth(toothNum);
    console.log(current,Odontogram);

  };

  // Render individual tooth item with SVG surfaces
  const renderTooth = (toothNum: number) => {
    const tooth = getToothState(toothNum);
    const isSelected = selectedTooth === toothNum;
    const whole = tooth.wholeToothCondition;

    const getSurfaceFill = (surf: ToothSurfaceKey) => {
      const cond = tooth.surfaces ? tooth.surfaces[surf] : undefined;
      if (cond && CONDITION_COLORS[cond]) {
        return CONDITION_COLORS[cond].fill;
      }
      return '#ffffff';
    };

    const hasAnyIssue =
      Boolean(whole) ||
      (tooth.surfaces
        ? Object.values(tooth.surfaces).some((c) => c && c !== 'healthy')
        : false);

    return (
      <div
        key={toothNum}
        id={`tooth-${toothNum}`}
        onClick={() => {
          setSelectedTooth(toothNum);
          setToothNoteInput(tooth.notes || '');
        }}
        className={`relative flex flex-col items-center p-1.5 rounded-lg transition-all cursor-pointer select-none group ${
          isSelected
            ? 'ring-2 ring-sky-500 bg-sky-50/80 shadow-md'
            : 'hover:bg-slate-100/80'
        } ${hasAnyIssue ? 'border border-slate-200 shadow-xs' : ''}`}
        title={`Pieza ${toothNum}${tooth.notes ? `: ${tooth.notes}` : ''}`}
      >
        <span className="text-[11px] font-bold text-slate-700 mb-1 group-hover:text-sky-700">
          {toothNum}
        </span>

        {/* Anatomical 5-surface SVG Dental Representation */}
        <div className="relative w-9 h-9">
          {/* Whole tooth overlays */}
          {whole === 'absent' && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-slate-500">✕</span>
            </div>
          )}
          {whole === 'extraction_needed' && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-rose-600">✗</span>
            </div>
          )}
          {whole === 'implant' && (
            <div className="absolute -top-1.5 inset-x-0 z-20 flex justify-center pointer-events-none">
              <span className="text-[9px] bg-emerald-700 text-white font-bold px-1 rounded-sm shadow-xs">IMP</span>
            </div>
          )}
          {whole === 'crown' && (
            <div className="absolute -top-1.5 inset-x-0 z-20 flex justify-center pointer-events-none">
              <span className="text-[9px] bg-purple-700 text-white font-bold px-1 rounded-sm shadow-xs">COR</span>
            </div>
          )}
          {whole === 'endodontics' && (
            <div className="absolute -bottom-1.5 inset-x-0 z-20 flex justify-center pointer-events-none">
              <span className="text-[9px] bg-amber-600 text-white font-bold px-1 rounded-sm shadow-xs">ENDO</span>
            </div>
          )}
          {whole === 'orthodontics' && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
              <div className="w-2.5 h-2.5 bg-teal-600 rounded-xs border border-white"></div>
            </div>
          )}

          <svg
            viewBox="0 0 100 100"
            className={`w-full h-full drop-shadow-xs transition-opacity ${
              whole === 'absent' ? 'opacity-40' : 'opacity-100'
            }`}
          >
            {/* Top Surface (Vestibular / Palatino) */}
            <polygon
              points="0,0 100,0 72,28 28,28"
              fill={getSurfaceFill('top')}
              stroke="#64748b"
              strokeWidth="3.5"
              className="transition-colors hover:brightness-90 cursor-pointer"
              onClick={(e) => handleSurfaceClick(toothNum, 'top', e)}
            />
            {/* Bottom Surface (Lingual / Vestibular) */}
            <polygon
              points="0,100 100,100 72,72 28,72"
              fill={getSurfaceFill('bottom')}
              stroke="#64748b"
              strokeWidth="3.5"
              className="transition-colors hover:brightness-90 cursor-pointer"
              onClick={(e) => handleSurfaceClick(toothNum, 'bottom', e)}
            />
            {/* Left Surface (Mesial / Distal) */}
            <polygon
              points="0,0 0,100 28,72 28,28"
              fill={getSurfaceFill('left')}
              stroke="#64748b"
              strokeWidth="3.5"
              className="transition-colors hover:brightness-90 cursor-pointer"
              onClick={(e) => handleSurfaceClick(toothNum, 'left', e)}
            />
            {/* Right Surface (Distal / Mesial) */}
            <polygon
              points="100,0 100,100 72,72 72,28"
              fill={getSurfaceFill('right')}
              stroke="#64748b"
              strokeWidth="3.5"
              className="transition-colors hover:brightness-90 cursor-pointer"
              onClick={(e) => handleSurfaceClick(toothNum, 'right', e)}
            />
            {/* Center Surface (Oclusal / Incisal) */}
            <rect
              x="28"
              y="28"
              width="44"
              height="44"
              fill={getSurfaceFill('center')}
              stroke="#64748b"
              strokeWidth="3.5"
              className="transition-colors hover:brightness-90 cursor-pointer"
              onClick={(e) => handleSurfaceClick(toothNum, 'center', e)}
            />
          </svg>
        </div>

        {/* Small badge if there are custom notes */}
        {tooth.notes && (
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1" />
        )}
      </div>
    );
  };

  const selectedToothState = selectedTooth ? getToothState(selectedTooth) : null;

  // Calculate diagnostic counts
  const toothKeys = Object.keys(safeOdontogram).map(Number);
  const cariesCount = toothKeys.filter((k) => {
    const t = safeOdontogram[k];
    if (!t) return false;
    const surfacesVal = t.surfaces ? Object.values(t.surfaces) : [];
    return (
      surfacesVal.some((s) => s === 'caries') ||
      t.wholeToothCondition === 'caries'
    );
  }).length;
  const restoredCount = toothKeys.filter((k) => {
    const t = safeOdontogram[k];
    return Boolean(t && t.surfaces && Object.values(t.surfaces).some((s) => s === 'restored'));
  }).length;
  const endoCount = toothKeys.filter((k) => {
    const t = safeOdontogram[k];
    if (!t) return false;
    const surfacesVal = t.surfaces ? Object.values(t.surfaces) : [];
    return (
      t.wholeToothCondition === 'endodontics' ||
      surfacesVal.some((s) => s === 'endodontics')
    );
  }).length;
  const absentCount = toothKeys.filter((k) => {
    const t = safeOdontogram[k];
    return Boolean(t && t.wholeToothCondition === 'absent');
  }).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 md:p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-800 tracking-tight">
              Odontograma Clínico Interactivo (FDI)
            </h3>
            <span className="bg-sky-100 text-sky-800 text-xs px-2.5 py-0.5 rounded-full font-medium">
              Norma Internacional ISO 3950
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Haga clic en una superficie (vestibular, lingual, mesial, distal, oclusal) o aplique una condición general a la pieza.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPediatric(!showPediatric)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              showPediatric
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {showPediatric ? 'Ver Dentición Permanente' : 'Ver Dentición Temporal (Pediatría)'}
          </button>
        </div>
      </div>

      {/* Tool Palette */}
      {!readOnly && (
        <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Herramienta de Diagnóstico Activa:
          </span>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(CONDITION_COLORS) as [ToothCondition, typeof CONDITION_COLORS[ToothCondition]][]).map(
              ([key, val]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedTool(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium border transition-all ${
                    selectedTool === key
                      ? 'bg-white shadow-xs ring-2 ring-sky-500 border-sky-400 font-semibold'
                      : 'bg-white/60 border-slate-200 hover:bg-white text-slate-700'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: val.fill }}
                  />
                  <span>{val.label}</span>
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Odontogram Grid Architecture */}
      <div className="bg-gradient-to-b from-slate-50/40 to-white rounded-xl border border-slate-200/80 p-4 space-y-6 overflow-x-auto">
        {/* Maxilar Superior (Upper Arch) */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">
            <span>Arcada Superior Derecha (Q1)</span>
            <span className="font-bold text-slate-700">MAXILAR SUPERIOR</span>
            <span>Arcada Superior Izquierda (Q2)</span>
          </div>

          <div className="flex items-center justify-center gap-1 sm:gap-2">
            {/* Q1 */}
            <div className="flex gap-1">
              {(showPediatric ? PED_UPPER_RIGHT : UPPER_RIGHT).map((num) =>
                renderTooth(num)
              )}
            </div>

            {/* Midline separator */}
            <div className="h-14 w-0.5 bg-rose-300 mx-1 relative" title="Línea Media Dental">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] text-rose-500 font-bold">
                LM
              </span>
            </div>

            {/* Q2 */}
            <div className="flex gap-1">
              {(showPediatric ? PED_UPPER_LEFT : UPPER_LEFT).map((num) =>
                renderTooth(num)
              )}
            </div>
          </div>
        </div>

        {/* Horizontal midline separator */}
        <div className="relative border-t-2 border-dashed border-slate-200 my-2">
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Plano Oclusal
          </span>
        </div>

        {/* Mandíbula Inferior (Lower Arch) */}
        <div>
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            {/* Q4 */}
            <div className="flex gap-1">
              {(showPediatric ? PED_LOWER_RIGHT : LOWER_RIGHT).map((num) =>
                renderTooth(num)
              )}
            </div>

            {/* Midline separator */}
            <div className="h-14 w-0.5 bg-rose-300 mx-1" />

            {/* Q3 */}
            <div className="flex gap-1">
              {(showPediatric ? PED_LOWER_LEFT : LOWER_LEFT).map((num) =>
                renderTooth(num)
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mt-2">
            <span>Arcada Inferior Derecha (Q4)</span>
            <span className="font-bold text-slate-700">MANDÍBULA INFERIOR</span>
            <span>Arcada Inferior Izquierda (Q3)</span>
          </div>
        </div>
      </div>

      {/* Summary Chips & Quick Findings */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-700">Hallazgos registrados:</span>
          {cariesCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
              {cariesCount} Caries detectadas
            </span>
          )}
          {restoredCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
              {restoredCount} Obturaciones
            </span>
          )}
          {endoCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              {endoCount} Endodoncias
            </span>
          )}
          {absentCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium">
              {absentCount} Piezas ausentes
            </span>
          )}
          {cariesCount === 0 && restoredCount === 0 && endoCount === 0 && (
            <span className="text-slate-400 italic">Sin patologías registradas</span>
          )}
        </div>
      </div>

      {/* Selected Tooth Detail Panel */}
      {selectedTooth && (
        <div className="bg-slate-50 border border-sky-200 rounded-xl p-4 space-y-3 transition-all animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-sky-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                {selectedTooth}
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  Detalles Clínicos de la Pieza #{selectedTooth}
                </h4>
                <p className="text-xs text-slate-500">
                  {selectedTooth >= 11 && selectedTooth <= 18 && 'Incisivo/Canino/Molar Superior Derecho'}
                  {selectedTooth >= 21 && selectedTooth <= 28 && 'Incisivo/Canino/Molar Superior Izquierdo'}
                  {selectedTooth >= 31 && selectedTooth <= 38 && 'Incisivo/Canino/Molar Inferior Izquierdo'}
                  {selectedTooth >= 41 && selectedTooth <= 48 && 'Incisivo/Canino/Molar Inferior Derecho'}
                </p>
              </div>
            </div>

            {!readOnly && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleClearTooth(selectedTooth)}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 px-2 py-1 rounded-md hover:bg-rose-50"
                  title="Restablecer a estado sano"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Limpiar pieza
                </button>
              </div>
            )}
          </div>

          {/* Whole Tooth Quick Actions */}
          {!readOnly && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 block">
                Estado general de la pieza:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'crown', label: 'Corona / Puente' },
                  { key: 'implant', label: 'Implante' },
                  { key: 'endodontics', label: 'Endodoncia' },
                  { key: 'extraction_needed', label: 'Requiere Extracción' },
                  { key: 'absent', label: 'Pieza Ausente' },
                  { key: 'orthodontics', label: 'Brackets / Alineador' },
                ].map((item) => {
                  const isActive = selectedToothState?.wholeToothCondition === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleWholeToothCondition(selectedTooth, item.key as ToothCondition)}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium border transition-all ${
                        isActive
                          ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add Treatment from Tooth shortcut */}
          {onAddTreatmentForTooth && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
              <span className="text-xs font-medium text-slate-600">
                Prescribir tratamiento directo:
              </span>
              <button
                type="button"
                onClick={() => onAddTreatmentForTooth(selectedTooth, 'caries')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md font-medium"
              >
                <Plus className="w-3 h-3" /> Obturación / Resina
              </button>
              <button
                type="button"
                onClick={() => onAddTreatmentForTooth(selectedTooth, 'endodontics')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-md font-medium"
              >
                <Plus className="w-3 h-3" /> Endodoncia
              </button>
              <button
                type="button"
                onClick={() => onAddTreatmentForTooth(selectedTooth, 'crown')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-md font-medium"
              >
                <Plus className="w-3 h-3" /> Corona Zirconio
              </button>
              <button
                type="button"
                onClick={() => onAddTreatmentForTooth(selectedTooth, 'implant')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md font-medium"
              >
                <Plus className="w-3 h-3" /> Implante
              </button>
            </div>
          )}

          {/* Custom Tooth Observation Note */}
          <div className="pt-2 border-t border-slate-200 space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 block">
              Observaciones específicas para la pieza #{selectedTooth}:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={toothNoteInput}
                onChange={(e) => setToothNoteInput(e.target.value)}
                placeholder="Ej. Caries oclusal profunda, prueba de vitalidad positiva..."
                disabled={readOnly}
                className="flex-1 text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              {!readOnly && (
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium"
                >
                  Guardar Nota
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
