# ODONTODESA - Backend RESTful API en Slim 4 & MySQL

Backend profesional desarrollado en **PHP 8.1+**, **Slim Framework 4**, autenticación **JWT**, control de acceso basado en roles (**RBAC**) y persistencia en **MySQL**.

---

## 📁 Estructura del Proyecto Backend

```
backend/
├── config/
│   ├── db.php                  # Singleton PDO con manejo de excepciones y UTF-8
│   └── settings.php            # Ajustes generales, modo debug y configuración JWT
├── public/
│   ├── index.php               # Punto de entrada de Slim 4 y definición de todas las rutas REST
│   └── .htaccess               # Reglas de reescritura Apache/LiteSpeed
├── src/
│   ├── Controllers/
│   │   ├── AuthController.php          # Login, sesión actual y generación de JWT
│   │   ├── PatientController.php       # CRUD Pacientes, Anamnesis e Historia Clínica Odontodesa
│   │   ├── OdontogramController.php     # Odontograma FDI interactivo y versionado
│   │   ├── TreatmentPlanController.php  # Tarifario oficial (21 procedimientos) y presupuestos
│   │   ├── EvolutionController.php      # Evolución clínica, actos médicos, entregas y saldos
│   │   ├── AppointmentController.php    # Citas, agenda y asignación de sillones
│   │   ├── InventoryController.php      # Control de insumos, alertas de stock mínimo y movimientos
│   │   ├── InvoiceController.php        # Facturación, cobranzas y registro de abonos
│   │   └── UserController.php           # Gestión de usuarios, perfiles (4 roles) y auditoría
│   └── Middlewares/
│       ├── CorsMiddleware.php          # Encabezados CORS para comunicación con React
│       └── AuthMiddleware.php          # Validación de JWT y verificación granular de roles (RBAC)
├── .env.example                # Plantilla de variables de entorno
├── composer.json               # Dependencias de Slim 4, PSR-7, Dotenv y JWT
└── README.md                   # Documentación y guía de despliegue
```

---

## 🚀 Requisitos e Instalación

### 1. Requisitos
- **PHP** >= 8.1 (con extensiones `pdo_mysql`, `json`, `mbstring`, `openssl`).
- **Composer** instalado.
- Servidor **MySQL** o **MariaDB** (5.7+ o 8.0+).

### 2. Instalación de Dependencias

Ejecuta en la raíz de la carpeta `backend`:

```bash
cd backend
composer install
```

### 3. Configuración de Base de Datos

1. Crea la base de datos en MySQL:
   ```sql
   CREATE DATABASE odontodesa_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Importa el archivo `schema.sql` (ubicado en la raíz del proyecto):
   ```bash
   mysql -u root -p odontodesa_db < ../schema.sql
   ```
3. Copia el archivo de entorno y ajusta las credenciales:
   ```bash
   cp .env.example .env
   ```
   Edita `.env` con tus credenciales de base de datos:
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=odontodesa_db
   DB_USER=root
   DB_PASS=tu_password
   JWT_SECRET=tu_clave_secreta_super_segura_odontodesa_2026
   ```

### 4. Iniciar el Servidor de Desarrollo

Puedes utilizar el servidor integrado de PHP:

```bash
php -S 0.0.0.0:8080 -t public
```

O mediante el script de composer:
```bash
composer start
```

La API responderá en: `http://localhost:8080`

---

## 📡 Catálogo de Endpoints RESTful

### 🔐 Autenticación
| Método | Endpoint | Descripción | Roles Permitidos |
|---|---|---|---|
| `POST` | `/api/auth/login` | Iniciar sesión y obtener token JWT | Público |
| `GET` | `/api/auth/me` | Obtener perfil del usuario autenticado | Todos |

### 👥 Pacientes & Historia Clínica Odontodesa
| Método | Endpoint | Descripción | Roles Permitidos |
|---|---|---|---|
| `GET` | `/api/patients` | Listar pacientes con buscador | Todos |
| `GET` | `/api/patients/{id}` | Ficha clínica completa (2 páginas A4) | Todos |
| `POST` | `/api/patients` | Crear nuevo paciente con anamnesis | Admin, Doctor, Asistente |
| `PUT` | `/api/patients/{id}` | Actualizar datos clínicos | Admin, Doctor, Asistente |
| `DELETE` | `/api/patients/{id}` | Eliminar paciente | Admin |

### 🦷 Odontograma FDI Interactivo
| Método | Endpoint | Descripción | Roles Permitidos |
|---|---|---|---|
| `GET` | `/api/patients/{id}/odontogram` | Obtener odontograma activo y estados | Todos |
| `POST` | `/api/patients/{id}/odontogram` | Guardar/versionar odontograma | Admin, Doctor |

### 📋 Planes de Tratamiento & Tarifario
| Método | Endpoint | Descripción | Roles Permitidos |
|---|---|---|---|
| `GET` | `/api/treatment-catalog` | 21 tratamientos del tarifario estándar | Todos |
| `GET` | `/api/patients/{id}/treatment-plans` | Planes presupuestados del paciente | Todos |
| `POST` | `/api/patients/{id}/treatment-plans` | Crear nuevo plan de tratamiento | Admin, Doctor |
| `PUT` | `/api/treatment-items/{id}` | Actualizar estado de ítem (Completado, etc.) | Admin, Doctor |

### 📝 Evolución Clínica, Entregas & Saldos
| Método | Endpoint | Descripción | Roles Permitidos |
|---|---|---|---|
| `GET` | `/api/patients/{id}/evolutions` | Historial de actos clínicos y entregas | Todos |
| `POST` | `/api/patients/{id}/evolutions` | Registrar acto, prescripción y abono | Admin, Doctor, Asistente |
| `DELETE` | `/api/evolutions/{id}` | Eliminar registro de evolución | Admin |

### 📅 Citas & Agenda de Sillones
| Método | Endpoint | Descripción | Roles Permitidos |
|---|---|---|---|
| `GET` | `/api/appointments` | Listar citas (filtros por fecha y estado) | Todos |
| `POST` | `/api/appointments` | Agendar nueva cita | Todos |
| `PUT` | `/api/appointments/{id}` | Modificar cita / reprogramar | Todos |
| `DELETE` | `/api/appointments/{id}` | Cancelar o eliminar cita | Admin, Doctor, Asistente |

### 📦 Inventario Dental
| Método | Endpoint | Descripción | Roles Permitidos |
|---|---|---|---|
| `GET` | `/api/inventory` | Listar insumos con alerta de stock mínimo | Todos |
| `POST` | `/api/inventory` | Registrar nuevo insumo | Admin, Asistente |
| `POST` | `/api/inventory/{id}/movement` | Registrar entradas/salidas de insumos | Admin, Asistente |

### 💳 Facturación & Cobranzas
| Método | Endpoint | Descripción | Roles Permitidos |
|---|---|---|---|
| `GET` | `/api/invoices` | Listar facturas y estados de cuenta | Todos |
| `POST` | `/api/invoices` | Emitir nueva factura dental | Admin, Asistente |
| `POST` | `/api/invoices/{id}/payments` | Registrar abono o pago a factura | Admin, Asistente |

### 🛡️ Usuarios, Roles & Auditoría
| Método | Endpoint | Descripción | Roles Permitidos |
|---|---|---|---|
| `GET` | `/api/users` | Listar todos los usuarios y perfiles | Admin |
| `GET` | `/api/users/{id}` | Consultar usuario específico | Todos |
| `POST` | `/api/users` | Crear nuevo usuario (hash bcrypt) | Admin |
| `PUT` | `/api/users/{id}` | Actualizar datos, rol o contraseña | Admin |
| `DELETE` | `/api/users/{id}` | Eliminar usuario del sistema | Admin |
| `GET` | `/api/audit-logs` | Historial de auditoría y accesos | Admin |
