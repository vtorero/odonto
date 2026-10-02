import React, { useState } from 'react';
import {
  Invoice,
  InvoiceItem,
  PaymentRecord,
  Patient,
  ClinicSettings,
  ProcedureCatalogItem,
  PaymentMethod,
} from '../types';
import confetti from 'canvas-confetti';
import {
  DollarSign,
  FileText,
  Plus,
  Search,
  Filter,
  CreditCard,
  Printer,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Download,
  Eye,
  Trash2,
  Receipt,
  Sparkles,
  Building2,
  Calendar,
} from 'lucide-react';

interface BillingModuleProps {
  invoices: Invoice[];
  patients: Patient[];
  clinicSettings: ClinicSettings;
  procedureCatalog: ProcedureCatalogItem[];
  onSaveInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onOpenPatientRecord?: (patientId: string) => void;
}

export const BillingModule: React.FC<BillingModuleProps> = ({
  invoices,
  patients,
  clinicSettings,
  procedureCatalog,
  onSaveInvoice,
  onDeleteInvoice,
  onOpenPatientRecord,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partially_paid' | 'issued'>('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // New Invoice State
  const [newInvoicePatientId, setNewInvoicePatientId] = useState(patients[0]?.id || '');
  const [newInvoiceDoctor, setNewInvoiceDoctor] = useState(clinicSettings.doctors[0]?.name || '');
  const [newInvoiceItems, setNewInvoiceItems] = useState<InvoiceItem[]>([
    {
      id: `ii-${Date.now()}`,
      description: 'Consulta y Diagnóstico Odontológico',
      quantity: 1,
      unitPrice: 35,
      discount: 0,
      total: 35,
    },
  ]);
  const [newInvoiceTaxRate, setNewInvoiceTaxRate] = useState<number>(clinicSettings.taxRatePercent);

  // Payment Recording State
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Financial Metrics Calculation
  const totalBilled = invoices.reduce((acc, inv) => acc + inv.total, 0);
  const totalCollected = invoices.reduce((acc, inv) => acc + inv.amountPaid, 0);
  const totalPending = invoices.reduce((acc, inv) => acc + inv.balanceDue, 0);
  const averageTicket = invoices.length > 0 ? totalBilled / invoices.length : 0;

  const filteredInvoices = invoices.filter((inv) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(term) ||
      inv.patientName.toLowerCase().includes(term) ||
      inv.patientIdNumber.toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreateInvoice = () => {
    setNewInvoicePatientId(patients[0]?.id || '');
    setNewInvoiceDoctor(clinicSettings.doctors[0]?.name || '');
    setNewInvoiceTaxRate(clinicSettings.taxRatePercent);
    setNewInvoiceItems([
      {
        id: `ii-${Date.now()}`,
        description: 'Profilaxis Dental y Destartraje con Ultrasonido',
        quantity: 1,
        unitPrice: 65,
        discount: 0,
        total: 65,
      },
    ]);
    setShowCreateModal(true);
  };

  const handleAddItemToInvoice = (procId: string) => {
    const proc = procedureCatalog.find((p) => p.id === procId);
    if (!proc) return;
    setNewInvoiceItems([
      ...newInvoiceItems,
      {
        id: `ii-${Date.now()}`,
        description: proc.name,
        quantity: 1,
        unitPrice: proc.defaultPrice,
        discount: 0,
        total: proc.defaultPrice,
      },
    ]);
  };

  const handleSaveNewInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find((p) => p.id === newInvoicePatientId);
    if (!pat || newInvoiceItems.length === 0) return;

    const subtotal = newInvoiceItems.reduce((acc, i) => acc + i.total, 0);
    const taxAmount = (subtotal * newInvoiceTaxRate) / 100;
    const total = subtotal + taxAmount;

    const invoiceNumber = `${clinicSettings.invoiceSeries}-${(invoices.length + 1)
      .toString()
      .padStart(4, '0')}`;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      patientId: pat.id,
      patientName: `${pat.firstName} ${pat.lastName}`,
      patientIdNumber: pat.idNumber,
      patientEmail: pat.email,
      patientPhone: pat.phone,
      patientAddress: pat.address,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      doctorName: newInvoiceDoctor,
      items: newInvoiceItems,
      subtotal,
      taxRate: newInvoiceTaxRate,
      taxAmount,
      discountTotal: 0,
      total,
      amountPaid: 0,
      balanceDue: total,
      status: 'issued',
      payments: [],
    };

    onSaveInvoice(newInvoice);
    setShowCreateModal(false);
  };

  const handleOpenPayment = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPaymentAmount(inv.balanceDue);
    setPaymentMethod('credit_card');
    setPaymentRef('');
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || paymentAmount <= 0) return;

    const newPaymentRecord: PaymentRecord = {
      id: `pay-${Date.now()}`,
      invoiceId: selectedInvoice.id,
      amount: paymentAmount,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      method: paymentMethod,
      referenceNumber: paymentRef || 'COBRO-DIRECTO',
      receiptNumber: `REC-${Date.now().toString().slice(-4)}`,
      notes: paymentNotes,
      receivedBy: 'Recepción Central',
    };

    const updatedPaid = selectedInvoice.amountPaid + paymentAmount;
    const updatedBalance = Math.max(0, selectedInvoice.total - updatedPaid);
    const updatedStatus = updatedBalance === 0 ? 'paid' : 'partially_paid';

    const updatedInvoice: Invoice = {
      ...selectedInvoice,
      amountPaid: updatedPaid,
      balanceDue: updatedBalance,
      status: updatedStatus,
      payments: [...selectedInvoice.payments, newPaymentRecord],
    };

    onSaveInvoice(updatedInvoice);
    setShowPaymentModal(false);

    // Trigger celebration if paid in full!
    if (updatedStatus === 'paid') {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (err) {
        // ignore
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Facturación Odontológica y Control de Caja
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Emisión de facturas electrónicas, presupuestos, cobros parciales y recibos oficiales.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenCreateInvoice}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Factura / Cobro
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Total Facturado</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 mt-1.5 block">
            {totalBilled.toFixed(2)} {clinicSettings.currencySymbol}
          </span>
          <span className="text-[11px] text-slate-400">{invoices.length} facturas emitidas</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-700 font-bold">
            <span>Cobrado en Caja</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-emerald-600 mt-1.5 block">
            {totalCollected.toFixed(2)} {clinicSettings.currencySymbol}
          </span>
          <span className="text-[11px] text-emerald-600 font-medium">Ingreso real recaudado</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-rose-700 font-bold">
            <span>Cuentas por Cobrar</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-2xl font-black text-rose-600 mt-1.5 block">
            {totalPending.toFixed(2)} {clinicSettings.currencySymbol}
          </span>
          <span className="text-[11px] text-rose-600 font-medium">Saldos pendientes pacientes</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Ticket Promedio</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 mt-1.5 block">
            {averageTicket.toFixed(2)} {clinicSettings.currencySymbol}
          </span>
          <span className="text-[11px] text-slate-400">Por paciente atendido</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas ({invoices.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              statusFilter === 'paid'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pagadas
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('partially_paid')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              statusFilter === 'partially_paid'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pago Parcial
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('issued')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              statusFilter === 'issued'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pendientes
          </button>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar factura, paciente, DNI..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50/50"
          />
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nº Comprobante</th>
                <th className="py-3 px-4">Paciente & DNI</th>
                <th className="py-3 px-4">Fecha Emisión</th>
                <th className="py-3 px-4 text-right">Total Factura</th>
                <th className="py-3 px-4 text-right">Cobrado</th>
                <th className="py-3 px-4 text-right">Saldo Pendiente</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    No se encontraron facturas registradas.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isFullyPaid = inv.status === 'paid' || inv.balanceDue === 0;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                        {inv.invoiceNumber}
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => onOpenPatientRecord && onOpenPatientRecord(inv.patientId)}
                          className="font-bold text-slate-800 hover:text-sky-600 text-left"
                        >
                          {inv.patientName}
                        </button>
                        <span className="block text-[11px] text-slate-500">
                          DNI: {inv.patientIdNumber}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {inv.issueDate}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {inv.total.toFixed(2)} {clinicSettings.currencySymbol}
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-600">
                        {inv.amountPaid.toFixed(2)} {clinicSettings.currencySymbol}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold">
                        {inv.balanceDue > 0 ? (
                          <span className="text-rose-600">
                            {inv.balanceDue.toFixed(2)} {clinicSettings.currencySymbol}
                          </span>
                        ) : (
                          <span className="text-slate-400">0.00 {clinicSettings.currencySymbol}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isFullyPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'partially_paid'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isFullyPaid && 'Pagada'}
                          {inv.status === 'partially_paid' && 'Pago Parcial'}
                          {inv.status === 'issued' && 'Pendiente'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.balanceDue > 0 && (
                            <button
                              type="button"
                              onClick={() => handleOpenPayment(inv)}
                              className="px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs"
                            >
                              Cobrar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setShowPrintModal(true);
                            }}
                            className="p-1 text-slate-500 hover:text-sky-600 rounded-md hover:bg-slate-100"
                            title="Ver / Imprimir Factura"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteInvoice(inv.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                            title="Eliminar factura"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Modal: Create Invoice */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden my-8 animate-fadeIn">
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Emitir Nueva Factura / Presupuesto</h3>
                <p className="text-xs text-slate-400">
                  Seleccione paciente y desglose los procedimientos y conceptos a facturar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewInvoice} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Paciente *</label>
                  <select
                    value={newInvoicePatientId}
                    onChange={(e) => setNewInvoicePatientId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} (DNI: {p.idNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Doctor Responsable</label>
                  <select
                    value={newInvoiceDoctor}
                    onChange={(e) => setNewInvoiceDoctor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {clinicSettings.doctors.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add Procedure to invoice */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block">
                  Añadir Tratamiento desde el Arancel / Catálogo:
                </span>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddItemToInvoice(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    -- Seleccione un procedimiento para agregar a la factura --
                  </option>
                  {procedureCatalog.map((proc) => (
                    <option key={proc.id} value={proc.id}>
                      {proc.name} - {proc.defaultPrice.toFixed(2)} {clinicSettings.currencySymbol}
                    </option>
                  ))}
                </select>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <span className="font-semibold text-slate-700 block">
                  Conceptos a Facturar ({newInvoiceItems.length}):
                </span>
                <div className="border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Descripción</th>
                        <th className="py-2 px-2 text-center">Cant.</th>
                        <th className="py-2 px-3 text-right">Precio Unit.</th>
                        <th className="py-2 px-3 text-right">Total</th>
                        <th className="py-2 px-2 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {newInvoiceItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-medium text-slate-800">
                            {item.description}
                          </td>
                          <td className="py-2 px-2 text-center">{item.quantity}</td>
                          <td className="py-2 px-3 text-right">
                            {item.unitPrice.toFixed(2)} {clinicSettings.currencySymbol}
                          </td>
                          <td className="py-2 px-3 text-right font-bold">
                            {item.total.toFixed(2)} {clinicSettings.currencySymbol}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                setNewInvoiceItems(newInvoiceItems.filter((_, i) => i !== idx))
                              }
                              className="text-rose-500 hover:text-rose-700"
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

              {/* Tax rate and totals summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Subtotal Base Imponible:</span>
                  <span className="font-bold text-slate-900">
                    {newInvoiceItems
                      .reduce((acc, i) => acc + i.total, 0)
                      .toFixed(2)}{' '}
                    {clinicSettings.currencySymbol}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span>Impuesto ({clinicSettings.taxName}):</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newInvoiceTaxRate}
                      onChange={(e) => setNewInvoiceTaxRate(Number(e.target.value))}
                      className="w-14 px-1.5 py-0.5 border border-slate-200 rounded text-center text-xs font-bold"
                    />
                    <span>%</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {(
                      (newInvoiceItems.reduce((acc, i) => acc + i.total, 0) *
                        newInvoiceTaxRate) /
                      100
                    ).toFixed(2)}{' '}
                    {clinicSettings.currencySymbol}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Factura:</span>
                  <span className="text-base text-sky-700">
                    {(
                      newInvoiceItems.reduce((acc, i) => acc + i.total, 0) *
                      (1 + newInvoiceTaxRate / 100)
                    ).toFixed(2)}{' '}
                    {clinicSettings.currencySymbol}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={newInvoiceItems.length === 0}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-xs disabled:opacity-50"
                >
                  Emitir Factura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Payment / Cobro */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden my-8 animate-fadeIn">
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Registrar Cobro en Caja</h3>
                <p className="text-xs text-slate-400">
                  Factura {selectedInvoice.invoiceNumber} - {selectedInvoice.patientName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Factura:</span>
                  <span className="font-bold text-slate-900">
                    {selectedInvoice.total.toFixed(2)} {clinicSettings.currencySymbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ya abonado:</span>
                  <span className="font-semibold text-emerald-600">
                    {selectedInvoice.amountPaid.toFixed(2)} {clinicSettings.currencySymbol}
                  </span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-slate-200 text-rose-700 text-sm">
                  <span>Saldo Pendiente:</span>
                  <span>
                    {selectedInvoice.balanceDue.toFixed(2)} {clinicSettings.currencySymbol}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Monto a Cobrar ({clinicSettings.currencySymbol}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedInvoice.balanceDue}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-base font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Método de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="credit_card">Tarjeta de Crédito / TPV</option>
                  <option value="debit_card">Tarjeta de Débito</option>
                  <option value="cash">Efectivo / Caja</option>
                  <option value="bank_transfer">Transferencia Bancaria / Bizum</option>
                  <option value="dental_insurance">Seguro / Póliza Dental</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nº de Operación / Referencia TPV</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="Ej. TPV-VISA-99124"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notas de Cobro</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Ej. Pago completo de tratamiento"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Confirmar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Printable Invoice / Recibo Oficial */}
      {showPrintModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-8 border border-slate-300">
            {/* Header / Action tool bar */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                <span className="font-bold text-sm">Vista Previa de Comprobante / Factura</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir / Guardar PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="text-slate-400 hover:text-white px-2 text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="p-8 sm:p-12 space-y-8 bg-white text-slate-800 text-xs">
              {/* Header with Clinic Branding & Tax Info */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-6">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-sky-600 text-white font-black flex items-center justify-center text-lg">
                      🦷
                    </div>
                    <div>
                      <h1 className="text-xl font-black text-slate-900 tracking-tight">
                        {clinicSettings.clinicName}
                      </h1>
                      <p className="text-xs text-slate-500 font-medium">
                        Especialidades Odontológicas & Cirugía
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 text-slate-600 text-[11px] space-y-0.5">
                    <p>NIF/CIF: {clinicSettings.taxId}</p>
                    <p>{clinicSettings.address} - {clinicSettings.city}, {clinicSettings.country}</p>
                    <p>Tel: {clinicSettings.phone} • {clinicSettings.email}</p>
                  </div>
                </div>

                <div className="text-right sm:self-center bg-slate-50 p-4 rounded-xl border border-slate-200 min-w-[200px]">
                  <span className="text-[11px] font-bold text-sky-700 uppercase tracking-widest block">
                    FACTURA ELECTRÓNICA
                  </span>
                  <span className="text-lg font-black text-slate-900 block mt-0.5">
                    {selectedInvoice.invoiceNumber}
                  </span>
                  <span className="text-slate-500 text-[11px] block mt-1">
                    Fecha: {selectedInvoice.issueDate}
                  </span>
                </div>
              </div>

              {/* Patient and Doctor Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Datos del Paciente / Cliente:
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    {selectedInvoice.patientName}
                  </h3>
                  <p className="text-slate-600 text-xs mt-0.5">
                    DNI / Documento: {selectedInvoice.patientIdNumber}
                  </p>
                  <p className="text-slate-600 text-xs">
                    Dirección: {selectedInvoice.patientAddress || 'Madrid, España'}
                  </p>
                  <p className="text-slate-600 text-xs">
                    Tel: {selectedInvoice.patientPhone}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Datos Clínicos:
                  </span>
                  <p className="text-xs text-slate-700">
                    <strong className="text-slate-900">Odontólogo Tratante:</strong>{' '}
                    {selectedInvoice.doctorName || 'Dr. Especialista OdontoSalud'}
                  </p>
                  <p className="text-xs text-slate-700 mt-1">
                    <strong className="text-slate-900">Estado de Pago:</strong>{' '}
                    <span
                      className={`font-bold ${
                        selectedInvoice.balanceDue === 0
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {selectedInvoice.balanceDue === 0 ? 'PAGADA AL 100%' : 'ABONO PARCIAL'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Descripción del Procedimiento Dental</th>
                      <th className="py-3 px-3 text-center">Cant.</th>
                      <th className="py-3 px-3 text-right">Precio Unit.</th>
                      <th className="py-3 px-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {selectedInvoice.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-3 px-4 font-medium">
                          {it.description}
                          {it.toothNumber && (
                            <span className="ml-2 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-sm font-bold text-slate-600">
                              Pieza #{it.toothNumber}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">{it.quantity}</td>
                        <td className="py-3 px-3 text-right">
                          {it.unitPrice.toFixed(2)} {clinicSettings.currencySymbol}
                        </td>
                        <td className="py-3 px-4 text-right font-bold">
                          {it.total.toFixed(2)} {clinicSettings.currencySymbol}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Breakdown */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="space-y-2 max-w-sm">
                  {selectedInvoice.payments.length > 0 && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] space-y-1">
                      <span className="font-bold text-slate-800 block">
                        Historial de Pagos Registrados:
                      </span>
                      {selectedInvoice.payments.map((p) => (
                        <div key={p.id} className="flex justify-between text-slate-600">
                          <span>
                            {p.date} ({p.method}):
                          </span>
                          <span className="font-semibold text-emerald-700">
                            {p.amount.toFixed(2)} {clinicSettings.currencySymbol}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Imponible:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedInvoice.subtotal.toFixed(2)} {clinicSettings.currencySymbol}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{clinicSettings.taxName} ({selectedInvoice.taxRate}%):</span>
                    <span className="font-semibold text-slate-800">
                      {selectedInvoice.taxAmount.toFixed(2)} {clinicSettings.currencySymbol}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                    <span>TOTAL FACTURA:</span>
                    <span className="text-sky-700">
                      {selectedInvoice.total.toFixed(2)} {clinicSettings.currencySymbol}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-700 font-bold">
                    <span>Monto Cobrado:</span>
                    <span>
                      {selectedInvoice.amountPaid.toFixed(2)} {clinicSettings.currencySymbol}
                    </span>
                  </div>
                  {selectedInvoice.balanceDue > 0 && (
                    <div className="flex justify-between text-xs text-rose-700 font-black pt-1 border-t border-slate-200">
                      <span>SALDO PENDIENTE:</span>
                      <span>
                        {selectedInvoice.balanceDue.toFixed(2)} {clinicSettings.currencySymbol}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Legal & Clinical Note */}
              <div className="border-t border-slate-200 pt-6 text-center text-slate-500 text-[11px] space-y-2">
                <p className="font-medium text-slate-700">
                  {clinicSettings.receiptFooterNote}
                </p>
                <p className="text-[10px] text-slate-400">
                  Documento emitido conforme a la legislación fiscal vigente. Inscrita en el Registro de Centros Sanitarios.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
