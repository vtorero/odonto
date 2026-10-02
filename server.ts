import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy Google Gen AI helper
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    aiEnabled: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Gemini Dental Assistant Endpoint
app.post("/api/gemini/clinical-assistant", async (req, res) => {
  try {
    const { action, patientInfo, clinicalData, treatmentData } = req.body;
    const ai = getGenAI();

    if (!ai) {
      // Return smart fallback clinical response if API key is not yet set
      let fallbackText = "";
      if (action === "clinical_note") {
        fallbackText = `**Nota de Evolución Clínica:**\nPaciente ${patientInfo?.name || "evaluado"} acude a consulta para valoración odontológica. Se revisa estado de piezas dentales y tejidos blandos. Se recomienda continuar con el plan de tratamiento establecido y mantener controles periódicos.`;
      } else if (action === "explain_treatment") {
        fallbackText = `**Resumen del Tratamiento para el Paciente:**\nEstimado/a ${patientInfo?.name || "paciente"}, el plan propuesto busca restaurar la salud y funcionalidad de su boca mediante procedimientos mínimamente invasivos. Se realizarán sesiones programadas con anestesia local para su máxima comodidad.`;
      } else if (action === "post_op_care") {
        fallbackText = `**Indicaciones Post-Tratamiento:**\n1. No enjuagarse la boca enérgicamente en las primeras 24 horas.\n2. Aplicar frío local intermitente si nota ligera inflamación.\n3. Dieta blanda y tibia por 48 horas.\n4. Tomar la medicación prescrita según la pauta del odontólogo.\n5. En caso de dolor persistente o sangrado, contactar a la clínica inmediatamente.`;
      } else {
        fallbackText = `Asistente Odontológico: Análisis clínico completado con éxito.`;
      }
      return res.json({ text: fallbackText, simulated: true });
    }

    let systemInstruction = "Eres un asistente odontológico clínico y odontólogo especialista experto en gestión de clínicas dentales. Redactas en español profesional, claro, riguroso y empático.";
    let prompt = "";

    if (action === "clinical_note") {
      prompt = `Genera una nota de evolución clínica formal y estructurada para la historia clínica odontológica.
Datos del paciente:
- Nombre: ${patientInfo?.name}
- Edad: ${patientInfo?.age || "No especificada"}
- Antecedentes/Alergias: ${patientInfo?.allergies || "Ninguna conocida"}
- Hallazgos clínicos / Odontograma: ${clinicalData?.findings || "Revisión de rutina"}
- Procedimiento realizado: ${clinicalData?.procedure || "Evaluación odontológica general"}
- Medicación/Indicación: ${clinicalData?.prescriptions || "Higiene oral"}

Estructura requerida:
1. Motivo de Consulta y Examen Clínico
2. Diagnóstico Presuntivo/Definitivo
3. Procedimiento Detallado Realizado
4. Recomendaciones e Indicaciones al Paciente
5. Próxima Cita Recomendada`;
    } else if (action === "explain_treatment") {
      prompt = `Redacta una explicación amigable, sin tecnicismos excesivos y muy tranquilizadora para el paciente ${patientInfo?.name}.
Tratamiento propuesto: ${treatmentData?.name || "Plan de tratamiento dental"}
Detalles y piezas afectadas: ${treatmentData?.details || "Procedimientos restauradores y profilaxis"}
Costo total estimado: ${treatmentData?.cost || "Por definir"}

Explica de forma cálida en qué consiste el procedimiento, por qué es beneficioso para su salud oral, qué sentirá (asegurar que no habrá dolor gracias a la anestesia), la duración estimada y los cuidados.`;
    } else if (action === "post_op_care") {
      prompt = `Genera una guía clara de cuidados e instrucciones post-operatorias para el paciente ${patientInfo?.name} tras el siguiente procedimiento: ${clinicalData?.procedure || "Tratamiento odontológico"}.
Incluye recomendaciones sobre:
- Cuidados inmediatos (primeras 24 horas).
- Alimentación e higiene bucal permitida.
- Manejo de inflamación o molestias.
- Signos de alarma para contactar de urgencia a la clínica.`;
    } else {
      prompt = `Analiza los siguientes datos clínicos dentales y genera un resumen ejecutivo y recomendaciones: ${JSON.stringify(req.body)}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const text = response.text || "No se pudo generar respuesta clínica.";
    return res.json({ text, simulated: false });
  } catch (error: any) {
    console.error("Gemini Assistant Error:", error);
    return res.status(500).json({
      error: "Error procesando solicitud clínica con IA",
      details: error.message || String(error),
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Dental Clinic Server running on http://localhost:${PORT}`);
  });
}

startServer();
