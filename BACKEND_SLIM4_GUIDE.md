# Instrucciones de Despliegue Backend (Slim 4 + MySQL)

## Requisitos Previos
- PHP 8.1 o superior con extensiones `pdo_mysql`, `mbstring`, `json`.
- Composer.
- Servidor MySQL / MariaDB.
- Apache con `mod_rewrite` o Nginx.

---

## 1. Instalación de Dependencias

Dentro de tu directorio `backend/`:
```bash
composer require slim/slim:"^4.12"
composer require slim/psr7:"^1.6"
composer require vlucas/phpdotenv:"^5.5"
```

---

## 2. Configuración `.env` en Backend

Crea un archivo `.env` en la raíz del backend:
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=odontodesa_db
DB_USER=root
DB_PASS=tu_password_aqui
```

---

## 3. Conexión del Frontend de React

En el frontend (este proyecto), sólo necesitas agregar en tu `.env`:
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

Si no se define la variable `VITE_API_BASE_URL`, el frontend seguirá funcionando normalmente con almacenamiento en memoria y `localStorage`.
