CREATE DATABASE IF NOT EXISTS kartalparkdedemancafe
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kartalparkdedemancafe;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  username VARCHAR(40) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'reception', 'chef') NOT NULL DEFAULT 'admin',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(120) NOT NULL,
  menu_section VARCHAR(40) NULL,
  menu_subsection VARCHAR(40) NULL,
  description VARCHAR(700) NOT NULL DEFAULT '',
  intensity TINYINT UNSIGNED NULL,
  selling_price DECIMAL(10, 2) NOT NULL,
  cost_price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(500) NOT NULL DEFAULT '',
  translations JSON NULL,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_products_menu (menu_section, menu_subsection, is_available),
  KEY idx_products_category (category, is_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id CHAR(36) NOT NULL PRIMARY KEY,
  room_number VARCHAR(20) NOT NULL,
  is_own_order TINYINT(1) NOT NULL DEFAULT 0,
  items JSON NOT NULL,
  payment_method ENUM('Nakit', 'Kredi Kartı') NOT NULL,
  status ENUM('Bekliyor', 'Teslim Edildi', 'İptal Edildi') NOT NULL DEFAULT 'Bekliyor',
  total_revenue DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  total_profit DECIMAL(10, 2) NOT NULL,
  delivered_at DATETIME NULL,
  cancelled_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_orders_status_created (status, created_at),
  KEY idx_orders_delivered (delivered_at),
  KEY idx_orders_cancelled (cancelled_at),
  KEY idx_orders_room (room_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS breakfasts (
  id CHAR(36) NOT NULL PRIMARY KEY,
  room_number VARCHAR(20) NOT NULL,
  note VARCHAR(500) NOT NULL DEFAULT '',
  guest_count TINYINT UNSIGNED NOT NULL DEFAULT 1,
  requested_time CHAR(5) NOT NULL DEFAULT '09:00',
  scheduled_date DATE NOT NULL,
  plan_id CHAR(36) NULL,
  status ENUM('Bekliyor', 'Teslim Edildi', 'İptal Edildi') NOT NULL DEFAULT 'Bekliyor',
  delivered_at DATETIME NULL,
  cancelled_at DATETIME NULL,
  cancellation_reason VARCHAR(255) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_breakfasts_status_date (status, scheduled_date),
  KEY idx_breakfasts_delivered (delivered_at),
  KEY idx_breakfasts_plan (plan_id),
  KEY idx_breakfasts_room (room_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
