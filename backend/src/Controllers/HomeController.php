<?php

namespace App\Controllers;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Views\Twig;

class HomeController{
    function index($req,$res,$args){
        $view = Twig::fromRequest($req);
        $parametros=['titulo'=>'este es el titulo','cuerpo'=>'este es el body'];
        return $view->render($res,"index.html",$parametros);
    }
}