const express = require("express");
const { MongoClient } = require("mongodb"); // ❌ เอา ObjectId ออก
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

// ===============================
// ✅ ENV
// ===============================
const url = process.env.MONGO_URI;
if (!url) {
  console.error("❌ กรุณาตั้งค่า MONGO_URI");
  process.exit(1);
}

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
// ✅ CREATE USER (ใช้ user_id เป็น string)
// ===============================
app.post("/api/users", async (req, res) => {
  try {
    const { user_id, full_name } = req.body;

    if (!user_id || !full_name) {
      return res.status(400).send({ message: "ต้องมี user_id และ full_name" });
    }

    await db.collection("users").insertOne({
      user_id,
      full_name
    });

    res.send({
      message: "เพิ่ม user สำเร็จ",
      user_id
    });

  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});


// ===============================
// ✅ CHECKIN (ไม่ใช้ ObjectId แล้ว)
// ===============================
app.post("/api/checkin", async (req, res) => {
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
      user_id, // ✅ ใช้ string
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
// ✅ REPORT (แก้ lookup ให้ตรง)
// ===============================
app.get("/api/report", async (req, res) => {
  try {
    let data = await db.collection("attendance").aggregate([
      {
        $lookup:{
          from:"users",
          localField:"user_id",
          foreignField:"user_id", // ✅ แก้ตรงนี้
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
// ✅ Dashboard
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