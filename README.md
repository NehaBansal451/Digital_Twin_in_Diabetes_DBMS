# 🩺 Digital Twin in Diabetes Patient Management System

### (DBMS + PL/SQL + Machine Learning + Full Stack Web Application)

---

## 📌 Overview

This project implements a **Digital Twin-based Diabetes Management System**, where each patient is represented as a **virtual model using structured medical data**.

The system integrates:

* 🗄️ **Database Management System (MySQL + PL/SQL)**
* 🌐 **Backend (Node.js + Express)**
* 🎨 **Frontend Dashboard (HTML, CSS, JavaScript)**
* 🤖 **Machine Learning (Python + Flask)**

It enables **efficient storage, monitoring, prediction, and decision-making** in diabetes care.

---

## 🎯 Problem Statement

Traditional diabetes systems rely on **manual records or fragmented tools**, leading to:

* Data inconsistency
* Redundancy
* Lack of centralized monitoring

This project solves this using a **normalized relational database system** with automated logic and predictive analysis.

---

## 🎯 Objectives

* Design ER model and relational schema
* Normalize database up to **3NF**
* Implement SQL (DDL, DML, Queries)
* Use **PL/SQL (procedures, functions, triggers, cursors)**
* Ensure **ACID properties (transactions)**
* Integrate ML for prediction

---

## 🚀 Key Features

### 👤 Patient Management

* Add and manage patients
* Auto doctor assignment
* Appointment scheduling

---

### 🩸 Glucose Monitoring

* Log glucose readings
* View historical data
* Detect critical levels (>300)

---

### 💉 Insulin Management

* Track insulin dosage
* Detect overdose conditions
* AI-based insulin recommendation

---

### 🤖 Machine Learning Module

* Predict diabetes risk (Low / Normal / High / Critical)
* Uses Random Forest
* Provides:

  * Diet suggestions
  * Exercise plan
  * Medical advice

---

### 📊 Dashboard & Analytics

* Interactive UI dashboard
* Glucose trend visualization
* Alert system

---

## 🛠️ Tech Stack

| Layer         | Technology                  |
| ------------- | --------------------------- |
| Frontend      | HTML, CSS, JavaScript       |
| Backend       | Node.js, Express.js         |
| Database      | MySQL + PL/SQL              |
| ML Model      | Python, Flask, Scikit-learn |
| Visualization | Chart.js                    |

---

## 🗄️ Database Design (DBMS)

### 📌 Tables

* PATIENT
* DOCTOR
* GLUCOSE_RECORD
* INSULIN_DOSAGE
* APPOINTMENT
* ALERT_LOG

---

### 🔗 Relationships

* Patient → Glucose Records (1:N)
* Patient → Insulin Dosage (1:N)
* Patient → Appointment → Doctor (N:1)

---

### 🔄 Normalization

Database is normalized up to **Third Normal Form (3NF)**:

* 1NF → Atomic values
* 2NF → No partial dependency
* 3NF → No transitive dependency

👉 Ensures high data integrity and low redundancy.

---

## 🧩 PL/SQL Implementation (Core Requirement)

### 🔹 Triggers

* `glucose_alert` → Logs alert when glucose > 300
* `log_insulin_overdose` → Detects high insulin dosage

---

### 🔹 Stored Procedures

* `AddPatientWithDoctor` → Adds patient + assigns doctor
* `LogGlucoseReading` → Logs glucose with automation
* `GetPatientHistory` → Fetch patient medical history

---

### 🔹 Functions

* `GetRiskLevel(avg_glucose)` → Returns risk category

---

### 🔹 Cursor

* `ShowAllPatientAvgGlucose` → Iterates patient data

---

### 🔹 Transactions (ACID)

* COMMIT → Save changes
* ROLLBACK → Undo changes
* SAVEPOINT → Partial rollback

---

### 🔹 Exception Handling

* Implemented using `EXIT HANDLER` in procedures

---

## 📂 Project Structure

```
project/
│── public/              # Frontend UI
│── routes/              # Backend APIs
│── ml/                  # ML model
│── db.js                # DB connection
│── server.js            # Backend server
│── dbms project.sql     # Database schema + PL/SQL
│── README.md
```

---

## ⚙️ How to Run

### 1️⃣ Clone Repository

```
git clone https://github.com/NehaBansal451/Digital_Twin_in_Diabetes_DBMS.git
```

---

### 2️⃣ Install Dependencies

```
npm install
```

---

### 3️⃣ Setup Database

* Open MySQL
* Import `dbms project.sql`
* Create database

---

### 4️⃣ Configure Environment

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=digital_twin_diabetes
```

---

### 5️⃣ Start Backend

```
node server.js
```

👉 http://localhost:3000

---

### 6️⃣ Run ML API

```
cd ml
python ml_api.py
```

👉 http://127.0.0.1:5000

---

## 🔗 API Endpoints

| Endpoint          | Description            |
| ----------------- | ---------------------- |
| `/api/patients`   | Manage patients        |
| `/api/glucose`    | Log & fetch glucose    |
| `/api/insulin`    | Insulin records        |
| `/api/ai`         | Health prediction      |
| `/api/ai-insulin` | Insulin recommendation |

---

## 📸 Screenshots

(Add your screenshots here)

```
## 📸 Screenshots

### Dashboard
![Dashboard](https://github.com/user-attachments/assets/8882a270-0043-44e8-9b48-f1a93193ec1d)

### ML Prediction
![Prediction](https://github.com/user-attachments/assets/1485d647-2c8b-4da0-97e8-c6211ae70099)

```

---

## 🔐 Security

* `.env` file is excluded
* Credentials are protected
* Follows secure practices

---

## 🎯 Future Scope

* IoT integration (real-time monitoring)
* Cloud deployment
* Mobile application
* Advanced ML model

---

## 👩‍💻 Author

**Neha Bansal**
B.E. Computer Engineering

---

## 🌟 Highlights

✔ DBMS + PL/SQL + ML integration
✔ Fully normalized database (3NF)
✔ Real-world healthcare system
✔ Backend logic implemented in database
✔ Follows academic + industry standards

---
