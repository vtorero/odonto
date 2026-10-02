<?php
declare(strict_types=1);

use Slim\Factory\AppFactory;
use Dotenv\Dotenv;
use App\Config\Database;
use App\Middlewares\CorsMiddleware;
use App\Middlewares\AuthMiddleware;
use App\Controllers\AuthController;
use App\Controllers\PatientController;
use App\Controllers\OdontogramController;
use App\Controllers\TreatmentPlanController;
use App\Controllers\EvolutionController;
use App\Controllers\AppointmentController;
use App\Controllers\InventoryController;
use App\Controllers\InvoiceController;
use App\Controllers\UserController;
use Slim\Routing\RouteCollectorProxy;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

require __DIR__ . '/../vendor/autoload.php';

// Cargar variables de entorno desde .env si existe
if (file_exists(__DIR__ . '/../.env')) {
    $dotenv = Dotenv::createImmutable(__DIR__ . '/..');
    $dotenv->load();
}

$app = AppFactory::create();

// Middleware de CORS
$app->add(new CorsMiddleware());

// Middleware de Enrutamiento y JSON Body Parser
$app->addRoutingMiddleware();
$app->addBodyParsingMiddleware();

// Middleware de Manejo de Errores
$displayErrors = ($_ENV['APP_DEBUG'] ?? 'true') === 'true';
$errorMiddleware = $app->addErrorMiddleware($displayErrors, true, true);

// Obtener instancia de PDO
$db = Database::getConnection();

// Ruta de Salud / Diagnóstico
$app->get('/', function (Request $request, Response $response) {
    $payload = [
        'name' => 'ODONTODESA RESTful API',
        'version' => '2.0.0',
        'framework' => 'Slim 4 + PHP 8.1+',
        'database' => 'MySQL (InnoDB / utf8mb4)',
        'status' => 'online',
        'timestamp' => date('c'),
        'endpoints' => [
            'auth' => '/api/auth/login, /api/auth/me',
            'patients' => '/api/patients',
            'odontograms' => '/api/patients/{id}/odontogram',
            'treatment_plans' => '/api/patients/{id}/treatment-plans, /api/treatment-catalog',
            'evolutions' => '/api/patients/{id}/evolutions',
            'appointments' => '/api/appointments',
            'inventory' => '/api/inventory',
            'invoices' => '/api/invoices',
            'users' => '/api/users, /api/audit-logs'
        ]
    ];
    $response->getBody()->write(json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    return $response->withHeader('Content-Type', 'application/json');
});

// ==========================================
// GRUPO DE RUTAS DE LA API (/api)
// ==========================================
$app->group('/api', function (RouteCollectorProxy $group) use ($db) {

    // ------------------------------------------
    // 1. AUTENTICACIÓN (Público)
    // ------------------------------------------
    $authController = new AuthController($db);
    $group->post('/auth/login', [$authController, 'login']);
    $group->get('/auth/me', [$authController, 'me']);

    // ------------------------------------------
    // 2. PACIENTES & HISTORIA CLÍNICA ODONTODESA
    // ------------------------------------------
    $patientController = new PatientController($db);
    $group->get('/patients', [$patientController, 'getAll']);
    $group->get('/patients/{id}', [$patientController, 'getById']);
    $group->post('/patients', [$patientController, 'create'])->add(new AuthMiddleware(['admin', 'doctor', 'assistant']));
    $group->put('/patients/{id}', [$patientController, 'update'])->add(new AuthMiddleware(['admin', 'doctor', 'assistant']));
    $group->delete('/patients/{id}', [$patientController, 'delete'])->add(new AuthMiddleware(['admin']));

    // ------------------------------------------
    // 3. ODONTOGRAMA FDI INTERACTIVO
    // ------------------------------------------
    $odontogramController = new OdontogramController($db);
    $group->get('/patients/{patientId}/odontogram', [$odontogramController, 'getByPatient']);
    $group->post('/patients/{patientId}/odontogram', [$odontogramController, 'save'])->add(new AuthMiddleware(['admin', 'doctor']));

    // ------------------------------------------
    // 4. PLANES DE TRATAMIENTO & TARIFARIO
    // ------------------------------------------
    $treatmentController = new TreatmentPlanController($db);
    $group->get('/treatment-catalog', [$treatmentController, 'getCatalog']);
    $group->get('/patients/{patientId}/treatment-plans', [$treatmentController, 'getByPatient']);
    $group->post('/patients/{patientId}/treatment-plans', [$treatmentController, 'create'])->add(new AuthMiddleware(['admin', 'doctor']));
    $group->put('/treatment-items/{id}', [$treatmentController, 'updateItem'])->add(new AuthMiddleware(['admin', 'doctor']));

    // ------------------------------------------
    // 5. EVOLUCIÓN CLÍNICA, ENTREGAS & SALDOS
    // ------------------------------------------
    $evolutionController = new EvolutionController($db);
    $group->get('/patients/{patientId}/evolutions', [$evolutionController, 'getByPatient']);
    $group->post('/patients/{patientId}/evolutions', [$evolutionController, 'create'])->add(new AuthMiddleware(['admin', 'doctor', 'assistant']));
    $group->delete('/evolutions/{id}', [$evolutionController, 'delete'])->add(new AuthMiddleware(['admin']));

    // ------------------------------------------
    // 6. CITAS & AGENDA DE SILLONES
    // ------------------------------------------
    $appointmentController = new AppointmentController($db);
    $group->get('/appointments', [$appointmentController, 'getAll']);
    $group->post('/appointments', [$appointmentController, 'create']);
    $group->put('/appointments/{id}', [$appointmentController, 'update']);
    $group->delete('/appointments/{id}', [$appointmentController, 'delete'])->add(new AuthMiddleware(['admin', 'doctor', 'assistant']));

    // ------------------------------------------
    // 7. INVENTARIO DE INSUMOS DENTALES
    // ------------------------------------------
    $inventoryController = new InventoryController($db);
    $group->get('/inventory', [$inventoryController, 'getAll']);
    $group->post('/inventory', [$inventoryController, 'create'])->add(new AuthMiddleware(['admin', 'assistant']));
    $group->post('/inventory/{id}/movement', [$inventoryController, 'registerMovement'])->add(new AuthMiddleware(['admin', 'assistant']));

    // ------------------------------------------
    // 8. FACTURACIÓN & PAGOS
    // ------------------------------------------
    $invoiceController = new InvoiceController($db);
    $group->get('/invoices', [$invoiceController, 'getAll']);
    $group->post('/invoices', [$invoiceController, 'create'])->add(new AuthMiddleware(['admin', 'assistant']));
    $group->post('/invoices/{id}/payments', [$invoiceController, 'addPayment'])->add(new AuthMiddleware(['admin', 'assistant']));

    // ------------------------------------------
    // 9. GESTIÓN DE USUARIOS, ROLES & AUDITORÍA
    // ------------------------------------------
    $userController = new UserController($db);
    $group->get('/users', [$userController, 'getAll'])->add(new AuthMiddleware(['admin']));
    $group->get('/users/{id}', [$userController, 'getById']);
    $group->post('/users', [$userController, 'create'])->add(new AuthMiddleware(['admin']));
    $group->put('/users/{id}', [$userController, 'update'])->add(new AuthMiddleware(['admin']));
    $group->delete('/users/{id}', [$userController, 'delete'])->add(new AuthMiddleware(['admin']));
    $group->get('/audit-logs', [$userController, 'getAuditLogs'])->add(new AuthMiddleware(['admin']));
});

// Manejador para preflight requests OPTIONS (CORS)
$app->options('/{routes:.+}', function (Request $request, Response $response) {
    return $response;
});

$app->run();
