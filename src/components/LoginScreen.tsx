import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  Stethoscope,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  FileText,
  Clock,
  ArrowRight,
  ClockFading,
} from 'lucide-react';
import { AppUser } from '../types';
import {api} from "../services/api";

interface LoginScreenProps {
  users: AppUser[];
  onLogin: (user: AppUser) => void;
  defaultClinicName?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  onLogin,
  defaultClinicName = 'ODONTODESA',
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedQuickUser, setSelectedQuickUser] = useState<string | null>('usr-1');

  // Find user by username, email, or alias
  const findMatchingUser = (input: string): AppUser | undefined => {
    const clean = input.trim().toLowerCase();
    if (!clean) return undefined;

    return users.find((u) => {
      const uName = u.username.toLowerCase();
      const uEmail = u.email.toLowerCase();
      const uFullName = `${u.firstName} ${u.lastName}`.toLowerCase();

      // Direct matches
      if (uName === clean || uEmail === clean) return true;

      // Common aliases support
      if (clean === 'eramos' && uName.includes('elena')) return true;
      if (clean === 'cmendoza' && uName.includes('carlos')) return true;
      if (clean === 'lfernandez' && uName.includes('lucia')) return true;
      if (clean === 'jvaldivia' && (u.role === 'patient' || uName.includes('sofia'))) return true;
      if (clean === 'admin' && u.role === 'admin') return true;
      if (clean === 'doctor' && u.role === 'doctor') return true;
      if (clean === 'asistente' && u.role === 'assistant') return true;
      if (clean === 'paciente' && u.role === 'patient') return true;

      return uFullName.includes(clean);
    });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleanId = identifier.trim();
    const cleanPass = password.trim();
    console.log("celanId",cleanId)
    if (!cleanId) {
      setErrorMessage('Por favor ingrese su usuario o correo electrónico.');
      return;
    }

    if (!cleanPass) {
      setErrorMessage('Por favor ingrese su contraseña.');
      return;
    }

      try {

        setIsLoading(true);
        const respuesta = await api.login(cleanId,cleanPass);
        console.log("RESPUESTA COMPLETA:", respuesta);
        console.log("respuesta.success:", respuesta.success);
        console.log("respuesta.user:", respuesta.user);
        console.log("respuesta.token:", respuesta.token);
        if (respuesta.success) {
          console.log("ENTRÓ AL IF SUCCESS");
          onLogin(respuesta.user);

        }
        if (!respuesta.success) {
          console.log("NO ENTRÓ AL IF SUCCESS",respuesta );
          //onLogin(respuesta.user);
          setErrorMessage(respuesta.error);

        }

    }catch{

    }finally{
      setIsLoading(false);


    }



  };

  const handleQuickSelect = (user: AppUser) => {
    setSelectedQuickUser(user.id);
    setIdentifier(user.username);
    setPassword('Dental2026*');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row z-10">

        {/* Left Panel: Clinical Branding & Info */}
        <div className="md:w-5/12 bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white p-8 sm:p-10 flex flex-col justify-between relative">
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

          <div>
            {/* Logo Badge */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-teal-400 p-0.5 shadow-lg shadow-blue-500/30 flex items-center justify-center">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                  <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
                    🦷
                  </span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-1.5">
                  <span>{defaultClinicName}</span>
                  <span className="text-teal-400 text-xs px-2 py-0.5 rounded-full bg-teal-400/10 border border-teal-400/20 font-bold">
                    v2.0
                  </span>
                </h1>
                <p className="text-xs text-blue-200 font-medium">Salud Dental Integral</p>
              </div>
            </div>

            <div className="space-y-4 my-6">
              <h2 className="text-xl font-bold text-slate-100 leading-snug">
                Sistema Clínico & Historia Odontológica Integral
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Plataforma integral con Historia Clínica Oficial Odontodesa, Odontograma interactivo FDI, agenda de citas por sillón, presupuestos y control de insumos.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-slate-200 bg-white/5 p-2.5 rounded-xl border border-white/10">
                <FileText className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Historia Clínica Oficial en 2 páginas imprimibles</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-200 bg-white/5 p-2.5 rounded-xl border border-white/10">
                <Stethoscope className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Odontograma FDI de 52 piezas permanente y decidua</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-200 bg-white/5 p-2.5 rounded-xl border border-white/10">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Control de roles RBAC (Admin, Doctor, Asistente, Paciente)</span>
              </div>
            </div>
          </div>

          {/* Footer of Left Panel */}
          <div className="pt-8 mt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              Acceso Seguro SSL / RBAC
            </span>
            <span>Odonto-pro 2026</span>
          </div>
        </div>

        {/* Right Panel: Login Form & Quick Roles */}
        <div className="md:w-7/12 p-8 sm:p-10 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Iniciar Sesión
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Ingrese sus credenciales para ingresar al sistema.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                <KeyRound className="w-3.5 h-3.5" />

              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLoginSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Usuario o Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Ej. admin.elena, dr.carlos, asist.lucia..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all font-medium text-slate-900"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Contraseña
                  </label>

                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all font-medium text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-600 font-medium">Recordar sesión</span>
                </label>
                {/*
                <button
                  type="button"
                  onClick={() => {
                    setPassword('Dental2026*');
                    setErrorMessage(null);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Restablecer clave demo
                </button>
              */}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 hover:from-blue-700 hover:via-indigo-700 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-75 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Entrar al Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Access Roles */}
            <div className="mt-6 pt-5 border-t border-slate-100">


            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Servidor Seguro & Base de Datos Conectada
            </span>
            <span>ODONTODESA 2026</span>
          </div>
        </div>

      </div>
    </div>
  );
};