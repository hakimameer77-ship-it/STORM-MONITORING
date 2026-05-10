// ==========================================
// 1. UI & NAVIGATION LOGIC
// ==========================================
function switchTab(tabId, element) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');

    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('open');
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// Live Clock for Top Bar
function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
    document.getElementById('live-clock').innerText = timeStr;
}
setInterval(updateClock, 1000);
updateClock();

// ==========================================
// 2. MOCK DATABASE GENERATOR
// ==========================================
let dbHistory = [];
const zones = ["Sector A-North", "Sector B-South", "Admin Block", "Main Campus", "Hostel Zone"];

function generateMockData() {
    let dangerCount = 0, warningCount = 0, safeCount = 0, totalDistance = 0;

    for (let i = 0; i < 60; i++) {
        let dist = Math.floor(Math.random() * 40) + 1; // 1 to 40 KM
        let level = "Safe";
        if (dist <= 10) { level = "Danger"; dangerCount++; }
        else if (dist <= 25) { level = "Warning"; warningCount++; }
        else { safeCount++; }

        let date = new Date();
        date.setHours(date.getHours() - (Math.random() * 168)); // Random time in past 7 days
        
        dbHistory.push({
            date: date.toISOString().split('T')[0],
            time: date.toTimeString().split(' ')[0],
            distance: dist,
            alertLevel: level,
            location: zones[Math.floor(Math.random() * zones.length)]
        });
        totalDistance += dist;
    }

    dbHistory.sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time));

    // Update Dashboard Metrics
    document.getElementById('total-detections').innerText = dbHistory.length;
    document.getElementById('avg-distance').innerText = (totalDistance / dbHistory.length).toFixed(1) + " KM";
    document.getElementById('danger-count').innerText = dangerCount;
    document.getElementById('warning-count').innerText = warningCount;
    document.getElementById('safe-count').innerText = safeCount;

    populateTable();
    initAnalyticsCharts(dangerCount, warningCount, safeCount);
}

// ==========================================
// 3. POPULATE ENTERPRISE TABLE
// ==========================================
function populateTable() {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = ""; 

    dbHistory.forEach(record => {
        let badgeClass = record.alertLevel.toLowerCase();

        const row = `<tr>
            <td><span class="badge ${badgeClass}">${record.alertLevel}</span></td>
            <td>${record.date} <span style="color:#64748b; font-size:0.75rem; margin-left:5px;">${record.time}</span></td>
            <td><strong>${record.distance} KM</strong></td>
            <td>RF Signal Detected</td>
            <td>${record.location}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

// ==========================================
// 4. CSV REPORT EXPORT
// ==========================================
function downloadExcel() {
    if (dbHistory.length === 0) return;
    
    let csv = "Severity,Date,Time,Distance(KM),Event Classification,Zone\n";
    dbHistory.forEach(row => {
        csv += `${row.alertLevel},${row.date},${row.time},${row.distance},RF Signal Detected,${row.location}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'StormWatch_Enterprise_Log.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ==========================================
// 5. CHART.JS ENTERPRISE STYLING
// ==========================================
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = '#64748b';

function initAnalyticsCharts(d, w, s) {
    // Bar Chart
    new Chart(document.getElementById('barChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{ 
                label: 'Event Count', 
                data: [12, 19, 8, 15, 6, 25, 10], 
                backgroundColor: '#3b82f6', 
                borderRadius: 4,
                barThickness: 24
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { borderDash: [4, 4], color: '#e2e8f0' }, beginAtZero: true },
                x: { grid: { display: false } }
            }
        }
    });

    // Pie Chart
    new Chart(document.getElementById('pieChart').getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Critical', 'Elevated', 'Normal'],
            datasets: [{ data: [d, w, s], backgroundColor: ['#ef4444', '#f59e0b', '#10b981'], borderWidth: 0 }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            cutout: '75%', 
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 20 } } } 
        }
    });
}

// ==========================================
// 6. LIVE ESP32 API INTEGRATION
// ==========================================
const CLOUD_TOKEN = "pd3Q6apyv8yfY9lmqOu_9IF8Gy3ldLpd"; 
const URL_DIST = `https://blynk.cloud/external/api/get?token=${CLOUD_TOKEN}&V1`;

const liveChart = new Chart(document.getElementById('liveChart').getContext('2d'), {
    type: 'line',
    data: { 
        labels: [], 
        datasets: [{ 
            label: 'Radius (KM)', 
            data: [], 
            borderColor: '#2563eb', 
            backgroundColor: 'rgba(37, 99, 235, 0.05)', 
            fill: true, 
            tension: 0.4, 
            borderWidth: 2,
            pointRadius: 0
        }] 
    },
    options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        plugins: { legend: { display: false } }, 
        scales: { 
            y: { beginAtZero: true, max: 40, grid: { borderDash: [4, 4], color: '#e2e8f0' } },
            x: { grid: { display: false } }
        },
        interaction: { intersect: false, mode: 'index' }
    }
});

async function fetchLiveCloudData() {
    try {
        const response = await fetch(URL_DIST);
        const distance = parseInt(await response.text());

        if (!isNaN(distance)) {
            document.getElementById('live-distance').innerText = distance + " KM";
            let statusEl = document.getElementById('live-status');
            
            if (distance <= 10) {
                statusEl.innerHTML = '<span style="color:#ef4444; font-weight:600;"><i class="fa-solid fa-circle-exclamation"></i> CRITICAL: Strike proximity imminent</span>';
            } else if (distance <= 25) {
                statusEl.innerHTML = '<span style="color:#f59e0b; font-weight:600;"><i class="fa-solid fa-triangle-exclamation"></i> WARNING: Storm activity detected</span>';
            } else {
                statusEl.innerHTML = '<span style="color:#10b981; font-weight:600;"><i class="fa-solid fa-shield-check"></i> SAFE: Conditions normal</span>';
            }

            const now = new Date().toLocaleTimeString([], { hour12: false });
            if (liveChart.data.labels.length > 20) { 
                liveChart.data.labels.shift(); 
                liveChart.data.datasets[0].data.shift(); 
            }
            liveChart.data.labels.push(now); 
            liveChart.data.datasets[0].data.push(distance);
            liveChart.update();
        }
    } catch (e) { 
        console.error("Telemetry Sync Error"); 
    }
}

// ==========================================
// BOOT SEQUENCE
// ==========================================
window.onload = () => {
    generateMockData();
    fetchLiveCloudData();
    setInterval(fetchLiveCloudData, 5000); // Polling every 5s
};
