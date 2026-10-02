export type PatientGender = 'male' | 'female' | 'other';

export interface medicalhistory {
  hasDiabetes: boolean;
  hasHypertension: boolean;
  hasBleedingDisorders: boolean;
  hasCardiacDisease: boolean;
  isPregnant: boolean;
  isSmoker: boolean;
  currentMedications: string[];
  generalNotes: string;
  // Extended fields from Official Odontodesa Form (Image 2)
  underTreatment?: boolean;
  treatmentDetails?: string;
  isAllergicToMedication?: boolean;
  allergicMedicationDetails?: string;
  habitualMedications?: string;
  hasCardiacProblems?: boolean;
  hasHighBloodPressure?: boolean;
  hasLowBloodPressure?: boolean;
  smokes?: boolean;
  drinks?: boolean;
  pregnancyMonths?: number | string;
  // Specific Systemic Pathologies Matrix
  enfermedadesVenereas?: boolean;
  fiebreReumatica?: boolean;
  hepatitis?: boolean;
  ulcerasEstomago?: boolean;
  alteracionesNerviosas?: boolean;
  sida?: boolean;
  epilepsia?: boolean;
  artritis?: boolean;
  cancer?: boolean;
  diabetes?: boolean;
  dolorCabeza?: boolean;
  sinusitis?: boolean;
  otros?: string;
}

export interface StandardTreatmentRow {
  id: string;
  itemNumber: number;
  name: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  modifications?: string;
  isOrthodontics?: boolean;
  orthoInitial?: number;
  orthoMonthly?: number;
}

export interface Patient {
  id: string;
  idNumber: string; // DNI / Cédula / RUT / NIF
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string; // YYYY-MM-DD
  gender: PatientGender;
  address: string;
  occupation?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  allergies:string,
  medicalhistory: medicalhistory;
  registeredAt: string;
  avatarColor: string;
  bloodType?: string;
  notes?: string;
  // Official Odontodesa clinical record fields
  guardianName?: string; // Apoderado
  birthPlace?: string; // Lugar de Nacimiento
  responsibleDoctor?: number; // Profesional Responsable
  consultationReason?: string; // Motivo de Consulta
  lastDentalVisit?: string; // Última Consulta al Dentista
  observations?: string; // Observaciones
  consentAccepted?: boolean; // Consentimiento Informado
  consentDate?: string;
  patientSignature?: string;
  doctorSignature?: string;
  officialTreatmentPlan?: StandardTreatmentRow[];
}

export type ToothCondition =
  | 'healthy'
  | 'caries'
  | 'restored'
  | 'endodontics'
  | 'crown'
  | 'implant'
  | 'extraction_needed'
  | 'absent'
  | 'bridge'
  | 'sealant'
  | 'fracture'
  | 'orthodontics';

export type ToothSurfaceKey = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface ToothState {
  toothNumber: number;
  surfaces: {
    top?: ToothCondition;
    bottom?: ToothCondition;
    left?: ToothCondition;
    right?: ToothCondition;
    center?: ToothCondition;
  };
  wholeToothCondition?: ToothCondition;
  notes?: string;
  lastUpdated?: string;
}

export type OdontogramData = Record<number, ToothState>;

export interface TreatmentItem {
  id: string;
  procedureId: string;
  procedureName: string;
  category: string;
  toothNumber?: number;
  surfaces?: string[];
  unitCost: number;
  discount: number;
  finalCost: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  materialsRequired?: { materialId: string; quantity: number }[];
  completedDate?: string;
  doctorName: string;
  notes?: string;
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  title: string;
  createdAt: string;
  doctorName: string;
  status: 'draft' | 'presented' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  items: TreatmentItem[];
  totalCost: number;
  totalPaid: number;
  notes?: string;
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  date: string;
  doctorName: string;
  procedureDone: string;
  toothPiece?: string; // e.g. "16", "21-22", "General"
  teethInvolved?: number[];
  evolutionNotes: string;
  prescriptions: string[];
  nextAction: string;
  nextAppointmentRecommended?: string;
  // Odontodesa Evolution Table fields (Image 1)
  amountPaid?: number; // ENTREGA
  balanceDue?: number; // SALDO
  totalCost?: number; // TOTAL
  signatureSigned?: boolean; // FIRMA
  signedBy?: string;
}

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_waiting'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  specialty: string;
  cabinet: string; // e.g. "Sillón 1 (Principal)", "Sillón 2 (Ortodoncia)"
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  durationMinutes: number;
  status: AppointmentStatus;
  reason: string;
  procedureCategory: string;
  notes?: string;
  treatmentPlanId?: string;
  invoiceId?: string;
  reminderSent?: boolean;
}

export type MaterialCategory =
  | 'Anestesia'
  | 'Restauración & Resinas'
  | 'Endodoncia'
  | 'Ortodoncia'
  | 'Desechables & EPI'
  | 'Instrumental & Fresas'
  | 'Impresión & Prótesis'
  | 'Quirúrgico & Suturas'
  | 'Higiene & Profilaxis';

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: MaterialCategory;
  unit: string; // 'Unidad', 'Caja x 50', 'Frasco 5ml', 'Tubo 4g', 'Jeringa', 'Rollo'
  currentStock: number;
  minStock: number;
  reorderPoint: number;
  costPrice: number;
  supplier: string;
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  lastRestockedDate: string;
  locationInClinic: string; // 'Gabinete 1 - Cajón 3', 'Almacén Central', etc.
}

export interface InventoryMovement {
  id: string;
  materialId: string;
  materialName: string;
  type: 'in_purchase' | 'out_treatment' | 'adjustment_positive' | 'adjustment_negative' | 'waste_expired';
  quantity: number;
  previousStock: number;
  newStock: number;
  date: string;
  reason: string;
  performedBy: string;
  patientId?: string;
  patientName?: string;
  treatmentItemId?: string;
}

export type PaymentMethod =
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'dental_insurance'
  | 'other';

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  referenceNumber?: string;
  receiptNumber: string;
  notes?: string;
  receivedBy: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  toothNumber?: number;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export type InvoiceStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "FAC-2026-0012"
  patientId: string;
  patientName: string;
  patientIdNumber: string;
  patientEmail: string;
  patientPhone: string;
  patientAddress: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number; // e.g. 18 for 18% or 16%
  taxAmount: number;
  discountTotal: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  status: InvoiceStatus;
  payments: PaymentRecord[];
  notes?: string;
  treatmentPlanId?: string;
  doctorName?: string;
}

export interface DentalDoctor {
  id: string;
  first_name: string;
  last_name: string;
  specialty: string;
  licenseNumber: string;
  phone: string;
  color: string;
  active: boolean;
}

export interface ClinicSettings {
  clinicName: string;
  taxId: string; // RUC, RFC, CIF, NIF
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  country: string;
  currencySymbol: string;
  taxName: string; // 'IVA', 'IGV', 'HST'
  taxRatePercent: number;
  invoiceSeries: string;
  receiptFooterNote: string;
  cabinets: string[];
  doctors: DentalDoctor[];
}

export interface ProcedureCatalogItem {
  id: string;
  code: string;
  name: string;
  category: string;
  defaultPrice: number;
  durationMinutes: number;
  suggestedMaterials: { materialId: string; quantity: number }[];
}

export type UserRole = 'admin' | 'doctor' | 'assistant' | 'patient';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface UserPermissions {
  canViewPatients: boolean;
  canEditPatients: boolean;
  canDeletePatients: boolean;
  canEditOdontogram: boolean;
  canManageAppointments: boolean;
  canManageInventory: boolean;
  canManageBilling: boolean;
  canManageUsers: boolean;
  canEditClinicSettings: boolean;
  canViewAuditLogs: boolean;
  canAccessPatientPortal: boolean;
}

export interface AppUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idNumber: string;
  role: UserRole;
  status: UserStatus;
  avatarColor: string;
  createdAt: string;
  lastLogin?: string;
  twoFactorEnabled?: boolean;
  // Specialized fields
  doctorId?: string;
  licenseNumber?: string; // e.g. "COP-28004123"
  specialty?: string;
  cabinetAssigned?: string;
  shift?: 'morning' | 'afternoon' | 'full_time' | 'weekend';
  associatedPatientId?: string; // Links a 'patient' user to their clinical file
  notes?: string;
  permissions: UserPermissions;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'PASSWORD_RESET' | 'STATUS_CHANGE' | 'ROLE_SWITCH';
  targetEntity: 'PATIENT' | 'ODONTOGRAM' | 'APPOINTMENT' | 'INVOICE' | 'INVENTORY' | 'USER' | 'SETTINGS';
  details: string;
  ipAddress?: string;
}
