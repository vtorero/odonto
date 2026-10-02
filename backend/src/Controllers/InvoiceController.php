<?php
declare(strict_types=1);

namespace App\Controllers;

use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class InvoiceController
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * GET /api/invoices
     * Listado de facturas emitidas y pendientes de cobro
     */
    public function getAll(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $patientId = $params['patientId'] ?? null;

        $sql = "
            SELECT i.*,
                   CONCAT(p.first_name, ' ', p.last_name) AS patientName,
                   p.id_number AS patientIdNumber,
                   p.record_number AS recordNumber
            FROM invoices i
            JOIN patients p ON i.patient_id = p.id
            WHERE 1=1
        ";

        $bindings = [];
        if (!empty($patientId)) {
            $sql .= " AND i.patient_id = :pid";
            $bindings[':pid'] = (int)str_replace('pat-', '', $patientId);
        }

        $sql .= " ORDER BY i.issue_date DESC, i.id DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($bindings);
        $invoices = $stmt->fetchAll();

        $result = [];
        foreach ($invoices as $inv) {
            // Cargar items de la factura
            $itemStmt = $this->db->prepare("SELECT * FROM invoice_items WHERE invoice_id = ?");
            $itemStmt->execute([$inv['id']]);
            $items = $itemStmt->fetchAll();

            $formattedItems = array_map(function ($it) {
                return [
                    'id' => "ii-{$it['id']}",
                    'description' => $it['description'],
                    'quantity' => (int)$it['quantity'],
                    'unitPrice' => (float)$it['unit_price'],
                    'total' => (float)$it['total']
                ];
            }, $items);

            $result[] = [
                'id' => "inv-{$inv['id']}",
                'invoiceNumber' => $inv['invoice_number'],
                'patientId' => "pat-{$inv['patient_id']}",
                'patientName' => $inv['patientName'],
                'issueDate' => $inv['issue_date'],
                'dueDate' => $inv['due_date'],
                'totalAmount' => (float)$inv['total_amount'],
                'paidAmount' => (float)$inv['paid_amount'],
                'balance' => (float)$inv['balance'],
                'status' => $inv['status'],
                'paymentMethod' => $inv['payment_method'],
                'items' => $formattedItems
            ];
        }

        $response->getBody()->write(json_encode($result, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/invoices
     * Emitir nueva factura dental
     */
    public function create(Request $request, Response $response): Response
    {
        $body = json_decode((string)$request->getBody(), true);

        if (empty($body['patientId']) || empty($body['items'])) {
            $response->getBody()->write(json_encode(['error' => 'Paciente e ítems requeridos']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $patientId = (int)str_replace('pat-', '', (string)$body['patientId']);
        $invoiceNumber = $body['invoiceNumber'] ?? ('FAC-' . date('Y') . '-' . str_pad((string)rand(100, 9999), 5, '0', STR_PAD_LEFT));

        $totalAmount = 0;
        $items = $body['items'];
        foreach ($items as $it) {
            $totalAmount += ((int)($it['quantity'] ?? 1)) * ((float)($it['unitPrice'] ?? $it['price'] ?? 0));
        }

        $paidAmount = (float)($body['paidAmount'] ?? 0);
        $balance = max(0, $totalAmount - $paidAmount);
        $status = ($balance <= 0) ? 'paid' : (($paidAmount > 0) ? 'partial' : 'pending');

        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("
                INSERT INTO invoices (
                    invoice_number, patient_id, issue_date, due_date,
                    total_amount, paid_amount, balance, status, payment_method
                ) VALUES (
                    ?, ?, ?, ?,
                    ?, ?, ?, ?, ?
                )
            ");

            $stmt->execute([
                $invoiceNumber,
                $patientId,
                $body['issueDate'] ?? date('Y-m-d'),
                $body['dueDate'] ?? date('Y-m-d', strtotime('+30 days')),
                $totalAmount,
                $paidAmount,
                $balance,
                $status,
                $body['paymentMethod'] ?? 'cash'
            ]);

            $invoiceId = (int)$this->db->lastInsertId();

            $itemStmt = $this->db->prepare("
                INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total)
                VALUES (?, ?, ?, ?, ?)
            ");

            foreach ($items as $it) {
                $qty = (int)($it['quantity'] ?? 1);
                $unitPrice = (float)($it['unitPrice'] ?? $it['price'] ?? 0);
                $itemStmt->execute([
                    $invoiceId,
                    $it['description'] ?? $it['name'],
                    $qty,
                    $unitPrice,
                    $qty * $unitPrice
                ]);
            }

            $this->db->commit();

            $body['id'] = "inv-{$invoiceId}";
            $body['invoiceNumber'] = $invoiceNumber;
            $body['totalAmount'] = $totalAmount;
            $body['paidAmount'] = $paidAmount;
            $body['balance'] = $balance;
            $body['status'] = $status;

            $response->getBody()->write(json_encode($body, JSON_UNESCAPED_UNICODE));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $this->db->rollBack();
            $response->getBody()->write(json_encode(['error' => 'Error al emitir factura: ' . $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    /**
     * POST /api/invoices/{id}/payments
     * Registrar abono o pago a una factura
     */
    public function addPayment(Request $request, Response $response, array $args): Response
    {
        $invoiceId = (int)str_replace('inv-', '', $args['id']);
        $body = json_decode((string)$request->getBody(), true);
        $amount = (float)($body['amount'] ?? 0);

        if ($amount <= 0) {
            $response->getBody()->write(json_encode(['error' => 'Monto de pago debe ser superior a 0']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("SELECT * FROM invoices WHERE id = ? FOR UPDATE");
            $stmt->execute([$invoiceId]);
            $inv = $stmt->fetch();

            if (!$inv) {
                $this->db->rollBack();
                $response->getBody()->write(json_encode(['error' => 'Factura no encontrada']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            $newPaid = (float)$inv['paid_amount'] + $amount;
            $newBalance = max(0, (float)$inv['total_amount'] - $newPaid);
            $newStatus = ($newBalance <= 0) ? 'paid' : 'partial';

            $updateStmt = $this->db->prepare("
                UPDATE invoices SET
                    paid_amount = ?,
                    balance = ?,
                    status = ?,
                    payment_method = COALESCE(?, payment_method)
                WHERE id = ?
            ");
            $updateStmt->execute([
                $newPaid,
                $newBalance,
                $newStatus,
                $body['paymentMethod'] ?? null,
                $invoiceId
            ]);

            $this->db->commit();

            $response->getBody()->write(json_encode([
                'success' => true,
                'invoiceId' => "inv-{$invoiceId}",
                'paidAmount' => $newPaid,
                'balance' => $newBalance,
                'status' => $newStatus
            ], JSON_UNESCAPED_UNICODE));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $this->db->rollBack();
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}
