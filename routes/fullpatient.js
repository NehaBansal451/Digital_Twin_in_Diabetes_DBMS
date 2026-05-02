const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    // 1) Patient + doctor
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

    if (!rows.length) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // 2) Latest insulin (may be empty)
    const [insulinRows] = await db.query(
      `SELECT * FROM INSULIN 
       WHERE patient_id = ? 
       ORDER BY recorded_at DESC 
       LIMIT 1`,
      [id]
    );

    // 3) Glucose history (for report table)
    const [glucoseRows] = await db.query(
      `SELECT record_id, glucose_level, recorded_at
       FROM GLUCOSE
       WHERE patient_id = ?
       ORDER BY recorded_at DESC`,
      [id]
    );

    res.json({
      ...rows[0],
      insulin: insulinRows[0] || null,   // ✅ always present (or null)
      glucose: glucoseRows || []         // ✅ always array
    });

  } catch (err) {
    console.error("FULL PATIENT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;