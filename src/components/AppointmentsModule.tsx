import React, { useState,useEffect } from 'react';
import {
  Appointment,
  AppointmentStatus,
  Patient,
  ClinicSettings,
  DentalDoctor,
} from '../types';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Search,
  Filter,
  User,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Phone,
  Check,
  X,
  Play,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
} from 'lucide-react';
import { api } from '../services/api';
import { initialPatients } from '../data/mockData';

interface AppointmentsModuleProps {
  appointments: Appointment[];
  patients: Patient[];
  clinicSettings: ClinicSettings;
  onSaveAppointment: (appointment: Appointment) => void;
  onDeleteAppointment: (appointmentId: string) => void;
  onOpenPatientRecord?: (patientId: string) => void;
}

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; bg: string; text: string; border: string; iconBg: string }
> = {
  scheduled: {
    label: 'Programada',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    iconBg: 'bg-slate-400',
  },
  confirmed: {
    label: 'Confirmada',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    iconBg: 'bg-blue-600',
  },
  in_waiting: {
    label: 'En Sala de Espera',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    iconBg: 'bg-amber-500',
  },
  in_progress: {
    label: 'En Atención / Sillón',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    iconBg: 'bg-indigo-600',
  },
  completed: {
    label: 'Atención Finalizada',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-600',
  },
  cancelled: {
    label: 'Cancelada',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    iconBg: 'bg-rose-500',
  },
  no_show: {
    label: 'No Asistió',
    bg: 'bg-neutral-100',
    text: 'text-neutral-600',
    border: 'border-neutral-200',
    iconBg: 'bg-neutral-400',
  },
};

export const AppointmentsModule: React.FC<AppointmentsModuleProps> = ({
 appointments,
  //patients,
  clinicSettings,
  onSaveAppointment,
  onDeleteAppointment,
  onOpenPatientRecord,
}) => {
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'list'>('day');
  const [doctors, setDoctors] = useState<DentalDoctor[]>([]);
  //const [appointments, setAppointments] = useState<Appointment[]>([]);

  const loadAppoinments = async () => {
    try {
      const data = await api.getAppointments();
      //setAppointments(data);
      console.log("apointments",data);
      //localStorage.setItem('odonto_appointments', JSON.stringify(data));
    } catch (error) {
      console.error("Error cargando appointments:", error);
     // setAppointments([]);
    }
  };

  const loadDoctors = async () => {
    try {
      const data = await api.getDoctors();
      setDoctors(data);
    } catch (error) {
      console.error("Error cargando doctores:", error);
      setDoctors([]);
    }
  };

    useEffect(() => {
   loadDoctors();
  // loadAppoinments();
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('all');
  const [selectedCabinetFilter, setSelectedCabinetFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [cabines, setCabines] = useState<{ id: number; cabinetName: string }[]>([]);
  // New Appointment Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Partial<Appointment> | null>(null);

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patientPhone.includes(searchTerm);

    const matchesDoctor =
      selectedDoctorFilter === 'all' || apt.doctorName === selectedDoctorFilter;

    const matchesCabinet =
      selectedCabinetFilter === 'all' || apt.cabinet === selectedCabinetFilter;

    if (viewMode === 'day') {
      return matchesSearch && matchesDoctor && matchesCabinet && apt.date === selectedDate;
      //return apt.date === selectedDate;
    }
    return matchesSearch && matchesDoctor && matchesCabinet;
  });

  const addMinutes = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number);

    const total = hours * 60 + mins + minutes;

    const newHours = Math.floor(total / 60) % 24;
    const newMinutes = total % 60;

    return `${newHours.toString().padStart(2, '0')}:${newMinutes
      .toString()
      .padStart(2, '0')}`;
  };

  const handleOpenNewAppointment = (defaultTime = '10:00') => {
    const firstPatient = patients[0];
    const firstDoctor = doctors[0];
    const firstCabinet = cabines[0] || 'Gabinete 1 - Sillón Principal';

    setEditingAppointment({
      patientId: firstPatient?.id || '',
      patientName: firstPatient ? `${firstPatient.firstName} ${firstPatient.lastName}` : '',
      patientPhone: firstPatient?.phone || '',
      doctorName: firstDoctor?.id || '',
      specialty: firstDoctor?.specialty || 'General',
      cabinet: firstCabinet.id,
      date: selectedDate,
      startTime: defaultTime,
      endTime: addMinutes(defaultTime,30),
      durationMinutes: 30,
      status: 'scheduled',
      reason: '',
      procedureCategory: 'General',
      notes: '',
      reminderSent: false,
    });
    setShowModal(true);
  };

  const handleSaveAppointmentForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppointment?.patientName || !editingAppointment?.date) return;

    const appointmentToSave: Appointment = {
      id: editingAppointment.id || `apt-${Date.now()}`,
      patientId: editingAppointment.patientId || `pat-${Date.now()}`,
      patientName: editingAppointment.patientName,
      patientPhone: editingAppointment.patientPhone || '',
      doctorName: editingAppointment.doctorName || clinicSettings.doctors[0]?.name || 'Dr. Médico',
      specialty: editingAppointment.specialty || 'Odontología General',
      cabinet: editingAppointment.cabinet || clinicSettings.cabinets[0] || 'Gabinete 1',
      date: editingAppointment.date,
      startTime: editingAppointment.startTime || '09:00',
      endTime: editingAppointment.endTime || '09:45',
      durationMinutes: editingAppointment.durationMinutes || 45,
      status: editingAppointment.status || 'scheduled',
      reason: editingAppointment.reason || 'Consulta Odontológica',
      procedureCategory: editingAppointment.procedureCategory || 'General',
      notes: editingAppointment.notes || '',
      reminderSent: editingAppointment.reminderSent || false,
    };

    const respuesta = await api.saveAppointments(appointmentToSave);
     onSaveAppointment(appointmentToSave);
     setShowModal(false);

  };

  const updateStatus = async (apt: Appointment, nextStatus: AppointmentStatus) => {
    onSaveAppointment({
      ...apt,
      status: nextStatus,
    });
    const guardar ={
      ...apt,
      status:nextStatus
    }
    const response = api.updateAppointmentestado(guardar);
    //console.log(response)
  };

  // Time Slots for Day View (from 08:00 to 20:00 in 30min intervals)
  const timeSlots: string[] = [];

  for (let hour =8; hour <= 19;  hour++) {
    const hStr = hour.toString().padStart(2, '0');
    timeSlots.push(`${hStr}:00`);
    timeSlots.push(`${hStr}:30`);

  }



  // Summary counts for selected day
  const todayApts = appointments.filter((a) => a.date === selectedDate);
  const scheduledCount = todayApts.filter((a) => a.status === 'scheduled' || a.status === 'confirmed').length;
  const waitingCount = todayApts.filter((a) => a.status === 'in_waiting').length;
  const inProgressCount = todayApts.filter((a) => a.status === 'in_progress').length;
  const completedCount = todayApts.filter((a) => a.status === 'completed').length;

const loadCabines = async()=>{
  try {
    const saved = await api.getCabines();
    setCabines(saved);
  } catch (error) {
    console.error("Error cargando cabinas:", error);
  }

}


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
    loadCabines();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Agenda Odontológica y Gestión de Citas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Control de sillones dentales, gabinetes, tiempos de atención y flujo de pacientes en sala.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleOpenNewAppointment()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Cita
          </button>
        </div>
      </div>

      {/* Real-time Status Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">Programadas Hoy</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          </div>
          <span className="text-2xl font-black text-slate-900 mt-1.5 block">
            {scheduledCount}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">En Sala de Espera</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <span className="text-2xl font-black text-amber-600 mt-1.5 block">
            {waitingCount}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">En Sillón Dental</span>
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          </div>
          <span className="text-2xl font-black text-indigo-600 mt-1.5 block">
            {inProgressCount}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">Atendidas</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <span className="text-2xl font-black text-emerald-600 mt-1.5 block">
            {completedCount}
          </span>
        </div>
      </div>

      {/* Filter and Date Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Date Selector */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() - 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-xs font-bold text-slate-800">
              <CalendarIcon className="w-4 h-4 text-blue-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none focus:outline-none cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() + 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 font-bold rounded-xl border border-blue-200 transition-colors"
            >
              Hoy
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'day' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vista Día
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lista Completa
            </button>
          </div>
        </div>

        {/* Doctor and Cabinet Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar por paciente, motivo..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={selectedDoctorFilter}
              onChange={(e) => setSelectedDoctorFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">Todos los Odontólogos</option>
              {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.first_name+' '+doctor.last_name}>
                    {doctor.first_name} {doctor.last_name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <select
              value={selectedCabinetFilter}
              onChange={(e) => setSelectedCabinetFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">Todos los Gabinetes / Sillones</option>
              {cabines.map((c) => (
                    <option key={c.id} value={c.cabinetName}>
                      {c.cabinetName}
                    </option>
                  ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main View: Day Agenda vs List View */}
      {viewMode === 'day' ? (

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Agenda del Día: {selectedDate} ({filteredAppointments.length} citas programadas)
            </h3>
            <span className="text-xs text-slate-500">
              Haga clic en una hora para programar cita
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {timeSlots.map((slot) => {
              const slotAppointments = filteredAppointments.filter(
                (a) => a.startTime <= slot && slot < a.endTime


              );

              return (
                <div
                  key={slot}
                  className="flex items-stretch min-h-[56px] hover:bg-slate-50/50 group transition-colors"
                >
                  {/* Time label */}
                  <div className="w-20 p-3 bg-slate-50/30 text-xs font-bold text-slate-500 border-r border-slate-100 flex items-center justify-center shrink-0">
                    {slot}
                  </div>

                  {/* Slot content */}
                  <div className="flex-1 p-2 flex flex-wrap gap-2 items-center">
                    {slotAppointments.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => handleOpenNewAppointment(slot)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-sky-600 text-xs font-medium flex items-center gap-1.5 px-3 py-1 rounded-md transition-opacity"
                      >
                        <Plus className="w-3.5 h-3.5" /> Programar en {slot}
                      </button>
                    ) : (
                      slotAppointments.map((apt) => {
                        const statusConfig = STATUS_CONFIG[apt.status];
                        return (
                          <div
                            key={apt.id}
                            className={`flex-1 min-w-[280px] p-3 rounded-xl border ${statusConfig.border} ${statusConfig.bg} shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-2 h-2 rounded-full ${statusConfig.iconBg}`}
                                />
                                <h4
                                  onClick={() => onOpenPatientRecord && onOpenPatientRecord(apt.patientId)}
                                  className="text-xs font-bold text-slate-900 hover:text-sky-600 cursor-pointer"
                                >
                                  {apt.patientName}
                                </h4>
                                <span className="text-[11px] text-slate-500">
                                  ({apt.startTime} - {apt.endTime})
                                </span>
                              </div>

                              <p className="text-xs text-slate-700 font-medium">
                                {apt.reason}
                              </p>

                              <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Stethoscope className="w-3 h-3 text-slate-400" />
                                  {apt.doctorName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  {apt.cabinet}
                                </span>
                              </div>
                            </div>

                            {/* Status transitions */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {apt.status === 'scheduled' && (
                                <button
                                  type="button"
                                  onClick={() => updateStatus(apt, 'confirmed')}
                                  className="px-2.5 py-1 text-xs bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg"
                                >
                                  Confirmar
                                </button>
                              )}
                              {apt.status === 'confirmed' && (
                                <button
                                  type="button"
                                  onClick={() => updateStatus(apt, 'in_waiting')}
                                  className="px-2.5 py-1 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg"
                                >
                                  Pasa a Espera
                                </button>
                              )}
                              {apt.status === 'in_waiting' && (
                                <button
                                  type="button"
                                  onClick={() => updateStatus(apt, 'in_progress')}
                                  className="px-2.5 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg flex items-center gap-1"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  Ingresar a Sillón
                                </button>
                              )}
                              {apt.status === 'in_progress' && (
                                <button
                                  type="button"
                                  onClick={() => updateStatus(apt, 'completed')}
                                  className="px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Finalizar Atención
                                </button>
                              )}
                              {apt.status === 'completed' && (
                                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Atendido
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Fecha / Hora</th>
                  <th className="py-3 px-4">Paciente</th>
                  <th className="py-3 px-4">Motivo de Consulta</th>
                  <th className="py-3 px-4">Doctor & Gabinete</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No hay citas que coincidan con los filtros.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((apt) => {
                    const statusConfig = STATUS_CONFIG[apt.status];
                    return (
                      <tr key={apt.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <div>{apt.date}</div>
                          <span className="text-slate-500 text-[11px]">
                            {apt.startTime} - {apt.endTime} ({apt.durationMinutes} min)
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          <button
                            type="button"
                            onClick={() => onOpenPatientRecord && onOpenPatientRecord(apt.patientId)}
                            className="hover:text-sky-600 hover:underline"
                          >
                            {apt.patientName}
                          </button>
                          <span className="block text-[11px] font-normal text-slate-500">
                            {apt.patientPhone}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {apt.reason}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{apt.doctorName}</div>
                          <span className="text-slate-500 text-[11px]">{apt.cabinet}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusConfig.border} ${statusConfig.bg} ${statusConfig.text}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.iconBg}`} />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => onDeleteAppointment(apt.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                            title="Eliminar cita"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule / Edit Appointment Modal */}
      {showModal && editingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden my-8 animate-fadeIn">
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {editingAppointment.id ? 'Modificar Cita' : 'Programar Nueva Cita'}
                </h3>
                <p className="text-xs text-slate-400">
                  Asigne paciente, doctor, horario y gabinete correspondiente.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAppointmentForm} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Paciente *</label>
                <select
                  required
                  value={editingAppointment.patientId}
                  onChange={(e) => {
                    const pat = patients.find((p) => p.id === e.target.value);
                    if (pat) {
                      setEditingAppointment({
                        ...editingAppointment,
                        patientId: pat.id,
                        patientName: `${pat.firstName} ${pat.lastName}`,
                        patientPhone: pat.phone,
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} (DNI: {p.idNumber} - Tel: {p.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Odontólogo / Especialista</label>

                  <select
                  value={editingAppointment.doctorName || ''}
                  onChange={(e) =>setEditingAppointment({...editingAppointment,doctorName: e.target.value})
        }            className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.first_name} {doctor.last_name}
                  </option>
                ))}
                </select>

                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Sillón Dental</label>
                  <select
                    value={editingAppointment.cabinet}
                    onChange={(e) =>{
                      const cab = cabines.find((e) => e.id === e.target.value);
                      if (cab) {
                        setEditingAppointment({
                          ...editingAppointment,
                          cabinet: cab.id
                        });
                      }

                    }

                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                  {cabines.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.cabinetName}
                    </option>
                  ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={editingAppointment.date}
                    onChange={(e) =>
                      setEditingAppointment({ ...editingAppointment, date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    required
                    value={editingAppointment.startTime}
                    onChange={(e) => {
                      const start = e.target.value || '';
                      if (start && start.includes(':')) {
                        const [h, m] = start.split(':').map(Number);
                        if (!isNaN(h) && !isNaN(m)) {
                          const endM = (m + 45) % 60;
                          const endH = h + Math.floor((m + 45) / 60);
                          const endStr = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
                          setEditingAppointment({
                            ...editingAppointment,
                            startTime: start,
                            endTime: endStr,
                          });
                          return;
                        }
                      }
                      setEditingAppointment({
                        ...editingAppointment,
                        startTime: start,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Hora Fin</label>
                  <input
                    type="time"
                    required
                    value={editingAppointment.endTime}
                    onChange={(e) =>
                      setEditingAppointment({ ...editingAppointment, endTime: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Motivo de la Cita / Procedimiento</label>
                <input
                  type="text"
                  required
                  value={editingAppointment.reason || ''}
                  onChange={(e) =>
                    setEditingAppointment({ ...editingAppointment, reason: e.target.value })
                  }
                  placeholder="Ej. Reconstrucción estética pieza 11 / Revisión de ortodoncia"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Estado Inicial</label>
                <select
                  value={editingAppointment.status || 'scheduled'}
                  onChange={(e) =>
                    setEditingAppointment({
                      ...editingAppointment,
                      status: e.target.value as AppointmentStatus,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="scheduled">Programada</option>
                  <option value="confirmed">Confirmada</option>
                  <option value="in_waiting">En Sala de Espera</option>
                  <option value="in_progress">En Atención</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Guardar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


