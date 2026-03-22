const refreshButton = document.getElementById("refreshButton");
const previewFeed = document.getElementById("previewFeed");
const reportTableBody = document.getElementById("reportTableBody");
const previewCount = document.getElementById("previewCount");
const storedCount = document.getElementById("storedCount");
const previewOnlyCount = document.getElementById("previewOnlyCount");
const systemStatus = document.getElementById("systemStatus");
const lastRefresh = document.getElementById("lastRefresh");
const checkinForm = document.getElementById("checkinForm");
const submitResult = document.getElementById("submitResult");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatTime(value) {
  return value || "-";
}

function renderReport(reportItems) {
  storedCount.textContent = String(reportItems.length);

  if (!reportItems.length) {
    reportTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">ยังไม่มีข้อมูล</td>
      </tr>
    `;
    return;
  }

  reportTableBody.innerHTML = reportItems
    .map((item) => {
      const displayName = item.full_name || item.user_id || "-";
      return `
        <tr>
          <td>${escapeHtml(displayName)}</td>
          <td>${escapeHtml(item.user_id || "-")}</td>
          <td>${escapeHtml(item.attend_date || "-")}</td>
          <td>${escapeHtml(formatTime(item.time))}</td>
          <td>${escapeHtml(item.status || "-")}</td>
        </tr>
      `;
    })
    .join("");
}

async function loadDashboard() {
  try {
    const response = await fetch("/api/report"); // ✅ ใช้ API ใหม่
    const data = await response.json();

    renderReport(data);

    systemStatus.textContent = "พร้อมใช้งาน";
    lastRefresh.textContent = new Date().toLocaleTimeString("th-TH");
  } catch (err) {
    systemStatus.textContent = "เชื่อมต่อไม่สำเร็จ";
    lastRefresh.textContent = "-";

    reportTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">${escapeHtml(err.message)}</td>
      </tr>
    `;
  }
}

// ===============================
// ✅ CHECKIN FORM
// ===============================
checkinForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const user_id = document.getElementById("userIdInput").value.trim();

  if (!user_id) {
    submitResult.textContent = "กรุณากรอก user_id";
    return;
  }

  submitResult.textContent = "กำลังส่ง...";

  try {
    const response = await fetch("/api/checkin", { // ✅ แก้ตรงนี้
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id }), // ✅ ส่งให้ตรง backend
    });

    const body = await response.json();
    submitResult.textContent = JSON.stringify(body, null, 2);

    await loadDashboard();
  } catch (err) {
    submitResult.textContent = err.message;
  }
});

// ===============================
// ✅ REFRESH
// ===============================
refreshButton.addEventListener("click", loadDashboard);

// โหลดครั้งแรก
loadDashboard();

// refresh ทุก 5 วิ
window.setInterval(loadDashboard, 5000);