// ==========================================
// 1. UI & NAVIGATION LOGIC
// ==========================================
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.main-section');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        const targetId = item.getAttribute('data-target');
        
        // Update Nav Active State
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // Update Section Active State
        sections.forEach(sec => {
            sec.classList.remove('active');
            if (sec.id === targetId) sec.classList.add('active');
        });

        // Close mobile menu if open
        if (window.innerWidth <= 850) {
            document.getElementById('nav-links').classList.remove('open');
        }
    });
});

function toggleMenu() {
    document.getElementById('nav-links').classList.toggle('open');
}

// Live Clock (MYT)
function updateClock() {
    const now = new Date();
    const clockEl = document.getElementById('myt-clock');
    if (clockEl) {
        clockEl.innerText = now.toLocaleTimeString('en-GB', { hour12: false });
    }
}
setInterval(updateClock, 1000);

// ==========================================
// 2. BLYNK API CONFIGURATION
// ==========================================
const BLYNK_TOKEN = "pd3Q6apyv8yfY9lmqOu_9IF8Gy3ldLpd"; 
const URL_GET_ALL = `https://blynk.cloud/external/api/getAll?token=${BLYNK_TOKEN}`;

const DANGER_THRESHOLD = 10; // KM
const WARNING_THRESHOLD = 25; // KM

// ==========================================
// 3. CHART INITIALIZATION
// ==========================================
let lightningChart;
const ctx = document.getElementById('lightningChart').getContext('2d');

lightningChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Intensity (KM)',
            data: [],
            borderColor: '#ff9f1c',
            backgroundColor: 'rgba(255, 159, 28, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 2
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, max: 40, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { grid: { display: false } }
        }
    }
});

// ==========================================
// 4. DATA FETCHING & PROCESSING
// ==========================================
async function fetchStormData() {
    try {
        const response = await fetch(URL_GET_ALL);
        const data = await response.json();
        
        // V1: Distance, V2: Intensity (Percentage)
        const distance = parseInt(data.V1) || 0;
        const intensity = parseInt(data.V2) || 0;

        updateDashboardUI(distance, intensity);
        updateSystemStatus(true);
    } catch (error) {
        console.error("Blynk Connection Error:", error);
        updateSystemStatus(false);
    }
}

function updateDashboardUI(distance, intensity) {
    const stormDistEl = document.getElementById('storm-distance');
    const intensityFill = document.getElementById('intensity-fill');
    const intensityText = document.getElementById('intensity-text');
    const statusBanner = document.getElementById('status-banner');
    const flashOverlay = document.getElementById('flash-effect');

    // 1. Update Distance
    stormDistEl.innerText = `${distance} KM`;

    // 2. Logic for Severity
    let color = 'var(--safe)';
    let message = "SYSTEM ACTIVE: SKY CLEAR";
    let intensityMsg = "Normal Atmospheric Conditions";

    if (distance <= DANGER_THRESHOLD && distance > 0) {
        color = 'var(--danger)';
        message = "CRITICAL: LIGHTNING STRIKE PROXIMITY";
        intensityMsg = "High Electrostatic Discharge";
        
        // Trigger Flash Effect
        flashOverlay.classList.add('strike-anim');
        setTimeout(() => flashOverlay.classList.remove('strike-anim'), 400);
    } else if (distance <= WARNING_THRESHOLD && distance > 0) {
        color = 'var(--warning)';
        message = "WARNING: STORM ACTIVITY DETECTED";
        intensityMsg = "Elevated Storm Intensity";
    }

    // 3. Update Visual Elements
    statusBanner.innerText = message;
    statusBanner.style.borderColor = color;
    statusBanner.style.color = color;
    
    intensityFill.style.width = `${intensity}%`;
    intensityFill.style.background = color;
    intensityText.innerText = intensityMsg;

    // 4. Update Chart
    const timestamp = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (lightningChart.data.labels.length > 15) {
        lightningChart.data.labels.shift();
        lightningChart.data.datasets[0].data.shift();
    }
    lightningChart.data.labels.push(timestamp);
    lightningChart.data.datasets[0].data.push(distance);
    lightningChart.update();
}

function updateSystemStatus(isOnline) {
    const dot = document.getElementById('status-dot');
    const statusText = document.getElementById('esp-status');
    
    if (isOnline) {
        dot.style.background = "#00ff88";
        statusText.innerText = "ONLINE";
    } else {
        dot.style.background = "var(--danger)";
        statusText.innerText = "OFFLINE";
    }
}

// ==========================================
// 5. INITIALIZATION
// ==========================================
window.onload = () => {
    updateClock();
    fetchStormData();
    setInterval(fetchStormData, 3000); // Poll every 3 seconds
};
