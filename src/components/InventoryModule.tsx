import React, { useState } from 'react';
import {
  InventoryItem,
  InventoryMovement,
  MaterialCategory,
  ClinicSettings,
} from '../types';
import {
  Package,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Search,
  Plus,
  Filter,
  Layers,
  Calendar,
  DollarSign,
  TrendingDown,
  Clock,
  CheckCircle,
  Truck,
  Edit2,
  Trash2,
} from 'lucide-react';
import { api } from '../services/api';

interface InventoryModuleProps {
  inventory: InventoryItem[];
  movements: InventoryMovement[];
  clinicSettings: ClinicSettings;
  onSaveItem: (item: InventoryItem) => void;
  onDeleteItem: (itemId: string) => void;
  onRecordMovement: (movement: InventoryMovement) => void;
}

const CATEGORIES: MaterialCategory[] = [
  'Anestesia',
  'Restauración & Resinas',
  'Endodoncia',
  'Ortodoncia',
  'Desechables & EPI',
  'Instrumental & Fresas',
  'Impresión & Prótesis',
  'Quirúrgico & Suturas',
  'Higiene & Profilaxis',
];

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  inventory,
  movements,
  clinicSettings,
  onSaveItem,
  onDeleteItem,
  onRecordMovement,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterStockStatus, setFilterStockStatus] = useState<'all' | 'low_stock' | 'expiring_soon'>('all');
  const [activeTab, setActiveTab] = useState<'catalog' | 'movements'>('catalog');

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<InventoryItem> | null>(null);

  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedItemForStock, setSelectedItemForStock] = useState<InventoryItem | null>(null);
  const [stockDelta, setStockDelta] = useState<number>(1);
  const [stockMovementType, setStockMovementType] = useState<
    'in_purchase' | 'out_treatment' | 'adjustment_positive' | 'adjustment_negative' | 'waste_expired'
  >('in_purchase');
  const [stockReason, setStockReason] = useState('');

  // Date helper for expiration check (next 90 days)
  const today = new Date();
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(today.getDate() + 90);

  const filteredInventory = inventory.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(term) ||
      item.code.toLowerCase().includes(term) ||
      item.supplier.toLowerCase().includes(term) ||
      item.batchNumber.toLowerCase().includes(term);

    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;

    const isLow = item.currentStock <= item.minStock;
    const itemExpiry = new Date(item.expiryDate);
    const isExpiring = itemExpiry <= ninetyDaysFromNow;

    if (filterStockStatus === 'low_stock') return matchesSearch && matchesCategory && isLow;
    if (filterStockStatus === 'expiring_soon') return matchesSearch && matchesCategory && isExpiring;
    return matchesSearch && matchesCategory;
  });

  // Calculate high level metrics
  const totalItemsCount = inventory.length;
  const lowStockCount = inventory.filter((i) => i.currentStock <= i.minStock).length;
  const expiringCount = inventory.filter((i) => new Date(i.expiryDate) <= ninetyDaysFromNow).length;
  const totalValuation = inventory.reduce((acc, i) => acc + i.currentStock * i.costPrice, 0);

  const handleOpenNewItem = () => {
    setEditingItem({
      code: `INS-0${inventory.length + 1}`.padStart(7, '0'),
      name: '',
      category: 'Restauración & Resinas',
      unit: 'Unidad',
      currentStock: 5,
      minStock: 2,
      reorderPoint: 5,
      costPrice: 25.0,
      supplier: 'Depósito Dental Principal',
      batchNumber: `LOT-${Date.now().toString().slice(-5)}`,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lastRestockedDate: new Date().toISOString().split('T')[0],
      locationInClinic: 'Almacén Central',
    });
    setShowItemModal(true);
  };

  const handleSaveItemForm =  async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(editingItem)
    if (!editingItem?.name || !editingItem?.category) return;

    const itemToSave: InventoryItem = {
      id: editingItem.id || `mat-${Date.now()}`,
      code: editingItem.code || `INS-${Date.now().toString().slice(-4)}`,
      name: editingItem.name,
      category: editingItem.category as MaterialCategory,
      unit: editingItem.unit || 'Unidad',
      currentStock: Number(editingItem.currentStock) || 0,
      minStock: Number(editingItem.minStock) || 1,
      reorderPoint: Number(editingItem.reorderPoint) || 3,
      costPrice: Number(editingItem.costPrice) || 0,
      supplier: editingItem.supplier || 'Distribuidor Dental',
      batchNumber: editingItem.batchNumber || 'LOT-GENERAL',
      expiryDate: editingItem.expiryDate || '2028-01-01',
      lastRestockedDate: editingItem.lastRestockedDate || new Date().toISOString().split('T')[0],
      locationInClinic: editingItem.locationInClinic || 'Gabinete 1',
    };

    const respuesta = await api.saveInventoryItem(itemToSave);
    console.log(respuesta);
    onSaveItem(itemToSave);
    setShowItemModal(false);

  };

  const handleExecuteStockMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForStock || stockDelta <= 0) return;

    const prev = selectedItemForStock.currentStock;
    let newStock = prev;

    if (stockMovementType === 'in_purchase' || stockMovementType === 'adjustment_positive') {
      newStock = prev + stockDelta;
    } else {
      newStock = Math.max(0, prev - stockDelta);
    }

    const updatedItem: InventoryItem = {
      ...selectedItemForStock,
      currentStock: newStock,
      lastRestockedDate:
        stockMovementType === 'in_purchase'
          ? new Date().toISOString().split('T')[0]
          : selectedItemForStock.lastRestockedDate,
    };

    onSaveItem(updatedItem);

    const movement: InventoryMovement = {
      id: `mov-${Date.now()}`,
      materialId: selectedItemForStock.id,
      materialName: selectedItemForStock.name,
      type: stockMovementType,
      quantity: stockDelta,
      previousStock: prev,
      newStock: newStock,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      reason: stockReason || 'Ajuste manual de almacén',
      performedBy: 'Administración Clínica Dental',
    };

    onRecordMovement(movement);
    setShowStockModal(false);
    setStockReason('');
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Control de Inventario y Materiales Dentales
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión de stock, lotes, fechas de vencimiento, anestesias, resinas e insumos clínicos.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenNewItem}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Insumo / Material
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Insumos Totales</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 mt-1.5 block">
            {totalItemsCount}
          </span>
          <span className="text-[11px] text-slate-400">Artículos registrados</span>
        </div>

        <div
          onClick={() => setFilterStockStatus(filterStockStatus === 'low_stock' ? 'all' : 'low_stock')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            filterStockStatus === 'low_stock'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-rose-700 font-bold">
            <span>Stock Crítico / Bajo</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-2xl font-black text-rose-700 mt-1.5 block">
            {lowStockCount}
          </span>
          <span className="text-[11px] text-rose-600 font-medium">Requieren reorden</span>
        </div>

        <div
          onClick={() => setFilterStockStatus(filterStockStatus === 'expiring_soon' ? 'all' : 'expiring_soon')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            filterStockStatus === 'expiring_soon'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-700 font-bold">
            <span>Próximos a Vencer</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-black text-amber-700 mt-1.5 block">
            {expiringCount}
          </span>
          <span className="text-[11px] text-amber-600 font-medium">En menos de 90 días</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Valorización Almacén</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 mt-1.5 block">
            {totalValuation.toFixed(2)} {clinicSettings.currencySymbol}
          </span>
          <span className="text-[11px] text-slate-400">Costo total en existencias</span>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'catalog'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Catálogo de Materiales ({filteredInventory.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('movements')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'movements'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kardex / Movimientos ({movements.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {filterStockStatus !== 'all' && (
              <button
                type="button"
                onClick={() => setFilterStockStatus('all')}
                className="px-2.5 py-1 text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg"
              >
                Limpiar filtro de estado ✕
              </button>
            )}
          </div>
        </div>

        {activeTab === 'catalog' && (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="sm:col-span-6 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por código, nombre de resina/anestésico, lote, proveedor..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="sm:col-span-6">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value="all">Todas las Categorías Clínicas</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'catalog' ? (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Código & Insumo</th>
                  <th className="py-3 px-3">Categoría</th>
                  <th className="py-3 px-3 text-center">Stock Actual</th>
                  <th className="py-3 px-3">Lote / Vencimiento</th>
                  <th className="py-3 px-3">Ubicación</th>
                  <th className="py-3 px-3 text-right">Precio Costo</th>
                  <th className="py-3 px-4 text-right">Ajustes & Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      No se encontraron insumos con los criterios actuales.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => {
                    const isLow = item.currentStock <= item.minStock;
                    const itemExpiry = new Date(item.expirationDate);
                    const isExpiring = itemExpiry <= ninetyDaysFromNow;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm font-semibold">
                              {item.code}
                            </span>
                            <span className="font-bold text-slate-900">{item.name}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {item.supplier} • Presentación: {item.unit}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium text-[11px]">
                            {item.category}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`text-sm font-black px-2.5 py-0.5 rounded-full ${
                                isLow
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {item.currentStock} {(item.unit || '').split(' ')[0] || item.unit || 'uds'}
                            </span>
                            {isLow && (
                              <span className="text-[10px] text-rose-600 font-bold mt-0.5">
                                Min: {item.minStock}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-slate-800 text-[11px]">
                            {item.batchNumber}
                          </div>
                          <span
                            className={`text-[11px] font-medium flex items-center gap-1 ${
                              isExpiring ? 'text-amber-600 font-bold' : 'text-slate-500'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {item.expirationDate}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-slate-600 text-[11px]">
                          {item.location}
                        </td>

                        <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                          {item.costPrice.toFixed(2)} {clinicSettings.currencySymbol}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedItemForStock(item);
                                setStockMovementType('in_purchase');
                                setStockDelta(1);
                                setShowStockModal(true);
                              }}
                              className="px-2.5 py-1 text-xs bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-lg border border-sky-200"
                              title="Registrar entrada / salida de stock"
                            >
                              Ajustar Stock
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingItem(item);
                                setShowItemModal(true);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
                              title="Editar Insumo"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteItem(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                              title="Eliminar Insumo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Movements / Kardex View */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Fecha / Hora</th>
                  <th className="py-3 px-4">Insumo Afectado</th>
                  <th className="py-3 px-4">Tipo de Movimiento</th>
                  <th className="py-3 px-4 text-center">Cantidad</th>
                  <th className="py-3 px-4 text-center">Saldo Resultante</th>
                  <th className="py-3 px-4">Motivo / Paciente</th>
                  <th className="py-3 px-4">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No hay movimientos registrados en el kardex.
                    </td>
                  </tr>
                ) : (
                  movements.map((mov) => {
                    const isPositive =
                      mov.type === 'in_purchase' || mov.type === 'adjustment_positive';

                    return (
                      <tr key={mov.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {mov.date}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {mov.materialName}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isPositive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isPositive ? (
                              <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 text-rose-600" />
                            )}
                            {mov.type === 'in_purchase' && 'Entrada por Compra'}
                            {mov.type === 'out_treatment' && 'Consumo en Tratamiento'}
                            {mov.type === 'adjustment_positive' && 'Ajuste Positivo (+)'}
                            {mov.type === 'adjustment_negative' && 'Ajuste Negativo (-)'}
                            {mov.type === 'waste_expired' && 'Baja por Vencimiento'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-black text-slate-900">
                          {isPositive ? `+${mov.quantity}` : `-${mov.quantity}`}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-slate-700">
                          {mov.previousStock} →{' '}
                          <span className="font-bold text-slate-900">{mov.newStock}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <div>{mov.reason}</div>
                          {mov.patientName && (
                            <span className="text-[10px] text-sky-600 font-medium">
                              Paciente: {mov.patientName}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {mov.performedBy}
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

      {/* Modal: Add / Edit Item */}
      {showItemModal && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden my-8 animate-fadeIn">
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {editingItem.id ? 'Editar Insumo' : 'Registrar Insumo / Material'}
                </h3>
                <p className="text-xs text-slate-400">
                  Control de existencias, punto de reorden y presentación.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItemForm} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Código</label>
                  <input
                    type="text"
                    required
                    value={editingItem.code || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Nombre del Insumo *</label>
                  <input
                    type="text"
                    required
                    value={editingItem.name || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    placeholder="Ej. Resina Filtek Z350 A2 4g"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Categoría</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as MaterialCategory })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Unidad / Presentación</label>
                  <input
                    type="text"
                    value={editingItem.unit || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    placeholder="Ej. Caja x 50 cartuchos / Jeringa 4g"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Stock Actual</label>
                  <input
                    type="number"
                    min="0"
                    value={editingItem.currentStock ?? 0}
                    onChange={(e) => setEditingItem({ ...editingItem, currentStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Stock Mínimo (Alerta)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingItem.minStock ?? 2}
                    onChange={(e) => setEditingItem({ ...editingItem, minStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Costo Unitario</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingItem.costPrice ?? 0}
                    onChange={(e) => setEditingItem({ ...editingItem, costPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Número de Lote</label>
                  <input
                    type="text"
                    value={editingItem.batchNumber || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, batchNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Fecha de Vencimiento</label>
                  <input
                    type="date"
                    value={editingItem.expiryDate || '2028-01-01'}
                    onChange={(e) => setEditingItem({ ...editingItem, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Proveedor Habitual</label>
                  <input
                    type="text"
                    value={editingItem.supplier || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Ubicación en Clínica</label>
                  <input
                    type="text"
                    value={editingItem.locationInClinic || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, locationInClinic: e.target.value })}
                    placeholder="Ej. Gabinete 1 - Gaveta 2"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Guardar Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Stock Adjustment */}
      {showStockModal && selectedItemForStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden my-8 animate-fadeIn">
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Registrar Entrada / Salida de Stock</h3>
                <p className="text-xs text-slate-400">{selectedItemForStock.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowStockModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteStockMovement} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px]">Stock Actual en Sistema:</span>
                  <span className="text-lg font-black text-slate-900">
                    {selectedItemForStock.currentStock} {selectedItemForStock.unit}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[11px]">Lote:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedItemForStock.batchNumber}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tipo de Movimiento</label>
                <select
                  value={stockMovementType}
                  onChange={(e) => setStockMovementType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="in_purchase">Entrada por Compra / Recepción de Pedido (+)</option>
                  <option value="out_treatment">Salida por Uso / Tratamiento Clínico (-)</option>
                  <option value="adjustment_positive">Ajuste de Conteo Físico Positivo (+)</option>
                  <option value="adjustment_negative">Ajuste de Conteo Físico Negativo (-)</option>
                  <option value="waste_expired">Baja por Deterioro o Vencimiento (-)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Cantidad ({selectedItemForStock.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={stockDelta}
                  onChange={(e) => setStockDelta(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Motivo / Justificación</label>
                <input
                  type="text"
                  required
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  placeholder="Ej. Factura Compra DEP-4412 / Procedimiento Cirugía"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Confirmar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
