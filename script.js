const BLYNK_TOKEN = "pd3Q6apyv8yfY9lmqOu_9IF8Gy3ldLpd";
let liveChart;

// Fungsi Buka/Tutup Sidebar di Phone
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    document.querySelector('.sidebar-overlay').classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', () => {
    initClock();
    initChart();
    setupNavigation();
    setInterval(syncBlynk, 2000); 
});

async function syncBlynk() {
    try {
        const response = await fetch(`https://blynk.cloud/external/api/get?token=${BLYNK_TOKEN}&V1`);
        if (response.ok) {
            const val = await response.json();
            // LOGIK: Hanya terima data jika blynk aktif (bukan null)
            if (val !== null && val !== undefined && !isNaN(val)) {
                updateUI(val);
                updateStatus(true);
            } else {
                updateStatus(false);
            }
        } else {
            updateStatus(false);
        }
    } catch (e) {
        updateStatus(false);
    }
}

function updateStatus(isActive) {
    const dot = document.getElementById('connection-dot');
    const text = document.getElementById('connection-status');
    const banner = document.getElementById('system-banner');

    if(isActive) {
        dot.className = "dot-online";
        text.innerText = "ACTIVE";
        text.style.color = "var(--neon-green)";
    } else {
        dot.className = "dot-offline";
        text.innerText = "OFFLINE";
        text.style.color = "#64748b";
        banner.innerText = "DEVICE OFFLINE - WAITING FOR DATA...";
        banner.style.borderColor = "var(--border)";
    }
}

function updateUI(val) {
    document.getElementById('dist-val').innerText = val;
    document.getElementById('last-sync').innerText = "Last Sync: " + new Date().toLocaleTimeString();
    
    const percentage = ((40 - val) / 40) * 100;
    document.getElementById('dist-bar').style.width = percentage + "%";

    const banner = document.getElementById('system-banner');
    if (val <= 10) {
        banner.innerText = "CRITICAL: LIGHTNING WITHIN 10KM!";
        banner.style.color = "#ff4757";
        banner.style.borderColor = "#ff4757";
        triggerFlash();
    } else {
        banner.innerText = "SYSTEM ACTIVE: MONITORING NOMINAL";
        banner.style.color = "var(--neon-green)";
        banner.style.borderColor = "var(--neon-green)";
    }

    updateChart(val);
    if(val < 40) addRow(val);
}

function addRow(val) {
    const table = document.querySelector('#logs-table tbody');
    const row = table.insertRow(0);
    row.innerHTML = `
        <td style="color:${val <= 10 ? '#ff4757' : '#00f2ff'}">${val <= 10 ? 'CRITICAL' : 'NORMAL'}</td>
        <td>${new Date().toLocaleTimeString()}</td>
        <td>${val} KM</td>
    `;
    if (table.rows.length > 5) table.deleteRow(5);
}

function initChart() {
    const ctx = document.getElementById('liveTimeline').getContext('2d');
    liveChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                data: [],
                borderColor: '#00f2ff',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(0, 242, 255, 0.05)',
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, max: 40, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { display: false }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function updateChart(val) {
    const time = new Date().toLocaleTimeString();
    if (liveChart.data.labels.length > 15) {
        liveChart.data.labels.shift();
        liveChart.data.datasets[0].data.shift();
    }
    liveChart.data.labels.push(time);
    liveChart.data.datasets[0].data.push(val);
    liveChart.update();
}

function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
            item.classList.add('active');
            document.getElementById(item.dataset.page).classList.add('active');
            if (window.innerWidth <= 900) toggleSidebar(); // Tutup menu lepas klik (Mobile)
        });
    });
}

function initClock() {
    setInterval(() => {
        document.getElementById('clock').innerText = new Date().toLocaleTimeString();
    }, 1000);
}

function triggerFlash() {
    const f = document.getElementById('flash-effect');
    f.classList.add('strike');
    setTimeout(() => f.classList.remove('strike'), 300);
}
