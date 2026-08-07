// Configuration & Baselines (Adjust these values to match your business model)
const CONFIG = {
  fixedDailyBaseline: 15.00,    // Daily Amortization + Time-Duration Maintenance
  fixedWeeklyBaseline: 105.00,  // Weekly Amortization + Time-Duration Maintenance
  fixedMonthlyBaseline: 450.00, // Monthly Amortization + Time-Duration Maintenance
  costPerKm: 0.12               // Dynamic variable cost per kilometer (fuel + wear/tear maintenance)
};

// State Management
let sessions = JSON.parse(localStorage.getItem('breakEvenSessions')) || [];

document.getElementById('sessionForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const startOdo = parseFloat(document.getElementById('startOdo').value);
  const endOdo = parseFloat(document.getElementById('endOdo').value);

  if (endOdo <= startOdo) {
    alert('End odometer must be greater than start odometer.');
    return;
  }

  const distance = endOdo - startOdo;
  const variableCost = distance * CONFIG.costPerKm;
  const sessionDate = new Date().toISOString();

  const newSession = {
    date: sessionDate,
    distance: distance,
    variableCost: variableCost
  };

  sessions.unshift(newSession);
  localStorage.setItem('breakEvenSessions', JSON.stringify(sessions));

  document.getElementById('sessionForm').reset();
  updateDashboard();
});

function updateDashboard() {
  const now = new Date();
  const todayStr = now.toDateString();
  const currentWeek = getWeekNumber(now);
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let todayKm = 0;
  let weekKm = 0;
  let monthKm = 0;

  const tableBody = document.getElementById('sessionTableBody');
  tableBody.innerHTML = '';

  sessions.forEach(session => {
    const sessionDate = new Date(session.date);
    
    // Populate Table
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${sessionDate.toLocaleDateString()} ${sessionDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
      <td>${session.distance.toFixed(1)} km</td>
      <td>$${session.variableCost.toFixed(2)}</td>
    `;
    tableBody.appendChild(row);

    // Aggregate Daily
    if (sessionDate.toDateString() === todayStr) {
      todayKm += session.distance;
    }

    // Aggregate Weekly
    if (getWeekNumber(sessionDate) === currentWeek && sessionDate.getFullYear() === currentYear) {
      weekKm += session.distance;
    }

    // Aggregate Monthly
    if (sessionDate.getMonth() === currentMonth && sessionDate.getFullYear() === currentYear) {
      monthKm += session.distance;
    }
  });

  // Calculate Total Break-Even Targets: Fixed Baseline + (Actual Kilometers * Cost per km)
  const dailyTotal = CONFIG.fixedDailyBaseline + (todayKm * CONFIG.costPerKm);
  const weeklyTotal = CONFIG.fixedWeeklyBaseline + (weekKm * CONFIG.costPerKm);
  const monthlyTotal = CONFIG.fixedMonthlyBaseline + (monthKm * CONFIG.costPerKm);

  // Render to DOM
  document.getElementById('dailyBreakEven').innerText = `$${dailyTotal.toFixed(2)}`;
  document.getElementById('dailyKm').innerText = `${todayKm.toFixed(1)} km logged today`;

  document.getElementById('weeklyBreakEven').innerText = `$${weeklyTotal.toFixed(2)}`;
  document.getElementById('weeklyKm').innerText = `${weekKm.toFixed(1)} km logged this week`;

  document.getElementById('monthlyBreakEven').innerText = `$${monthlyTotal.toFixed(2)}`;
  document.getElementById('monthlyKm').innerText = `${monthKm.toFixed(1)} km logged this month`;
}

// Helper to calculate week number
function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
  return weekNo;
}

// Initial load call
updateDashboard();
