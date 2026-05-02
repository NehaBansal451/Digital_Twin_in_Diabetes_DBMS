const express = require('express');
const router  = express.Router();
const db = require('../db');

/* =========================
POST /api/glucose
========================= */
router.post('/', async (req, res) => {
try {
const { patient_id, glucose_level } = req.body;

```
// ✅ VALIDATION (FINAL)
if (patient_id == null || glucose_level == null) {
  return res.status(400).json({ error: 'patient_id and glucose_level are required' });
}

const pid = Number(patient_id);
const glucose = Number(glucose_level);

if (isNaN(pid) || isNaN(glucose)) {
  return res.status(400).json({ error: 'Invalid numeric values' });
}

await db.query(
  'INSERT INTO GLUCOSE (patient_id, glucose_level) VALUES (?, ?)',
  [pid, glucose]
);

const alertMsg = glucose > 300
  ? '⚠️ CRITICAL: Glucose exceeded 300! Alert logged.'
  : '✅ Glucose reading saved successfully.';

res.json({ message: alertMsg });
```

} catch (err) {
console.error("POST GLUCOSE ERROR:", err);
res.status(500).json({ error: err.message });
}
});

/* =========================
GET /api/glucose/alerts/all
========================= */
router.get('/alerts/all', async (req, res) => {
try {
const [rows] = await db.query(`       SELECT a.alert_id, p.name AS patient_name, a.message, a.created_at
      FROM ALERT_LOG a
      JOIN PATIENT p ON a.patient_id = p.patient_id
      ORDER BY a.created_at DESC
    `);

```
res.json(rows);
```

} catch (err) {
console.error("ALERTS ERROR:", err);
res.status(500).json({ error: err.message });
}
});

/* =========================
GET /api/glucose/:patient_id/avg
========================= */
router.get('/:patient_id/avg', async (req, res) => {
try {
const { patient_id } = req.params;

```
const [rows] = await db.query(
  `SELECT 
    ROUND(AVG(glucose_level), 2) AS avg_glucose,
    MAX(glucose_level) AS max_glucose,
    MIN(glucose_level) AS min_glucose
   FROM GLUCOSE 
   WHERE patient_id = ?`,
  [patient_id]
);

// ✅ HANDLE EMPTY DATA
if (!rows[0] || rows[0].avg_glucose === null) {
  return res.json({
    avg_glucose: 0,
    max_glucose: 0,
    min_glucose: 0
  });
}

res.json(rows[0]);
```

} catch (err) {
console.error("AVG ERROR:", err);
res.status(500).json({ error: err.message });
}
});

/* =========================
GET /api/glucose/:patient_id
========================= */
router.get('/:patient_id', async (req, res) => {
try {
const { patient_id } = req.params;

```
const [rows] = await db.query(
  `SELECT record_id, glucose_level, recorded_at 
   FROM GLUCOSE 
   WHERE patient_id = ? 
   ORDER BY recorded_at DESC`,
  [patient_id]
);

res.json(rows);
```

} catch (err) {
console.error("GLUCOSE FETCH ERROR:", err);
res.status(500).json({ error: err.message });
}
});

module.exports = router;
