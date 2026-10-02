<?php
namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Views\Twig;
class ContactoController{
    function index($req,$res,$args){
     $view = Twig::fromRequest($req);
     return $view->render($res,"contacto.html",[]);
    }
}