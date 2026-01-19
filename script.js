const BLYNK_TOKEN = "pd3Q6apyv8yfY9lmqOu_9IF8Gy3ldLpd";
const V_DIST = "V1";
const URL_DIST = `https://blynk.cloud/external/api/get?token=${BLYNK_TOKEN}&${V_DIST}`;

// 1. LIGHTNING ANIMATION
const flashEffect = document.getElementById('flash-effect');
function triggerLightning() {
    flashEffect.classList.add('animate-flash');
    setTimeout(() => { flashEffect.classList.remove('animate-flash'); }, 400);
    const nextStrike = Math.random() * (12000 - 4000) + 4000;
    setTimeout(triggerLightning, nextStrike);
}
triggerLightning();

// 2. MOBILE SIDEBAR TOGGLE
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// 3. NAVIGATION
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        document.querySelectorAll('.main-section').forEach(s => s.classList.remove('active'));
        document.getElementById(item.getAttribute('data-target')).classList.add('active');
        
        // Tutup sidebar jika dalam mod mobile
        if(window.innerWidth <= 768) toggleSidebar();
    });
});

// 4. CLOCK
setInterval(() => {
    document.getElementById('malaysia-time').innerText = new Date().toLocaleTimeString('en-US', { hour12: true });
}, 1000);

// 5. CHART
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
            tension: 0.4
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } } }
    }
});

// 6. FETCH BLYNK DATA
async function fetchData() {
    try {
        const resDist = await fetch(URL_DIST);
        const distance = parseInt(await resDist.text());
        
        if (!isNaN(distance)) {
            updateDashboard(distance);
            setOnlineStatus(true);
        }
    } catch (e) {
        setOnlineStatus(false);
    }
}

function setOnlineStatus(isOnline) {
    const statusText = document.getElementById('esp-status');
    const dot = document.getElementById('status-dot');
    statusText.innerText = isOnline ? "ONLINE" : "OFFLINE";
    statusText.style.color = isOnline ? "#00ff88" : "#ff4757";
    dot.style.background = isOnline ? "#00ff88" : "#ff4757";
}

function updateDashboard(dist) {
    document.getElementById('storm-distance').innerText = dist + " KM";
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (liveChart.data.labels.length > 10) {
        liveChart.data.labels.shift();
        liveChart.data.datasets[0].data.shift();
    }
    liveChart.data.labels.push(time);
    liveChart.data.datasets[0].data.push(dist);
    liveChart.update();
}

setInterval(fetchData, 5000);
fetchData();
