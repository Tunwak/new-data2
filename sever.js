const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// ⭐ ใส่ Connection String ของคุณ
const url = "mongodb+srv://admin:admin123456@cluster0.vtngvue.mongodb.net/attendanceDB";

const client = new MongoClient(url);

let db;

async function start() {
  await client.connect();
  db = client.db("attendanceDB");
  console.log("MongoDB Connected ✅");
}
start();


// ===============================
// ✅ API เช็คชื่อ
// ===============================
app.post("/checkin", async (req, res) => {
  const { user_id } = req.body;

  const now = new Date();
  const today = now.toISOString().slice(0,10);
  const timeNow = now.toTimeString().slice(0,8);

  let already = await db.collection("attendance")
    .findOne({ user_id, attend_date: today });

  if (already) {
    return res.send({ message: "วันนี้เช็คชื่อแล้ว" });
  }

  const status = timeNow > "09:00:00" ? "สาย" : "ตรงเวลา";

  await db.collection("attendance").insertOne({
    user_id,
    attend_date: today,
    time: timeNow,
    status
  });

  res.send({ message: "เช็คชื่อสำเร็จ", status });
});


// ===============================
// ✅ API รายงาน
// ===============================
app.get("/report", async (req, res) => {

  let data = await db.collection("attendance").aggregate([
    {
      $lookup:{
        from:"users",
        localField:"user_id",
        foreignField:"_id",
        as:"user"
      }
    },
    { $unwind:"$user" }
  ]).toArray();

  res.send(data);
});


// ===============================
// ✅ Dashboard Web
// ===============================
app.get("/", async (req, res) => {

  let data = await db.collection("attendance").find().toArray();

  let html = `
  <h1>🔥 Attendance Dashboard</h1>
  <table border="1" cellpadding="10">
  <tr>
  <th>User</th>
  <th>Date</th>
  <th>Time</th>
  <th>Status</th>
  </tr>
  `;

  data.forEach(d=>{
    html += `
    <tr>
    <td>${d.user_id}</td>
    <td>${d.attend_date}</td>
    <td>${d.time}</td>
    <td>${d.status}</td>
    </tr>
    `;
  });

  html += "</table>";

  res.send(html);
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
  console.log("🔥 Server Running");
});