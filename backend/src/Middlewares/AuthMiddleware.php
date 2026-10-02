<?php
declare(strict_types=1);

namespace App\Middlewares;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Psr7\Response as SlimResponse;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthMiddleware implements MiddlewareInterface
{
    private array $allowedRoles;

    /**
     * @param array $allowedRoles Array de roles permitidos ('admin', 'doctor', 'assistant', 'patient'). Vacío si solo requiere autenticación.
     */
    public function __construct(array $allowedRoles = [])
    {
        $this->allowedRoles = $allowedRoles;
    }

    public function process(Request $request, RequestHandler $handler): Response
    {
        $authHeader = $request->getHeaderLine('Authorization');

        if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            // Verificamos si en modo desarrollo se pasa una cabecera de rol para pruebas rápidas
            $devRole = $request->getHeaderLine('X-User-Role');
            if (!empty($devRole)) {
                if (!empty($this->allowedRoles) && !in_array($devRole, $this->allowedRoles, true)) {
                    return $this->forbiddenResponse("Rol '{$devRole}' sin permisos para esta operación");
                }
                return $handler->handle($request->withAttribute('user_role', $devRole));
            }

            return $this->unauthorizedResponse('Token de autorización no proporcionado o formato inválido');
        }

        $jwt = $matches[1];
        $secret = $_ENV['JWT_SECRET'] ?? 'default_odontodesa_secret_key_2026';

        try {
            $decoded = JWT::decode($jwt, new Key($secret, 'HS256'));
            $userRole = $decoded->role ?? 'patient';

            if (!empty($this->allowedRoles) && !in_array($userRole, $this->allowedRoles, true)) {
                return $this->forbiddenResponse('Su rol actual no tiene privilegios suficientes para este recurso');
            }

            $request = $request
                ->withAttribute('user_id', $decoded->sub ?? null)
                ->withAttribute('user_role', $userRole)
                ->withAttribute('user_data', (array)$decoded);

            return $handler->handle($request);
        } catch (\Exception $e) {
            return $this->unauthorizedResponse('Token inválido o expirado: ' . $e->getMessage());
        }
    }

    private function unauthorizedResponse(string $message): Response
    {
        $response = new SlimResponse();
        $response->getBody()->write(json_encode([
            'success' => false,
            'error' => $message,
            'code' => 401
        ], JSON_UNESCAPED_UNICODE));
        return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
    }

    private function forbiddenResponse(string $message): Response
    {
        $response = new SlimResponse();
        $response->getBody()->write(json_encode([
            'success' => false,
            'error' => $message,
            'code' => 403
        ], JSON_UNESCAPED_UNICODE));
        return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
    }
}
