CREATE DATABASE IF NOT EXISTS `resize_image`;
USE `resize_image`;

CREATE TABLE IF NOT EXISTS `admin` (
  `admin_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  PRIMARY KEY (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `token` (
  `api_keys` text NOT NULL,
  `name` text NOT NULL,
  `bucket` text NOT NULL,
  `createdAT` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `files` (
  `uuid` varchar(36) NOT NULL,
  `bucket` varchar(255) NOT NULL,
  `file_key` varchar(255) NOT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 0,
  `owner_api_key` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `access_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `file_uuid` varchar(36) NOT NULL,
  `ip_address` varchar(45),
  `accessed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Insert default admin user: username: admin, password: 0dPw16X22k2t2C. (hashed in SHA-256)
INSERT INTO `admin` (`username`, `password`)
SELECT 'admin', 'd9b5bf0981315efee593a7b45eda8e501502d38a39b8ca1bf52da29d87287fbe'
WHERE NOT EXISTS (SELECT 1 FROM `admin` WHERE `username` = 'admin');
