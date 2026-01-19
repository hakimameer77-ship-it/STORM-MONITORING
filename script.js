const BLYNK_TOKEN = "pd3Q6apyv8yfY9lmqOu_9IF8Gy3ldLpd";
const V_DIST = "V1"; 
const V_STAT = "V2"; 

const URL_DIST = `https://blynk.cloud/external/api/get?token=${BLYNK_TOKEN}&${V_DIST}`;
const URL_STAT = `https://blynk.cloud/external/api/get?token=${BLYNK_TOKEN}&${V_STAT}`;

let weeklyStrikes = [0, 0, 0, 0, 0, 0, 0];
let lastStatus = "";

// --- 1. LIGHTNING ANIMATION (NEW) ---
const flashEffect = document.getElementById('flash-effect');

function triggerLightning() {
    flashEffect.classList.add('animate-flash');
    setTimeout(() => { flashEffect.classList.remove('animate-flash'); }, 400);
    
    // Random delay kilat seterusnya antara 4-12 saat
    const nextStrike = Math.random() * (12000 - 4000) + 4000;
    setTimeout(triggerLightning, nextStrike);
}
triggerLightning();

// --- 2. NAVIGATION ---
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        document.querySelectorAll('.main-section').forEach(s => s.classList.remove('active'));
        document.getElementById(item.getAttribute('data-target')).classList.add('active');
    });
});

// --- 3. TIME ---
setInterval(() => {
    document.getElementById('malaysia-time').innerText = new Date().toLocaleTimeString('en-US', { hour12: true });
}, 1000);

// --- 4. CHARTS SETUP ---
const liveChart = new Chart(document.getElementById('lightningChart'), {
    type: 'line',
    data: { 
        labels: [], 
        datasets: [{ 
            label: 'Distance (KM)', 
            data: [], 
            borderColor: '#ff9f1c', 
            fill: true, 
            tension: 0.4, 
            backgroundColor: 'rgba(255,159,28,0.1)' 
        }]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

const weeklyChart = new Chart(document.getElementById('weeklyChart'), {
    type: 'bar',
    data: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [{ label: 'Strikes Count', data: weeklyStrikes, backgroundColor: '#ff9f1c' }]},
    options: { responsive: true, maintainAspectRatio: false }
});

// --- 5. DATA FETCHING (BLYNK) ---
async function fetchData() {
    try {
        const resDist = await fetch(URL_DIST);
        const distance = parseInt(await resDist.text());
        
        const resStat = await fetch(URL_STAT);
        const statusText = (await resStat.text()).trim().toUpperCase();

        if (!isNaN(distance)) {
            updateDashboard(distance, statusText);
            setSystemStatus(true);
        }
    } catch (e) {
        setSystemStatus(false);
    }
}

function setSystemStatus(online) {
    const status = document.getElementById('esp-status');
    const dot = document.getElementById('status-dot');
    status.innerText = online ? "ONLINE" : "OFFLINE";
    status.style.color = online ? "#00ff88" : "#ff4757";
    dot.style.background = online ? "#00ff88" : "#ff4757";
}

function updateDashboard(dist, stat) {
    const statusEl = document.getElementById('lightning-status');
    const distEl = document.getElementById('storm-distance');
    const alertBody = document.getElementById('alertBody');

    distEl.innerText = dist + " KM";
    statusEl.innerText = stat;
    
    let badge = "badge-safe";
    if (stat === "DANGER") badge = "badge-danger";
    else if (stat === "WARNING") badge = "badge-warning";
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (stat !== lastStatus) {
        alertBody.insertAdjacentHTML('afterbegin', `<tr><td>${time}</td><td>${dist} KM</td><td><span class="badge ${badge}">${stat}</span></td><td>Node 01</td></tr>`);
        if (alertBody.children.length > 10) alertBody.lastElementChild.remove();
        lastStatus = stat;
    }

    if (liveChart.data.labels.length > 15) { liveChart.data.labels.shift(); liveChart.data.datasets[0].data.shift(); }
    liveChart.data.labels.push(time);
    liveChart.data.datasets[0].data.push(dist);
    liveChart.update();
}

setInterval(fetchData, 3000);
fetchData();
