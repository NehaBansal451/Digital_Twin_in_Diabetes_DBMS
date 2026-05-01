const express = require('express');
const router = express.Router();   // ✅ THIS LINE WAS MISSING
const db = require('../db');

// HEALTH AI ROUTE
router.get('/health/:patient_id', async (req, res) => {
  try {
    const { patient_id } = req.params;

    const [[patient]] = await db.query(
      'SELECT age FROM PATIENT WHERE patient_id = ?',
      [patient_id]
    );

    if (!patient) {
      return res.json({ message: "Patient not found" });
    }

    const age = patient.age;

    const [rows] = await db.query(
      'SELECT glucose_level FROM GLUCOSE_RECORD WHERE patient_id = ? ORDER BY recorded_at ASC',
      [patient_id]
    );

    if (rows.length === 0) {
      return res.json({ message: "No glucose data" });
    }

    const values = rows.map(r => r.glucose_level);

    const avg = values.reduce((a,b)=>a+b,0)/values.length;

    const first = values[0];
    const last = values[values.length-1];

    let trend = "Stable";
    if(last > first) trend = "Increasing 📈";
    else if(last < first) trend = "Decreasing 📉";

    let risk = "Low";
    let conditions = [];
    let recommendation = "";

    if(avg > 250){
      risk = "High";
      conditions.push("Severe Diabetes Risk");
      recommendation = "Immediate medical attention required";
    }
    else if(avg > 180){
      risk = "High";
      conditions.push("Type 2 Diabetes Risk");

      if(age > 40){
        conditions.push("Heart Disease Risk");
      }

      recommendation = "Control sugar intake and monitor daily";
    }
    else if(avg < 70){
      risk = "Low";
      conditions.push("Hypoglycemia Risk");
      recommendation = "Take glucose immediately";
    }
    else{
      risk = "Normal";
      conditions.push("No major risk");
      recommendation = "Maintain healthy lifestyle";
    }

    res.json({
      age,
      average_glucose: avg.toFixed(2),
      trend,
      risk_level: risk,
      possible_conditions: conditions,
      recommendation
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;   // ✅ ALSO IMPORTANT