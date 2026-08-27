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

-- Insert default admin user: username: admin, password: 0dPw16X22k2t2C. (hashed in SHA-256)
INSERT INTO `admin` (`username`, `password`)
SELECT 'admin', 'd9b5bf0981315efee593a7b45eda8e501502d38a39b8ca1bf52da29d87287fbe'
WHERE NOT EXISTS (SELECT 1 FROM `admin` WHERE `username` = 'admin');
