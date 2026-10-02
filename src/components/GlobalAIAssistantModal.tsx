import React, { useState } from 'react';
import { Sparkles, Bot, Send, X, Copy, Check, Stethoscope, FileText, AlertCircle } from 'lucide-react';
import { Patient } from '../types';

interface GlobalAIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
}

export const GlobalAIAssistantModal: React.FC<GlobalAIAssistantModalProps> = ({
  isOpen,
  onClose,
  patients,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [mode, setMode] = useState<
    'clinical_notes' | 'patient_explanation' | 'post_op_care' | 'drug_interactions'
  >('post_op_care');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleAskAI = async (customPrompt?: string) => {
    const textToQuery = customPrompt || prompt;
    if (!textToQuery.trim() && !selectedPatientId) return;

    setIsLoading(true);
    setResponse('');

    const currentPatient = patients.find((p) => p.id === selectedPatientId);

    try {
      const res = await fetch('/api/gemini/clinical-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToQuery,
          mode,
          patientContext: currentPatient
            ? {
                name: `${currentPatient.firstName} ${currentPatient.lastName}`,
                allergies: currentPatient.allergies,
                medicalConditions: currentPatient.medicalConditions,
                bloodPressure: currentPatient.bloodPressure,
              }
            : undefined,
        }),
      });

      const data = await res.json();
      if (data.text) {
        setResponse(data.text);
      } else {
        setResponse('No se pudo generar respuesta clínica. Verifique la conexión.');
      }
    } catch (err) {
      setResponse(
        'Error al comunicarse con el Asistente Clínico Inteligente. Por favor intente nuevamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-8 animate-fadeIn flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Asistente Clínico Odontológico IA
              </h3>
              <p className="text-xs text-slate-400">
                Apoyo en indicaciones post-operatorias, farmacología y explicaciones para pacientes.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Action Modes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setMode('post_op_care')}
              className={`p-2.5 rounded-xl border text-left font-semibold transition-all ${
                mode === 'post_op_care'
                  ? 'bg-sky-50 border-sky-300 text-sky-800 ring-2 ring-sky-400/30'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <FileText className="w-4 h-4 text-sky-600 mb-1" />
              Cuidados Post-Op
            </button>
            <button
              type="button"
              onClick={() => setMode('patient_explanation')}
              className={`p-2.5 rounded-xl border text-left font-semibold transition-all ${
                mode === 'patient_explanation'
                  ? 'bg-sky-50 border-sky-300 text-sky-800 ring-2 ring-sky-400/30'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Bot className="w-4 h-4 text-indigo-600 mb-1" />
              Explicación Paciente
            </button>
            <button
              type="button"
              onClick={() => setMode('clinical_notes')}
              className={`p-2.5 rounded-xl border text-left font-semibold transition-all ${
                mode === 'clinical_notes'
                  ? 'bg-sky-50 border-sky-300 text-sky-800 ring-2 ring-sky-400/30'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Stethoscope className="w-4 h-4 text-emerald-600 mb-1" />
              Redacción SOAP
            </button>
            <button
              type="button"
              onClick={() => setMode('drug_interactions')}
              className={`p-2.5 rounded-xl border text-left font-semibold transition-all ${
                mode === 'drug_interactions'
                  ? 'bg-sky-50 border-sky-300 text-sky-800 ring-2 ring-sky-400/30'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <AlertCircle className="w-4 h-4 text-rose-600 mb-1" />
              Seguridad / Fármacos
            </button>
          </div>

          {/* Patient Context Link */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Contexto del Paciente (Opcional - incluye alergias y condiciones médicas):
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
            >
              <option value="">-- Sin vincular a paciente específico --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} (Alergias: {p.allergies.join(', ') || 'Ninguna'} •
                  Condiciones: {p.medicalConditions.join(', ') || 'Ninguna'})
                </option>
              ))}
            </select>
          </div>

          {/* Prompt textarea */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Procedimiento dental, diagnóstico o consulta clínica:
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ej. Extracción quirúrgica de tercer molar inferior retenido (pieza 38) con osteotomía y sutura..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400 font-medium py-1">Sugerencias:</span>
            <button
              type="button"
              onClick={() => {
                setPrompt('Extracción simple de pieza molar');
                handleAskAI('Extracción simple de pieza molar');
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px]"
            >
              Extracción Simple
            </button>
            <button
              type="button"
              onClick={() => {
                setPrompt('Endodoncia unirradicular pieza 21 con dolor a percusión');
                handleAskAI('Endodoncia unirradicular pieza 21 con dolor a percusión');
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px]"
            >
              Endodoncia
            </button>
            <button
              type="button"
              onClick={() => {
                setPrompt('Colocación de implante dental oseointegrado pieza 46');
                handleAskAI('Colocación de implante dental oseointegrado pieza 46');
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px]"
            >
              Implante Dental
            </button>
          </div>

          {/* Response Box */}
          {isLoading && (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <Sparkles className="w-6 h-6 text-sky-600 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-700">
                Generando respuesta clínica personalizada con Gemini...
              </p>
            </div>
          )}

          {response && !isLoading && (
            <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-sky-700" /> Resultado Clínico
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-sky-700 hover:text-sky-900 font-bold"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado' : 'Copiar Texto'}
                </button>
              </div>

              <div className="text-slate-800 text-xs leading-relaxed whitespace-pre-wrap font-sans bg-white p-3.5 rounded-lg border border-sky-100 max-h-60 overflow-y-auto">
                {response}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-xs"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => handleAskAI()}
            disabled={isLoading || !prompt.trim()}
            className="flex items-center gap-1.5 px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-xs text-xs disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {isLoading ? 'Consultando...' : 'Generar Asistencia'}
          </button>
        </div>
      </div>
    </div>
  );
};
