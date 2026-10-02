import React, { useState, useEffect } from 'react';
import {
  Patient,
  OdontogramData,
  ToothState,
  TreatmentPlan,
  ClinicalNote,
  TreatmentItem,
  ToothCondition,
  Invoice,
  Appointment,
  ClinicSettings,
  ProcedureCatalogItem,
  AppUser,
  DentalDoctor,
} from '../types';
import {initialPatients}  from '../data/mockData';
import {useNavigate} from "react-router-dom";
import { Odontogram } from './Odontogram';
import { OfficialDentalHistoryCard } from './OfficialDentalHistoryCard';
import {
  Search,
  Plus,
  User,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  FileText,
  Clock,
  DollarSign,
  HeartPulse,
  Sparkles,
  ChevronRight,
  Edit2,
  Trash2,
  Printer,
  CheckCircle,
  Stethoscope,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api';

interface PatientsModuleProps {
  patients: Patient[];
  odontograms?: Record<string, OdontogramData>;
  treatmentPlans?: TreatmentPlan[];
  clinicalNotes?: ClinicalNote[];
  invoices?: Invoice[];
  appointments?: Appointment[];
  clinicSettings: ClinicSettings;
  procedureCatalog: ProcedureCatalogItem[];
  selectedPatientIdProp?: string | null;
  currentUser?: AppUser;
  onSavePatient: (patient: Patient) => void;
  onDeletePatient: (patientId: string) => void;
  onSaveOdontogram?: (patientId: string, odontogram: OdontogramData) => void;
  onSaveTreatmentPlan?: (plan: TreatmentPlan) => void;
  onSaveClinicalNote?: (note: ClinicalNote) => void;
  onCreateInvoiceFromPlan?: (plan: TreatmentPlan, items: TreatmentItem[]) => void;
  onScheduleAppointment?: (patientId: string) => void;
  onCreateInvoice?: (patientId: string) => void;
}


export const PatientsModule: React.FC<PatientsModuleProps> = ({
 treatmentPlans = [],
  clinicalNotes = [],
  invoices = [],
  appointments = [],
  clinicSettings,
  procedureCatalog = [],
  selectedPatientIdProp,
  currentUser,
  onSavePatient,
  onDeletePatient,
  onSaveOdontogram,
  onSaveTreatmentPlan,
  onSaveClinicalNote,
  onCreateInvoiceFromPlan,
  onScheduleAppointment,
  onCreateInvoice,
}) => {
 const [searchTerm, setSearchTerm] = useState('');
 const [doctors, setDoctors] = useState<DentalDoctor[]>({});
 const [odontogram, setOdontogram] = useState<OdontogramData>({});
 const [patients, setPatients] = useState<Patient[]>(initialPatients);

 const loadPatients = async () => {
  try {
    const saved = await api.getPatients();
    setPatients(saved);
  } catch (error) {
    console.error("Error cargando pacientes:", error);
  }
};

useEffect(() => {
  loadPatients();
}, []);


  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const data = await api.getDoctors();

        console.log("Doctores:", data);
        setDoctors(data);
      } catch (error) {
        console.error("Error cargando doctores:", error);
        setDoctors([]);
      }
    };

    loadDoctors();
  }, []);

 /* const [selectedPatientId, setSelectedPatientId] = useState<string | null>(

    selectedPatientIdProp || patients[0]?.id || null
  );*/

  useEffect(() => {
    if (selectedPatientIdProp) {
      setSelectedPatientId(selectedPatientIdProp);

    }
  }, [selectedPatientIdProp]);
  const [selectedPatientId, setSelectedPatientId] = useState<Patient[]>(selectedPatientIdProp);
  const clickPaciente =  async (id:string)=>{
    // setSelectedPatientId(id) ;
     console.log("paciente seleccionado",id);
      try {
        const saved = await api.getPatientById(id);
        console.log("carga paciente",saved);
        setSelectedPatientId(saved.id)
      } catch (error) {
        console.error("Error cargando paciente:", error);

      }
       try {
       const odo:any = await api.getOdontogram(id);
     // 3. Guardarlo en el estado
      setOdontogram(odo.data);
    } catch (error) {
      console.error("Error cargando paciente/odontograma:", error);
      // Evita mostrar información anterior
      //setOdontogram({});
    }

    };


  const [activeTab, setActiveTab] = useState<
    'history' | 'odontogram' | 'treatments' | 'notes' | 'invoices' | 'appointments'
  >('history');

  // Modals
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Partial<Patient> | null>(null);

  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState('Nuevo Plan de Tratamiento');

  const [selectedDoctorForPlan, setSelectedDoctorForPlan] = useState(
     ''
  );
  const [planItems, setPlanItems] = useState<Partial<TreatmentItem>[]>([]);

  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [newNoteProcedure, setNewNoteProcedure] = useState('');
  const [newNoteEvolution, setNewNoteEvolution] = useState('');
  const [newNotePrescription, setNewNotePrescription] = useState('');
  const [newNoteDoctor, setNewNoteDoctor] = useState(''
   // clinicSettings.doctors[0]?.name || ''
  );

  // AI Assistant Modal / State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResultText, setAiResultText] = useState<string | null>(null);
  const [aiActionType, setAiActionType] = useState<'clinical_note' | 'explain_treatment' | 'post_op_care' | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);

  const selectedPatient = (patients || []).find((p) => p.id === selectedPatientId) || null;
  const currentOdontogram = odontogram;

/*  const currentOdontogramOF = (selectedPatientId && odontograms)
    ? odontograms[selectedPatientId] || {}
    : {};
*/
  const patientTreatmentPlans = (treatmentPlans || []).filter(
    (tp) => tp.patientId === selectedPatientId
  );
  const patientNotes = (clinicalNotes || []).filter(
    (cn) => cn.patientId === selectedPatientId
  );
  const patientInvoices = (invoices || []).filter(
    (inv) => inv.patientId === selectedPatientId
  );
  const patientAppointments = (appointments || []).filter(
    (apt) => apt.patientId === selectedPatientId
  );

  const filteredPatients = patients.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.firstName.toLowerCase().includes(term) ||
      p.lastName.toLowerCase().includes(term) ||
      p.idNumber.toLowerCase().includes(term) ||
      p.phone.includes(term) ||
      p.email.toLowerCase().includes(term)
    );
  });

  const handleOpenNewPatient = () => {
    setEditingPatient({
      firstName: '',
      lastName: '',
      idNumber: '',
      email: '',
      phone: '',
      birthDate: '1995-01-01',
      gender: 'female',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      bloodType: 'O+',
      registeredAt: new Date().toISOString().split('T')[0],
      avatarColor: 'bg-sky-500',
      allergies: '',
      medicalhistory: {
        hasDiabetes: false,
        hasHypertension: false,
        hasBleedingDisorders: false,
        hasCardiacDisease: false,
        isPregnant: false,
        isSmoker: false,
        currentMedications: [],
        generalNotes: '',
      },
    });
    setShowPatientModal(true);
  };

  const handleOpenEditPatient = (patient: Patient) => {
    setEditingPatient(JSON.parse(JSON.stringify(patient)));
    setShowPatientModal(true);
  };


  const handleSavePatientForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient?.firstName || !editingPatient?.lastName) return;

    const patientToSave: Patient = {
      id: editingPatient.id || `pat-${Date.now()}`,
      idNumber: editingPatient.idNumber || '',
      firstName: editingPatient.firstName,
      lastName: editingPatient.lastName,
      email: editingPatient.email || '',
      phone: editingPatient.phone || '',
      birthDate: editingPatient.birthDate || '1990-01-01',
      gender: editingPatient.gender || 'other',
      address: editingPatient.address || '',
      occupation: editingPatient.occupation || '',
      guardianName: editingPatient.guardianName || '',
      birthPlace: editingPatient.birthPlace || '',
      responsibleDoctor: editingPatient.responsibleDoctor || '',
      consultationReason: editingPatient.consultationReason || '',
      lastDentalVisit: editingPatient.lastDentalVisit || '',
      observations: editingPatient.observations || '',
      consentAccepted: editingPatient.consentAccepted ?? true,
      consentDate: editingPatient.consentDate || new Date().toISOString().split('T')[0],
      patientSignature: editingPatient.patientSignature || '',
      doctorSignature: editingPatient.doctorSignature || '',
      officialTreatmentPlan: editingPatient.officialTreatmentPlan,
      emergencyContactName: editingPatient.emergencyContactName || '',
      emergencyContactPhone: editingPatient.emergencyContactPhone || '',
      bloodType: editingPatient.bloodType || 'O+',
      registeredAt: editingPatient.registeredAt || new Date().toISOString().split('T')[0],
      avatarColor: editingPatient.avatarColor || 'bg-sky-600',
      notes: editingPatient.notes || '',
      allergies:editingPatient.allergies,
      medicalhistory: editingPatient.medicalhistory || {
        hasDiabetes: false,
        hasHypertension: false,
        hasBleedingDisorders: false,
        hasCardiacDisease: false,
        isPregnant: false,
        isSmoker: false,
        currentMedications: [],
        generalNotes: '',
      }
    };

  const respuesta = await api.savePatient(patientToSave);
  onSavePatient(respuesta);
  onSavePatient(patientToSave);
   await loadPatients();
  setShowPatientModal(false);

  };

  // Add treatment item shortcut directly from tooth selection in odontogram
  const handleAddTreatmentFromTooth = (toothNumber: number, condition: ToothCondition) => {
    let proc = procedureCatalog.find((p) => p.category.includes('Restauración'));
    if (condition === 'endodontics') {
      proc = procedureCatalog.find((p) => p.category.includes('Endodoncia'));
    } else if (condition === 'crown') {
      proc = procedureCatalog.find((p) => p.category.includes('Prótesis'));
    } else if (condition === 'implant') {
      proc = procedureCatalog.find((p) => p.name.includes('Implante'));
    }

    const item: TreatmentItem = {
      id: `tpi-${Date.now()}`,
      procedureId: proc?.id || 'proc-custom',
      procedureName: `${proc?.name || 'Tratamiento'} (Pieza ${toothNumber})`,
      category: proc?.category || 'General',
      toothNumber,
      unitCost: proc?.defaultPrice || 70,
      discount: 0,
      finalCost: proc?.defaultPrice || 70,
      status: 'pending',
      doctorName: clinicSettings.doctors[0]?.name || 'Dr. Especialista',
    };

    // If patient already has an in_progress or accepted plan, add to it. Otherwise create one.
    const activePlan = patientTreatmentPlans.find(
      (p) => p.status === 'in_progress' || p.status === 'accepted' || p.status === 'presented'
    );

    if (activePlan) {
      const updatedItems = [...activePlan.items, item];
      const updatedTotal = updatedItems.reduce((acc, curr) => acc + curr.finalCost, 0);
      onSaveTreatmentPlan({
        ...activePlan,
        items: updatedItems,
        totalCost: updatedTotal,
      });
      setActiveTab('treatments');
    } else if (selectedPatientId) {
      const newPlan: TreatmentPlan = {
        id: `tp-${Date.now()}`,
        patientId: selectedPatientId,
        title: `Plan Dental Integral - Pieza ${toothNumber}`,
        createdAt: new Date().toISOString().split('T')[0],
        doctorName: clinicSettings.doctors[0]?.name || 'Dr. Especialista',
        status: 'presented',
        items: [item],
        totalCost: item.finalCost,
        totalPaid: 0,
      };
      onSaveTreatmentPlan(newPlan);
      setActiveTab('treatments');
    }
  };

  // Call server-side Gemini AI clinical assistant
  const handleCallAiAssistant = async (action: 'clinical_note' | 'explain_treatment' | 'post_op_care') => {
    if (!selectedPatient) return;
    setAiLoading(true);
    setAiActionType(action);
    setShowAiModal(true);

    try {
      const response = await fetch('/api/gemini/clinical-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          patientInfo: {
            name: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
            age: selectedPatient.birthDate ? `${new Date().getFullYear() - new Date(selectedPatient.birthDate).getFullYear()} años` : '',
            allergies: selectedPatient.allergies?.join(', ') || 'Ninguna registrada',
          },
          clinicalData: {
            procedure: newNoteProcedure || 'Revisión y tratamiento odontológico',
            findings: Object.entries(currentOdontogram || {})
              .map(([num, t]) => {
                const tooth = t as ToothState;
                if (!tooth) return `Pieza ${num}: Sana`;
                const surfaceConditions = tooth.surfaces ? Object.values(tooth.surfaces).filter(Boolean).join(', ') : '';
                return `Pieza ${num}: ${tooth.wholeToothCondition || surfaceConditions || 'Sana'}`;
              })
              .join('; '),
          },
          treatmentData: {
            name: patientTreatmentPlans[0]?.title || 'Tratamiento restaurador',
            details: patientTreatmentPlans[0]?.items?.map((i) => i.procedureName).join(', ') || '',
            cost: patientTreatmentPlans[0] ? `${patientTreatmentPlans[0].totalCost} ${clinicSettings.currencySymbol}` : '',
          },
        }),
      });

      const data = await response.json();
      setAiResultText(data.text || 'Sin respuesta generada');
    } catch (error) {
      console.error('Error calling Gemini:', error);
      setAiResultText('No se pudo conectar con el Asistente IA. Verifique la conexión.');
    } finally {
      setAiLoading(false);
    }
  };

  const handlePatientUpdated = (updatedPatient: Patient) => {
    console.log("Paciente actualizado:", updatedPatient);

    // Actualizar paciente seleccionado
    setSelectedPatientId(updatedPatient);

    // Actualizar la lista local de pacientes
    setPatients((prevPatients) =>
      prevPatients.map((p) =>
        p.id === updatedPatient.id ? updatedPatient : p
      )
    );

    // Avisar al componente padre
    onSavePatient(updatedPatient);
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Gestión de Pacientes e Historiales Clínicos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ficha médica digital, odontograma interactivo FDI, notas de evolución y planes de tratamiento.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {(!currentUser || currentUser.permissions?.canEditPatients) && (
            <button
              type="button"
              id="btn-new-patient"
              onClick={handleOpenNewPatient}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo Paciente
            </button>
          )}
        </div>
      </div>

      {/* Main Layout: Patient Directory Sidebar + Patient Detail Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Patient List */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="patient-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, DNI, teléfono..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50/50"
            />
          </div>

          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1 pt-1 flex justify-between">
            <span>Directorio ({filteredPatients.length})</span>
            <span>Acción</span>
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No se encontraron pacientes
              </div>
            ) : (
              filteredPatients.map((p) => {
                const isSelected = p.id === selectedPatientId;
                const hasAllergies = p.allergies!='';
                return (
                  <div
                    key={p.id}
                    id={`patient-card-${p.id}`}
                    onClick={() => clickPaciente(p.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-sky-50/80 border-sky-300 ring-1 ring-sky-400 shadow-xs'
                        : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs`}
                      >
                        {p.firstName[0]}
                        {p.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-800 truncate">
                            {p.firstName} {p.lastName}
                          </h4>
                          {hasAllergies && (
                            <span title="Tiene alertas de salud / alergias">
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          DNI: {p.idNumber || 'S/D'} • Tel: {p.phone}
                        </p>
                      </div>
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isSelected ? 'text-sky-600 translate-x-0.5' : 'text-slate-300'
                      }`}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Workspace: Selected Patient Full Record */}
        <div className="lg:col-span-8 space-y-6">
          {selectedPatient ? (
            <>
              {/* Patient Banner & Medical Alerts */}
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-2x bg-emerald-500 text-white font-black text-xl flex items-center justify-center shadow-md`}
                    >
                      {selectedPatient.firstName[0]}
                      {selectedPatient.lastName[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">
                          {selectedPatient.firstName} {selectedPatient.lastName}
                        </h3>
                        <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium">
                          {selectedPatient.idNumber}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {selectedPatient.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {selectedPatient.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Nac: {selectedPatient.birthDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">

                    {(currentUser.role === 'admin') && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditPatient(selectedPatient)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Editar Datos
                      </button>
                    )}
                    {(!currentUser || currentUser.permissions?.canDeletePatients) && (
                      <button
                        type="button"
                        onClick={() => onDeletePatient(selectedPatient.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar Paciente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Medical History & Health Alerts Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Allergies Alert */}

                  <div
                    className={`p-3 rounded-lg border text-xs ${
                      selectedPatient.allergies !=''
                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                        : 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Alergias Conocidas:
                    </span>
                    <p className="line-clamp-2">
                      {selectedPatient.allergies  ? selectedPatient.allergies : 'Sin alergias registradas'}
                    </p>
                  </div>

                  {/* Systemic Conditions */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <span className="font-bold flex items-center gap-1.5 mb-1 text-slate-800">
                      <HeartPulse className="w-3.5 h-3.5 text-sky-600" />
                      Condiciones Sistémicas:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedPatient.medicalHistory?.hasHypertension && (
                        <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm font-semibold text-[10px]">
                          Hipertensión
                        </span>
                      )}
                      {selectedPatient.medicalhistory?.hasDiabetes && (
                        <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm font-semibold text-[10px]">
                          Diabetes
                        </span>
                      )}
                      {selectedPatient?.medicalhistory?.hasBleedingDisorders && (
                        <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-sm font-semibold text-[10px]">
                          Coagulación
                        </span>
                      )}
                      {selectedPatient.medicalhistory?.isSmoker && (
                        <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-sm text-[10px]">
                          Fumador
                        </span>
                      )}
                      {!selectedPatient?.medicalhistory?.hasHypertension &&
                        !selectedPatient?.medicalhistory?.hasDiabetes &&
                        !selectedPatient?.medicalhistory?.hasBleedingDisorders && (
                          <span className="text-slate-500">Paciente ASA I / Apto</span>
                        )}
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <span className="font-bold flex items-center gap-1.5 mb-1 text-slate-800">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      Contacto Emergencia:
                    </span>
                    <p className="font-medium truncate">
                      {selectedPatient.emergencyContactName || 'No registrado'}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      {selectedPatient.emergencyContactPhone || '-'}
                    </p>
                  </div>
                </div>

                {/* AI Assistant Quick Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gradient-to-r from-sky-50 to-indigo-50/50 border border-sky-100 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-semibold text-sky-900">
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    <span>Asistente Clínico Inteligente:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCallAiAssistant('clinical_note')}
                      className="px-2.5 py-1 text-xs bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 rounded-lg font-medium shadow-2xs flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-sky-600" />
                      Redactar Nota Clínica
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCallAiAssistant('explain_treatment')}
                      className="px-2.5 py-1 text-xs bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-medium shadow-2xs flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Explicar Plan al Paciente
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCallAiAssistant('post_op_care')}
                      className="px-2.5 py-1 text-xs bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-medium shadow-2xs flex items-center gap-1.5"
                    >
                      <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                      Guía Postoperatoria
                    </button>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs for Patient Submodules */}
              <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 gap-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'history'
                      ? 'border-sky-600 text-sky-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Historia Clínica Oficial
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                    Odontodesa (2 Pág)
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('odontogram')}
                  className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'odontogram'
                      ? 'border-sky-600 text-sky-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Odontograma FDI
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('treatments')}
                  className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'treatments'
                      ? 'border-sky-600 text-sky-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Planes de Tratamiento
                  {patientTreatmentPlans.length > 0 && (
                    <span className="bg-sky-100 text-sky-700 text-[10px] px-1.5 py-0.2 rounded-full">
                      {patientTreatmentPlans.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('notes')}
                  className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'notes'
                      ? 'border-sky-600 text-sky-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Notas de Evolución
                  {patientNotes.length > 0 && (
                    <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.2 rounded-full">
                      {patientNotes.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('invoices')}
                  className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'invoices'
                      ? 'border-sky-600 text-sky-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Facturación ({patientInvoices.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('appointments')}
                  className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'appointments'
                      ? 'border-sky-600 text-sky-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Citas ({patientAppointments.length})
                </button>
              </div>

              {/* Tab 0: Official Odontodesa Clinical History (2 Pages) */}
              {activeTab === 'history' && selectedPatient && (
                <OfficialDentalHistoryCard
                  patient={selectedPatient}
                  odontogram={currentOdontogram}
                  clinicalNotes={patientNotes}
                  clinicSettings={clinicSettings}
                  onSavePatient={handlePatientUpdated}
                  onSaveOdontogram={(patId, odo) => {
                    console.log(
                      "Actualizando odontograma en estado:",
                      odo
                    );

                    // Actualizar estado local
                    setOdontogram(odo);

                    // Mantener callback original si existe
                    if (onSaveOdontogram) {
                      onSaveOdontogram(patId, odo);
                    }
                  }}

             /*
                  onSaveClinicalNote={(note) => {
                    if (onSaveClinicalNote) onSaveClinicalNote(note);
                  }}*/
                />
              )}

              {/* Tab 1: Odontogram */}
              {activeTab === 'odontogram' && (
                <Odontogram
                  paciente={selectedPatientId}
                  odontogram={currentOdontogram}
                  readOnly={currentUser ? !currentUser.permissions.canEditOdontogram : false}
                  onChange={(newOdo) => {
                    setOdontogram(newOdo);
                  }}
                  /*onChange={(newOdo) => {
                    if (selectedPatientId) {
                      onSaveOdontogram(selectedPatientId, newOdo);
                    }
                  }}*/
                  onAddTreatmentForTooth={handleAddTreatmentFromTooth}
                />
              )}

              {/* Tab 2: Treatment Plans */}
              {activeTab === 'treatments' && (
                <div className="bg-white rounded-b-xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        Planes de Tratamiento y Presupuestos Odontológicos
                      </h3>
                      <p className="text-xs text-slate-500">
                        Presupuesto desglosado por procedimientos, estado de ejecución y facturación.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPlanItems([]);
                        setShowNewPlanModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Nuevo Plan de Tratamiento
                    </button>
                  </div>

                  {patientTreatmentPlans.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                      <p className="text-xs text-slate-500">
                        No hay planes de tratamiento registrados para este paciente.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowNewPlanModal(true)}
                        className="mt-3 text-xs text-sky-600 font-semibold hover:underline"
                      >
                        + Crear primer plan de tratamiento
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {patientTreatmentPlans.map((plan) => (
                        <div
                          key={plan.id}
                          className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs"
                        >
                          <div className="bg-slate-50/90 p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-900">
                                  {plan.title}
                                </h4>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    plan.status === 'completed'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : plan.status === 'in_progress'
                                      ? 'bg-sky-100 text-sky-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {plan.status === 'completed'
                                    ? 'Completado'
                                    : plan.status === 'in_progress'
                                    ? 'En Curso'
                                    : 'Presupuesto'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Creado el {plan.createdAt} por {plan.doctorName}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className="text-xs text-slate-500 block">Total Plan:</span>
                                <span className="text-sm font-black text-slate-900">
                                  {plan.totalCost.toFixed(2)} {clinicSettings.currencySymbol}
                                </span>
                              </div>

                              {onCreateInvoiceFromPlan && (
                                <button
                                  type="button"
                                  onClick={() => onCreateInvoiceFromPlan(plan, plan.items)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg"
                                >
                                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                                  Generar Factura
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Items Table */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-100">
                                <tr>
                                  <th className="py-2.5 px-4">Procedimiento</th>
                                  <th className="py-2.5 px-3">Pieza</th>
                                  <th className="py-2.5 px-3">Especialista</th>
                                  <th className="py-2.5 px-3">Estado</th>
                                  <th className="py-2.5 px-4 text-right">Precio</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700">
                                {plan.items.map((item) => (
                                  <tr key={item.id} className="hover:bg-slate-50/50">
                                    <td className="py-3 px-4 font-medium text-slate-800">
                                      {item.procedureName}
                                      {item.completedDate && (
                                        <span className="block text-[10px] text-emerald-600 font-normal">
                                          Realizado el {item.completedDate}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-3 px-3">
                                      {item.toothNumber ? (
                                        <span className="bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded-sm text-[11px]">
                                          #{item.toothNumber}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400">-</span>
                                      )}
                                    </td>
                                    <td className="py-3 px-3 text-slate-600">
                                      {item.doctorName}
                                    </td>
                                    <td className="py-3 px-3">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const nextStatus =
                                            item.status === 'completed'
                                              ? 'pending'
                                              : 'completed';
                                          const updatedItems = plan.items.map((i) =>
                                            i.id === item.id
                                              ? {
                                                  ...i,
                                                  status: nextStatus,
                                                  completedDate:
                                                    nextStatus === 'completed'
                                                      ? new Date().toISOString().split('T')[0]
                                                      : undefined,
                                                }
                                              : i
                                          );
                                          onSaveTreatmentPlan({
                                            ...plan,
                                            items: updatedItems,
                                          });
                                        }}
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                                          item.status === 'completed'
                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                            : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                        }`}
                                      >
                                        <CheckCircle className="w-3 h-3" />
                                        {item.status === 'completed'
                                          ? 'Realizado'
                                          : 'Pendiente'}
                                      </button>
                                    </td>
                                    <td className="py-3 px-4 text-right font-bold text-slate-800">
                                      {item.finalCost.toFixed(2)} {clinicSettings.currencySymbol}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Clinical Evolution Notes */}
              {activeTab === 'notes' && (
                <div className="bg-white rounded-b-xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        Notas de Evolución y Actos Clínicos
                      </h3>
                      <p className="text-xs text-slate-500">
                        Registro cronológico de atenciones, anestesias, técnicas empleadas y recetas emitidas.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNewNoteModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Nueva Nota de Evolución
                    </button>
                  </div>

                  {patientNotes.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                      <p className="text-xs text-slate-500">
                        No hay notas clínicas registradas aún.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowNewNoteModal(true)}
                        className="mt-3 text-xs text-sky-600 font-semibold hover:underline"
                      >
                        + Registrar primera evolución clínica
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {patientNotes.map((note) => (
                        <div
                          key={note.id}
                          className="bg-slate-50/70 border border-slate-200/90 rounded-xl p-4 sm:p-5 space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                              <h4 className="text-xs font-bold text-slate-900">
                                {note.procedureDone}
                              </h4>
                              {note.teethInvolved && note.teethInvolved.length > 0 && (
                                <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-sm">
                                  Pieza(s): {note.teethInvolved.join(', ')}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {note.date} • {note.doctorName}
                            </span>
                          </div>

                          <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                            {note.evolutionNotes}
                          </div>

                          {note.prescriptions && note.prescriptions.length > 0 && (
                            <div className="bg-white p-3 rounded-lg border border-slate-200/80 text-xs space-y-1">
                              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px]">
                                <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
                                Prescripción / Receta Farmacológica:
                              </span>
                              <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                                {note.prescriptions.map((p, idx) => (
                                  <li key={idx}>{p}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {note.nextAction && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-2">
                              <span className="font-semibold text-slate-700">
                                Próxima cita / conducta:
                              </span>
                              <span>{note.nextAction}</span>
                              {note.nextAppointmentRecommended && (
                                <span className="text-sky-600 font-medium">
                                  (Recomendada: {note.nextAppointmentRecommended})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Invoices */}
              {activeTab === 'invoices' && (
                <div className="bg-white rounded-b-xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800">
                    Historial de Facturas y Comprobantes
                  </h3>
                  {patientInvoices.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      No hay facturas emitidas a este paciente.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {patientInvoices.map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50/50"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-800">
                                {inv.invoiceNumber}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  inv.status === 'paid'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {inv.status === 'paid' ? 'Pagada' : 'Saldo Pendiente'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Emitida el {inv.issueDate} • {inv.items.length} conceptos
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-slate-900 block">
                              {inv.total.toFixed(2)} {clinicSettings.currencySymbol}
                            </span>
                            {inv.balanceDue > 0 && (
                              <span className="text-[11px] text-rose-600 font-semibold">
                                Debe: {inv.balanceDue.toFixed(2)} {clinicSettings.currencySymbol}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: Appointments */}
              {activeTab === 'appointments' && (
                <div className="bg-white rounded-b-xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800">
                    Historial de Citas del Paciente
                  </h3>
                  {patientAppointments.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      No hay citas programadas para este paciente.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {patientAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50/50"
                        >
                          <div>
                            <span className="font-bold text-xs text-slate-800 block">
                              {apt.reason}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {apt.date} • {apt.startTime} - {apt.endTime} • {apt.doctorName}
                            </span>
                          </div>
                          <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {apt.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              Seleccione un paciente de la lista o cree uno nuevo.
            </div>
          )}
        </div>
      </div>

      {/* Patient Create / Edit Modal */}
      {showPatientModal && editingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden my-8">
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {editingPatient.id ? 'Editar Ficha de Paciente' : 'Registrar Nuevo Paciente'}
                </h3>
                <p className="text-xs text-slate-400">
                  Datos de filiación, antecedentes patológicos y contacto de urgencia.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPatientModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePatientForm} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nombre(s) *</label>
                  <input
                    type="text"
                    required
                    value={editingPatient.firstName || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                    placeholder="Ej. Sofia"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={editingPatient.lastName || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
                    placeholder="Ej. Navarro Gomez"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">DNI / RUT / Cédula</label>
                  <input
                    type="text"
                    value={editingPatient.idNumber || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, idNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    placeholder="48921043X"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Teléfono Móvil</label>
                  <input
                    type="text"
                    value={editingPatient.phone || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    placeholder="+34 600 000 000"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={editingPatient.email || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    placeholder="paciente@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={editingPatient.birthDate || '1995-01-01'}
                    onChange={(e) => setEditingPatient({ ...editingPatient, birthDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Género</label>
                  <select
                    value={editingPatient.gender || 'female'}
                    onChange={(e) => setEditingPatient({ ...editingPatient, gender: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="female">Femenino</option>
                    <option value="male">Masculino</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Grupo Sanguíneo</label>
                  <select
                    value={editingPatient.bloodType || 'O+'}
                    onChange={(e) => setEditingPatient({ ...editingPatient, bloodType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Dirección de Residencia</label>
                <input
                  type="text"
                  value={editingPatient.address || ''}
                  onChange={(e) => setEditingPatient({ ...editingPatient, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  placeholder="Calle, número, piso, ciudad"
                />
              </div>

              {/* Ficha Oficial Odontodesa Specific Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 pt-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Apoderado (si aplica)</label>
                  <input
                    type="text"
                    value={editingPatient.guardianName || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, guardianName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    placeholder="Nombre del apoderado o tutor"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Lugar de Nacimiento</label>
                  <input
                    type="text"
                    value={editingPatient.birthPlace || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, birthPlace: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    placeholder="Ciudad o país de nacimiento"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Odontólogo Responsable</label>
                  <select
                  value={editingPatient.responsibleDoctor || ''}
                  onChange={(e) =>setEditingPatient({...editingPatient,responsibleDoctor: e.target.value})
        }            className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
  <option value={''}>Seleccione un Odontologo</option>
  {doctors.map((doctor) => (
    <option key={doctor.id} value={doctor.id}>
      {doctor.first_name} {doctor.last_name}
    </option>
  ))}
</select>

                  {/*<input
                    type="text"
                    value={editingPatient.responsibleDoctor || clinicSettings.doctors[0]?.name || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, responsibleDoctor: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    placeholder="Dr. / Dra. Tratante"
                  />*/}
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Última Consulta al Dentista</label>
                  <input
                    type="text"
                    value={editingPatient.lastDentalVisit || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, lastDentalVisit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    placeholder="Ej. Hace 6 meses / Primera vez"
                  />
                </div>

              </div>

              {/* Anamnesis / Medical History Section */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Antecedentes Médicos y Alergias (Anamnesis)
                </h4>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Alergias a Medicamentos / Materiales (separar con comas):
                  </label>
                  <input
               type="text"
               value={editingPatient.allergies || ''}
               onChange={(e) => setEditingPatient({ ...editingPatient, allergies: e.target.value })}
      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-rose-700 font-medium"
        placeholder="Ej. Penicilina, Látex, AINEs"
/>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPatient.medicalhistory.hasHypertension || false}
                      onChange={(e) => {
                        console.log("checkbox:", e.target.checked);
                        setEditingPatient((prev) => ({
                          ...prev,
                          medicalhistory: {
                            ...prev.medicalhistory,
                            hasHypertension: e.target.checked,
                          },
                        }));
                      }}
                    />
                    <span>Hipertensión {editingPatient?.medicalhistory?.hasDiabetes}</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPatient?.medicalhistory?.hasDiabetes || false}
                      onChange={(e) =>
                        setEditingPatient({
                          ...editingPatient,
                          medicalhistory: {
                            ...editingPatient.medicalhistory!,
                            hasDiabetes: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>Diabetes</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPatient?.medicalhistory?.hasBleedingDisorders || false}
                      onChange={(e) =>
                        setEditingPatient({
                          ...editingPatient,
                          medicalhistory: {
                            ...editingPatient.medicalhistory!,
                            hasBleedingDisorders: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>Anticoagulado</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPatient?.medicalhistory?.isSmoker || false}
                      onChange={(e) =>
                        setEditingPatient({
                          ...editingPatient,
                          medicalhistory: {
                            ...editingPatient.medicalhistory!,
                            isSmoker: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>Fumador</span>
                  </label>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Medicación habitual o notas médicas especiales:
                  </label>
                  <textarea
                    rows={2}
                    value={editingPatient.medicalhistory?.generalNotes || ''}
                    onChange={(e) =>
                      setEditingPatient({
                        ...editingPatient,
                        medicalhistory: {
                          ...editingPatient.medicalhistory!,
                          generalNotes: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    placeholder="Ej. Paciente toma Enalapril 10mg diario, fobia dental leve..."
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="border-t border-slate-200 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Contacto de Urgencia (Nombre y Parentesco)
                  </label>
                  <input
                    type="text"
                    value={editingPatient.emergencyContactName || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, emergencyContactName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    placeholder="Ej. Carmen Gomez (Madre)"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Teléfono Contacto Urgencia
                  </label>
                  <input
                    type="text"
                    value={editingPatient.emergencyContactPhone || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, emergencyContactPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    placeholder="+34 600 111 222"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPatientModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Guardar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Treatment Plan Modal */}
      {showNewPlanModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden my-8">
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Crear Plan de Tratamiento</h3>
                <p className="text-xs text-slate-400">
                  Paciente: {selectedPatient.firstName} {selectedPatient.lastName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewPlanModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Título del Plan de Tratamiento
                  </label>
                  <input
                    type="text"
                    value={newPlanTitle}
                    onChange={(e) => setNewPlanTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Odontólogo Responsable
                  </label>
                  <select
                    value={selectedDoctorForPlan}
                    onChange={(e) => setSelectedDoctorForPlan(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    {clinicSettings.doctors.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name} ({d.specialty})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add Procedure to Plan */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block">
                  Agregar Procedimiento del Catálogo:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-8">
                    <select
                      id="select-catalog-proc"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                      onChange={(e) => {
                        const proc = procedureCatalog.find((p) => p.id === e.target.value);
                        if (proc) {
                          setPlanItems([
                            ...planItems,
                            {
                              id: `tpi-${Date.now()}`,
                              procedureId: proc.id,
                              procedureName: proc.name,
                              category: proc.category,
                              unitCost: proc.defaultPrice,
                              discount: 0,
                              finalCost: proc.defaultPrice,
                              status: 'pending',
                              doctorName: selectedDoctorForPlan,
                            },
                          ]);
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        -- Seleccione un procedimiento para añadir --
                      </option>
                      {procedureCatalog.map((proc) => (
                        <option key={proc.id} value={proc.id}>
                          {proc.name} - {proc.defaultPrice} {clinicSettings.currencySymbol}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Items in new plan */}
              <div className="space-y-2">
                <span className="font-semibold text-slate-700 block">
                  Procedimientos incluidos ({planItems.length}):
                </span>
                {planItems.length === 0 ? (
                  <p className="text-slate-400 italic">No ha añadido procedimientos.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {planItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg"
                      >
                        <div className="flex-1">
                          <span className="font-semibold text-slate-800 block">
                            {item.procedureName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {item.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-900">
                            {item.finalCost} {clinicSettings.currencySymbol}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setPlanItems(planItems.filter((_, i) => i !== idx));
                            }}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="text-slate-900 font-bold text-sm">
                  Total Estimado:{' '}
                  {planItems.reduce((acc, curr) => acc + (curr.finalCost || 0), 0)}{' '}
                  {clinicSettings.currencySymbol}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewPlanModal(false)}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={planItems.length === 0}
                    onClick={() => {
                      const finalItems = planItems as TreatmentItem[];
                      const newPlan: TreatmentPlan = {
                        id: `tp-${Date.now()}`,
                        patientId: selectedPatient.id,
                        title: newPlanTitle,
                        createdAt: new Date().toISOString().split('T')[0],
                        doctorName: selectedDoctorForPlan,
                        status: 'presented',
                        items: finalItems,
                        totalCost: finalItems.reduce((acc, i) => acc + i.finalCost, 0),
                        totalPaid: 0,
                      };
                      onSaveTreatmentPlan(newPlan);
                      setShowNewPlanModal(false);
                    }}
                    className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg disabled:opacity-50"
                  >
                    Crear Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Evolution Note Modal */}
      {showNewNoteModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl overflow-hidden my-8">
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Registrar Nota de Evolución</h3>
                <p className="text-xs text-slate-400">
                  Paciente: {selectedPatient.firstName} {selectedPatient.lastName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewNoteModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Procedimiento / Acto Clínico Realizado
                </label>
                <input
                  type="text"
                  value={newNoteProcedure}
                  onChange={(e) => setNewNoteProcedure(e.target.value)}
                  placeholder="Ej. Obturación de resina compuesta en pieza 16 oclusal..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Detalle de la Evolución Clínica y Técnica Empleada
                </label>
                <textarea
                  rows={4}
                  value={newNoteEvolution}
                  onChange={(e) => setNewNoteEvolution(e.target.value)}
                  placeholder="Describa anestesia aplicada, aislamiento, técnica de fresado, grabado, materiales empleados y respuesta del paciente..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Prescripciones / Recetas Médicas
                </label>
                <input
                  type="text"
                  value={newNotePrescription}
                  onChange={(e) => setNewNotePrescription(e.target.value)}
                  placeholder="Ej. Ibuprofeno 600mg cada 8 horas por 3 días si hay dolor."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Odontólogo que Atendió
                </label>
                <select
                  value={newNoteDoctor}
                  onChange={(e) => setNewNoteDoctor(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  {clinicSettings.doctors.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewNoteModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!newNoteProcedure}
                  onClick={() => {
                    const newNote: ClinicalNote = {
                      id: `cn-${Date.now()}`,
                      patientId: selectedPatient.id,
                      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
                      doctorName: newNoteDoctor,
                      procedureDone: newNoteProcedure,
                      evolutionNotes: newNoteEvolution || 'Procedimiento finalizado sin incidencias.',
                      prescriptions: newNotePrescription ? [newNotePrescription] : [],
                      nextAction: 'Control de rutina según plan.',
                    };
                    onSaveClinicalNote(newNote);
                    setShowNewNoteModal(false);
                    setNewNoteProcedure('');
                    setNewNoteEvolution('');
                    setNewNotePrescription('');
                  }}
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg disabled:opacity-50"
                >
                  Guardar Nota Clínica
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Output Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden my-8 animate-fadeIn">
            <div className="bg-gradient-to-r from-sky-900 to-indigo-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Sparkles className="w-5 h-5 text-sky-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    Asistente Dental Clínico con IA
                  </h3>
                  <p className="text-xs text-sky-200">
                    {aiActionType === 'clinical_note' && 'Redacción estructurada de nota de evolución'}
                    {aiActionType === 'explain_treatment' && 'Explicación empática del tratamiento para el paciente'}
                    {aiActionType === 'post_op_care' && 'Guía y recomendaciones postoperatorias'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="text-slate-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
                  <p className="text-xs text-slate-600 font-medium">
                    Analizando historial y redactando con Gemini 3.7...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 text-slate-800 text-xs leading-relaxed whitespace-pre-line max-h-96 overflow-y-auto">
                    {aiResultText}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        if (aiResultText) {
                          navigator.clipboard.writeText(aiResultText);
                          alert('Texto copiado al portapapeles');
                        }
                      }}
                      className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                    >
                      Copiar al Portapapeles
                    </button>

                    {aiActionType === 'clinical_note' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (aiResultText && selectedPatient) {
                            const newNote: ClinicalNote = {
                              id: `cn-${Date.now()}`,
                              patientId: selectedPatient.id,
                              date: new Date().toISOString().replace('T', ' ').slice(0, 16),
                              doctorName: clinicSettings.doctors[0]?.name || 'Dr. Especialista',
                              procedureDone: 'Atención Odontológica General (IA)',
                              evolutionNotes: aiResultText,
                              prescriptions: [],
                              nextAction: 'Control de rutina.',
                            };
                            onSaveClinicalNote(newNote);
                            setShowAiModal(false);
                            setActiveTab('notes');
                          }
                        }}
                        className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-xs"
                      >
                        Insertar Directo en Notas Clínicas
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
