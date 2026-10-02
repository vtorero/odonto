import React from 'react';
import {
  Patient,
  Appointment,
  InventoryItem,
  Invoice,
  ClinicSettings,
} from '../types';
import {
  Users,
  Calendar,
  Package,
  DollarSign,
  Clock,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Stethoscope,
  Plus,
  TrendingUp,
  CheckCircle2,
  Phone,
  Activity,
  HeartPulse,
  ChevronRight,
} from 'lucide-react';

interface DashboardModuleProps {
  patients: Patient[];
  appointments: Appointment[];
  inventory: InventoryItem[];
  invoices: Invoice[];
  clinicSettings: ClinicSettings;
  onNavigate: (tab: 'dashboard' | 'patients' | 'appointments' | 'inventory' | 'billing' | 'settings') => void;
  onSelectPatient: (patientId: string) => void;
  onOpenNewAppointment: () => void;
  onOpenNewPatient: () => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  patients,
  appointments,
  inventory,
  invoices,
  clinicSettings,
  onNavigate,
  onSelectPatient,
  onOpenNewAppointment,
  onOpenNewPatient,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter((a) => a.date === todayStr);

  const lowStockItems = inventory.filter((i) => i.currentStock <= i.minStock);
  const expiringItems = inventory.filter((i) => {
    const d = new Date(i.expiryDate);
    const ninetyDays = new Date();
    ninetyDays.setDate(ninetyDays.getDate() + 90);
    return d <= ninetyDays;
  });

  const totalMonthlyBilled = invoices.reduce((acc, inv) => acc + inv.total, 0);
  const totalMonthlyCollected = invoices.reduce((acc, inv) => acc + inv.amountPaid, 0);

  // Recent patients for bottom Bento row
  const recentPatients = [...patients].slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Bento Grid Main Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Bento Cell 1: Agenda de Hoy (Spans 2 cols on lg) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base sm:text-lg text-slate-900">Agenda de Hoy</h2>
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-100">
                  {new Date().toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('appointments')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Ver agenda <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {todayAppointments.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                  <p>No hay citas programadas para hoy.</p>
                  <button
                    type="button"
                    onClick={onOpenNewAppointment}
                    className="mt-2 text-xs text-blue-600 font-bold hover:underline"
                  >
                    + Agendar primera cita del día
                  </button>
                </div>
              ) : (
                todayAppointments.slice(0, 4).map((apt) => (
                  <div
                    key={apt.id}
                    className={`flex items-center gap-3.5 p-3 bg-slate-50/80 rounded-r-xl border-l-4 transition-all hover:bg-slate-100/70 cursor-pointer ${
                      apt.status === 'completed'
                        ? 'border-emerald-500'
                        : apt.status === 'in_progress'
                        ? 'border-indigo-500'
                        : apt.status === 'in_waiting'
                        ? 'border-amber-500'
                        : 'border-blue-500'
                    }`}
                    onClick={() => {
                      onSelectPatient(apt.patientId);
                      onNavigate('patients');
                    }}
                  >
                    <p className="text-xs font-mono font-bold text-slate-500 shrink-0">
                      {apt.startTime}
                    </p>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {apt.patientName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate italic">
                        {apt.reason} • {apt.doctorName}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md shrink-0 ${
                        apt.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : apt.status === 'in_progress'
                          ? 'bg-indigo-100 text-indigo-700'
                          : apt.status === 'in_waiting'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {apt.status === 'completed' && 'Finalizado'}
                      {apt.status === 'in_progress' && 'En Sillón'}
                      {apt.status === 'in_waiting' && 'En Espera'}
                      {apt.status === 'scheduled' && 'Programado'}
                      {apt.status === 'confirmed' && 'Confirmado'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{todayAppointments.length} citas en total hoy</span>
            <button
              type="button"
              onClick={onOpenNewAppointment}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Nueva cita
            </button>
          </div>
        </div>

        {/* Bento Cell 2: Alertas de Inventario (Spans 2 cols on lg) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base sm:text-lg text-slate-900">Alertas de Inventario</h2>
              <button
                type="button"
                onClick={() => onNavigate('inventory')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                Ver inventario
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lowStockItems.length > 0 ? (
                lowStockItems.slice(0, 2).map((item) => (
                  <div key={item.id} className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider mb-0.5">
                      Stock Crítico
                    </p>
                    <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-600">
                      Solo {item.currentStock} {(item.unit || '').split(' ')[0] || item.unit || 'uds'} restantes (Mín: {item.minStock})
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-0.5">
                    Stock Saludable
                  </p>
                  <p className="text-xs font-bold text-slate-900">Materiales Principales</p>
                  <p className="text-[11px] text-slate-500">Sin faltantes críticos hoy</p>
                </div>
              )}

              {expiringItems.length > 0 ? (
                expiringItems.slice(0, 2).map((item) => (
                  <div key={item.id} className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-0.5">
                      Próximo a Vencer
                    </p>
                    <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-600">Caduca: {item.expiryDate}</p>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                    Caducidades
                  </p>
                  <p className="text-xs font-bold text-slate-900">Control de Lotes</p>
                  <p className="text-[11px] text-slate-500">Todos con fecha vigente</p>
                </div>
              )}

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                  Insumos Activos
                </p>
                <p className="text-xs font-bold text-slate-900">{inventory.length} Líneas en Catálogo</p>
                <p className="text-[11px] text-slate-500">Kardex clínico operativo</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-0.5">
                  Suministro Rápido
                </p>
                <p className="text-xs font-bold text-slate-900">Reposición Express</p>
                <p className="text-[11px] text-slate-500">Actualizar entradas en 1 clic</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{lowStockItems.length} insumos bajo el mínimo</span>
            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Gestionar compras
            </button>
          </div>
        </div>

        {/* Bento Cell 3: Recaudación Hoy (Solid Blue Bento Card) */}
        <div
          onClick={() => onNavigate('billing')}
          className="bg-blue-600 rounded-2xl p-5 text-white flex flex-col justify-between shadow-xs cursor-pointer hover:bg-blue-700 transition-colors"
        >
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider">
                Recaudación en Caja
              </p>
              <DollarSign className="w-4 h-4 text-blue-200" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
              {totalMonthlyCollected.toFixed(2)} {clinicSettings.currencySymbol}
            </h3>
            <p className="text-xs text-blue-200 mt-1">
              De {totalMonthlyBilled.toFixed(2)} {clinicSettings.currencySymbol} facturados
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-blue-100 bg-blue-500/40 px-2.5 py-1.5 rounded-xl mt-4 w-fit">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
            <span>Cobranza activa • {invoices.length} facturas</span>
          </div>
        </div>

        {/* Bento Cell 4: Pacientes Activos */}
        <div
          onClick={() => onNavigate('patients')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-blue-300 transition-colors"
        >
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Pacientes Clínicos
              </p>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">
              {patients.length}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Historias médicas activas</p>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold border-2 border-white flex items-center justify-center text-[10px]">
                PV
              </div>
              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold border-2 border-white flex items-center justify-center text-[10px]">
                DM
              </div>
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold border-2 border-white flex items-center justify-center text-[10px]">
                LC
              </div>
              <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                +{Math.max(0, patients.length - 3)}
              </div>
            </div>
            <span className="text-xs font-bold text-blue-600 hover:underline">Ver fichas</span>
          </div>
        </div>

        {/* Bento Cell 5: Sillones Dentales y Gabinetes */}
        <div
          onClick={() => onNavigate('settings')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-blue-300 transition-colors"
        >
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Sillones & Gabinetes
              </p>
              <Activity className="w-4 h-4 text-slate-400" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">
              {clinicSettings.cabinets.length}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Gabinetes dentales equipados</p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              100% Disponibles
            </span>
            <span className="text-xs font-bold text-blue-600">Configurar</span>
          </div>
        </div>

        {/* Bento Cell 6: Cuerpo Médico */}
        <div
          onClick={() => onNavigate('settings')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-blue-300 transition-colors"
        >
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Especialistas
              </p>
              <Stethoscope className="w-4 h-4 text-slate-400" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">
              {clinicSettings.doctors.length}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Odontólogos en plantilla</p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 truncate">
              {clinicSettings.doctors[0]?.name || 'Dr. Principal'}
            </span>
            <span className="text-xs font-bold text-blue-600">Ver equipo</span>
          </div>
        </div>

        {/* Bento Cell 7: Historiales Médicos Recientes (Spans full width across 4 cols) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-base sm:text-lg text-slate-900">
                Historiales Médicos Recientes
              </h2>
              <p className="text-xs text-slate-500">
                Acceso directo a fichas clínicas, antecedentes y odontograma interactivo
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('patients')}
              className="text-blue-600 text-xs font-bold hover:underline"
            >
              Ver todos los pacientes ({patients.length})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {recentPatients.map((p) => {
              const initials = (p?.name || '')
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((n) => n[0])
                .join('')
                .toUpperCase() || 'P';

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectPatient(p.id);
                    onNavigate('patients');
                  }}
                  className="p-3.5 border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-blue-200 rounded-xl flex items-center gap-3 transition-all cursor-pointer shadow-2xs hover:shadow-xs group"
                >
                  <div className="w-10 h-10 bg-white border border-slate-200 group-hover:border-blue-300 rounded-xl flex items-center justify-center text-blue-600 font-bold text-xs shrink-0 shadow-2xs">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">{p.medicalRecordNumber}</p>
                    <p className="text-[10px] text-slate-500 truncate">{p.phone}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 shrink-0" />
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
