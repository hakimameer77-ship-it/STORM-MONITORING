// Gantikan dengan Token Blynk anda
const BLYNK_AUTH = "pd3Q6apyv8yfY9lmqOu_9IF8Gy3ldLpd";
const V_PIN = "V1"; 

// Database Tempatan
let logs = JSON.parse(localStorage.getItem('stormLogs')) || [];

// Inisialisasi Carta
let liveChart, trendChart, pieChart;

document.addEventListener('DOMContentLoaded', () => {
    initClock();
    setupNavigation();
    initCharts();
    updateUI();
    setInterval(fetchBlynkData, 2000); // Ambil data setiap 2 saat
});

// 1. NAVIGATION
function setupNavigation() {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            
            item.classList.add('active');
            document.getElementById(item.dataset.target).classList.add('active');
        });
    });
}

// 2. BLYNK DATA SYNC
async function fetchBlynkData() {
    try {
        const response = await fetch(`https://blynk.cloud/external/api/get?token=${BLYNK_AUTH}&${V_PIN}`);
        const distance = await response.json();
        
        if (typeof distance === 'number') {
            processNewData(distance);
        }
    } catch (err) {
        document.getElementById('cloud-status').innerText = "Disconnected";
        console.error("Blynk Error:", err);
    }
}

function processNewData(val) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-GB');
    const dateStr = now.toISOString().split('T')[0];

    // Update Live UI
    document.getElementById('live-dist').innerText = `${val} KM`;
    const banner = document.getElementById('top-banner');
    const liveStatus = document.getElementById('live-status');

    let severity = "SAFE";
    if (val <= 10) {
        severity = "DANGER";
        triggerFlash();
    } else if (val <= 25) {
        severity = "WARNING";
    }

    // Update Status UI
    banner.innerHTML = `<span class="status-badge ${severity.toLowerCase()}">${severity}: ${severity === 'SAFE' ? 'Conditions normal' : 'Storm Activity Detected'}</span>`;
    liveStatus.innerText = `${severity}: ${severity === 'SAFE' ? 'Conditions normal' : 'Nearby Activity'}`;
    liveStatus.style.color = severity === 'DANGER' ? '#ef4444' : (severity === 'WARNING' ? '#f59e0b' : '#10b981');

    // Simpan Log jika ada perubahan drastik atau selang masa tertentu
    // Untuk demo: simpan log setiap 10 saat jika nilai < 40
    if (val < 40) {
        addLog(severity, dateStr, timeStr, val);
    }

    updateLiveChart(timeStr, val);
}

// 3. LOGIC DATA
function addLog(sev, date, time, dist) {
    const newEntry = { sev, date, time, dist, class: "RF Signal Logged" };
    logs.unshift(newEntry);
    if (logs.length > 100) logs.pop(); // Had 100 logs
    localStorage.setItem('stormLogs', JSON.stringify(logs));
    updateUI();
}

function updateUI() {
    // Update Table
    const tbody = document.querySelector('#logs-table tbody');
    tbody.innerHTML = logs.slice(0, 10).map(log => `
        <tr>
            <td><span class="sev-tag ${log.sev.toLowerCase()}">${log.sev}</span></td>
            <td>${log.date}</td>
            <td>${log.time}</td>
            <td>${log.dist} KM</td>
            <td>${log.class}</td>
        </tr>
    `).join('');

    // Update Stats
    document.getElementById('total-logs').innerText = logs.length;
    document.getElementById('count-safe').innerText = logs.filter(l => l.sev === 'SAFE').length;
    document.getElementById('count-warning').innerText = logs.filter(l => l.sev === 'WARNING').length;
    document.getElementById('count-danger').innerText = logs.filter(l => l.sev === 'DANGER').length;

    // Avg Proximity
    if(logs.length > 0) {
        const avg = logs.reduce((acc, curr) => acc + curr.dist, 0) / logs.length;
        document.getElementById('avg-prox').innerText = `${avg.toFixed(1)} KM`;
    }

    updatePieChart();
}

// 4. CHARTS
function initCharts() {
    // Live Chart
    const liveCtx = document.getElementById('liveChart').getContext('2d');
    liveChart = new Chart(liveCtx, {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Distance', data: [], borderColor: '#2563eb', fill: true, backgroundColor: 'rgba(37, 99, 235, 0.1)', tension: 0.4 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { max: 40, beginAtZero: true } } }
    });

    // Pie Chart
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    pieChart = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: ['Danger', 'Warning', 'Safe'],
            datasets: [{ data: [0, 0, 0], backgroundColor: ['#ef4444', '#f59e0b', '#10b981'] }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
}

function updateLiveChart(label, data) {
    if (liveChart.data.labels.length > 20) {
        liveChart.data.labels.shift();
        liveChart.data.datasets[0].data.shift();
    }
    liveChart.data.labels.push(label);
    liveChart.data.datasets[0].data.push(data);
    liveChart.update();
}

function updatePieChart() {
    const d = logs.filter(l => l.sev === 'DANGER').length;
    const w = logs.filter(l => l.sev === 'WARNING').length;
    const s = logs.filter(l => l.sev === 'SAFE').length;
    pieChart.data.datasets[0].data = [d, w, s];
    pieChart.update();
}

// 5. UTILS
function initClock() {
    setInterval(() => {
        document.getElementById('digital-clock').innerText = new Date().toLocaleTimeString('en-GB');
    }, 1000);
}

function triggerFlash() {
    const f = document.getElementById('flash-overlay');
    f.classList.add('flash-active');
    setTimeout(() => f.classList.remove('flash-active'), 500);
}

function resetLogs() {
    if(confirm("Are you sure you want to delete all historical logs?")) {
        logs = [];
        localStorage.removeItem('stormLogs');
        updateUI();
    }
}

function exportCSV() {
    let csv = "Severity,Date,Time,Proximity,Classification\n";
    logs.forEach(l => {
        csv += `${l.sev},${l.date},${l.time},${l.dist},${l.class}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `StormWatch_Report_${new Date().toLocaleDateString()}.csv`);
    a.click();
}
