// CONFIGURATION - Replace with your Blynk Auth Token
const BLYNK_AUTH_TOKEN = "pd3Q6apyv8yfY9lmqOu_9IF8Gy3ldLpd";
const BLYNK_API_URL = `https://blynk.cloud/external/api/get?token=${BLYNK_AUTH_TOKEN}`;

// Initialize Chart
const ctx = document.getElementById('stormChart').getContext('2d');
let stormChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Distance (KM)',
            data: [],
            borderColor: '#07e000',
            backgroundColor: 'rgba(7, 224, 0, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.3
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

// Navigation Logic
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        document.querySelectorAll('.main-section').forEach(s => s.classList.remove('active'));
        document.getElementById(item.dataset.target).classList.add('active');
    });
});

// Flash Effect Function
function triggerFlash() {
    const flash = document.getElementById('flash-effect');
    flash.classList.add('strike-anim');
    setTimeout(() => flash.classList.remove('strike-anim'), 400);
}

// Fetch Data from Blynk
async function updateData() {
    try {
        // We fetch Virtual Pin V1 (Distance)
        const response = await fetch(`${BLYNK_API_URL}&V1`);
        const distance = await response.json();
        
        if (distance === undefined) return;

        // Update UI based on ESP32 Logic
        const distEl = document.getElementById('distance-val');
        const alertEl = document.getElementById('alert-text');
        const banner = document.getElementById('status-banner');
        const dot = document.getElementById('status-dot');
        const connStatus = document.getElementById('connection-status');

        distEl.innerText = distance;
        connStatus.innerText = "CONNECTED TO LIVE DATA";
        dot.style.background = "#07e000";

        // Level Logic
        if (distance <= 10) {
            alertEl.innerText = "DANGER";
            alertEl.style.color = "#f80000";
            banner.className = "status-danger";
            banner.innerText = "CRITICAL: LIGHTNING DETECTED NEARBY!";
            triggerFlash(); 
        } else if (distance <= 20) {
            alertEl.innerText = "WARNING";
            alertEl.style.color = "#ffe000";
            banner.className = "status-warning";
            banner.innerText = "WARNING: STORM IS APPROACHING";
        } else {
            alertEl.innerText = "SAFE";
            alertEl.style.color = "#07e000";
            banner.className = "status-safe";
            banner.innerText = "SYSTEM SECURE - CLEAR SKIES";
        }

        // Update Chart
        const now = new Date();
        const timeLabel = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
        
        if (stormChart.data.labels.length > 20) {
            stormChart.data.labels.shift();
            stormChart.data.datasets[0].data.shift();
        }
        stormChart.data.labels.push(timeLabel);
        stormChart.data.datasets[0].data.push(distance);
        
        // Change chart color based on alert
        stormChart.data.datasets[0].borderColor = (distance <= 10) ? '#f80000' : (distance <= 20 ? '#ffe000' : '#07e000');
        stormChart.update();

    } catch (error) {
        console.error("Blynk Fetch Error:", error);
        document.getElementById('connection-status').innerText = "OFFLINE / ERROR";
        document.getElementById('status-dot').style.background = "#ff0000";
    }
}

// Update every 2 seconds (Matches your timer.setInterval(2000L, checkSensor))
setInterval(updateData, 2000);
