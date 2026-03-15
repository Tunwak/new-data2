const { MongoClient } = require("mongodb");

// ⭐ ใส่ Connection String จริงของคุณ
const url = "mongodb://admin:admin123456@ac-ulgvgct-shard-00-00.vtngvue.mongodb.net:27017,ac-ulgvgct-shard-00-01.vtngvue.mongodb.net:27017,ac-ulgvgct-shard-00-02.vtngvue.mongodb.net:27017/attendanceDB?ssl=true&replicaSet=atlas-8ob2z2-shard-0&authSource=admin&appName=Cluster0";// ⭐ ต้องประกาศ client ตรงนี้
const client = new MongoClient(url);

async function run() {
  try {
    console.log("Connecting MongoDB...");
    await client.connect();
    console.log("MongoDB Connected ✅");

    const db = client.db("attendanceDB");

    // =======================
    // DROP แบบปลอดภัย
    // =======================
    const cols = await db.listCollections().toArray();
    const names = cols.map(c => c.name);

    if (names.includes("users")) await db.collection("users").drop();
    if (names.includes("schedules")) await db.collection("schedules").drop();
    if (names.includes("attendance")) await db.collection("attendance").drop();
    if (names.includes("verification_log")) await db.collection("verification_log").drop();

    // =======================
    // USERS
    // =======================
    await db.collection("users").insertMany([
      { _id: "65010001", full_name: "สมชาย ใจดี", department: "IT" },
      { _id: "65010002", full_name: "สมหญิง ตั้งใจ", department: "IT" },
      { _id: "65010003", full_name: "กิตติพงษ์ พัฒนา", department: "IT" },
      { _id: "65010004", full_name: "อรทัย สุขสันต์", department: "IT" },
      { _id: "65010005", full_name: "ธีรภัทร ก้าวหน้า", department: "IT" }
    ]);

    // =======================
    // SCHEDULE
    // =======================
    await db.collection("schedules").insertOne({
      _id: 1,
      user_group: "IT",
      start_time: "08:30",
      late_threshold: 15
    });

    // =======================
    // VERIFICATION LOG
    // =======================
    await db.collection("verification_log").insertMany([
      { user_id: "65010001", qr_result: "PASS", face_result: "PASS", confidence_score: 0.97, timestamp: new Date() },
      { user_id: "65010002", qr_result: "PASS", face_result: "PASS", confidence_score: 0.88, timestamp: new Date() },
      { user_id: "65010003", qr_result: "PASS", face_result: "FAIL", confidence_score: 0.40, timestamp: new Date() },
      { user_id: "65010004", qr_result: "PASS", face_result: "PASS", confidence_score: 0.92, timestamp: new Date() }
    ]);

    // =======================
    // ATTENDANCE วันนี้
    // =======================
    let today = new Date().toISOString().slice(0, 10);

    await db.collection("attendance").insertMany([
      { user_id: "65010001", schedule_id: 1, status: "ตรงเวลา", confidence_score: 0.97, attend_date: today },
      { user_id: "65010002", schedule_id: 1, status: "สาย", confidence_score: 0.88, attend_date: today },
      { user_id: "65010003", schedule_id: 1, status: "สาย", confidence_score: 0.40, attend_date: today },
      { user_id: "65010004", schedule_id: 1, status: "ตรงเวลา", confidence_score: 0.92, attend_date: today }
    ]);

    // =======================
    // UNIQUE INDEX
    // =======================
    await db.collection("attendance").createIndex(
      { user_id: 1, attend_date: 1 },
      { unique: true }
    );

    // =======================
    // REPORT
    // =======================
    let report = await db.collection("attendance").aggregate([
      { $match: { attend_date: today } },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" }
    ]).toArray();

    console.log("\n===== Attendance Report =====");
    console.table(report);

    // =======================
    // คนขาดวันนี้
    // =======================
    let absent = await db.collection("users").find({
      _id: {
        $nin: await db.collection("attendance")
          .distinct("user_id", { attend_date: today })
      }
    }).toArray();

    console.log("\n===== Absent Today =====");
    console.table(absent);

    console.log("\n✅ FINISH");

  } catch (err) {
    console.log("ERROR ❌");
    console.log(err);
  } finally {
    await client.close();
    console.log("MongoDB Closed");
  }
}

run();