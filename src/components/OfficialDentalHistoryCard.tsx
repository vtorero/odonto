import React, { useState } from 'react';
import {
  Patient,
  OdontogramData,
  ToothCondition,
  ClinicalNote,
  ClinicSettings,
  StandardTreatmentRow,
} from '../types';
import { defaultOdontodesaTreatmentCatalog } from '../data/odontodesaCatalog';
import {
  Printer,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  FileCheck,
  Stethoscope,
  Activity,
  Heart,
  Calendar,
  Phone,
  User,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api';
import { Odontogram } from './Odontogram';

interface OfficialDentalHistoryCardProps {
  patient: Patient;
  odontogram: OdontogramData;
  clinicalNotes: ClinicalNote[];
  clinicSettings: ClinicSettings;
  onSavePatient: (patient: Patient) => void;
  onSaveOdontogram: (patientId: string, odontogram: OdontogramData) => void;
  onSaveClinicalNote: (note: ClinicalNote) => void;
  onDeleteClinicalNote?: (noteId: string) => void;
}

export const OfficialDentalHistoryCard: React.FC<OfficialDentalHistoryCardProps> = ({
  patient,
  odontogram,
  clinicalNotes,
  clinicSettings,
  onSavePatient,
  onSaveOdontogram,
  onSaveClinicalNote,
  onDeleteClinicalNote,
}) => {
  // Local state for editing the entire record in place
  const [formData, setFormData] = useState<Patient>(() => JSON.parse(JSON.stringify(patient)));
  const [activePage, setActivePage] = useState<'page1' | 'page2' | 'both'>('both');
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<ToothCondition>('caries');
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // New evolution note row state
  const [newEvolutionDate, setNewEvolutionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [newEvolutionPiece, setNewEvolutionPiece] = useState('');
  const [newEvolutionWork, setNewEvolutionWork] = useState('');
  const [newEvolutionTotal, setNewEvolutionTotal] = useState<number>(0);
  const [newEvolutionPaid, setNewEvolutionPaid] = useState<number>(0);
  const [newEvolutionDoctor, setNewEvolutionDoctor] = useState(
    patient.responsibleDoctor || clinicSettings.doctors[0]?.name || 'Doctor Tratante'
  );

  // Initialize or fetch official treatment plan rows
  const [treatmentRows, setTreatmentRows] = useState<StandardTreatmentRow[]>(() => {
    if (formData.officialTreatmentPlan && formData.officialTreatmentPlan.length > 0) {
      return formData.officialTreatmentPlan;
    }
    return defaultOdontodesaTreatmentCatalog.map((item) => ({
      id: `std-tp-${item.itemNumber}`,
      itemNumber: item.itemNumber,
      name: item.name,
      isOrthodontics: item.isOrthodontics,
      orthoInitial: item.orthoInitial || 0,
      orthoMonthly: item.orthoMonthly || 0,
      quantity: 0,
      unitPrice: item.unitPrice,
      totalPrice: 0,
      modifications: '',
    }));
  });

  // Calculate age helper
  const calculateAge = (birthDateString?: string): string => {
    if (!birthDateString) return '-';
    const birth = new Date(birthDateString);
    if (isNaN(birth.getTime())) return '-';
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? `${age} años` : '-';
  };

  // Helper for updating patient fields
  const handleUpdateField = <K extends keyof Patient>(key: K, value: Patient[K]) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Helper for medical history subfields
  const handleUpdateMedicalHistory = (
    key: keyof Patient['medicalhistory'],
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        [key]: value,
      },
    }));
  };

  // Handle treatment row change
  const handleTreatmentRowChange = (
    index: number,
    field: keyof StandardTreatmentRow,
    value: any
  ) => {
    setTreatmentRows((prev) => {
      const updated = [...prev];
      const row = { ...updated[index], [field]: value };

      if (field === 'unitPrice' || field === 'quantity') {
        const qty = field === 'quantity' ? Number(value) || 0 : row.quantity || 0;
        const price = field === 'unitPrice' ? Number(value) || 0 : row.unitPrice || 0;
        row.totalPrice = qty * price;
      }
      updated[index] = row;
      return updated;
    });
  };

  // Treatment plan total
  const treatmentPlanGrandTotal = treatmentRows.reduce(
    (acc, row) => acc + Number(row.totalPrice ?? 0),
    0
  );
  // Save all changes
  const handleSaveAll = () => {
    const finalPatient: Patient = {
      ...formData,
      officialTreatmentPlan: treatmentRows,
    };
    onSavePatient(finalPatient);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 3000);
  };

  // Trigger print
  const handlePrint = () => {
    window.print();
  };

  // Handle Odontogram click
  const handleToothClick = async (toothNumber: number) => {
    setSelectedTooth(toothNumber);
    const existing = odontogram[toothNumber] || {
      toothNumber,
      surfaces: {},
    };
    const nextCondition = existing.wholeToothCondition === selectedCondition ? 'healthy' : selectedCondition;
    const nextOdo: OdontogramData = {
      ...odontogram,
      [toothNumber]: {
        ...existing,
        wholeToothCondition: nextCondition,
        lastUpdated: new Date().toISOString(),
      },
    };

    const respuesta = await api.saveOdontogram(patient.id,nextOdo);


      const odo:any = await api.getOdontogram(patient.id);
      console.log("odo",odo.data)
      onSaveOdontogram(patient.id,odo.data);

    //onChange(odo.data ?? odo.data);

  };

  // Handle Add Evolution Note
  const handleAddEvolutionNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvolutionWork.trim()) return;

    const total = Number(newEvolutionTotal) || 0;
    const paid = Number(newEvolutionPaid) || 0;
    const balance = Math.max(0, total - paid);

    const note: ClinicalNote = {
      id: `cn-${Date.now()}`,
      patientId: patient.id,
      date: newEvolutionDate,
      doctorName: newEvolutionDoctor,
      procedureDone: newEvolutionWork,
      toothPiece: newEvolutionPiece || 'N/A',
      evolutionNotes: newEvolutionWork,
      prescriptions: [],
      nextAction: 'Seguimiento según plan.',
      amountPaid: paid,
      totalCost: total,
      balanceDue: balance,
      signatureSigned: true,
      signedBy: `${formData.firstName} ${formData.lastName} / ${newEvolutionDoctor}`,
    };

    onSaveClinicalNote(note);
    setNewEvolutionWork('');
    setNewEvolutionPiece('');
    setNewEvolutionTotal(0);
    setNewEvolutionPaid(0);
  };

  // Color helper for odontogram condition
  const getConditionColor = (cond?: ToothCondition) => {
    switch (cond) {
      case 'caries':
        return 'bg-rose-500 text-white border-rose-600';
      case 'restored':
        return 'bg-sky-500 text-white border-sky-600';
      case 'endodontics':
        return 'bg-purple-600 text-white border-purple-700';
      case 'crown':
        return 'bg-amber-500 text-white border-amber-600';
      case 'extraction_needed':
        return 'bg-red-700 text-white border-red-800 line-through';
      case 'absent':
        return 'bg-slate-300 text-slate-500 border-slate-400 opacity-60';
      case 'implant':
        return 'bg-emerald-600 text-white border-emerald-700';
      case 'orthodontics':
        return 'bg-indigo-500 text-white border-indigo-600';
      default:
        return 'bg-white text-slate-700 border-slate-300 hover:border-sky-400';
    }
  };

  // Tooth rows in FDI standard (Permanent + Temporary)
  const upperPermanentRight = [18, 17, 16, 15, 14, 13, 12, 11];
  const upperPermanentLeft = [21, 22, 23, 24, 25, 26, 27, 28];
  const upperDeciduousRight = [55, 54, 53, 52, 51];
  const upperDeciduousLeft = [61, 62, 63, 64, 65];
  const lowerDeciduousRight = [85, 84, 83, 82, 81];
  const lowerDeciduousLeft = [71, 72, 73, 74, 75];
  const lowerPermanentRight = [48, 47, 46, 45, 44, 43, 42, 41];
  const lowerPermanentLeft = [31, 32, 33, 34, 35, 36, 37, 38];

  return (
    <div className="space-y-6">
      {/* Control Bar (Screen only) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Historia Clínica Odontológica Oficial (Formato ODONTODESA)
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                2 Páginas A4
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Formato idéntico a las fichas físicas del consultorio: Anamnesis, Odontograma, Plan de Tratamiento y Control de Evolución.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Page Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActivePage('both')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activePage === 'both' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Ambas Páginas
            </button>
            <button
              type="button"
              onClick={() => setActivePage('page1')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activePage === 'page1' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Pág 1: Anamnesis & Odontograma
            </button>
            <button
              type="button"
              onClick={() => setActivePage('page2')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activePage === 'page2' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Pág 2: Plan & Evolución
            </button>
          </div>

          <button
            type="button"
            onClick={handleSaveAll}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            {isSavedRecently ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                ¡Ficha Guardada!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Cambios
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            Imprimir Ficha Oficial
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PÁGINA 1: ODONTODESA CONSULTORIO DENTAL - ANAMNESIS & ODONTOGRAMA         */}
      {/* ========================================================================= */}
      {(activePage === 'page1' || activePage === 'both') && (
        <div
          id="odontodesa-sheet-page-1"
          className="bg-white border border-slate-300 rounded-xl p-6 sm:p-8 shadow-sm space-y-5 print:border-none print:shadow-none print:p-0 print:m-0 print:break-after-page text-slate-900 font-sans"
        >
          {/* Header Title */}
          <div className="text-center pb-3 border-b-2 border-slate-900/80 flex flex-col items-center justify-center relative">
            <div className="flex items-center justify-center gap-3">
              {/* Stylized Tooth Logo */}
              <div className="w-10 h-10 rounded-lg border-2 border-slate-900 flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2C7.5 2 4 4.5 4 8c0 3 1.5 6 3 9.5C8 20 9 22 10.5 22s2-2 2-4c0-2 .5-4 1.5-4s1.5 2 1.5 4 1 4 2 4 2.5-2 3.5-4.5c1.5-3.5 3-6.5 3-9.5 0-3.5-3.5-6-8-6z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-wider uppercase text-slate-900">
                  {clinicSettings.clinicName.includes('Odonto') ? clinicSettings.clinicName : 'ODONTODESA'}
                </h1>
                <p className="text-xs sm:text-sm font-extrabold tracking-widest text-slate-700 uppercase">
                  CONSULTORIO DENTAL
                </p>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 absolute right-0 top-0 hidden sm:block print:hidden">
              HISTORIA CLÍNICA N°: {formData.idNumber || formData.id}
            </p>
          </div>

          {/* Patient Personal Information Grid */}
          <div className="space-y-1 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-x-3 gap-y-1.5 items-center">
              <div className="sm:col-span-12 flex items-center gap-2 border-b border-dotted border-slate-400 pb-1">
                <span className="font-bold whitespace-nowrap uppercase text-[11px]">NOMBRE Y APELLIDO:</span>
                <input
                  type="text"
                  value={`${formData.firstName} ${formData.lastName}`}
                  onChange={(e) => {
                    const parts = e.target.value.split(' ');
                    setFormData({
                      ...formData,
                      firstName: parts[0] || '',
                      lastName: parts.slice(1).join(' ') || '',
                    });
                  }}
                  className="flex-1 font-semibold text-slate-900 uppercase bg-transparent outline-none px-1"
                />
              </div>

              <div className="sm:col-span-12 flex items-center gap-2 border-b border-dotted border-slate-400 pb-1">
                <span className="font-bold whitespace-nowrap uppercase text-[11px]">APODERADO:</span>
                <input
                  type="text"
                  value={formData.guardianName || ''}
                  onChange={(e) => handleUpdateField('guardianName', e.target.value)}
                  placeholder="(En caso de menores de edad o acompañante)"
                  className="flex-1 uppercase bg-transparent outline-none px-1 text-slate-800"
                />
              </div>

              <div className="sm:col-span-12 flex items-center gap-2 border-b border-dotted border-slate-400 pb-1">
                <span className="font-bold whitespace-nowrap uppercase text-[11px]">DIRECCIÓN:</span>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => handleUpdateField('address', e.target.value)}
                  className="flex-1 uppercase bg-transparent outline-none px-1 text-slate-800"
                />
              </div>

              <div className="sm:col-span-4 flex items-center gap-2 border-b border-dotted border-slate-400 pb-1">
                <span className="font-bold whitespace-nowrap uppercase text-[11px]">TELÉFONO:</span>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => handleUpdateField('phone', e.target.value)}
                  className="flex-1 font-medium bg-transparent outline-none px-1 text-slate-800"
                />
              </div>

              <div className="sm:col-span-4 flex items-center gap-2 border-b border-dotted border-slate-400 pb-1">
                <span className="font-bold whitespace-nowrap uppercase text-[11px]">EDAD:</span>
                <span className="font-semibold px-1 text-slate-900">
                  {calculateAge(formData.birthDate)}
                </span>
              </div>

              <div className="sm:col-span-4 flex items-center gap-2 border-b border-dotted border-slate-400 pb-1">
                <span className="font-bold whitespace-nowrap uppercase text-[11px]">DNI:</span>
                <input
                  type="text"
                  value={formData.idNumber || ''}
                  onChange={(e) => handleUpdateField('idNumber', e.target.value)}
                  className="flex-1 font-bold bg-transparent outline-none px-1 text-slate-900"
                />
              </div>

              <div className="sm:col-span-6 flex items-center gap-2 border-b border-dotted border-slate-400 pb-1">
                <span className="font-bold whitespace-nowrap uppercase text-[11px]">FECHA DE NACIMIENTO:</span>
                <input
                  type="date"
                  value={formData.birthDate || ''}
                  onChange={(e) => handleUpdateField('birthDate', e.target.value)}
                  className="flex-1 font-medium bg-transparent outline-none px-1 text-slate-800"
                />
              </div>

              <div className="sm:col-span-6 flex items-center gap-2 border-b border-dotted border-slate-400 pb-1">
                <span className="font-bold whitespace-nowrap uppercase text-[11px]">LUGAR DE NACIMIENTO:</span>
                <input
                  type="text"
                  value={formData.birthPlace || ''}
                  onChange={(e) => handleUpdateField('birthPlace', e.target.value)}
                  className="flex-1 uppercase bg-transparent outline-none px-1 text-slate-800"
                />
              </div>

              <div className="sm:col-span-6 flex items-center gap-2 border-b border-dotted border-slate-400 pb-1">
                <span className="font-bold whitespace-nowrap uppercase text-[11px]">OCUPACIÓN:</span>
                <input
                  type="text"
                  value={formData.occupation || ''}
                  onChange={(e) => handleUpdateField('occupation', e.target.value)}
                  className="flex-1 uppercase bg-transparent outline-none px-1 text-slate-800"
                />
              </div>

              <div className="sm:col-span-6 flex items-center gap-2 border-b border-dotted border-slate-400 pb-1">
                <span className="font-bold whitespace-nowrap uppercase text-[11px]">PROFESIONAL RESPONSABLE:</span>
                <input
                  type="text"
                  value={formData.responsibleDoctor || clinicSettings.doctors[0]?.name || ''}
                  onChange={(e) => handleUpdateField('responsibleDoctor', e.target.value)}
                  className="flex-1 font-semibold uppercase bg-transparent outline-none px-1 text-slate-900"
                />
              </div>

              <div className="sm:col-span-12 flex items-center gap-2 border-b border-dotted border-slate-400 pb-1">
                <span className="font-bold whitespace-nowrap uppercase text-[11px]">MOTIVO DE CONSULTA:</span>
                <input
                  type="text"
                  value={formData.consultationReason || ''}
                  onChange={(e) => handleUpdateField('consultationReason', e.target.value)}
                  placeholder="Describa el motivo principal de la consulta..."
                  className="flex-1 uppercase bg-transparent outline-none px-1 text-slate-800"
                />
              </div>

              <div className="sm:col-span-12 flex items-center gap-2 border-b border-dotted border-slate-400 pb-1">
                <span className="font-bold whitespace-nowrap uppercase text-[11px]">ÚLTIMA CONSULTA AL DENTISTA:</span>
                <input
                  type="text"
                  value={formData.lastDentalVisit || ''}
                  onChange={(e) => handleUpdateField('lastDentalVisit', e.target.value)}
                  placeholder="Ej. Hace 6 meses / Primera vez"
                  className="flex-1 uppercase bg-transparent outline-none px-1 text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* ANTECEDENTES (Questionnaire and checkboxes) */}
          <div className="border border-slate-800 rounded-lg p-3 space-y-3 text-xs">
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 flex items-center justify-between">
              <span>ANTECEDENTES MÉDICOS Y SISTÉMICOS</span>
              <span className="text-[10px] font-normal lowercase text-slate-500 print:hidden">(Haga clic en SI/NO para marcar)</span>
            </h3>

            {/* Questions with SI/NO buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-x-4 gap-y-2 text-[11px]">
              {/* Left Column: General Medical */}
              <div className="sm:col-span-7 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">¿ESTÁ BAJO TRATAMIENTO DE ALGUNA ENFERMEDAD?</span>
                  <div className="flex items-center gap-1 shrink-0 font-bold">
                    <button
                      type="button"
                      onClick={() => handleUpdateMedicalHistory('underTreatment', true)}
                      className={`px-2 py-0.5 rounded-sm border text-[10px] ${
                        formData.medicalHistory?.underTreatment
                          ? 'bg-slate-900 text-white font-bold border-slate-900'
                          : 'bg-white text-slate-700 border-slate-400'
                      }`}
                    >
                      SI
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateMedicalHistory('underTreatment', false)}
                      className={`px-2 py-0.5 rounded-sm border text-[10px] ${
                        formData.medicalHistory?.underTreatment === false
                          ? 'bg-slate-900 text-white font-bold border-slate-900'
                          : 'bg-white text-slate-700 border-slate-400'
                      }`}
                    >
                      NO
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">¿ES ALÉRGICO A ALGÚN MEDICAMENTO?</span>
                  <div className="flex items-center gap-1 shrink-0 font-bold">
                    <button
                      type="button"
                      onClick={() => handleUpdateMedicalHistory('isAllergicToMedication', true)}
                      className={`px-2 py-0.5 rounded-sm border text-[10px] ${
                        formData.medicalHistory?.isAllergicToMedication || (formData.medicalHistory?.allergies && formData.medicalHistory.allergies.length > 0)
                          ? 'bg-rose-700 text-white font-bold border-rose-800'
                          : 'bg-white text-slate-700 border-slate-400'
                      }`}
                    >
                      SI
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateMedicalHistory('isAllergicToMedication', false)}
                      className={`px-2 py-0.5 rounded-sm border text-[10px] ${
                        formData.medicalHistory?.isAllergicToMedication === false && (!formData.medicalHistory?.allergies || formData.medicalHistory.allergies.length === 0)
                          ? 'bg-slate-900 text-white font-bold border-slate-900'
                          : 'bg-white text-slate-700 border-slate-400'
                      }`}
                    >
                      NO
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-b border-dotted border-slate-400 pb-0.5">
                  <span className="font-medium whitespace-nowrap text-[10px] uppercase">¿QUÉ MEDICAMENTOS CONSUME HABITUALMENTE?:</span>
                  <input
                    type="text"
                    value={formData.medicalHistory?.habitualMedications || formData.medicalHistory?.currentMedications?.join(', ') || ''}
                    onChange={(e) => handleUpdateMedicalHistory('habitualMedications', e.target.value)}
                    placeholder="Ninguno / Indicar dosis"
                    className="flex-1 bg-transparent outline-none text-[11px] text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">¿PROBLEMAS CARDIACOS?</span>
                  <div className="flex items-center gap-1 shrink-0 font-bold">
                    <button
                      type="button"
                      onClick={() => handleUpdateMedicalHistory('hasCardiacProblems', true)}
                      className={`px-2 py-0.5 rounded-sm border text-[10px] ${
                        formData.medicalHistory?.hasCardiacProblems || formData.medicalHistory?.hasCardiacDisease
                          ? 'bg-slate-900 text-white font-bold border-slate-900'
                          : 'bg-white text-slate-700 border-slate-400'
                      }`}
                    >
                      SI
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateMedicalHistory('hasCardiacProblems', false)}
                      className={`px-2 py-0.5 rounded-sm border text-[10px] ${
                        formData.medicalHistory?.hasCardiacProblems === false && !formData.medicalHistory?.hasCardiacDisease
                          ? 'bg-slate-900 text-white font-bold border-slate-900'
                          : 'bg-white text-slate-700 border-slate-400'
                      }`}
                    >
                      NO
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">¿PRESIÓN SANGUÍNEA ALTA?</span>
                  <div className="flex items-center gap-1 shrink-0 font-bold">
                    <button
                      type="button"
                      onClick={() => handleUpdateMedicalHistory('hasHighBloodPressure', true)}
                      className={`px-2 py-0.5 rounded-sm border text-[10px] ${
                        formData.medicalHistory?.hasHighBloodPressure || formData.medicalHistory?.hasHypertension
                          ? 'bg-slate-900 text-white font-bold border-slate-900'
                          : 'bg-white text-slate-700 border-slate-400'
                      }`}
                    >
                      SI
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateMedicalHistory('hasHighBloodPressure', false)}
                      className={`px-2 py-0.5 rounded-sm border text-[10px] ${
                        formData.medicalHistory?.hasHighBloodPressure === false && !formData.medicalHistory?.hasHypertension
                          ? 'bg-slate-900 text-white font-bold border-slate-900'
                          : 'bg-white text-slate-700 border-slate-400'
                      }`}
                    >
                      NO
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">¿PRESIÓN SANGUÍNEA BAJA?</span>
                  <div className="flex items-center gap-1 shrink-0 font-bold">
                    <button
                      type="button"
                      onClick={() => handleUpdateMedicalHistory('hasLowBloodPressure', true)}
                      className={`px-2 py-0.5 rounded-sm border text-[10px] ${
                        formData.medicalHistory?.hasLowBloodPressure
                          ? 'bg-slate-900 text-white font-bold border-slate-900'
                          : 'bg-white text-slate-700 border-slate-400'
                      }`}
                    >
                      SI
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateMedicalHistory('hasLowBloodPressure', false)}
                      className={`px-2 py-0.5 rounded-sm border text-[10px] ${
                        formData.medicalHistory?.hasLowBloodPressure === false
                          ? 'bg-slate-900 text-white font-bold border-slate-900'
                          : 'bg-white text-slate-700 border-slate-400'
                      }`}
                    >
                      NO
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Habits and Female Patient */}
              <div className="sm:col-span-5 space-y-3 border-t sm:border-t-0 sm:border-l sm:border-slate-300 sm:pl-4 pt-2 sm:pt-0">
                {/* Habits */}
                <div className="space-y-1">
                  <span className="font-bold text-[11px] uppercase tracking-wider block">HÁBITOS</span>
                  <div className="flex items-center justify-between">
                    <span>FUMA</span>
                    <div className="flex items-center gap-1 font-bold">
                      <button
                        type="button"
                        onClick={() => handleUpdateMedicalHistory('smokes', true)}
                        className={`px-2 py-0.5 rounded-sm border text-[10px] ${
                          formData.medicalHistory?.smokes || formData.medicalHistory?.isSmoker
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-400'
                        }`}
                      >
                        SI
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateMedicalHistory('smokes', false)}
                        className={`px-2 py-0.5 rounded-sm border text-[10px] ${
                          formData.medicalHistory?.smokes === false && !formData.medicalHistory?.isSmoker
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-400'
                        }`}
                      >
                        NO
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>BEBE</span>
                    <div className="flex items-center gap-1 font-bold">
                      <button
                        type="button"
                        onClick={() => handleUpdateMedicalHistory('drinks', true)}
                        className={`px-2 py-0.5 rounded-sm border text-[10px] ${
                          formData.medicalHistory?.drinks
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-400'
                        }`}
                      >
                        SI
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateMedicalHistory('drinks', false)}
                        className={`px-2 py-0.5 rounded-sm border text-[10px] ${
                          formData.medicalHistory?.drinks === false
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-400'
                        }`}
                      >
                        NO
                      </button>
                    </div>
                  </div>
                </div>

                {/* Female Patient */}
                <div className="space-y-1 border-t border-slate-200 pt-1.5">
                  <span className="font-bold text-[11px] uppercase tracking-wider block">PACIENTE MUJER</span>
                  <div className="flex items-center justify-between">
                    <span>¿ESTÁ EMBARAZADA?</span>
                    <div className="flex items-center gap-1 font-bold">
                      <button
                        type="button"
                        onClick={() => handleUpdateMedicalHistory('isPregnant', true)}
                        className={`px-2 py-0.5 rounded-sm border text-[10px] ${
                          formData.medicalHistory?.isPregnant
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-400'
                        }`}
                      >
                        SI
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateMedicalHistory('isPregnant', false)}
                        className={`px-2 py-0.5 rounded-sm border text-[10px] ${
                          formData.medicalHistory?.isPregnant === false
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-400'
                        }`}
                      >
                        NO
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-b border-dotted border-slate-400 pb-0.5">
                    <span className="whitespace-nowrap text-[10px]">¿CUÁNTOS MESES?:</span>
                    <input
                      type="text"
                      value={formData.medicalHistory?.pregnancyMonths || ''}
                      onChange={(e) => handleUpdateMedicalHistory('pregnancyMonths', e.target.value)}
                      placeholder="N/A"
                      className="w-16 bg-transparent outline-none text-center font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pathologies Checklist Matrix (Exactly matching image grid) */}
            <div className="border-t border-slate-300 pt-2 space-y-1">
              <span className="font-bold text-[10px] uppercase text-slate-700 block">
                MARQUE LAS PATOLOGÍAS O CONDICIONES QUE PRESENTA:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 border border-slate-900 text-[10px] text-center font-bold">
                {[
                  { key: 'enfermedadesVenereas', label: 'ENFER. VENÉREAS' },
                  { key: 'fiebreReumatica', label: 'FIEBRE REUMÁTICA' },
                  { key: 'hepatitis', label: 'HEPATITIS' },
                  { key: 'ulcerasEstomago', label: 'ÚLCERAS DE ESTÓMAGO' },
                  { key: 'alteracionesNerviosas', label: 'ALTERACIONES NERVIOSAS' },
                  { key: 'sida', label: 'SIDA' },
                  { key: 'epilepsia', label: 'EPILEPSIA' },
                  { key: 'artritis', label: 'ARTRITIS' },
                  { key: 'cancer', label: 'CÁNCER' },
                  { key: 'diabetes', label: 'DIABETES' },
                  { key: 'dolorCabeza', label: 'DOLOR DE CABEZA' },
                  { key: 'sinusitis', label: 'SINUSITIS' },
                ].map((item) => {
                  const isChecked = Boolean(formData.medicalHistory?.[item.key as keyof Patient['medicalhistory']]);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleUpdateMedicalHistory(item.key as any, !isChecked)}
                      className={`p-1.5 border border-slate-900 transition-colors flex flex-col items-center justify-center min-h-[36px] ${
                        isChecked ? 'bg-slate-900 text-white' : 'bg-white text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isChecked && <span className="text-[9px] font-black tracking-widest text-emerald-400">✓ SI</span>}
                    </button>
                  );
                })}

                {/* Otros input cell */}
                <div className="col-span-2 p-1 border border-slate-900 flex items-center gap-1 bg-white text-slate-800">
                  <span className="font-bold text-[10px]">OTROS:</span>
                  <input
                    type="text"
                    value={formData.medicalHistory?.otros || ''}
                    onChange={(e) => handleUpdateMedicalHistory('otros', e.target.value)}
                    placeholder="Especifique..."
                    className="w-full text-[10px] bg-transparent outline-none font-normal"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ODONTOGRAMA (FDI Anatomical Dental Chart matching Image 2) */}
          <div className="border border-slate-800 rounded-lg p-3 space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 pb-1.5">
              <h2 className="text-sm font-black tracking-wider uppercase text-slate-900">
                ODONTOGRAMA
              </h2>

              {/* Condition Selector for rapid marking (Screen only) */}
              <div className="flex flex-wrap items-center gap-1 text-[10px] print:hidden">
                <span className="font-bold text-slate-600">Herramienta:</span>
                {[
                  { value: 'caries', label: 'Caries (Rojo)', color: 'bg-rose-500 text-white' },
                  { value: 'restored', label: 'Obturado (Azul)', color: 'bg-sky-500 text-white' },
                  { value: 'endodontics', label: 'Endodoncia', color: 'bg-purple-600 text-white' },
                  { value: 'crown', label: 'Corona', color: 'bg-amber-500 text-white' },
                  { value: 'extraction_needed', label: 'Extracción', color: 'bg-red-700 text-white' },
                  { value: 'absent', label: 'Ausente', color: 'bg-slate-300 text-slate-700' },
                  { value: 'implant', label: 'Implante', color: 'bg-emerald-600 text-white' },
                ].map((cond) => (
                  <button
                    key={cond.value}
                    type="button"
                    onClick={() => setSelectedCondition(cond.value as ToothCondition)}
                    className={`px-2 py-0.5 rounded-sm font-bold border transition-all ${
                      selectedCondition === cond.value ? 'ring-2 ring-slate-900 shadow-xs' : 'opacity-80'
                    } ${cond.color}`}
                  >
                    {cond.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Diagnostic Boxes Top */}
            <div className="space-y-1">
              <div className="grid grid-cols-16 gap-0.5 max-w-2xl mx-auto text-center text-[9px] font-mono font-bold">
                {[...upperPermanentRight, ...upperPermanentLeft].map((tooth) => (
                  <div key={`diag-top-${tooth}`} className="border border-slate-400 h-5 flex items-center justify-center bg-slate-50 text-slate-800">
                    {odontogram[tooth]?.wholeToothCondition ? odontogram[tooth]?.wholeToothCondition?.[0].toUpperCase() : ''}
                  </div>
                ))}
              </div>

              {/* Numbers Upper Permanent */}
              <div className="grid grid-cols-16 gap-0.5 max-w-2xl mx-auto text-center text-[10px] font-bold text-slate-700 border-b border-slate-300 pb-0.5">
                {[...upperPermanentRight, ...upperPermanentLeft].map((tooth) => (
                  <div key={`num-up-perm-${tooth}`}>{tooth}</div>
                ))}
              </div>

              {/* Upper Permanent Teeth Graphics */}
              <div className="grid grid-cols-16 gap-0.5 max-w-2xl mx-auto py-1">
                {[...upperPermanentRight, ...upperPermanentLeft].map((tooth) => {
                  const cond = odontogram[tooth]?.wholeToothCondition;
                  return (
                    <button
                      key={`tooth-up-perm-${tooth}`}
                      type="button"
                      onClick={() => handleToothClick(tooth)}
                      className={`h-9 border rounded-sm flex flex-col items-center justify-center transition-transform hover:scale-105 ${getConditionColor(
                        cond
                      )}`}
                      title={`Pieza ${tooth}: ${cond || 'Sana'}`}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="1" />
                      </svg>
                    </button>
                  );
                })}
              </div>

              {/* Upper Deciduous (Temporary) */}
              <div className="grid grid-cols-16 gap-0.5 max-w-2xl mx-auto text-center text-[9px] font-bold text-slate-600 pt-1">
                <div className="col-span-3"></div>
                {[...upperDeciduousRight, ...upperDeciduousLeft].map((tooth) => (
                  <div key={`num-up-dec-${tooth}`}>{tooth}</div>
                ))}
                <div className="col-span-3"></div>
              </div>

              <div className="grid grid-cols-16 gap-0.5 max-w-2xl mx-auto pb-1 border-b border-dashed border-slate-300">
                <div className="col-span-3"></div>
                {[...upperDeciduousRight, ...upperDeciduousLeft].map((tooth) => {
                  const cond = odontogram[tooth]?.wholeToothCondition;
                  return (
                    <button
                      key={`tooth-up-dec-${tooth}`}
                      type="button"
                      onClick={() => handleToothClick(tooth)}
                      className={`h-7 border rounded-sm flex items-center justify-center ${getConditionColor(
                        cond
                      )}`}
                    >
                      <span className="text-[9px] font-bold">{tooth}</span>
                    </button>
                  );
                })}
                <div className="col-span-3"></div>
              </div>

              {/* Lower Deciduous (Temporary) */}
              <div className="grid grid-cols-16 gap-0.5 max-w-2xl mx-auto pt-1">
                <div className="col-span-3"></div>
                {[...lowerDeciduousRight, ...lowerDeciduousLeft].map((tooth) => {
                  const cond = odontogram[tooth]?.wholeToothCondition;
                  return (
                    <button
                      key={`tooth-low-dec-${tooth}`}
                      type="button"
                      onClick={() => handleToothClick(tooth)}
                      className={`h-7 border rounded-sm flex items-center justify-center ${getConditionColor(
                        cond
                      )}`}
                    >
                      <span className="text-[9px] font-bold">{tooth}</span>
                    </button>
                  );
                })}
                <div className="col-span-3"></div>
              </div>

              <div className="grid grid-cols-16 gap-0.5 max-w-2xl mx-auto text-center text-[9px] font-bold text-slate-600 border-b border-slate-300 pb-0.5">
                <div className="col-span-3"></div>
                {[...lowerDeciduousRight, ...lowerDeciduousLeft].map((tooth) => (
                  <div key={`num-low-dec-${tooth}`}>{tooth}</div>
                ))}
                <div className="col-span-3"></div>
              </div>

              {/* Lower Permanent Teeth Graphics */}
              <div className="grid grid-cols-16 gap-0.5 max-w-2xl mx-auto py-1">
                {[...lowerPermanentRight, ...lowerPermanentLeft].map((tooth) => {
                  const cond = odontogram[tooth]?.wholeToothCondition;
                  return (
                    <button
                      key={`tooth-low-perm-${tooth}`}
                      type="button"
                      onClick={() => handleToothClick(tooth)}
                      className={`h-9 border rounded-sm flex flex-col items-center justify-center transition-transform hover:scale-105 ${getConditionColor(
                        cond
                      )}`}
                      title={`Pieza ${tooth}: ${cond || 'Sana'}`}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="1" />
                      </svg>
                    </button>
                  );
                })}
              </div>

              {/* Numbers Lower Permanent */}
              <div className="grid grid-cols-16 gap-0.5 max-w-2xl mx-auto text-center text-[10px] font-bold text-slate-700">
                {[...lowerPermanentRight, ...lowerPermanentLeft].map((tooth) => (
                  <div key={`num-low-perm-${tooth}`}>{tooth}</div>
                ))}
              </div>

              {/* Diagnostic Boxes Bottom */}
              <div className="grid grid-cols-16 gap-0.5 max-w-2xl mx-auto text-center text-[9px] font-mono font-bold pt-0.5">
                {[...lowerPermanentRight, ...lowerPermanentLeft].map((tooth) => (
                  <div key={`diag-bot-${tooth}`} className="border border-slate-400 h-5 flex items-center justify-center bg-slate-50 text-slate-800">
                    {odontogram[tooth]?.wholeToothCondition ? odontogram[tooth]?.wholeToothCondition?.[0].toUpperCase() : ''}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* OBSERVACIONES Y CONSENTIMIENTO INFORMADO */}
          <div className="space-y-3 text-xs pt-2">
            {/* Observations text */}
            <div className="border-b border-slate-400 pb-2">
              <span className="font-black text-xs uppercase text-slate-900 block mb-1">
                OBSERVACIONES:
              </span>
              <textarea
                rows={2}
                value={formData.observations || ''}
                onChange={(e) => handleUpdateField('observations', e.target.value)}
                placeholder="Observaciones clínicas adicionales, recomendaciones o indicaciones de higiene..."
                className="w-full bg-slate-50/50 p-2 border border-slate-300 rounded-md outline-none text-xs text-slate-800 print:bg-transparent print:border-none print:p-0"
              />
            </div>

            {/* Consent Informado Box */}
            <div className="border border-slate-800 rounded-lg p-3 bg-slate-50/40 text-slate-900 space-y-3">
              <p className="text-[11px] leading-relaxed font-serif uppercase tracking-tight text-justify font-bold">
                YO <span className="border-b border-slate-900 px-2 font-black text-slate-950">{formData.firstName} {formData.lastName}</span> CON DNI <span className="border-b border-slate-900 px-2 font-black text-slate-950">{formData.idNumber || '_____________'}</span> ESTOY DE ACUERDO CON EL TRATAMIENTO A REALIZARSE Y DOY EL CONSENTIMIENTO PARA LOS TRATAMIENTOS CON LOS COSTOS ACORDADOS CON EL DOCTOR.
              </p>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-[11px]">
                <div className="space-y-1">
                  <div className="border-t border-slate-900 pt-1 font-bold">
                    {formData.patientSignature ? (
                      <span className="font-serif italic text-sky-900 block text-xs">
                        {formData.patientSignature}
                      </span>
                    ) : (
                      <input
                        type="text"
                        placeholder="Firma / Nombre de conformidad"
                        value={formData.patientSignature || ''}
                        onChange={(e) => handleUpdateField('patientSignature', e.target.value)}
                        className="w-full text-center text-xs bg-transparent border-b border-dashed border-slate-400 outline-none"
                      />
                    )}
                    <span className="uppercase text-[10px] block text-slate-800">
                      FIRMA DEL PACIENTE O APODERADO
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="border-t border-slate-900 pt-1 font-bold">
                    {formData.doctorSignature ? (
                      <span className="font-serif italic text-indigo-900 block text-xs">
                        {formData.doctorSignature}
                      </span>
                    ) : (
                      <input
                        type="text"
                        placeholder="Sello y firma del doctor"
                        value={formData.doctorSignature || `${formData.responsibleDoctor || clinicSettings.doctors[0]?.name} - C.O.P.`}
                        onChange={(e) => handleUpdateField('doctorSignature', e.target.value)}
                        className="w-full text-center text-xs bg-transparent border-b border-dashed border-slate-400 outline-none"
                      />
                    )}
                    <span className="uppercase text-[10px] block text-slate-800">
                      FIRMA DEL DOCTOR
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PÁGINA 2: PLAN DE TRATAMIENTO & EVOLUCIÓN CLÍNICA (CONTROL DE PAGOS)     */}
      {/* ========================================================================= */}
      {(activePage === 'page2' || activePage === 'both') && (
        <div
          id="odontodesa-sheet-page-2"
          className="bg-white border border-slate-300 rounded-xl p-6 sm:p-8 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0 print:m-0 text-slate-900 font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b-2 border-slate-900">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900">
              PLAN DE TRATAMIENTO & EVOLUCIÓN CLÍNICA
            </h2>
            <span className="text-xs font-bold text-slate-700">
              PACIENTE: {formData.firstName} {formData.lastName}
            </span>
          </div>

          {/* SECTION 1: PLAN DE TRATAMIENTO TABLE (Official 21 Rows from Image 1) */}
          <div className="space-y-1">
            <div className="overflow-x-auto border border-slate-900 rounded-sm">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 border-b border-slate-900 text-[11px] font-black uppercase text-center">
                    <th className="p-1.5 border-r border-slate-900 w-10">N°</th>
                    <th className="p-1.5 border-r border-slate-900 text-left">PLAN DE TRATAMIENTO</th>
                    <th className="p-1.5 border-r border-slate-900 w-24">CADA UNO</th>
                    <th className="p-1.5 border-r border-slate-900 w-24">TOTAL</th>
                    <th className="p-1.5 text-left w-52">MODIFICACIONES / PIEZAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 text-[11px]">
                  {treatmentRows.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-1 text-center font-bold border-r border-slate-900 bg-slate-50/50">
                        {row.itemNumber}
                      </td>
                      <td className="p-1 border-r border-slate-900 font-medium text-slate-900">
                        {row.name}
                        {row.isOrthodontics && (
                          <div className="flex items-center gap-4 text-[10px] text-slate-600 mt-0.5">
                            <span>Inicial: {clinicSettings.currencySymbol} {row.orthoInitial || 0}</span>
                            <span>Mensualidad: {clinicSettings.currencySymbol} {row.orthoMonthly || 0}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-1 text-center border-r border-slate-900">
                        <input
                          type="number"
                          value={row.unitPrice ?? 0}
                          onChange={(e) => handleTreatmentRowChange(idx, 'unitPrice', e.target.value)}
                          className="w-16 text-center font-mono bg-transparent outline-none"
                        />
                      </td>
                      <td className="p-1 text-center border-r border-slate-900 font-bold">
                        <input
                          type="number"
                          value={row.totalPrice ?? 0}
                          onChange={(e) => handleTreatmentRowChange(idx, 'totalPrice', e.target.value)}
                          placeholder="0"
                          className="w-16 text-center font-mono font-bold bg-transparent outline-none"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={row.modifications || ''}
                          onChange={(e) => handleTreatmentRowChange(idx, 'modifications', e.target.value)}
                          placeholder="Pieza, caras o notas..."
                          className="w-full bg-transparent outline-none text-[10px]"
                        />
                      </td>
                    </tr>
                  ))}
                  {/* TOTAL ROW */}
                  <tr className="bg-slate-100 font-black border-t-2 border-slate-900 text-xs">
                    <td colSpan={3} className="p-2 text-right uppercase tracking-wider border-r border-slate-900">
                      TOTAL PRESUPUESTO TRATAMIENTO:
                    </td>
                    <td className="p-2 text-center font-mono text-sm border-r border-slate-900 font-black text-slate-950">
                      {clinicSettings.currencySymbol} {treatmentPlanGrandTotal.toFixed(2)}
                    </td>
                    <td className="p-2 text-slate-600 text-[10px]">
                      Costos pactados con el doctor tratante
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 2: CONTROL DE EVOLUCIÓN CLÍNICA Y PAGOS (Table from Image 1 bottom) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                CONTROL DE TRABAJOS EFECTUADOS, ENTREGAS Y SALDOS
              </h3>
              <span className="text-[10px] text-slate-500 print:hidden">
                Registro cronológico de evoluciones y cuenta corriente
              </span>
            </div>

            {/* Evolution Table */}
            <div className="overflow-x-auto border border-slate-900 rounded-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 border-b border-slate-900 text-[11px] font-black uppercase text-center">
                    <th className="p-1.5 border-r border-slate-900 w-24">FECHA</th>
                    <th className="p-1.5 border-r border-slate-900 w-16">PIEZA</th>
                    <th className="p-1.5 border-r border-slate-900 text-left">TRABAJO EFECTUADO</th>
                    <th className="p-1.5 border-r border-slate-900 w-20">ENTREGA</th>
                    <th className="p-1.5 border-r border-slate-900 w-20">SALDO</th>
                    <th className="p-1.5 border-r border-slate-900 w-20">TOTAL</th>
                    <th className="p-1.5 w-28">FIRMA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 text-[11px]">
                  {clinicalNotes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-slate-400 italic">
                        No hay evoluciones clínicas registradas aún. Agregue una fila abajo.
                      </td>
                    </tr>
                  ) : (
                    clinicalNotes.map((note) => (
                      <tr key={note.id} className="hover:bg-slate-50">
                        <td className="p-1.5 text-center font-mono border-r border-slate-900 text-slate-800">
                          {note.date.split(' ')[0]}
                        </td>
                        <td className="p-1.5 text-center font-bold border-r border-slate-900 text-slate-900">
                          {note.toothPiece || (note.teethInvolved && note.teethInvolved.length > 0 ? note.teethInvolved.join(', ') : '-')}
                        </td>
                        <td className="p-1.5 border-r border-slate-900 text-slate-900 font-medium">
                          {note.procedureDone || note.evolutionNotes}
                        </td>
                        <td className="p-1.5 text-center font-mono font-bold text-emerald-700 border-r border-slate-900">
                          {note.amountPaid !== undefined ? `${clinicSettings.currencySymbol} ${note.amountPaid}` : '-'}
                        </td>
                        <td className="p-1.5 text-center font-mono font-bold text-rose-700 border-r border-slate-900">
                          {note.balanceDue !== undefined ? `${clinicSettings.currencySymbol} ${note.balanceDue}` : '-'}
                        </td>
                        <td className="p-1.5 text-center font-mono font-bold text-slate-900 border-r border-slate-900">
                          {note.totalCost !== undefined ? `${clinicSettings.currencySymbol} ${note.totalCost}` : '-'}
                        </td>
                        <td className="p-1.5 text-center font-serif italic text-[10px] text-slate-700">
                          {note.signedBy || 'Conforme'}
                        </td>
                      </tr>
                    ))
                  )}

                  {/* Empty template rows for printing when table has few entries */}
                  {Array.from({ length: Math.max(0, 6 - clinicalNotes.length) }).map((_, i) => (
                    <tr key={`empty-row-${i}`} className="h-7 border-b border-slate-200">
                      <td className="border-r border-slate-900"></td>
                      <td className="border-r border-slate-900"></td>
                      <td className="border-r border-slate-900"></td>
                      <td className="border-r border-slate-900"></td>
                      <td className="border-r border-slate-900"></td>
                      <td className="border-r border-slate-900"></td>
                      <td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quick Add Evolution Row Form (Screen only) */}
            <form
              onSubmit={handleAddEvolutionNote}
              className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 print:hidden"
            >
              <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-sky-600" />
                Registrar Nueva Evolución Clínica y Abono / Pago:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">FECHA:</label>
                  <input
                    type="date"
                    value={newEvolutionDate}
                    onChange={(e) => setNewEvolutionDate(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">PIEZA:</label>
                  <input
                    type="text"
                    value={newEvolutionPiece}
                    onChange={(e) => setNewEvolutionPiece(e.target.value)}
                    placeholder="Ej. 16, 21, Todas"
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">TRABAJO EFECTUADO:</label>
                  <input
                    type="text"
                    value={newEvolutionWork}
                    onChange={(e) => setNewEvolutionWork(e.target.value)}
                    placeholder="Procedimiento / Técnica realizada..."
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">TOTAL:</label>
                  <input
                    type="number"
                    value={newEvolutionTotal}
                    onChange={(e) => setNewEvolutionTotal(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md font-mono"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">ENTREGA:</label>
                  <input
                    type="number"
                    value={newEvolutionPaid}
                    onChange={(e) => setNewEvolutionPaid(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md font-mono"
                  />
                </div>

                <div className="sm:col-span-2 flex items-end">
                  <button
                    type="submit"
                    className="w-full px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-md text-xs shadow-xs"
                  >
                    + Agregar Fila
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
