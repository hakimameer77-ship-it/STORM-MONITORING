// --- CONFIGURATION ---
const BLYNK_TOKEN = "pd3Q6apyv8yfY9lmqOu_9IF8Gy3ldLpd";
const V_DIST = "V1"; 
const URL_DIST = `https://blynk.cloud/external/api/get?token=${BLYNK_TOKEN}&${V_DIST}`;

// --- 1. LIGHTNING STRIKE LOGIC ---
const flashLayer = document.getElementById('flash-effect');
function triggerLightning() {
    flashLayer.classList.add('strike-anim');
    setTimeout(() => flashLayer.classList.remove('strike-anim'), 400);
    
    // Random interval for the next flash (between 5 to 15 seconds)
    const nextStrike = Math.random() * (15000 - 5000) + 5000;
    setTimeout(triggerLightning, nextStrike);
}
triggerLightning();

// --- 2. RESPONSIVE NAVIGATION ---
function toggleMenu() {
    document.getElementById('nav-links').classList.toggle('open');
}

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        // Toggle Active Class in Nav
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        
        // Switch Section
        const target = item.getAttribute('data-target');
        document.querySelectorAll('.main-section').forEach(s => s.classList.remove('active'));
        document.getElementById(target).classList.add('active');
        
        // Close Mobile Menu if open
        if(window.innerWidth <= 850) toggleMenu();
    });
});

// --- 3. REAL-TIME CLOCK (MYT) ---
setInterval(() => {
    document.getElementById('myt-clock').innerText = "MYT Time: " + new Date().toLocaleTimeString('en-US', { hour12: true });
}, 1000);

// --- 4. CHART.JS CONFIGURATION ---
const ctx = document.getElementById('lightningChart').getContext('2d');
const liveChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Distance (KM)',
            data: [],
            borderColor: '#ff9f1c',
            backgroundColor: 'rgba(255,159,28,0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { grid: { display: false } }
        }
    }
});

// --- 5. BLYNK API DATA FETCHING ---
async function fetchBlynkData() {
    try {
        const response = await fetch(URL_DIST);
        const data = await response.text();
        const distance = parseInt(data);

        if (!isNaN(distance)) {
            updateUI(distance);
            setSystemStatus(true);
        } else {
            setSystemStatus(false);
        }
    } catch (error) {
        console.error("Error fetching Blynk data:", error);
        setSystemStatus(false);
    }
}

function setSystemStatus(isOnline) {
    const statusText = document.getElementById('esp-status');
    const dot = document.getElementById('status-dot');
    statusText.innerText = isOnline ? "ONLINE" : "OFFLINE";
    statusText.style.color = isOnline ? "#00ff88" : "#ff4757";
    dot.style.background = isOnline ? "#00ff88" : "#ff4757";
}

function updateUI(dist) {
    document.getElementById('storm-distance').innerText = dist + " KM";
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Limit chart data to last 15 entries
    if (liveChart.data.labels.length > 15) {
        liveChart.data.labels.shift();
        liveChart.data.datasets[0].data.shift();
    }
    
    liveChart.data.labels.push(now);
    liveChart.data.datasets[0].data.push(dist);
    liveChart.update();
}

// Automatically fetch data every 5 seconds
setInterval(fetchBlynkData, 5000);
fetchBlynkData();
