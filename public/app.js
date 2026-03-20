async function loadData() {
  const res = await fetch("/report"); // 🔥 สำคัญ: ไม่ต้องใส่ localhost
  const data = await res.json();

  const table = document.getElementById("data");
  table.innerHTML = "";

  data.forEach(d => {
    table.innerHTML += `
      <tr>
        <td>${d.full_name || d.user_id}</td>
        <td>${d.attend_date}</td>
        <td>${d.time}</td>
        <td>${d.status}</td>
      </tr>
    `;
  });
}