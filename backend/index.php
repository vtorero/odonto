<?php
require (__DIR__ .'/vendor/autoload.php' );

use Slim\Factory\AppFactory;
use Slim\Views\Twig;
use Slim\Views\TwigMiddleware;
use App\Config\Database;
use Slim\Routing\RouteCollectorProxy;
use App\Middlewares\CorsMiddleware;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

use App\Controllers\HomeController;
use App\Controllers\ContactoController;
use App\Controllers\AuthController;
use App\Controllers\PatientController;
use App\Controllers\DentalDoctorController;
use App\Controllers\OdontogramController;
use App\Controllers\CabineController;
use App\Controllers\AppointmentController;
use App\Controllers\InventoryController;


use App\Middlewares\AuthMiddleware;

$app = AppFactory::create();



// Middleware de Enrutamiento y JSON Body Parser
$app->addRoutingMiddleware();
$app->addBodyParsingMiddleware();
$twig = Twig::create('src\templates',['cache'=>false]);
$app->add(TwigMiddleware::create($app,$twig));
// Middleware de CORS
$app->add(new CorsMiddleware());
$app->setBasePath('/backend');
$app->addRoutingMiddleware();
$app->addErrorMiddleware(true, true, true);

//$db = Database::class.':getConnection';
$db = Database::getConnection();



$app->group('/api', function (RouteCollectorProxy $group) use ($db) {
    /**control de inicio sesion */
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
    // 3. LISTADO DE DOCTORES
    // ------------------------------------------
    $doctorController = new DentalDoctorController($db);
    $group->get('/doctors', [$doctorController, 'getAll']);
    $group->get('/doctor/{id}', [$doctorController, 'getById']);

 // ------------------------------------------
    // 3. LISTADO DE sillones
    // ------------------------------------------
    $cabineController = new CabineController($db);
    $group->get('/cabines', [$cabineController, 'getAll']);


// ------------------------------------------
    // 6. CITAS & AGENDA DE SILLONES
    // ------------------------------------------
    $appointmentController = new AppointmentController($db);
    $group->get('/appointments', [$appointmentController, 'getAll']);
    $group->post('/appointments', [$appointmentController, 'create']);
    $group->post('/appointment-estado', [$appointmentController, 'estado']);
    $group->put('/appointments/{id}', [$appointmentController, 'update']);
    $group->delete('/appointments/{id}', [$appointmentController, 'delete'])->add(new AuthMiddleware(['admin', 'doctor', 'assistant']));



    // ------------------------------------------
    // 7. INVENTARIO DE INSUMOS DENTALES
    // ------------------------------------------
    $inventoryController = new InventoryController($db);
    $group->get('/inventory', [$inventoryController, 'getAll']);
    $group->post('/inventory', [$inventoryController, 'create'])->add(new AuthMiddleware(['admin', 'assistant']));
    $group->put('/inventory/{id}', [$inventoryController, 'update'])->add(new AuthMiddleware(['admin', 'assistant']));
    $group->post('/inventory/{id}/movement', [$inventoryController, 'registerMovement'])->add(new AuthMiddleware(['admin', 'assistant']));

    /*demo*/
    $group->get('/',HomeController::class.':index');
    $group->get('/contacto',ContactoController::class.':index');

});

// Manejador para preflight requests OPTIONS (CORS)
$app->options('/{routes:.+}', function (Request $request, Response $response) {
    return $response;
});

$app->run();