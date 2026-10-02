<?php
declare(strict_types=1);

namespace App\Controllers;

use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class TreatmentPlanController
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * GET /api/treatment-catalog
     * Listado del tarifario estándar oficial Odontodesa (21 procedimientos clínicos)
     */
    public function getCatalog(Request $request, Response $response): Response
    {
        $stmt = $this->db->query("
            SELECT id, name, category, default_cost AS defaultCost, description, is_active AS isActive
            FROM standard_treatments
            ORDER BY category ASC, name ASC
        ");
        $treatments = $stmt->fetchAll();

        // Convertir tipos
        foreach ($treatments as &$t) {
            $t['defaultCost'] = (float)$t['defaultCost'];
            $t['isActive'] = (bool)$t['isActive'];
        }

        $response->getBody()->write(json_encode($treatments, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/patients/{patientId}/treatment-plans
     * Obtener planes de tratamiento y sus ítems para un paciente
     */
    public function getByPatient(Request $request, Response $response, array $args): Response
    {
        $patientId = (int)str_replace('pat-', '', $args['patientId']);

        $stmt = $this->db->prepare("
            SELECT tp.*,
                   CONCAT(d.first_name, ' ', d.last_name) AS doctorName
            FROM treatment_plans tp
            LEFT JOIN doctors d ON tp.doctor_id = d.id
            WHERE tp.patient_id = ?
            ORDER BY tp.created_at DESC
        ");
        $stmt->execute([$patientId]);
        $plans = $stmt->fetchAll();

        $result = [];
        foreach ($plans as $plan) {
            // Cargar items de cada plan
            $itemsStmt = $this->db->prepare("
                SELECT ti.*
                FROM treatment_items ti
                WHERE ti.treatment_plan_id = ?
                ORDER BY ti.id ASC
            ");
            $itemsStmt->execute([$plan['id']]);
            $items = $itemsStmt->fetchAll();

            $formattedItems = array_map(function ($it) {
                return [
                    'id' => "item-{$it['id']}",
                    'name' => $it['treatment_name'],
                    'tooth' => $it['tooth_number'],
                    'cost' => (float)$it['cost'],
                    'status' => $it['status'],
                    'notes' => $it['notes'] ?? '',
                ];
            }, $items);

            $result[] = [
                'id' => "tp-{$plan['id']}",
                'patientId' => "pat-{$plan['patient_id']}",
                'title' => $plan['title'],
                'doctor' => $plan['doctorName'] ?? 'Dr. Carlos Mendoza',
                'status' => $plan['status'],
                'totalCost' => (float)$plan['total_cost'],
                'notes' => $plan['notes'] ?? '',
                'items' => $formattedItems,
                'createdAt' => $plan['created_at'],
                'updatedAt' => $plan['updated_at']
            ];
        }

        $response->getBody()->write(json_encode($result, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/patients/{patientId}/treatment-plans
     * Crear un nuevo plan de tratamiento con sus ítems presupuestados
     */
    public function create(Request $request, Response $response, array $args): Response
    {
        $patientId = (int)str_replace('pat-', '', $args['patientId']);
        $body = json_decode((string)$request->getBody(), true);

        if (empty($body['title'])) {
            $response->getBody()->write(json_encode(['error' => 'El título del plan es requerido']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $items = $body['items'] ?? [];
        $totalCost = 0;
        foreach ($items as $it) {
            $totalCost += (float)($it['cost'] ?? 0);
        }

        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("
                INSERT INTO treatment_plans (patient_id, doctor_id, title, total_cost, status, notes)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $patientId,
                $body['doctorId'] ?? null,
                $body['title'],
                $totalCost,
                $body['status'] ?? 'active',
                $body['notes'] ?? null
            ]);

            $planId = (int)$this->db->lastInsertId();

            $itemStmt = $this->db->prepare("
                INSERT INTO treatment_items (treatment_plan_id, treatment_name, tooth_number, cost, status, notes)
                VALUES (?, ?, ?, ?, ?, ?)
            ");

            foreach ($items as $it) {
                $itemStmt->execute([
                    $planId,
                    $it['name'] ?? $it['treatment_name'],
                    $it['tooth'] ?? $it['tooth_number'] ?? null,
                    (float)($it['cost'] ?? 0),
                    $it['status'] ?? 'pending',
                    $it['notes'] ?? null
                ]);
            }

            $this->db->commit();

            $body['id'] = "tp-{$planId}";
            $body['patientId'] = "pat-{$patientId}";
            $body['totalCost'] = $totalCost;

            $response->getBody()->write(json_encode($body, JSON_UNESCAPED_UNICODE));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $this->db->rollBack();
            $response->getBody()->write(json_encode(['error' => 'Error al crear plan: ' . $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    /**
     * PUT /api/treatment-items/{id}
     * Cambiar estado de un ítem (ej. 'completed', 'in_progress', 'pending')
     */
    public function updateItem(Request $request, Response $response, array $args): Response
    {
        $itemId = (int)str_replace('item-', '', $args['id']);
        $body = json_decode((string)$request->getBody(), true);

        $stmt = $this->db->prepare("
            UPDATE treatment_items SET
                status = COALESCE(?, status),
                notes = COALESCE(?, notes)
            WHERE id = ?
        ");
        $stmt->execute([
            $body['status'] ?? null,
            $body['notes'] ?? null,
            $itemId
        ]);

        $response->getBody()->write(json_encode(['success' => true, 'updatedId' => "item-{$itemId}"]));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
