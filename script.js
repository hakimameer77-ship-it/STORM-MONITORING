const CONFIG = {
    TOKEN: "pd3Q6apyv8yfY9lmqOu_9IF8Gy3ldLpd",
    URL: "https://blynk.cloud/external/api/getAll?token=",
    DANGER: 10, WARNING: 25
};

let liveChart, pieChart;
let historyData = JSON.parse(localStorage.getItem('storm_history')) || [];

// 1. Navigation Logic
function navigateTo(targetId) {
    document.querySelectorAll('.nav-item, .main-section').forEach(el => el.classList.remove('active'));
    document.querySelector(`[data-target="${targetId}"]`).classList.add('active');
    document.getElementById(targetId).classList.add('active');
    if(targetId === 'analytics') renderAnalytics();
}

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => navigateTo(item.dataset.target));
});

// 2. Initial Charts
function initCharts() {
    const ctxLive = document.getElementById('liveChart').getContext('2d');
    liveChart = new Chart(ctxLive, {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Jarak (KM)', data: [], borderColor: '#ff9f1c', tension: 0.4, fill: true, backgroundColor: 'rgba(255,159,28,0.1)' }]},
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 40 } } }
    });

    const ctxPie = document.getElementById('pieChart').getContext('2d');
    pieChart = new Chart(ctxPie, {
        type: 'doughnut',
        data: { labels: ['Danger', 'Warning', 'Safe'], datasets: [{ data: [0,0,0], backgroundColor: ['#ff4757', '#ffa502', '#00d2ff'] }]}
    });
}

// 3. Fetch Data
async function updateData() {
    try {
        const res = await fetch(`${CONFIG.URL}${CONFIG.TOKEN}`);
        const data = await res.json();
        const distance = parseInt(data.V1) || 0;
        
        processLiveUpdate(distance);
        updateSystemStatus(true);
    } catch (e) {
        updateSystemStatus(false);
    }
}

function processLiveUpdate(dist) {
    const time = new Date().toLocaleTimeString('en-GB');
    document.getElementById('live-distance').innerText = `${dist} KM`;
    document.getElementById('myt-clock').innerText = time;

    // Logic Warna & Amaran
    let status = "SAFE", color = "var(--safe)";
    if(dist > 0 && dist <= CONFIG.DANGER) { status = "DANGER"; color = "var(--danger)"; triggerFlash(); }
    else if(dist > 0 && dist <= CONFIG.WARNING) { status = "WARNING"; color = "var(--warning)"; }

    const banner = document.getElementById('status-banner');
    banner.innerText = `STATUS: ${status}`;
    banner.style.color = color;
    banner.style.borderColor = color;
    document.getElementById('intensity-fill').style.width = `${( (40-dist)/40 ) * 100}%`;
    document.getElementById('intensity-fill').style.background = color;

    // Update Chart
    if(liveChart.data.labels.length > 10) { liveChart.data.labels.shift(); liveChart.data.datasets[0].data.shift(); }
    liveChart.data.labels.push(time);
    liveChart.data.datasets[0].data.push(dist);
    liveChart.update();

    // Log History jika ada perubahan jarak
    if(dist > 0) {
        const newRecord = { time, dist, status };
        historyData.unshift(newRecord);
        if(historyData.length > 50) historyData.pop();
        localStorage.setItem('storm_history', JSON.stringify(historyData));
        updateHistoryTable();
    }
}

function updateHistoryTable() {
    const body = document.getElementById('history-body');
    body.innerHTML = historyData.slice(0, 10).map(row => `
        <tr>
            <td>${row.time}</td>
            <td>${row.dist} KM</td>
            <td style="color:${row.status === 'DANGER' ? '#ff4757' : '#ffa502'}">${row.status}</td>
        </tr>
    `).join('');
}

function renderAnalytics() {
    const total = historyData.length;
    const avg = total > 0 ? (historyData.reduce((s, r) => s + r.dist, 0) / total).toFixed(1) : 0;
    
    document.getElementById('total-strikes').innerText = total;
    document.getElementById('avg-dist').innerText = `${avg} KM`;

    const counts = { DANGER: 0, WARNING: 0, SAFE: 0 };
    historyData.forEach(r => counts[r.status]++);
    pieChart.data.datasets[0].data = [counts.DANGER, counts.WARNING, counts.SAFE];
    pieChart.update();
}

function triggerFlash() {
    const f = document.getElementById('flash-effect');
    f.classList.add('strike-anim');
    setTimeout(() => f.classList.remove('strike-anim'), 400);
}

function updateSystemStatus(online) {
    document.getElementById('status-dot').style.background = online ? "#00ff88" : "var(--danger)";
    document.getElementById('esp-status').innerText = online ? "ONLINE" : "OFFLINE";
}

function downloadCSV() {
    let csv = "Masa,Jarak,Status\n" + historyData.map(r => `${r.time},${r.dist},${r.status}`).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'StormWatch_History.csv'; a.click();
}

// Start
window.onload = () => {
    initCharts();
    updateHistoryTable();
    setInterval(updateData, 3000);
};
