PRAGMA foreign_keys = ON;

-- =====================================
-- ลบตารางเก่าก่อน (กัน error)
-- =====================================
DROP VIEW IF EXISTS Attendance_Report;
DROP VIEW IF EXISTS Absent_Today;

DROP TABLE IF EXISTS Verification_Log;
DROP TABLE IF EXISTS Attendance;
DROP TABLE IF EXISTS Schedules;
DROP TABLE IF EXISTS Users;

-- =====================================
-- 1) ตาราง Users
-- =====================================
CREATE TABLE Users (
    User_ID TEXT PRIMARY KEY,
    Full_Name TEXT NOT NULL,
    Department TEXT
);

-- =====================================
-- 2) ตาราง Schedule
-- =====================================
CREATE TABLE Schedules (
    Schedule_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    User_Group TEXT NOT NULL,
    Start_Time TEXT NOT NULL,
    Late_Threshold INTEGER DEFAULT 15
);

-- =====================================
-- 3) ตาราง Attendance
-- =====================================
CREATE TABLE Attendance (
    Log_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    User_ID TEXT NOT NULL,
    Schedule_ID INTEGER,
    Timestamp TEXT DEFAULT (datetime('now','localtime')),
    Status TEXT,
    Confidence_Score REAL,
    Attend_Date TEXT,
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID),
    FOREIGN KEY (Schedule_ID) REFERENCES Schedules(Schedule_ID)
);

-- =====================================
-- 4) ตาราง Verification Log
-- =====================================
CREATE TABLE Verification_Log (
    Verify_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    User_ID TEXT,
    Timestamp TEXT DEFAULT (datetime('now','localtime')),
    QR_Result TEXT,
    Face_Result TEXT,
    Confidence_Score REAL,
    Note TEXT,
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID)
);

-- =====================================
-- 5) Unique กันเช็คชื่อซ้ำ
-- =====================================
CREATE UNIQUE INDEX idx_attendance_unique
ON Attendance(User_ID, Attend_Date);

-- =====================================
-- 6) เพิ่ม Users 5 คน
-- =====================================
INSERT INTO Users VALUES
('65010001', 'สมชาย ใจดี', 'IT'),
('65010002', 'สมหญิง ตั้งใจ', 'IT'),
('65010003', 'กิตติพงษ์ พัฒนา', 'IT'),
('65010004', 'อรทัย สุขสันต์', 'IT'),
('65010005', 'ธีรภัทร ก้าวหน้า', 'IT');

-- =====================================
-- 7) เพิ่ม Schedule
-- =====================================
INSERT INTO Schedules (User_Group, Start_Time, Late_Threshold)
VALUES ('IT', '08:30', 15);

-- =====================================
-- 8) เพิ่ม Verification Log
-- =====================================
INSERT INTO Verification_Log (User_ID, QR_Result, Face_Result, Confidence_Score, Note) VALUES
('65010001', 'PASS', 'PASS', 0.97, 'ยืนยันสำเร็จ'),
('65010002', 'PASS', 'PASS', 0.88, 'ยืนยันสำเร็จ'),
('65010003', 'PASS', 'FAIL', 0.40, 'ใบหน้าไม่ตรง'),
('65010004', 'PASS', 'PASS', 0.92, 'ยืนยันสำเร็จ');

-- =====================================
-- 9) Attendance วันนี้
-- =====================================
INSERT INTO Attendance (User_ID, Schedule_ID, Status, Confidence_Score, Attend_Date) VALUES
('65010001', 1, 'ตรงเวลา', 0.97, DATE('now','localtime')),
('65010002', 1, 'สาย', 0.88, DATE('now','localtime')),
('65010003', 1, 'สาย', 0.40, DATE('now','localtime')),
('65010004', 1, 'ตรงเวลา', 0.92, DATE('now','localtime'));
-- คนที่ 5 = ขาด

-- =====================================
-- 10) View รายงาน
-- =====================================
CREATE VIEW Attendance_Report AS
SELECT
    U.User_ID,
    U.Full_Name,
    U.Department,
    A.Attend_Date,
    A.Status,
    A.Confidence_Score,
    V.QR_Result,
    V.Face_Result
FROM Attendance A
JOIN Users U ON A.User_ID = U.User_ID
LEFT JOIN Verification_Log V
ON V.Verify_ID = (
    SELECT MAX(Verify_ID)
    FROM Verification_Log
    WHERE User_ID = U.User_ID
);

CREATE VIEW Absent_Today AS
SELECT
    U.User_ID,
    U.Full_Name,
    'ขาด' AS Status,
    DATE('now','localtime') AS Attend_Date
FROM Users U
WHERE U.User_ID NOT IN (
    SELECT User_ID
    FROM Attendance
    WHERE Attend_Date = DATE('now','localtime')
);

-- =====================================
-- 11) แสดงผล
-- =====================================
SELECT * FROM Attendance_Report;
SELECT * FROM Absent_Today;