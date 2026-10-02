import { StandardTreatmentRow } from '../types';

export const defaultOdontodesaTreatmentCatalog: Omit<StandardTreatmentRow, 'id' | 'quantity' | 'totalPrice' | 'modifications'>[] = [
  { itemNumber: 1, name: 'Profilaxis y despistaje', unitPrice: 80 },
  { itemNumber: 2, name: 'Rx (Radiografía Periapical / Panorámica)', unitPrice: 30 },
  { itemNumber: 3, name: 'Blanqueamiento Dental', unitPrice: 350 },
  { itemNumber: 4, name: 'Exodoncia Simple', unitPrice: 90 },
  { itemNumber: 5, name: 'Resina simple con luz halógena', unitPrice: 70 },
  { itemNumber: 6, name: 'Resina compuesta con luz halógena', unitPrice: 110 },
  { itemNumber: 7, name: 'Endodoncia anterior (Unirradicular)', unitPrice: 220 },
  { itemNumber: 8, name: 'Endodoncia posterior (Multirradicular)', unitPrice: 320 },
  { itemNumber: 9, name: 'P.P. Móviles (Prótesis Parcial Removible)', unitPrice: 450 },
  { itemNumber: 10, name: 'P. Completa (Prótesis Total)', unitPrice: 800 },
  {
    itemNumber: 11,
    name: 'Ortodoncia (Inicial / Mensualidad)',
    isOrthodontics: true,
    orthoInitial: 600,
    orthoMonthly: 120,
    unitPrice: 600,
  },
  { itemNumber: 12, name: 'Perno Muñón', unitPrice: 150 },
  { itemNumber: 13, name: 'Corona Ivocron', unitPrice: 250 },
  { itemNumber: 14, name: 'Corona Metal Cerámica', unitPrice: 420 },
  { itemNumber: 15, name: 'Corona Libre de Metal (Zirconio / E-max)', unitPrice: 650 },
  { itemNumber: 16, name: 'Fluorización tópica', unitPrice: 50 },
  { itemNumber: 17, name: 'Gingivectomía / Gingivoplastia', unitPrice: 180 },
  { itemNumber: 18, name: 'Cirugía Diente Retenido / Semiretenido (Tercera Molar)', unitPrice: 380 },
  { itemNumber: 19, name: 'Férula de descarga / Miorrelajante', unitPrice: 280 },
  { itemNumber: 20, name: 'Incrustación estética (Inlay / Onlay)', unitPrice: 260 },
  { itemNumber: 21, name: 'Otros procedimientos', unitPrice: 0 },
];

export const createDefaultPatientTreatmentPlan = (): StandardTreatmentRow[] => {
  return defaultOdontodesaTreatmentCatalog.map((item) => ({
    id: `opt-${item.itemNumber}-${Date.now()}`,
    itemNumber: item.itemNumber,
    name: item.name,
    isOrthodontics: item.isOrthodontics,
    orthoInitial: item.orthoInitial,
    orthoMonthly: item.orthoMonthly,
    quantity: item.itemNumber === 1 ? 1 : 0, // default 1 profilaxis for new charts
    unitPrice: item.unitPrice,
    totalPrice: item.itemNumber === 1 ? item.unitPrice : 0,
    modifications: '',
  }));
};
