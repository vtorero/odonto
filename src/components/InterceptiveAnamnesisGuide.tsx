import React, { useState } from 'react';
import {
  Patient,
  ClinicSettings,
  InterceptiveAnamnesis,
  InterceptiveGeneralAnamnesis,
  InterceptiveFacialAnalysis,
  InterceptiveOcclusalAnalysis,
} from '../types';
import {
  Printer,
  Save,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Smile,
  Activity,
  FileCheck,
  CheckSquare,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Info,
  Layers,
  ArrowRight,
  User,
  Calendar,
} from 'lucide-react';
import { api } from '../services/api';

interface InterceptiveAnamnesisGuideProps {
  patient: Patient;
  clinicSettings: ClinicSettings;
  onSavePatient: (patient: Patient) => void;
  onBackToHistory?: () => void;
}

const APPLIANCES_CATALOG = [
  'Disyuntor Palatino (Hyrax)',
  'Disyuntor Tipo Haas',
  'Expansor Tipo McNamara (férula acrílica)',
  'Placa Activa Hawley con Tornillo de Expansión',
  'Pistas Directas de Composite / Planas',
  'Rejilla Lingual / Palatina Antihábito',
  'Arco Lingual Inferior Pasivo',
  'Botón de Nance',
  'Mantenedor de Espacio Fijo (Banda y Asa)',
  'Mantenedor de Espacio Removible',
  'Máscara Facial de Tracción Anterior (Delaire/Petit)',
  'Mentonera de Tracción Mandibular',
  'Placa Lip Bumper (Escudo Labial)',
  'Aparato Miofuncional / Entrenador Oral',
  'Terapia Miofuncional Orofacial / Fonoaudiología',
];

export const InterceptiveAnamnesisGuide: React.FC<InterceptiveAnamnesisGuideProps> = ({
  patient,
  clinicSettings,
  onSavePatient,
  onBackToHistory,
}) => {
  // Initialize default anamnesis or fallback values
  const defaultAnamnesis: InterceptiveAnamnesis = {
    evaluationDate: new Date().toISOString().split('T')[0],
    evaluatorDoctor: patient.responsibleDrName || clinicSettings.doctors[0]?.name || 'Odontopediatra / Ortodoncista',
    general: {
      consultationReason: patient.consultationReason || 'Evaluación de recambio dentario y desarrollo de maxilares.',
      parentExpectations: 'Corrección temprana de mordida y prevención de apiñamiento severo.',
      gestationType: 'termino',
      lactationType: 'materna',
      lactationDurationMonths: 6,
      breathingPattern: 'nasal',
      swallowingPattern: 'normal',
      tongueInterposition: 'ninguna',
      chewingPattern: 'bilateral',
      franklScale: 'positivo',
      digitalSuction: false,
      pacifierUse: false,
      lipSucking: false,
      objectSucking: false,
      snoring: false,
      sleepApnea: false,
      droolingOnPillow: false,
      tonsilsOrAdenoids: false,
      allergicRhinitis: false,
      nocturnalBruxism: false,
      diurnalBruxism: false,
      onychophagy: false,
      objectBiting: false,
      cheilophagy: false,
      orofacialTrauma: false,
      prematureToothLoss: false,
      spaceMaintainerUsed: false,
      perioralContraction: false,
      phoneticDifficulties: false,
    },
    facial: {
      facialBiotype: 'mesofacial',
      facialSymmetry: 'simetrico',
      lowerThirdProportion: 'proporcional',
      sagittalProfile: 'recto',
      nasolabialAngle: 'normal',
      mentolabialSulcus: 'normal',
      lipCompetence: 'competente',
      smileLine: 'normal',
      gingivalExposureMm: 1,
      buccalCorridors: 'adecuados',
      chinPosition: 'centrado',
      gonialAngle: 'normal',
    },
    occlusal: {
      dentitionType: 'mixta_1ra',
      molarRelationRight: 'clase_I',
      molarRelationLeft: 'clase_I',
      canineRelationRight: 'clase_I',
      canineRelationLeft: 'clase_I',
      transverseRelation: 'normal',
      archFormUpper: 'parabolica',
      archFormLower: 'parabolica',
      overbiteType: 'normal',
      overbiteMm: 2.5,
      overjetType: 'normal',
      overjetMm: 2.0,
      upperMidlineDev: 'centrada',
      upperMidlineMm: 0,
      lowerMidlineDev: 'centrada',
      lowerMidlineMm: 0,
      curveOfSpee: 'moderada',
      rcMicCoincident: true,
      atmStatus: 'asintomatica',
      mandibularDeviationOnOpen: 'recta',
      primateSpacesPresent: true,
      crowdingUpper: 'ninguno',
      crowdingLower: 'ninguno',
      frenumUpperAbnormal: false,
      ankyloglossiaLingualFrenum: false,
      skeletalDiagnosis: 'Patrón esquelético Clase I normodivergente en crecimiento activo.',
      dentalDiagnosis: 'Dentición mixta primera fase sin anomalías de número ni forma.',
      functionalDiagnosis: 'Patrón respiratorio nasal competente, deglución funcional sin parafunciones.',
      indicatedAppliances: [],
      treatmentPlanNotes: 'Control de recambio dentario periódico cada 6 meses. Fomento de higiene bucal.',
      treatmentTimingMonths: 6,
      reevaluationDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  };

  const [anamnesisData, setAnamnesisData] = useState<InterceptiveAnamnesis>(() => {
    if (patient.interceptiveAnamnesis) {
      return {
        ...defaultAnamnesis,
        ...patient.interceptiveAnamnesis,
        general: { ...defaultAnamnesis.general, ...(patient.interceptiveAnamnesis.general || {}) },
        facial: { ...defaultAnamnesis.facial, ...(patient.interceptiveAnamnesis.facial || {}) },
        occlusal: { ...defaultAnamnesis.occlusal, ...(patient.interceptiveAnamnesis.occlusal || {}) },
      };
    }
    return defaultAnamnesis;
  });

  const [activeSubTab, setActiveSubTab] = useState<'all' | 'general' | 'facial' | 'occlusal' | 'plan'>('all');
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Helper updates
  const updateGeneral = <K extends keyof InterceptiveGeneralAnamnesis>(
    key: K,
    value: InterceptiveGeneralAnamnesis[K]
  ) => {
    setAnamnesisData((prev) => ({
      ...prev,
      general: {
        ...prev.general,
        [key]: value,
      },
      updatedAt: new Date().toISOString(),
    }));
  };

  const updateFacial = <K extends keyof InterceptiveFacialAnalysis>(
    key: K,
    value: InterceptiveFacialAnalysis[K]
  ) => {
    setAnamnesisData((prev) => ({
      ...prev,
      facial: {
        ...prev.facial,
        [key]: value,
      },
      updatedAt: new Date().toISOString(),
    }));
  };

  const updateOcclusal = <K extends keyof InterceptiveOcclusalAnalysis>(
    key: K,
    value: InterceptiveOcclusalAnalysis[K]
  ) => {
    setAnamnesisData((prev) => ({
      ...prev,
      occlusal: {
        ...prev.occlusal,
        [key]: value,
      },
      updatedAt: new Date().toISOString(),
    }));
  };

  const toggleAppliance = (applianceName: string) => {
    const current = anamnesisData.occlusal.indicatedAppliances || [];
    const exists = current.includes(applianceName);
    const updated = exists
      ? current.filter((item) => item !== applianceName)
      : [...current, applianceName];
    updateOcclusal('indicatedAppliances', updated);
  };

  const handleSave = async () => {
    const updatedPatient: Patient = {
      ...patient,
      interceptiveAnamnesis: anamnesisData,
    };

    //console.log(updatedPatient);
    const respuesta = await api.savePatient(updatedPatient);
    //onSavePatient(respuesta);
    onSavePatient(updatedPatient);
    //onSavePatient(patientToSave);
     //await loadPatients();

    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const loadExampleCase = () => {
    setAnamnesisData({
      evaluationDate: new Date().toISOString().split('T')[0],
      evaluatorDoctor: patient.responsibleDrName || 'Dra. Especialista Ortodoncia',
      general: {
        consultationReason: 'Padres preocupados porque el niño duerme con la boca abierta y los dientes superiores muerden por dentro.',
        parentExpectations: 'Descruzar la mordida y guiar correctamente la erupción de los nuevos dientes.',
        systemicDiseases: 'Rinitis alérgica estacional controlada con antihistamínicos según necesidad.',
        allergies: 'Ninguna alergia conocida a medicamentos ni al látex.',
        gestationType: 'termino',
        lactationType: 'mixta',
        lactationDurationMonths: 12,
        familyPrognathism: false,
        familyOpenBite: true,
        familyCrowding: true,
        familyClassII: true,
        familyNotes: 'Madre presentó mordida abierta tratada con ortodoncia.',
        digitalSuction: true,
        digitalSuctionDetails: 'Succión del pulgar derecho hasta los 5 años y medio. Actualmente cesada.',
        pacifierUse: true,
        pacifierDetails: 'Uso de chupón hasta los 4 años.',
        habitAgeStopped: '5 años',
        breathingPattern: 'bucal',
        snoring: true,
        sleepApnea: false,
        droolingOnPillow: true,
        tonsilsOrAdenoids: true,
        allergicRhinitis: true,
        swallowingPattern: 'atipica',
        tongueInterposition: 'anterior',
        perioralContraction: true,
        chewingPattern: 'unilateral_derecha',
        phoneticDifficulties: true,
        phonemesAffected: 'Dificultad ligera con fonemas sibilantes /s/.',
        nocturnalBruxism: true,
        diurnalBruxism: false,
        onychophagy: false,
        orofacialTrauma: false,
        prematureToothLoss: true,
        prematureLossPieces: 'Pérdida prematura de pieza 54 por caries proximal extensa.',
        spaceMaintainerUsed: false,
        franklScale: 'positivo',
        cooperationNotes: 'Muy colaborador al explicar procedimientos con refuerzo positivo.',
        heightWeightPercentile: 'Percentil 50 de talla y peso acorde a su edad.',
      },
      facial: {
        facialBiotype: 'dolicofacial',
        facialSymmetry: 'asimetria_mandibular_der',
        symmetryNotes: 'Ligera desviación del mentón a la derecha secundaria a mordida cruzada unilateral.',
        lowerThirdProportion: 'aumentado',
        sagittalProfile: 'convexo',
        nasolabialAngle: 'agudo',
        mentolabialSulcus: 'marcado',
        lipCompetence: 'incompetente',
        smileLine: 'gingival',
        gingivalExposureMm: 3,
        buccalCorridors: 'amplios',
        chinPosition: 'desviado_der',
        gonialAngle: 'aumentado',
      },
      occlusal: {
        dentitionType: 'mixta_1ra',
        molarRelationRight: 'clase_II',
        molarRelationLeft: 'clase_I',
        canineRelationRight: 'clase_II',
        canineRelationLeft: 'clase_I',
        transverseRelation: 'cruzada_unilateral_der',
        archFormUpper: 'triangular_ojival',
        archFormLower: 'parabolica',
        overbiteType: 'abierta',
        overbiteMm: -2.5,
        overjetType: 'aumentado',
        overjetMm: 5.5,
        upperMidlineDev: 'centrada',
        upperMidlineMm: 0,
        lowerMidlineDev: 'desviada_der',
        lowerMidlineMm: 2.5,
        curveOfSpee: 'plana',
        rcMicCoincident: false,
        rcMicSlideDetails: 'Deflexión lateral mandibular a la derecha de 2 mm provocada por interferencia de caninos deciduos.',
        atmStatus: 'asintomatica',
        mandibularDeviationOnOpen: 'bayoneta_s',
        primateSpacesPresent: false,
        crowdingUpper: 'moderado',
        crowdingLower: 'leve',
        frenumUpperAbnormal: true,
        ankyloglossiaLingualFrenum: false,
        skeletalDiagnosis: 'Patrón hiperdivergente con tendencia a Clase II por compresión maxilar y rotación mandibular horaria.',
        dentalDiagnosis: 'Mordida cruzada posterior unilateral derecha funcional, mordida abierta anterior de -2.5 mm y overjet de 5.5 mm.',
        functionalDiagnosis: 'Respiración bucal con incompetencia labial, deglución atípica con interposición lingual anterior activa.',
        indicatedAppliances: [
          'Disyuntor Palatino (Hyrax)',
          'Rejilla Lingual / Palatina Antihábito',
          'Mantenedor de Espacio Fijo (Banda y Asa)',
          'Terapia Miofuncional Orofacial / Fonoaudiología',
        ],
        treatmentPlanNotes: 'Fase 1: Disyunción rápida maxilar con Hyrax para corregir compresión transversal y reacomodar vía aérea superior. Rejilla lingual para erradicar empuje de lengua. Colocación de mantenedor de espacio en cuadrante 1.',
        treatmentTimingMonths: 12,
        reevaluationDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    });
    setIsSavedRecently(false);
  };

  // Age calculation
  const calculateAge = (birthDateString?: string): string => {
    if (!birthDateString) return '-';
    const birth = new Date(birthDateString);
    if (isNaN(birth.getTime())) return '-';
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? `${age} años` : '-';
  };

  // Risk badges detection
  const hasDigitalSuction = anamnesisData.general.digitalSuction;
  const hasMouthBreathing = anamnesisData.general.breathingPattern === 'bucal';
  const hasAtypicalSwallowing = anamnesisData.general.swallowingPattern === 'atipica';
  const hasCrossbite = anamnesisData.occlusal.transverseRelation !== 'normal';
  const hasOpenBite = anamnesisData.occlusal.overbiteType === 'abierta';

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-sky-100 text-sky-700 rounded-lg">
              <Stethoscope className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                Guía de Anamnesis de Ortodoncia Interceptiva
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Protocolo Oficial
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Evaluación integral de crecimiento craneofacial, hábitos bucales, relaciones oclusales y aparatología interceptiva.
              </p>
            </div>
          </div>

          {/* Quick Risk Alert Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Indicadores Detectados:
            </span>
            {hasMouthBreathing ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" /> Respiración Bucal
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                ✓ Respiración Nasal
              </span>
            )}
            {hasAtypicalSwallowing && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                ⚠️ Deglución Atípica
              </span>
            )}
            {hasDigitalSuction && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-300">
                ⚠️ Hábito Succión Digital
              </span>
            )}
            {hasCrossbite && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                ⚠️ Mordida Cruzada
              </span>
            )}
            {hasOpenBite && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 border border-sky-300">
                ⚠️ Mordida Abierta Anterior
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
          <button
            type="button"
            onClick={loadExampleCase}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            title="Cargar un ejemplo clínico interceptivo completo para pruebas o guía"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Cargar Caso de Ejemplo
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            Imprimir Ficha
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            {isSavedRecently ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                ¡Guardado!
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Guardar Cuestionario
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 gap-2 overflow-x-auto print:hidden">
        <button
          type="button"
          onClick={() => setActiveSubTab('all')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'all'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Vista Completa (Todas las Secciones)
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('general')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'general'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">1</span>
          1. Análisis General & Hábitos
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('facial')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'facial'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">2</span>
          2. Análisis Facial
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('occlusal')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'occlusal'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">3</span>
          3. Análisis Oclusal & Funcional
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('plan')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'plan'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px] font-black">4</span>
          4. Diagnóstico & Aparatología Interceptiva
        </button>
      </div>

      {/* Printable Sheet Wrapper */}
      <div
        id="interceptive-anamnesis-sheet"
        className="bg-white border border-slate-300 rounded-2xl p-6 sm:p-8 shadow-sm space-y-7 print:border-none print:shadow-none print:p-0 print:m-0 text-slate-900 font-sans"
      >
        {/* Printable Header */}
        <div className="text-center pb-4 border-b-2 border-slate-900 flex flex-col items-center justify-center relative">
          <div className="flex items-center justify-center gap-3">
            <div className="w-11 h-11 rounded-xl border-2 border-slate-900 flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-wider uppercase text-slate-900">
                {clinicSettings.clinicName.includes('Odonto') ? clinicSettings.clinicName : 'ODONTODESA'}
              </h1>
              <p className="text-xs sm:text-sm font-black tracking-widest text-slate-700 uppercase">
                GUÍA DE ANAMNESIS DE ORTODONCIA INTERCEPTIVA
              </p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-600 font-medium">
            <span>Servicio de Odontopediatría & Ortopedia Maxilofacial</span>
            <span>•</span>
            <span>Evaluación Temprana y Prevención de Maloclusiones</span>
          </div>
        </div>

        {/* Patient Demographics Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-6 flex items-center gap-2">
              <span className="font-extrabold uppercase text-[10px] text-slate-500">PACIENTE:</span>
              <span className="font-bold text-slate-900 uppercase">
                {patient.firstName} {patient.lastName}
              </span>
            </div>
            <div className="sm:col-span-3 flex items-center gap-2">
              <span className="font-extrabold uppercase text-[10px] text-slate-500">DNI / H.C.:</span>
              <span className="font-bold text-slate-900">{patient.idNumber || patient.id}</span>
            </div>
            <div className="sm:col-span-3 flex items-center gap-2">
              <span className="font-extrabold uppercase text-[10px] text-slate-500">EDAD:</span>
              <span className="font-bold text-slate-900">{calculateAge(patient.birthDate)}</span>
            </div>

            <div className="sm:col-span-6 flex items-center gap-2">
              <span className="font-extrabold uppercase text-[10px] text-slate-500">APODERADO:</span>
              <span className="font-medium text-slate-800 uppercase">
                {patient.guardianName || 'Padre / Tutor responsable'}
              </span>
            </div>
            <div className="sm:col-span-3 flex items-center gap-2">
              <span className="font-extrabold uppercase text-[10px] text-slate-500">FECHA EVALUACIÓN:</span>
              <input
                type="date"
                value={anamnesisData.evaluationDate || ''}
                onChange={(e) =>
                  setAnamnesisData((prev) => ({ ...prev, evaluationDate: e.target.value }))
                }
                className="bg-transparent border-b border-dotted border-slate-400 font-medium text-slate-800 outline-none"
              />
            </div>
            <div className="sm:col-span-3 flex items-center gap-2">
              <span className="font-extrabold uppercase text-[10px] text-slate-500">PROFESIONAL:</span>
              <input
                type="text"
                value={anamnesisData.evaluatorDoctor || ''}
                onChange={(e) =>
                  setAnamnesisData((prev) => ({ ...prev, evaluatorDoctor: e.target.value }))
                }
                className="bg-transparent border-b border-dotted border-slate-400 font-semibold text-slate-800 outline-none w-full"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECCIÓN 1: ANÁLISIS GENERAL / ANAMNESIS (1.1 - 1.14)                      */}
        {/* ========================================================================= */}
        {(activeSubTab === 'all' || activeSubTab === 'general') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-slate-800 pb-1.5">
              <span className="w-6 h-6 rounded-md bg-slate-900 text-white text-xs font-black flex items-center justify-center">
                1
              </span>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                1. ANÁLISIS GENERAL / ANAMNESIS CLÍNICA (1.1 - 1.14)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* 1.1 Motivo de Consulta & Expectativas */}
              <div className="p-3.5 bg-white border border-slate-300 rounded-xl space-y-2">
                <span className="font-bold text-[11px] text-slate-900 uppercase block">
                  1.1 Motivo de la Consulta & Expectativas
                </span>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Motivo Principal:</label>
                  <textarea
                    rows={2}
                    value={anamnesisData.general.consultationReason || ''}
                    onChange={(e) => updateGeneral('consultationReason', e.target.value)}
                    placeholder="¿Por qué acuden a la consulta? (ej. apiñamiento, dientes chuecos, respirador bucal)..."
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Expectativas de los Padres / Paciente:</label>
                  <input
                    type="text"
                    value={anamnesisData.general.parentExpectations || ''}
                    onChange={(e) => updateGeneral('parentExpectations', e.target.value)}
                    placeholder="Expectativas de corrección..."
                    className="w-full mt-1 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* 1.2 & 1.3 Antecedentes Médicos y Odontológicos */}
              <div className="p-3.5 bg-white border border-slate-300 rounded-xl space-y-2">
                <span className="font-bold text-[11px] text-slate-900 uppercase block">
                  1.2 & 1.3 Antecedentes Médicos y Odontológicos Previos
                </span>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Enfermedades Sistémicas / Alergias:</label>
                  <input
                    type="text"
                    value={anamnesisData.general.systemicDiseases || ''}
                    onChange={(e) => updateGeneral('systemicDiseases', e.target.value)}
                    placeholder="Alergia a fármacos, asma, rinitis, diabetes..."
                    className="w-full mt-1 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Experiencias Odontológicas Previas / Traumas:</label>
                  <input
                    type="text"
                    value={anamnesisData.general.previousDentalExperience || ''}
                    onChange={(e) => updateGeneral('previousDentalExperience', e.target.value)}
                    placeholder="Primera consulta, tratamientos previos, traumatismos orofaciales..."
                    className="w-full mt-1 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>

              {/* 1.4 & 1.5 Desarrollo Perinatal y Antecedentes Familiares */}
              <div className="p-3.5 bg-white border border-slate-300 rounded-xl space-y-2">
                <span className="font-bold text-[11px] text-slate-900 uppercase block">
                  1.4 & 1.5 Antecedentes Perinatales y Herencia Familiar
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Gestación:</label>
                    <select
                      value={anamnesisData.general.gestationType || 'termino'}
                      onChange={(e) => updateGeneral('gestationType', e.target.value as any)}
                      className="w-full mt-1 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                    >
                      <option value="termino">A término (normal)</option>
                      <option value="prematuro">Prematuro</option>
                      <option value="postermino">Postérmino</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Lactancia:</label>
                    <select
                      value={anamnesisData.general.lactationType || 'materna'}
                      onChange={(e) => updateGeneral('lactationType', e.target.value as any)}
                      className="w-full mt-1 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                    >
                      <option value="materna">Materna exclusiva</option>
                      <option value="biberon">Biberón</option>
                      <option value="mixta">Mixta</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                    Antecedentes Familiares de Maloclusión:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(anamnesisData.general.familyPrognathism)}
                        onChange={(e) => updateGeneral('familyPrognathism', e.target.checked)}
                        className="rounded text-sky-600"
                      />
                      <span>Prognatismo (Clase III)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(anamnesisData.general.familyOpenBite)}
                        onChange={(e) => updateGeneral('familyOpenBite', e.target.checked)}
                        className="rounded text-sky-600"
                      />
                      <span>Mordida Abierta</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(anamnesisData.general.familyClassII)}
                        onChange={(e) => updateGeneral('familyClassII', e.target.checked)}
                        className="rounded text-sky-600"
                      />
                      <span>Retrognatismo (Clase II)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(anamnesisData.general.familyCrowding)}
                        onChange={(e) => updateGeneral('familyCrowding', e.target.checked)}
                        className="rounded text-sky-600"
                      />
                      <span>Apiñamiento Severo</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 1.6 Hábitos de Succión No Nutritiva */}
              <div className="p-3.5 bg-white border border-slate-300 rounded-xl space-y-2">
                <span className="font-bold text-[11px] text-slate-900 uppercase block">
                  1.6 Hábitos de Succión No Nutritiva
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(anamnesisData.general.digitalSuction)}
                      onChange={(e) => updateGeneral('digitalSuction', e.target.checked)}
                      className="rounded text-sky-600"
                    />
                    <span className="font-semibold text-rose-700">Succión Digital (Dedo)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(anamnesisData.general.pacifierUse)}
                      onChange={(e) => updateGeneral('pacifierUse', e.target.checked)}
                      className="rounded text-sky-600"
                    />
                    <span>Uso Chupón / Tetina</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(anamnesisData.general.lipSucking)}
                      onChange={(e) => updateGeneral('lipSucking', e.target.checked)}
                      className="rounded text-sky-600"
                    />
                    <span>Succión de Labio</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(anamnesisData.general.objectSucking)}
                      onChange={(e) => updateGeneral('objectSucking', e.target.checked)}
                      className="rounded text-sky-600"
                    />
                    <span>Succión de Objetos / Sábanas</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Edad de Cese / Persistencia:</label>
                    <input
                      type="text"
                      value={anamnesisData.general.habitAgeStopped || ''}
                      onChange={(e) => updateGeneral('habitAgeStopped', e.target.value)}
                      placeholder="Ej. Cesó a los 4 años / Activo"
                      className="w-full mt-1 p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Detalles del hábito:</label>
                    <input
                      type="text"
                      value={anamnesisData.general.digitalSuctionDetails || ''}
                      onChange={(e) => updateGeneral('digitalSuctionDetails', e.target.value)}
                      placeholder="Frecuencia, intensidad nocturna..."
                      className="w-full mt-1 p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 1.7 Patrón Respiratorio */}
              <div className="p-3.5 bg-white border border-slate-300 rounded-xl space-y-2">
                <span className="font-bold text-[11px] text-slate-900 uppercase block">
                  1.7 Patrón Respiratorio (Vía Aérea Superior)
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Tipo de Respiración:</span>
                  <div className="flex items-center gap-1 text-[11px] font-bold">
                    {(['nasal', 'bucal', 'mixto'] as const).map((pattern) => (
                      <button
                        key={pattern}
                        type="button"
                        onClick={() => updateGeneral('breathingPattern', pattern)}
                        className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold border transition-all ${
                          anamnesisData.general.breathingPattern === pattern
                            ? pattern === 'bucal'
                              ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                              : 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {pattern}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(anamnesisData.general.snoring)}
                      onChange={(e) => updateGeneral('snoring', e.target.checked)}
                      className="rounded text-sky-600"
                    />
                    <span>Ronquido Nocturno</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(anamnesisData.general.droolingOnPillow)}
                      onChange={(e) => updateGeneral('droolingOnPillow', e.target.checked)}
                      className="rounded text-sky-600"
                    />
                    <span>Babeo en la Almohada</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(anamnesisData.general.tonsilsOrAdenoids)}
                      onChange={(e) => updateGeneral('tonsilsOrAdenoids', e.target.checked)}
                      className="rounded text-sky-600"
                    />
                    <span>Adenoides / Amígdalas</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(anamnesisData.general.allergicRhinitis)}
                      onChange={(e) => updateGeneral('allergicRhinitis', e.target.checked)}
                      className="rounded text-sky-600"
                    />
                    <span>Rinitis Alérgica</span>
                  </label>
                </div>
              </div>

              {/* 1.8 & 1.9 Deglución, Fonación y Masticación */}
              <div className="p-3.5 bg-white border border-slate-300 rounded-xl space-y-2">
                <span className="font-bold text-[11px] text-slate-900 uppercase block">
                  1.8 & 1.9 Patrón de Deglución, Masticación & Fonación
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Deglución:</label>
                    <select
                      value={anamnesisData.general.swallowingPattern || 'normal'}
                      onChange={(e) => updateGeneral('swallowingPattern', e.target.value as any)}
                      className="w-full mt-1 p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="normal">Normal (madura)</option>
                      <option value="atipica">Atípica (empuje lingual)</option>
                      <option value="infantil">Infantil o visceral</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Interposición Lingual:</label>
                    <select
                      value={anamnesisData.general.tongueInterposition || 'ninguna'}
                      onChange={(e) => updateGeneral('tongueInterposition', e.target.value as any)}
                      className="w-full mt-1 p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="ninguna">Ninguna</option>
                      <option value="anterior">Anterior (entre incisivos)</option>
                      <option value="lateral">Lateral</option>
                      <option value="ambas">Anterior y Lateral</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Masticación:</label>
                    <select
                      value={anamnesisData.general.chewingPattern || 'bilateral'}
                      onChange={(e) => updateGeneral('chewingPattern', e.target.value as any)}
                      className="w-full mt-1 p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="bilateral">Bilateral alternada</option>
                      <option value="unilateral_derecha">Unilateral Derecha</option>
                      <option value="unilateral_izquierda">Unilateral Izquierda</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Fonación / Dislalias:</label>
                    <input
                      type="text"
                      value={anamnesisData.general.phonemesAffected || ''}
                      onChange={(e) => updateGeneral('phonemesAffected', e.target.value)}
                      placeholder="Ceceo / fonemas /s/, /r/, /t/..."
                      className="w-full mt-1 p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 1.10 & 1.11 Parafunciones y Traumatismos */}
              <div className="p-3.5 bg-white border border-slate-300 rounded-xl space-y-2">
                <span className="font-bold text-[11px] text-slate-900 uppercase block">
                  1.10 & 1.11 Parafunciones y Traumatismos Orofaciales
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(anamnesisData.general.nocturnalBruxism)}
                      onChange={(e) => updateGeneral('nocturnalBruxism', e.target.checked)}
                      className="rounded text-sky-600"
                    />
                    <span>Bruxismo Nocturno</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(anamnesisData.general.diurnalBruxism)}
                      onChange={(e) => updateGeneral('diurnalBruxism', e.target.checked)}
                      className="rounded text-sky-600"
                    />
                    <span>Apretamiento Diurno</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(anamnesisData.general.onychophagy)}
                      onChange={(e) => updateGeneral('onychophagy', e.target.checked)}
                      className="rounded text-sky-600"
                    />
                    <span>Onicofagia (Morder Uñas)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(anamnesisData.general.objectBiting)}
                      onChange={(e) => updateGeneral('objectBiting', e.target.checked)}
                      className="rounded text-sky-600"
                    />
                    <span>Morder Objetos / Lápices</span>
                  </label>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Traumatismo Orofacial Previo:</label>
                  <input
                    type="text"
                    value={anamnesisData.general.traumaDescription || ''}
                    onChange={(e) => updateGeneral('traumaDescription', e.target.value)}
                    placeholder="Golpes en dientes de leche, fracturas, caídas..."
                    className="w-full mt-1 p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* 1.12 al 1.14 Erupción, Conducta (Frankl) y Crecimiento */}
              <div className="p-3.5 bg-white border border-slate-300 rounded-xl space-y-2">
                <span className="font-bold text-[11px] text-slate-900 uppercase block">
                  1.12 al 1.14 Erupción, Conducta (Frankl) & Somatometría
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Pérdida Prematura de Piezas:</label>
                    <input
                      type="text"
                      value={anamnesisData.general.prematureLossPieces || ''}
                      onChange={(e) => updateGeneral('prematureLossPieces', e.target.value)}
                      placeholder="Ej. Piezas 54, 75 por caries"
                      className="w-full mt-1 p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Escala de Frankl (Conducta):</label>
                    <select
                      value={anamnesisData.general.franklScale || 'positivo'}
                      onChange={(e) => updateGeneral('franklScale', e.target.value as any)}
                      className="w-full mt-1 p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    >
                      <option value="def_positivo">++ Definitivamente Positivo</option>
                      <option value="positivo">+ Positivo (Colaborador)</option>
                      <option value="negativo">- Negativo (Renuente)</option>
                      <option value="def_negativo">-- Definitivamente Negativo</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Mantenedor de Espacio Usado:</label>
                    <select
                      value={anamnesisData.general.spaceMaintainerUsed ? 'si' : 'no'}
                      onChange={(e) => updateGeneral('spaceMaintainerUsed', e.target.value === 'si')}
                      className="w-full mt-1 p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="no">No ha utilizado</option>
                      <option value="si">Sí, portador previo/actual</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Percentil / Pico de Crecimiento:</label>
                    <input
                      type="text"
                      value={anamnesisData.general.heightWeightPercentile || ''}
                      onChange={(e) => updateGeneral('heightWeightPercentile', e.target.value)}
                      placeholder="Talla, peso, prepuberal..."
                      className="w-full mt-1 p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECCIÓN 2: ANÁLISIS FACIAL (2.1 - 2.11)                                    */}
        {/* ========================================================================= */}
        {(activeSubTab === 'all' || activeSubTab === 'facial') && (
          <div className="space-y-4 pt-4 border-t-2 border-slate-200">
            <div className="flex items-center gap-2 border-b-2 border-slate-800 pb-1.5">
              <span className="w-6 h-6 rounded-md bg-slate-900 text-white text-xs font-black flex items-center justify-center">
                2
              </span>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                2. ANÁLISIS FACIAL (2.1 - 2.11)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
              {/* 2.1 Biotipo Facial */}
              <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-1.5">
                <span className="font-bold text-[11px] text-slate-900 uppercase block">
                  2.1 Biotipo Facial
                </span>
                <div className="flex flex-col gap-1">
                  {[
                    { id: 'mesofacial', label: 'Mesofacial (Armónico)' },
                    { id: 'dolicofacial', label: 'Dolicofacial (Cara larga)' },
                    { id: 'braquifacial', label: 'Braquifacial (Cara corta)' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateFacial('facialBiotype', item.id as any)}
                      className={`text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                        anamnesisData.facial.facialBiotype === item.id
                          ? 'bg-sky-600 text-white border-sky-600 font-bold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2.2 Simetría Facial Frontal */}
              <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-1.5">
                <span className="font-bold text-[11px] text-slate-900 uppercase block">
                  2.2 Simetría Facial Frontal
                </span>
                <div className="flex flex-col gap-1">
                  {[
                    { id: 'simetrico', label: 'Simétrico' },
                    { id: 'asimetria_mandibular_der', label: 'Asimetría Mandibular Der.' },
                    { id: 'asimetria_mandibular_izq', label: 'Asimetría Mandibular Izq.' },
                    { id: 'asimetria_mentoniana', label: 'Asimetría Mentoniana' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateFacial('facialSymmetry', item.id as any)}
                      className={`text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                        anamnesisData.facial.facialSymmetry === item.id
                          ? 'bg-sky-600 text-white border-sky-600 font-bold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2.3 Proporciones Verticales (Tercios) */}
              <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-1.5">
                <span className="font-bold text-[11px] text-slate-900 uppercase block">
                  2.3 Tercio Inferior Facial
                </span>
                <div className="flex flex-col gap-1">
                  {[
                    { id: 'proporcional', label: 'Proporcional (Normal)' },
                    { id: 'aumentado', label: 'Aumentado (Hiperdivergente)' },
                    { id: 'disminuido', label: 'Disminuido (Hipodivergente)' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateFacial('lowerThirdProportion', item.id as any)}
                      className={`text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                        anamnesisData.facial.lowerThirdProportion === item.id
                          ? 'bg-sky-600 text-white border-sky-600 font-bold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2.4 Perfil Facial Sagital */}
              <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-1.5">
                <span className="font-bold text-[11px] text-slate-900 uppercase block">
                  2.4 Perfil Facial Sagital
                </span>
                <div className="flex flex-col gap-1">
                  {[
                    { id: 'recto', label: 'Recto (Clase I esquelética)' },
                    { id: 'convexo', label: 'Convexo (Clase II / Retrognático)' },
                    { id: 'concavo', label: 'Cóncavo (Clase III / Prognático)' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateFacial('sagittalProfile', item.id as any)}
                      className={`text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                        anamnesisData.facial.sagittalProfile === item.id
                          ? 'bg-sky-600 text-white border-sky-600 font-bold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2.5 Ángulo Nasolabial */}
              <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-1.5">
                <span className="font-bold text-[11px] text-slate-900 uppercase block">
                  2.5 Ángulo Nasolabial
                </span>
                <div className="flex flex-col gap-1">
                  {[
                    { id: 'normal', label: 'Normal (90° - 110°)' },
                    { id: 'agudo', label: 'Agudo (<90° Protrusión maxilar)' },
                    { id: 'obtuso', label: 'Obtuso (>110° Retrusión maxilar)' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateFacial('nasolabialAngle', item.id as any)}
                      className={`text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                        anamnesisData.facial.nasolabialAngle === item.id
                          ? 'bg-sky-600 text-white border-sky-600 font-bold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2.7 Competencia Labial */}
              <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-1.5">
                <span className="font-bold text-[11px] text-slate-900 uppercase block">
                  2.7 Competencia Labial
                </span>
                <div className="flex flex-col gap-1">
                  {[
                    { id: 'competente', label: 'Competente (Sellado pasivo)' },
                    { id: 'incompetente', label: 'Incompetente (Esfuerzo mentalis)' },
                    { id: 'hipertonico', label: 'Hipertónico / Evertido' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateFacial('lipCompetence', item.id as any)}
                      className={`text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                        anamnesisData.facial.lipCompetence === item.id
                          ? item.id === 'incompetente'
                            ? 'bg-rose-700 text-white border-rose-700 font-bold'
                            : 'bg-sky-600 text-white border-sky-600 font-bold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2.8 Sonrisa y Exposición Gingival */}
              <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-1.5">
                <span className="font-bold text-[11px] text-slate-900 uppercase block">
                  2.8 Línea de la Sonrisa
                </span>
                <div className="flex flex-col gap-1">
                  {[
                    { id: 'normal', label: 'Normal / Armónica (0-2 mm encía)' },
                    { id: 'gingival', label: 'Sonrisa Gingival (>2-3 mm encía)' },
                    { id: 'baja', label: 'Sonrisa Baja (no muestra encía)' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateFacial('smileLine', item.id as any)}
                      className={`text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                        anamnesisData.facial.smileLine === item.id
                          ? 'bg-sky-600 text-white border-sky-600 font-bold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-slate-500 font-semibold">Exposición (mm):</span>
                  <input
                    type="number"
                    step="0.5"
                    value={anamnesisData.facial.gingivalExposureMm || 0}
                    onChange={(e) => updateFacial('gingivalExposureMm', e.target.value)}
                    className="w-16 p-1 bg-slate-50 border border-slate-200 rounded text-center text-xs"
                  />
                </div>
              </div>

              {/* 2.9 Corredores Bucales */}
              <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-1.5">
                <span className="font-bold text-[11px] text-slate-900 uppercase block">
                  2.9 Corredores Bucales
                </span>
                <div className="flex flex-col gap-1">
                  {[
                    { id: 'adecuados', label: 'Adecuados / Normales' },
                    { id: 'amplios', label: 'Amplios (Espacios oscuros / estrechez)' },
                    { id: 'estrechos', label: 'Estrechos' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateFacial('buccalCorridors', item.id as any)}
                      className={`text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                        anamnesisData.facial.buccalCorridors === item.id
                          ? 'bg-sky-600 text-white border-sky-600 font-bold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2.10 Posición del Mentón y Ángulo Goníaco */}
              <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-1.5">
                <span className="font-bold text-[11px] text-slate-900 uppercase block">
                  2.10 & 2.11 Mentón y Ángulo Mandibular
                </span>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Posición Mentón:</label>
                  <select
                    value={anamnesisData.facial.chinPosition || 'centrado'}
                    onChange={(e) => updateFacial('chinPosition', e.target.value as any)}
                    className="w-full mt-1 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="centrado">Centrado</option>
                    <option value="desviado_der">Desviado a la Derecha</option>
                    <option value="desviado_izq">Desviado a la Izquierda</option>
                    <option value="retruido">Retruido (Mentón posterior)</option>
                    <option value="protruido">Protruido (Mentón prominente)</option>
                  </select>
                </div>
                <div className="pt-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Ángulo Goníaco Clínico:</label>
                  <select
                    value={anamnesisData.facial.gonialAngle || 'normal'}
                    onChange={(e) => updateFacial('gonialAngle', e.target.value as any)}
                    className="w-full mt-1 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="normal">Normal (~120° - 125°)</option>
                    <option value="aumentado">Aumentado / Abierto (Crecimiento vertical)</option>
                    <option value="disminuido">Cerrado / Disminuido (Crecimiento horizontal)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECCIÓN 3: ANÁLISIS OCLUSAL Y FUNCIONAL (3.1 - 3.12)                      */}
        {/* ========================================================================= */}
        {(activeSubTab === 'all' || activeSubTab === 'occlusal') && (
          <div className="space-y-4 pt-4 border-t-2 border-slate-200">
            <div className="flex items-center gap-2 border-b-2 border-slate-800 pb-1.5">
              <span className="w-6 h-6 rounded-md bg-slate-900 text-white text-xs font-black flex items-center justify-center">
                3
              </span>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                3. ANÁLISIS OCLUSAL Y EXAMEN CLÍNICO FUNCIONAL (3.1 - 3.12)
              </h2>
            </div>

            {/* Dentition type selector */}
            <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-bold text-sky-900 uppercase text-[11px] flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-sky-700" />
                3.1 Tipo de Dentición Actual del Paciente:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'decidua', label: 'Dentición Decidua Completa' },
                  { id: 'mixta_1ra', label: 'Mixta 1ª Fase (1ros Molares e Incisivos)' },
                  { id: 'mixta_2da', label: 'Mixta 2ª Fase (Caninos y Premolares)' },
                  { id: 'permanente_temprana', label: 'Permanente Temprana' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateOcclusal('dentitionType', item.id as any)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                      anamnesisData.occlusal.dentitionType === item.id
                        ? 'bg-sky-700 text-white border-sky-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
              {/* 3.2 Relación Molar Sagital (Der / Izq) */}
              <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-2">
                <span className="font-bold text-[11px] text-slate-900 uppercase block">
                  3.2 Relación Molar Sagital
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Derecha:</label>
                    <select
                      value={anamnesisData.occlusal.molarRelationRight || 'clase_I'}
                      onChange={(e) => updateOcclusal('molarRelationRight', e.target.value as any)}
                      className="w-full mt-1 p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    >
                      <option value="clase_I">Clase I (Neutroclusión)</option>
                      <option value="clase_II">Clase II (Distoclusión)</option>
                      <option value="clase_III">Clase III (Mesioclusión)</option>
                      <option value="plano_recto">Plano Terminal Recto</option>
                      <option value="escalon_mesial">Escalón Mesial</option>
                      <option value="escalon_distal">Escalón Distal</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Izquierda:</label>
                    <select
                      value={anamnesisData.occlusal.molarRelationLeft || 'clase_I'}
                      onChange={(e) => updateOcclusal('molarRelationLeft', e.target.value as any)}
                      className="w-full mt-1 p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    >
                      <option value="clase_I">Clase I (Neutroclusión)</option>
                      <option value="clase_II">Clase II (Distoclusión)</option>
                      <option value="clase_III">Clase III (Mesioclusión)</option>
                      <option value="plano_recto">Plano Terminal Recto</option>
                      <option value="escalon_mesial">Escalón Mesial</option>
                      <option value="escalon_distal">Escalón Distal</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3.3 Relación Canina Sagital */}
              <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-2">
                <span className="font-bold text-[11px] text-slate-900 uppercase block">
                  3.3 Relación Canina Sagital
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Derecha:</label>
                    <select
                      value={anamnesisData.occlusal.canineRelationRight || 'clase_I'}
                      onChange={(e) => updateOcclusal('canineRelationRight', e.target.value as any)}
                      className="w-full mt-1 p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    >
                      <option value="clase_I">Clase I Canina</option>
                      <option value="clase_II">Clase II Canina</option>
                      <option value="clase_III">Clase III Canina</option>
                      <option value="no_erupcionado">No Erupcionado</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Izquierda:</label>
                    <select
                      value={anamnesisData.occlusal.canineRelationLeft || 'clase_I'}
                      onChange={(e) => updateOcclusal('canineRelationLeft', e.target.value as any)}
                      className="w-full mt-1 p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    >
                      <option value="clase_I">Clase I Canina</option>
                      <option value="clase_II">Clase II Canina</option>
                      <option value="clase_III">Clase III Canina</option>
                      <option value="no_erupcionado">No Erupcionado</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3.4 Relación Transversal (Mordida Posterior) */}
              <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-2">
                <span className="font-bold text-[11px] text-slate-900 uppercase block">
                  3.4 Relación Transversal (Oclusión Posterior)
                </span>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Mordida Transversal:</label>
                  <select
                    value={anamnesisData.occlusal.transverseRelation || 'normal'}
                    onChange={(e) => updateOcclusal('transverseRelation', e.target.value as any)}
                    className={`w-full mt-1 p-1.5 rounded-lg text-xs font-bold border ${
                      anamnesisData.occlusal.transverseRelation !== 'normal'
                        ? 'bg-rose-50 border-rose-300 text-rose-900'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="normal">Normal (Resalte transversal armónico)</option>
                    <option value="cruzada_unilateral_der">Mordida Cruzada Unilateral Derecha</option>
                    <option value="cruzada_unilateral_izq">Mordida Cruzada Unilateral Izquierda</option>
                    <option value="cruzada_bilateral">Mordida Cruzada Bilateral (Colapso maxilar)</option>
                    <option value="tijera_brodie">Mordida en Tijera (Síndrome Brodie)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase block">Arcada Sup:</label>
                    <select
                      value={anamnesisData.occlusal.archFormUpper || 'parabolica'}
                      onChange={(e) => updateOcclusal('archFormUpper', e.target.value as any)}
                      className="w-full mt-0.5 p-1 bg-slate-50 border border-slate-200 rounded text-xs"
                    >
                      <option value="parabolica">Parabólica (Normal)</option>
                      <option value="triangular_ojival">Triangular / Ojival</option>
                      <option value="cuadrada">Cuadrada</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase block">Arcada Inf:</label>
                    <select
                      value={anamnesisData.occlusal.archFormLower || 'parabolica'}
                      onChange={(e) => updateOcclusal('archFormLower', e.target.value as any)}
                      className="w-full mt-0.5 p-1 bg-slate-50 border border-slate-200 rounded text-xs"
                    >
                      <option value="parabolica">Parabólica (Normal)</option>
                      <option value="triangular_ojival">Triangular</option>
                      <option value="cuadrada">Cuadrada</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3.5 Relación Vertical Anterior (Overbite) */}
              <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-2">
                <span className="font-bold text-[11px] text-slate-900 uppercase block">
                  3.5 Relación Vertical Anterior (Overbite)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Tipo:</label>
                    <select
                      value={anamnesisData.occlusal.overbiteType || 'normal'}
                      onChange={(e) => updateOcclusal('overbiteType', e.target.value as any)}
                      className="w-full mt-1 p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    >
                      <option value="normal">Normal (2 a 3 mm / 1/3)</option>
                      <option value="profunda">Mordida Profunda (&gt;3 mm)</option>
                      <option value="abierta">Mordida Abierta Anterior</option>
                      <option value="borde_a_borde">Borde a Borde (0 mm)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Medida (mm):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={anamnesisData.occlusal.overbiteMm || 0}
                      onChange={(e) => updateOcclusal('overbiteMm', e.target.value)}
                      placeholder="Ej. 2.5 mm"
                      className="w-full mt-1 p-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 3.6 Relación Sagital Anterior (Overjet) */}
              <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-2">
                <span className="font-bold text-[11px] text-slate-900 uppercase block">
                  3.6 Relación Sagital Anterior (Overjet / Resalte)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Tipo:</label>
                    <select
                      value={anamnesisData.occlusal.overjetType || 'normal'}
                      onChange={(e) => updateOcclusal('overjetType', e.target.value as any)}
                      className="w-full mt-1 p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    >
                      <option value="normal">Normal (2 a 3 mm)</option>
                      <option value="aumentado">Aumentado (&gt;3 mm)</option>
                      <option value="disminuido">Disminuido (0 a 1 mm)</option>
                      <option value="cruzada_anterior">Mordida Cruzada Anterior</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Medida (mm):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={anamnesisData.occlusal.overjetMm || 0}
                      onChange={(e) => updateOcclusal('overjetMm', e.target.value)}
                      placeholder="Ej. 2.0 mm"
                      className="w-full mt-1 p-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 3.7 Congruencia de Líneas Medias */}
              <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-2">
                <span className="font-bold text-[11px] text-slate-900 uppercase block">
                  3.7 Congruencia de Líneas Medias
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase block">Línea Superior:</label>
                    <select
                      value={anamnesisData.occlusal.upperMidlineDev || 'centrada'}
                      onChange={(e) => updateOcclusal('upperMidlineDev', e.target.value as any)}
                      className="w-full mt-1 p-1 bg-slate-50 border border-slate-200 rounded text-xs"
                    >
                      <option value="centrada">Coincidente / Centrada</option>
                      <option value="desviada_der">Desviada Derecha</option>
                      <option value="desviada_izq">Desviada Izquierda</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase block">Línea Inferior:</label>
                    <select
                      value={anamnesisData.occlusal.lowerMidlineDev || 'centrada'}
                      onChange={(e) => updateOcclusal('lowerMidlineDev', e.target.value as any)}
                      className="w-full mt-1 p-1 bg-slate-50 border border-slate-200 rounded text-xs"
                    >
                      <option value="centrada">Coincidente / Centrada</option>
                      <option value="desviada_der">Desviada Derecha</option>
                      <option value="desviada_izq">Desviada Izquierda</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3.8 & 3.9 Curva de Spee & Manipulación RC vs MIC */}
              <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-2">
                <span className="font-bold text-[11px] text-slate-900 uppercase block">
                  3.8 & 3.9 Curva de Spee & Manipulación RC / MIC
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Curva de Spee:</label>
                    <select
                      value={anamnesisData.occlusal.curveOfSpee || 'moderada'}
                      onChange={(e) => updateOcclusal('curveOfSpee', e.target.value as any)}
                      className="w-full mt-1 p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="plana">Plana (&lt;1.5 mm)</option>
                      <option value="moderada">Moderada (1.5 - 2.5 mm)</option>
                      <option value="acentuada">Acentuada (&gt;2.5 mm)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Coincidencia RC = MIC:</label>
                    <select
                      value={anamnesisData.occlusal.rcMicCoincident ? 'si' : 'no'}
                      onChange={(e) => updateOcclusal('rcMicCoincident', e.target.value === 'si')}
                      className={`w-full mt-1 p-1 rounded-lg text-xs font-bold border ${
                        !anamnesisData.occlusal.rcMicCoincident
                          ? 'bg-amber-50 border-amber-300 text-amber-900'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="si">Sí Coincidente (RC = MIC)</option>
                      <option value="no">Discrepancia / Deslizamiento</option>
                    </select>
                  </div>
                </div>
                {!anamnesisData.occlusal.rcMicCoincident && (
                  <input
                    type="text"
                    value={anamnesisData.occlusal.rcMicSlideDetails || ''}
                    onChange={(e) => updateOcclusal('rcMicSlideDetails', e.target.value)}
                    placeholder="Detalles de deflexión o interferencia..."
                    className="w-full mt-1 p-1 bg-amber-50/50 border border-amber-200 rounded text-xs"
                  />
                )}
              </div>

              {/* 3.10 Articulación Temporomandibular (ATM) */}
              <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-2">
                <span className="font-bold text-[11px] text-slate-900 uppercase block">
                  3.10 Examen de ATM & Dinámica Mandibular
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase block">Signos / Ruidos:</label>
                    <select
                      value={anamnesisData.occlusal.atmStatus || 'asintomatica'}
                      onChange={(e) => updateOcclusal('atmStatus', e.target.value as any)}
                      className="w-full mt-1 p-1 bg-slate-50 border border-slate-200 rounded text-xs font-semibold"
                    >
                      <option value="asintomatica">Asintomática (Normal)</option>
                      <option value="chasquido">Chasquido / Clic articular</option>
                      <option value="crepitacion">Crepitación</option>
                      <option value="dolor_palpacion">Dolor a la palpación</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase block">Trayectoria Apertura:</label>
                    <select
                      value={anamnesisData.occlusal.mandibularDeviationOnOpen || 'recta'}
                      onChange={(e) => updateOcclusal('mandibularDeviationOnOpen', e.target.value as any)}
                      className="w-full mt-1 p-1 bg-slate-50 border border-slate-200 rounded text-xs"
                    >
                      <option value="recta">Recta / Normal</option>
                      <option value="deflexion_der">Deflexión Derecha</option>
                      <option value="deflexion_izq">Deflexión Izquierda</option>
                      <option value="bayoneta_s">Desviación en &quot;S&quot;</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3.11 Espacio y Tejidos Blandos Intraorales */}
              <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-2">
                <span className="font-bold text-[11px] text-slate-900 uppercase block">
                  3.11 Espacio, Apiñamiento & Frenillos
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(anamnesisData.occlusal.primateSpacesPresent)}
                      onChange={(e) => updateOcclusal('primateSpacesPresent', e.target.checked)}
                      className="rounded text-sky-600"
                    />
                    <span>Espacios de Primate Presentes</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(anamnesisData.occlusal.frenumUpperAbnormal)}
                      onChange={(e) => updateOcclusal('frenumUpperAbnormal', e.target.checked)}
                      className="rounded text-sky-600"
                    />
                    <span>Frenillo Labial Hipertrófico</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer col-span-2">
                    <input
                      type="checkbox"
                      checked={Boolean(anamnesisData.occlusal.ankyloglossiaLingualFrenum)}
                      onChange={(e) => updateOcclusal('ankyloglossiaLingualFrenum', e.target.checked)}
                      className="rounded text-sky-600"
                    />
                    <span className="font-semibold text-rose-700">Frenillo Lingual Corto (Anquiloglosia)</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase block">Apiñamiento Sup:</label>
                    <select
                      value={anamnesisData.occlusal.crowdingUpper || 'ninguno'}
                      onChange={(e) => updateOcclusal('crowdingUpper', e.target.value as any)}
                      className="w-full mt-0.5 p-1 bg-slate-50 border border-slate-200 rounded text-xs"
                    >
                      <option value="ninguno">Ninguno</option>
                      <option value="leve">Leve (1-3 mm)</option>
                      <option value="moderado">Moderado (4-6 mm)</option>
                      <option value="severo">Severo (&gt;6 mm)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase block">Apiñamiento Inf:</label>
                    <select
                      value={anamnesisData.occlusal.crowdingLower || 'ninguno'}
                      onChange={(e) => updateOcclusal('crowdingLower', e.target.value as any)}
                      className="w-full mt-0.5 p-1 bg-slate-50 border border-slate-200 rounded text-xs"
                    >
                      <option value="ninguno">Ninguno</option>
                      <option value="leve">Leve (1-3 mm)</option>
                      <option value="moderado">Moderado (4-6 mm)</option>
                      <option value="severo">Severo (&gt;6 mm)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECCIÓN 4: DIAGNÓSTICO & PLAN TERAPÉUTICO INTERCEPTIVO                    */}
        {/* ========================================================================= */}
        {(activeSubTab === 'all' || activeSubTab === 'plan') && (
          <div className="space-y-4 pt-4 border-t-2 border-slate-200">
            <div className="flex items-center gap-2 border-b-2 border-slate-800 pb-1.5">
              <span className="w-6 h-6 rounded-md bg-slate-900 text-white text-xs font-black flex items-center justify-center">
                4
              </span>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                4. DIAGNÓSTICO MORFOFUNCIONAL & PLAN DE ACCIÓN INTERCEPTIVA
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-1.5">
                <span className="font-extrabold text-[11px] text-slate-800 uppercase block flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-sky-600" />
                  Diagnóstico Esquelético
                </span>
                <textarea
                  rows={3}
                  value={anamnesisData.occlusal.skeletalDiagnosis || ''}
                  onChange={(e) => updateOcclusal('skeletalDiagnosis', e.target.value)}
                  placeholder="Relación maxilomandibular, patrón vertical..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500"
                />
              </div>

              <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-1.5">
                <span className="font-extrabold text-[11px] text-slate-800 uppercase block flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-sky-600" />
                  Diagnóstico Dental
                </span>
                <textarea
                  rows={3}
                  value={anamnesisData.occlusal.dentalDiagnosis || ''}
                  onChange={(e) => updateOcclusal('dentalDiagnosis', e.target.value)}
                  placeholder="Relaciones molares, caninas, mordida cruzada, resalte..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500"
                />
              </div>

              <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-1.5">
                <span className="font-extrabold text-[11px] text-slate-800 uppercase block flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
                  Diagnóstico Funcional
                </span>
                <textarea
                  rows={3}
                  value={anamnesisData.occlusal.functionalDiagnosis || ''}
                  onChange={(e) => updateOcclusal('functionalDiagnosis', e.target.value)}
                  placeholder="Vía aérea, deglución, dinámica lingual, hábitos activos..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-sky-500"
                />
              </div>
            </div>

            {/* Aparatología Ortopédica / Interceptiva Indicada */}
            <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs uppercase tracking-wide text-slate-900">
                  Aparatología Ortopédica & Interceptiva Propuesta:
                </span>
                <span className="text-[11px] font-bold text-sky-700">
                  {(anamnesisData.occlusal.indicatedAppliances || []).length} seleccionados
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {APPLIANCES_CATALOG.map((appliance) => {
                  const isChecked = (anamnesisData.occlusal.indicatedAppliances || []).includes(appliance);
                  return (
                    <button
                      key={appliance}
                      type="button"
                      onClick={() => toggleAppliance(appliance)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                        isChecked
                          ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-white border-white text-sky-700' : 'border-slate-400 bg-transparent'
                        }`}
                      >
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 fill-current" />}
                      </div>
                      <span className="text-[11px] line-clamp-2">{appliance}</span>
                    </button>
                  );
                })}
              </div>

              {/* Treatment Plan Notes and Follow-up */}
              <div className="pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                <div className="md:col-span-8">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Plan Terapéutico Detallado & Observaciones Clínicas:
                  </label>
                  <textarea
                    rows={2}
                    value={anamnesisData.occlusal.treatmentPlanNotes || ''}
                    onChange={(e) => updateOcclusal('treatmentPlanNotes', e.target.value)}
                    placeholder="Secuencia de activación, control de hábitos, instrucciones a los padres..."
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Duración Estimada:
                  </label>
                  <input
                    type="text"
                    value={anamnesisData.occlusal.treatmentTimingMonths || ''}
                    onChange={(e) => updateOcclusal('treatmentTimingMonths', e.target.value)}
                    placeholder="Ej. 12 meses"
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Próxima Reevaluación:
                  </label>
                  <input
                    type="date"
                    value={anamnesisData.occlusal.reevaluationDate || ''}
                    onChange={(e) => updateOcclusal('reevaluationDate', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Official Signatures Row (Printable) */}
            <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-12 text-center text-xs">
              <div className="space-y-1">
                <div className="border-b border-slate-800 w-3/4 mx-auto pb-6"></div>
                <p className="font-extrabold uppercase text-[11px] text-slate-900">
                  {anamnesisData.evaluatorDoctor || 'ODONTÓLOGO ESPECIALISTA'}
                </p>
                <p className="text-[10px] text-slate-500 uppercase">
                  CIRUJANO DENTISTA / ORTOPEDISTA MAXILOFACIAL
                </p>
              </div>

              <div className="space-y-1">
                <div className="border-b border-slate-800 w-3/4 mx-auto pb-6"></div>
                <p className="font-extrabold uppercase text-[11px] text-slate-900">
                  {patient.guardianName || 'FIRMA PADRE / APODERADO'}
                </p>
                <p className="text-[10px] text-slate-500 uppercase">
                  CONFORMIDAD Y COMPROMISO DE COLABORACIÓN
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Save / Print Bar for convenience */}
      <div className="fixed bottom-4 right-6 bg-slate-900/90 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 z-30 print:hidden">
        <span className="text-xs font-medium hidden sm:inline text-slate-300">
          Guía de Ortodoncia Interceptiva • {patient.firstName} {patient.lastName}
        </span>
        <button
          type="button"
          onClick={handlePrint}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all"
          title="Imprimir"
        >
          <Printer className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
        >
          {isSavedRecently ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-100" />
              ¡Guardado!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar Cambios
            </>
          )}
        </button>
      </div>
    </div>
  );
};
