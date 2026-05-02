const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const [rows] = await db.query(`
      SELECT glucose_level, recorded_at
      FROM GLUCOSE
      WHERE patient_id = ?
      ORDER BY recorded_at DESC
    `, [id]);

    if (!rows.length) {
      return res.json({ message: "No glucose data" });
    }

    const values = rows.map(r => r.glucose_level);

    const avg = Math.round(
      values.reduce((a, b) => a + b, 0) / values.length
    );

    let trend = "Stable";
    if (values.length > 1) {
      if (values[0] > values[values.length - 1]) trend = "Increasing";
      else if (values[0] < values[values.length - 1]) trend = "Decreasing";
    }

    let risk = "Low";
    if (avg > 200) risk = "High";
    else if (avg > 140) risk = "Medium";

    let units = 0;
    if (risk === "High") units = 12;
    else if (risk === "Medium") units = 6;

    res.json({
      average: avg,
      trend,
      risk,
      recommended_insulin: units
    });

  } catch (err) {
    console.error("AI INSULIN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;