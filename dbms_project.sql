USE digital_twin_diabetes;

-- IMPORTANT (fix safe mode error)
SET SQL_SAFE_UPDATES = 0;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS APPOINTMENT;
DROP TABLE IF EXISTS INSULIN_DOSAGE;
DROP TABLE IF EXISTS GLUCOSE_RECORD;
DROP TABLE IF EXISTS ALERT_LOG;
DROP TABLE IF EXISTS PATIENT;
DROP TABLE IF EXISTS DOCTOR;
SET FOREIGN_KEY_CHECKS = 1;

-- =========================
-- TABLES
-- =========================

CREATE TABLE PATIENT (
    patient_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    age INT CHECK (age > 0),
    gender ENUM('Male', 'Female', 'Other'),
    diabetes_type ENUM('Type1', 'Type2', 'Gestational')
);

CREATE TABLE DOCTOR (
    doctor_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100)
);

CREATE TABLE GLUCOSE_RECORD (
    record_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT,
    glucose_level FLOAT NOT NULL CHECK (glucose_level > 0),
    recorded_at DATETIME DEFAULT NOW(),
    FOREIGN KEY (patient_id) REFERENCES PATIENT(patient_id) ON DELETE CASCADE
);

CREATE TABLE INSULIN_DOSAGE (
    dosage_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT,
    units FLOAT NOT NULL CHECK (units > 0),
    administered_at DATETIME DEFAULT NOW(),
    FOREIGN KEY (patient_id) REFERENCES PATIENT(patient_id) ON DELETE CASCADE
);

CREATE TABLE APPOINTMENT (
    appointment_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT,
    doctor_id INT,
    appointment_date DATE,
    status ENUM('Scheduled', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
    FOREIGN KEY (patient_id) REFERENCES PATIENT(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES DOCTOR(doctor_id)
);

CREATE TABLE ALERT_LOG (
    alert_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT,
    message VARCHAR(255),
    created_at DATETIME DEFAULT NOW(),
    FOREIGN KEY (patient_id) REFERENCES PATIENT(patient_id) ON DELETE CASCADE
);

-- =========================
-- TRIGGER
-- =========================

DELIMITER //
CREATE TRIGGER glucose_alert
AFTER INSERT ON GLUCOSE_RECORD
FOR EACH ROW
BEGIN
    IF NEW.glucose_level > 300 THEN
        INSERT INTO ALERT_LOG(patient_id, message, created_at)
        VALUES (NEW.patient_id, 'CRITICAL: Glucose level exceeded 300!', NOW());
    END IF;
END;//
DELIMITER ;

-- =========================
-- STORED PROCEDURE
-- =========================

DROP PROCEDURE IF EXISTS GetPatientHistory;
DELIMITER //
CREATE PROCEDURE GetPatientHistory(IN p_id INT)
BEGIN
    SELECT 
        g.recorded_at, 
        g.glucose_level, 
        i.units,
        i.administered_at
    FROM GLUCOSE_RECORD g
    LEFT JOIN INSULIN_DOSAGE i 
        ON g.patient_id = i.patient_id 
        AND DATE(g.recorded_at) = DATE(i.administered_at)
    WHERE g.patient_id = p_id
    ORDER BY g.recorded_at DESC;
END;//
DELIMITER ;

-- =========================
-- INSERT DATA
-- =========================

INSERT INTO DOCTOR (name, specialization) VALUES
('Dr. Priya Sharma', 'Endocrinologist'),
('Dr. Rohan Mehta', 'Diabetologist'),
('Dr. Anita Kapoor', 'General Physician'),
('Dr. Vikram Singh', 'Nutritionist'),
('Dr. Sunita Rao', 'Cardiologist');

INSERT INTO PATIENT (name, age, gender, diabetes_type) VALUES
('Amit Verma', 45, 'Male', 'Type2'),
('Neha Gupta', 32, 'Female', 'Type1'),
('Rajan Patel', 58, 'Male', 'Type2'),
('Simran Kaur', 27, 'Female', 'Gestational'),
('Deepak Joshi', 63, 'Male', 'Type2');

INSERT INTO GLUCOSE_RECORD VALUES
(1,1,145,'2025-03-01 08:00:00'),
(2,1,189.5,'2025-03-05 08:30:00'),
(3,1,310,'2025-03-20 09:00:00'),
(4,2,95,'2025-03-01 07:30:00'),
(5,2,110.2,'2025-03-05 08:00:00'),
(6,2,98.7,'2025-03-20 07:45:00'),
(7,3,230,'2025-03-02 08:00:00'),
(8,3,320,'2025-03-12 09:00:00'),
(9,3,305,'2025-03-22 08:15:00');
INSERT INTO APPOINTMENT (patient_id, doctor_id, appointment_date, status)
VALUES 
(1,1,'2025-04-01','Completed'),
(2,2,'2025-04-02','Scheduled'),
(3,3,'2025-04-03','Completed');

INSERT INTO INSULIN_DOSAGE (patient_id, units, administered_at)
VALUES
(1,12,'2025-04-01 08:00:00'),
(1,10,'2025-04-02 08:00:00'),
(2,8,'2025-04-01 09:00:00');
INSERT INTO DOCTOR (name, specialization)
VALUES ('Dr Sharma', 'Type1'),
('Dr Mehta', 'Type2'),
('Dr. Kaur','Gestational');
ALTER TABLE APPOINTMENT 
MODIFY appointment_date DATETIME;
INSERT INTO APPOINTMENT (patient_id, doctor_id, appointment_date)
VALUES (8, 1, NOW());

-- =========================
-- UPDATE & DELETE
-- =========================

UPDATE PATIENT 
SET age = 46 
WHERE patient_id = 1;

DELETE FROM APPOINTMENT 
WHERE status = 'Cancelled';

-- =========================
-- TRANSACTION
-- =========================

START TRANSACTION;

UPDATE PATIENT 
SET age = 50 
WHERE patient_id = 2;

ROLLBACK;
-- COMMIT;

-- =========================
-- QUERIES
-- =========================

SELECT p.name, ROUND(AVG(g.glucose_level),2) AS avg_glucose
FROM PATIENT p
JOIN GLUCOSE_RECORD g ON p.patient_id = g.patient_id
GROUP BY p.name
HAVING AVG(g.glucose_level) > 200;

SELECT p.name, SUM(i.units) AS total_insulin
FROM PATIENT p
JOIN INSULIN_DOSAGE i ON p.patient_id = i.patient_id
GROUP BY p.name;

-- =========================
-- VIEW
-- =========================

CREATE VIEW HighRiskPatients AS
SELECT p.patient_id, p.name, p.diabetes_type,
       ROUND(AVG(g.glucose_level),2) AS avg_glucose
FROM PATIENT p
JOIN GLUCOSE_RECORD g ON p.patient_id = g.patient_id
GROUP BY p.patient_id
HAVING AVG(g.glucose_level) > 200;

-- =========================
-- CURSOR
-- =========================

DELIMITER //
CREATE PROCEDURE ShowAllPatientAvgGlucose()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_name VARCHAR(100);
    DECLARE v_avg FLOAT;

    DECLARE cur CURSOR FOR
        SELECT p.name, AVG(g.glucose_level)
        FROM PATIENT p
        JOIN GLUCOSE_RECORD g ON p.patient_id = g.patient_id
        GROUP BY p.name;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO v_name, v_avg;
        IF done THEN
            LEAVE read_loop;
        END IF;

        SELECT v_name, ROUND(v_avg,2);
    END LOOP;

    CLOSE cur;
END;//
DELIMITER ;

-- =========================
-- EXECUTION
-- =========================

CALL ShowAllPatientAvgGlucose();
CALL GetPatientHistory(1);
DELIMITER //
CREATE FUNCTION GetRiskLevel(avg_glucose FLOAT)
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
  DECLARE risk VARCHAR(20);
  IF avg_glucose > 250 THEN
    SET risk = 'Critical';
  ELSEIF avg_glucose > 180 THEN
    SET risk = 'High';
  ELSEIF avg_glucose < 70 THEN
    SET risk = 'Low';
  ELSE
    SET risk = 'Normal';
  END IF;
  RETURN risk;
END;//
DELIMITER ;
DROP PROCEDURE IF EXISTS GetPatientHistory;
DELIMITER //
CREATE PROCEDURE GetPatientHistory(IN p_id INT)
BEGIN
  -- Exception handler (required by synopsis)
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SELECT 'Error occurred in GetPatientHistory' AS error_message;
  END;

  SELECT 
    g.recorded_at, 
    g.glucose_level, 
    i.units,
    i.administered_at
  FROM GLUCOSE_RECORD g
  LEFT JOIN INSULIN_DOSAGE i 
    ON g.patient_id = i.patient_id 
    AND DATE(g.recorded_at) = DATE(i.administered_at)
  WHERE g.patient_id = p_id
  ORDER BY g.recorded_at DESC;
END;//
DELIMITER ;
DROP PROCEDURE IF EXISTS GetPatientRiskSummary;
DELIMITER //
CREATE PROCEDURE GetPatientRiskSummary(IN p_id INT)
BEGIN
  DECLARE v_avg FLOAT;
  DECLARE v_risk VARCHAR(20);

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    SELECT 'Error in GetPatientRiskSummary' AS error_message;
  END;

  SELECT AVG(glucose_level) INTO v_avg
  FROM GLUCOSE_RECORD
  WHERE patient_id = p_id;

  -- Calling the FUNCTION from inside a procedure
  SET v_risk = GetRiskLevel(v_avg);

  SELECT p_id AS patient_id, ROUND(v_avg, 2) AS avg_glucose, v_risk AS risk_level;
END;//
DELIMITER ;
-- Transaction 1: With ROLLBACK (already have this)
START TRANSACTION;
UPDATE PATIENT SET age = 50 WHERE patient_id = 2;
ROLLBACK;

-- Transaction 2: With SAVEPOINT and COMMIT (add this)
START TRANSACTION;
INSERT INTO GLUCOSE_RECORD (patient_id, glucose_level) VALUES (1, 140);
SAVEPOINT sp1;
INSERT INTO GLUCOSE_RECORD (patient_id, glucose_level) VALUES (2, 110);
SAVEPOINT sp2;
-- Undo only the second insert
ROLLBACK TO sp2;
-- Keep first insert
COMMIT;
-- ALTER (required DDL command from synopsis)
ALTER TABLE PATIENT ADD COLUMN blood_group VARCHAR(5) DEFAULT NULL;
ALTER TABLE PATIENT DROP COLUMN blood_group;
-- Subquery: patients who ever had critical glucose
SELECT name FROM PATIENT 
WHERE patient_id IN (
  SELECT patient_id FROM GLUCOSE_RECORD WHERE glucose_level > 250
);

-- Subquery with aggregate: patients above average glucose
SELECT name, age FROM PATIENT
WHERE patient_id IN (
  SELECT patient_id FROM GLUCOSE_RECORD
  GROUP BY patient_id
  HAVING AVG(glucose_level) > (
    SELECT AVG(glucose_level) FROM GLUCOSE_RECORD
  )
);
DELIMITER //
CREATE TRIGGER log_insulin_overdose
AFTER INSERT ON INSULIN_DOSAGE
FOR EACH ROW
BEGIN
  IF NEW.units > 20 THEN
    INSERT INTO ALERT_LOG(patient_id, message, created_at)
    VALUES (NEW.patient_id, 'WARNING: High insulin dose recorded!', NOW());
  END IF;
END;//
DELIMITER ;
-- =========================
-- TRANSACTIONS (ACID)
-- =========================

-- TRANSACTION 1: ROLLBACK demo
-- Scenario: Wrong age entered — undo it
START TRANSACTION;
UPDATE PATIENT SET age = 999 WHERE patient_id = 1;   -- mistake
SELECT age FROM PATIENT WHERE patient_id = 1;         -- shows 999
ROLLBACK;                                             -- undo
SELECT age FROM PATIENT WHERE patient_id = 1;         -- back to original ✅

-- TRANSACTION 2: SAVEPOINT + partial ROLLBACK + COMMIT
-- Scenario: Add two glucose readings, undo only the second one
START TRANSACTION;

INSERT INTO GLUCOSE_RECORD (patient_id, glucose_level) 
VALUES (1, 140);          -- first reading
SAVEPOINT sp1;            -- save here

INSERT INTO GLUCOSE_RECORD (patient_id, glucose_level) 
VALUES (1, 999);          -- second reading (wrong value)
SAVEPOINT sp2;

ROLLBACK TO sp1;          -- undo second reading only, keep first ✅
COMMIT;                   -- permanently save first reading

-- TRANSACTION 3: COMMIT demo
-- Scenario: Doctor appointment successfully scheduled
START TRANSACTION;

INSERT INTO APPOINTMENT (patient_id, doctor_id, appointment_date, status)
VALUES (4, 2, '2025-05-01', 'Scheduled');

UPDATE PATIENT SET age = 28 WHERE patient_id = 4;

COMMIT;                   -- both changes saved permanently ✅

-- ACID PROPERTIES DEMONSTRATED:
-- Atomicity  → Transaction 1: both UPDATE + SELECT treated as one unit
-- Consistency → Constraints (CHECK age>0) prevent invalid data
-- Isolation   → Each transaction sees only committed data
-- Durability  → After COMMIT, data survives even if server crashes
-- =========================
-- PROCEDURES (logic moved from JS into DB)
-- =========================

-- Procedure 1: Add patient + auto assign doctor + create appointment
-- (This replaces the logic currently in patients.js)
DROP PROCEDURE IF EXISTS AddPatientWithDoctor;
DELIMITER //
CREATE PROCEDURE AddPatientWithDoctor(
  IN p_name        VARCHAR(100),
  IN p_age         INT,
  IN p_gender      ENUM('Male','Female','Other'),
  IN p_dtype       ENUM('Type1','Type2','Gestational')
)
BEGIN
  DECLARE v_patient_id  INT;
  DECLARE v_doctor_id   INT DEFAULT NULL;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SELECT 'Error: Patient not added' AS result;
  END;

  START TRANSACTION;

  -- Step 1: Insert patient
  INSERT INTO PATIENT (name, age, gender, diabetes_type)
  VALUES (p_name, p_age, p_gender, p_dtype);
  SET v_patient_id = LAST_INSERT_ID();

  -- Step 2: Auto-assign doctor by specialization
  SELECT doctor_id INTO v_doctor_id
  FROM DOCTOR
  WHERE specialization = p_dtype
  LIMIT 1;

  -- Step 3: Fallback to any doctor
  IF v_doctor_id IS NULL THEN
    SELECT doctor_id INTO v_doctor_id
    FROM DOCTOR LIMIT 1;
  END IF;

  -- Step 4: Create appointment
  IF v_doctor_id IS NOT NULL THEN
    INSERT INTO APPOINTMENT (patient_id, doctor_id, appointment_date, status)
    VALUES (v_patient_id, v_doctor_id, NOW(), 'Scheduled');
  END IF;

  COMMIT;
  SELECT v_patient_id AS new_patient_id, v_doctor_id AS assigned_doctor_id;
END;//
DELIMITER ;

-- Procedure 2: Log glucose + auto trigger handles alert
-- (Trigger fires automatically — logic fully inside DB)
DROP PROCEDURE IF EXISTS LogGlucoseReading;
DELIMITER //
CREATE PROCEDURE LogGlucoseReading(
  IN p_patient_id    INT,
  IN p_glucose_level FLOAT
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SELECT 'Error: Glucose not logged' AS result;
  END;

  START TRANSACTION;

  INSERT INTO GLUCOSE_RECORD (patient_id, glucose_level)
  VALUES (p_patient_id, p_glucose_level);
  -- glucose_alert TRIGGER fires automatically here if level > 300

  COMMIT;
  SELECT 'Glucose logged successfully' AS result;
END;//
DELIMITER ;

-- Function: Calculate risk from glucose (logic moved from ai.js into DB)
DROP FUNCTION IF EXISTS GetRiskLevel;
DELIMITER //
CREATE FUNCTION GetRiskLevel(avg_glucose FLOAT)
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
  DECLARE risk VARCHAR(20);
  IF avg_glucose > 250 THEN
    SET risk = 'Critical';
  ELSEIF avg_glucose > 180 THEN
    SET risk = 'High';
  ELSEIF avg_glucose < 70 THEN
    SET risk = 'Low';
  ELSE
    SET risk = 'Normal';
  END IF;
  RETURN risk;
END;//
DELIMITER ;

-- Test all three:
CALL AddPatientWithDoctor('Test Patient', 35, 'Male', 'Type2');
CALL LogGlucoseReading(1, 320);   -- should trigger alert automatically
SELECT name, GetRiskLevel(250) AS risk FROM PATIENT WHERE patient_id = 1;