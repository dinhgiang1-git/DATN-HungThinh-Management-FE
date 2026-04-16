-- MySQL dump 10.13  Distrib 9.6.0, for Linux (x86_64)
--
-- Host: localhost    Database: datn-hungthinh-management-db
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '629543a1-3715-11f1-b6ea-02b998b10a87:1-139';

--
-- Table structure for table `apartments`
--

DROP TABLE IF EXISTS `apartments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `apartments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `modified_at` datetime(6) NOT NULL,
  `apartment_number` varchar(255) NOT NULL,
  `apartment_status` enum('OCCUPIED','UNDER_MAINTENANCE','VACANT') NOT NULL,
  `area` decimal(8,2) DEFAULT NULL,
  `block` varchar(255) NOT NULL,
  `floor` int NOT NULL,
  `owner_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKqgb67vx6ttbuq684ebtioy3o9` (`apartment_number`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `apartments`
--

LOCK TABLES `apartments` WRITE;
/*!40000 ALTER TABLE `apartments` DISABLE KEYS */;
INSERT INTO `apartments` VALUES (1,'2026-04-14 14:05:42.395686','2026-04-14 15:00:49.456928','A101','OCCUPIED',32.00,'A',1,1),(2,'2026-04-14 14:06:03.128592','2026-04-14 15:39:13.943422','A102','OCCUPIED',32.00,'A',1,3),(3,'2026-04-14 14:06:16.368526','2026-04-14 14:06:16.368526','A103','VACANT',32.00,'A',1,NULL),(4,'2026-04-14 14:06:35.345819','2026-04-14 14:06:35.345819','A104','VACANT',32.00,'A',1,NULL),(5,'2026-04-14 14:06:48.517446','2026-04-14 14:06:48.517446','A105','VACANT',32.00,'A',1,NULL),(6,'2026-04-14 14:06:55.857000','2026-04-14 14:06:55.857000','A106','VACANT',32.00,'A',1,NULL),(7,'2026-04-14 14:07:04.249358','2026-04-14 15:41:40.919262','A107','UNDER_MAINTENANCE',32.00,'A',1,NULL),(8,'2026-04-14 14:07:24.969558','2026-04-14 14:07:24.969558','A108','VACANT',32.00,'A',1,NULL),(9,'2026-04-14 14:07:34.355180','2026-04-14 14:07:34.355180','A109','VACANT',32.00,'A',1,NULL),(10,'2026-04-14 14:08:31.507711','2026-04-14 15:41:31.025399','B101','UNDER_MAINTENANCE',28.00,'B',1,NULL),(11,'2026-04-14 14:08:49.658447','2026-04-14 14:08:49.658447','B102','VACANT',28.00,'B',1,NULL),(12,'2026-04-14 14:09:02.612629','2026-04-14 14:09:02.612629','B103','VACANT',28.00,'B',1,NULL),(13,'2026-04-14 14:09:17.766130','2026-04-14 14:09:17.766130','B104','VACANT',28.00,'B',1,NULL),(14,'2026-04-14 14:09:30.317688','2026-04-14 14:09:30.317688','B105','VACANT',28.00,'B',1,NULL),(15,'2026-04-14 14:09:37.778739','2026-04-14 14:09:37.778739','B106','VACANT',28.00,'B',1,NULL),(16,'2026-04-14 14:09:45.798865','2026-04-14 14:09:45.798865','B107','VACANT',28.00,'B',1,NULL),(17,'2026-04-14 14:09:55.333632','2026-04-14 14:09:55.333632','B108','VACANT',28.00,'B',1,NULL),(18,'2026-04-14 14:10:03.359543','2026-04-14 14:10:03.359543','B109','VACANT',28.00,'B',1,NULL);
/*!40000 ALTER TABLE `apartments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `devices`
--

DROP TABLE IF EXISTS `devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `devices` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `modified_at` datetime(6) NOT NULL,
  `device_name` varchar(255) NOT NULL,
  `device_status` enum('ACTIVE','BROKEN','INACTIVE','UNDER_MAINTENANCE') NOT NULL,
  `installation_date` date NOT NULL,
  `location` varchar(255) NOT NULL,
  `maintenance_cycle_day` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `devices`
--

LOCK TABLES `devices` WRITE;
/*!40000 ALTER TABLE `devices` DISABLE KEYS */;
INSERT INTO `devices` VALUES (1,'2023-03-15 08:00:00.000000','2024-01-01 08:00:00.000000','Camera sảnh chính','ACTIVE','2023-03-15','Tầng 1 - Sảnh chính',90),(2,'2023-03-20 08:00:00.000000','2024-01-01 08:00:00.000000','Camera hầm xe B1','ACTIVE','2023-03-20','Tầng hầm B1',90),(3,'2023-03-20 08:00:00.000000','2024-01-01 08:00:00.000000','Camera hầm xe B2','UNDER_MAINTENANCE','2023-03-20','Tầng hầm B2',90),(4,'2022-01-01 08:00:00.000000','2024-01-01 08:00:00.000000','Thang máy số 1','ACTIVE','2022-01-01','Tầng 1 - Khu A',30),(5,'2022-01-01 08:00:00.000000','2024-01-01 08:00:00.000000','Thang máy số 2','ACTIVE','2022-01-01','Tầng 1 - Khu B',30),(6,'2022-06-10 08:00:00.000000','2024-01-01 08:00:00.000000','Máy bơm nước tầng hầm','ACTIVE','2022-06-10','Tầng hầm B1',180),(7,'2022-05-05 08:00:00.000000','2024-01-01 08:00:00.000000','Hệ thống PCCC tầng 1','ACTIVE','2022-05-05','Tầng 1 - Hành lang',180),(8,'2022-05-05 08:00:00.000000','2024-01-01 08:00:00.000000','Hệ thống PCCC tầng 2','BROKEN','2022-05-05','Tầng 2 - Hành lang',180),(9,'2021-08-15 08:00:00.000000','2024-01-01 08:00:00.000000','Máy phát điện dự phòng','ACTIVE','2021-08-15','Tầng hầm B2',60),(10,'2022-01-01 08:00:00.000000','2024-01-01 08:00:00.000000','Điều hòa trung tâm','ACTIVE','2022-01-01','Tầng 1 - Sảnh chính',90),(11,'2023-02-10 08:00:00.000000','2024-01-01 08:00:00.000000','Cổng từ tầng hầm','ACTIVE','2023-02-10','Tầng hầm B1 - Cổng vào',120),(12,'2021-01-01 08:00:00.000000','2024-01-01 08:00:00.000000','Bảng điện tổng','ACTIVE','2021-01-01','Tầng hầm B1 - Phòng kỹ thuật',180),(13,'2023-06-01 08:00:00.000000','2024-01-01 08:00:00.000000','Camera hành lang tầng 5','UNDER_MAINTENANCE','2023-06-01','Tầng 5 - Hành lang',90),(14,'2023-01-20 08:00:00.000000','2024-01-01 08:00:00.000000','Hệ thống chiếu sáng sảnh','INACTIVE','2023-01-20','Tầng 1 - Sảnh chính',365),(15,'2022-09-10 08:00:00.000000','2024-01-01 08:00:00.000000','Máy bơm nước mái','ACTIVE','2022-09-10','Tầng mái',180);
/*!40000 ALTER TABLE `devices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedbacks`
--

DROP TABLE IF EXISTS `feedbacks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedbacks` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `modified_at` datetime(6) NOT NULL,
  `content` text,
  `feedback_status` tinyint NOT NULL,
  `is_read` bit(1) DEFAULT NULL,
  `response` text,
  `title` varchar(255) NOT NULL,
  `apartment_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKc7wqkidnirhfcbywc6wiga7hg` (`apartment_id`),
  CONSTRAINT `FKc7wqkidnirhfcbywc6wiga7hg` FOREIGN KEY (`apartment_id`) REFERENCES `apartments` (`id`),
  CONSTRAINT `feedbacks_chk_1` CHECK ((`feedback_status` between 0 and 3))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedbacks`
--

LOCK TABLES `feedbacks` WRITE;
/*!40000 ALTER TABLE `feedbacks` DISABLE KEYS */;
/*!40000 ALTER TABLE `feedbacks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `modified_at` datetime(6) NOT NULL,
  `due_date` date NOT NULL,
  `electric_fee` decimal(38,2) DEFAULT NULL,
  `invoice_number` varchar(255) NOT NULL,
  `invoice_status` enum('PAID','UNPAID') NOT NULL,
  `management_fee` decimal(38,2) DEFAULT NULL,
  `other_fee` decimal(38,2) DEFAULT NULL,
  `parking_fee` decimal(38,2) DEFAULT NULL,
  `total_amount` decimal(38,2) DEFAULT NULL,
  `water_fee` decimal(38,2) DEFAULT NULL,
  `apartment_id` bigint NOT NULL,
  `creator_id` bigint NOT NULL,
  `description_other_fee` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKl1x55mfsay7co0r3m9ynvipd5` (`invoice_number`),
  KEY `FK7lccvtt6y0onp9e8fd3pqf2a9` (`apartment_id`),
  KEY `FKo1gkqyuowexeju36uux280uha` (`creator_id`),
  CONSTRAINT `FK7lccvtt6y0onp9e8fd3pqf2a9` FOREIGN KEY (`apartment_id`) REFERENCES `apartments` (`id`),
  CONSTRAINT `FKo1gkqyuowexeju36uux280uha` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_technicians`
--

DROP TABLE IF EXISTS `maintenance_technicians`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_technicians` (
  `maintenance_id` bigint NOT NULL,
  `technician_id` bigint NOT NULL,
  UNIQUE KEY `UK2eyn1msougw9xan7nef5b19nb` (`maintenance_id`,`technician_id`),
  KEY `FKd3cs94vs5rmhvpikxos4iwogp` (`technician_id`),
  CONSTRAINT `FKd3cs94vs5rmhvpikxos4iwogp` FOREIGN KEY (`technician_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKi6xfff26ktstg9xolxdb4vk9p` FOREIGN KEY (`maintenance_id`) REFERENCES `maintenances` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_technicians`
--

LOCK TABLES `maintenance_technicians` WRITE;
/*!40000 ALTER TABLE `maintenance_technicians` DISABLE KEYS */;
INSERT INTO `maintenance_technicians` VALUES (1,2);
/*!40000 ALTER TABLE `maintenance_technicians` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenances`
--

DROP TABLE IF EXISTS `maintenances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenances` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `modified_at` datetime(6) NOT NULL,
  `completed_date` date DEFAULT NULL,
  `cost` decimal(12,2) DEFAULT NULL,
  `desciption` varchar(255) DEFAULT NULL,
  `maintenance_status` enum('CANCELLED','COMPLETED','SCHEDULED') NOT NULL,
  `started_date` date DEFAULT NULL,
  `device_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKh16ln2nf6edfg06nwu530egx` (`device_id`),
  CONSTRAINT `FKh16ln2nf6edfg06nwu530egx` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenances`
--

LOCK TABLES `maintenances` WRITE;
/*!40000 ALTER TABLE `maintenances` DISABLE KEYS */;
INSERT INTO `maintenances` VALUES (1,'2026-04-15 14:00:08.036291','2026-04-15 14:00:21.266803','2026-07-20',500000.00,NULL,'SCHEDULED','2026-03-20',3);
/*!40000 ALTER TABLE `maintenances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_receiver`
--

DROP TABLE IF EXISTS `notification_receiver`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_receiver` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `modified_at` datetime(6) NOT NULL,
  `is_read` bit(1) DEFAULT NULL,
  `read_at` datetime(6) DEFAULT NULL,
  `notification_id` bigint NOT NULL,
  `resident_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKfcarrxfqiq4844idq872t2ut7` (`notification_id`),
  KEY `FK90ceawjg7q1yk3vl6l2t176d1` (`resident_id`),
  CONSTRAINT `FK90ceawjg7q1yk3vl6l2t176d1` FOREIGN KEY (`resident_id`) REFERENCES `residents` (`id`),
  CONSTRAINT `FKfcarrxfqiq4844idq872t2ut7` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_receiver`
--

LOCK TABLES `notification_receiver` WRITE;
/*!40000 ALTER TABLE `notification_receiver` DISABLE KEYS */;
INSERT INTO `notification_receiver` VALUES (1,'2026-04-14 16:18:50.797892','2026-04-14 16:18:50.797892',_binary '\0',NULL,1,1),(2,'2026-04-14 16:18:50.809767','2026-04-14 16:18:50.809767',_binary '\0',NULL,1,2),(3,'2026-04-14 16:18:50.814381','2026-04-14 16:18:50.814381',_binary '\0',NULL,1,3),(4,'2026-04-14 16:18:50.817948','2026-04-14 16:18:50.817948',_binary '\0',NULL,1,4),(5,'2026-04-14 16:18:50.822383','2026-04-14 16:18:50.822383',_binary '\0',NULL,1,5),(6,'2026-04-14 16:18:50.822383','2026-04-14 16:18:50.822383',_binary '\0',NULL,1,6),(7,'2026-04-14 16:18:50.829795','2026-04-14 16:18:50.829795',_binary '\0',NULL,1,7),(8,'2026-04-14 16:18:50.833964','2026-04-14 16:18:50.833964',_binary '\0',NULL,1,8),(9,'2026-04-14 16:18:50.834474','2026-04-14 16:18:50.834474',_binary '\0',NULL,1,9),(10,'2026-04-14 16:18:50.841477','2026-04-14 16:18:50.841477',_binary '\0',NULL,1,10),(11,'2026-04-14 16:18:50.846286','2026-04-14 16:18:50.846286',_binary '\0',NULL,1,11),(12,'2026-04-14 16:18:50.850517','2026-04-14 16:18:50.850517',_binary '\0',NULL,1,12),(13,'2026-04-14 16:18:50.853463','2026-04-14 16:18:50.853463',_binary '\0',NULL,1,13),(14,'2026-04-14 16:18:50.858206','2026-04-14 16:18:50.858206',_binary '\0',NULL,1,14),(15,'2026-04-14 16:18:50.861565','2026-04-14 16:18:50.861565',_binary '\0',NULL,1,15),(22,'2026-04-14 16:59:20.559503','2026-04-14 16:59:20.559503',_binary '\0',NULL,10,1),(23,'2026-04-14 16:59:20.561564','2026-04-14 16:59:20.561564',_binary '\0',NULL,10,3),(24,'2026-04-15 10:27:48.226165','2026-04-15 10:27:48.226165',_binary '\0',NULL,11,1),(25,'2026-04-15 10:27:48.230624','2026-04-15 10:27:48.230624',_binary '\0',NULL,11,3),(26,'2026-04-15 10:28:02.962767','2026-04-15 10:28:02.962767',_binary '\0',NULL,12,1);
/*!40000 ALTER TABLE `notification_receiver` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `modified_at` datetime(6) NOT NULL,
  `content` text,
  `send_time` datetime(6) NOT NULL,
  `target_type` enum('ALL','APARTMENT','BLOCK') DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `sender_id` bigint DEFAULT NULL,
  `block` varchar(255) DEFAULT NULL,
  `apartment_id` bigint DEFAULT NULL,
  `notification_apartment_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK13vcnq3ukas06ho1yrbc5lrb5` (`sender_id`),
  KEY `FKbfuwhaupbv2k334dfbh6vc656` (`apartment_id`),
  CONSTRAINT `FK13vcnq3ukas06ho1yrbc5lrb5` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKbfuwhaupbv2k334dfbh6vc656` FOREIGN KEY (`apartment_id`) REFERENCES `apartments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,'2026-04-14 16:18:50.761301','2026-04-15 09:20:01.702038','','2026-04-14 16:18:50.680190','ALL',' Thông báo lịch bảo trì thang máy khu A vào ngày 10/01/2024. Cư dân vui lòng sử dụng thang bộ trong thời gian này.',1,NULL,NULL,NULL),(10,'2026-04-14 16:59:20.521573','2026-04-14 16:59:20.521573','','2026-04-14 16:59:20.411497','BLOCK','asadasbdashjkbdashjd',1,NULL,NULL,NULL),(11,'2026-04-15 10:27:48.198714','2026-04-15 10:27:48.198714','','2026-04-15 10:27:48.134733','BLOCK','asjdasudnaiushdiasdiasnd',1,'A',NULL,NULL),(12,'2026-04-15 10:28:02.957843','2026-04-15 10:28:02.957843','','2026-04-15 10:28:02.945617','APARTMENT','adasdasdasd',1,NULL,NULL,1);
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `modified_at` datetime(6) NOT NULL,
  `amount` decimal(38,2) DEFAULT NULL,
  `bank_code` varchar(255) DEFAULT NULL,
  `pay_date` varchar(255) DEFAULT NULL,
  `payment_date_time` datetime(6) DEFAULT NULL,
  `payment_method` enum('MOMO','VNPAY') DEFAULT NULL,
  `status` enum('FAILED','PENDING','SUCCESS') DEFAULT NULL,
  `response_code` varchar(255) DEFAULT NULL,
  `transaction_no` varchar(255) DEFAULT NULL,
  `txn_ref` varchar(255) DEFAULT NULL,
  `invoice_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKqfwbl15lmi3eyeim0rr81cacw` (`transaction_no`),
  KEY `FKrbqec6be74wab8iifh8g3i50i` (`invoice_id`),
  CONSTRAINT `FKrbqec6be74wab8iifh8g3i50i` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `residents`
--

DROP TABLE IF EXISTS `residents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `residents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `modified_at` datetime(6) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  `relationship` enum('CHILD','OTHER','OWNER','PARENT','RELATIVE','SPOUSE','TENANT') NOT NULL,
  `role` enum('ADMIN','RESIDENT','TECHNICIAN') NOT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `apartment_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKfdbh184txvda5ox0fabw9lrdt` (`email`),
  UNIQUE KEY `UKdnvylgv23ol0vewo1iv6n9v5r` (`user_name`),
  KEY `FKgq3b1iv87p9nhnpvw6yrbwj14` (`apartment_id`),
  CONSTRAINT `FKgq3b1iv87p9nhnpvw6yrbwj14` FOREIGN KEY (`apartment_id`) REFERENCES `apartments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `residents`
--

LOCK TABLES `residents` WRITE;
/*!40000 ALTER TABLE `residents` DISABLE KEYS */;
INSERT INTO `residents` VALUES (1,'2026-04-14 11:58:15.329366','2026-04-14 15:00:49.481916','minhtuan@gmail.com','Nguyễn Minh Tuấn','$2a$10$6Wj08wx1U.E5roToyxon1uIZuY4t/WUfEJdeiwZsmLhN7EaPYKNMS','0987586937','OWNER','RESIDENT','minhtuan',1),(2,'2026-04-14 11:58:53.809956','2026-04-14 11:58:53.809956','thilan@gmail.com','Nguyễn Thị Lan','$2a$10$j1OEvh253e0wPiA19SfvCOI52A/AasckqOLVwzSQP8lDGQ9cRkKou','0987489758','OWNER','RESIDENT','thilan',NULL),(3,'2026-04-14 11:59:14.258914','2026-04-14 15:39:13.935093','quocbao@gmail.com','Lê Quốc Bảo','$2a$10$UbhzVyo8BtjRCtOqaRoEY.wAh7nKw876tha8cXr7.jgM2FonSSxSO','0847582947','OWNER','RESIDENT','quocbao',2),(4,'2026-04-14 11:59:32.756839','2026-04-14 11:59:32.756839','thimai@gmail.com','Trần Thị Mai','$2a$10$G9wMTFVl3wrvFAHLu7F2jOwiDxydeG/C78pn/3N4QgqKYoDDQPao2','0847582937','OWNER','RESIDENT','thimai',NULL),(5,'2026-04-14 12:00:04.219377','2026-04-14 12:00:04.219377','duckhai@gmail.com','Phạm Đức Khải','$2a$10$EoUvUhNflrNNpsb9VpTTlOy79bBnJVOGpxHqfuapVVowkatRWU1RG','0849572847','OWNER','RESIDENT','duckhai',NULL),(6,'2026-04-14 12:00:32.690256','2026-04-14 12:00:32.690256','thihuong@gmail.com','Lê Thị Hương','$2a$10$2G47Q/tcItSMi0XQqQCIKuUdgNqjMEdIpnBno43MQAnjFD1GCpK4K','0937584927','OWNER','RESIDENT','thihuong',NULL),(7,'2026-04-14 12:00:57.446150','2026-04-14 12:00:57.446150','vanlong@gmail.com','Hoàng Văn Long','$2a$10$QDOXY32I1lcP2scebiTSoucdoREAPghHP8Nt97rJOp//wwpBFCiqa','0947582956','OWNER','RESIDENT','vanlong',NULL),(8,'2026-04-14 12:01:28.684725','2026-04-14 12:01:28.684725','ngocanh@gmail.com','Phạm Ngọc Ánh','$2a$10$JXj/rBU4oOJD7hc9xPeaPebo/TItT6SVKa6ZXGuuaMQ/Dz5Tx/3.6','0936572845','OWNER','RESIDENT','ngocanh',NULL),(9,'2026-04-14 12:01:54.083622','2026-04-14 12:01:54.084802','manhcuong@gmail.com','Vũ Mạnh Cường','$2a$10$AW51FRq3.9BvEyki5k44lu4qR/peq8X8DUxz6wWZuxCizs7zD.N2C','0926153486','OWNER','RESIDENT','manhcuong',NULL),(10,'2026-04-14 13:43:47.499384','2026-04-14 13:43:47.499384','huuphuc@gmail.com','Đặng Hữu Phúc','$2a$10$BVmQBBtHs/rZx/wIvoerAu3wp//thQvcxLI7Y3IMHxEWbYRiDJ5Wy','0985768376','OWNER','RESIDENT','huuphuc',NULL),(11,'2026-04-14 13:44:14.529674','2026-04-14 13:44:14.529674','thanhtung@gmail.com','Bùi Thanh Tùng','$2a$10$9xNH3s6JrJy/ZHiW2nl.SuhDsrJau0R0isvEVjXZMm1xXB2rRy5Ie','0984657389','OWNER','RESIDENT','thanhtung',NULL),(12,'2026-04-14 13:44:39.220893','2026-04-14 13:44:39.220893','trongnghia@gmail.com','Đỗ Trọng Nghĩa','$2a$10$JNGWyClgExLdK12Q24eKdeYsUNbcv54L7vBKUsp103IrKoGGLCOMK','094758692','OWNER','RESIDENT','trongnghia',NULL),(13,'2026-04-14 13:45:01.514657','2026-04-14 13:45:01.514657','vanthang@gmail.com','Ngô Văn Thắng','$2a$10$Zq7or3BtQMDDm1PpMpQjQeOzKEDKo5gZKmuJOrOTQo42EqW9W2.DG','0968743769','OWNER','RESIDENT','vanthang',NULL),(14,'2026-04-14 13:45:28.032411','2026-04-14 13:45:28.032411','congson@gmail.com','Định Công Sơn','$2a$10$tI0lJD6ff.tu5fhQn.gCSO3tBD4D.jQ3zEkMtsAn.N2mxTdlI1bgW','0957683241','OWNER','RESIDENT','congson',NULL),(15,'2026-04-14 13:45:47.231254','2026-04-14 13:45:47.231254','hoangnam@gmail.com','Lý Hoàng Nam','$2a$10$0WllJ2v3ef14Ro2CI5c71e3XIvqKVEhsiOv47hHcPsEtA8/1s/BF2','0937216459','OWNER','RESIDENT','hoangnam',NULL),(16,'2026-04-14 15:02:56.738916','2026-04-14 15:20:03.198034','thiquynh@gmail.com','Mai Thị Quỳnh',NULL,'0986794625','SPOUSE','RESIDENT',NULL,1),(17,'2026-04-14 15:11:38.201378','2026-04-14 15:39:13.945587','thiyen@gmail.com','Trịnh Thị Yến',NULL,'0975968475','SPOUSE','RESIDENT',NULL,2),(18,'2026-04-14 15:12:13.556941','2026-04-14 15:12:13.556941','thicam@gmail.com','Phan Thị Cẩm',NULL,'0857693758','SPOUSE','RESIDENT',NULL,NULL),(19,'2026-04-14 15:12:31.824067','2026-04-14 15:12:31.824067','thibich@gmail.com','Lý Thị Bích',NULL,'0958674637','SPOUSE','RESIDENT',NULL,NULL),(20,'2026-04-14 15:12:49.304270','2026-04-14 15:12:49.304270','thitrang@gmail.com','Đinh Thị Trang',NULL,'0947583928','SPOUSE','RESIDENT',NULL,NULL);
/*!40000 ALTER TABLE `residents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `table_electric_tier`
--

DROP TABLE IF EXISTS `table_electric_tier`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `table_electric_tier` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `modified_at` datetime(6) NOT NULL,
  `tier_order` int NOT NULL,
  `unit_from` int NOT NULL,
  `unit_price` decimal(38,2) NOT NULL,
  `unit_to` int DEFAULT NULL,
  `table_fee_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK5eo88p6yepasvcaexw5xkf1sw` (`table_fee_id`),
  CONSTRAINT `FK5eo88p6yepasvcaexw5xkf1sw` FOREIGN KEY (`table_fee_id`) REFERENCES `table_fee` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `table_electric_tier`
--

LOCK TABLES `table_electric_tier` WRITE;
/*!40000 ALTER TABLE `table_electric_tier` DISABLE KEYS */;
/*!40000 ALTER TABLE `table_electric_tier` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `table_fee`
--

DROP TABLE IF EXISTS `table_fee`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `table_fee` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `modified_at` datetime(6) NOT NULL,
  `electric_fee` decimal(38,2) DEFAULT NULL,
  `management_fee` decimal(38,2) DEFAULT NULL,
  `other_fee` decimal(38,2) DEFAULT NULL,
  `parking_fee` decimal(38,2) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `water_fee` decimal(38,2) DEFAULT NULL,
  `description_other_fee` text,
  `use_tiered_electric` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `table_fee`
--

LOCK TABLES `table_fee` WRITE;
/*!40000 ALTER TABLE `table_fee` DISABLE KEYS */;
/*!40000 ALTER TABLE `table_fee` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `modified_at` datetime(6) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  `user_role` enum('ADMIN','RESIDENT','TECHNICIAN') NOT NULL,
  `user_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKk8d0f2n7n88w1a16yhua64onx` (`user_name`),
  UNIQUE KEY `UK6dotkott2kjsp8vw4d0m25fb7` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'2026-04-14 09:44:00.645131','2026-04-14 10:19:17.551487','admin@gmail.com','Nguyễn Văn Admin','$2a$10$jXa9VOBqD1tqqboUTTN1beoEqdm0G1K9qdxPJUQkjxinLbR/9F/i6','0987123456','ADMIN','admin'),(2,'2026-04-14 10:16:53.793186','2026-04-14 10:19:25.778952','chuthinh@gmail.com','Chu Tuấn Thịnh','$2a$10$g4Vi3ZM4iB71142X4hojkOzlHMKb7ZBoazstovWDyn9F2rHImAAbS','0123896432','TECHNICIAN','chuthinh'),(3,'2026-04-14 10:17:48.032699','2026-04-14 10:19:33.872033','quangkhai@gmail.com','Lưu Quang Khải','$2a$10$TcinlftUUUcrrjIeXw8WLu/LeW6HD4hOO90bnDaibFArFoVM5U6Zy','0924782947','TECHNICIAN','quangkhai');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-16  3:19:33
