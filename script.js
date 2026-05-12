// CONFIGURATION
const BLYNK_TOKEN = "pd3Q6apyv8yfY9lmqOu_9IF8Gy3ldLpd";
const BLYNK_URL = `https://blynk.cloud/external/api/get?token=${BLYNK_TOKEN}`;

// 1. Sidebar Control
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

// 2. Section Switching
function switchSection(element) {
    const target = element.getAttribute('data-target');
    
    // UI update
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    element.classList.add('active');
    
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(target).classList.add('active');
    
    // Update Page Title
    document.getElementById('page-title').innerText = element.innerText;
    
    if(window.innerWidth < 1000) toggleSidebar();
}

// 3. Live Clock
setInterval(() => {
    document.getElementById('clock').innerText = new Date().toLocaleTimeString();
}, 1000);

// 4. Initialize Charts
const ctxLive = document.getElementById('liveChart').getContext('2d');
let liveChart = new Chart(ctxLive, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Distance (KM)',
            data: [],
            borderColor: '#00f2ff',
            borderWidth: 3,
            pointRadius: 0,
            fill: true,
            backgroundColor: 'rgba(0, 242, 255, 0.05)',
            tension: 0.4
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { beginAtZero: true, max: 40, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { grid: { display: false } }
        },
        plugins: { legend: { display: false } }
    }
});

const ctxAnalytic = document.getElementById('analyticsChart').getContext('2d');
let analyticsChart = new Chart(ctxAnalytic, {
    type: 'bar',
    data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: 'Strikes Detected',
            data: [4, 8, 15, 2, 0, 12, 5],
            backgroundColor: '#00f2ff',
            borderRadius: 8
        }]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

// 5. Fetch Data from Blynk
async function syncBlynk() {
    try {
        const response = await fetch(`${BLYNK_URL}&V1`);
        const val = await response.json();
        
        if (isNaN(val)) return;

        // Update UI
        document.getElementById('dist-val').innerText = val;
        const bar = document.getElementById('dist-bar');
        const percentage = ((40 - val) / 40) * 100;
        bar.style.width = percentage + "%";

        // Logic & Alerts
        const banner = document.getElementById('alert-banner');
        if (val <= 10) {
            banner.className = "banner-danger";
            banner.innerText = "WARNING: LIGHTNING DETECTED WITHIN 10KM";
            document.getElementById('flash-effect').classList.add('strike');
            setTimeout(() => document.getElementById('flash-effect').classList.remove('strike'), 500);
        } else {
            banner.className = "banner-safe";
            banner.innerText = "SYSTEM MONITORING ACTIVE - NO NEARBY THREATS";
        }

        // Update Chart
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        if (liveChart.data.labels.length > 20) {
            liveChart.data.labels.shift();
            liveChart.data.datasets[0].data.shift();
        }
        liveChart.data.labels.push(time);
        liveChart.data.datasets[0].data.push(val);
        liveChart.update();

    } catch (e) { console.error("Sync Error"); }
}

// 6. Excel Export Simulation
function exportData() {
    const data = [
        ["Timestamp", "Distance (KM)", "Alert Level", "Location"],
        [new Date().toISOString(), document.getElementById('dist-val').innerText, "Live Data", "Pagoh Campus"]
    ];
    
    let csvContent = "data:text/csv;charset=utf-8," + data.map(e => e.join(",")).join("\n");
    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "StormWatch_History.csv");
    document.body.appendChild(link);
    link.click();
}

// Start
setInterval(syncBlynk, 2000);
