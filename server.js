const axios = require('axios');
console.log("🚀 SERVER FILE RUNNING");

const db = require('./db');
console.log("DB CONFIG:", {
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQLPORT
});
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

app.get('/test', (req, res) => {
  console.log("🔥 TEST ROUTE HIT");
  res.send("TEST WORKING");
});

// ================= API ROUTES =================

// Doctor
app.get("/api/doctor", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM DOCTOR LIMIT 1");
    res.json(rows[0]);
  } catch (err) {
    console.error("Doctor API Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Debug log
app.use((req, res, next) => {
  console.log("➡️ ROUTE HIT:", req.method, req.url);
  next();
});


// ✅ IMPORTANT ROUTES
app.use('/api/full-patient', require('./routes/fullpatient'));
app.use('/api/insulin', require('./routes/insulin'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/glucose', require('./routes/glucose'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/ai-insulin', require('./routes/ai-insulin'));

app.get('/api/predict', async (req, res) => {
  try {
    const { glucose } = req.query;

    const response = await axios.get(
      `http://127.0.0.1:5000/predict?glucose=${glucose}`
    );

    res.json(response.data);

  } catch (err) {
    console.error("ML ERROR:", err.message);
    res.status(500).json({ error: "ML server error" });
  }
});
// ================= STATIC FILES =================
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ================= 404 =================
app.use((req, res) => {
  res.status(404).send('Not Found');
});

// ================= SERVER =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});