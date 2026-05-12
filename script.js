const CONFIG = {
    TOKEN: "pd3Q6apyv8yfY9lmqOu_9IF8Gy3ldLpd",
    BASE_URL: "https://blynk.cloud/external/api/getAll?token=",
    POLL_RATE: 3000,
    DANGER_KM: 10,
    WARNING_KM: 25
};

let liveChart, pieChart;
let historyData = JSON.parse(localStorage.getItem('storm_log')) || [];

function navigateTo(targetId) {
    document.querySelectorAll('.nav-item, .main-section').forEach(el => el.classList.remove('active'));
    const nav = document.querySelector(`[data-target="${targetId}"]`);
    if(nav) nav.classList.add('active');
    document.getElementById(targetId).classList.add('active');
    if(targetId === 'analytics') renderAnalytics();
    window.scrollTo(0,0);
}

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => navigateTo(item.dataset.target));
});

function initCharts() {
    const ctxL = document.getElementById('liveChart').getContext('2d');
    liveChart = new Chart(ctxL, {
        type: 'line',
        data: { labels: [], datasets: [{ data: [], borderColor: '#ff9f1c', backgroundColor: 'rgba(255, 159, 28, 0.1)', fill: true, tension: 0.4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });

    const ctxP = document.getElementById('pieChart').getContext('2d');
    pieChart = new Chart(ctxP, {
        type: 'doughnut',
        data: { labels: ['Critical', 'Warning', 'Normal'], datasets: [{ data: [0,0,0], backgroundColor: ['#ff4757', '#ffa502', '#00d2ff'], borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

async function syncData() {
    try {
        const response = await fetch(`${CONFIG.BASE_URL}${CONFIG.TOKEN}`);
        const data = await response.json();
        const dist = parseInt(data.V1) || 0;
        updateUI(dist);
        setOnline(true);
    } catch (e) { setOnline(false); }
}

function updateUI(dist) {
    const ts = new Date().toLocaleTimeString('en-GB');
    document.getElementById('live-distance').innerText = `${dist} KM`;
    document.getElementById('myt-clock').innerText = ts;

    let sev = "NORMAL", col = "var(--safe)";
    if (dist > 0 && dist <= CONFIG.DANGER_KM) { sev = "CRITICAL"; col = "var(--danger)"; triggerFlash(); }
    else if (dist > 0 && dist <= CONFIG.WARNING_KM) { sev = "WARNING"; col = "var(--warning)"; }

    const b = document.getElementById('status-banner');
    b.innerText = `STATUS: ${sev}`; b.style.color = col; b.style.borderColor = col;
    document.getElementById('intensity-fill').style.width = `${dist > 0 ? ((40-dist)/40)*100 : 0}%`;
    document.getElementById('intensity-fill').style.background = col;

    if(liveChart.data.labels.length > 15) { liveChart.data.labels.shift(); liveChart.data.datasets[0].data.shift(); }
    liveChart.data.labels.push(ts); liveChart.data.datasets[0].data.push(dist); liveChart.update();

    if(dist > 0) {
        historyData.unshift({ time: ts, dist, level: sev });
        if(historyData.length > 100) historyData.pop();
        localStorage.setItem('storm_log', JSON.stringify(historyData));
        updateHistory();
    }
}

function updateHistory() {
    const b = document.getElementById('history-body');
    b.innerHTML = historyData.slice(0, 10).map(i => `<tr><td>${i.time}</td><td>${i.dist} KM</td><td style="color:${i.level === 'CRITICAL' ? 'var(--danger)' : 'var(--warning)'}">${i.level}</td></tr>`).join('');
}

function renderAnalytics() {
    const total = historyData.length;
    const avg = total > 0 ? (historyData.reduce((a, c) => a + c.dist, 0) / total).toFixed(1) : 0;
    document.getElementById('total-strikes').innerText = total;
    document.getElementById('avg-dist').innerText = `${avg} KM`;
    const c = { CRITICAL: 0, WARNING: 0, NORMAL: 0 };
    historyData.forEach(i => c[i.level]++);
    pieChart.data.datasets[0].data = [c.CRITICAL, c.WARNING, c.NORMAL];
    pieChart.update();
}

function setOnline(o) {
    document.getElementById('status-dot').style.background = o ? "#00ff88" : "var(--danger)";
    document.getElementById('esp-status').innerText = o ? "ONLINE" : "OFFLINE";
}

function triggerFlash() {
    const o = document.getElementById('flash-effect');
    o.classList.add('strike-anim');
    setTimeout(() => o.classList.remove('strike-anim'), 400);
}

function downloadCSV() {
    let c = "Time,Dist,Level\n" + historyData.map(r => `${r.time},${r.dist},${r.level}`).join("\n");
    const b = new Blob([c], { type: 'text/csv' });
    const u = window.URL.createObjectURL(b);
    const l = document.createElement('a');
    l.href = u; l.download = 'StormWatch_Log.csv'; l.click();
}

window.onload = () => { initCharts(); updateHistory(); setInterval(syncData, CONFIG.POLL_RATE); };
