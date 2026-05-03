/* =========================
   GLOBAL VARIABLES
========================= */
let chart;
let allPatients = [];

/* =========================
   ADD PATIENT
========================= */
async function addPatient(){
  const name = document.getElementById('name').value;
  const age = document.getElementById('age').value;

  if(!name || !age){
    alert("Fill all fields");
    return;
  }

  const res = await fetch('/api/patients',{
    method:"POST",
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      name,
      age,
      gender:document.getElementById('gender').value,
      diabetes_type:document.getElementById('dtype').value
    })
  });

  const data = await res.json();
  showToast(data.message);
  loadPatients();
}

/* =========================
   LOAD PATIENTS (WITH LOADING)
========================= */
async function loadPatients(){
  document.getElementById('patient-table').innerHTML = `
    <div class="skeleton"></div>
    <div class="skeleton"></div>
    <div class="skeleton"></div>
  `;

  const res = await fetch('/api/patients');
  const data = await res.json();

  allPatients = data;
  renderPatients(data);

  document.getElementById('totalPatients').innerText = data.length;
}

/* =========================
   SEARCH PATIENT
========================= */
function searchPatient(){
  const value = document.getElementById('search').value.toLowerCase();

  const filtered = allPatients.filter(p =>
    p.name.toLowerCase().includes(value) ||
    p.patient_id.toString().includes(value)
  );

  renderPatients(filtered);
}

/* =========================
   RENDER PATIENT TABLE
========================= */
function renderPatients(data){
  let html = `
    <table>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Age</th>
        <th>Gender</th>
        <th>Type</th>
        <th>Status</th>
      </tr>
  `;

  data.forEach(p => {

let status = "🟢 Normal";
if(p.diabetes_type === "Type 2") status = "🟡 Risk";
if(p.diabetes_type === "Type 1") status = "🔴 Critical";  

    html += `
      <tr onclick="viewPatient(${p.patient_id})">
        <td>${p.patient_id}</td>
        <td>${p.name}</td>
        <td>${p.age}</td>
        <td>${p.gender}</td>
        <td>${p.diabetes_type}</td>
        <td>${status}</td>
      </tr>
    `;
  });

  html += `</table>`;
  document.getElementById('patient-table').innerHTML = html;
}

/* =========================
   VIEW PATIENT
========================= */
function viewPatient(id){
  const p = allPatients.find(x => x.patient_id == id);

  document.getElementById('popup-data').innerHTML = `
    <p><b>Name:</b> ${p.name}</p>
    <p><b>Age:</b> ${p.age}</p>
    <p><b>Gender:</b> ${p.gender}</p>
    <p><b>Type:</b> ${p.diabetes_type}</p>
  `;

  document.getElementById('popup').style.display = 'block';
}

function closePopup(){
  document.getElementById('popup').style.display = 'none';
}

/* =========================
   LOG GLUCOSE
========================= */
async function logGlucose(){
  const pid = document.getElementById('g-pid').value;
  const level = document.getElementById('g-level').value;

  const res = await fetch('/api/glucose',{
    method:"POST",
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({patient_id:pid, glucose_level:level})
  });

  const data = await res.json();
  showToast(data.message);
}

/* =========================
   LOAD GLUCOSE
========================= */
async function loadGlucose(){
  const pid = document.getElementById('g-pid').value;
  if(!pid){ alert('Enter a Patient ID first'); return; }

  document.getElementById('glucose-result').innerText = "Loading...";

const res = await fetch(`/api/glucose/${pid}`);

if(!res.ok){
  alert("❌ Failed to load glucose data");
  return;
}

const data = await res.json();
if(!Array.isArray(data) || data.length === 0){
  document.getElementById('glucose-result').innerHTML = "No glucose data found";
  return;
}
  let html = '<table><tr><th>Level</th><th>Time</th></tr>';

 data.forEach(g=>{
  html += `<tr>
    <td class="${g.glucose_level>300?'red':''}">${g.glucose_level}</td>
    <td>${g.recorded_at}</td>
  </tr>`;

  if(g.glucose_level > 250){
    showToast("⚠️ Critical glucose detected!");
  }
});



  html += '</table>';
  document.getElementById('glucose-result').innerHTML = html;

  updateChart(data);
  updateStats(data);

  const sorted = data.slice().reverse();
  const values = sorted.map(d => d.glucose_level);

  if(values.length > 1){
    const first = values[0];
    const last = values[values.length - 1];

    const trend = last > first ? "Increasing 📈"
                : last < first ? "Decreasing 📉"
                : "Stable ➖";

    document.getElementById("trend").innerText = "Trend: " + trend;
    const next = predictNext(values);

document.getElementById("trend").innerText += 
  ` | Next: ${next} 🔮`;
  }
}

/* =========================
   UPDATE CHART (ANIMATED)
========================= */
function updateChart(data){
  const sorted = data.slice().reverse();

  const labels = sorted.map(d => new Date(d.recorded_at).toLocaleTimeString());
  const values = sorted.map(d => d.glucose_level);

  const ctx = document.getElementById('chart');

  if(chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
     datasets: [{
  label: 'Glucose',
  data: values,
  borderColor: '#8b5cf6',
  backgroundColor: 'rgba(139,92,246,0.2)',
  tension: 0.4,
  fill: true,
  pointRadius: 6,
  pointHoverRadius: 8
}]
    },
    options: {
      animation: {
        duration: 1500
      }
    }
  });
}

/* =========================
   UPDATE STATS
========================= */
function updateStats(data){
  if(data.length === 0){
    document.getElementById('avgGlucose').innerText = "--";
    return;
  }

  const avg = data.reduce((a,b)=>a+b.glucose_level,0)/data.length;
  document.getElementById('avgGlucose').innerText = Math.round(avg);
}

/* =========================
   LOAD ALERTS
========================= */
async function loadAlerts(){
  try{
    const res = await fetch('/api/glucose/alerts/all');
    const data = await res.json();

    if(!Array.isArray(data)) return;

    let html = '';

    data.forEach(a=>{
      html += `<p>⚠️ ${a.patient_name} - ${a.message}</p>`;
    });

    document.getElementById('alerts-result').innerHTML = html || "No alerts";

    document.getElementById('alertCount').innerText = data.length;
    document.getElementById('alertBadge').innerText = data.length;

  } catch(err){
    console.log(err);
  }
}

/* =========================
   AI HEALTH
========================= */
async function getHealth(){
 const input = document.getElementById('health-id');

if (!input) {
  alert("Input field not found");
  return;
}

const id = input.value;
  // Get all patients
  
const res = await fetch("/api/patients");
  const patients = await res.json();

  const patient = patients.find(p => p.patient_id == id);

  if(!patient){
    alert("Patient not found");
    return;
  }

  // ✅ STEP 1: fetch glucose average
  const gRes = await fetch(`/api/glucose/${id}`);
  const gData = await gRes.json();

  let avgGlucose = 150;

  if(Array.isArray(gData) && gData.length > 0){
    avgGlucose = Math.round(
      gData.reduce((sum, g) => sum + g.glucose_level, 0) / gData.length
    );
  }

  console.log("Sending:", patient.age, avgGlucose); // 🔥 DEBUG

  // ✅ STEP 2: call ML API
// ✅ STEP 2: call ML API (CORRECT)
let data;

try {
  const url = `https://ml-diabetes-api.onrender.com/predict?age=${Number(patient.age)}&glucose=${Number(avgGlucose)}`;

  console.log("Calling:", url);

  const response = await fetch(url);

  const text = await response.text();   // read raw
  console.log("RAW:", text);

  data = JSON.parse(text);  // convert manually

  // ❌ If ML returns error
  if (data.error) {
    throw new Error(data.error);
  }

} catch (err) {
  console.error("Prediction Error:", err);
  alert("Prediction failed: " + err.message);
  return;
}


document.getElementById('health-result').innerHTML = `
  <div class="ai-card">
    <h3> ML Prediction</h3>

    <p> Age: ${patient.age}</p>
    <p> Glucose: ${avgGlucose}</p>

    <div class="insight ${data.risk.toLowerCase()}">
      ⚠️ Risk: ${data.risk}
    </div>

    <p> Score: ${data.score}</p>

    <hr>

    <h4> Diet</h4>
    <p>${data.recommendation.diet}</p>

    <h4> Exercise</h4>
    <p>${data.recommendation.exercise}</p>

    <h4> Precaution</h4>
    <p>${data.recommendation.precaution}</p>

    <h4> Medicine</h4>
    <p>${data.recommendation.medicine}</p>

    <p class="note">
      *This is a simulated recommendation.
    </p>
  </div>
`;
}


/* =========================
   INIT
========================= */
setInterval(loadAlerts, 10000);

loadPatients();
loadAlerts();
showSection('patients');

function generateChart(glucoseData) {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 200;

  const ctx = canvas.getContext("2d");

  const values = glucoseData.map(g => g.glucose_level);

  // draw axes
  ctx.beginPath();
  ctx.moveTo(30, 10);
  ctx.lineTo(30, 180);
  ctx.lineTo(380, 180);
  ctx.stroke();

  // plot graph
  ctx.beginPath();
  values.forEach((val, i) => {
    const x = 30 + i * (300 / values.length);
    const y = 180 - val * 0.4; // scale

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.strokeStyle = "blue";
  ctx.stroke();

  return canvas.toDataURL("image/png");
}

async function downloadReport(){
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
const input = document.getElementById('health-id'); // use existing input

if (!input) {
  alert("Input not found");
  return;
}

const id = input.value;

if (!id) {
  alert("Enter Patient ID");
  return;
}
    const resultText = document.getElementById('health-result').innerText;

    if(!resultText){
      alert("Run prediction first!");
      return;
    }

    // ✅ fetch full patient data
const res = await fetch(
  `https://digitaltwinindiabetesdbms-production.up.railway.app/api/full-patient/${id}`
);

    if(!res.ok){
      alert("Backend API not working");
      return;
    }

    const info = await res.json();

    if(!info || Object.keys(info).length === 0){
      alert("Patient not found");
      return;
    }

    const insulinData = info.insulin;

    // =========================
    // ✅ PDF CONTENT
    // =========================
// =========================
// 🏥 HEADER
// =========================
doc.setFontSize(20);
doc.setTextColor(0, 102, 204);
doc.text("AI DIABETES HEALTH REPORT", 20, 20);

// line
doc.setDrawColor(0, 102, 204);
doc.line(20, 25, 190, 25);

// reset color
doc.setTextColor(0, 0, 0);

// =========================
// 📋 PATIENT DETAILS
// =========================
doc.setFontSize(12);

let y = 40;

doc.text(`Patient ID: ${info.patient_id}`, 20, y); y += 10;
doc.text(`Name: ${info.name}`, 20, y); y += 10;
doc.text(`Age: ${info.age}`, 20, y); y += 10;
doc.text(`Gender: ${info.gender}`, 20, y); y += 10;

doc.text(`Doctor: ${info.doctor_name || "N/A"}`, 110, 40);
doc.text(`Specialization: ${info.specialization || "N/A"}`, 110, 50);

// =========================
// 🔥 RISK (COLORED)
// =========================
y += 20;

doc.setFontSize(14);

let finalRisk;

if (info.avg_glucose > 200) finalRisk = "High";
else if (info.avg_glucose > 140) finalRisk = "Medium";
else finalRisk = "Low";

// color
if (finalRisk === "High") {
  doc.setTextColor(255, 0, 0);
} else if (finalRisk === "Medium") {
  doc.setTextColor(255, 140, 0);
} else {
  doc.setTextColor(0, 128, 0);
}


// reset color
doc.setTextColor(0, 0, 0);

// =========================
// 🧪 INSULIN SECTION
// =========================
y += 20;

doc.setFontSize(13);
doc.text("Insulin Records:", 20, y);

doc.setFontSize(11);

if (Array.isArray(insulinData) && insulinData.length > 0) {
insulinData.slice(0, 5).forEach(i => {
  const text = `• ${i.units} units (${new Date(i.administered_at).toLocaleDateString()})`;

  const lines = doc.splitTextToSize(text, 160);
  doc.text(lines, 25, y);
  y += lines.length * 7;
});
} else if (insulinData) {
  y += 10;
  doc.text(`• ${insulinData.units} units`, 25, y);
} else {
  y += 10;
  doc.text("No insulin data available", 25, y);
}

// =========================
// 📊 AVG GLUCOSE
// =========================
y += 20;

doc.setFontSize(12);
doc.text(`Average Glucose: ${info.avg_glucose || "N/A"}`, 20, y);
const latest = info.glucose?.[0]?.glucose_level || "N/A";

y += 10;
doc.text(`Latest Glucose: ${latest}`, 20, y);// =========================
// 📈 GLUCOSE GRAPH
// =========================

if (info.glucose && info.glucose.length > 0) {

  if (y > 180) {
    doc.addPage();
    y = 20;
  }

  const chartImg = generateChart(info.glucose);

  y += 10;
  doc.setFontSize(13);
  doc.text("Glucose Trend:", 20, y);

  y += 10;

  doc.addImage(chartImg, "PNG", 20, y, 160, 80);

y += 10;  
}

// =========================
// 📝 FOOTER
// =========================
if (y > 260) {
  doc.addPage();
  y = 20;
}

y += 10;

doc.setFontSize(10);
doc.setTextColor(100);
doc.text(
  "Note: This is an AI-generated report. Consult a doctor for medical advice.",
  20,
  y
);

// =========================
// 📥 DOWNLOAD
// =========================
doc.save(`patient_${id}_report.pdf`);

  } catch (err) {
    console.error(err);
    alert("Error generating report (check backend)");
  }
}


   window.onload = () => {
  showSection('patients');
};
function predictNext(values){
  const n = values.length;
  if(n < 2) return values[n-1];

  const diff = values[n-1] - values[n-2];
  return Math.round(values[n-1] + diff);
}
function notify(msg){
  const box = document.createElement('div');
  box.className = 'notification';
  box.innerHTML = ` ${msg}`;

  document.getElementById('notification-panel').appendChild(box);

  setTimeout(()=> box.remove(), 4000);
}
async function getAIInsulin(){
  const pid = document.getElementById('g-pid').value;

  const res = await fetch(`/api/ai-insulin/${pid}`);
  const data = await res.json();

  if(data.message){
    alert(data.message);
    return;
  }

  document.getElementById('ai-insulin').innerHTML = `
    <div class="card">
      <h3> AI Insulin Prediction</h3>

      <p>📊 Avg Glucose: ${data.average}</p>
      <p>📈 Trend: ${data.trend}</p>
      <p>⚠ Risk: ${data.risk}</p>

      <h2>💉 ${data.recommended_insulin} units</h2>

      <button onclick="confirmInsulin(${pid}, ${data.recommended_insulin})">
        Confirm & Save
      </button>
    </div>
  `;
}
async function confirmInsulin(pid, units){
  await fetch('/api/insulin', {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      patient_id: pid,
      units
    })
  });

  alert("✅ Insulin saved by doctor");
}
async function predictRisk() {
  const glucose = document.getElementById("predictionInput").value;

  if (!glucose) {
    alert("Enter glucose value");
    return;
  }

  try {
    const res = await fetch(
      `https://ml-diabetes-api.onrender.com/predict?age=30&glucose=${glucose}`
    );

    const mldata = await res.json();

    console.log("PREDICT:", mldata);

    document.getElementById("health-result").innerHTML = `
      <h3>Risk: ${mldata.risk}</h3>
      <p><b>Diet:</b> ${mldata.recommendation.diet}</p>
      <p><b>Exercise:</b> ${mldata.recommendation.exercise}</p>
      <p><b>Precaution:</b> ${mldata.recommendation.precaution}</p>
      <p><b>Medicine:</b> ${mldata.recommendation.medicine}</p>
    `;

  } catch (err) {
    console.error(err);
    alert("Prediction failed");
  }
}function showToast(msg){
  const toast = document.createElement('div');
  toast.innerText = msg;
  toast.className = 'toast';
  document.body.appendChild(toast);
  setTimeout(()=> toast.remove(), 3000);
}

function showSection(id){
  document.querySelectorAll('.section').forEach(sec=>{
    sec.classList.remove('active');
  });

  const selected = document.getElementById(id);
  if(selected){
    selected.classList.add('active');
  }
}