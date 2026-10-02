/**
 * Servicio de conexión con la API REST de Slim 4 + MySQL
 * Permite alternar entre el almacenamiento local (Mock / LocalStorage)
 * y el servidor Slim 4 con MySQL de forma transparente mediante la variable VITE_API_BASE_URL.
 */

import {
  Patient,
  OdontogramData,
  TreatmentPlan,
  ClinicalNote,
  StandardTreatmentRow,
  DentalDoctor,
  Appointment,
  InventoryItem,
} from '../types';

const env = (import.meta as any).env || {};
const API_BASE_URL: string = `http://localhost/backend/api`;

class ApiService {
  private isExternalBackend(): boolean {
    return Boolean(env.VITE_API_BASE_URL);
  }

  // --- PACIENTES ---
  async getPatients(): Promise<Patient[]> {

    const res = await fetch(`${API_BASE_URL}/patients`);
    if (!res.ok) throw new Error('Error al obtener pacientes');
    return res.json();
  }

    // --- inventory ---
    async getInventory(): Promise<Patient[]> {

      const res = await fetch(`${API_BASE_URL}/inventory`);
      if (!res.ok) throw new Error('Error al obtener pacientes');
      return res.json();
    }

// agenda

async getAppointments(): Promise<Patient[]> {

  const res = await fetch(`${API_BASE_URL}/appointments`);
  if (!res.ok) throw new Error('Error al obtener appointments');
  return res.json();
}

  //cabines

  async getCabines(): Promise<Patient[]> {

    const res = await fetch(`${API_BASE_URL}/cabines`);
    if (!res.ok) throw new Error('Error al obtener cabinas');
    return res.json();
  }



  async getDoctors():Promise<DentalDoctor[]>{
    const res = await fetch(`${API_BASE_URL}/doctors`);
    if (!res.ok) throw new Error('Error al obtener Doctores');
    return res.json();
  }

  async getPatientById(id: string): Promise<Patient> {
    if (!this.isExternalBackend()) {
      const saved = localStorage.getItem('odonto_patients');
      const list: Patient[] = saved ? JSON.parse(saved) : [];
      const found = list.find((p) => p.id === id);
      if (!found) throw new Error('Paciente no encontrado');
      return found;
    }
    const res = await fetch(`${API_BASE_URL}/patients/${id}`);
    if (!res.ok) throw new Error('Error al obtener paciente');
    return res.json();
  }

/**
 *
 * @param appointment actualizar estado de appointments
 * @returns
 */

async updateAppointmentestado(appointment: Appointment): Promise<Appointment> {

  const endpoint =`${API_BASE_URL}/appointment-estado`;
 const res = await fetch(endpoint, {
   method:'POST',
   headers: this.getHeaders(),
   body: JSON.stringify(appointment),
 });
 console.log("res",res);
 // Token caducado o inválido
 if (res.status === 401) {
   localStorage.removeItem('token');
   window.location.reload();
 }

 if (!res.ok) {
   const errorText = await res.text();
   throw new Error(
     errorText || 'Error al guardar datos de agenda'
   );
 }
 return await res.json();
}

/**
 *
 * @param appointment save items
 * @returns
 */

async saveInventoryItem(item:InventoryItem): Promise<InventoryItem> {

  const isUpdate = item.id && !item.id.startsWith('mat-');

  const endpoint = isUpdate
    ? `${API_BASE_URL}/inventory/${item.id}`
    : `${API_BASE_URL}/inventory`;

  const method = isUpdate ? 'PUT' : 'POST';

  const res = await fetch(endpoint, {
    method,
    headers: this.getHeaders(),
    body: JSON.stringify(item),
  });
  if (res.status === 401) {
    //localStorage.removeItem('token');
    //window.location.reload();
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      errorText || 'Error al guardar datos del item'
    );
  }
  return await res.json();
}


  async saveAppointments(appointment: Appointment): Promise<Appointment> {

     const endpoint =`${API_BASE_URL}/appointments`;
    const res = await fetch(endpoint, {
      method:'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(appointment),
    });
    console.log("res",res);
    // Token caducado o inválido
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.reload();
    }

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        errorText || 'Error al guardar datos de agenda'
      );
    }
    return await res.json();
  }


  async savePatient(patient: Patient): Promise<Patient> {

    const isUpdate = patient.id && !patient.id.startsWith('pa-');

    const endpoint = isUpdate
      ? `${API_BASE_URL}/patients/${patient.id}`
      : `${API_BASE_URL}/patients`;

    const method = isUpdate ? 'PUT' : 'POST';

    const res = await fetch(endpoint, {
      method,
      headers: this.getHeaders(),
      body: JSON.stringify(patient),
    });
    console.log("res",res);
    // Token caducado o inválido
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.reload();
      // Avisar a React
      //window.dispatchEvent(new Event('auth-expired'));

      //throw new Error('Sesión expirada');

    }

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        errorText || 'Error al guardar datos del paciente'
      );
    }

    return await res.json();
  }

  async deletePatient(id: string): Promise<void> {
    if (!this.isExternalBackend()) {
      const saved = localStorage.getItem('odonto_patients');
      if (saved) {
        const list: Patient[] = JSON.parse(saved);
        const filtered = list.filter((p) => p.id !== id);
        localStorage.setItem('odonto_patients', JSON.stringify(filtered));
      }
      return;
    }
    const res = await fetch(`${API_BASE_URL}/patients/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Error al eliminar paciente');
  }

  // --- ODONTOGRAMA (FDI) ---
  async getOdontogram(patientId: string): Promise<OdontogramData> {
    if (!this.isExternalBackend()) {
      const saved = localStorage.getItem('odonto_odontograms');
      const odoMap = saved ? JSON.parse(saved) : {};
      return odoMap[patientId] || {};
    }
    const res = await fetch(`${API_BASE_URL}/patients/${patientId}/odontogram`);
    if (!res.ok) throw new Error('Error al obtener odontograma');
    return res.json();
  }

  async saveOdontogram(
    patientId: string,
    odontogram: OdontogramData
  ): Promise<OdontogramData> {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${API_BASE_URL}/patients/${patientId}/odontogram`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',"Authorization": `Bearer ${token}` },
         body: JSON.stringify({ odontogram }),
      }
    );
    if (!res.ok) throw new Error('Error al guardar odontograma');
    return res.json();
  }

  // --- PLAN DE TRATAMIENTO ESTÁNDAR (21 ÍTEMS ODONTODESA) ---
  async getTreatmentPlan(patientId: string): Promise<StandardTreatmentRow[]> {
    if (!this.isExternalBackend()) {
      const saved = localStorage.getItem('odonto_treatment_plans');
      const list: TreatmentPlan[] = saved ? JSON.parse(saved) : [];
      // Se puede obtener del registro de paciente
      return [];
    }
    const res = await fetch(
      `${API_BASE_URL}/patients/${patientId}/treatment-plan`
    );
    if (!res.ok) throw new Error('Error al obtener plan de tratamiento');
    return res.json();
  }

  async saveTreatmentPlan(
    patientId: string,
    rows: StandardTreatmentRow[]
  ): Promise<StandardTreatmentRow[]> {
    if (!this.isExternalBackend()) {
      // Local handled via patient object save
      return rows;
    }
    const res = await fetch(
      `${API_BASE_URL}/patients/${patientId}/treatment-plan`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: rows }),
      }
    );
    if (!res.ok) throw new Error('Error al guardar plan de tratamiento');
    return res.json();
  }

  // --- NOTAS DE EVOLUCIÓN, ENTREGAS Y SALDOS ---
  async getClinicalNotes(patientId: string): Promise<ClinicalNote[]> {
    if (!this.isExternalBackend()) {
      const saved = localStorage.getItem('odonto_clinical_notes');
      const list: ClinicalNote[] = saved ? JSON.parse(saved) : [];
      return list.filter((n) => n.patientId === patientId);
    }
    const res = await fetch(`${API_BASE_URL}/patients/${patientId}/evolutions`);
    if (!res.ok) throw new Error('Error al obtener evoluciones');
    return res.json();
  }

  async saveClinicalNote(note: ClinicalNote): Promise<ClinicalNote> {
    if (!this.isExternalBackend()) {
      const saved = localStorage.getItem('odonto_clinical_notes');
      const list: ClinicalNote[] = saved ? JSON.parse(saved) : [];
      const idx = list.findIndex((n) => n.id === note.id);
      let updated: ClinicalNote[];
      if (idx >= 0) {
        updated = [...list];
        updated[idx] = note;
      } else {
        updated = [note, ...list];
      }
      localStorage.setItem('odonto_clinical_notes', JSON.stringify(updated));
      return note;
    }
    const res = await fetch(
      `${API_BASE_URL}/patients/${note.patientId}/evolutions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note),
      }
    );
    if (!res.ok) throw new Error('Error al registrar evolución clínica');
    return res.json();
  }
  // --- USUARIOS Y PERFILES (ADMIN, DOCTOR, ASISTENTE, PACIENTE) ---
  async getUsers(): Promise<any[]> {
    if (!this.isExternalBackend()) {
      const saved = localStorage.getItem('odonto_users');
      return saved ? JSON.parse(saved) : [];
    }
    const res = await fetch(`${API_BASE_URL}/users`);
    if (!res.ok) throw new Error('Error al obtener usuarios');
    return res.json();
  }

  async saveUser(user: any): Promise<any> {
    if (!this.isExternalBackend()) {
      const saved = localStorage.getItem('odonto_users');
      const list: any[] = saved ? JSON.parse(saved) : [];
      const idx = list.findIndex((u) => u.id === user.id);
      let updated: any[];
      if (idx >= 0) {
        updated = [...list];
        updated[idx] = user;
      } else {
        updated = [user, ...list];
      }
      localStorage.setItem('odonto_users', JSON.stringify(updated));
      return user;
    }

    const isUpdate = user.id && !user.id.startsWith('usr-new-');
    const endpoint = isUpdate ? `${API_BASE_URL}/users/${user.id}` : `${API_BASE_URL}/users`;
    const method = isUpdate ? 'PUT' : 'POST';

    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!res.ok) throw new Error('Error al guardar usuario');
    return res.json();
  }




  async deleteUser(id: string): Promise<void> {
    if (!this.isExternalBackend()) {
      const saved = localStorage.getItem('odonto_users');
      if (saved) {
        const list: any[] = JSON.parse(saved);
        const filtered = list.filter((u) => u.id !== id);
        localStorage.setItem('odonto_users', JSON.stringify(filtered));
      }
      return;
    }
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Error al eliminar usuario');
  }

  // --- REGISTRO DE AUDITORÍA ---
  async getAuditLogs(): Promise<any[]> {
    if (!this.isExternalBackend()) {
      const saved = localStorage.getItem('odonto_audit_logs');
      return saved ? JSON.parse(saved) : [];
    }
    const res = await fetch(`${API_BASE_URL}/audit-logs`);
    if (!res.ok) throw new Error('Error al obtener logs');
    return res.json();
  }

  async addAuditLog(entry: any): Promise<void> {
    if (!this.isExternalBackend()) {
      const saved = localStorage.getItem('odonto_audit_logs');
      const list = saved ? JSON.parse(saved) : [];
      const newEntry = {
        ...entry,
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
      localStorage.setItem('odonto_audit_logs', JSON.stringify([newEntry, ...list]));
      return;
    }
    await fetch(`${API_BASE_URL}/audit-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
  }

  async login(
    username: string,
    password: string
  ): Promise<any> {


    const response = await fetch(
      `${API_BASE_URL}/auth/login`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          username,
          password,
        }),
      }
    );


    const responseText = await response.json();


    if (response.status==401) {
      return {
        success: false,
        error: responseText.error || "Credenciales inválidas",
        status: 401,
      };
    }

    if (!responseText.token) {
         return {
        success: false,
        error: responseText.error || "El servidor no devolvió un token JWT",
        status: response.status,
      };
    }

    localStorage.setItem("token",responseText.token);

    return responseText;
  }


  private getHeaders(): HeadersInit {
    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        ...(token ? {
            "Authorization": `Bearer ${token}`
        } : {})
    };
}


logout() {
  localStorage.removeItem("token");
}

}



export const api = new ApiService();
