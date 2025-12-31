-- Database and tables for Visitor & Parcel Management System
CREATE DATABASE IF NOT EXISTS vpms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vpms;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(15) DEFAULT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','guard','resident') NOT NULL DEFAULT 'resident',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS visitors_parcels (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  record_type ENUM('visitor','parcel') NOT NULL,
  resident_id BIGINT UNSIGNED NOT NULL,
  visitor_name VARCHAR(120) DEFAULT NULL,
  visitor_phone VARCHAR(40) DEFAULT NULL,
  purpose VARCHAR(200) DEFAULT NULL,
  parcel_carrier VARCHAR(120) DEFAULT NULL,
  parcel_tracking VARCHAR(120) DEFAULT NULL,
  expected_at DATETIME DEFAULT NULL,
  arrived_at DATETIME DEFAULT NULL,
  checked_in_at DATETIME DEFAULT NULL,
  checked_out_at DATETIME DEFAULT NULL,
  received_at DATETIME DEFAULT NULL,
  acknowledged_at DATETIME DEFAULT NULL,
  collected_at DATETIME DEFAULT NULL,
  status ENUM('new','waiting_approval','approved','rejected','entered','exited','pending','delivered','returned','received','acknowledged','collected') NOT NULL DEFAULT 'pending',
  notes VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_visitors_parcels_resident (resident_id),
  CONSTRAINT fk_visitors_parcels_resident FOREIGN KEY (resident_id) REFERENCES users(id)
) ENGINE=InnoDB;
