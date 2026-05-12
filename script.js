const BLYNK_TOKEN = "pd3Q6apyv8yfY9lmqOu_9IF8Gy3ldLpd";
let stormChart;

// Digital Clock
setInterval(() => {
    document.getElementById('clock').innerText = new Date().toLocaleTimeString('en-GB');
}, 1000);

// Sync Data from Blynk
async function syncData() {
    try {
        const response = await fetch(`https://blynk.cloud/external/api/get?token=${BLYNK_TOKEN}&V1`);
        if (response.ok) {
            const data = await response.json();
            // Logic: Only process if data is active/not null
            if (data !== null && data !== undefined) {
                updateUI(data);
                toggleConnection(true);
            }
        } else {
            toggleConnection(false);
        }
    } catch (e) {
        toggleConnection(false);
    }
}

function toggleConnection(isActive) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    dot.className = isActive ? 'dot-green' : 'dot-red';
    text.innerText = isActive ? 'ONLINE' : 'OFFLINE';
}

function updateUI(val) {
    document.getElementById('dist-val').innerText = val;
    const pill = document.getElementById('alert-pill');
    
    if (val <= 10) {
        pill.innerText = "DANGER: IMMEDIATE THREAT!";
        pill.className = "pill-danger";
    } else {
        pill.innerText = "STATUS: SAFE (NO THREAT)";
        pill.className = "pill-safe";
    }

    // Chart Update
    const now = new Date().toLocaleTimeString('en-GB');
    if (stormChart.data.labels.length > 15) {
        stormChart.data.labels.shift();
        stormChart.data.datasets[0].data.shift();
    }
    stormChart.data.labels.push(now);
    stormChart.data.datasets[0].data.push(val);
    stormChart.update();

    // Table Update
    if (val < 40) {
        const tbody = document.getElementById('log-body');
        const row = `<tr>
            <td style="color: ${val <= 10 ? '#ff3366' : '#00ff88'}">${val <= 10 ? 'DANGER' : 'NORMAL'}</td>
            <td>${now}</td>
            <td>${val} KM</td>
        </tr>`;
        tbody.insertAdjacentHTML('afterbegin', row);
        if (tbody.rows.length > 10) tbody.deleteRow(10);
    }
}

// Chart Initializer
const ctx = document.getElementById('stormChart').getContext('2d');
stormChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            data: [],
            borderColor: '#00d2ff',
            borderWidth: 3,
            pointRadius: 0,
            tension: 0.4,
            fill: true,
            backgroundColor: 'rgba(0, 210, 255, 0.05)'
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

function exportCSV() {
    alert("Generating CSV report for UTHM Pagoh Hub...");
}

// Start Syncing
setInterval(syncData, 2000);
