const BLYNK_TOKEN = "pd3Q6apyv8yfY9lmqOu_9IF8Gy3ldLpd";
const V_DIST = "V1"; 
const V_STAT = "V2"; 

const URL_DIST = `https://blynk.cloud/external/api/get?token=${BLYNK_TOKEN}&${V_DIST}`;
const URL_STAT = `https://blynk.cloud/external/api/get?token=${BLYNK_TOKEN}&${V_STAT}`;

let weeklyStrikes = [0, 0, 0, 0, 0, 0, 0];
let lastStatus = "";

// --- 1. NAVIGATION ---
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        document.querySelectorAll('.main-section').forEach(s => s.classList.remove('active'));
        document.getElementById(item.getAttribute('data-target')).classList.add('active');
    });
});

// --- 2. TIME ---
setInterval(() => {
    document.getElementById('malaysia-time').innerText = new Date().toLocaleTimeString('en-US', { hour12: true });
}, 1000);

// --- 3. CHARTS SETUP ---
const liveChart = new Chart(document.getElementById('lightningChart'), {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Distance (KM)', data: [], borderColor: '#00d2ff', fill: true, tension: 0.4, backgroundColor: 'rgba(0,210,255,0.05)' }]},
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 40, ticks: { color: '#888' } }, x: { ticks: { color: '#888' } } } }
});

const weeklyChart = new Chart(document.getElementById('weeklyChart'), {
    type: 'bar',
    data: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [{ label: 'Strikes Count', data: weeklyStrikes, backgroundColor: '#4361ee' }]},
    options: { responsive: true, maintainAspectRatio: false }
});

// --- 4. DATA FETCHING ---
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

// --- 5. UI UPDATE ---
function updateDashboard(dist, stat) {
    const statusEl = document.getElementById('lightning-status');
    const iconEl = document.getElementById('activity-icon');
    const distEl = document.getElementById('storm-distance');
    const alertBody = document.getElementById('alertBody');

    distEl.innerText = dist + " KM";
    statusEl.innerText = stat;
    
    statusEl.className = ""; iconEl.className = "card-icon";
    let badge = "badge-safe";

    if (stat === "DANGER") { 
        badge = "badge-danger"; statusEl.classList.add('status-danger'); iconEl.classList.add('bg-danger'); 
    } else if (stat === "WARNING") { 
        badge = "badge-warning"; statusEl.classList.add('status-warning'); iconEl.classList.add('bg-warning'); 
    } else { 
        badge = "badge-safe"; statusEl.classList.add('status-safe'); iconEl.classList.add('bg-safe'); 
    }
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // History Log (Only log if status changes)
    if (stat !== lastStatus) {
        alertBody.insertAdjacentHTML('afterbegin', `<tr><td>${time}</td><td>${dist} KM</td><td><span class="badge ${badge}">${stat}</span></td><td>Node 01</td></tr>`);
        if (alertBody.children.length > 10) alertBody.lastElementChild.remove();
        
        if (stat === "WARNING" || stat === "DANGER") {
            let day = (new Date().getDay() + 6) % 7; 
            weeklyStrikes[day]++;
            weeklyChart.update();
        }
        lastStatus = stat;
    }

    // Chart Update
    if (liveChart.data.labels.length > 20) { liveChart.data.labels.shift(); liveChart.data.datasets[0].data.shift(); }
    liveChart.data.labels.push(time);
    liveChart.data.datasets[0].data.push(dist);
    liveChart.update();
}

// --- 6. EXPORT ---
function downloadCSV() {
    let csv = "Time,Distance,Status,Location\n";
    document.querySelectorAll("#alertBody tr").forEach(tr => {
        csv += Array.from(tr.cells).map(td => td.innerText).join(",") + "\n";
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Storm_Log_${new Date().toLocaleDateString()}.csv`;
    a.click();
}

setInterval(fetchData, 3000);
fetchData();