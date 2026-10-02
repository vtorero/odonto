import React, { useState } from 'react';
import { ClinicSettings, ProcedureCatalogItem, DentalDoctor } from '../types';
import {
  Settings as SettingsIcon,
  Building,
  UserCheck,
  Grid,
  FileSpreadsheet,
  Plus,
  Trash2,
  Save,
  Check,
  Stethoscope,
  Sparkles,
} from 'lucide-react';

interface SettingsModuleProps {
  clinicSettings: ClinicSettings;
  procedureCatalog: ProcedureCatalogItem[];
  onSaveSettings: (settings: ClinicSettings) => void;
  onSaveProcedureCatalog: (catalog: ProcedureCatalogItem[]) => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  clinicSettings,
  procedureCatalog,
  onSaveSettings,
  onSaveProcedureCatalog,
}) => {
  const [formData, setFormData] = useState<ClinicSettings>(clinicSettings);
  const [catalogData, setCatalogData] = useState<ProcedureCatalogItem[]>(procedureCatalog);
  const [activeSubTab, setActiveSubTab] = useState<'clinic' | 'doctors' | 'cabinets' | 'catalog'>('clinic');
  const [showSavedToast, setShowSavedToast] = useState(false);

  // New Doctor draft state
  const [newDoctor, setNewDoctor] = useState<Partial<DentalDoctor>>({
    name: '',
    specialty: 'Odontología General',
    licenseNumber: '',
    phone: '+34 600 000 000',
    color: '#0284c7',
    active: true,
  });

  // New Cabinet draft state
  const [newCabinet, setNewCabinet] = useState('');

  // New Procedure draft state
  const [newProc, setNewProc] = useState<Partial<ProcedureCatalogItem>>({
    code: `OD-${(catalogData.length + 1).toString().padStart(3, '0')}`,
    name: '',
    category: 'General',
    defaultPrice: 50,
    durationMinutes: 45,
    suggestedMaterials: [],
  });

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    onSaveProcedureCatalog(catalogData);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const handleAddDoctor = () => {
    if (!newDoctor.name) return;
    const doc: DentalDoctor = {
      id: `doc-${Date.now()}`,
      name: newDoctor.name,
      specialty: newDoctor.specialty || 'General',
      licenseNumber: newDoctor.licenseNumber || 'COP-999',
      phone: newDoctor.phone || '+34 600 000 000',
      color: newDoctor.color || '#0284c7',
      active: true,
    };
    setFormData({
      ...formData,
      doctors: [...formData.doctors, doc],
    });
    setNewDoctor({
      name: '',
      specialty: 'Odontología General',
      licenseNumber: '',
      phone: '+34 600 000 000',
      color: '#0284c7',
      active: true,
    });
  };

  const handleRemoveDoctor = (docId: string) => {
    setFormData({
      ...formData,
      doctors: formData.doctors.filter((d) => d.id !== docId),
    });
  };

  const handleAddCabinet = () => {
    if (!newCabinet) return;
    setFormData({
      ...formData,
      cabinets: [...formData.cabinets, newCabinet],
    });
    setNewCabinet('');
  };

  const handleRemoveCabinet = (idx: number) => {
    setFormData({
      ...formData,
      cabinets: formData.cabinets.filter((_, i) => i !== idx),
    });
  };

  const handleAddProcedure = () => {
    if (!newProc.name) return;
    const procItem: ProcedureCatalogItem = {
      id: `proc-${Date.now()}`,
      code: newProc.code || `OD-${Date.now().toString().slice(-4)}`,
      name: newProc.name,
      category: newProc.category || 'General',
      defaultPrice: Number(newProc.defaultPrice) || 0,
      durationMinutes: Number(newProc.durationMinutes) || 30,
      suggestedMaterials: [],
    };
    setCatalogData([...catalogData, procItem]);
    setNewProc({
      code: `OD-${(catalogData.length + 2).toString().padStart(3, '0')}`,
      name: '',
      category: 'General',
      defaultPrice: 50,
      durationMinutes: 45,
      suggestedMaterials: [],
    });
  };

  const handleRemoveProcedure = (procId: string) => {
    setCatalogData(catalogData.filter((p) => p.id !== procId));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Configuración del Sistema y Clínica Dental
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Personalice datos fiscales, profesionales tratantes, sillones dentales y arancel de precios.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {showSavedToast && (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <Check className="w-4 h-4" /> Configuración Guardada
            </span>
          )}
          <button
            type="button"
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            Guardar Cambios
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setActiveSubTab('clinic')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeSubTab === 'clinic'
              ? 'bg-sky-50 text-sky-700 border border-sky-200'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Building className="w-4 h-4" /> Datos de la Clínica & Fiscales
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('doctors')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeSubTab === 'doctors'
              ? 'bg-sky-50 text-sky-700 border border-sky-200'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <UserCheck className="w-4 h-4" /> Odontólogos & Especialistas ({formData.doctors.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('cabinets')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeSubTab === 'cabinets'
              ? 'bg-sky-50 text-sky-700 border border-sky-200'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Grid className="w-4 h-4" /> Sillones & Gabinetes ({formData.cabinets.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeSubTab === 'catalog'
              ? 'bg-sky-50 text-sky-700 border border-sky-200'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Arancel / Catálogo de Tratamientos ({catalogData.length})
        </button>
      </div>

      {/* Sub Tab: Clinic Info */}
      {activeSubTab === 'clinic' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
            Identificación Comercial y Parámetros de Facturación
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nombre de la Clínica</label>
              <input
                type="text"
                value={formData.clinicName}
                onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">NIF / CIF / RUC Fiscal</label>
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Moneda / Símbolo</label>
              <input
                type="text"
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nombre Impuesto (IVA / IGV)</label>
              <input
                type="text"
                value={formData.taxName}
                onChange={(e) => setFormData({ ...formData, taxName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Tasa Impuesto (%)</label>
              <input
                type="number"
                value={formData.taxRatePercent}
                onChange={(e) => setFormData({ ...formData, taxRatePercent: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Teléfono Clínica</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Correo Electrónico</label>
              <input
                type="text"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Serie de Facturación</label>
              <input
                type="text"
                value={formData.invoiceSeries}
                onChange={(e) => setFormData({ ...formData, invoiceSeries: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Dirección de la Clínica</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Pie de Página en Recibos y Facturas</label>
            <input
              type="text"
              value={formData.receiptFooterNote}
              onChange={(e) => setFormData({ ...formData, receiptFooterNote: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>
      )}

      {/* Sub Tab: Doctors */}
      {activeSubTab === 'doctors' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-5 text-xs">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
            Gestión de Profesionales Odontólogos
          </h3>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 block">Registrar Nuevo Odontólogo:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={newDoctor.name || ''}
                  onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                  placeholder="Ej. Dra. Carmen Morales"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Especialidad</label>
                <input
                  type="text"
                  value={newDoctor.specialty || ''}
                  onChange={(e) => setNewDoctor({ ...newDoctor, specialty: e.target.value })}
                  placeholder="Ej. Ortodoncia / Endodoncia"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Nº Colegiatura / Licencia</label>
                <input
                  type="text"
                  value={newDoctor.licenseNumber || ''}
                  onChange={(e) => setNewDoctor({ ...newDoctor, licenseNumber: e.target.value })}
                  placeholder="Ej. COL-48291"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddDoctor}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs"
            >
              <Plus className="w-4 h-4" /> Agregar Odontólogo
            </button>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-slate-700 block">Odontólogos Registrados:</span>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {formData.doctors.map((doc) => (
                <div key={doc.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-xs">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">{doc.name}</span>
                      <span className="text-slate-500 text-[11px]">
                        {doc.specialty} • Colegiado: {doc.licenseNumber}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDoctor(doc.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab: Cabinets */}
      {activeSubTab === 'cabinets' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-5 text-xs">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
            Gestión de Sillones Dentales y Gabinetes Clínicos
          </h3>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-3">
            <input
              type="text"
              value={newCabinet}
              onChange={(e) => setNewCabinet(e.target.value)}
              placeholder="Ej. Gabinete 4 - Radiología y Cirugía"
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
            />
            <button
              type="button"
              onClick={handleAddCabinet}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs shrink-0"
            >
              <Plus className="w-4 h-4" /> Añadir Sillón
            </button>
          </div>

          <div className="space-y-2">
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {formData.cabinets.map((cab, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Grid className="w-4 h-4 text-sky-600" />
                    <span className="font-bold text-slate-800">{cab}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCabinet(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab: Procedure Catalog */}
      {activeSubTab === 'catalog' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-5 text-xs">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
            Catálogo Oficial de Tratamientos & Precios Base
          </h3>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 block">Agregar Nuevo Tratamiento al Catálogo:</span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Código</label>
                <input
                  type="text"
                  value={newProc.code || ''}
                  onChange={(e) => setNewProc({ ...newProc, code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-600 block mb-1">Nombre del Tratamiento</label>
                <input
                  type="text"
                  value={newProc.name || ''}
                  onChange={(e) => setNewProc({ ...newProc, name: e.target.value })}
                  placeholder="Ej. Blanqueamiento Dental Led"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">
                  Precio ({formData.currencySymbol})
                </label>
                <input
                  type="number"
                  value={newProc.defaultPrice ?? 0}
                  onChange={(e) => setNewProc({ ...newProc, defaultPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddProcedure}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs"
            >
              <Plus className="w-4 h-4" /> Agregar al Arancel
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Procedimiento</th>
                  <th className="py-2.5 px-3">Categoría</th>
                  <th className="py-2.5 px-3 text-right">Precio Base</th>
                  <th className="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {catalogData.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{p.code}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{p.name}</td>
                    <td className="py-2.5 px-3 text-slate-500">{p.category}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-sky-700">
                      {p.defaultPrice.toFixed(2)} {formData.currencySymbol}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveProcedure(p.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
