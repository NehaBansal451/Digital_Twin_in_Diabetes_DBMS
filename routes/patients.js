const express = require('express');
const router = express.Router();
const db = require('../db');

// 🔥 GET ALL PATIENTS
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM PATIENT");
    res.json(rows);
  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🔥 ADD PATIENT
router.post('/', async (req, res) => {
  try {
    const { name, age, gender, diabetes_type, doctor_id } = req.body;

    const [result] = await db.query(
      "INSERT INTO PATIENT (name, age, gender, diabetes_type) VALUES (?, ?, ?, ?)",
      [name, age, gender, diabetes_type]
    );

    const patientId = result.insertId;
    let selectedDoctor = doctor_id;

    if(!selectedDoctor){
      const [doc] = await db.query(`
        SELECT doctor_id FROM DOCTOR
        WHERE specialization = ?
        LIMIT 1
      `, [diabetes_type]);

      if(doc.length > 0){
        selectedDoctor = doc[0].doctor_id;
      } else {
        const [anyDoc] = await db.query("SELECT doctor_id FROM DOCTOR LIMIT 1");
        if(anyDoc.length > 0){
          selectedDoctor = anyDoc[0].doctor_id;
        }
      }
    }

    if(selectedDoctor){
      await db.query(`
        INSERT INTO APPOINTMENT (patient_id, doctor_id, appointment_date)
        VALUES (?, ?, NOW())
      `, [patientId, selectedDoctor]);
    }

    res.json({ message: "✅ Patient added + doctor assigned + appointment created" });

  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ NEW: GET PATIENT HISTORY — calls stored procedure GetPatientHistory
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;

    // Calling the stored procedure
    const [rows] = await db.query('CALL GetPatientHistory(?)', [id]);

    // MySQL returns CALL results inside rows[0]
    res.json(rows[0]);

  } catch (err) {
    console.error("❌ History error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ NEW: GET PATIENT RISK — calls procedure that uses GetRiskLevel() function
router.get('/:id/risk', async (req, res) => {
  try {
    const { id } = req.params;

    // Calling the procedure which internally uses the SQL FUNCTION
    const [rows] = await db.query('CALL GetPatientRiskSummary(?)', [id]);

    res.json(rows[0][0]);

  } catch (err) {
    console.error("❌ Risk error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;