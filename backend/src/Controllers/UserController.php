<?php
declare(strict_types=1);

namespace App\Controllers;

use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Controlador de Usuarios, Perfiles y Auditoría para Slim 4
 * Perfiles soportados: 'admin', 'doctor', 'assistant', 'patient'
 */
class UserController
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * GET /api/users
     * Listar todos los usuarios con sus perfiles
     */
    public function getAll(Request $request, Response $response): Response
    {
        $stmt = $this->db->query("
            SELECT u.id, u.username, u.first_name AS firstName, u.last_name AS lastName,
                   u.email, u.phone, u.id_number AS idNumber, u.role, u.status,
                   u.avatar_color AS avatarColor, u.two_factor_enabled AS twoFactorEnabled,
                   u.shift, u.associated_patient_id AS associatedPatientId,
                   u.permissions_json AS permissions, u.last_login AS lastLogin,
                   u.notes, u.created_at AS createdAt,
                   d.license_number AS licenseNumber, d.specialty
            FROM users u
            LEFT JOIN doctors d ON (u.id = d.user_id OR (u.first_name = d.first_name AND u.last_name = d.last_name))
            ORDER BY u.created_at DESC
        ");
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decodificar JSON de permisos si existe
        foreach ($users as &$user) {
            $user['id'] = "usr-{$user['id']}";
            $user['twoFactorEnabled'] = (bool) $user['twoFactorEnabled'];
            if (!empty($user['associatedPatientId'])) {
                $user['associatedPatientId'] = "pat-{$user['associatedPatientId']}";
            }
            if (!empty($user['permissions'])) {
                $user['permissions'] = json_decode($user['permissions'], true);
            }
        }

        $response->getBody()->write(json_encode($users, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/users/{id}
     * Obtener un usuario específico
     */
    public function getById(Request $request, Response $response, array $args): Response
    {
        $id = (int)str_replace('usr-', '', $args['id']);
        $stmt = $this->db->prepare("
            SELECT u.id, u.username, u.first_name AS firstName, u.last_name AS lastName,
                   u.email, u.phone, u.id_number AS idNumber, u.role, u.status,
                   u.avatar_color AS avatarColor, u.two_factor_enabled AS twoFactorEnabled,
                   u.shift, u.associated_patient_id AS associatedPatientId,
                   u.permissions_json AS permissions, u.last_login AS lastLogin,
                   u.notes, u.created_at AS createdAt
            FROM users u
            WHERE u.id = ?
        ");
        $stmt->execute([$id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            $response->getBody()->write(json_encode(['error' => 'Usuario no encontrado']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        $user['id'] = "usr-{$user['id']}";
        $user['twoFactorEnabled'] = (bool)$user['twoFactorEnabled'];
        if (!empty($user['associatedPatientId'])) {
            $user['associatedPatientId'] = "pat-{$user['associatedPatientId']}";
        }
        if (!empty($user['permissions'])) {
            $user['permissions'] = json_decode($user['permissions'], true);
        }

        $response->getBody()->write(json_encode($user, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * POST /api/users
     * Crear nuevo usuario
     */
    public function create(Request $request, Response $response): Response
    {
        $data = json_decode((string)$request->getBody(), true);

        if (empty($data['username']) || empty($data['firstName']) || empty($data['lastName']) || empty($data['email'])) {
            $response->getBody()->write(json_encode(['error' => 'Faltan campos obligatorios']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $rawPassword = $data['password'] ?? 'Dental2026*';
        $passwordHash = password_hash($rawPassword, PASSWORD_BCRYPT);
        $permissionsJson = !empty($data['permissions']) ? json_encode($data['permissions'], JSON_UNESCAPED_UNICODE) : null;
        $associatedPatId = !empty($data['associatedPatientId']) ? (int)str_replace('pat-', '', (string)$data['associatedPatientId']) : null;

        $stmt = $this->db->prepare("
            INSERT INTO users (
                username, first_name, last_name, email, phone, id_number,
                password_hash, role, status, avatar_color, two_factor_enabled,
                shift, associated_patient_id, permissions_json, notes
            ) VALUES (
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?
            )
        ");

        $stmt->execute([
            $data['username'],
            $data['firstName'],
            $data['lastName'],
            $data['email'],
            $data['phone'] ?? null,
            $data['idNumber'] ?? null,
            $passwordHash,
            $data['role'] ?? 'assistant',
            $data['status'] ?? 'active',
            $data['avatarColor'] ?? 'bg-indigo-600 text-white',
            !empty($data['twoFactorEnabled']) ? 1 : 0,
            $data['shift'] ?? null,
            $associatedPatId,
            $permissionsJson,
            $data['notes'] ?? null,
        ]);

        $userId = (int)$this->db->lastInsertId();
        $data['id'] = "usr-{$userId}";

        // Registrar en auditoría
        $this->logAudit($userId, "{$data['firstName']} {$data['lastName']}", $data['role'] ?? 'assistant', 'CREATE', 'USER', "Creación de usuario @{$data['username']}");

        $response->getBody()->write(json_encode($data, JSON_UNESCAPED_UNICODE));
        return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
    }

    /**
     * PUT /api/users/{id}
     * Actualizar usuario existente
     */
    public function update(Request $request, Response $response, array $args): Response
    {
        $id = (int)str_replace('usr-', '', $args['id']);
        $data = json_decode((string)$request->getBody(), true);

        $permissionsJson = !empty($data['permissions']) ? json_encode($data['permissions'], JSON_UNESCAPED_UNICODE) : null;
        $associatedPatId = !empty($data['associatedPatientId']) ? (int)str_replace('pat-', '', (string)$data['associatedPatientId']) : null;

        $stmt = $this->db->prepare("
            UPDATE users SET
                username = ?, first_name = ?, last_name = ?, email = ?,
                phone = ?, id_number = ?, role = ?, status = ?,
                avatar_color = ?, two_factor_enabled = ?, shift = ?,
                associated_patient_id = ?, permissions_json = ?, notes = ?
            WHERE id = ?
        ");

        $stmt->execute([
            $data['username'],
            $data['firstName'],
            $data['lastName'],
            $data['email'],
            $data['phone'] ?? null,
            $data['idNumber'] ?? null,
            $data['role'] ?? 'assistant',
            $data['status'] ?? 'active',
            $data['avatarColor'] ?? 'bg-indigo-600 text-white',
            !empty($data['twoFactorEnabled']) ? 1 : 0,
            $data['shift'] ?? null,
            $associatedPatId,
            $permissionsJson,
            $data['notes'] ?? null,
            $id
        ]);

        // Si se envió una nueva contraseña
        if (!empty($data['password'])) {
            $passwordHash = password_hash($data['password'], PASSWORD_BCRYPT);
            $stmtPass = $this->db->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
            $stmtPass->execute([$passwordHash, $id]);
        }

        $this->logAudit($id, "{$data['firstName']} {$data['lastName']}", $data['role'] ?? 'assistant', 'UPDATE', 'USER', "Actualización de datos y permisos del usuario @{$data['username']}");

        $data['id'] = "usr-{$id}";
        $response->getBody()->write(json_encode($data, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * DELETE /api/users/{id}
     * Eliminar usuario
     */
    public function delete(Request $request, Response $response, array $args): Response
    {
        $id = (int)str_replace('usr-', '', $args['id']);
        $stmt = $this->db->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$id]);

        $this->logAudit($id, "Sistema", "admin", "DELETE", "USER", "Eliminación de usuario ID #{$id}");

        $response->getBody()->write(json_encode(['success' => true, 'message' => 'Usuario eliminado']));
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * GET /api/audit-logs
     * Listar historial de auditoría
     */
    public function getAuditLogs(Request $request, Response $response): Response
    {
        $stmt = $this->db->query("
            SELECT id, user_id AS userId, user_name AS userName, user_role AS userRole,
                   action, target_entity AS targetEntity, details, ip_address AS ipAddress,
                   created_at AS timestamp
            FROM audit_logs
            ORDER BY created_at DESC
            LIMIT 100
        ");
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $response->getBody()->write(json_encode($logs, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json');
    }

    private function logAudit(?int $userId, string $userName, string $role, string $action, string $target, string $details): void
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO audit_logs (user_id, user_name, user_role, action, target_entity, details, ip_address)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
            $stmt->execute([$userId, $userName, $role, $action, $target, $details, $ip]);
        } catch (\Exception $e) {
            // Ignorar fallo de auditoría para no bloquear la transacción principal
        }
    }
}
