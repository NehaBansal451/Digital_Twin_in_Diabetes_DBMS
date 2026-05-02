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
  const data = await res.json();

  let html = '<table><tr><th>Level</th><th>Time</th></tr>';

  data.forEach(g=>{
    html += `<tr>
      <td class="${g.glucose_level>300?'red':''}">${g.glucose_level}</td>
      <td>${g.recorded_at}</td>
    </tr>`;

if(g.glucose_level > 250){
  notify("⚠️ Critical glucose detected!");
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
  const id = document.getElementById('health-id').value;

  // Get all patients
  const res = await fetch("http://localhost:3000/api/patients");
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
  const response = await fetch("https://ml-diabetes-api.onrender.com/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      age: patient.age,
      glucose: avgGlucose
    })
  });

  const result = await response.json();

  document.getElementById('health-result').innerHTML = `
  <div class="ai-card">
    <h3> ML Prediction</h3>

    <p> Age: ${patient.age}</p>
    <p> Glucose: ${avgGlucose}</p>

    <div class="insight ${result.risk.toLowerCase()}">
      ⚠️ Risk: ${result.risk}
    </div>

    <p> Score: ${result.score}</p>

    <hr>

    <h4> Diet</h4>
    <p>${result.recommendation.diet}</p>

    <h4> Exercise</h4>
    <p>${result.recommendation.exercise}</p>

    <h4> Precaution</h4>
    <p>${result.recommendation.precaution}</p>

    <h4> Medicine</h4>
    <p>${result.recommendation.medicine}</p>

    <p class="note">
      *This is a simulated recommendation. Consult a doctor.
    </p>
  </div>
`;
}


/* =========================
   TOAST
========================= */
function showToast(msg){
  const toast = document.createElement('div');
  toast.innerText = msg;
  toast.className = 'toast';

  document.body.appendChild(toast);
  setTimeout(()=> toast.remove(), 3000);
}

/* =========================
   SECTION SWITCH
========================= */
function showSection(id){
  document.querySelectorAll('.section').forEach(sec=>{
    sec.classList.remove('active');
  });

  const selected = document.getElementById(id);
  if(selected){
    selected.classList.add('active');
  }
}
/* =========================
   INIT
========================= */
setInterval(loadAlerts, 10000);

loadPatients();
loadAlerts();
showSection('patients');

async function downloadReport(){
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const id = document.getElementById('health-id').value;

    // ✅ validation
    if(!id){
      alert(" Enter Patient ID");
      return;
    }

    const resultText = document.getElementById('health-result').innerText;

    if(!resultText){
      alert(" Run prediction first!");
      return;
    }

    // ✅ fetch full patient data
    const res = await fetch(`/api/full-patient/${id}`);
    if(!res.ok){
  alert(" Backend API not working");
  return;
}
const info = await res.json();
    if(!info || Object.keys(info).length === 0){
      alert(" Patient not found");
      return;
    }

    // ✅ fetch insulin data
    const insulinRes = await fetch(`/api/insulin/${id}`);
    const insulinData = insulinRes.ok ? await insulinRes.json() : [];

    // ================= PDF DESIGN =================

    // 🔷 HEADER
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(" DIGITAL HEALTH REPORT", 20, 20);

    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);

    // 🔷 BASIC INFO
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(` Patient: ${info.name || "-"}`, 20, 40);
    doc.text(` Age: ${info.age || "-"}`, 20, 50);
    doc.text(` Doctor: ${info.doctor_name || "Not Assigned"}`, 20, 60);
    doc.text(` Specialization: ${info.specialization || "-"}`, 20, 70);

    doc.text(`Appointment: ${info.appointment_date || "-"}`, 20, 80);
    doc.text(` Status: ${info.status || "-"}`, 20, 90);
   
    // 🔷 INSULIN SECTION
    doc.setFont("helvetica", "bold");
    doc.text(" Insulin Records:", 20, 110);

    doc.setFont("helvetica", "normal");

    let y = 120;

    if(!insulinData || insulinData.length === 0){
      doc.text("No insulin records available", 20, y);
      y += 10;
    } else {
      insulinData.slice(0, 8).forEach(i => { // limit for spacing
        doc.text(`• ${i.units} units at ${i.administered_at}`, 20, y);
        y += 8;
      });
    }

    // 🔷 AI SECTION
    doc.setFont("helvetica", "bold");
    doc.text(" AI Prediction:", 20, y + 5);

    doc.setFont("helvetica", "normal");

    const lines = doc.splitTextToSize(resultText, 170);
    doc.text(lines, 20, y + 15);

    // 🔷 FOOTER
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 280);

    // 🔷 SAVE
    doc.save(`Health_Report_${info.patient_name || id}.pdf`);

  } catch(err){
    console.error("Report Error:", err);
    alert(" Error generating report (check backend)");
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