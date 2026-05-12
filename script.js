// BLYNK INTEGRATION CONFIG
const CONFIG = {
    TOKEN: "pd3Q6apyv8yfY9lmqOu_9IF8Gy3ldLpd",
    TEMPLATE_ID: "TMPL67wf1LE0b",
    // CORS Proxy is mandatory for GitHub Pages to talk to Blynk API
    URL: "https://corsproxy.io/?https://blynk.cloud/external/api/getAll?token=",
    INTERVAL: 3000, 
    DANGER: 10, 
    WARNING: 25
};

let liveChart, pieChart;
let historyLog = JSON.parse(localStorage.getItem('storm_history')) || [];

// Sidebar Toggle (Mobile)
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// Navigation Controller
function navigateTo(targetId) {
    document.querySelectorAll('.nav-item, .main-section').forEach(el => el.classList.remove('active'));
    const navItem = document.querySelector(`[data-target="${targetId}"]`);
    if(navItem) navItem.classList.add('active');
    
    document.getElementById(targetId).classList.add('active');
    
    // Auto-close sidebar on mobile
    if (window.innerWidth <= 850) {
        document.getElementById('sidebar').classList.remove('open');
    }
    
    if (targetId === 'analytics') renderAnalytics();
    window.scrollTo(0,0);
}

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => navigateTo(item.dataset.target));
});

// Initialize Chart.js
function initCharts() {
    const ctxL = document.getElementById('liveChart').getContext('2d');
    liveChart = new Chart(ctxL, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Distance (KM)',
                data: [],
                borderColor: '#ff9f1c',
                backgroundColor: 'rgba(255, 159, 28, 0.05)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#ff9f1c'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, max: 45, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { grid: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });

    const ctxP = document.getElementById('pieChart').getContext('2d');
    pieChart = new Chart(ctxP, {
        type: 'doughnut',
        data: {
            labels: ['Critical', 'Warning', 'Safe'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#ff4757', '#ffa502', '#00d2ff'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#888', padding: 20 } } }
        }
    });
}

// Fetch Data Engine
async function fetchData() {
    try {
        const response = await fetch(`${CONFIG.URL}${CONFIG.TOKEN}`);
        const data = await response.json();
        
        // V1 = Distance, V2 = Intensity
        const dist = parseFloat(data.V1) || 0;
        const intens = parseFloat(data.V2) || 0;
        
        updateUI(dist, intens);
        updateStatus(true);
    } catch (error) {
        console.error("Connection Failed:", error);
        updateStatus(false);
    }

    /* // TESTING MODE: If you want to see the graph move without lightning, 
    // uncomment the lines below and comment out the try-catch block above.
    
    let demoDist = Math.floor(Math.random() * 40);
    let demoIntens = Math.floor(Math.random() * 100);
    updateUI(demoDist, demoIntens);
    updateStatus(true);
    */
}

function updateUI(dist, intens) {
    const time = new Date().toLocaleTimeString('en-GB');
    document.getElementById('live-distance').innerText = dist > 0 ? `${dist} KM` : "CLEAR";
    document.getElementById('live-intensity').innerText = `${intens}%`;
    document.getElementById('myt-clock').innerText = time;

    let level = "SAFE", color = "var(--safe)";
    if (dist > 0 && dist <= CONFIG.DANGER) {
        level = "CRITICAL"; color = "var(--danger)";
        triggerFlash();
    } else if (dist > 0 && dist <= CONFIG.WARNING) {
        level = "WARNING"; color = "var(--warning)";
    }

    const banner = document.getElementById('status-banner');
    banner.innerText = `SYSTEM STATUS: ${level}`;
    banner.style.color = color;
    banner.style.borderColor = color;

    document.getElementById('intensity-fill').style.width = dist > 0 ? `${((45 - dist) / 45) * 100}%` : "0%";
    document.getElementById('intensity-fill').style.background = color;

    // Update Line Chart
    if(liveChart.data.labels.length > 12) {
        liveChart.data.labels.shift();
        liveChart.data.datasets[0].data.shift();
    }
    liveChart.data.labels.push(time);
    liveChart.data.datasets[0].data.push(dist);
    liveChart.update('none'); // Update without animation for performance

    // Log Detection History
    if (dist > 0) {
        historyLog.unshift({ time, dist, level });
        if(historyLog.length > 50) historyLog.pop();
        localStorage.setItem('storm_history', JSON.stringify(historyLog));
        renderHistory();
    }
}

function renderHistory() {
    const tbody = document.getElementById('history-body');
    tbody.innerHTML = historyLog.slice(0, 10).map(i => `
        <tr>
            <td>${i.time}</td>
            <td>${i.dist} KM</td>
            <td style="color:${i.level === 'CRITICAL' ? 'var(--danger)' : 'var(--warning)'}; font-weight:800;">${i.level}</td>
        </tr>
    `).join('');
}

function renderAnalytics() {
    const total = historyLog.length;
    const avg = total > 0 ? (historyLog.reduce((a, c) => a + c.dist, 0) / total).toFixed(1) : 0;
    document.getElementById('total-strikes').innerText = total;
    document.getElementById('avg-dist').innerText = `${avg} KM`;

    const counts = { CRITICAL: 0, WARNING: 0, SAFE: 0 };
    historyLog.forEach(i => { if(counts[i.level] !== undefined) counts[i.level]++; });
    
    pieChart.data.datasets[0].data = [counts.CRITICAL, counts.WARNING, total - (counts.CRITICAL + counts.WARNING)];
    pieChart.update();
}

function updateStatus(online) {
    document.getElementById('status-dot').style.background = online ? "#00ff88" : "var(--danger)";
    document.getElementById('esp-status').innerText = online ? "ONLINE" : "OFFLINE";
}

function triggerFlash() {
    const flash = document.getElementById('flash-effect');
    flash.classList.add('strike-anim');
    setTimeout(() => flash.classList.remove('strike-anim'), 300);
}

function downloadCSV() {
    if(historyLog.length === 0) return alert("No data to export");
    let csv = "Time,Distance,Level\n" + historyLog.map(r => `${r.time},${r.dist},${r.level}`).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'StormWatch_Telemetry.csv'; a.click();
}

// Initial Load
window.onload = () => {
    initCharts();
    renderHistory();
    setInterval(fetchData, CONFIG.INTERVAL);
};
