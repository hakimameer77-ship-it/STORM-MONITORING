const BLYNK_TOKEN = "pd3Q6apyv8yfY9lmqOu_9IF8Gy3ldLpd";
let stormChart;

// Tukar Halaman
function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById(pageId).classList.add('active');
    event.currentTarget.classList.add('active');
    
    document.getElementById('title-display').innerText = pageId.charAt(0).toUpperCase() + pageId.slice(1);
}

// Jam Digital
setInterval(() => {
    document.getElementById('clock').innerText = new Date().toLocaleTimeString('en-GB');
}, 1000);

// Sync Blynk
async function syncData() {
    try {
        const response = await fetch(`https://blynk.cloud/external/api/get?token=${BLYNK_TOKEN}&V1`);
        if (response.ok) {
            const data = await response.json();
            
            // LOGIK: Hanya update jika blynk hantar data (bukan null)
            if (data !== null && data !== undefined) {
                updateDashboard(data);
                updateStatus(true);
            }
        } else {
            updateStatus(false);
        }
    } catch (e) {
        updateStatus(false);
    }
}

function updateStatus(active) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    dot.className = active ? 'dot-green' : 'dot-red';
    text.innerText = active ? 'ONLINE' : 'OFFLINE';
}

function updateDashboard(val) {
    document.getElementById('dist-val').innerText = val;
    const pill = document.getElementById('alert-pill');
    
    if (val <= 10) {
        pill.innerText = "DANGER: STRIKE WITHIN 10KM!";
        pill.className = "pill-danger";
    } else {
        pill.innerText = "STATUS: SAFE (NO THREAT)";
        pill.className = "pill-safe";
    }

    // Update Graf
    const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (stormChart.data.labels.length > 15) {
        stormChart.data.labels.shift();
        stormChart.data.datasets[0].data.shift();
    }
    stormChart.data.labels.push(now);
    stormChart.data.datasets[0].data.push(val);
    stormChart.update();

    // Log ke Table
    if (val < 40) addLogRow(val);
}

function addLogRow(val) {
    const tbody = document.getElementById('log-body');
    const row = `<tr>
        <td style="color: ${val <= 10 ? '#ff3366' : '#00ff88'}">${val <= 10 ? 'CRITICAL' : 'NORMAL'}</td>
        <td>${new Date().toLocaleTimeString()}</td>
        <td>${val} KM</td>
    </tr>`;
    tbody.insertAdjacentHTML('afterbegin', row);
    if (tbody.rows.length > 8) tbody.deleteRow(8);
}

// Inisialisasi Graf (Neon Wave Style)
const ctx = document.getElementById('stormChart').getContext('2d');
stormChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Proximity',
            data: [],
            borderColor: '#00d2ff',
            borderWidth: 3,
            pointRadius: 0,
            tension: 0.4, // Buat garisan berombak (wave)
            fill: true,
            backgroundColor: (context) => {
                const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, 'rgba(0, 210, 255, 0.3)');
                gradient.addColorStop(1, 'rgba(0, 210, 255, 0)');
                return gradient;
            }
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

setInterval(syncData, 2000);
