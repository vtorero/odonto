<?php
declare(strict_types=1);

namespace App\Controllers;

use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class EvolutionController
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * GET /api/patients/{patientId}/evolutions
     * Obtener historial cronológico de evolución clínica, actos y pagos/entregas
     */
    public function getByPatient(Request $request, Response $response, array $args): Response
    {
        $patientId = (int)str_replace('pat-', '', $args['patientId']);

        $stmt = $this->db->prepare("
            SELECT cn.*, CONCAT(d.first_name, ' ', d.last_name) AS doctorName
            FROM clinical_notes cn
            LEFT JOIN doctors d ON cn.doctor_id = d.id
            WHERE cn.patient_id = ?
            ORDER BY cn.date DESC, cn.id DESC
        ");
        $stmt->execute([$patientId]);
        $notes = $stmt->fetchAll();

        $result = array_map(function ($cn) {
            return [
                'id' => "cn-{$cn['id']}",
                'patientId' => "pat-{$cn['patient_id']}",
                'date' => $cn['date'],
                'doctor' => $cn['doctorName'] ?? 'Odontólogo Tratante',
                'act' => $cn['act'] ?? '',
                'prescription' => $cn['prescription'] ?? '',
                'deliveries' => (float)($cn['deliveries'] ?? 0),
                'balance' => (float)($cn['balance'] ?? 0),
                'nextAppointment' => $cn['next_appointment'] ?? null,
                'patientSignature' => (bool)$cn['patient_signature'],
                'createdAt' => $cn['created_at'] ?? ''
            ];
        }, $notes);

        $response->getBody()->write(json_encode($result, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/patients/{patientId}/evolutions
     * Registrar nuevo acto clínico con control de entregas monetarias y saldo
     */
    public function create(Request $request, Response $response, array $args): Response
    {
        $patientId = (int)str_replace('pat-', '', $args['patientId']);
        $body = json_decode((string)$request->getBody(), true);

        if (empty($body['act'])) {
            $response->getBody()->write(json_encode(['error' => 'El acto o procedimiento clínico es requerido']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $stmt = $this->db->prepare("
            INSERT INTO clinical_notes (
                patient_id, doctor_id, date, act, prescription,
                deliveries, balance, next_appointment, patient_signature
            ) VALUES (
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?
            )
        ");

        $stmt->execute([
            $patientId,
            $body['doctorId'] ?? null,
            $body['date'] ?? date('Y-m-d'),
            $body['act'],
            $body['prescription'] ?? null,
            (float)($body['deliveries'] ?? 0),
            (float)($body['balance'] ?? 0),
            $body['nextAppointment'] ?? null,
            !empty($body['patientSignature']) ? 1 : 0
        ]);

        $newId = (int)$this->db->lastInsertId();
        $body['id'] = "cn-{$newId}";
        $body['patientId'] = "pat-{$patientId}";

        $response->getBody()->write(json_encode($body, JSON_UNESCAPED_UNICODE));
        return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
    }

    /**
     * DELETE /api/evolutions/{id}
     */
    public function delete(Request $request, Response $response, array $args): Response
    {
        $id = (int)str_replace('cn-', '', $args['id']);
        $stmt = $this->db->prepare("DELETE FROM clinical_notes WHERE id = ?");
        $stmt->execute([$id]);

        $response->getBody()->write(json_encode(['success' => true, 'message' => 'Evolución eliminada']));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
