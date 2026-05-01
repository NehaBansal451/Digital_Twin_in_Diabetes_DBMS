const db = require('../db');
const express = require('express');
const router = express.Router();


console.log("🔥 FULL PATIENT ROUTE LOADED");

// TEST
router.get('/test', (req, res) => {
    console.log("✅ TEST ROUTE INSIDE FILE HIT");
  res.send("FULL PATIENT ROUTE WORKING");
});

// MAIN ROUTE
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    console.log("👉 Fetching patient ID:", id);

    const [rows] = await db.query(`
      SELECT 
        p.patient_id,
        p.name,
        p.age,
        p.gender,
        p.diabetes_type,
        d.name AS doctor_name,
        d.specialization,
        a.appointment_date
      FROM PATIENT p
      LEFT JOIN APPOINTMENT a ON p.patient_id = a.patient_id
      LEFT JOIN DOCTOR d ON a.doctor_id = d.doctor_id
      WHERE p.patient_id = ?
      ORDER BY a.appointment_date DESC
  LIMIT 1
    `, [id]);

    console.log("👉 RESULT:", rows);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error("❌ FULL PATIENT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;