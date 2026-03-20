const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public")); // ✅ ใช้ไฟล์ UI

// ❗ ใช้ ENV (สำคัญมากสำหรับ Render)
const url = process.env.MONGO_URI;

const client = new MongoClient(url);

let db;

// ===============================
// ✅ CONNECT DB
// ===============================
async function start() {
  try {
    await client.connect();
    db = client.db("attendanceDB");
    console.log("MongoDB Connected ✅");
  } catch (err) {
    console.error("MongoDB Error ❌", err);
  }
}
start();


// ===============================
// ✅ API เช็คชื่อ
// ===============================
app.post("/checkin", async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).send({ message: "กรุณาส่ง user_id" });
    }

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

  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});


// ===============================
// ✅ API รายงาน
// ===============================
app.get("/report", async (req, res) => {
  try {
    let data = await db.collection("attendance").aggregate([
      {
        $lookup:{
          from:"users",
          localField:"user_id",
          foreignField:"_id",
          as:"user"
        }
      },
      { $unwind:"$user" },
      {
        $project:{
          user_id:1,
          attend_date:1,
          time:1,
          status:1,
          full_name:"$user.full_name"
        }
      }
    ]).toArray();

    res.send(data);

  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});


// ===============================
// ✅ Dashboard Web (ใช้ index.html)
// ===============================
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});


// ===============================
// ✅ PORT
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});