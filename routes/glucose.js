 const express = require('express');
const router  = express.Router();

const db = require('../db');
// ── POST /api/glucose ─────────────────────────────────────
// Log a new glucose reading for a patient
router.post('/', async (req, res) => {
  try {
    const { patient_id, glucose_level } = req.body;

    if (!patient_id || !glucose_level) {
      return res.status(400).json({ error: 'patient_id and glucose_level are required' });
    }

    await db.query(
      'INSERT INTO GLUCOSE_RECORD (patient_id, glucose_level) VALUES (?, ?)',
      [patient_id, glucose_level]
    );

    // Check if alert was triggered
    const alertMsg = glucose_level > 300
      ? '⚠️ CRITICAL: Glucose exceeded 300! Alert logged.'
      : '✅ Glucose reading saved successfully.';

    res.json({ message: alertMsg });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/glucose/alerts/all ───────────────────────────
// Get all critical alerts from ALERT_LOG
router.get('/alerts/all', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.alert_id, p.name AS patient_name, a.message, a.created_at
       FROM ALERT_LOG a
       JOIN PATIENT p ON a.patient_id = p.patient_id
       ORDER BY a.created_at DESC`
    );

    res.json(rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/glucose/:patient_id ──────────────────────────
// Get all glucose records for a patient
router.get('/:patient_id', async (req, res) => {
  try {
    const { patient_id } = req.params;

    const [rows] = await db.query(
      'SELECT record_id, glucose_level, recorded_at FROM GLUCOSE_RECORD WHERE patient_id = ? ORDER BY recorded_at DESC',
      [patient_id]
    );

    res.json(rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/glucose/:patient_id/avg ──────────────────────
// Get average glucose for a patient
router.get('/:patient_id/avg', async (req, res) => {
  try {
    const { patient_id } = req.params;

    const [rows] = await db.query(
      'SELECT ROUND(AVG(glucose_level), 2) AS avg_glucose, MAX(glucose_level) AS max_glucose, MIN(glucose_level) AS min_glucose FROM GLUCOSE_RECORD WHERE patient_id = ?',
      [patient_id]
    );

    res.json(rows[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;