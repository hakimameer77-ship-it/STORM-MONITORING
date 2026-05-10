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

// Live Clock
function updateClock() {
    const now = new Date();
    document.getElementById('live-clock').innerText = now.toLocaleTimeString('en-US', { hour12: false });
}
setInterval(updateClock, 1000);
updateClock();

// ==========================================
// 2. BLYNK API & SYSTEM CONFIGURATION
// ==========================================
const BLYNK_TOKEN = "pd3Q6apyv8yfY9lmqOu_9IF8Gy3ldLpd"; 
const URL_DIST = `https://blynk.cloud/external/api/get?token=${BLYNK_TOKEN}&V1`;

// Initialize Local Storage for History Log (Saves data even if you refresh)
let systemLogs = JSON.parse(localStorage.getItem('blynkStormLogs')) || [];

// Constants for Alert Thresholds
const DANGER_THRESHOLD = 10; // KM
const WARNING_THRESHOLD = 25; // KM
let lastRecordedDistance = null;

// ==========================================
// 3. CHART INITIALIZATION
// ==========================================
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = '#64748b';

// Live Dashboard Chart
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
            y: { beginAtZero: true, max: 40, grid: { borderDash: [4, 4] } }, 
            x: { grid: { display: false } } 
        } 
    }
});

// Analytics Charts Variables
let barChartInstance = null;
let pieChartInstance = null;

function renderAnalyticsCharts() {
    let d = 0, w = 0, s = 0;
    
    // Count occurrences from history
    systemLogs.forEach(log => {
        if(log.level === 'Danger') d++;
        else if(log.level === 'Warning') w++;
        else s++;
    });

    // Update Dashboard Metrics
    document.getElementById('total-detections').innerText = systemLogs.length;
    let sumDist = systemLogs.reduce((sum, log) => sum + parseInt(log.distance), 0);
    document.getElementById('avg-distance').innerText = systemLogs.length > 0 ? (sumDist / systemLogs.length).toFixed(1) + " KM" : "0 KM";
    document.getElementById('danger-count').innerText = d;
    document.getElementById('warning-count').innerText = w;
    document.getElementById('safe-count').innerText = s;

    // Get last 7 logs for Bar Chart
    const recentLogs = systemLogs.slice(0, 7).reverse();
    const barLabels = recentLogs.map(log => log.time);
    const barData = recentLogs.map(log => log.distance);

    // Destroy old charts to prevent overlapping UI bugs
    if(barChartInstance) barChartInstance.destroy();
    if(pieChartInstance) pieChartInstance.destroy();

    // Re-render Bar Chart
    barChartInstance = new Chart(document.getElementById('barChart').getContext('2d'), {
        type: 'bar',
        data: { 
            labels: barLabels.length ? barLabels : ['No Data'], 
            datasets: [{ 
                label: 'Distance (KM)', 
                data: barData.length ? barData : [0], 
                backgroundColor: '#3b82f6', 
                borderRadius: 4, 
                barThickness: 24 
            }] 
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { legend: { display: false } } 
        }
    });

    // Re-render Pie Chart
    pieChartInstance = new Chart(document.getElementById('pieChart').getContext('2d'), {
        type: 'doughnut',
        data: { 
            labels: ['Critical', 'Elevated', 'Normal'], 
            datasets: [{ 
                data: [d, w, s], 
                backgroundColor: ['#ef4444', '#f59e0b', '#10b981'], 
                borderWidth: 0 
            }] 
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            cutout: '75%', 
            plugins: { legend: { position: 'bottom' } } 
        }
    });
}

// ==========================================
// 4. FETCH BLYNK REALTIME DATA
// ==========================================
async function fetchLiveBlynkData() {
    try {
        const response = await fetch(URL_DIST);
        if (!response.ok) throw new Error("Network response was not ok");
        
        const textData = await response.text();
        const distance = parseInt(textData);

        if (!isNaN(distance)) {
            // Update Connection Status UI
            document.getElementById('blynk-status').innerText = "Connected";
            document.getElementById('blynk-status').style.color = "#10b981";
            document.getElementById('ping-indicator').style.background = "#10b981";

            processLiveData(distance);
        }
    } catch (e) {
        console.error("Blynk Telemetry Sync Error: ", e);
        document.getElementById('blynk-status').innerText = "Disconnected";
        document.getElementById('blynk-status').style.color = "#ef4444";
        document.getElementById('ping-indicator').style.background = "#ef4444";
    }
}

// ==========================================
// 5. PROCESS DATA & LOG HISTORY
// ==========================================
function processLiveData(distance) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
    const dateStr = now.toISOString().split('T')[0];

    // Determine Status
    let level = "Safe";
    let statusHTML = '<span style="color:#10b981; font-weight:600;"><i class="fa-solid fa-shield-check"></i> SAFE: Conditions normal</span>';
    
    if (distance <= DANGER_THRESHOLD) {
        level = "Danger";
        statusHTML = '<span style="color:#ef4444; font-weight:600;"><i class="fa-solid fa-circle-exclamation"></i> CRITICAL: Strike proximity imminent</span>';
    } else if (distance <= WARNING_THRESHOLD) {
        level = "Warning";
        statusHTML = '<span style="color:#f59e0b; font-weight:600;"><i class="fa-solid fa-triangle-exclamation"></i> WARNING: Storm activity detected</span>';
    }

    // Update Live Dashboard UI
    document.getElementById('live-distance').innerText = distance + " KM";
    document.getElementById('live-status').innerHTML = statusHTML;
    document.getElementById('header-status').innerHTML = statusHTML; 
    document.getElementById('latest-status').innerText = level;

    // Update Live Chart Matrix
    if (liveChart.data.labels.length > 20) { 
        liveChart.data.labels.shift(); 
        liveChart.data.datasets[0].data.shift(); 
    }
    liveChart.data.labels.push(timeStr); 
    liveChart.data.datasets[0].data.push(distance);
    liveChart.update();

    // LOG TO HISTORY (Only log if distance changes to avoid spamming identical rows)
    if (distance !== lastRecordedDistance) {
        const newLog = {
            date: dateStr,
            time: timeStr,
            distance: distance,
            level: level
        };

        // Add to front of array (newest first)
        systemLogs.unshift(newLog);

        // Keep maximum history size to 200 to prevent browser lag
        if (systemLogs.length > 200) systemLogs.pop();

        // Save to browser memory
        localStorage.setItem('blynkStormLogs', JSON.stringify(systemLogs));
        
        lastRecordedDistance = distance;

        // Refresh UI
        populateHistoryTable();
        renderAnalyticsCharts();
    }
}

// ==========================================
// 6. POPULATE HISTORY TABLE
// ==========================================
function populateHistoryTable() {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = ""; 

    systemLogs.forEach(record => {
        let badgeClass = record.level.toLowerCase();
        const row = `<tr>
            <td><span class="badge ${badgeClass}">${record.level}</span></td>
            <td>${record.date}</td>
            <td>${record.time}</td>
            <td><strong>${record.distance} KM</strong></td>
            <td>RF Signal Logged</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

// ==========================================
// 7. CSV REPORT EXPORT
// ==========================================
function downloadExcel() {
    if (systemLogs.length === 0) {
        alert("No data to export. Waiting for Blynk data...");
        return;
    }
    
    let csv = "Severity,Date,Time,Distance(KM),Event Classification\n";
    systemLogs.forEach(row => {
        csv += `${row.level},${row.date},${row.time},${row.distance},RF Signal Logged\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'StormWatch_Live_Log.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Clear Data Function
function clearSystemData() {
    if(confirm("Are you sure you want to delete all recorded history? This cannot be undone.")) {
        localStorage.removeItem('blynkStormLogs');
        systemLogs = [];
        lastRecordedDistance = null;
        populateHistoryTable();
        renderAnalyticsCharts();
        alert("System logs cleared.");
    }
}

// ==========================================
// 8. SYSTEM BOOTUP
// ==========================================
window.onload = () => {
    // Render initial history if data exists in local storage
    populateHistoryTable();
    renderAnalyticsCharts();
    
    // Fetch live data immediately, then every 3 seconds for fast realtime updates
    fetchLiveBlynkData();
    setInterval(fetchLiveBlynkData, 3000); 
};
