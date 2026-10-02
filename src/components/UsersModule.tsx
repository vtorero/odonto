import React, { useState, useMemo } from 'react';
import {
  AppUser,
  UserRole,
  UserStatus,
  UserPermissions,
  AuditLogEntry,
  Patient,
  ClinicSettings,
} from '../types';
import { ROLE_DEFAULT_PERMISSIONS } from '../data/mockUsers';
import {
  Users,
  Shield,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  Search,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Filter,
  Download,
  Smartphone,
  Calendar,
  FileText,
  CreditCard,
  Building,
  RefreshCw,
  LogIn,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface UsersModuleProps {
  users: AppUser[];
  currentUser: AppUser;
  patients: Patient[];
  clinicSettings: ClinicSettings;
  auditLogs: AuditLogEntry[];
  onSaveUser: (user: AppUser) => void;
  onDeleteUser: (userId: string) => void;
  onSwitchUser: (user: AppUser) => void;
  onAddAuditLog: (log: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
  onNavigateToPatient?: (patientId: string) => void;
}

export function UsersModule({
  users,
  currentUser,
  patients,
  clinicSettings,
  auditLogs,
  onSaveUser,
  onDeleteUser,
  onSwitchUser,
  onAddAuditLog,
  onNavigateToPatient,
}: UsersModuleProps) {
  const [activeTab, setActiveTab] = useState<'directory' | 'matrix' | 'audit' | 'patient_portal'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<AppUser> | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'general' | 'role_fields' | 'permissions' | 'security'>('general');

  // Patient Portal Preview Selection
  const [selectedPatientUserId, setSelectedPatientUserId] = useState<string>(() => {
    const firstPatientUser = users.find((u) => u.role === 'patient');
    return firstPatientUser?.id || '';
  });

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.idNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.licenseNumber && u.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Role Counts
  const roleCounts = useMemo(() => {
    return {
      all: users.length,
      admin: users.filter((u) => u.role === 'admin').length,
      doctor: users.filter((u) => u.role === 'doctor').length,
      assistant: users.filter((u) => u.role === 'assistant').length,
      patient: users.filter((u) => u.role === 'patient').length,
    };
  }, [users]);

  // Handle open create modal
  const handleOpenCreate = () => {
    setIsNewUser(true);
    setEditingUser({
      id: `usr-${Date.now()}`,
      username: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      idNumber: '',
      role: 'assistant',
      status: 'active',
      avatarColor: 'bg-blue-600 text-white',
      createdAt: new Date().toISOString().split('T')[0],
      twoFactorEnabled: false,
      permissions: { ...ROLE_DEFAULT_PERMISSIONS.assistant },
    });
    setPasswordInput('Dental2026*');
    setActiveModalTab('general');
    setIsModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (user: AppUser) => {
    setIsNewUser(false);
    setEditingUser({ ...user });
    setPasswordInput('');
    setActiveModalTab('general');
    setIsModalOpen(true);
  };

  // Handle save user
  const handleSaveModal = () => {
    if (!editingUser || !editingUser.username || !editingUser.firstName || !editingUser.lastName) {
      alert('Por favor complete los campos obligatorios: Usuario, Nombres y Apellidos.');
      return;
    }

    const finalUser: AppUser = {
      id: editingUser.id || `usr-${Date.now()}`,
      username: editingUser.username.trim().toLowerCase(),
      firstName: editingUser.firstName.trim(),
      lastName: editingUser.lastName.trim(),
      email: editingUser.email?.trim() || '',
      phone: editingUser.phone?.trim() || '',
      idNumber: editingUser.idNumber?.trim() || '',
      role: editingUser.role || 'assistant',
      status: editingUser.status || 'active',
      avatarColor: editingUser.avatarColor || getRoleColor(editingUser.role || 'assistant'),
      createdAt: editingUser.createdAt || new Date().toISOString().split('T')[0],
      lastLogin: editingUser.lastLogin,
      twoFactorEnabled: editingUser.twoFactorEnabled ?? false,
      doctorId: editingUser.doctorId,
      licenseNumber: editingUser.licenseNumber,
      specialty: editingUser.specialty,
      cabinetAssigned: editingUser.cabinetAssigned,
      shift: editingUser.shift,
      associatedPatientId: editingUser.associatedPatientId,
      notes: editingUser.notes,
      permissions: editingUser.permissions || { ...ROLE_DEFAULT_PERMISSIONS[editingUser.role || 'assistant'] },
    };

    onSaveUser(finalUser);

    onAddAuditLog({
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userRole: currentUser.role,
      action: isNewUser ? 'CREATE' : 'UPDATE',
      targetEntity: 'USER',
      details: `${isNewUser ? 'Creó' : 'Actualizó'} usuario @${finalUser.username} con rol [${getRoleBadgeName(finalUser.role)}]`,
    });

    setIsModalOpen(false);
  };

  // Handle delete user
  const handleDelete = (user: AppUser) => {
    if (user.id === currentUser.id) {
      alert('No puedes eliminar tu propio usuario activo en sesión.');
      return;
    }
    if (confirm(`¿Está seguro de eliminar el usuario "${user.firstName} ${user.lastName}" (@${user.username})?`)) {
      onDeleteUser(user.id);
      onAddAuditLog({
        userId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        userRole: currentUser.role,
        action: 'DELETE',
        targetEntity: 'USER',
        details: `Eliminó al usuario @${user.username} (${user.firstName} ${user.lastName})`,
      });
    }
  };

  // Helper colors and labels
  function getRoleBadgeName(role: UserRole): string {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'doctor':
        return 'Odontólogo';
      case 'assistant':
        return 'Asistente / Recepción';
      case 'patient':
        return 'Paciente';
      default:
        return role;
    }
  }

  function getRoleColor(role: UserRole): string {
    switch (role) {
      case 'admin':
        return 'bg-indigo-600 text-white';
      case 'doctor':
        return 'bg-sky-600 text-white';
      case 'assistant':
        return 'bg-amber-600 text-white';
      case 'patient':
        return 'bg-teal-600 text-white';
    }
  }

  function getRoleBadgeStyle(role: UserRole): string {
    switch (role) {
      case 'admin':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'doctor':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'assistant':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'patient':
        return 'bg-teal-50 text-teal-700 border-teal-200';
    }
  }

  function getRoleIcon(role: UserRole) {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="w-4 h-4 text-indigo-600" />;
      case 'doctor':
        return <Stethoscope className="w-4 h-4 text-sky-600" />;
      case 'assistant':
        return <UserCheck className="w-4 h-4 text-amber-600" />;
      case 'patient':
        return <Users className="w-4 h-4 text-teal-600" />;
    }
  }

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(users, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `usuarios_odontodesa_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const selectedPatientUser = users.find((u) => u.id === selectedPatientUserId);
  const selectedPatientData = patients.find((p) => p.id === selectedPatientUser?.associatedPatientId);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Administración de Usuarios & Perfiles
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Control de acceso basado en roles (RBAC): Administradores, Odontólogos, Asistentes y Pacientes
              </p>
            </div>
          </div>
        </div>

        {/* Current Logged in simulation & Quick Action */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Active User Indicator */}
          <div className="bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">Sesión activa:</span>
            <span className="font-bold text-slate-800">
              {currentUser.firstName} {currentUser.lastName}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getRoleBadgeStyle(currentUser.role)}`}>
              {getRoleBadgeName(currentUser.role)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleExportJSON}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* Role Summary Bento Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Admin Card */}
        <div
          onClick={() => setRoleFilter(roleFilter === 'admin' ? 'all' : 'admin')}
          className={`cursor-pointer bg-white p-4 rounded-2xl border transition-all ${
            roleFilter === 'admin'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-slate-900">{roleCounts.admin}</span>
          </div>
          <h3 className="font-bold text-slate-800 text-xs mt-2.5">Administradores</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Control total, finanzas y configuración</p>
        </div>

        {/* Doctor Card */}
        <div
          onClick={() => setRoleFilter(roleFilter === 'doctor' ? 'all' : 'doctor')}
          className={`cursor-pointer bg-white p-4 rounded-2xl border transition-all ${
            roleFilter === 'doctor'
              ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/20'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-slate-900">{roleCounts.doctor}</span>
          </div>
          <h3 className="font-bold text-slate-800 text-xs mt-2.5">Odontólogos</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Odontograma, planes y evolución clínica</p>
        </div>

        {/* Assistant Card */}
        <div
          onClick={() => setRoleFilter(roleFilter === 'assistant' ? 'all' : 'assistant')}
          className={`cursor-pointer bg-white p-4 rounded-2xl border transition-all ${
            roleFilter === 'assistant'
              ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-slate-900">{roleCounts.assistant}</span>
          </div>
          <h3 className="font-bold text-slate-800 text-xs mt-2.5">Asistentes & Recepción</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Agenda de citas, caja y stock de insumos</p>
        </div>

        {/* Patient Card */}
        <div
          onClick={() => setRoleFilter(roleFilter === 'patient' ? 'all' : 'patient')}
          className={`cursor-pointer bg-white p-4 rounded-2xl border transition-all ${
            roleFilter === 'patient'
              ? 'border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/20'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-slate-900">{roleCounts.patient}</span>
          </div>
          <h3 className="font-bold text-slate-800 text-xs mt-2.5">Pacientes (Portal)</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Consulta de ficha, citas y estados de cuenta</p>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-2xs flex items-center gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('directory')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'directory'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Directorio de Usuarios ({filteredUsers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'matrix'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Matriz de Permisos & Perfiles
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          Registro de Auditoría ({auditLogs.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('patient_portal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'patient_portal'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          Vista Previa: Portal del Paciente
        </button>
      </div>

      {/* TAB 1: DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Search and Filters Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nombre, usuario, email o DNI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="bg-transparent text-xs font-semibold text-slate-700 py-1 px-2 focus:outline-none cursor-pointer"
                >
                  <option value="all">Todos los Roles ({users.length})</option>
                  <option value="admin">Administrador ({roleCounts.admin})</option>
                  <option value="doctor">Odontólogo ({roleCounts.doctor})</option>
                  <option value="assistant">Asistente ({roleCounts.assistant})</option>
                  <option value="patient">Paciente ({roleCounts.patient})</option>
                </select>
              </div>

              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-transparent text-xs font-semibold text-slate-700 py-1 px-2 focus:outline-none cursor-pointer"
                >
                  <option value="all">Todos los Estados</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="suspended">Suspendido</option>
                </select>
              </div>

              {(searchQuery || roleFilter !== 'all' || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setRoleFilter('all');
                    setStatusFilter('all');
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold px-2 py-1"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => {
              const isCurrent = user.id === currentUser.id;
              return (
                <div
                  key={user.id}
                  className={`bg-white rounded-2xl border transition-all p-4 flex flex-col justify-between ${
                    isCurrent
                      ? 'border-indigo-400 ring-2 ring-indigo-400/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div>
                    {/* Header: Avatar, Name, Role */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs ${user.avatarColor || getRoleColor(user.role)}`}>
                          {user.firstName.charAt(0)}
                          {user.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-slate-900 text-sm leading-tight">
                              {user.firstName} {user.lastName}
                            </h3>
                            {isCurrent && (
                              <span className="bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                                TÚ
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono">@{user.username}</p>
                        </div>
                      </div>

                      {/* Status badge */}
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                          user.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : user.status === 'inactive'
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {user.status === 'active' ? 'Activo' : user.status === 'inactive' ? 'Inactivo' : 'Suspendido'}
                      </span>
                    </div>

                    {/* Role Pill & Specific attributes */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          {getRoleIcon(user.role)}
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getRoleBadgeStyle(user.role)}`}>
                            {getRoleBadgeName(user.role)}
                          </span>
                        </div>
                        {user.twoFactorEnabled && (
                          <span className="flex items-center gap-1 text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
                            <Lock className="w-3 h-3 text-indigo-600" /> 2FA
                          </span>
                        )}
                      </div>

                      {/* Specialized Attributes Details */}
                      <div className="bg-slate-50 rounded-xl p-2.5 text-[11px] space-y-1 text-slate-600 border border-slate-100">
                        {user.role === 'doctor' && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Colegiatura:</span>
                              <span className="font-semibold text-slate-800">{user.licenseNumber || 'COP Registrado'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Especialidad:</span>
                              <span className="font-semibold text-slate-800 truncate max-w-[140px]">{user.specialty || 'Odontología'}</span>
                            </div>
                          </>
                        )}

                        {user.role === 'assistant' && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Turno:</span>
                              <span className="font-semibold text-slate-800 capitalize">
                                {user.shift === 'morning' ? 'Mañana' : user.shift === 'afternoon' ? 'Tarde' : 'Completo'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Área:</span>
                              <span className="font-semibold text-slate-800">Recepción / Gabinete</span>
                            </div>
                          </>
                        )}

                        {user.role === 'patient' && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">Ficha Clínica:</span>
                              {user.associatedPatientId ? (
                                <button
                                  type="button"
                                  onClick={() => onNavigateToPatient && onNavigateToPatient(user.associatedPatientId!)}
                                  className="font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 underline"
                                >
                                  Ver Paciente #{user.associatedPatientId}
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </button>
                              ) : (
                                <span className="text-amber-600 font-medium">Sin vincular</span>
                              )}
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">DNI:</span>
                              <span className="font-semibold text-slate-800">{user.idNumber}</span>
                            </div>
                          </>
                        )}

                        {user.role === 'admin' && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Nivel de Acceso:</span>
                            <span className="font-bold text-indigo-700">Superadmin (Sin límites)</span>
                          </div>
                        )}

                        <div className="flex justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                          <span className="text-slate-400">Último acceso:</span>
                          <span className="text-slate-500">{user.lastLogin || 'Reciente'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {/* Switch role/impersonate button */}
                    <button
                      type="button"
                      onClick={() => {
                        onSwitchUser(user);
                        onAddAuditLog({
                          userId: currentUser.id,
                          userName: `${currentUser.firstName} ${currentUser.lastName}`,
                          userRole: currentUser.role,
                          action: 'ROLE_SWITCH',
                          targetEntity: 'USER',
                          details: `Cambió la sesión activa a @${user.username} (${getRoleBadgeName(user.role)})`,
                        });
                      }}
                      className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        isCurrent
                          ? 'bg-slate-100 text-slate-400 cursor-default'
                          : 'bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700'
                      }`}
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>{isCurrent ? 'En sesión' : 'Simular perfil'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(user)}
                        title="Editar usuario"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleDelete(user)}
                          title="Eliminar usuario"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredUsers.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-sm">No se encontraron usuarios</h3>
              <p className="text-xs text-slate-500 mt-1">Pruebe ajustando los filtros de búsqueda o rol.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PERMISSIONS MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
            <h3 className="font-black text-slate-900 text-base mb-1 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              Matriz de Control de Acceso por Roles (RBAC)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Configuración de permisos y alcance operativo por perfil dentro del sistema OdontoDesa.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="py-3 px-4 font-extrabold text-slate-700">Módulo / Capacidad</th>
                    <th className="py-3 px-4 font-bold text-indigo-700 text-center">
                      <div className="flex flex-col items-center">
                        <span>🛡️ Administrador</span>
                        <span className="text-[10px] font-normal text-slate-400">Acceso Total</span>
                      </div>
                    </th>
                    <th className="py-3 px-4 font-bold text-sky-700 text-center">
                      <div className="flex flex-col items-center">
                        <span>🩺 Odontólogo</span>
                        <span className="text-[10px] font-normal text-slate-400">Clínico & FDI</span>
                      </div>
                    </th>
                    <th className="py-3 px-4 font-bold text-amber-700 text-center">
                      <div className="flex flex-col items-center">
                        <span>📋 Asistente</span>
                        <span className="text-[10px] font-normal text-slate-400">Recepción & Stock</span>
                      </div>
                    </th>
                    <th className="py-3 px-4 font-bold text-teal-700 text-center">
                      <div className="flex flex-col items-center">
                        <span>👤 Paciente</span>
                        <span className="text-[10px] font-normal text-slate-400">Portal Propio</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      Ver Pacientes y Fichas Odontodesa
                    </td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center text-slate-400 text-[10px] font-medium">Solo su ficha</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      Editar Odontograma Anatómico & Diagnóstico
                    </td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center text-slate-400 text-[10px]">Lectura</td>
                    <td className="py-3 px-4 text-center text-slate-400 text-[10px]">Lectura</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      Crear Planes de Tratamiento (21 Ítems)
                    </td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center text-slate-400 text-[10px]">Lectura</td>
                    <td className="py-3 px-4 text-center text-slate-400 text-[10px]">Lectura</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      Registrar Evolución Clínica & Entregas/Saldos
                    </td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center text-slate-400 text-[10px]">Solo pagos</td>
                    <td className="py-3 px-4 text-center text-slate-400 text-[10px]">Lectura</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      Agendamiento de Citas & Control de Sillones
                    </td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center text-slate-400 text-[10px]">Solicitar cita</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      Control de Stock e Inventario de Materiales
                    </td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center text-slate-400 text-[10px]">Consumo</td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      Facturación, Cobros y Aranceles
                    </td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center text-slate-400 text-[10px]">Presupuestos</td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center text-slate-400 text-[10px]">Ver recibos</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      Gestión de Usuarios & Roles
                    </td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      Configuración de Clínica & Tarifario Base
                    </td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      Auditoría de Seguridad & Trazabilidad
                    </td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  Registro de Auditoría & Actividad del Sistema
                </h3>
                <p className="text-xs text-slate-500">
                  Trazabilidad obligatoria de accesos y modificaciones para cumplimiento normativo y seguridad médica.
                </p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full">
                {auditLogs.length} eventos registrados
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                      log.action === 'CREATE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : log.action === 'UPDATE'
                        ? 'bg-sky-100 text-sky-700'
                        : log.action === 'DELETE'
                        ? 'bg-rose-100 text-rose-700'
                        : log.action === 'ROLE_SWITCH'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {log.action === 'CREATE' ? '+' : log.action === 'UPDATE' ? '✎' : log.action === 'DELETE' ? '✕' : '⚡'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{log.userName}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getRoleBadgeStyle(log.userRole)}`}>
                          {getRoleBadgeName(log.userRole)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">[{log.targetEntity}]</span>
                      </div>
                      <p className="text-xs text-slate-700 mt-0.5">{log.details}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-[11px] font-mono text-slate-500">{log.timestamp}</p>
                    {log.ipAddress && <p className="text-[10px] text-slate-400 font-mono">IP: {log.ipAddress}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PATIENT PORTAL PREVIEW */}
      {activeTab === 'patient_portal' && (
        <div className="space-y-4">
          {/* Patient Selector */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Simulador de Portal del Paciente</h3>
              <p className="text-xs text-slate-500">
                Seleccione un usuario paciente para visualizar su experiencia de autoservicio clínico.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedPatientUserId}
                onChange={(e) => setSelectedPatientUserId(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {users
                  .filter((u) => u.role === 'patient')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} (@{p.username})
                    </option>
                  ))}
              </select>

              {selectedPatientUser && (
                <button
                  type="button"
                  onClick={() => onSwitchUser(selectedPatientUser)}
                  className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Ingresar como este paciente</span>
                </button>
              )}
            </div>
          </div>

          {/* Patient Portal Mock Dashboard */}
          {selectedPatientUser && (
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 space-y-6">
              {/* Portal Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center font-black text-white text-lg">
                    {selectedPatientUser.firstName.charAt(0)}
                    {selectedPatientUser.lastName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black tracking-tight">
                        ¡Hola, {selectedPatientUser.firstName}!
                      </h2>
                      <span className="bg-teal-500/20 text-teal-400 border border-teal-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        Portal Paciente Verificado
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Ficha Odontológica #{selectedPatientData?.idNumber || selectedPatientUser.idNumber} • Clínica OdontoDesa
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Doctor Tratante</span>
                  <span className="text-sm font-bold text-teal-300">
                    {selectedPatientData?.responsibleDoctor || clinicSettings.doctors[0]?.name || 'Dr. Carlos Mendoza'}
                  </span>
                </div>
              </div>

              {/* Bento Grid Patient View */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1: Próxima Cita */}
                <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" /> Próxima Cita
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      Confirmada
                    </span>
                  </div>
                  <div>
                    <p className="text-base font-bold text-white">Viernes, 28 de Agosto</p>
                    <p className="text-xs text-slate-400">10:30 AM (Sillón 1 - Principal)</p>
                  </div>
                  <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl">
                    Control de evolución de resina y fluorización dental.
                  </p>
                </div>

                {/* Card 2: Estado del Plan de Tratamiento */}
                <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                      <FileText className="w-4 h-4" /> Plan de Tratamiento
                    </span>
                    <span className="bg-sky-500/20 text-sky-400 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      En Progreso
                    </span>
                  </div>
                  <div>
                    <p className="text-base font-bold text-white">Rehabilitación & Estética</p>
                    <p className="text-xs text-slate-400">3 de 5 procedimientos completados</p>
                  </div>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-teal-500 h-full w-3/5 rounded-full" />
                  </div>
                </div>

                {/* Card 3: Estado de Cuenta y Pagos */}
                <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4" /> Saldo & Recibos
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      Al día
                    </span>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">S/ 0.00</p>
                    <p className="text-xs text-slate-400">Sin saldos pendientes</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateToPatient && selectedPatientData && onNavigateToPatient(selectedPatientData.id)}
                    className="w-full py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-bold text-xs rounded-xl transition-colors text-center block"
                  >
                    Ver Ficha Odontodesa Completa
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT USER MODAL */}
      {isModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  {isNewUser ? <Plus className="w-5 h-5" /> : <Edit2 className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {isNewUser ? 'Crear Nuevo Usuario' : `Editar Usuario @${editingUser.username}`}
                  </h3>
                  <p className="text-xs text-slate-500">Asigne el rol y configure los permisos de acceso al sistema</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="px-6 pt-2 border-b border-slate-200 bg-white flex gap-3 overflow-x-auto text-xs">
              <button
                type="button"
                onClick={() => setActiveModalTab('general')}
                className={`pb-2.5 font-bold border-b-2 transition-all ${
                  activeModalTab === 'general'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Datos Básicos & Rol
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('role_fields')}
                className={`pb-2.5 font-bold border-b-2 transition-all ${
                  activeModalTab === 'role_fields'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Detalles del Perfil ({getRoleBadgeName(editingUser.role || 'assistant')})
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('permissions')}
                className={`pb-2.5 font-bold border-b-2 transition-all ${
                  activeModalTab === 'permissions'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Permisos Granulares
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('security')}
                className={`pb-2.5 font-bold border-b-2 transition-all ${
                  activeModalTab === 'security'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Seguridad & Claves
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* TAB: GENERAL */}
              {activeModalTab === 'general' && (
                <div className="space-y-4">
                  {/* Role Selector Bento */}
                  <div>
                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-2">
                      Seleccionar Rol del Perfil
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'admin', label: 'Administrador', icon: <ShieldCheck className="w-4 h-4" />, desc: 'Acceso Total' },
                        { id: 'doctor', label: 'Odontólogo', icon: <Stethoscope className="w-4 h-4" />, desc: 'Clínico & FDI' },
                        { id: 'assistant', label: 'Asistente', icon: <UserCheck className="w-4 h-4" />, desc: 'Recepción & Caja' },
                        { id: 'patient', label: 'Paciente', icon: <Users className="w-4 h-4" />, desc: 'Portal Paciente' },
                      ].map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            const newRole = r.id as UserRole;
                            setEditingUser({
                              ...editingUser,
                              role: newRole,
                              permissions: { ...ROLE_DEFAULT_PERMISSIONS[newRole] },
                            });
                          }}
                          className={`p-3 rounded-2xl border text-left transition-all ${
                            editingUser.role === r.id
                              ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                            {r.icon} {r.label}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">{r.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Personal info fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Nombre de Usuario *</label>
                      <input
                        type="text"
                        value={editingUser.username || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                        placeholder="ej. dr.carlos o asist.lucia"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">DNI / Documento *</label>
                      <input
                        type="text"
                        value={editingUser.idNumber || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, idNumber: e.target.value })}
                        placeholder="ej. 45889912A"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Nombres *</label>
                      <input
                        type="text"
                        value={editingUser.firstName || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                        placeholder="Nombres"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Apellidos *</label>
                      <input
                        type="text"
                        value={editingUser.lastName || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                        placeholder="Apellidos"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Correo Electrónico</label>
                      <input
                        type="email"
                        value={editingUser.email || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                        placeholder="correo@ejemplo.com"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Teléfono / WhatsApp</label>
                      <input
                        type="text"
                        value={editingUser.phone || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                        placeholder="+34 600 000 000"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="pt-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">Estado de la Cuenta</label>
                    <select
                      value={editingUser.status || 'active'}
                      onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as UserStatus })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="active">Activo (Puede iniciar sesión)</option>
                      <option value="inactive">Inactivo (Desactivado temporalmente)</option>
                      <option value="suspended">Suspendido (Bloqueo de seguridad)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* TAB: ROLE SPECIFIC FIELDS */}
              {activeModalTab === 'role_fields' && (
                <div className="space-y-4">
                  {editingUser.role === 'doctor' && (
                    <div className="space-y-3 bg-sky-50/40 p-4 rounded-2xl border border-sky-100">
                      <h4 className="font-bold text-sky-900 text-xs flex items-center gap-1.5">
                        <Stethoscope className="w-4 h-4 text-sky-600" /> Datos Profesionales del Odontólogo
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Colegiatura / COP</label>
                          <input
                            type="text"
                            value={editingUser.licenseNumber || ''}
                            onChange={(e) => setEditingUser({ ...editingUser, licenseNumber: e.target.value })}
                            placeholder="ej. COP-28004123"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Especialidad</label>
                          <input
                            type="text"
                            value={editingUser.specialty || ''}
                            onChange={(e) => setEditingUser({ ...editingUser, specialty: e.target.value })}
                            placeholder="ej. Rehabilitación Oral, Ortodoncia..."
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Gabinete Asignado</label>
                          <select
                            value={editingUser.cabinetAssigned || ''}
                            onChange={(e) => setEditingUser({ ...editingUser, cabinetAssigned: e.target.value })}
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                          >
                            <option value="">Cualquier Gabinete / Rotativo</option>
                            {clinicSettings.cabinets.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {editingUser.role === 'assistant' && (
                    <div className="space-y-3 bg-amber-50/40 p-4 rounded-2xl border border-amber-100">
                      <h4 className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-amber-600" /> Configuración de Asistente
                      </h4>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Turno Laboral</label>
                        <select
                          value={editingUser.shift || 'morning'}
                          onChange={(e) => setEditingUser({ ...editingUser, shift: e.target.value as any })}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                        >
                          <option value="morning">Turno Mañana (08:00 - 14:00)</option>
                          <option value="afternoon">Turno Tarde (14:00 - 20:00)</option>
                          <option value="full_time">Jornada Completa</option>
                          <option value="weekend">Guardias / Fin de Semana</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {editingUser.role === 'patient' && (
                    <div className="space-y-3 bg-teal-50/40 p-4 rounded-2xl border border-teal-100">
                      <h4 className="font-bold text-teal-900 text-xs flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-teal-600" /> Vinculación con Ficha Odontodesa
                      </h4>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Paciente Asociado</label>
                        <select
                          value={editingUser.associatedPatientId || ''}
                          onChange={(e) => setEditingUser({ ...editingUser, associatedPatientId: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                        >
                          <option value="">Seleccionar paciente de la base de datos...</option>
                          {patients.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.firstName} {p.lastName} (DNI: {p.idNumber})
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-teal-700 mt-1">
                          Al vincular, el paciente podrá consultar sus odontogramas, citas y recibos en su portal.
                        </p>
                      </div>
                    </div>
                  )}

                  {editingUser.role === 'admin' && (
                    <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 text-xs text-indigo-900">
                      <p className="font-bold">🛡️ Administrador del Sistema</p>
                      <p className="text-[11px] text-indigo-700 mt-1">
                        Este perfil posee acceso irrestricto a todos los módulos, aranceles, finanzas, inventarios y logs de auditoría.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Notas Internas</label>
                    <textarea
                      rows={3}
                      value={editingUser.notes || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, notes: e.target.value })}
                      placeholder="Observaciones de RRHH, contrato, etc..."
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* TAB: PERMISSIONS */}
              {activeModalTab === 'permissions' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-xs">Permisos Personalizados del Usuario</h4>
                    <button
                      type="button"
                      onClick={() => {
                        if (editingUser.role) {
                          setEditingUser({
                            ...editingUser,
                            permissions: { ...ROLE_DEFAULT_PERMISSIONS[editingUser.role] },
                          });
                        }
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
                    >
                      Restablecer al Rol {getRoleBadgeName(editingUser.role || 'assistant')}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { key: 'canViewPatients', label: 'Ver Pacientes & Odontograma' },
                      { key: 'canEditPatients', label: 'Crear / Editar Ficha Clínica' },
                      { key: 'canDeletePatients', label: 'Eliminar Registros de Paciente' },
                      { key: 'canEditOdontogram', label: 'Modificar Piezas FDI en Odontograma' },
                      { key: 'canManageAppointments', label: 'Gestionar Agenda & Citas' },
                      { key: 'canManageInventory', label: 'Control de Stock e Insumos' },
                      { key: 'canManageBilling', label: 'Facturación & Emisión de Recibos' },
                      { key: 'canManageUsers', label: 'Administrar Usuarios y Roles' },
                      { key: 'canEditClinicSettings', label: 'Configuración General de Clínica' },
                      { key: 'canViewAuditLogs', label: 'Visualizar Registros de Auditoría' },
                    ].map((perm) => (
                      <label
                        key={perm.key}
                        className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(editingUser.permissions?.[perm.key as keyof UserPermissions])}
                          onChange={(e) => {
                            const perms = {
                              ...(editingUser.permissions || ROLE_DEFAULT_PERMISSIONS[editingUser.role || 'assistant']),
                              [perm.key]: e.target.checked,
                            };
                            setEditingUser({ ...editingUser, permissions: perms as any });
                          }}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-slate-800 font-medium">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: SECURITY */}
              {activeModalTab === 'security' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-indigo-600" />
                      {isNewUser ? 'Definir Contraseña Inicial' : 'Restablecer Contraseña'}
                    </h4>

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Ingrese nueva contraseña..."
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl pr-10 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPasswordInput(`Odonto${Math.floor(1000 + Math.random() * 9000)}*`)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Generar Clave Segura Aleatoria
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={Boolean(editingUser.twoFactorEnabled)}
                        onChange={(e) => setEditingUser({ ...editingUser, twoFactorEnabled: e.target.checked })}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">Exigir Autenticación en Dos Pasos (2FA)</span>
                        <span className="text-[11px] text-slate-500">Solicita código de seguridad vía SMS o app autenticadora.</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveModal}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                {isNewUser ? 'Crear Usuario' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
