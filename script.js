const BLYNK_TOKEN = "pd3Q6apyv8yfY9lmqOu_9IF8Gy3ldLpd";
let logs = JSON.parse(localStorage.getItem('storm_logs')) || [];
let liveChart, trendChart, pieChart;

// 1. Inisialisasi Apabila Laman Dimuatkan
document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    setupNav();
    initCharts();
    refreshUI();
    setInterval(fetchData, 2000); // Ambil data Blynk setiap 2 saat
});

// 2. Mobile Menu Toggle
function toggleMobileMenu() {
    document.querySelector('.sidebar').classList.toggle('active');
    document.querySelector('.sidebar-overlay').classList.toggle('active');
}

// 3. Navigasi Halaman
function setupNav() {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            
            item.classList.add('active');
            document.getElementById(item.dataset.target).classList.add('active');
            
            if (window.innerWidth <= 1024) toggleMobileMenu();
        });
    });
}

// 4. Integrasi Blynk
async function fetchData() {
    try {
        const res = await fetch(`https://blynk.cloud/external/api/get?token=${BLYNK_TOKEN}&V1`);
        const val = await res.json();
        
        if (typeof val === 'number') {
            handleNewData(val);
        }
    } catch (e) {
        document.getElementById('cloud-status').innerText = "Offline";
        document.querySelector('.status-dot').style.background = "#ef4444";
    }
}

function handleNewData(val) {
    const time = new Date().toLocaleTimeString('en-GB');
    const date = new Date().toISOString().split('T')[0];

    document.getElementById('live-dist').innerText = `${val} KM`;
    
    let status = "SAFE";
    if (val <= 10) {
        status = "DANGER";
        triggerFlash();
    } else if (val <= 25) {
        status = "WARNING";
    }

    // Kemaskini Banner
    const banner = document.getElementById('top-banner');
    banner.innerHTML = `<span class="status-badge ${status.toLowerCase()}">${status}: Conditions ${status === 'SAFE' ? 'Normal' : 'Active'}</span>`;

    // Simpan Log jika nilai berubah
    if (val < 40) {
        saveLog({ sev: status, date, time, dist: val, class: "RF Signal Detected" });
    }

    updateLiveChart(time, val);
}

// 5. Carta (Charts)
function initCharts() {
    const commonOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

    liveChart = new Chart(document.getElementById('liveChart'), {
        type: 'line',
        data: { labels: [], datasets: [{ data: [], borderColor: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.05)', fill: true, tension: 0.4 }] },
        options: commonOpts
    });

    trendChart = new Chart(document.getElementById('trendChart'), {
        type: 'bar',
        data: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [{ data: [5, 12, 3, 8, 2, 15, 7], backgroundColor: '#2563eb' }] },
        options: commonOpts
    });

    pieChart = new Chart(document.getElementById('pieChart'), {
        type: 'doughnut',
        data: { labels: ['Danger', 'Warning', 'Safe'], datasets: [{ data: [0, 0, 0], backgroundColor: ['#ef4444', '#f59e0b', '#10b981'] }] },
        options: { ...commonOpts, plugins: { legend: { display: true, position: 'bottom' } } }
    });
}

function updateLiveChart(label, val) {
    if (liveChart.data.labels.length > 15) {
        liveChart.data.labels.shift();
        liveChart.data.datasets[0].data.shift();
    }
    liveChart.data.labels.push(label);
    liveChart.data.datasets[0].data.push(val);
    liveChart.update();
}

// 6. Pengurusan Log
function saveLog(entry) {
    logs.unshift(entry);
    if (logs.length > 50) logs.pop();
    localStorage.setItem('storm_logs', JSON.stringify(logs));
    refreshUI();
}

function refreshUI() {
    const tbody = document.querySelector('#logs-table tbody');
    tbody.innerHTML = logs.map(l => `
        <tr>
            <td><span class="status-badge ${l.sev.toLowerCase()}">${l.sev}</span></td>
            <td>${l.date}</td>
            <td>${l.time}</td>
            <td>${l.dist} KM</td>
            <td>${l.class}</td>
        </tr>
    `).join('');

    document.getElementById('total-logs').innerText = logs.length;
    
    const dCount = logs.filter(l => l.sev === 'DANGER').length;
    const wCount = logs.filter(l => l.sev === 'WARNING').length;
    const sCount = logs.filter(l => l.sev === 'SAFE').length;

    document.getElementById('count-danger').innerText = dCount;
    document.getElementById('count-warning').innerText = wCount;
    document.getElementById('count-safe').innerText = sCount;

    if (logs.length > 0) {
        const avg = logs.reduce((sum, l) => sum + l.dist, 0) / logs.length;
        document.getElementById('avg-prox').innerText = `${avg.toFixed(1)} KM`;
    }

    pieChart.data.datasets[0].data = [dCount, wCount, sCount];
    pieChart.update();
}

// 7. Utiliti
function updateClock() {
    setInterval(() => {
        document.getElementById('digital-clock').innerText = new Date().toLocaleTimeString('en-GB');
    }, 1000);
}

function triggerFlash() {
    const f = document.getElementById('flash-overlay');
    f.classList.add('flash-active');
    setTimeout(() => f.classList.remove('flash-active'), 400);
}

function resetLogs() {
    if (confirm("Delete all data history?")) {
        logs = [];
        localStorage.removeItem('storm_logs');
        refreshUI();
    }
}

function exportCSV() {
    let csv = "Severity,Date,Time,Distance,Type\n";
    logs.forEach(l => csv += `${l.sev},${l.date},${l.time},${l.dist},${l.class}\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StormReport_${new Date().toLocaleDateString()}.csv`;
    a.click();
}
