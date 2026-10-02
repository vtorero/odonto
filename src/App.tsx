import React, { useState, useEffect } from 'react';
import {
  initialClinicSettings,
  initialProcedureCatalog,
  initialInventory,
  initialPatients,
  initialAppointments,
  initialInvoices,
  initialInventoryMovements,
  initialOdontograms,
  initialTreatmentPlans,
  initialClinicalNotes,
} from './data/mockData';
import { initialUsers, initialAuditLogs } from './data/mockUsers';
import {
  Patient,
  Appointment,
  InventoryItem,
  Invoice,
  InventoryMovement,
  ClinicSettings,
  ProcedureCatalogItem,
  OdontogramData,
  TreatmentPlan,
  ClinicalNote,
  TreatmentItem,
  AppUser,
  AuditLogEntry,
  UserRole,
} from './types';
import { DashboardModule } from './components/DashboardModule';
import { PatientsModule } from './components/PatientsModule';
import { AppointmentsModule } from './components/AppointmentsModule';
import { InventoryModule } from './components/InventoryModule';
import { BillingModule } from './components/BillingModule';
import { SettingsModule } from './components/SettingsModule';
import { UsersModule } from './components/UsersModule';
import { GlobalAIAssistantModal } from './components/GlobalAIAssistantModal';
import { LoginScreen } from './components/LoginScreen';
import { PatientPortalModule } from './components/PatientPortalModule';

import {
  LayoutDashboard,
  Users,
  Calendar,
  Package,
  Receipt,
  Settings,
  Sparkles,
  Search,
  Bell,
  Stethoscope,
  Menu,
  X,
  Plus,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  LogOut,
  Smile,
  Pill,
  FileText,
  Lock,
} from 'lucide-react';
import { api } from './services/api';


type ActiveTab =
  | 'dashboard'
  | 'patients'
  | 'appointments'
  | 'inventory'
  | 'billing'
  | 'users'
  | 'settings'
  | 'patient-portal';

export default function App() {
  // State initialization with localStorage fallback
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings>(() => {
    const saved = localStorage.getItem('odonto_clinic_settings');
    return saved ? JSON.parse(saved) : initialClinicSettings;

  });

  const [procedureCatalog, setProcedureCatalog] = useState<ProcedureCatalogItem[]>(() => {
    const saved = localStorage.getItem('odonto_procedure_catalog');
    return saved ? JSON.parse(saved) : initialProcedureCatalog;
  });

  /*CARGAR LISTA PACIENTES */
  const [patients, setPatients] = useState<Patient[]>(initialPatients);

 useEffect(() => {
    const loadPatients = async () => {
      try {
        const saved = await api.getPatients();
        setPatients(saved);
      } catch (error) {
        console.error("Error cargando pacientes:", error);
        setPatients(initialPatients);
      }
    };
    loadPatients();
  }, []);
/*
  const  [patients, setPatients]  =  useState<Patient[]>(()  => {
    //const saved = localStorage.getItem('odonto_patients');
    const saved =  api.getPatients();
    console.log("saved",saved)
    //return saved ? JSON.parse(saved) : initialPatients;
    return saved ? saved : initialPatients;
  });

  const [appointments, setAppointments]  = useState<Appointment[]>(() =>  {
    const saved = localStorage.getItem('odonto_appointments');
        return saved ? JSON.parse(saved) : initialAppointments;
  });
*/
  const [appointments, setAppointments]  = useState<Appointment[]>([]);

  const loadAppoinments = async () => {
    try {
      const data = await api.getAppointments();
      setAppointments(data);
      // localStorage.setItem('odonto_appointments', JSON.stringify(data));
      localStorage.setItem('odonto_appointments', JSON.stringify(appointments));
    } catch (error) {
      console.error("Error cargando appointments:", error);
      setAppointments([]);
    }
  };
  useEffect(() => {
    loadAppoinments();
   }, []);
/*
   const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('odonto_inventory');
    return saved ? JSON.parse(saved) : initialInventory;
  });*/

   const [inventory, setInventory] = useState<InventoryItem[]>([]);

   const loadInventory = async () => {
    try {
      const data = await api.getInventory();
      setInventory(data);
    } catch (error) {
      console.error("Error cargando invetory:", error);
      setInventory([]);
    }
  };
  useEffect(() => {
    loadInventory();
   }, []);


  const [movements, setMovements] = useState<InventoryMovement[]>(() => {
    const saved = localStorage.getItem('odonto_movements');
    return saved ? JSON.parse(saved) : initialInventoryMovements;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('odonto_invoices');
    return saved ? JSON.parse(saved) : initialInvoices;
  });

  const [odontograms, setOdontograms] = useState<Record<string, OdontogramData>>(() => {
    const saved = localStorage.getItem('odonto_odontograms');
    return saved ? JSON.parse(saved) : initialOdontograms;
  });

  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>(() => {
    const saved = localStorage.getItem('odonto_treatment_plans');
    return saved ? JSON.parse(saved) : initialTreatmentPlans;
  });

  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>(() => {
    const saved = localStorage.getItem('odonto_clinical_notes');
    return saved ? JSON.parse(saved) : initialClinicalNotes;
  });

  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem('odonto_users');
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [currentUser, setCurrentUser] = useState<AppUser>(() => {
    const saved = localStorage.getItem('odonto_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return initialUsers[0]; // Admin by default
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem('odonto_audit_logs');
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });


  const isTokenValid = (token: string | null): boolean => {
    if (!token) return false;

    try {
      const parts = token.split('.');

      if (parts.length !== 3) {
        return false;
      }

      const payload = JSON.parse(atob(parts[1]));

      if (!payload.exp) {
        return false;
      }

      // exp está en segundos; Date.now() está en milisegundos
      return payload.exp * 1000 > Date.now();

    } catch (error) {
      console.error('JWT inválido:', error);
      return false;
    }
  };

  // Authentication State (Formal Login Screen)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    //const saved = localStorage.getItem('odonto_is_authenticated');
    //return saved === 'true';
    const token = localStorage.getItem('token');
     return isTokenValid(token);
  });

  // App Navigation & Selected View
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const savedUser = localStorage.getItem('odonto_current_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u.role === 'patient') return 'patient-portal';
      } catch (e) {}
    }
    return 'dashboard';
  });
  const [patientSubTab, setPatientSubTab] = useState<
    'overview' | 'odontogram' | 'history' | 'appointments' | 'billing' | 'prescriptions'
  >('overview');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Derive Patient Profile record for logged-in patient
  const currentPatientRecord = React.useMemo(() => {
    if (currentUser.role === 'patient') {
      if (currentUser.associatedPatientId) {
        const found = patients.find((p) => p.id === currentUser.associatedPatientId);
        if (found) return found;
      }
      const byEmail = patients.find(
        (p) => p.email.toLowerCase() === currentUser.email.toLowerCase()
      );
      if (byEmail) return byEmail;
      const byName = patients.find(
        (p) =>
          p.firstName.toLowerCase() === currentUser.firstName.toLowerCase() ||
          p.lastName.toLowerCase() === currentUser.lastName.toLowerCase()
      );
      if (byName) return byName;
      return patients[0] || null;
    }
    return null;
  }, [currentUser, patients]);

  const currentPatientOdontogram = React.useMemo(() => {
    if (!currentPatientRecord) return {};
    return odontograms[currentPatientRecord.id] || {};
  }, [currentPatientRecord, odontograms]);

  // Role Access Control: enforce tabs based on user permissions
  useEffect(() => {
    if (currentUser.role === 'patient') {
      if (activeTab !== 'patient-portal') {
        setActiveTab('patient-portal');
      }
    } else {
      if (activeTab === 'patient-portal') {
        setActiveTab('dashboard');
      }
      if (currentUser.role !== 'admin') {
        if (activeTab === 'users' && !currentUser.permissions.canManageUsers) {
          setActiveTab('dashboard');
        }
        if (activeTab === 'settings' && !currentUser.permissions.canEditClinicSettings) {
          setActiveTab('dashboard');
        }
      }
    }
  }, [currentUser, activeTab]);

  // Sync to LocalStorage on changes
  useEffect(() => {
    localStorage.setItem('odonto_clinic_settings', JSON.stringify(clinicSettings));
  }, [clinicSettings]);

  useEffect(() => {
    localStorage.setItem('odonto_procedure_catalog', JSON.stringify(procedureCatalog));
  }, [procedureCatalog]);

 /* useEffect(() => {
    localStorage.setItem('odonto_patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('odonto_appointments', JSON.stringify(appointments));
  }, [appointments]);
*/
  useEffect(() => {
    localStorage.setItem('odonto_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('odonto_movements', JSON.stringify(movements));
  }, [movements]);

  useEffect(() => {
    localStorage.setItem('odonto_invoices', JSON.stringify(invoices));
  }, [invoices]);

  /*useEffect(() => {
    localStorage.setItem('odonto_odontograms', JSON.stringify(odontograms));
  }, [odontograms]);
*/
  useEffect(() => {
    localStorage.setItem('odonto_treatment_plans', JSON.stringify(treatmentPlans));
  }, [treatmentPlans]);

  useEffect(() => {
    localStorage.setItem('odonto_clinical_notes', JSON.stringify(clinicalNotes));
  }, [clinicalNotes]);

  useEffect(() => {
    localStorage.setItem('odonto_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('odonto_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('odonto_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Handlers for Users & Roles
  const handleSaveUser = (user: AppUser) => {
    setUsers((prev) => {
      const idx = prev.findIndex((u) => u.id === user.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = user;
        return next;
      }
      return [user, ...prev];
    });
    if (currentUser.id === user.id) {
      setCurrentUser(user);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleSwitchUser = (user: AppUser) => {
    setCurrentUser(user);
    localStorage.setItem('odonto_current_user', JSON.stringify(user));
    setUserDropdownOpen(false);
    if (user.role === 'patient') {
      setActiveTab('patient-portal');
      setPatientSubTab('overview');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogin = (user: AppUser) => {
    setCurrentUser(user);
    console.log("user",user);
    setIsAuthenticated(true);
   // localStorage.setItem('odonto_is_authenticated', 'true');
   // localStorage.setItem('odonto_current_user', JSON.stringify(user));
    if (user.role === 'patient') {
      setActiveTab('patient-portal');
      setPatientSubTab('overview');
    } else {
      setActiveTab('dashboard');
    }
    handleAddAuditLog({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userRole: user.role,
      action: 'LOGIN',
      targetEntity: 'USER',
      details: `Inicio de sesión exitoso como @${user.username} (${user.role})`,
    });
  };

  const handleRequestAppointmentFromPortal = (newApt: Partial<Appointment>) => {
    if (!currentPatientRecord) return;
    const startTime = (newApt as any).time || newApt.startTime || '10:00';
    const duration = newApt.durationMinutes || 45;
    const [h, m] = startTime.split(':').map(Number);
    const endMinutes = (h || 10) * 60 + (m || 0) + duration;
    const endH = String(Math.floor(endMinutes / 60)).padStart(2, '0');
    const endM = String(endMinutes % 60).padStart(2, '0');
    const endTime = `${endH}:${endM}`;

    const apt: Appointment = {
      id: `apt-${Date.now()}`,
      patientId: currentPatientRecord.id,
      patientName: `${currentPatientRecord.firstName} ${currentPatientRecord.lastName}`,
      patientPhone: currentPatientRecord.phone,
      doctorName: newApt.doctorName || clinicSettings.doctors[0]?.name || 'Dr. Carlos Mendoza',
      specialty: newApt.specialty || clinicSettings.doctors[0]?.specialty || 'Odontología General',
      cabinet: newApt.cabinet || clinicSettings.cabinets[0] || 'Sillón 1 (Principal)',
      date: newApt.date || new Date().toISOString().split('T')[0],
      startTime,
      endTime,
      durationMinutes: duration,
      status: 'scheduled',
      reason: newApt.reason || 'Consulta solicitada desde portal de paciente',
      procedureCategory: newApt.procedureCategory || 'Consulta General',
      notes: newApt.notes || 'Solicitud generada desde el Portal del Paciente',
    };
   setAppointments((prev) => [apt, ...prev]);
    handleAddAuditLog({
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userRole: currentUser.role,
      action: 'CREATE',
      targetEntity: 'APPOINTMENT',
      details: `Solicitud de cita para el ${apt.date} a las ${apt.startTime} con ${apt.doctorName}`,
    });
  };

  const handleLogout = () => {
    handleAddAuditLog({
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userRole: currentUser.role,
      action: 'LOGOUT',
      targetEntity: 'USER',
      details: `Cierre de sesión de @${currentUser.username}`,
    });
    setIsAuthenticated(false);
    //localStorage.setItem('odonto_is_authenticated', 'false');
    localStorage.removeItem("token");
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const handleAddAuditLog = (log: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: AuditLogEntry = {
      ...log,
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // Handlers for Patients
  const handleSavePatient = (patient: Patient) => {
    setPatients((prev) => {
      const idx = prev.findIndex((p) => p.id === patient.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = patient;
        return next;
      }
      return [patient, ...prev];
    });
  };

  const handleDeletePatient = (patientId: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== patientId));
    if (selectedPatientId === patientId) {
      setSelectedPatientId(null);
    }
  };

  // Handlers for Appointments

  const handleSaveAppointment = (appointment: Appointment) => {
    setAppointments((prev) => {
      const idx = prev.findIndex((a) => a.id === appointment.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = appointment;
        return next;
      }
      return [appointment, ...prev];
    });
  };

  const handleDeleteAppointment = (appointmentId: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== appointmentId));
  };

  // Handlers for Inventory
  const handleSaveInventoryItem = (item: InventoryItem) => {
    setInventory((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = item;
        return next;
      }
      return [item, ...prev];
    });
  };

  const handleDeleteInventoryItem = (itemId: string) => {
    setInventory((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handleRecordMovement = (movement: InventoryMovement) => {
    setMovements((prev) => [movement, ...prev]);
  };

  // Handlers for Billing
  const handleSaveInvoice = (invoice: Invoice) => {
    setInvoices((prev) => {
      const idx = prev.findIndex((inv) => inv.id === invoice.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = invoice;
        return next;
      }
      return [invoice, ...prev];
    });
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
  };

  // Handlers for Patients sub-records
  const handleSaveOdontogram = (patientId: string, odontogram: OdontogramData) => {
    setOdontograms((prev) => ({
      ...prev,
      [patientId]: odontogram,
    }));
  };

  const handleSaveTreatmentPlan = (plan: TreatmentPlan) => {
    setTreatmentPlans((prev) => {
      const idx = prev.findIndex((tp) => tp.id === plan.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = plan;
        return next;
      }
      return [plan, ...prev];
    });
  };

  const handleSaveClinicalNote = (note: ClinicalNote) => {
    setClinicalNotes((prev) => {
      const idx = prev.findIndex((cn) => cn.id === note.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = note;
        return next;
      }
      return [note, ...prev];
    });
  };

  const handleCreateInvoiceFromPlan = (plan: TreatmentPlan, items: TreatmentItem[]) => {
    const patient = patients.find((p) => p.id === plan.patientId);
    if (!patient) return;
    const subtotal = items.reduce((acc, it) => acc + (it.finalCost || 0), 0);
    const taxRate = clinicSettings.billing.taxRate || 18;
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `FAC-2026-${(invoices.length + 1).toString().padStart(4, '0')}`,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientIdNumber: patient.idNumber,
      patientEmail: patient.email || '',
      patientPhone: patient.phone || '',
      patientAddress: patient.address || '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: items.map((it) => ({
        id: `inv-item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        description: it.procedureName,
        toothNumber: it.toothNumber,
        quantity: 1,
        unitPrice: it.unitCost,
        discount: it.discount || 0,
        total: it.finalCost,
      })),
      subtotal,
      taxRate,
      taxAmount,
      discountTotal: 0,
      total,
      amountPaid: 0,
      balanceDue: total,
      status: 'issued',
      payments: [],
      treatmentPlanId: plan.id,
      doctorName: plan.doctorName,
    };
    setInvoices((prev) => [newInvoice, ...prev]);
    setActiveTab('billing');
  };

  const handleOpenPatientRecord = (patientId: string) => {
    setSelectedPatientId(patientId);
    setActiveTab('patients');
  };



  // Low stock counter for badge
  const lowStockCount = inventory.filter((i) => i.currentStock <= i.minStock).length;
  const todayDate = new Date().toISOString().split('T')[0];
  const todayAppointmentsCount = 0;//appointments.filter((a) => a.date === todayDate).length;
  const primaryDoctor = clinicSettings.doctors[0] || { name: 'Dr. Alberto Rivas', specialty: 'Odontología General' };

  // Pantalla formal de Login previa si no está autenticado
  if (!isAuthenticated) {
    return (
      <LoginScreen
        users={users}
        defaultClinicName={clinicSettings.clinicName || 'ODONTODESA'}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      {/* Top Navigation Header - Bento Style */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shrink-0 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand Info */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div
              onClick={() => {
                if (currentUser.role === 'patient') {
                  setActiveTab('patient-portal');
                  setPatientSubTab('overview');
                } else {
                  setActiveTab('dashboard');
                  setSelectedPatientId(null);
                }
              }}
              className="flex items-center gap-3 cursor-pointer select-none"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xs">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">
                  {clinicSettings.clinicName || 'DentaCloud'} <span className="text-blue-600 italic font-black">Pro</span>
                </h1>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  {currentUser.role === 'patient' ? 'Portal Clínico del Paciente' : 'Gestión Clínica Odontológica'}
                </p>
              </div>
            </div>
          </div>

          {/* Search bar & User Profile */}
          <div className="flex items-center gap-4">
            {currentUser.role !== 'patient' && (
              <div className="relative hidden md:block">
                <input
                  type="text"
                  placeholder="Buscar pacientes, citas o insumos..."
                  onClick={() => {
                    if (activeTab !== 'patients') setActiveTab('patients');
                  }}
                  className="w-64 lg:w-80 h-10 pl-10 pr-4 rounded-full bg-slate-100 border-none text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            )}

            {/* Quick Action: New Appointment or Request Appointment */}
            {currentUser.role === 'patient' ? (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('patient-portal');
                  setPatientSubTab('appointments');
                }}
                className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Solicitar Cita</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('appointments');
                }}
                className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Cita</span>
              </button>
            )}

            {/* AI Assistant Trigger */}
            <button
              type="button"
              onClick={() => setIsAIAssistantOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span className="hidden lg:inline">{currentUser.role === 'patient' ? 'Asistente Dental IA' : 'Asistente IA'}</span>
            </button>

            {/* User Profile & Role Switcher Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-left cursor-pointer"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-2xs ${currentUser.avatarColor || 'bg-indigo-600 text-white'}`}>
                  {currentUser.firstName.charAt(0)}{currentUser.lastName.charAt(0)}
                </div>
                <div className="hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-extrabold text-slate-900 leading-tight">
                      {currentUser.firstName} {currentUser.lastName}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                      currentUser.role === 'admin'
                        ? 'bg-indigo-100 text-indigo-700'
                        : currentUser.role === 'doctor'
                        ? 'bg-sky-100 text-sky-700'
                        : currentUser.role === 'assistant'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-teal-100 text-teal-700'
                    }`}>
                      {currentUser.role === 'admin'
                        ? 'Admin'
                        : currentUser.role === 'doctor'
                        ? 'Odontólogo'
                        : currentUser.role === 'assistant'
                        ? 'Asistente'
                        : 'Paciente'}
                    </span>
                    <span className="text-[10px] text-slate-400">▾</span>
                  </div>
                </div>
              </button>

              {/* User / Role Switcher Dropdown */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Simulación de Perfil / Roles
                    </p>
                    <p className="text-xs text-slate-600">Cambiar de usuario activo:</p>
                  </div>

                  <div className="py-1 max-h-60 overflow-y-auto space-y-1">
                    {users.map((u) => {
                      const isSelected = u.id === currentUser.id;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleSwitchUser(u)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                            isSelected
                              ? 'bg-indigo-50 text-indigo-900 font-bold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${u.avatarColor || 'bg-slate-700 text-white'}`}>
                              {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs leading-tight font-bold">{u.firstName} {u.lastName}</p>
                              <p className="text-[10px] text-slate-400">@{u.username}</p>
                            </div>
                          </div>

                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded capitalize ${
                            u.role === 'admin'
                              ? 'bg-indigo-100 text-indigo-700'
                              : u.role === 'doctor'
                              ? 'bg-sky-100 text-sky-700'
                              : u.role === 'assistant'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-teal-100 text-teal-700'
                          }`}>
                            {u.role}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    {/* Only show User Management shortcut to admins or users with permission */}
                    {(currentUser.role === 'admin' || currentUser.permissions?.canManageUsers) && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('users');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full py-1.5 text-center text-xs font-bold text-indigo-600 hover:text-indigo-800 rounded-lg hover:bg-indigo-50 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Ir a Gestión de Usuarios</span>
                      </button>
                    )}
                    {currentUser.role === 'patient' && (
                      <div className="px-2 py-1.5 bg-teal-50 border border-teal-200/60 rounded-lg text-[10px] text-teal-800 text-center font-medium">
                        Modo Paciente: Navegación limitada a su portal personal.
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full py-1.5 text-center text-xs font-bold text-rose-600 hover:text-rose-800 rounded-lg hover:bg-rose-50 flex items-center justify-center gap-1.5 border border-rose-100 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Header Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 transition-all text-xs font-bold active:scale-95 shadow-2xs cursor-pointer"
              title="Cerrar sesión actual"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>

        {/* Desktop Navigation Sub-bar */}
        <div className="bg-white border-t border-slate-200/80 hidden lg:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto py-2">
            {currentUser.role === 'patient' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('patient-portal');
                    setPatientSubTab('overview');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'patient-portal' && patientSubTab === 'overview'
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Smile className="w-4 h-4" />
                  Mi Resumen & Ficha
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('patient-portal');
                    setPatientSubTab('odontogram');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'patient-portal' && patientSubTab === 'odontogram'
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Stethoscope className="w-4 h-4" />
                  Mi Odontograma FDI
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('patient-portal');
                    setPatientSubTab('appointments');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'patient-portal' && patientSubTab === 'appointments'
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Mis Citas
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('patient-portal');
                    setPatientSubTab('billing');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'patient-portal' && patientSubTab === 'billing'
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  Presupuestos & Pagos
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('patient-portal');
                    setPatientSubTab('prescriptions');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'patient-portal' && patientSubTab === 'prescriptions'
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Pill className="w-4 h-4" />
                  Recetas & Evolución
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('patient-portal');
                    setPatientSubTab('history');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'patient-portal' && patientSubTab === 'history'
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Historia Clínica Oficial
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('dashboard');
                    setSelectedPatientId(null);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-slate-200/80 text-blue-700 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('patients')}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'patients'
                      ? 'bg-slate-200/80 text-blue-700 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Pacientes & Odontogramas {/*({patients.length})*/}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('appointments')}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'appointments'
                      ? 'bg-slate-200/80 text-blue-700 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Agenda & Sillones
                  {todayAppointmentsCount > 0 && (
                    <span className="bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                      {todayAppointmentsCount} hoy
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('inventory')}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'inventory'
                      ? 'bg-slate-200/80 text-blue-700 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  Inventario & Insumos
                  {lowStockCount > 0 && (
                    <span className="bg-rose-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                      {lowStockCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('billing')}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'billing'
                      ? 'bg-slate-200/80 text-blue-700 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  Facturación & Caja ({invoices.length})
                </button>

                {/* Users & Roles: Only if admin or canManageUsers */}
                {(currentUser.role === 'admin' || currentUser.permissions?.canManageUsers) && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                      activeTab === 'users'
                        ? 'bg-slate-200/80 text-indigo-700 font-bold shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Usuarios & Roles ({users.length})
                  </button>
                )}

                {/* Settings: Only if admin or canEditClinicSettings */}
                {(currentUser.role === 'admin' || currentUser.permissions?.canEditClinicSettings) && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                      activeTab === 'settings'
                        ? 'bg-slate-200/80 text-blue-700 font-bold shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    Configuración & Arancel
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 px-4 py-3 space-y-1.5 shadow-md">
            {currentUser.role === 'patient' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('patient-portal');
                    setPatientSubTab('overview');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                    activeTab === 'patient-portal' && patientSubTab === 'overview'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Smile className="w-4 h-4" /> Mi Resumen & Ficha
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('patient-portal');
                    setPatientSubTab('odontogram');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                    activeTab === 'patient-portal' && patientSubTab === 'odontogram'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Stethoscope className="w-4 h-4" /> Mi Odontograma FDI
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('patient-portal');
                    setPatientSubTab('appointments');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                    activeTab === 'patient-portal' && patientSubTab === 'appointments'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Calendar className="w-4 h-4" /> Mis Citas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('patient-portal');
                    setPatientSubTab('billing');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                    activeTab === 'patient-portal' && patientSubTab === 'billing'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Receipt className="w-4 h-4" /> Presupuestos & Pagos
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('patient-portal');
                    setPatientSubTab('prescriptions');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                    activeTab === 'patient-portal' && patientSubTab === 'prescriptions'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Pill className="w-4 h-4" /> Recetas & Evolución
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('patient-portal');
                    setPatientSubTab('history');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                    activeTab === 'patient-portal' && patientSubTab === 'history'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-4 h-4" /> Historia Clínica Oficial
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                    activeTab === 'dashboard' ? 'bg-slate-200 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('patients');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                    activeTab === 'patients' ? 'bg-slate-200 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4" /> Pacientes & Odontograma ({patients.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('appointments');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                    activeTab === 'appointments' ? 'bg-slate-200 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Calendar className="w-4 h-4" /> Agenda & Sillones ({todayAppointmentsCount} hoy)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('inventory');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                    activeTab === 'inventory' ? 'bg-slate-200 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Package className="w-4 h-4" /> Inventario & Insumos ({inventory.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('billing');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                    activeTab === 'billing' ? 'bg-slate-200 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Receipt className="w-4 h-4" /> Facturación & Caja
                </button>
                {(currentUser.role === 'admin' || currentUser.permissions?.canManageUsers) && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('users');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                      activeTab === 'users' ? 'bg-slate-200 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" /> Usuarios & Roles ({users.length})
                  </button>
                )}
                {(currentUser.role === 'admin' || currentUser.permissions.canEditClinicSettings) && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('settings');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                      activeTab === 'settings' ? 'bg-slate-200 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Settings className="w-4 h-4" /> Configuración & Arancel
                  </button>
                )}
              </>
            )}
            <div className="pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main App Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Security Guard: Patient attempting to view non-portal sections */}
        {currentUser.role === 'patient' && activeTab !== 'patient-portal' && (
          <div className="bg-white p-8 rounded-3xl border border-amber-200 text-center max-w-lg mx-auto my-12 shadow-sm">
            <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">Acceso Restringido por Perfil</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Su perfil de <strong>Paciente</strong> solo tiene acceso a su propio historial dental, odontograma, citas y facturación personal.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveTab('patient-portal');
                setPatientSubTab('overview');
              }}
              className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              Ir a Mi Portal de Paciente
            </button>
          </div>
        )}

        {/* Security Guard: Staff attempting to view unauthorized sections */}
        {currentUser.role !== 'admin' && activeTab === 'users' && !currentUser.permissions?.canManageUsers && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-lg mx-auto my-12 shadow-sm">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">Área Exclusiva de Administración</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              El módulo de <strong>Usuarios y Roles</strong> requiere permisos administrativos directos.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="mt-5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              Volver al Dashboard
            </button>
          </div>
        )}

        {currentUser.role !== 'admin' && activeTab === 'settings' && !currentUser.permissions.canEditClinicSettings && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-lg mx-auto my-12 shadow-sm">
            <div className="w-14 h-14 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Settings className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">Configuración Restringida</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              La parametrización de aranceles y datos fiscales de la clínica solo puede ser modificada por administradores.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              Volver al Dashboard
            </button>
          </div>
        )}

        {/* Patient Portal Module (Exclusive to Patient role) */}
        {currentUser.role === 'patient' && activeTab === 'patient-portal' && currentPatientRecord && (
          <PatientPortalModule
            currentUser={currentUser}
            patient={currentPatientRecord}
            odontogram={currentPatientOdontogram}
            treatmentPlans={treatmentPlans}
            clinicalNotes={clinicalNotes}
            invoices={invoices}
           // appointments={appointments}
            clinicSettings={clinicSettings}
            activeSubTab={patientSubTab}
            onSubTabChange={(sub) => setPatientSubTab(sub)}
            onRequestAppointment={handleRequestAppointmentFromPortal}
            onSavePatient={handleSavePatient}
          />
        )}

        {/* Staff Modules (Doctor, Assistant, Admin) */}
        {currentUser.role !== 'patient' && activeTab === 'dashboard' && (
          <DashboardModule
            patients={patients}
            appointments={appointments}
            inventory={inventory}
            invoices={invoices}
            clinicSettings={clinicSettings}
            onNavigate={(tab) => {
              setActiveTab(tab);
            }}
            onSelectPatient={(id) => {
              setSelectedPatientId(id);
              setActiveTab('patients');
            }}
            onOpenNewAppointment={() => {
              setActiveTab('appointments');
            }}
            onOpenNewPatient={() => {
              setSelectedPatientId(null);
              setActiveTab('patients');
            }}
          />
        )}

        {currentUser.role !== 'patient' && activeTab === 'patients' && (
          <PatientsModule
            patients={patients}
            odontograms={odontograms}
            treatmentPlans={treatmentPlans}
            clinicalNotes={clinicalNotes}
            invoices={invoices}
            //appointments={appointments}
            clinicSettings={clinicSettings}
            procedureCatalog={procedureCatalog}
            selectedPatientIdProp={selectedPatientId}
            currentUser={currentUser}
            onSavePatient={handleSavePatient}
            onDeletePatient={handleDeletePatient}
            onSaveOdontogram={handleSaveOdontogram}
            onSaveTreatmentPlan={handleSaveTreatmentPlan}
            onSaveClinicalNote={handleSaveClinicalNote}
            onCreateInvoiceFromPlan={handleCreateInvoiceFromPlan}
            onScheduleAppointment={(patientId) => {
              setSelectedPatientId(patientId);
              setActiveTab('appointments');
            }}
            onCreateInvoice={(patientId) => {
              setSelectedPatientId(patientId);
              setActiveTab('billing');
            }}
          />
        )}

        {currentUser.role !== 'patient' && activeTab === 'appointments' && (
          <AppointmentsModule
            appointments={appointments}
            patients={patients}
            clinicSettings={clinicSettings}
            onSaveAppointment={handleSaveAppointment}
            onDeleteAppointment={handleDeleteAppointment}
            onOpenPatientRecord={handleOpenPatientRecord}
          />
        )}

        {currentUser.role !== 'patient' && activeTab === 'inventory' && (
          <InventoryModule
            inventory={inventory}
            movements={movements}
            clinicSettings={clinicSettings}
            onSaveItem={handleSaveInventoryItem}
            onDeleteItem={handleDeleteInventoryItem}
            onRecordMovement={handleRecordMovement}
          />
        )}

        {currentUser.role !== 'patient' && activeTab === 'billing' && (
          <BillingModule
            invoices={invoices}
            patients={patients}
            clinicSettings={clinicSettings}
            procedureCatalog={procedureCatalog}
            onSaveInvoice={handleSaveInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onOpenPatientRecord={handleOpenPatientRecord}
          />
        )}

        {currentUser.role !== 'patient' && activeTab === 'users' && (currentUser.role === 'admin' || currentUser.permissions?.canManageUsers) && (
          <UsersModule
            users={users}
            currentUser={currentUser}
            auditLogs={auditLogs}
            patients={patients}
            clinicSettings={clinicSettings}
            onSaveUser={handleSaveUser}
            onDeleteUser={handleDeleteUser}
            onSwitchUser={handleSwitchUser}
            onAddAuditLog={handleAddAuditLog}
            onNavigateToPatient={handleOpenPatientRecord}
          />
        )}

        {currentUser.role !== 'patient' && activeTab === 'settings' && (currentUser.role === 'admin' || currentUser.permissions.canEditClinicSettings) && (
          <SettingsModule
            clinicSettings={clinicSettings}
            procedureCatalog={procedureCatalog}
            onSaveSettings={setClinicSettings}
            onSaveProcedureCatalog={setProcedureCatalog}
          />
        )}
      </main>

      {/* Global AI Assistant Modal */}
      <GlobalAIAssistantModal
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        patients={currentUser.role === 'patient' && currentPatientRecord ? [currentPatientRecord] : patients}
      />
    </div>
  );
}