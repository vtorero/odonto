<?php
declare(strict_types=1);

namespace App\Controllers;

use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class DentalDoctorController
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * GET /api/patients
     * Listado general de pacientes con información resumida
     */
    public function getAll(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $search = $params['q'] ?? '';

        $sql = "SELECT `doctors`.`id`,
            `doctors`.`user_id`,
            `doctors`.`first_name`,
            `doctors`.`last_name`,
            `doctors`.`license_number`,
            `doctors`.`specialty`,
            `doctors`.`phone`,
            `doctors`.`email`,
            `doctors`.`color_hex`,
            `doctors`.`is_active`,
            `doctors`.`created_at`,
            `doctors`.`updated_at`
                FROM doctors";

        if (!empty($search)) {
            $sql .= " WHERE first_name LIKE :s OR last_name LIKE :s ";
        }

        $sql .= " ORDER BY updated_at DESC";

        $stmt = $this->db->prepare($sql);
        if (!empty($search)) {
            $stmt->execute([':s' => "%{$search}%"]);
        } else {
            $stmt->execute();
        }

        $doctors = $stmt->fetchAll();

        // Mapeo a camelCase para el frontend React
        $result = $doctors;

        $response->getBody()->write(json_encode($result, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/patients/{id}
     * Obtener ficha clínica completa (2 páginas Odontodesa, anamnesis, odontograma, evoluciones)
     */
    public function getById(Request $request, Response $response, array $args): Response
    {
        $rawId = $args['id'];
        $id = (int)str_replace('pat-', '', $rawId);

        $stmt = $this->db->prepare("
            SELECT p.*,
                   CONCAT(d.first_name, ' ', d.last_name) AS responsibleDoctor,
                   d.license_number AS doctorLicense
            FROM patients p
            LEFT JOIN doctors d ON p.responsible_doctor_id = d.id
            WHERE p.id = ?
        ");
        $stmt->execute([$id]);
        $patient = $stmt->fetch();

        if (!$patient) {
            $response->getBody()->write(json_encode(['error' => 'Paciente no encontrado']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        // 1. Obtener Odontograma
        $odontogramStmt = $this->db->prepare("SELECT * FROM odontogram_teeth WHERE patient_id = ? ORDER BY updated_at DESC LIMIT 1");
        $odontogramStmt->execute([$id]);
        $odontogram = $odontogramStmt->fetch();

        // 2. Obtener Evolución Clínica & Entregas/Saldos
        $notesStmt = $this->db->prepare("
            SELECT cn.*, CONCAT(d.first_name, ' ', d.last_name) AS doctor_name
            FROM clinical_evolutions cn
            LEFT JOIN doctors d ON cn.doctor_id = d.id
            WHERE cn.patient_id = ?
            ORDER BY cn.date DESC, cn.id DESC
        ");
        $notesStmt->execute([$id]);
        $clinicalNotes = $notesStmt->fetchAll();

        // 3. Obtener Planes de Tratamiento
        $plansStmt = $this->db->prepare("SELECT * FROM treatment_plans WHERE patient_id = ? ORDER BY created_at DESC");
        $plansStmt->execute([$id]);
        $treatmentPlans = $plansStmt->fetchAll();

        $formatted = $this->formatPatient($patient);
        $formatted['odontogramData'] = $odontogram ? json_decode($odontogram['data_json'], true) : [];
        $formatted['clinicalNotes'] = array_map([$this, 'formatClinicalNote'], $clinicalNotes);
        $formatted['treatmentPlans'] = array_map([$this, 'formatTreatmentPlan'], $treatmentPlans);

        $response->getBody()->write(json_encode($formatted, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/patients
     * Crear nuevo paciente con historia clínica Odontodesa
     */
    public function create(Request $request, Response $response): Response
    {
        $data = json_decode((string)$request->getBody(), true);

        if (empty($data['firstName']) || empty($data['lastName'])) {
            $response->getBody()->write(json_encode(['error' => 'Nombres y Apellidos son requeridos']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $recordNumber = $data['recordNumber'] ?? ('OD-' . date('Y') . '-' . str_pad((string)rand(100, 999), 4, '0', STR_PAD_LEFT));

        $stmt = $this->db->prepare("
            INSERT INTO patients (
                 first_name, last_name, id_number, birth_date,
                gender, phone, email, address, occupation,
                blood_type, allergies, medical_conditions, current_medications,
                emergency_contact_name, emergency_contact_phone,
                anamnesis_json, stomatological_exam_json, diagnosis_json, treatment_plan_summary_json,
                notes, responsible_doctor_id
            ) VALUES (
                ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?,
                ?, ?, ?, ?,
                ?, ?
            )
        ");

        $stmt->execute([
           // $recordNumber,
            $data['firstName'],
            $data['lastName'],
            $data['idNumber'] ?? null,
            $data['birthDate'] ?? null,
            $data['gender'] ?? 'other',
            $data['phone'] ?? null,
            $data['email'] ?? null,
            $data['address'] ?? null,
            $data['occupation'] ?? null,
            $data['bloodType'] ?? null,
            $data['allergies'] ?? null,
            $data['medicalConditions'] ?? null,
            $data['currentMedications'] ?? null,
            $data['emergencyContactName'] ?? null,
            $data['emergencyContactPhone'] ?? null,
            isset($data['anamnesis']) ? json_encode($data['anamnesis'], JSON_UNESCAPED_UNICODE) : null,
            isset($data['stomatologicalExam']) ? json_encode($data['stomatologicalExam'], JSON_UNESCAPED_UNICODE) : null,
            isset($data['diagnosis']) ? json_encode($data['diagnosis'], JSON_UNESCAPED_UNICODE) : null,
            isset($data['treatmentPlanSummary']) ? json_encode($data['treatmentPlanSummary'], JSON_UNESCAPED_UNICODE) : null,
            $data['notes'] ?? null,
            $data['doctorId'] ?? null
        ]);

        $newId = (int)$this->db->lastInsertId();

        // Inicializar odontograma si viene en el payload
        if (!empty($data['odontogram'])) {
            $odoStmt = $this->db->prepare("INSERT INTO odontograms (patient_id, data_json, version) VALUES (?, ?, 1)");
            $odoStmt->execute([$newId, json_encode($data['odontogram'], JSON_UNESCAPED_UNICODE)]);
        }

        $data['id'] = "pat-{$newId}";
        $data['recordNumber'] = $recordNumber;

        $response->getBody()->write(json_encode($data, JSON_UNESCAPED_UNICODE));
        return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
    }

    /**
     * PUT /api/patients/{id}
     * Actualizar paciente e historia clínica
     */
    public function update(Request $request, Response $response, array $args): Response
    {
        $id = (int)str_replace('pat-', '', $args['id']);
        $data = json_decode((string)$request->getBody(), true);

        $stmt = $this->db->prepare("
            UPDATE patients SET
                first_name = ?, last_name = ?, id_number = ?, birth_date = ?,
                gender = ?, phone = ?, email = ?, address = ?, occupation = ?,
                blood_type = ?, allergies = ?, medical_conditions = ?, current_medications = ?,
                emergency_contact_name = ?, emergency_contact_phone = ?,
                anamnesis_json = ?, stomatological_exam_json = ?, diagnosis_json = ?, treatment_plan_summary_json = ?,
                notes = ?, responsible_doctor_id = ?
            WHERE id = ?
        ");

        $stmt->execute([
            $data['firstName'],
            $data['lastName'],
            $data['idNumber'] ?? null,
            $data['birthDate'] ?? null,
            $data['gender'] ?? 'other',
            $data['phone'] ?? null,
            $data['email'] ?? null,
            $data['address'] ?? null,
            $data['occupation'] ?? null,
            $data['bloodType'] ?? null,
            $data['medicalHistory'][0]['allergies'] ?? null,
            $data['medicalConditions'] ?? null,
            $data['currentMedications'] ?? null,
            $data['emergencyContactName'] ?? null,
            $data['emergencyContactPhone'] ?? null,
            isset($data['anamnesis']) ? json_encode($data['anamnesis'], JSON_UNESCAPED_UNICODE) : null,
            isset($data['stomatologicalExam']) ? json_encode($data['stomatologicalExam'], JSON_UNESCAPED_UNICODE) : null,
            isset($data['diagnosis']) ? json_encode($data['diagnosis'], JSON_UNESCAPED_UNICODE) : null,
            isset($data['treatmentPlanSummary']) ? json_encode($data['treatmentPlanSummary'], JSON_UNESCAPED_UNICODE) : null,
            $data['notes'] ?? null,
            $data['doctorId'] ?? null,
            $id
        ]);

        $data['id'] = "pat-{$id}";
        $response->getBody()->write(json_encode($data, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json');
    }
    /**
     * DELETE /api/patients/{id}
     */
    public function delete(Request $request, Response $response, array $args): Response
    {
        $id = (int)str_replace('pat-', '', $args['id']);
        $stmt = $this->db->prepare("DELETE FROM patients WHERE id = ?");
        $stmt->execute([$id]);

        $response->getBody()->write(json_encode(['success' => true, 'message' => 'Paciente eliminado correctamente']));
        return $response->withHeader('Content-Type', 'application/json');
    }




}
