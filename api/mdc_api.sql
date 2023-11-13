-- MySQL dump 10.14  Distrib 5.5.68-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: mdc
-- ------------------------------------------------------
-- Server version	5.5.68-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `general`
--

DROP TABLE IF EXISTS `general`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `general` (
  `name` varchar(20) NOT NULL,
  `base` longtext,
  `overrides` longtext,
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `general`
--

LOCK TABLES `general` WRITE;
/*!40000 ALTER TABLE `general` DISABLE KEYS */;
INSERT INTO `general` VALUES ('threats','{\"import\": {\"M1045 HMMWV TOW\": {\"name\": \"ATGM M1045 HMMWV TOW\", \"rmin\": \"0\", \"rmax\": \"2.1\", \"hmin\": \"0\", \"hmax\": \"6600\"}, \"M1134 Stryker ATGM\": {\"name\": \"ATGM M1134 Stryker\", \"rmin\": \"0\", \"rmax\": \"2.1\", \"hmin\": \"0\", \"hmax\": \"6600\"}, \"M1097 Avenger\": {\"name\": \"Avenger M1097\", \"type\": \"SAM\", \"rmin\": \"0.1\", \"rmax\": \"2.7\", \"hmin\": \"0\", \"hmax\": \"11500\"}, \"BMD-1\": {\"name\": \"BMD-1\", \"type\": \"IFV\", \"rmin\": \"0\", \"rmax\": \"1.7\", \"hmin\": \"0\", \"hmax\": \"6600\"}, \"BMP-1\": {\"name\": \"BMP-1\", \"type\": \"IFV\", \"rmin\": \"0\", \"rmax\": \"1.7\", \"hmin\": \"0\", \"hmax\": \"6600\"}, \"BMP-3\": {\"name\": \"BMP-3\", \"type\": \"IFV\", \"rmin\": \"0\", \"rmax\": \"2.2\", \"hmin\": \"0\", \"hmax\": \"6600\"}, \"BTR_D\": {\"name\": \"BTR-RD\", \"type\": \"ARV\", \"rmin\": \"0\", \"rmax\": \"2.2\", \"hmin\": \"0\", \"hmax\": \"6600\"}, \"M48 Chaparral\": {\"name\": \"Chaparral M48\", \"type\": \"SAM\", \"rmin\": \"0.1\", \"rmax\": \"4.6\", \"hmin\": \"0\", \"hmax\": \"9850\"}, \"Hawk ln\": {\"name\": \"Hawk LN M192\", \"type\": \"SAM\", \"rmin\": \"0.8\", \"rmax\": \"11.9\", \"hmin\": \"150\", \"hmax\": \"59100\"}, \"INSURGSAM\": {\"name\": \"Insurgent Manpad\", \"rmin\": \"0.2\", \"rmax\": \"2.5\", \"hmin\": \"0\", \"hmax\": \"11500\"}, \"M6 Linebacker\": {\"name\": \"Linebacker M6\", \"type\": \"SAM\", \"rmin\": \"0.1\", \"rmax\": \"2.7\", \"hmin\": \"0\", \"hmax\": \"11500\"}, \"M-2 Bradley\": {\"name\": \"M2A2 Bradley\", \"type\": \"IFV\", \"rmin\": \"0\", \"rmax\": \"2.1\", \"hmin\": \"0\", \"hmax\": \"6600\"}, \"Patriot ln\": {\"name\": \"Patriot LN M901\", \"type\": \"SAM\", \"rmin\": \"1.6\", \"rmax\": \"16.2\", \"hmin\": \"100\", \"hmax\": \"79550\"}, \"Roland ADS\": {\"name\": \"Roland ADS\", \"type\": \"SAM\", \"rmin\": \"0.2\", \"rmax\": \"4.4\", \"hmin\": \"0\", \"hmax\": \"19700\"}, \"S-300PS 5P85C ln\": {\"name\": \"SA-10 S-300PS LN 5P85C\", \"type\": \"SAM\", \"rmin\": \"2.6\", \"rmax\": \"21.6\", \"hmin\": \"50\", \"hmax\": \"98450\"}, \"S-300PS 5P85D ln\": {\"name\": \"SA-10 S-300PS LN 5P85D\", \"type\": \"SAM\", \"rmin\": \"2.6\", \"rmax\": \"21.6\", \"hmin\": \"50\", \"hmax\": \"98450\"}, \"Strela-10M3\": {\"name\": \"SA-13 Strela-10M3 9A35M3\", \"type\": \"SAM\", \"rmin\": \"0.4\", \"rmax\": \"2.7\", \"hmin\": \"50\", \"hmax\": \"11500\"}, \"Tor 9A331\": {\"name\": \"SA-15 Tor 9A331\", \"type\": \"SAM\", \"rmin\": \"0.8\", \"rmax\": \"6.5\", \"hmin\": \"0\", \"hmax\": \"19700\"}, \"SA-18 Igla manpad\": {\"name\": \"SA-18 Igla MANPADS\", \"type\": \"SAM\", \"rmin\": \"0.2\", \"rmax\": \"2.5\", \"hmin\": \"0\", \"hmax\": \"11500\"}, \"Igla manpad INS\": {\"name\": \"SA-18 Igla MANPADS\", \"type\": \"SAM\", \"rmin\": \"0.2\", \"rmax\": \"2.5\", \"hmin\": \"0\", \"hmax\": \"11500\"}, \"SA-18 Igla-S manpad\": {\"name\": \"SA-18 Igla-S MANPADS\", \"type\": \"SAM\", \"rmin\": \"0.2\", \"rmax\": \"2.5\", \"hmin\": \"0\", \"hmax\": \"11500\"}, \"2S6 Tunguska\": {\"name\": \"SA-19 Tunguska 2S6\", \"type\": \"SAM\", \"rmin\": \"1\", \"rmax\": \"4.4\", \"hmin\": \"0\", \"hmax\": \"11500\"}, \"5p73 s-125 ln\": {\"name\": \"SA-3 S-125 LN 5P73\", \"type\": \"SAM\", \"rmin\": \"1.8\", \"rmax\": \"6\", \"hmin\": \"50\", \"hmax\": \"59100\"}, \"Kub 2P25 ln\": {\"name\": \"SA-6 Kub LN 2P25\", \"type\": \"SAM\", \"rmin\": \"2.1\", \"rmax\": \"13.5\", \"hmin\": \"50\", \"hmax\": \"26250\"}, \"Osa 9A33 ln\": {\"name\": \"SA-8 Osa 9A33\", \"type\": \"SAM\", \"rmin\": \"0.8\", \"rmax\": \"4.6\", \"hmin\": \"50\", \"hmax\": \"16450\"}, \"Strela-1 9P31\": {\"name\": \"SA-9 Strela-1 9P31\", \"type\": \"SAM\", \"rmin\": \"0.4\", \"rmax\": \"2.3\", \"hmin\": \"50\", \"hmax\": \"11500\"}, \"Scud_B\": {\"name\": \"SS-1C Scud-B 9K72 LN 9P117M\", \"type\": \"SRBM\", \"rmin\": \"26.9\", \"rmax\": \"172.8\", \"hmin\": \"0\", \"hmax\": \"164050\"}, \"Soldier stinger\": {\"name\": \"Stinger MANPADS\", \"rmin\": \"0.1\", \"rmax\": \"2.7\", \"hmin\": \"0\", \"hmax\": \"11500\"}, \"T-72B\": {\"name\": \"T-72B\", \"type\": \"MBT\", \"rmin\": \"0\", \"rmax\": \"2.2\", \"hmin\": \"0\", \"hmax\": \"9850\"}, \"T-72B3\": {\"name\": \"T-72B3\", \"type\": \"MBT\", \"rmin\": \"0\", \"rmax\": \"2.2\", \"hmin\": \"0\", \"hmax\": \"9850\"}, \"T-80UD\": {\"name\": \"T-80U\", \"type\": \"MBT\", \"rmin\": \"0\", \"rmax\": \"2.7\", \"hmin\": \"0\", \"hmax\": \"9850\"}, \"T-90\": {\"name\": \"T-90\", \"type\": \"MBT\", \"rmin\": \"0\", \"rmax\": \"2.7\", \"hmin\": \"0\", \"hmax\": \"9850\"}, \"ZBD04A\": {\"name\": \"ZBD-04A\", \"rmin\": \"0\", \"rmax\": \"2.2\", \"hmin\": \"0\", \"hmax\": \"6600\"}, \"ZTZ96B\": {\"name\": \"ZTZ-96B\", \"rmin\": \"0\", \"rmax\": \"2.7\", \"hmin\": \"0\", \"hmax\": \"9850\"}}}','{\"import\": {\"M1045 HMMWV TOW\": {\"type\": \"ATGM\", \"active\": 0}, \"M1134 Stryker ATGM\": {\"short_name\": \"Stryker\", \"active\": 0}, \"M1097 Avenger\": {\"short_name\": \"Avenger\", \"type\": \"SHORAD\", \"cms\": \"FLARE\", \"rmax\": \"3.3\"}, \"M48 Chaparral\": {\"short_name\": \"Chaparral\", \"type\": \"SHORAD\", \"cms\": \"FLARE\"}, \"Hawk ln\": {\"short_name\": \"Hawk\", \"type\": \"MERAD\", \"rwr\": \"HA,HK\", \"cms\": \"CHAFF\", \"rmax\": \"24.3\"}, \"INSURGSAM\": {\"short_name\": \"Manpad\"}, \"M6 Linebacker\": {\"short_name\": \"Linebacker\", \"type\": \"SHORAD\", \"cms\": \"FLARE\", \"rmax\": \"3.3\"}, \"M-2 Bradley\": {\"short_name\": \"Bradley\"}, \"Patriot ln\": {\"short_name\": \"Patriot\", \"type\": \"LORAD\", \"rwr\": \"P,PA\", \"cms\": \"CHAFF\", \"rmax\": \"64.8\"}, \"Roland ADS\": {\"short_name\": \"Roland\", \"type\": \"SHORAD\", \"rwr\": \"RO\", \"cms\": \"CHAFF\"}, \"S-300PS 5P85C ln\": {\"short_name\": \"SA-10\", \"report_name\": \"Grumble\", \"type\": \"LORAD\", \"tracker\": \"OP/RD\", \"rwr\": \"10,BB,CS\", \"rmax\": \"40.5\"}, \"S-300PS 5P85D ln\": {\"short_name\": \"SA-10\", \"report_name\": \"Grumble\", \"tracker\": \"OP/RD\", \"rmax\": \"40.5\", \"active\": 0}, \"Strela-10M3\": {\"short_name\": \"SA-13\", \"report_name\": \"Gopher\", \"type\": \"SHORAD\", \"tracker\": \"IR\", \"rwr\": \"13\", \"cms\": \"FLARE\"}, \"Tor 9A331\": {\"short_name\": \"SA-15\", \"report_name\": \"Tor\", \"type\": \"SHORAD\", \"tracker\": \"RD\", \"rwr\": \"15\", \"cms\": \"CHAFF\"}, \"SA-18 Igla manpad\": {\"short_name\": \"SA-18\", \"report_name\": \"Igla\", \"type\": \"MPD\", \"tracker\": \"IR\", \"active\": 0}, \"Igla manpad INS\": {\"short_name\": \"SA-18\", \"report_name\": \"Igla\", \"type\": \"MPD\", \"tracker\": \"IR\", \"cms\": \"FLARE\"}, \"SA-18 Igla-S manpad\": {\"short_name\": \"SA-18\", \"report_name\": \"Igla\", \"type\": \"MPD\", \"tracker\": \"IR\", \"active\": 0}, \"2S6 Tunguska\": {\"short_name\": \"SA-19\", \"report_name\": \"Tunguska\", \"type\": \"VSHORAD\", \"tracker\": \"OP/RD/LS\", \"rwr\": \"19\"}, \"5p73 s-125 ln\": {\"short_name\": \"SA-3\", \"report_name\": \"Goa\", \"type\": \"MERAD\", \"tracker\": \"RD\", \"cms\": \"CHAFF\", \"rmax\": \"13.5\"}, \"Kub 2P25 ln\": {\"short_name\": \"SA-6\", \"report_name\": \"Kub\", \"type\": \"MERAD\", \"tracker\": \"RD\", \"rwr\": \"6\", \"cms\": \"CHAFF\"}, \"Osa 9A33 ln\": {\"short_name\": \"SA-8\", \"report_name\": \"Osa \", \"type\": \"SHORAD\", \"tracker\": \"RD\", \"rwr\": \"8\", \"cms\": \"CHAFF\", \"rmax\": \"5.6\"}, \"Strela-1 9P31\": {\"short_name\": \"SA-9\", \"report_name\": \"Strela\", \"type\": \"SHORAD\", \"tracker\": \"IR\", \"cms\": \"FLARE\"}, \"Scud_B\": {\"short_name\": \"SS-1C\", \"report_name\": \"Scud\"}, \"Soldier stinger\": {\"type\": \"MPD\", \"cms\": \"FLARE\", \"rmax\": \"3.3\"}, \"ZBD04A\": {\"type\": \"IFV\"}, \"ZTZ96B\": {\"type\": \"MBT\"}}, \"custom\": {\"Flakpanzer Gepard\": {\"name\": \"Flakpanzer Gepard\", \"short_name\": \"Gepard\", \"report_name\": \"\", \"type\": \"AAA\", \"tracker\": \"\", \"rwr\": \"\", \"cms\": \"\", \"rmin\": \"0\", \"rmax\": \"2\", \"hmin\": \"0\", \"hmax\": \"9500\", \"active\": 1}, \"M163 Vulcan\": {\"name\": \"M163 Vulcan\", \"short_name\": \"Vulcan\\t\", \"report_name\": \"\", \"type\": \"AAA\", \"tracker\": \"\", \"rwr\": \"\", \"cms\": \"\", \"rmin\": \"0\", \"rmax\": \"1.4\", \"hmin\": \"0\", \"hmax\": \"4500\", \"active\": 1}, \"Rapier\": {\"name\": \"Rapier\", \"short_name\": \"Rapier\", \"report_name\": \"\", \"type\": \"SHORAD\", \"tracker\": \"\", \"rwr\": \"\", \"cms\": \"CHAFF\", \"rmin\": \"0.2\", \"rmax\": \"3.7\", \"hmin\": \"165\", \"hmax\": \"9850\", \"active\": 1}, \"SA-11 Buk LN 9A310M1\": {\"name\": \"SA-11 Buk LN 9A310M1\", \"short_name\": \"SA-11\", \"report_name\": \"Buk\", \"type\": \"MERAD\", \"tracker\": \"OP/RD\", \"rwr\": \"11,SD\", \"cms\": \"CHAFF\", \"rmin\": \"1.7\", \"rmax\": \"18.9\", \"hmin\": \"0\", \"hmax\": \"72500\", \"active\": 1}, \"SA-2 Guideline\": {\"name\": \"SA-2 Guideline\", \"short_name\": \"SA-2\", \"report_name\": \"Guideline\", \"type\": \"HAADS\", \"tracker\": \"RD\", \"rwr\": \"2\", \"cms\": \"\", \"rmin\": \"3.8\", \"rmax\": \"21.6\", \"hmin\": \"330\", \"hmax\": \"82000\", \"active\": 1}, \"ZPU-1/2/4\": {\"name\": \"ZPU-1/2/4\", \"short_name\": \"\", \"report_name\": \"\", \"type\": \"AAA\", \"tracker\": \"\", \"rwr\": \"\", \"cms\": \"\", \"rmin\": \"0\", \"rmax\": \"0.7\", \"hmin\": \"0\", \"hmax\": \"4500\", \"active\": 1}, \"ZSU-23-4 Shilka\": {\"name\": \"ZSU-23-4 Shilka\", \"short_name\": \"ZSU-23-4\", \"report_name\": \"Shilka\", \"type\": \"AAA\", \"tracker\": \"\", \"rwr\": \"\", \"cms\": \"\", \"rmin\": \"0\", \"rmax\": \"1.3\", \"hmin\": \"0\", \"hmax\": \"6500\", \"active\": 1}, \"ZSU-57-2 Sparka\": {\"name\": \"ZSU-57-2 Sparka\", \"short_name\": \"ZSU-57-2\", \"report_name\": \"Sparka\", \"type\": \"AAA\", \"tracker\": \"\", \"rwr\": \"\", \"cms\": \"\", \"rmin\": \"0\", \"rmax\": \"2\", \"hmin\": \"0\", \"hmax\": \"14000\", \"active\": 1}, \"ZU-23-3 Sergey\": {\"name\": \"ZU-23-3 Sergey\", \"short_name\": \"ZU-23-3\", \"report_name\": \"Sergey\", \"type\": \"AAA\", \"tracker\": \"\", \"rwr\": \"\", \"cms\": \"\", \"rmin\": \"0\", \"rmax\": \"1.3\", \"hmin\": \"0\", \"hmax\": \"6500\", \"active\": 1}, \"MTLB-U\": {\"name\": \"MTLB-U\", \"short_name\": \"\", \"report_name\": \"\", \"type\": \"REC\", \"tracker\": \"OP/GNS\", \"rwr\": \"\", \"cms\": \"\", \"rmin\": \"\", \"rmax\": \"0.8\", \"hmin\": \"\", \"hmax\": \"\", \"active\": 1}}}');
/*!40000 ALTER TABLE `general` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permissions` (
  `idx` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(20) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idx`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'users-view','View user accounts'),(2,'users-create','Create user accounts'),(3,'squadrons-create','Create squadrons'),(4,'theatre-create','Manage Theatres'),(5,'squadron-edit','Edit a Squadron')
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `squadron_callsigns`
--

DROP TABLE IF EXISTS `squadron_callsigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `squadron_callsigns` (
  `idx` bigint(20) NOT NULL AUTO_INCREMENT,
  `squadron_id` bigint(20) NOT NULL,
  `callsigns` longtext,
  PRIMARY KEY (`idx`),
  UNIQUE KEY `squadron_id` (`squadron_id`),
  CONSTRAINT `squadron_callsigns_ibfk_1` FOREIGN KEY (`squadron_id`) REFERENCES `squadrons` (`idx`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `squadron_frequencies`
--

DROP TABLE IF EXISTS `squadron_frequencies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `squadron_frequencies` (
  `idx` bigint(20) NOT NULL AUTO_INCREMENT,
  `squadron_id` bigint(20) NOT NULL,
  `frequencies` longtext,
  PRIMARY KEY (`idx`),
  UNIQUE KEY `squadron_id` (`squadron_id`),
  CONSTRAINT `squadron_frequencies_ibfk_1` FOREIGN KEY (`squadron_id`) REFERENCES `squadrons` (`idx`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `squadron_members`
--

DROP TABLE IF EXISTS `squadron_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `squadron_members` (
  `idx` bigint(20) NOT NULL AUTO_INCREMENT,
  `squadron_id` bigint(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `bort_14` int(11) DEFAULT NULL,
  `bort_18` int(11) DEFAULT NULL,
  `active` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`idx`),
  UNIQUE KEY `squadron_id_name` (`squadron_id`,`name`),
  CONSTRAINT `squadron_members_ibfk_1` FOREIGN KEY (`squadron_id`) REFERENCES `squadrons` (`idx`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `squadron_missions`
--

DROP TABLE IF EXISTS `squadron_missions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `squadron_missions` (
  `idx` bigint(20) NOT NULL AUTO_INCREMENT,
  `squadron_id` bigint(20) NOT NULL,
  `is_default` tinyint(4) NOT NULL DEFAULT '0',
  `theatre_id` bigint(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `base` longtext NOT NULL,
  `overrides` longtext,
  `active` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`idx`),
  UNIQUE KEY `squadron_id` (`squadron_id`,`name`),
  CONSTRAINT `squadron_missions_ibfk_1` FOREIGN KEY (`squadron_id`) REFERENCES `squadrons` (`idx`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;


--
-- Dumping data for table `squadron_missions`
--

LOCK TABLES `squadron_missions` WRITE;
/*!40000 ALTER TABLE `squadron_missions` DISABLE KEYS */;
INSERT INTO `squadron_missions` VALUES (1,1,1,1,'Caucases','',NULL,1),(2,1,0,2,'Nevada','',NULL,1),(3,1,0,3,'Normandy','',NULL,1),(4,1,0,4,'Persian Gulf','',NULL,1),(5,1,0,5,'Syria','',NULL,1),(6,1,0,6,'Mariana Islands','',NULL,1);
/*!40000 ALTER TABLE `squadron_missions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `squadron_perms`
--

DROP TABLE IF EXISTS `squadron_perms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `squadron_perms` (
  `idx` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `squadron_id` bigint(20) NOT NULL,
  PRIMARY KEY (`idx`),
  KEY `user_id` (`user_id`),
  KEY `squadron_id` (`squadron_id`),
  CONSTRAINT `squadron_perms_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`idx`) ON DELETE CASCADE,
  CONSTRAINT `squadron_perms_ibfk_2` FOREIGN KEY (`squadron_id`) REFERENCES `squadrons` (`idx`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `squadron_perms`
--

LOCK TABLES `squadron_perms` WRITE;
/*!40000 ALTER TABLE `squadron_perms` DISABLE KEYS */;
INSERT INTO `squadron_perms` VALUES (1,1,1);
/*!40000 ALTER TABLE `squadron_perms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `squadron_theatres`
--

DROP TABLE IF EXISTS `squadron_theatres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `squadron_theatres` (
  `idx` bigint(20) NOT NULL AUTO_INCREMENT,
  `squadron_id` bigint(20) NOT NULL,
  `theatre_id` bigint(20) NOT NULL,
  `overrides` longtext,
  `last_modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idx`),
  UNIQUE KEY `squadron_id` (`squadron_id`,`theatre_id`),
  CONSTRAINT `squadron_theatres_ibfk_1` FOREIGN KEY (`squadron_id`) REFERENCES `squadrons` (`idx`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `squadrons`
--

DROP TABLE IF EXISTS `squadrons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `squadrons` (
  `idx` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `is_default` tinyint(4) NOT NULL DEFAULT '0',
  `url` varchar(2048) DEFAULT NULL,
  `active` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`idx`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `squadrons`
--

LOCK TABLES `squadrons` WRITE;
/*!40000 ALTER TABLE `squadrons` DISABLE KEYS */;
INSERT INTO `squadrons` VALUES (1,'None',0,NULL,1);
/*!40000 ALTER TABLE `squadrons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `theatres`
--

DROP TABLE IF EXISTS `theatres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `theatres` (
  `idx` bigint(20) NOT NULL AUTO_INCREMENT,
  `theatre` varchar(100) DEFAULT NULL,
  `display_name` varchar(255) DEFAULT NULL,
  `next_airfield_id` bigint(20) NOT NULL DEFAULT '1',
  `data` longtext NOT NULL,
  `overrides` longtext,
  PRIMARY KEY (`idx`),
  UNIQUE KEY `theatre` (`theatre`),
  UNIQUE KEY `display_name` (`display_name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `theatres`
--

LOCK TABLES `theatres` WRITE;
/*!40000 ALTER TABLE `theatres` DISABLE KEYS */;
INSERT INTO `theatres` VALUES (1,'Caucasus','Caucasus',22,'{\"theatre\": \"Caucasus\", \"bullseye\": {\"blue\": {\"name\": \"BULLS\", \"lat\": \"42.186548742601\", \"lon\": \"41.678934289736\"}, \"red\": {\"name\": \"BULLS\", \"lat\": \"45.083307468072\", \"lon\": \"38.987464980787\"}, \"neutral\": {\"name\": \"BULLS\", \"lat\": \"45.129497060329\", \"lon\": \"34.265515188456\"}}, \"airfields\": {\"1\": {\"lat\": \"43.124233340197\", \"lon\": \"40.564175768401\", \"alt\": \"68\", \"dcs_name\": \"Gudauta\"}, \"2\": {\"lat\": \"44.673329604127\", \"lon\": \"37.78622606048\", \"alt\": \"131\", \"dcs_name\": \"Novorossiysk\"}, \"3\": {\"lat\": \"41.603279859649\", \"lon\": \"41.60927548351\", \"alt\": \"32\", \"dcs_name\": \"Batumi\"}, \"4\": {\"lat\": \"43.50998473506\", \"lon\": \"43.624886288019\", \"alt\": \"1410\", \"dcs_name\": \"Nalchik\"}, \"5\": {\"lat\": \"41.674720064437\", \"lon\": \"44.946875226153\", \"alt\": \"1573\", \"dcs_name\": \"Tbilisi-Lochini\"}, \"6\": {\"lat\": \"42.17915393769\", \"lon\": \"42.4956840774\", \"alt\": \"147\", \"dcs_name\": \"Kutaisi\"}, \"7\": {\"lat\": \"42.238728081573\", \"lon\": \"42.061021312856\", \"alt\": \"43\", \"dcs_name\": \"Senaki-Kolkhi\"}, \"8\": {\"lat\": \"41.932105353453\", \"lon\": \"41.876483823101\", \"alt\": \"59\", \"dcs_name\": \"Kobuleti\"}, \"9\": {\"lat\": \"45.087429883845\", \"lon\": \"38.925202300775\", \"alt\": \"98\", \"dcs_name\": \"Krasnodar-Center\"}, \"10\": {\"lat\": \"43.439378434051\", \"lon\": \"39.924231880466\", \"alt\": \"98\", \"dcs_name\": \"Sochi-Adler\"}, \"11\": {\"lat\": \"44.218646823807\", \"lon\": \"43.100679733081\", \"alt\": \"1049\", \"dcs_name\": \"Mineralnye Vody\"}, \"12\": {\"lat\": \"45.013174733772\", \"lon\": \"37.359783477556\", \"alt\": \"141\", \"dcs_name\": \"Anapa-Vityazevo\"}, \"13\": {\"lat\": \"41.641163266787\", \"lon\": \"44.947183065317\", \"alt\": \"1474\", \"dcs_name\": \"Soganlug\"}, \"14\": {\"lat\": \"44.961383022734\", \"lon\": \"37.985886938697\", \"alt\": \"65\", \"dcs_name\": \"Krymsk\"}, \"15\": {\"lat\": \"41.637735936262\", \"lon\": \"45.01909093846\", \"alt\": \"1523\", \"dcs_name\": \"Vaziani\"}, \"16\": {\"lat\": \"43.791303250938\", \"lon\": \"44.620327262102\", \"alt\": \"507\", \"dcs_name\": \"Mozdok\"}, \"17\": {\"lat\": \"45.046099641543\", \"lon\": \"39.203066906325\", \"alt\": \"111\", \"dcs_name\": \"Krasnodar-Pashkovsky\"}, \"18\": {\"lat\": \"44.671440257355\", \"lon\": \"40.021427482236\", \"alt\": \"590\", \"dcs_name\": \"Maykop-Khanskaya\"}, \"19\": {\"lat\": \"42.852741071635\", \"lon\": \"41.142447588488\", \"alt\": \"43\", \"dcs_name\": \"Sukhumi-Babushara\"}, \"20\": {\"lat\": \"43.208500987381\", \"lon\": \"44.588922553543\", \"alt\": \"1719\", \"dcs_name\": \"Beslan\"}, \"21\": {\"lat\": \"44.567674586004\", \"lon\": \"38.004146350528\", \"alt\": \"72\", \"dcs_name\": \"Gelendzhik\"}}}','{\"airfields\": {\"1\": {\"icao\": \"UG23\", \"uhf\": \"259.000\", \"vhf\": \"130.000\"}, \"2\": {\"icao\": \"URKN\", \"uhf\": \"252.000\", \"vhf\": \"123.000\"}, \"3\": {\"icao\": \"UGSB\", \"uhf\": \"260.000\", \"vhf\": \"131.000\", \"tcn\": \"16 X\"}, \"4\": {\"icao\": \"URMN\", \"uhf\": \"265.000\", \"vhf\": \"136.000\"}, \"5\": {\"icao\": \"UGTB\", \"uhf\": \"267.000\", \"vhf\": \"138.000\", \"tcn\": \"25 X\"}, \"6\": {\"icao\": \"UGKO\", \"uhf\": \"263.000\", \"vhf\": \"134.000\", \"tcn\": \"44 X\"}, \"7\": {\"icao\": \"UGKS\", \"uhf\": \"261.000\", \"vhf\": \"132.000\", \"tcn\": \"31 X\"}, \"8\": {\"icao\": \"UG5X\", \"uhf\": \"262.000\", \"vhf\": \"133.000\", \"tcn\": \"67 X\"}, \"9\": {\"icao\": \"URKL\", \"uhf\": \"251.000\", \"vhf\": \"122.000\"}, \"10\": {\"icao\": \"URSS\", \"uhf\": \"256.000\", \"vhf\": \"127.000\"}, \"11\": {\"icao\": \"URMM\", \"uhf\": \"264.000\", \"vhf\": \"135.000\"}, \"12\": {\"display_name\": \"Anapa\", \"icao\": \"URKA\", \"uhf\": \"250.000\", \"vhf\": \"121.000\"}, \"13\": {\"icao\": \"UG24\", \"uhf\": \"268.000\", \"vhf\": \"139.000\"}, \"14\": {\"icao\": \"URKW\", \"uhf\": \"253.000\", \"vhf\": \"124.000\"}, \"15\": {\"icao\": \"UG27\", \"uhf\": \"269.000\", \"vhf\": \"140.000\", \"tcn\": \"22 X\"}, \"16\": {\"icao\": \"XRMF\", \"uhf\": \"266.000\", \"vhf\": \"137.000\"}, \"17\": {\"icao\": \"URKK\", \"uhf\": \"257.000\", \"vhf\": \"128.000\"}, \"18\": {\"display_name\": \"Maykop\", \"icao\": \"URKH\", \"uhf\": \"254.000\", \"vhf\": \"125.000\"}, \"19\": {\"display_name\": \"Sukhumi\", \"icao\": \"UGSS\", \"uhf\": \"258.000\", \"vhf\": \"129.000\"}, \"20\": {\"icao\": \"URMO\", \"uhf\": \"270.000\", \"vhf\": \"141.000\"}, \"21\": {\"icao\": \"URKG\", \"uhf\": \"255.000\", \"vhf\": \"126.000\"}}}'),(2,'Nevada','Nevada',18,'{\"airfields\": {\"1\": {\"lat\": \"36.213364566271\", \"dcs_name\": \"North Las Vegas\", \"alt\": \"2228\", \"lon\": \"-115.18673756618\"}, \"2\": {\"lat\": \"36.868394298081\", \"dcs_name\": \"Beatty Airport\", \"alt\": \"3173\", \"lon\": \"-116.78608313042\"}, \"3\": {\"lat\": \"37.793389585399\", \"dcs_name\": \"Lincoln County\", \"alt\": \"4815\", \"lon\": \"-114.41923699635\"}, \"4\": {\"lat\": \"36.225662015884\", \"dcs_name\": \"Nellis AFB\", \"alt\": \"1841\", \"lon\": \"-115.04380761321\"}, \"5\": {\"lat\": \"35.165905267476\", \"dcs_name\": \"Laughlin Airport\", \"alt\": \"656\", \"lon\": \"-114.55986431857\"}, \"6\": {\"lat\": \"38.374546852088\", \"dcs_name\": \"Mina Airport 3Q0\", \"alt\": \"4562\", \"lon\": \"-118.09349931622\"}, \"7\": {\"lat\": \"37.78403952166\", \"dcs_name\": \"Tonopah Test Range Airfield\", \"alt\": \"5534\", \"lon\": \"-116.77330290767\"}, \"8\": {\"lat\": \"36.584429875554\", \"dcs_name\": \"Creech AFB\", \"alt\": \"3126\", \"lon\": \"-115.68681060569\"}, \"9\": {\"lat\": \"35.96746878808\", \"dcs_name\": \"Henderson Executive Airport\", \"alt\": \"2491\", \"lon\": \"-115.13347108341\"}, \"10\": {\"lat\": \"37.21913894289\", \"dcs_name\": \"Groom Lake AFB\", \"alt\": \"4494\", \"lon\": \"-115.78531067518\"}, \"11\": {\"lat\": \"35.943681644578\", \"dcs_name\": \"Boulder City Airport\", \"alt\": \"2121\", \"lon\": \"-114.86055178579\"}, \"12\": {\"lat\": \"38.058024445654\", \"dcs_name\": \"Tonopah Airport\", \"alt\": \"5394\", \"lon\": \"-117.07591711356\"}, \"13\": {\"lat\": \"36.827345248734\", \"dcs_name\": \"Mesquite\", \"alt\": \"1858\", \"lon\": \"-114.06033514493\"}, \"14\": {\"lat\": \"36.310471394437\", \"dcs_name\": \"Echo Bay\", \"alt\": \"1548\", \"lon\": \"-114.46933764146\"}, \"15\": {\"lat\": \"36.076670073498\", \"dcs_name\": \"McCarran International Airport\", \"alt\": \"2169\", \"lon\": \"-115.16219006293\"}, \"16\": {\"lat\": \"35.773785550964\", \"dcs_name\": \"Jean Airport\", \"alt\": \"2824\", \"lon\": \"-115.32570272555\"}, \"17\": {\"lat\": \"37.094831346541\", \"dcs_name\": \"Pahute Mesa Airstrip\", \"alt\": \"5056\", \"lon\": \"-116.31539962949\"}}, \"next_airfield\": 18, \"bullseye\": {\"blue\": {\"lat\": \"36.128888889518\", \"lon\": \"-114.99999999602\", \"name\": \"BULLS\"}, \"neutral\": {\"lat\": \"39.818116065434\", \"lon\": \"-114.7334122492\", \"name\": \"BULLS\"}, \"red\": {\"lat\": \"37.236111208032\", \"lon\": \"-115.80527775165\", \"name\": \"BULLS\"}}, \"theatre\": \"Nevada\"}','{\"airfields\": {\"1\": {\"uhf\": \"360.750\", \"vhf\": \"125.700\"}, \"7\": {\"uhf\": \"257.950\", \"tcn\": \"77 X\", \"vhf\": \"124.750\", \"display_name\": \"Tonopah Test Range\"}, \"8\": {\"uhf\": \"360.600\", \"tcn\": \"87 X\", \"vhf\": \"118.300\"}, \"9\": {\"uhf\": \"250.100\", \"vhf\": \"125.100\", \"display_name\": \"Henderson Exec Airport\"}, \"10\": {\"uhf\": \"250.050\", \"tcn\": \"18 X\", \"vhf\": \"118.000\"}, \"15\": {\"uhf\": \"257.800\", \"tcn\": \"116 X\", \"vhf\": \"119.900\", \"display_name\": \"McCarran Intl.\"}, \"4\": {\"uhf\": \"327.000\", \"tcn\": \"12 X\", \"vhf\": \"132.500\"}}}'),(3,'Normandy','Normandy',39,'{\"airfields\": {\"1\": {\"lat\": \"49.345151300429\", \"dcs_name\": \"Longues-sur-Mer\", \"alt\": \"225\", \"lon\": \"-0.71158690392176\"}, \"2\": {\"lat\": \"48.753495622427\", \"dcs_name\": \"Goulet\", \"alt\": \"616\", \"lon\": \"-0.10779973229473\"}, \"3\": {\"lat\": \"49.398516941571\", \"dcs_name\": \"Picauville\", \"alt\": \"72\", \"lon\": \"-1.418533835482\"}, \"4\": {\"lat\": \"49.301185444271\", \"dcs_name\": \"Bazenville\", \"alt\": \"199\", \"lon\": \"-0.57147718061433\"}, \"5\": {\"lat\": \"48.478454330287\", \"dcs_name\": \"Barville\", \"alt\": \"462\", \"lon\": \"0.31732564617196\"}, \"6\": {\"lat\": \"49.366981077377\", \"dcs_name\": \"Brucheville\", \"alt\": \"45\", \"lon\": \"-1.2230279213479\"}, \"7\": {\"lat\": \"49.345278583008\", \"dcs_name\": \"Deux Jumeaux\", \"alt\": \"123\", \"lon\": \"-0.97161044424325\"}, \"8\": {\"lat\": \"49.332240012696\", \"dcs_name\": \"Cretteville\", \"alt\": \"95\", \"lon\": \"-1.3723779380226\"}, \"9\": {\"lat\": \"48.668772183898\", \"dcs_name\": \"Vrigny\", \"alt\": \"590\", \"lon\": \"0.002107477445553\"}, \"10\": {\"lat\": \"49.265216714199\", \"dcs_name\": \"Le Molay\", \"alt\": \"104\", \"lon\": \"-0.87589868085048\"}, \"11\": {\"lat\": \"49.369319237096\", \"dcs_name\": \"Cricqueville-en-Bessin\", \"alt\": \"81\", \"lon\": \"-1.0072100114739\"}, \"12\": {\"lat\": \"49.250934748799\", \"dcs_name\": \"Rucqueville\", \"alt\": \"192\", \"lon\": \"-0.5707826008541\"}, \"13\": {\"lat\": \"49.319851511578\", \"dcs_name\": \"Sainte-Croix-sur-Mer\", \"alt\": \"160\", \"lon\": \"-0.50921081860912\"}, \"14\": {\"lat\": \"48.938754402589\", \"dcs_name\": \"Conches\", \"alt\": \"541\", \"lon\": \"0.96813784137685\"}, \"15\": {\"lat\": \"49.300287630575\", \"dcs_name\": \"Sommervieu\", \"alt\": \"186\", \"lon\": \"-0.67900958382261\"}, \"16\": {\"lat\": \"49.36675380539\", \"dcs_name\": \"Sainte-Laurent-sur-Mer\", \"alt\": \"145\", \"lon\": \"-0.8824032643885\"}, \"17\": {\"lat\": \"50.846186787328\", \"dcs_name\": \"Tangmere\", \"alt\": \"47\", \"lon\": \"-0.71335408590138\"}, \"18\": {\"lat\": \"50.782224389189\", \"dcs_name\": \"Needs Oar Point\", \"alt\": \"30\", \"lon\": \"-1.4255767695516\"}, \"19\": {\"lat\": \"50.860868223746\", \"dcs_name\": \"Funtington\", \"alt\": \"164\", \"lon\": \"-0.87725550669251\"}, \"20\": {\"lat\": \"49.020414322366\", \"dcs_name\": \"Evreux\", \"alt\": \"423\", \"lon\": \"1.2119730690799\"}, \"21\": {\"lat\": \"49.171764334807\", \"dcs_name\": \"Carpiquet\", \"alt\": \"187\", \"lon\": \"-0.44799386568305\"}, \"22\": {\"lat\": \"49.440426969218\", \"dcs_name\": \"Biniville\", \"alt\": \"106\", \"lon\": \"-1.4730050181145\"}, \"23\": {\"lat\": \"49.2391148928\", \"dcs_name\": \"Chippelle\", \"alt\": \"124\", \"lon\": \"-0.98038615665025\"}, \"24\": {\"lat\": \"49.34523486575\", \"dcs_name\": \"Cardonville\", \"alt\": \"101\", \"lon\": \"-1.0474283884291\"}, \"25\": {\"lat\": \"49.269369279491\", \"dcs_name\": \"Lantheuil\", \"alt\": \"174\", \"lon\": \"-0.54523999071826\"}, \"26\": {\"lat\": \"48.771226854351\", \"dcs_name\": \"Argentan\", \"alt\": \"639\", \"lon\": \"-0.0361607768347\"}, \"27\": {\"lat\": \"49.479693208885\", \"dcs_name\": \"Azeville\", \"alt\": \"74\", \"lon\": \"-1.3245690115283\"}, \"28\": {\"lat\": \"49.389798010651\", \"dcs_name\": \"Saint Pierre du Mont\", \"alt\": \"103\", \"lon\": \"-0.94718266342205\"}, \"29\": {\"lat\": \"48.521391694994\", \"dcs_name\": \"Essay\", \"alt\": \"507\", \"lon\": \"0.25096382203079\"}, \"30\": {\"lat\": \"50.817854409042\", \"dcs_name\": \"Ford_AF\", \"alt\": \"29\", \"lon\": \"-0.59847895414584\"}, \"31\": {\"lat\": \"49.293694134644\", \"dcs_name\": \"Beny-sur-Mer\", \"alt\": \"199\", \"lon\": \"-0.42630152319567\"}, \"32\": {\"lat\": \"49.204178350976\", \"dcs_name\": \"Lessay\", \"alt\": \"65\", \"lon\": \"-1.4934234355577\"}, \"33\": {\"lat\": \"49.282648343461\", \"dcs_name\": \"Meautis\", \"alt\": \"83\", \"lon\": \"-1.3081396300953\"}, \"34\": {\"lat\": \"50.944852966358\", \"dcs_name\": \"Chailey\", \"alt\": \"134\", \"lon\": \"-0.046775200622604\"}, \"35\": {\"lat\": \"49.417372643629\", \"dcs_name\": \"Beuzeville\", \"alt\": \"114\", \"lon\": \"-1.305002879718\"}, \"36\": {\"lat\": \"49.177205679543\", \"dcs_name\": \"Lignerolles\", \"alt\": \"404\", \"lon\": \"-0.7958757334612\"}, \"37\": {\"lat\": \"48.496112357228\", \"dcs_name\": \"Hauterive\", \"alt\": \"476\", \"lon\": \"0.20367125211349\"}, \"38\": {\"lat\": \"49.64825121601\", \"dcs_name\": \"Maupertus\", \"alt\": \"441\", \"lon\": \"-1.4576721200808\"}}, \"next_airfield\": 39, \"bullseye\": {\"blue\": {\"lat\": \"49.390507498936\", \"lon\": \"-0.95707844058309\", \"name\": \"BULLS\"}, \"neutral\": {\"lat\": \"49.484430535713\", \"lon\": \"-0.30034887075907\", \"name\": \"BULLS\"}, \"red\": {\"lat\": \"49.026213929063\", \"lon\": \"1.210411419662\", \"name\": \"BULLS\"}}, \"theatre\": \"Normandy2\"}','{\"airfields\": {\"1\": {\"uhf\": \"250.400\", \"vhf\": \"118.400\"}, \"2\": {\"uhf\": \"251.250\", \"vhf\": \"119.250\"}, \"3\": {\"uhf\": \"250.300\", \"vhf\": \"118.300\"}, \"4\": {\"uhf\": \"250.550\", \"vhf\": \"118.550\"}, \"5\": {\"uhf\": \"251.300\", \"vhf\": \"119.300\"}, \"6\": {\"uhf\": \"251.650\", \"vhf\": \"119.650\"}, \"7\": {\"uhf\": \"250.100\", \"vhf\": \"118.100\"}, \"8\": {\"uhf\": \"251.500\", \"vhf\": \"119.500\"}, \"9\": {\"uhf\": \"251.450\", \"vhf\": \"119.450\"}, \"10\": {\"uhf\": \"250.350\", \"vhf\": \"118.350\"}, \"11\": {\"uhf\": \"251.750\", \"vhf\": \"119.750\"}, \"12\": {\"uhf\": \"250.700\", \"vhf\": \"118.700\"}, \"13\": {\"uhf\": \"250.600\", \"vhf\": \"118.600\"}, \"14\": {\"uhf\": \"251.550\", \"vhf\": \"119.550\"}, \"15\": {\"uhf\": \"250.750\", \"vhf\": \"118.750\"}, \"16\": {\"uhf\": \"251.850\", \"vhf\": \"119.850\"}, \"17\": {\"uhf\": \"251.100\", \"vhf\": \"119.100\"}, \"18\": {\"uhf\": \"250.950\", \"vhf\": \"118.950\"}, \"19\": {\"uhf\": \"251.000\", \"vhf\": \"119.000\"}, \"20\": {\"uhf\": \"250.850\", \"vhf\": \"118.850\"}, \"21\": {\"uhf\": \"250.450\", \"vhf\": \"118.450\"}, \"22\": {\"uhf\": \"250.000\", \"vhf\": \"118.000\"}, \"23\": {\"uhf\": \"250.150\", \"vhf\": \"118.150\"}, \"24\": {\"uhf\": \"250.050\", \"vhf\": \"118.050\"}, \"25\": {\"uhf\": \"250.800\", \"vhf\": \"118.800\"}, \"26\": {\"uhf\": \"251.200\", \"vhf\": \"119.200\"}, \"27\": {\"uhf\": \"250.250\", \"vhf\": \"118.250\"}, \"28\": {\"uhf\": \"250.500\", \"vhf\": \"118.500\"}, \"29\": {\"uhf\": \"251.350\", \"vhf\": \"119.350\"}, \"30\": {\"uhf\": \"251.150\", \"vhf\": \"119.150\"}, \"31\": {\"uhf\": \"250.650\", \"vhf\": \"118.650\"}, \"32\": {\"uhf\": \"251.800\", \"vhf\": \"119.800\"}, \"33\": {\"uhf\": \"251.700\", \"vhf\": \"119.700\"}, \"34\": {\"uhf\": \"250.900\", \"vhf\": \"118.900\"}, \"35\": {\"uhf\": \"250.200\", \"vhf\": \"118.200\"}, \"36\": {\"uhf\": \"251.050\", \"vhf\": \"119.050\"}, \"37\": {\"uhf\": \"251.400\", \"vhf\": \"119.400\"}, \"38\": {\"uhf\": \"251.600\", \"vhf\": \"119.600\"}}, \"display_name\": \"Normandy\"}'),(4,'PersianGulf','Persian Gulf',30,'{\"theatre\": \"PersianGulf\", \"bullseye\": {\"blue\": {\"name\": \"BULLS\", \"lat\": \"26.17181915761\", \"lon\": \"56.241935354469\"}, \"red\": {\"name\": \"BULLS\", \"lat\": \"26.17181915761\", \"lon\": \"56.241935354469\"}, \"neutral\": {\"name\": \"BULLS\", \"lat\": \"26.17181915761\", \"lon\": \"56.241935354469\"}}, \"airfields\": {\"1\": {\"lat\": \"27.159927526116\", \"lon\": \"56.183089447173\", \"alt\": \"50\", \"dcs_name\": \"Havadarya\"}, \"2\": {\"lat\": \"23.660697450016\", \"lon\": \"53.812497591899\", \"alt\": \"400\", \"dcs_name\": \"Liwa AFB\"}, \"3\": {\"lat\": \"24.434059322946\", \"lon\": \"54.450706215697\", \"alt\": \"11\", \"dcs_name\": \"Al-Bateen\"}, \"4\": {\"lat\": \"30.257695568151\", \"lon\": \"56.958269051762\", \"alt\": \"5746\", \"dcs_name\": \"Kerman\"}, \"5\": {\"lat\": \"26.179806360704\", \"lon\": \"56.24317158197\", \"alt\": \"47\", \"dcs_name\": \"Khasab\"}, \"6\": {\"lat\": \"26.243605485601\", \"lon\": \"55.149352101732\", \"alt\": \"15\", \"dcs_name\": \"Tunb Kochak\"}, \"7\": {\"lat\": \"24.448211362508\", \"lon\": \"54.514696522843\", \"alt\": \"9\", \"dcs_name\": \"Sas Al Nakheel\"}, \"8\": {\"lat\": \"26.815354172873\", \"lon\": \"53.3416042246\", \"alt\": \"75\", \"dcs_name\": \"Lavan Island\"}, \"9\": {\"lat\": \"26.251538702312\", \"lon\": \"55.311280020098\", \"alt\": \"42\", \"dcs_name\": \"Tunb Island AFB\"}, \"10\": {\"lat\": \"25.105735807567\", \"lon\": \"56.340423943738\", \"alt\": \"60\", \"dcs_name\": \"Fujairah Intl\"}, \"11\": {\"lat\": \"24.888624487709\", \"lon\": \"55.174919966811\", \"alt\": \"123\", \"dcs_name\": \"Al Maktoum Intl\"}, \"12\": {\"lat\": \"24.464722760717\", \"lon\": \"54.639226001065\", \"alt\": \"91\", \"dcs_name\": \"Abu Dhabi Intl\"}, \"13\": {\"lat\": \"24.25792911231\", \"lon\": \"54.534202504328\", \"alt\": \"52\", \"dcs_name\": \"Al Dhafra AFB\"}, \"14\": {\"lat\": \"25.875041761239\", \"lon\": \"55.021382072783\", \"alt\": \"16\", \"dcs_name\": \"Abu Musa Island\"}, \"15\": {\"lat\": \"25.248265300858\", \"lon\": \"55.379295777402\", \"alt\": \"16\", \"dcs_name\": \"Dubai Intl\"}, \"16\": {\"lat\": \"26.529651099908\", \"lon\": \"53.964909162786\", \"alt\": \"114\", \"dcs_name\": \"Kish Intl\"}, \"17\": {\"lat\": \"25.602262321804\", \"lon\": \"55.941864730965\", \"alt\": \"70\", \"dcs_name\": \"Ras Al Khaimah Intl\"}, \"18\": {\"lat\": \"27.674804842122\", \"lon\": \"54.368317250382\", \"alt\": \"2635\", \"dcs_name\": \"Lar\"}, \"19\": {\"lat\": \"24.276767283196\", \"lon\": \"55.611735832913\", \"alt\": \"813\", \"dcs_name\": \"Al Ain Intl\"}, \"20\": {\"lat\": \"26.530817420578\", \"lon\": \"54.813116140778\", \"alt\": \"80\", \"dcs_name\": \"Bandar Lengeh\"}, \"21\": {\"lat\": \"27.203638553985\", \"lon\": \"56.3703560378\", \"alt\": \"18\", \"dcs_name\": \"Bandar Abbas Intl\"}, \"22\": {\"lat\": \"25.650484470488\", \"lon\": \"57.792125537415\", \"alt\": \"26\", \"dcs_name\": \"Bandar-e-Jask\"}, \"23\": {\"lat\": \"25.322796067752\", \"lon\": \"55.531388153673\", \"alt\": \"98\", \"dcs_name\": \"Sharjah Intl\"}, \"24\": {\"lat\": \"29.533103964275\", \"lon\": \"52.609894223947\", \"alt\": \"4878\", \"dcs_name\": \"Shiraz Intl\"}, \"25\": {\"lat\": \"25.903343862392\", \"lon\": \"54.548214653399\", \"alt\": \"17\", \"dcs_name\": \"Sirri Island\"}, \"26\": {\"lat\": \"26.76633161238\", \"lon\": \"55.918070160223\", \"alt\": \"26\", \"dcs_name\": \"Qeshm Island\"}, \"27\": {\"lat\": \"25.026805920475\", \"lon\": \"55.383678016973\", \"alt\": \"190\", \"dcs_name\": \"Al Minhad Airbase\"}, \"28\": {\"lat\": \"25.216154518016\", \"lon\": \"54.23693990531\", \"alt\": \"25\", \"dcs_name\": \"Sir Abu Nuayr\"}, \"29\": {\"lat\": \"28.731593220974\", \"lon\": \"57.664118826397\", \"alt\": \"2664\", \"dcs_name\": \"Jiroft\"}}}','{\"display_name\": \"Persian Gulf\", \"airfields\": {\"1\": {\"icao\": \"OIKP\", \"uhf\": \"251.300\", \"vhf\": \"123.150\", \"tcn\": \"47 X\"}, \"2\": {\"icao\": \"OMSM\", \"uhf\": \"250.950\", \"vhf\": \"119.300\", \"tcn\": \"121 X\"}, \"3\": {\"icao\": \"OMAD\", \"uhf\": \"250.600\", \"vhf\": \"119.900\"}, \"4\": {\"icao\": \"OIKK\", \"uhf\": \"250.300\", \"vhf\": \"118.250\", \"tcn\": \"97 X\"}, \"5\": {\"icao\": \"OOKB\", \"uhf\": \"250.000\", \"vhf\": \"124.350\"}, \"6\": {\"icao\": \"OITK\", \"tcn\": \"89 X\"}, \"7\": {\"icao\": \"OMNK\", \"uhf\": \"250.450\", \"vhf\": \"128.900\"}, \"8\": {\"icao\": \"OIBV\", \"uhf\": \"250.750\", \"vhf\": \"128.550\"}, \"9\": {\"icao\": \"OIGI\"}, \"10\": {\"display_name\": \"Fujairah\", \"icao\": \"OMFJ\", \"uhf\": \"251.250\", \"vhf\": \"124.600\"}, \"11\": {\"display_name\": \"Al Maktoum\", \"icao\": \"OMDW\", \"uhf\": \"251.200\", \"vhf\": \"118.600\"}, \"12\": {\"display_name\": \"Abu Dhabi\", \"icao\": \"OMAA\", \"uhf\": \"250.500\", \"vhf\": \"119.200\"}, \"13\": {\"display_name\": \"Al Dhafra\", \"icao\": \"OMAM\", \"uhf\": \"251.100\", \"vhf\": \"126.500\", \"tcn\": \"96 X\"}, \"14\": {\"display_name\": \"Abu Musa\", \"icao\": \"OIBA\", \"uhf\": \"250.400\", \"vhf\": \"122.900\"}, \"15\": {\"icao\": \"OMDB\", \"uhf\": \"251.050\", \"vhf\": \"118.750\"}, \"16\": {\"icao\": \"OIBK\", \"uhf\": \"250.650\", \"vhf\": \"121.650\", \"tcn\": \"112 X\"}, \"17\": {\"display_name\": \"Ras Al Khaimah\", \"icao\": \"OMRK\", \"uhf\": \"250.900\", \"vhf\": \"121.600\"}, \"18\": {\"icao\": \"OISL\", \"uhf\": \"250.050\", \"vhf\": \"127.350\"}, \"19\": {\"display_name\": \"Al Ain\", \"icao\": \"OMAL\", \"uhf\": \"250.700\", \"vhf\": \"119.850\"}, \"20\": {\"icao\": \"OIBL\", \"uhf\": \"251.050\", \"vhf\": \"121.700\"}, \"21\": {\"display_name\": \"Bandar Abbas\", \"icao\": \"OIKB\", \"uhf\": \"251.000\", \"vhf\": \"118.100\", \"tcn\": \"78 X\"}, \"22\": {\"icao\": \"OIZJ\", \"uhf\": \"250.500\", \"vhf\": \"118.150\", \"tcn\": \"110 X\"}, \"23\": {\"icao\": \"OMSJ\", \"uhf\": \"250.200\", \"vhf\": \"118.600\"}, \"24\": {\"icao\": \"OISS\", \"uhf\": \"250.350\", \"vhf\": \"121.900\", \"tcn\": \"94 X\"}, \"25\": {\"icao\": \"OIBS\", \"uhf\": \"250.250\", \"vhf\": \"135.050\"}, \"26\": {\"icao\": \"OIKQ\", \"uhf\": \"250.150\", \"vhf\": \"118.050\"}, \"27\": {\"icao\": \"OMDM\", \"uhf\": \"250.100\", \"vhf\": \"118.550\", \"tcn\": \"99 X\"}, \"28\": {\"icao\": \"OMSN\", \"uhf\": \"250.800\", \"vhf\": \"118.000\"}, \"29\": {\"icao\": \"OIKJ\", \"uhf\": \"250.850\", \"vhf\": \"136.000\"}}}'),(5,'Syria','Syria',34,'{\"theatre\": \"Syria\", \"bullseye\": {\"blue\": {\"name\": \"BULLS\", \"lat\": \"undefined\", \"lon\": \"undefined\"}, \"red\": {\"name\": \"BULLS\", \"lat\": \"undefined\", \"lon\": \"undefined\"}, \"neutral\": {\"name\": \"BULLS\", \"lat\": \"undefined\", \"lon\": \"undefined\"}}, \"airfields\": {\"1\": {\"lat\": \"33.92656597361\", \"lon\": \"36.875344527767\", \"alt\": \"2746\", \"dcs_name\": \"An Nasiriyah\"}, \"2\": {\"lat\": \"32.666055125085\", \"lon\": \"35.165455928792\", \"alt\": \"105\", \"dcs_name\": \"Ramat David\"}, \"3\": {\"lat\": \"36.371269972814\", \"lon\": \"36.298090184913\", \"alt\": \"253\", \"dcs_name\": \"Hatay\"}, \"4\": {\"lat\": \"34.566877297302\", \"lon\": \"36.5854147754\", \"alt\": \"1729\", \"dcs_name\": \"Al Qusayr\"}, \"5\": {\"lat\": \"33.415340013895\", \"lon\": \"36.504254828586\", \"alt\": \"2007\", \"dcs_name\": \"Damascus\"}, \"6\": {\"lat\": \"36.994254008349\", \"lon\": \"35.412713341856\", \"alt\": \"156\", \"dcs_name\": \"Incirlik\"}, \"7\": {\"lat\": \"35.410624768258\", \"lon\": \"35.948026201221\", \"alt\": \"93\", \"dcs_name\": \"Bassel Al-Assad\"}, \"8\": {\"lat\": \"33.458606617206\", \"lon\": \"36.356880859456\", \"alt\": \"2134\", \"dcs_name\": \"Qabr as Sitt\"}, \"9\": {\"lat\": \"33.837430477399\", \"lon\": \"35.487352849176\", \"alt\": \"39\", \"dcs_name\": \"Beirut-Rafic Hariri\"}, \"10\": {\"lat\": \"36.522812217515\", \"lon\": \"37.033622368434\", \"alt\": \"1614\", \"dcs_name\": \"Minakh\"}, \"11\": {\"lat\": \"36.18937442608\", \"lon\": \"37.570439309206\", \"alt\": \"1200\", \"dcs_name\": \"Kuweires\"}, \"12\": {\"lat\": \"35.755613771449\", \"lon\": \"38.551250948344\", \"alt\": \"1083\", \"dcs_name\": \"Tabqa\"}, \"13\": {\"lat\": \"35.731462428174\", \"lon\": \"37.118801734534\", \"alt\": \"820\", \"dcs_name\": \"Abu al-Duhur\"}, \"14\": {\"lat\": \"34.286960508475\", \"lon\": \"35.683990308563\", \"alt\": \"619\", \"dcs_name\": \"Wujah Al Hajar\"}, \"15\": {\"lat\": \"32.597578671655\", \"lon\": \"35.220203497046\", \"alt\": \"180\", \"dcs_name\": \"Megiddo\"}, \"16\": {\"lat\": \"33.604657588596\", \"lon\": \"36.735832630594\", \"alt\": \"2066\", \"dcs_name\": \"Al-Dumayr\"}, \"17\": {\"lat\": \"33.487486619592\", \"lon\": \"36.475164768459\", \"alt\": \"2007\", \"dcs_name\": \"Marj as Sultan South\"}, \"18\": {\"lat\": \"36.094487121629\", \"lon\": \"37.951086106528\", \"alt\": \"1170\", \"dcs_name\": \"Jirah\"}, \"19\": {\"lat\": \"32.815042860613\", \"lon\": \"35.042059783485\", \"alt\": \"19\", \"dcs_name\": \"Haifa\"}, \"20\": {\"lat\": \"33.279510126867\", \"lon\": \"36.446981195041\", \"alt\": \"2160\", \"dcs_name\": \"Marj Ruhayyil\"}, \"21\": {\"lat\": \"35.97322359297\", \"lon\": \"36.785894102848\", \"alt\": \"1020\", \"dcs_name\": \"Taftanaz\"}, \"22\": {\"lat\": \"33.84290182523\", \"lon\": \"35.976931824797\", \"alt\": \"2934\", \"dcs_name\": \"Rayak\"}, \"23\": {\"lat\": \"32.348793954817\", \"lon\": \"36.270213489366\", \"alt\": \"2204\", \"dcs_name\": \"King Hussein Air College\"}, \"24\": {\"lat\": \"33.500470043752\", \"lon\": \"36.466615896347\", \"alt\": \"2007\", \"dcs_name\": \"Marj as Sultan North\"}, \"25\": {\"lat\": \"33.06361028266\", \"lon\": \"36.559784748722\", \"alt\": \"2337\", \"dcs_name\": \"Khalkhalah\"}, \"26\": {\"lat\": \"34.583953310218\", \"lon\": \"35.9986872567\", \"alt\": \"14\", \"dcs_name\": \"Rene Mouawad\"}, \"27\": {\"lat\": \"36.182211524331\", \"lon\": \"37.210383232385\", \"alt\": \"1253\", \"dcs_name\": \"Aleppo\"}, \"28\": {\"lat\": \"32.441791483481\", \"lon\": \"35.001899624572\", \"alt\": \"93\", \"dcs_name\": \"Eyn Shemer\"}, \"29\": {\"lat\": \"33.212372176922\", \"lon\": \"35.592419987157\", \"alt\": \"328\", \"dcs_name\": \"Kiryat Shmona\"}, \"30\": {\"lat\": \"33.482713511778\", \"lon\": \"36.235064059083\", \"alt\": \"2355\", \"dcs_name\": \"Mezzeh\"}, \"31\": {\"lat\": \"36.988281127829\", \"lon\": \"35.291372307265\", \"alt\": \"55\", \"dcs_name\": \"Adana Sakirpasa\"}, \"32\": {\"lat\": \"35.116099484431\", \"lon\": \"36.72547347191\", \"alt\": \"983\", \"dcs_name\": \"Hama\"}, \"33\": {\"lat\": \"34.558235536659\", \"lon\": \"38.331123062337\", \"alt\": \"1267\", \"dcs_name\": \"Palmyra\"}}}','{\"airfields\": {\"1\": {\"icao\": \"OS64\", \"uhf\": \"251.350\", \"vhf\": \"122.300\"}, \"2\": {\"icao\": \"LLRD\", \"uhf\": \"250.950\", \"vhf\": \"118.600\"}, \"3\": {\"icao\": \"LTDA\", \"uhf\": \"250.150\", \"vhf\": \"128.500\"}, \"4\": {\"icao\": \"OS70\", \"uhf\": \"251.250\", \"vhf\": \"119.200\"}, \"5\": {\"icao\": \"OSDI\", \"uhf\": \"251.450\", \"vhf\": \"118.500\"}, \"6\": {\"icao\": \"LTAG\", \"uhf\": \"360.100\", \"vhf\": \"129.400\", \"tcn\": \"21 X\"}, \"7\": {\"icao\": \"OSLK\", \"uhf\": \"250.450\", \"vhf\": \"118.100\"}, \"8\": {\"uhf\": \"250.850\", \"vhf\": \"122.600\"}, \"9\": {\"icao\": \"OLBA\", \"uhf\": \"251.400\", \"vhf\": \"118.900\"}, \"10\": {\"icao\": \"OS71\", \"uhf\": \"250.700\", \"vhf\": \"120.600\"}, \"11\": {\"icao\": \"OS66\", \"uhf\": \"251.000\", \"vhf\": \"120.500\"}, \"12\": {\"icao\": \"OS59\", \"uhf\": \"251.150\", \"vhf\": \"118.500\"}, \"13\": {\"icao\": \"OS57\", \"uhf\": \"250.350\", \"vhf\": \"122.200\"}, \"14\": {\"icao\": \"Z19O\", \"uhf\": \"251.300\", \"vhf\": \"121.500\"}, \"15\": {\"icao\": \"LLMG\", \"uhf\": \"250.600\", \"vhf\": \"119.900\"}, \"16\": {\"icao\": \"OS61\", \"uhf\": \"251.550\", \"vhf\": \"120.300\"}, \"17\": {\"uhf\": \"251.500\", \"vhf\": \"122.900\"}, \"18\": {\"icao\": \"OS62\", \"uhf\": \"250.200\", \"vhf\": \"118.100\"}, \"19\": {\"icao\": \"LLHA\", \"uhf\": \"250.050\", \"vhf\": \"127.800\"}, \"20\": {\"icao\": \"OS63\", \"uhf\": \"250.550\", \"vhf\": \"120.800\"}, \"21\": {\"uhf\": \"251.200\", \"vhf\": \"112.800\"}, \"22\": {\"icao\": \"OLRA\", \"uhf\": \"251.100\", \"vhf\": \"124.400\"}, \"23\": {\"icao\": \"OJMF\", \"uhf\": \"250.300\", \"vhf\": \"118.300\"}, \"24\": {\"uhf\": \"250.500\", \"vhf\": \"122.700\"}, \"25\": {\"icao\": \"OS69\", \"uhf\": \"250.250\", \"vhf\": \"122.500\"}, \"26\": {\"icao\": \"OLKA\", \"uhf\": \"251.100\", \"vhf\": \"119.500\"}, \"27\": {\"icao\": \"OSAP\", \"uhf\": \"250.750\", \"vhf\": \"119.100\"}, \"28\": {\"icao\": \"LLES\", \"uhf\": \"250.000\", \"vhf\": \"123.400\"}, \"29\": {\"icao\": \"LLKS\", \"uhf\": \"250.400\", \"vhf\": \"118.400\"}, \"30\": {\"icao\": \"OS67\", \"uhf\": \"250.650\", \"vhf\": \"120.700\"}, \"31\": {\"icao\": \"LTAF\", \"uhf\": \"250.900\", \"vhf\": \"121.100\"}, \"32\": {\"icao\": \"OS58\", \"uhf\": \"250.100\", \"vhf\": \"118.050\"}, \"33\": {\"icao\": \"OSPR\", \"uhf\": \"250.800\", \"vhf\": \"121.900\"}}}'),(6,'MarianaIslands','Mariana Islands',1,'{\"theatre\": \"MarianaIslands\", \"bullseye\": {\"blue\": {\"name\": \"BULLS\", \"lat\": \"13.484999825814\", \"lon\": \"144.79754148238\"}, \"red\": {\"name\": \"BULLS\", \"lat\": \"13.484999825814\", \"lon\": \"144.79754148238\"}, \"neutral\": {\"name\": \"BULLS\", \"lat\": \"13.484999825814\", \"lon\": \"144.79754148238\"}}, \"airfields\": {\"1\": {\"lat\": \"13.57604707035\", \"lon\": \"144.91745889539\", \"alt\": \"545\", \"dcs_name\": \"Andersen AFB\"}, \"2\": {\"lat\": \"13.479569370694\", \"lon\": \"144.78477470703\", \"alt\": \"255\", \"dcs_name\": \"Antonio B. Won Pat Intl\"}, \"3\": {\"lat\": \"13.436469450733\", \"lon\": \"144.6413730227\", \"alt\": \"93\", \"dcs_name\": \"Olf Orote\"}, \"4\": {\"lat\": \"14.174905098823\", \"lon\": \"145.23248560973\", \"alt\": \"568\", \"dcs_name\": \"Rota Intl\"}, \"5\": {\"lat\": \"15.115121634075\", \"lon\": \"145.71879827825\", \"alt\": \"213\", \"dcs_name\": \"Saipan Intl\"}, \"6\": {\"lat\": \"14.997429376954\", \"lon\": \"145.60830605924\", \"alt\": \"240\", \"dcs_name\": \"Tinian Intl\"}}}','{\"display_name\": \"Mariana Islands\", \"airfields\": {\"1\": {\"icao\": \"PGUA\", \"uhf\": \"250.100\", \"vhf\": \"126.200\", \"tcn\": \"54 X\"}, \"2\": {\"icao\": \"PGUM\", \"uhf\": \"340.200\", \"vhf\": \"118.100\"}, \"3\": {\"display_name\": \"Olf Orote (Abandoned)\"}, \"4\": {\"icao\": \"PGRO\", \"uhf\": \"250.000\", \"vhf\": \"123.600\"}, \"5\": {\"icao\": \"PGSN\", \"uhf\": \"256.900\", \"vhf\": \"125.700\"}, \"6\": {\"icao\": \"PGWT\", \"uhf\": \"250.050\", \"vhf\": \"123.650\"}}}');
/*!40000 ALTER TABLE `theatres` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_permissions`
--

DROP TABLE IF EXISTS `user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_permissions` (
  `idx` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `permission_id` bigint(20) NOT NULL,
  `restricts` bigint(20) NOT NULL DEFAULT '0',
  PRIMARY KEY (`idx`),
  UNIQUE KEY `user_perms` (`user_id`,`permission_id`,`restricts`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `user_permissions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`idx`),
  CONSTRAINT `user_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`idx`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_permissions`
--

LOCK TABLES `user_permissions` WRITE;
/*!40000 ALTER TABLE `user_permissions` DISABLE KEYS */;
INSERT INTO `user_permissions` VALUES (1,1,1,0),(2,1,2,0),(3,1,3,0),(4,1,4,0),(5,1,5,0);
/*!40000 ALTER TABLE `user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `idx` bigint(20) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `salt` char(32) DEFAULT NULL,
  `iter` bigint(20) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `password_last_set` datetime DEFAULT NULL,
  `password_reset` tinyint(4) NOT NULL DEFAULT '0',
  `active` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`idx`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','7e2044ab1197c697d7693d79b6dbabe9',1000,'a7dbf31d2264c8753c56fce28cdaf9596f43f9b5448446e9e4db6c29b493095b','2021-08-13 16:01:23',1,1);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-08-13  3:09:03
