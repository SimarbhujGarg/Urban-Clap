-- Create a new database (if not already created)
CREATE DATABASE IF NOT EXISTS urban_company;
USE urban_company;

-- Table for Carpenters
CREATE TABLE IF NOT EXISTS carpenters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    expertise VARCHAR(100)
);

-- Table for Slots (each slot belongs to a specific carpenter)
CREATE TABLE IF NOT EXISTS slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    carpenter_id INT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (carpenter_id) REFERENCES carpenters(id)
);

-- Table for Reservations (each reservation is for a slot and a user)
CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slot_id INT UNIQUE, -- one reservation per slot
    user_name VARCHAR(100) NOT NULL,
    status ENUM('booked', 'confirmed', 'cancelled') DEFAULT 'booked',
    booked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (slot_id) REFERENCES slots(id)
);