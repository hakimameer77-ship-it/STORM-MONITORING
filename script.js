// ==========================================
// 1. TAB NAVIGATION LOGIC
// ==========================================
function switchTab(tabId) {
    // Hide all contents
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    // Show selected content
    document.getElementById(tabId).classList.add('active');
    
    // Update active state in sidebar
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

// ==========================================
// 2. MOCK DATABASE (HISTORY & ANALYTICS)
// ==========================================
// Generating fake historical data to populate the Analytics and Alerts History
let dbHistory = [];
const locations = ["Sector A", "Sector B", "Sector C", "Main Campus", "Hostel Area"];

function generateMockData() {
    let dangerCount = 0;
    let warningCount = 0;
    let safeCount = 0;
    let totalDistance = 0;

    for (let i = 0; i < 50; i++) {
        let dist = Math.floor(Math.random() * 40) + 1; // 1 to 40 KM
        let level = "Safe";
        if (dist <= 10) { level = "Danger"; dangerCount++; }
        else if (dist <= 25) { level = "Warning"; warningCount++; }
        else { safeCount++; }

        let date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 7)); // Random day in last 7 days
        
        dbHistory.push({
            date: date.toISOString().split('T')[0],
            time: date.toTimeString().split(' ')[0],
            distance: dist,
            alertLevel: level,
            location: locations[Math.floor(Math.random() * locations.length)]
        });
        totalDistance += dist;
    }

    // Sort by newest time
    dbHistory.sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time));

    // Update Analytics UI
    document.getElementById('total-detections').innerText = dbHistory.length;
    document.getElementById('avg-distance').innerText = (totalDistance / dbHistory.length).toFixed(1) + " KM";
    
    // Update Alerts Summary UI
    document.getElementById('danger-count').innerText = dangerCount;
    document.getElementById('warning-count').innerText = warningCount;
    document.getElementById('safe-count').innerText = safeCount;

    populateTable();
    initAnalyticsCharts(dangerCount, warningCount, safeCount);
}

// ==========================================
// 3. POPULATE HISTORY TABLE
// ==========================================
function populateTable() {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = ""; // clear existing

    dbHistory.forEach(record => {
        let icon = "";
        let badgeClass = "";
        
        if(record.alertLevel === "Danger") { icon = "fa-triangle-exclamation text-danger"; badgeClass = "danger"; }
        else if(record.alertLevel === "Warning") { icon = "fa-shield-halved text-warning"; badgeClass = "warning"; }
        else { icon = "fa-circle-check text-safe"; badgeClass = "safe"; }

        const row = `<tr>
            <td><i class="fa-solid ${icon}"></i></td>
            <td>${record.date}</td>
            <td>${record.time}</td>
            <td>${record.distance} KM</td>
            <td><span class="badge ${badgeClass}">${record.alertLevel}</span></td>
            <td>${record.location}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

// ==========================================
// 4. EXPORT TO EXCEL FUNCTION
// ==========================================
function downloadExcel() {
    if (dbHistory.length === 0) {
        alert("No data available to export.");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    // CSV Headers
    csvContent += "Date,Time,Distance (KM),Alert Level,Location\r\n";
    
    // CSV Rows
    dbHistory.forEach(row => {
        let rowString = `${row.date},${row.time},${row.distance},${row.alertLevel},${row.location}`;
        csvContent += rowString + "\r\n";
    });

    // Create Download Link
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Lightning_Alert_History.csv");
    document.body.appendChild(link);
    
    // Trigger Download
    link.click();
    document.body.removeChild(link);
}

// ==========================================
// 5. CHART.JS INITIALIZATION (ANALYTICS)
// ==========================================
function initAnalyticsCharts(d, w, s) {
    // Trend Bar Chart
    const ctxBar = document.getElementById('barChart').getContext('2d');
    new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Total Detections',
                data: [12, 19, 3, 5, 2, 25, 10], // Simulated trend data
                backgroundColor: '#3b82f6',
                borderRadius: 4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Pie Chart
    const ctxPie = document.getElementById('pieChart').getContext('2d');
    new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: ['Danger', 'Warning', 'Safe'],
            datasets: [{
                data: [d, w, s],
                backgroundColor: ['#ef4444', '#f59e0b', '#22c55e'],
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '70%' }
    });
}

// ==========================================
// 6. LIVE DASHBOARD FETCHING (CLOUD API)
// ==========================================
// Ensure this token matches your ESP32 Arduino code!
const CLOUD_TOKEN = "pd3Q6apyv8yfY9lmqOu_9IF8Gy3ldLpd"; 
const URL_DIST = `https://blynk.cloud/external/api/get?token=${CLOUD_TOKEN}&V1`;

// Setup Live Chart on Dashboard Tab
const ctxLive = document.getElementById('liveChart').getContext('2d');
const liveChart = new Chart(ctxLive, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Live Distance (KM)',
            data: [],
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            fill: true, tension: 0.4
        }]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

async function fetchLiveCloudData() {
    try {
        const response = await fetch(URL_DIST);
        const data = await response.text();
        const distance = parseInt(data);

        if (!isNaN(distance)) {
            document.getElementById('live-distance').innerText = distance + " KM";
            
            let statusEl = document.getElementById('live-status');
            if (distance <= 10) {
                statusEl.innerHTML = '<span class="text-danger"><strong>DANGER:</strong> Storm very close</span>';
            } else if (distance <= 25) {
                statusEl.innerHTML = '<span class="text-warning"><strong>WARNING:</strong> Storm approaching</span>';
            } else {
                statusEl.innerHTML = '<span class="text-safe"><strong>SAFE:</strong> Clear skies</span>';
            }

            // Update Live Dashboard Chart
            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second:'2-digit' });
            if (liveChart.data.labels.length > 15) {
                liveChart.data.labels.shift();
                liveChart.data.datasets[0].data.shift();
            }
            liveChart.data.labels.push(now);
            liveChart.data.datasets[0].data.push(distance);
            liveChart.update();
        }
    } catch (error) {
        console.error("Error fetching live data.");
    }
}

// ==========================================
// 7. INITIALIZE SYSTEM
// ==========================================
window.onload = () => {
    generateMockData(); // Generate data for Analytics and History Table
    setInterval(fetchLiveCloudData, 5000); // Fetch live data every 5 seconds
    fetchLiveCloudData();
};
