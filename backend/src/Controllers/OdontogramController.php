<?php
declare(strict_types=1);

namespace App\Controllers;

use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class OdontogramController
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * GET /api/patients/{patientId}/odontogram
     * Obtener el odontograma activo o crear uno inicial
     */
    public function getByPatient(Request $request, Response $response, array $args): Response
    {
        $patientId = (int)str_replace('pat-', '', $args['patientId']);

        $stmt = $this->db->prepare("
            SELECT * FROM odontograms
            WHERE patient_id = ?
            ORDER BY version DESC
            LIMIT 1
        ");
        $stmt->execute([$patientId]);
        $record = $stmt->fetch();

        if (!$record) {
            // Odontograma vacío por defecto
            $defaultData = [
                'teeth' => [],
                'generalNotes' => '',
                'updatedAt' => date('Y-m-d H:i:s')
            ];

            $response->getBody()->write(json_encode([
                'id' => null,
                'patientId' => "pat-{$patientId}",
                'version' => 1,
                'data' => $defaultData
            ], JSON_UNESCAPED_UNICODE));
            return $response->withHeader('Content-Type', 'application/json');
        }

        $result = [
            'id' => $record['id'],
            'patientId' => "pat-{$record['patient_id']}",
            'version' => (int)$record['version'],
            'data' => json_decode($record['data_json'], true) ?: [],
            'createdAt' => $record['created_at'],
            'updatedAt' => $record['updated_at']
        ];

        $response->getBody()->write(json_encode($result, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/patients/{patientId}/odontogram
     * Guardar o actualizar odontograma del paciente
     */
    public function save(Request $request, Response $response, array $args): Response
    {
        $patientId = (int)str_replace('pat-', '', $args['patientId']);
        $body = json_decode((string)$request->getBody(), true);

        $odontogramData = $body['data'] ?? $body;
        $dataJson = json_encode($odontogramData, JSON_UNESCAPED_UNICODE);

        // Verificar si existe para versionar o actualizar
        $stmt = $this->db->prepare("SELECT id, version FROM odontograms WHERE patient_id = ? ORDER BY version DESC LIMIT 1");
        $stmt->execute([$patientId]);
        $existing = $stmt->fetch();

        if ($existing) {
            $updateStmt = $this->db->prepare("
                UPDATE odontograms SET
                    data_json = ?,
                    version = version + 1,
                    updated_at = NOW()
                WHERE id = ?
            ");
            $updateStmt->execute([$dataJson, $existing['id']]);
            $newVersion = (int)$existing['version'] + 1;
            $id = $existing['id'];
        } else {
            $insertStmt = $this->db->prepare("
                INSERT INTO odontograms (patient_id, data_json, version)
                VALUES (?, ?, 1)
            ");
            $insertStmt->execute([$patientId, $dataJson]);
            $id = (int)$this->db->lastInsertId();
            $newVersion = 1;
        }

        $resData = [
            'id' => $id,
            'patientId' => "pat-{$patientId}",
            'version' => $newVersion,
            'data' => $odontogramData,
            'savedAt' => date('Y-m-d H:i:s')
        ];

        $response->getBody()->write(json_encode($resData, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
