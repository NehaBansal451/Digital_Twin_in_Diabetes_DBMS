const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    // 1) Patient + latest doctor (safe join)
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
      LEFT JOIN (
        SELECT * FROM APPOINTMENT 
        WHERE patient_id = ? 
        ORDER BY appointment_date DESC 
        LIMIT 1
      ) a ON p.patient_id = a.patient_id
      LEFT JOIN DOCTOR d ON a.doctor_id = d.doctor_id
      WHERE p.patient_id = ?
    `, [id, id]);

    if (!rows.length) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // 2) Latest insulin
    const [insulinRows] = await db.query(`
      SELECT * FROM INSULIN 
      WHERE patient_id = ? 
      ORDER BY recorded_at DESC 
      LIMIT 1
    `, [id]);

    // 3) Glucose history
    const [glucoseRows] = await db.query(`
      SELECT record_id, glucose_level, recorded_at
      FROM GLUCOSE
      WHERE patient_id = ?
      ORDER BY recorded_at DESC
    `, [id]);

    // 4) Average glucose (for report + ML consistency)
    const avgGlucose =
      glucoseRows.length > 0
        ? glucoseRows.reduce((sum, g) => sum + g.glucose_level, 0) / glucoseRows.length
        : 0;

    // 5) Final response (clean structure)
    res.json({
      ...rows[0],

      insulin: insulinRows.length > 0
        ? {
            units: insulinRows[0].units || insulinRows[0].dose || 0,
            recorded_at: insulinRows[0].recorded_at
          }
        : null,

      glucose: glucoseRows,
      avg_glucose: Number(avgGlucose.toFixed(2))
    });

  } catch (err) {
    console.error("FULL PATIENT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;