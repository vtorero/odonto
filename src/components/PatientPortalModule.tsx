import React, { useState } from 'react';
import {
  Patient,
  OdontogramData,
  ToothState,
  ToothCondition,
  TreatmentPlan,
  ClinicalNote,
  Invoice,
  Appointment,
  ClinicSettings,
  AppUser,
} from '../types';
import { Odontogram } from './Odontogram';
import { OfficialDentalHistoryCard } from './OfficialDentalHistoryCard';
import {
  User,
  Calendar,
  Clock,
  FileText,
  CreditCard,
  HeartPulse,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  X,
  Stethoscope,
  Sparkles,
  DollarSign,
  Info,
  Phone,
  Mail,
  MapPin,
  Smile,
  Pill,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface PatientPortalModuleProps {
  currentUser: AppUser;
  patient: Patient;
  odontogram?: OdontogramData;
  treatmentPlans?: TreatmentPlan[];
  clinicalNotes?: ClinicalNote[];
  invoices?: Invoice[];
  appointments?: Appointment[];
  clinicSettings: ClinicSettings;
  activeSubTab?: 'overview' | 'odontogram' | 'history' | 'appointments' | 'billing' | 'prescriptions';
  onSubTabChange?: (tab: 'overview' | 'odontogram' | 'history' | 'appointments' | 'billing' | 'prescriptions') => void;
  onRequestAppointment?: (appointment: Partial<Appointment>) => void;
  onSavePatient?: (patient: Patient) => void;
}

export const PatientPortalModule: React.FC<PatientPortalModuleProps> = ({
  currentUser,
  patient,
  odontogram = {},
  treatmentPlans = [],
  clinicalNotes = [],
  invoices = [],
  appointments = [],
  clinicSettings,
  activeSubTab = 'overview',
  onSubTabChange,
  onRequestAppointment,
  onSavePatient,
}) => {
  const [currentTab, setCurrentTab] = useState<'overview' | 'odontogram' | 'history' | 'appointments' | 'billing' | 'prescriptions'>(
    activeSubTab
  );

  // Sync if parent passes activeSubTab
  React.useEffect(() => {
    if (activeSubTab) setCurrentTab(activeSubTab);
  }, [activeSubTab]);

  const handleTabClick = (tab: 'overview' | 'odontogram' | 'history' | 'appointments' | 'billing' | 'prescriptions') => {
    setCurrentTab(tab);
    if (onSubTabChange) onSubTabChange(tab);
  };

  // Appointment Request Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestedReason, setRequestedReason] = useState('Revisión general y control');
  const [requestedDate, setRequestedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [requestedTime, setRequestedTime] = useState('10:00');
  const [requestedDoctor, setRequestedDoctor] = useState(clinicSettings.doctors[0]?.name || 'Cualquier profesional disponible');
  const [requestedNotes, setRequestedNotes] = useState('');
  const [requestSuccessMessage, setRequestSuccessMessage] = useState<string | null>(null);

  // Filter data strictly belonging to this patient
  const patientAppointments = appointments
    .filter((a) => a.patientId === patient.id)
    .sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());

  const upcomingAppointments = patientAppointments.filter(
    (a) => a.status === 'scheduled' || a.status === 'confirmed' || a.status === 'in_waiting'
  );

  const pastAppointments = patientAppointments.filter(
    (a) => a.status === 'completed' || a.status === 'cancelled' || a.status === 'no_show'
  );

  const patientInvoices = invoices.filter((inv) => inv.patientId === patient.id);
  const patientPlans = treatmentPlans.filter((plan) => plan.patientId === patient.id);
  const patientNotes = clinicalNotes.filter((n) => n.patientId === patient.id);

  // Financial calculations
  const totalBilled = patientInvoices.reduce((acc, inv) => acc + inv.total, 0);
  const totalPaid = patientInvoices.reduce((acc, inv) => acc + inv.amountPaid, 0);
  const pendingBalance = Math.max(0, totalBilled - totalPaid);

  // Odontogram stats
  const safeOdontogram = odontogram || {};
  const toothList = Object.values(safeOdontogram) as ToothState[];
  const teethWithIssues = toothList.filter((t) => {
    if (!t) return false;
    const hasSurfaceIssues = t.surfaces && Object.values(t.surfaces).some((s) => s && s !== 'healthy');
    const hasWholeCondition = t.wholeToothCondition && t.wholeToothCondition !== 'healthy';
    return hasSurfaceIssues || hasWholeCondition;
  }).length;

  const teethTreated = toothList.filter((t) => {
    if (!t) return false;
    const treatedConds = ['restored', 'crown', 'implant', 'bridge', 'endodontics'];
    const surfaceTreated = t.surfaces && Object.values(t.surfaces).some((s) => s && treatedConds.includes(s as string));
    const wholeTreated = t.wholeToothCondition && treatedConds.includes(t.wholeToothCondition);
    return surfaceTreated || wholeTreated;
  }).length;

  const nextAppointment = upcomingAppointments[0];

  const handleSendAppointmentRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onRequestAppointment) {
      setRequestSuccessMessage('Su solicitud de cita ha sido enviada al equipo de recepción. Le contactaremos para confirmar.');
      setIsRequestModalOpen(false);
      return;
    }

    onRequestAppointment({
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientPhone: patient.phone,
      doctorName: requestedDoctor,
      cabinet: clinicSettings.cabinets[0] || 'Gabinete 1',
      date: requestedDate,
      time: requestedTime,
      durationMinutes: 45,
      type: 'routine_checkup',
      reason: requestedReason,
      notes: requestedNotes ? `Solicitado por el paciente: ${requestedNotes}` : 'Solicitud enviada desde Portal del Paciente',
      status: 'scheduled',
    });

    setRequestSuccessMessage('¡Cita solicitada exitosamente! Nuestro equipo ha reservado su espacio.');
    setIsRequestModalOpen(false);
    setTimeout(() => setRequestSuccessMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Patient Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-teal-400 to-blue-600 p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-black text-xl sm:text-2xl text-teal-300">
                {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-teal-400/20 text-teal-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-teal-400/30">
                  Portal del Paciente
                </span>
                <span className="text-slate-400 text-xs font-mono">Ficha #{patient.id}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {patient.firstName} {patient.lastName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1.5">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-teal-400" />
                  {patient.phone || 'Sin teléfono'}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  {patient.email || currentUser.email}
                </span>
                {patient.allergies && (
                  <span className="flex items-center gap-1 text-amber-300 font-semibold bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-400/30">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Alergias: {patient.allergies}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action in Banner */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Solicitar Nueva Cita</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabClick('history')}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/15 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Ver mi Ficha e imprimir"
            >
              <Printer className="w-4 h-4 text-teal-300" />
              <span className="hidden sm:inline">Mi Historia</span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {requestSuccessMessage && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{requestSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* Patient Sub-Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 shadow-2xs flex items-center gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => handleTabClick('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            currentTab === 'overview'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Smile className="w-4 h-4" />
          <span>Resumen de Mi Salud</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('odontogram')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            currentTab === 'odontogram'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Mi Odontograma FDI</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('appointments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            currentTab === 'appointments'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Mis Citas ({patientAppointments.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('billing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            currentTab === 'billing'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Presupuestos & Pagos</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('prescriptions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            currentTab === 'prescriptions'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Recetas & Evolución ({patientNotes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            currentTab === 'history'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Historia Clínica Oficial</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {currentTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metric Bento Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Next Appointment Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Próxima Cita
                </span>
                {nextAppointment && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Confirmada
                  </span>
                )}
              </div>
              {nextAppointment ? (
                <div>
                  <p className="text-lg font-extrabold text-slate-900">{nextAppointment.date}</p>
                  <p className="text-xs text-blue-600 font-bold mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {nextAppointment.time} hrs · {nextAppointment.doctorName}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 truncate">{nextAppointment.reason || 'Consulta dental'}</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-bold text-slate-600">No tienes citas programadas</p>
                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold mt-2 flex items-center gap-1 cursor-pointer"
                  >
                    Agendar mi cita ahora <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Odontogram Status Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                  Salud Dental (FDI)
                </span>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                  32 Piezas
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">{teethTreated}</span>
                  <span className="text-xs font-medium text-slate-500">piezas restauradas</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {teethWithIssues > 0 ? (
                    <span className="text-amber-600 font-bold">
                      {teethWithIssues} piezas con observación o tratamiento sugerido
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-bold">Dentadura en estado óptimo</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTabClick('odontogram')}
                className="text-xs text-teal-600 hover:text-teal-800 font-bold mt-2 flex items-center gap-1 cursor-pointer"
              >
                Ver mi mapa dental <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Financial Balance Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  Estado de Cuenta
                </span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  pendingBalance > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {pendingBalance > 0 ? 'Saldo Pendiente' : 'Al Día'}
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900">
                    {clinicSettings.currencySymbol} {pendingBalance.toFixed(2)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Total abonado: {clinicSettings.currencySymbol} {totalPaid.toFixed(2)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTabClick('billing')}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold mt-2 flex items-center gap-1 cursor-pointer"
              >
                Ver recibos y presupuesto <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Clinic / Doctor Assigned */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  Tu Clínica Dental
                </span>
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900">{clinicSettings.clinicName}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> {clinicSettings.phone || '+34 912 345 678'}
                </p>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3 h-3 text-slate-400" /> {clinicSettings.address || 'Atención personalizada'}
                </p>
              </div>
              <div className="pt-2 text-[11px] font-bold text-indigo-600">
                Horario: Lun - Sáb 9:00 a 20:00
              </div>
            </div>
          </div>

          {/* Odontogram FDI Preview & Active Treatment Plans */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Interactive Odontogram FDI Card */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    Mi Odontograma FDI (Esquema Dentario)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Visualice el estado de sus piezas dentales según la última revisión de su odontólogo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabClick('odontogram')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                >
                  Pantalla Completa
                </button>
              </div>

              {/* FDI Odontogram Interactive Container */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 overflow-x-auto">
                <Odontogram
                  odontogram={safeOdontogram}
                  onChange={() => {}}
                  readOnly={true}
                />
              </div>

              {/* Color legend guide */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                <span className="font-bold text-slate-700">Guía de colores:</span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Caries / Por tratar
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Resina realizada
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Corona / Prótesis
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Endodoncia
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> Implante
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Pieza sana
                </span>
              </div>
            </div>

            {/* Treatment Plans & Upcoming Appointments list */}
            <div className="space-y-6">
              {/* Presupuestos & Tratamientos Activos */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    Planes de Tratamiento
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleTabClick('billing')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    Detalle
                  </button>
                </div>

                {patientPlans.length > 0 ? (
                  <div className="space-y-3">
                    {patientPlans.map((plan) => (
                      <div key={plan.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-bold text-slate-900">{plan.name || 'Plan de Rehabilitación'}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            plan.status === 'accepted' || plan.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {plan.status === 'accepted' ? 'Aprobado' : plan.status === 'completed' ? 'Completado' : 'Propuesto'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{plan.items.length} tratamientos incluidos</p>
                        <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-extrabold">
                          <span className="text-slate-600">Presupuesto total:</span>
                          <span className="text-blue-700">{clinicSettings.currencySymbol} {plan.totalCost.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400">
                    <Smile className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-medium">No tiene planes de tratamiento activos pendientes.</p>
                  </div>
                )}
              </div>

              {/* Clinical Recommendations */}
              <div className="bg-gradient-to-br from-teal-50 to-blue-50 p-6 rounded-3xl border border-teal-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-teal-800 flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  Recomendaciones de tu Odontólogo
                </h4>
                <p className="text-xs text-teal-900 leading-relaxed font-medium">
                  Recuerde cepillarse al menos 3 veces al día durante 2 minutos, utilizar hilo dental en las zonas interproximales y acudir a su control cada 6 meses.
                </p>
                <div className="mt-3 pt-3 border-t border-teal-200/50 flex items-center justify-between text-[11px] font-bold text-teal-700">
                  <span>¿Dudas o molestias?</span>
                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(true)}
                    className="underline hover:text-teal-900 cursor-pointer"
                  >
                    Escríbenos para una revisión
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ODONTOGRAM FULL VIEW */}
      {currentTab === 'odontogram' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                Odontograma FDI Interactivo de {patient.firstName}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Visualización tridimensional y clínica según la nomenclatura internacional de la Federación Dental Internacional (FDI).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                Modo Consulta Paciente (Solo Lectura)
              </span>
            </div>
          </div>

          {/* Odontogram Component */}
          <div className="bg-slate-50/70 p-6 rounded-3xl border border-slate-200">
            <Odontogram
              odontogram={safeOdontogram}
              onChange={() => {}}
              readOnly={true}
            />
          </div>

          {/* Details Table of Recorded Diagnoses */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900">
              Detalle de Piezas con Diagnóstico Clínico
            </h3>
            {Object.keys(safeOdontogram).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(Object.entries(safeOdontogram) as [string, ToothState][]).map(([toothStr, state]) => {
                  if (!state) return null;
                  const hasCondition = state.wholeToothCondition && state.wholeToothCondition !== 'healthy';
                  const surfaceEntries = state.surfaces ? Object.entries(state.surfaces).filter(([, v]) => v && v !== 'healthy') : [];
                  if (!hasCondition && surfaceEntries.length === 0) return null;
                  const displayCond = state.wholeToothCondition || surfaceEntries[0]?.[1] || 'Observación';
                  return (
                    <div
                      key={toothStr}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3"
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-sm shrink-0">
                        {toothStr}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-extrabold text-slate-900">Pieza #{toothStr}</p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-100 text-slate-700">
                            {displayCond}
                          </span>
                        </div>
                        {state.notes && (
                          <p className="text-[11px] text-slate-500 mt-1 leading-tight line-clamp-2">
                            {state.notes}
                          </p>
                        )}
                        {surfaceEntries.length > 0 && (
                          <p className="text-[10px] text-blue-600 font-semibold mt-1">
                            Superficies: {surfaceEntries.map(([k, cond]) => `${k} (${cond})`).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No hay piezas con observaciones patológicas registradas.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: APPOINTMENTS */}
      {currentTab === 'appointments' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Mis Citas Dentales
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Revise sus próximas visitas a la clínica o solicite una nueva fecha de atención.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Solicitar Nueva Cita</span>
            </button>
          </div>

          {/* Upcoming Appointments Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              Próximas Citas Programadas ({upcomingAppointments.length})
            </h3>
            {upcomingAppointments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border border-blue-200/80 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-700 bg-blue-100/80 px-2.5 py-1 rounded-lg">
                        {apt.date} · {apt.time} hrs
                      </span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {apt.status === 'confirmed' ? 'Confirmada' : 'Agendada'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">{apt.reason || 'Consulta Odontológica'}</p>
                      <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Doctor: <strong className="text-slate-800">{apt.doctorName}</strong>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        Sillón: {apt.cabinet}
                      </p>
                    </div>
                    {apt.notes && (
                      <p className="text-[11px] text-slate-500 bg-white/60 p-2 rounded-xl border border-slate-200/50">
                        {apt.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-700">No tiene citas futuras programadas</p>
                <p className="text-[11px] text-slate-500 mt-0.5">¿Siente molestias o necesita una limpieza? Solicite su cita en segundos.</p>
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(true)}
                  className="mt-3 px-3.5 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Agendar Cita
                </button>
              </div>
            )}
          </div>

          {/* Past Appointments Section */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-400" />
              Historial de Visitas Anteriores ({pastAppointments.length})
            </h3>
            {pastAppointments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Doctor</th>
                      <th className="py-2.5 px-3">Motivo / Tratamiento</th>
                      <th className="py-2.5 px-3">Gabinete</th>
                      <th className="py-2.5 px-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pastAppointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{apt.date} {apt.time}</td>
                        <td className="py-2.5 px-3 text-slate-700">{apt.doctorName}</td>
                        <td className="py-2.5 px-3 text-slate-600">{apt.reason || 'Tratamiento dental'}</td>
                        <td className="py-2.5 px-3 text-slate-500">{apt.cabinet}</td>
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {apt.status === 'completed' ? 'Completada' : 'Cancelada'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No registra visitas anteriores archivadas.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: BILLING & TREATMENT PLANS */}
      {currentTab === 'billing' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Mis Presupuestos & Pagos Realizados
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Consulte sus presupuestos aprobados, entregas realizadas y descargue sus comprobantes de pago.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-medium">Saldo total por abonar:</span>
              <p className="text-xl font-black text-blue-700">
                {clinicSettings.currencySymbol} {pendingBalance.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Treatment Plans Breakdown */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">
              Presupuestos & Procedimientos Asignados
            </h3>
            {patientPlans.length > 0 ? (
              <div className="space-y-4">
                {patientPlans.map((plan) => (
                  <div key={plan.id} className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">{plan.title}</h4>
                        <p className="text-[11px] text-slate-500">Fecha de emisión: {plan.createdAt}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-slate-900">
                          Total: {clinicSettings.currencySymbol} {plan.totalCost.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {plan.status === 'accepted' ? 'Aprobado' : plan.status}
                        </span>
                      </div>
                    </div>

                    {/* Table of items inside plan */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200/50">
                            <th className="py-2 px-2">Procedimiento</th>
                            <th className="py-2 px-2">Pieza Dental</th>
                            <th className="py-2 px-2 text-right">Precio</th>
                            <th className="py-2 px-2 text-center">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/40">
                          {plan.items.map((it) => (
                            <tr key={it.id}>
                              <td className="py-2 px-2 font-medium text-slate-800">{it.procedureName}</td>
                              <td className="py-2 px-2 text-slate-600">{it.toothNumber ? `Pieza #${it.toothNumber}` : 'General'}</td>
                              <td className="py-2 px-2 text-right font-bold text-slate-900">
                                {clinicSettings.currencySymbol} {it.finalCost.toFixed(2)}
                              </td>
                              <td className="py-2 px-2 text-center">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  it.status === 'completed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : it.status === 'in_progress'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-slate-200 text-slate-700'
                                }`}>
                                  {it.status === 'completed' ? 'Realizado' : it.status === 'in_progress' ? 'En Curso' : 'Pendiente'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No hay presupuestos registrados a su nombre.</p>
            )}
          </div>

          {/* Invoices and Payments History */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900">
              Comprobantes de Pago & Abonos
            </h3>
            {patientInvoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">N° Factura/Recibo</th>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Total</th>
                      <th className="py-2.5 px-3">Abonado</th>
                      <th className="py-2.5 px-3">Saldo</th>
                      <th className="py-2.5 px-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patientInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900 font-mono">{inv.invoiceNumber}</td>
                        <td className="py-2.5 px-3 text-slate-600">{inv.issueDate}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{clinicSettings.currencySymbol} {inv.total.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-emerald-700 font-semibold">{clinicSettings.currencySymbol} {inv.amountPaid.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {clinicSettings.currencySymbol} {inv.balanceDue.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            inv.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'partially_paid'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {inv.status === 'paid' ? 'Pagado' : inv.status === 'partially_paid' ? 'Parcial' : 'Pendiente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No hay facturas o recibos emitidos hasta la fecha.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: PRESCRIPTIONS & EVOLUTION */}
      {currentTab === 'prescriptions' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-5">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Pill className="w-5 h-5 text-blue-600" />
              Recetas Médicas & Notas de Evolución
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Consulte las indicaciones clínicas, medicamentos prescritos y evolución de cada acto dental.
            </p>
          </div>

          {patientNotes.length > 0 ? (
            <div className="space-y-4">
              {patientNotes.map((note) => (
                <div key={note.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-blue-800 bg-blue-100/70 px-2.5 py-1 rounded-lg">
                      Visita: {note.date}
                    </span>
                    <span className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                      {note.doctorName || 'Dr. Odontólogo'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Acto Clínico Realizado
                    </h4>
                    <p className="text-xs text-slate-900 font-medium leading-relaxed bg-white p-3 rounded-xl border border-slate-200/60">
                      {note.notes || note.treatmentDescription || 'Control y revisión de rutina.'}
                    </p>
                  </div>

                  {note.prescriptions && note.prescriptions.length > 0 && (
                    <div className="pt-2 border-t border-slate-200">
                      <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5 text-emerald-600" />
                        Medicamentos Prescritos
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {note.prescriptions.map((rx, idx) => (
                          <div key={idx} className="bg-emerald-50/70 border border-emerald-200 p-2.5 rounded-xl text-xs">
                            <p className="font-extrabold text-emerald-950">{rx.medication}</p>
                            <p className="text-emerald-800 text-[11px] mt-0.5">Dosis: {rx.dosage} · Cada {rx.frequency} por {rx.duration}</p>
                            {rx.instructions && <p className="text-slate-500 text-[10px] mt-1 italic">{rx.instructions}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400">
              <Pill className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">No hay recetas o evoluciones médicas registradas</p>
              <p className="text-xs text-slate-500 mt-1">Aparecerán aquí tras cada procedimiento realizado en la clínica.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: OFFICIAL DENTAL HISTORY CARD (PRINTABLE A4) */}
      {currentTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Historia Clínica Oficial Odontodesa (Formato Imprimible A4)
              </h3>
              <p className="text-xs text-slate-500">
                Visualice su expediente médico dental completo con anamnesis, odontograma e historial de actos.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ficha</span>
            </button>
          </div>

          {/* Official Card View */}
          <OfficialDentalHistoryCard
            patient={patient}
            odontogram={odontogram}
            clinicalNotes={clinicalNotes}
            clinicSettings={clinicSettings}
            onSavePatient={onSavePatient || (() => {})}
            onSaveOdontogram={() => {}}
            onSaveClinicalNote={() => {}}
          />
        </div>
      )}

      {/* APPOINTMENT REQUEST MODAL */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 sm:p-8 relative">
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                Solicitud en Línea
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                Solicitar Cita Odontológica
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Indique la fecha y motivo de su visita. Su cita quedará agendada en el sistema de la clínica.
              </p>
            </div>

            <form onSubmit={handleSendAppointmentRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo de la Consulta
                </label>
                <select
                  value={requestedReason}
                  onChange={(e) => setRequestedReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
                >
                  <option value="Revisión general y diagnóstico">Revisión general y diagnóstico</option>
                  <option value="Limpieza dental y profilaxis ultrasónica">Limpieza dental y profilaxis ultrasónica</option>
                  <option value="Dolor dental agudo / Urgencia">Dolor dental agudo / Urgencia</option>
                  <option value="Control de Ortodoncia / Brackets">Control de Ortodoncia / Brackets</option>
                  <option value="Blanqueamiento y Estética Dental">Blanqueamiento y Estética Dental</option>
                  <option value="Implantes o Cirugía Dental">Implantes o Cirugía Dental</option>
                  <option value="Otro motivo">Otro motivo</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha Deseada
                  </label>
                  <input
                    type="date"
                    required
                    value={requestedDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setRequestedDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Horario Preferido
                  </label>
                  <select
                    value={requestedTime}
                    onChange={(e) => setRequestedTime(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="09:00">09:00 hrs</option>
                    <option value="10:00">10:00 hrs</option>
                    <option value="11:30">11:30 hrs</option>
                    <option value="14:00">14:00 hrs</option>
                    <option value="16:00">16:00 hrs</option>
                    <option value="17:30">17:30 hrs</option>
                    <option value="19:00">19:00 hrs</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Doctor Preferido (Opcional)
                </label>
                <select
                  value={requestedDoctor}
                  onChange={(e) => setRequestedDoctor(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="Cualquier profesional disponible">Cualquier profesional disponible</option>
                  {clinicSettings.doctors.map((doc) => (
                    <option key={doc.id} value={doc.name}>
                      {doc.name} · {doc.specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas o Síntomas Adicionales
                </label>
                <textarea
                  rows={2}
                  value={requestedNotes}
                  onChange={(e) => setRequestedNotes(e.target.value)}
                  placeholder="Ej: Siento sensibilidad en el molar derecho al tomar agua fría..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Solicitud de Cita</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
