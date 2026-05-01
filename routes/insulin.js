const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const [rows] = await db.query(`
      SELECT units, administered_at
      FROM INSULIN_DOSAGE
      WHERE patient_id = ?
      ORDER BY administered_at DESC
    `, [id]);

    res.json(rows);
  } catch (err) {
    console.error("Insulin API Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🔥 SAVE INSULIN
router.post('/', async (req, res) => {
  try {
    const { patient_id, units } = req.body;

    await db.query(
      "INSERT INTO INSULIN_DOSAGE (patient_id, units) VALUES (?, ?)",
      [patient_id, units]
    );

    res.json({ message: "✅ Insulin saved" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
module.exports = router;