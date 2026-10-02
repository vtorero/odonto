<?php
declare(strict_types=1);

namespace App\Controllers;

use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class InventoryController
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * GET /api/inventory
     * Listado de insumos con control de stock mínimo y alertas
     */
    public function getAll(Request $request, Response $response): Response
    {
        $stmt = $this->db->query("
            SELECT * FROM inventory
            ORDER BY category ASC, name ASC
        ");
        $items = $stmt->fetchAll();

        $result = array_map(function ($it) {
            $stock = (int)$it['current_stock'];
            $minStock = (int)$it['min_stock'];
            return [
                'id' => "inv-{$it['id']}",
                'name' => $it['name'],
                'category' => $it['category'],
                'currentStock' => $stock,
                'minStock' => $minStock,
                'unit' => $it['unit'],
                'location' => $it['location'] ?? 'Almacén Central',
                'expirationDate' => $it['expiration_date'] ?? null,
                'supplier' => $it['supplier'] ?? 'Distribuidora Dental',
                'costPerUnit' => (float)($it['cost_per_unit'] ?? 0),
                'isLowStock' => ($stock <= $minStock),
            ];
        }, $items);

        $response->getBody()->write(json_encode($result, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/inventory
     * Agregar nuevo insumo
     */
    public function create(Request $request, Response $response): Response
    {
        $body = json_decode((string)$request->getBody(), true);

        if (empty($body['name']) || empty($body['category'])) {
            $response->getBody()->write(json_encode(['error' => 'Nombre y categoría son requeridos']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $stmt = $this->db->prepare("
            INSERT INTO inventory (
                name, category, current_stock, min_stock, unit,
                location, expiration_date, supplier, cost_per_unit
            ) VALUES (
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?
            )
        ");

        $stmt->execute([
            $body['name'],
            $body['category'],
            (int)($body['currentStock'] ?? 0),
            (int)($body['minStock'] ?? 5),
            $body['unit'] ?? 'unidad',
            $body['location'] ?? 'Gabinete 1',
            $body['expirationDate'] ?? null,
            $body['supplier'] ?? null,
            (float)($body['costPerUnit'] ?? 0),
        ]);

        $newId = (int)$this->db->lastInsertId();
        $body['id'] = "inv-{$newId}";

        $response->getBody()->write(json_encode($body, JSON_UNESCAPED_UNICODE));
        return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/inventory/{id}/movement
     * Registrar entrada o salida de insumo
     */
    public function registerMovement(Request $request, Response $response, array $args): Response
    {
        $id = (int)str_replace('inv-', '', $args['id']);
        $body = json_decode((string)$request->getBody(), true);

        $quantity = (int)($body['quantity'] ?? 0);
        $type = $body['type'] ?? 'out'; // 'in' or 'out'

        if ($quantity <= 0) {
            $response->getBody()->write(json_encode(['error' => 'Cantidad debe ser mayor a 0']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $delta = ($type === 'in') ? $quantity : -$quantity;

        $stmt = $this->db->prepare("
            UPDATE inventory SET
                current_stock = GREATEST(0, current_stock + ?)
            WHERE id = ?
        ");
        $stmt->execute([$delta, $id]);

        $response->getBody()->write(json_encode([
            'success' => true,
            'movement' => $type,
            'quantity' => $quantity,
            'inventoryId' => "inv-{$id}"
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
