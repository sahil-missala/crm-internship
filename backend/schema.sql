CREATE DATABASE IF NOT EXISTS manivtha_crm;
USE manivtha_crm;

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','executive') DEFAULT 'executive',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS enquiries (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  customer_name        VARCHAR(100) NOT NULL,
  phone                VARCHAR(15) NOT NULL,
  email                VARCHAR(100),
  source               ENUM('Walk-in','Phone Call','WhatsApp','Telegram','Website','Reference','Other') NOT NULL,
  trip_type            ENUM('One-Way Drop','Round Trip','Airport Transfer','Outstation','Hill Station','Custom') NOT NULL,
  pickup_location      VARCHAR(200) NOT NULL,
  drop_location        VARCHAR(200) NOT NULL,
  travel_date          DATE NOT NULL,
  return_date          DATE,
  passengers           TINYINT DEFAULT 1,
  special_requirements TEXT,
  status               ENUM('New','Contacted','Confirmed','Cancelled','Completed') DEFAULT 'New',
  follow_up_date       DATE,
  assigned_to          INT,
  telegram_chat_id     VARCHAR(50) DEFAULT NULL,
  cancellation_reason  VARCHAR(255) DEFAULT NULL,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS enquiry_notes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  enquiry_id  INT NOT NULL,
  user_id     INT,
  note        TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)     ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS enquiry_status_history (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  enquiry_id  INT NOT NULL,
  old_status  VARCHAR(50),
  new_status  VARCHAR(50),
  changed_by  INT,
  changed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id)     ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bookings (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  enquiry_id      INT NOT NULL,
  vehicle_type    VARCHAR(100),
  driver_name     VARCHAR(100),
  driver_phone    VARCHAR(15),
  pickup_datetime DATETIME,
  total_amount    DECIMAL(10,2),
  advance_paid    DECIMAL(10,2) DEFAULT 0,
  payment_status  ENUM('Pending','Partial','Paid') DEFAULT 'Pending',
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bot_sessions (
  chat_id VARCHAR(50) PRIMARY KEY,
  platform ENUM('Telegram', 'WhatsApp') NOT NULL,
  current_step VARCHAR(50) NOT NULL,
  collected_data JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
