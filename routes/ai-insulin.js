const express = require('express');
const router = express.Router();
const db = require('../db');

// 🔥 AI INSULIN PREDICTION
router.get('/:patient_id', async (req, res) => {
  try {
    const id = req.params.patient_id;

    // Get last 5 glucose readings
    const [rows] = await db.query(`
      SELECT glucose_level 
      FROM GLUCOSE
      WHERE patient_id = ?
      ORDER BY recorded_at DESC
      LIMIT 5
    `, [id]);

    if(rows.length === 0){
      return res.json({ message: "No glucose data" });
    }

    const values = rows.map(r => r.glucose_level);

    // 📊 AI LOGIC
    const avg = values.reduce((a,b)=>a+b,0)/values.length;
    const trend = values[0] - values[values.length-1];

    let insulin = 0;
    let risk = "Normal";

    if(avg > 250){
      insulin = 12;
      risk = "Critical";
    }
    else if(avg > 180){
      insulin = 8;
      risk = "High";
    }
    else if(avg < 70){
      insulin = 0;
      risk = "Low";
    }
    else{
      insulin = 3;
      risk = "Stable";
    }

    // Trend adjustment
    if(trend > 30) insulin += 2;
    if(trend < -30) insulin -= 1;

    res.json({
      readings: values,
      average: avg.toFixed(2),
      trend,
      risk,
      recommended_insulin: insulin
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;