<?php
declare(strict_types=1);

namespace App\Controllers;

use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class CabineController
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * GET /api/appointments
     * Listado de citas con filtros por fecha, estado y doctor
     */
    public function getAll(Request $request, Response $response): Response
    {
       $sql = "SELECT * from cabinets order by idcabinets asc";

        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        $cabinets = $stmt->fetchAll();

        $result = array_map(function ($a) {
            return [
                'id' => $a['idcabinets'],
                'cabinetName' => $a['name']
            ];
        },$cabinets);

        $response->getBody()->write(json_encode($result, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/appointments
     * Agendar nueva cita
     */
    public function create(Request $request, Response $response): Response
    {
        $body = json_decode((string)$request->getBody(), true);

        if (empty($body['patientId']) || empty($body['date']) || empty($body['time'])) {
            $response->getBody()->write(json_encode(['error' => 'Paciente, fecha y hora son obligatorios']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $patientId = (int)str_replace('pat-', '', (string)$body['patientId']);

        $stmt = $this->db->prepare("
            INSERT INTO appointments (
                patient_id, doctor_id, date, time, duration,
                type, status, notes, dental_chair
            ) VALUES (
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?
            )
        ");

        $stmt->execute([
            $patientId,
            $body['doctorId'] ?? null,
            $body['date'],
            $body['time'],
            (int)($body['duration'] ?? 30),
            $body['type'] ?? 'Consulta General',
            $body['status'] ?? 'scheduled',
            $body['notes'] ?? null,
            $body['dentalChair'] ?? 'Sillón Principal 01'
        ]);

        $newId = (int)$this->db->lastInsertId();
        $body['id'] = "apt-{$newId}";

        $response->getBody()->write(json_encode($body, JSON_UNESCAPED_UNICODE));
        return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
    }

    /**
     * PUT /api/appointments/{id}
     */
    public function update(Request $request, Response $response, array $args): Response
    {
        $id = (int)str_replace('apt-', '', $args['id']);
        $body = json_decode((string)$request->getBody(), true);

        $stmt = $this->db->prepare("
            UPDATE appointments SET
                date = COALESCE(?, date),
                time = COALESCE(?, time),
                duration = COALESCE(?, duration),
                type = COALESCE(?, type),
                status = COALESCE(?, status),
                notes = COALESCE(?, notes),
                dental_chair = COALESCE(?, dental_chair)
            WHERE id = ?
        ");

        $stmt->execute([
            $body['date'] ?? null,
            $body['time'] ?? null,
            isset($body['duration']) ? (int)$body['duration'] : null,
            $body['type'] ?? null,
            $body['status'] ?? null,
            $body['notes'] ?? null,
            $body['dentalChair'] ?? null,
            $id
        ]);

        $response->getBody()->write(json_encode(['success' => true, 'updatedId' => "apt-{$id}"]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * DELETE /api/appointments/{id}
     */
    public function delete(Request $request, Response $response, array $args): Response
    {
        $id = (int)str_replace('apt-', '', $args['id']);
        $stmt = $this->db->prepare("DELETE FROM appointments WHERE id = ?");
        $stmt->execute([$id]);

        $response->getBody()->write(json_encode(['success' => true, 'message' => 'Cita eliminada']));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
