-- ============================================================================
-- BASE DE DATOS COMPLETA PARA SISTEMA DENTAL (SLIM 4 + MYSQL)
-- FORMATO OFICIAL ODONTODESA + MÓDULOS DE GESTIÓN CLÍNICA
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `odontodesa_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `odontodesa_db`;

-- Desactivar chequeo de claves foráneas para recreación limpia
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `payment_transactions`;
DROP TABLE IF EXISTS `invoice_items`;
DROP TABLE IF EXISTS `invoices`;
DROP TABLE IF EXISTS `inventory_movements`;
DROP TABLE IF EXISTS `inventory_items`;
DROP TABLE IF EXISTS `appointments`;
DROP TABLE IF EXISTS `clinical_evolutions`;
DROP TABLE IF EXISTS `treatment_plan_items`;
DROP TABLE IF EXISTS `treatment_plans`;
DROP TABLE IF EXISTS `standard_treatment_catalog`;
DROP TABLE IF EXISTS `odontogram_surfaces`;
DROP TABLE IF EXISTS `odontogram_teeth`;
DROP TABLE IF EXISTS `patient_medical_history`;
DROP TABLE IF EXISTS `patients`;
DROP TABLE IF EXISTS `doctors`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- 1. USUARIOS, PERFILES Y AUDITORÍA (ADMIN, DOCTOR, ASISTENTE, PACIENTE)
-- ============================================================================

CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(60) NOT NULL UNIQUE,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `phone` VARCHAR(30) NULL,
  `id_number` VARCHAR(30) NULL, -- DNI / Cédula
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'doctor', 'assistant', 'patient') NOT NULL DEFAULT 'assistant',
  `status` ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  `avatar_color` VARCHAR(50) DEFAULT 'bg-indigo-600 text-white',
  `two_factor_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `shift` ENUM('morning', 'afternoon', 'full_time', 'weekend') NULL,
  `associated_patient_id` INT NULL, -- Enlace para rol 'patient'
  `permissions_json` JSON NULL, -- Sobrescritura de permisos granulares
  `last_login` DATETIME NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_patient` (`associated_patient_id`)
) ENGINE=InnoDB;

CREATE TABLE `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `user_name` VARCHAR(120) NOT NULL,
  `user_role` VARCHAR(30) NOT NULL,
  `action` ENUM('LOGIN', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'PASSWORD_RESET', 'STATUS_CHANGE', 'ROLE_SWITCH') NOT NULL,
  `target_entity` ENUM('PATIENT', 'ODONTOGRAM', 'APPOINTMENT', 'INVOICE', 'INVENTORY', 'USER', 'SETTINGS') NOT NULL,
  `details` TEXT NOT NULL,
  `ip_address` VARCHAR(45) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_user` (`user_id`),
  INDEX `idx_audit_action` (`action`),
  INDEX `idx_audit_entity` (`target_entity`)
) ENGINE=InnoDB;

CREATE TABLE `doctors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `license_number` VARCHAR(50) NOT NULL, -- Colegiatura / COP
  `specialty` VARCHAR(100) NOT NULL DEFAULT 'Odontología General',
  `phone` VARCHAR(30) NULL,
  `email` VARCHAR(100) NULL,
  `color_hex` VARCHAR(10) DEFAULT '#0284c7',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_doctors_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================================
-- 2. PACIENTES Y ANTECEDENTES MÉDICOS (HOJA 1 - ANVERSO ODONTODESA)
-- ============================================================================

CREATE TABLE `patients` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `id_number` VARCHAR(25) NOT NULL UNIQUE, -- DNI / Pasaporte
  `guardian_name` VARCHAR(150) NULL,       -- Apoderado (Acompañante/Menores)
  `gender` ENUM('male', 'female', 'other') DEFAULT 'other',
  `birth_date` DATE NULL,
  `birth_place` VARCHAR(100) NULL,         -- Lugar de Nacimiento
  `occupation` VARCHAR(100) NULL,          -- Ocupación
  `address` VARCHAR(255) NULL,
  `phone` VARCHAR(30) NULL,
  `email` VARCHAR(100) NULL,
  `blood_type` VARCHAR(10) DEFAULT 'O+',
  `responsible_doctor_id` INT NULL,        -- Profesional Responsable
  `consultation_reason` TEXT NULL,         -- Motivo de Consulta
  `last_dental_visit` VARCHAR(150) NULL,   -- Última Consulta al Dentista
  `observations` TEXT NULL,                -- Observaciones Clínicas
  `consent_accepted` TINYINT(1) NOT NULL DEFAULT 1, -- Consentimiento Informado
  `consent_date` DATE NULL,
  `patient_signature` VARCHAR(255) NULL,   -- Firma Paciente / Apoderado
  `doctor_signature` VARCHAR(255) NULL,    -- Firma / Sello Doctor
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_patients_doctor` FOREIGN KEY (`responsible_doctor_id`) REFERENCES `doctors`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Cuestionario de Antecedentes y Matriz de Patologías (Hoja 1)
CREATE TABLE `patient_medical_history` (
  `patient_id` INT PRIMARY KEY,
  -- Preguntas SI / NO
  `under_treatment` TINYINT(1) DEFAULT 0,
  `treatment_details` VARCHAR(255) NULL,
  `is_allergic_to_medication` TINYINT(1) DEFAULT 0,
  `allergic_details` VARCHAR(255) NULL,
  `habitual_medications` VARCHAR(255) NULL,
  `has_cardiac_problems` TINYINT(1) DEFAULT 0,
  `has_high_blood_pressure` TINYINT(1) DEFAULT 0,
  `has_low_blood_pressure` TINYINT(1) DEFAULT 0,
  -- Hábitos
  `smokes` TINYINT(1) DEFAULT 0,
  `drinks` TINYINT(1) DEFAULT 0,
  -- Paciente Mujer
  `is_pregnant` TINYINT(1) DEFAULT 0,
  `pregnancy_months` VARCHAR(20) NULL,
  -- Matriz de Patologías Sistémicas
  `enfermedades_venereas` TINYINT(1) DEFAULT 0,
  `fiebre_reumatica` TINYINT(1) DEFAULT 0,
  `hepatitis` TINYINT(1) DEFAULT 0,
  `ulceras_estomago` TINYINT(1) DEFAULT 0,
  `alteraciones_nerviosas` TINYINT(1) DEFAULT 0,
  `sida` TINYINT(1) DEFAULT 0,
  `epilepsia` TINYINT(1) DEFAULT 0,
  `artritis` TINYINT(1) DEFAULT 0,
  `cancer` TINYINT(1) DEFAULT 0,
  `diabetes` TINYINT(1) DEFAULT 0,
  `dolor_cabeza` TINYINT(1) DEFAULT 0,
  `sinusitis` TINYINT(1) DEFAULT 0,
  `otros` VARCHAR(255) NULL,
  `general_notes` TEXT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_medhistory_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 3. ODONTOGRAMA ANATÓMICO (FDI)
-- ============================================================================

CREATE TABLE `odontogram_teeth` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `patient_id` INT NOT NULL,
  `tooth_number` INT NOT NULL, -- 11-48 permanentes / 51-85 temporales
  `whole_condition` ENUM(
    'healthy',
    'caries',
    'restored',
    'endodontics',
    'crown',
    'extraction_needed',
    'absent',
    'implant',
    'orthodontics'
  ) NOT NULL DEFAULT 'healthy',
  `notes` VARCHAR(255) NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_patient_tooth` (`patient_id`, `tooth_number`),
  CONSTRAINT `fk_odo_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `odontogram_surfaces` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tooth_entry_id` INT NOT NULL,
  `surface` ENUM('occlusal', 'mesial', 'distal', 'vestibular', 'lingual', 'palatal') NOT NULL,
  `condition_type` ENUM('caries', 'restored', 'fracture', 'sealant') NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_tooth_surface` (`tooth_entry_id`, `surface`),
  CONSTRAINT `fk_surface_tooth` FOREIGN KEY (`tooth_entry_id`) REFERENCES `odontogram_teeth`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 4. PLANES DE TRATAMIENTO Y CATÁLOGO OFICIAL (HOJA 2 ODONTODESA)
-- ============================================================================

-- Tarifario base oficial (21 ítems de la ficha física)
CREATE TABLE `standard_treatment_catalog` (
  `item_number` INT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `default_unit_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `is_orthodontics` TINYINT(1) NOT NULL DEFAULT 0,
  `default_ortho_initial` DECIMAL(10,2) NULL,
  `default_ortho_monthly` DECIMAL(10,2) NULL
) ENGINE=InnoDB;

CREATE TABLE `treatment_plans` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `patient_id` INT NOT NULL,
  `doctor_id` INT NULL,
  `title` VARCHAR(150) NOT NULL DEFAULT 'Plan de Tratamiento Integral',
  `status` ENUM('draft', 'presented', 'accepted', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'accepted',
  `subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `discount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total_cost` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_plan_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_plan_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Detalle de los ítems presupuestados (21 opciones o procedimientos específicos)
CREATE TABLE `treatment_plan_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `treatment_plan_id` INT NOT NULL,
  `item_number` INT NULL,               -- Referencia a los 21 ítems oficiales
  `procedure_name` VARCHAR(180) NOT NULL,
  `tooth_number` VARCHAR(30) NULL,      -- Pieza(s) afectadas
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `modifications` TEXT NULL,            -- Modificaciones / Especificaciones
  `status` ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
  CONSTRAINT `fk_item_plan` FOREIGN KEY (`treatment_plan_id`) REFERENCES `treatment_plans`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 5. CONTROL DE EVOLUCIÓN CLÍNICA, ENTREGAS Y SALDOS (HOJA 2 INFERIOR)
-- ============================================================================

CREATE TABLE `clinical_evolutions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `patient_id` INT NOT NULL,
  `doctor_id` INT NULL,
  `date` DATE NOT NULL,
  `tooth_piece` VARCHAR(30) NULL,           -- PIEZA (ej. "18", "16-17", "General")
  `work_done` TEXT NOT NULL,                -- TRABAJO EFECTUADO
  `amount_paid` DECIMAL(10,2) DEFAULT 0.00, -- ENTREGA
  `balance_due` DECIMAL(10,2) DEFAULT 0.00, -- SALDO
  `total_cost` DECIMAL(10,2) DEFAULT 0.00,  -- TOTAL
  `signature_signed` TINYINT(1) DEFAULT 1,  -- FIRMA
  `signed_by` VARCHAR(150) NULL,            -- Nombre de quien firma
  `evolution_notes` TEXT NULL,              -- Detalle técnico / Anestesia / Instrumental
  `prescriptions` TEXT NULL,                -- Receta o medicación indicada
  `next_action` VARCHAR(255) NULL,          -- Siguiente paso o cita
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_evo_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_evo_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================================
-- 6. GESTIÓN DE CITAS Y AGENDA
-- ============================================================================

CREATE TABLE `appointments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `patient_id` INT NOT NULL,
  `doctor_id` INT NOT NULL,
  `appointment_date` DATE NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `reason` VARCHAR(255) NOT NULL,
  `status` ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show') NOT NULL DEFAULT 'scheduled',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_appt_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_appt_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================================
-- 7. FACTURACIÓN, COBROS Y CONTROL DE CAJA
-- ============================================================================

CREATE TABLE `invoices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_number` VARCHAR(30) NOT NULL UNIQUE, -- FAC-2026-0001
  `patient_id` INT NOT NULL,
  `treatment_plan_id` INT NULL,
  `doctor_id` INT NULL,
  `issue_date` DATE NOT NULL,
  `due_date` DATE NULL,
  `subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `tax_rate` DECIMAL(5,2) NOT NULL DEFAULT 18.00, -- IGV / IVA
  `tax_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `discount_total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `amount_paid` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `balance_due` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('issued', 'partially_paid', 'paid', 'cancelled') NOT NULL DEFAULT 'issued',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_inv_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_inv_plan` FOREIGN KEY (`treatment_plan_id`) REFERENCES `treatment_plans`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_inv_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE `invoice_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_id` INT NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `tooth_number` VARCHAR(30) NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `discount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  CONSTRAINT `fk_inv_item` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `payment_transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_id` INT NOT NULL,
  `payment_date` DATE NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `payment_method` ENUM('cash', 'card', 'transfer', 'yape_plin', 'insurance') NOT NULL DEFAULT 'cash',
  `reference_code` VARCHAR(100) NULL,
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_payment_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 8. INVENTARIO Y MATERIALES DENTALES
-- ============================================================================

CREATE TABLE `inventory_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sku` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `category` ENUM('restorative', 'endodontics', 'surgery', 'orthodontics', 'ppe_biosecurity', 'implants', 'general') NOT NULL,
  `unit_of_measure` VARCHAR(30) NOT NULL DEFAULT 'Unidad', -- Tubo, Caja, Frasco, Pack
  `current_stock` INT NOT NULL DEFAULT 0,
  `min_stock` INT NOT NULL DEFAULT 5,
  `unit_cost` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `expiration_date` DATE NULL,
  `location` VARCHAR(100) NULL,                            -- Gabinete / Cajón
  `supplier` VARCHAR(150) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE `inventory_movements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `item_id` INT NOT NULL,
  `movement_type` ENUM('in_purchase', 'out_clinical_use', 'out_expired', 'adjustment') NOT NULL,
  `quantity` INT NOT NULL,
  `date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `reason` VARCHAR(255) NULL,
  `doctor_id` INT NULL,
  CONSTRAINT `fk_mov_item` FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mov_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================================
-- 9. DATOS SEMILLA (INSERTS INICIALES - CATÁLOGO DE 21 PROCEDIMIENTOS)
-- ============================================================================

INSERT INTO `standard_treatment_catalog` (`item_number`, `name`, `default_unit_price`, `is_orthodontics`, `default_ortho_initial`, `default_ortho_monthly`) VALUES
(1, 'Profilaxis y despistaje', 80.00, 0, NULL, NULL),
(2, 'Rx (Radiografía)', 30.00, 0, NULL, NULL),
(3, 'Blanqueamiento Dental', 350.00, 0, NULL, NULL),
(4, 'Exodoncia', 90.00, 0, NULL, NULL),
(5, 'Resina simple con luz halógena', 70.00, 0, NULL, NULL),
(6, 'Resina compuesta con luz halógena', 110.00, 0, NULL, NULL),
(7, 'Endodoncia anterior', 220.00, 0, NULL, NULL),
(8, 'Endodoncia posterior', 320.00, 0, NULL, NULL),
(9, 'P.P. Móviles', 450.00, 0, NULL, NULL),
(10, 'P. Completa', 800.00, 0, NULL, NULL),
(11, 'Ortodoncia', 600.00, 1, 600.00, 120.00),
(12, 'Perno Muñón', 150.00, 0, NULL, NULL),
(13, 'Corona Ivocron', 250.00, 0, NULL, NULL),
(14, 'Corona Metal Cerámica', 420.00, 0, NULL, NULL),
(15, 'Corona Libre de Metal', 650.00, 0, NULL, NULL),
(16, 'Fluorización', 50.00, 0, NULL, NULL),
(17, 'Gingivectomía / Gingivoplastia', 180.00, 0, NULL, NULL),
(18, 'Cirugía Diente Retenido / Semiretenido', 380.00, 0, NULL, NULL),
(19, 'Férula de descarga', 280.00, 0, NULL, NULL),
(20, 'Incrustación', 260.00, 0, NULL, NULL),
(21, 'Otros', 0.00, 0, NULL, NULL);

-- Doctor inicial
INSERT INTO `doctors` (`id`, `first_name`, `last_name`, `license_number`, `specialty`, `phone`, `email`) VALUES
(1, 'Carlos', 'Mendoza', 'COP-28004123', 'Rehabilitación Oral e Implantes', '+51 999 888 777', 'cmendoza@odontodesa.com'),
(2, 'Valeria', 'Soto', 'COP-28004589', 'Ortodoncia y Ortopedia Maxilar', '+51 988 777 666', 'vsoto@odontodesa.com');

-- Usuarios semilla para los 4 perfiles requeridos
INSERT INTO `users` (`id`, `username`, `first_name`, `last_name`, `email`, `phone`, `id_number`, `password_hash`, `role`, `status`, `avatar_color`, `two_factor_enabled`, `shift`, `associated_patient_id`, `notes`) VALUES
(1, 'admin.elena', 'Elena', 'Ramos Morales', 'elena.ramos@odontosaludpro.com', '+34 600 111 000', '44556677A', '$2y$10$abcdefghijklmnopqrstuvwxyz123456', 'admin', 'active', 'bg-indigo-600 text-white', 1, NULL, NULL, 'Directora Médica & Administradora General'),
(2, 'dr.carlos', 'Carlos', 'Mendoza', 'carlos.mendoza@odontosaludpro.com', '+34 600 111 222', '47889912B', '$2y$10$abcdefghijklmnopqrstuvwxyz123456', 'doctor', 'active', 'bg-sky-600 text-white', 0, NULL, NULL, 'Especialista en Rehabilitación Oral'),
(3, 'dra.valeria', 'Valeria', 'Soto', 'valeria.soto@odontosaludpro.com', '+34 600 333 444', '51223344C', '$2y$10$abcdefghijklmnopqrstuvwxyz123456', 'doctor', 'active', 'bg-purple-600 text-white', 1, NULL, NULL, 'Especialista en Ortodoncia'),
(4, 'asist.lucia', 'Lucía', 'Paredes Varga', 'lucia.paredes@odontosaludpro.com', '+34 600 777 888', '70889900D', '$2y$10$abcdefghijklmnopqrstuvwxyz123456', 'assistant', 'active', 'bg-amber-600 text-white', 0, 'morning', NULL, 'Recepción y triaje'),
(5, 'asist.mateo', 'Mateo', 'Gómez Castro', 'mateo.gomez@odontosaludpro.com', '+34 600 999 111', '72334455E', '$2y$10$abcdefghijklmnopqrstuvwxyz123456', 'assistant', 'active', 'bg-emerald-600 text-white', 0, 'afternoon', NULL, 'Asistente de gabinete e insumos'),
(6, 'paciente.sofia', 'Sofía', 'Alarcón Benítez', 'sofia.alarcon@email.com', '+34 612 345 678', '48990011K', '$2y$10$abcdefghijklmnopqrstuvwxyz123456', 'patient', 'active', 'bg-teal-600 text-white', 0, NULL, 1, 'Paciente con acceso a portal clínico');

-- Registro inicial de auditoría
INSERT INTO `audit_logs` (`user_id`, `user_name`, `user_role`, `action`, `target_entity`, `details`) VALUES
(1, 'Elena Ramos', 'admin', 'LOGIN', 'USER', 'Inicio de sesión administrativo con credenciales maestras y 2FA');
