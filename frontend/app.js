// Document Elements
const sidebarLinks = document.querySelectorAll('.menu-item');
const views = document.querySelectorAll('.view-panel');
const assessmentForm = document.getElementById('assessment-form');
const resetBtn = document.getElementById('btn-reset');
const clearLogsBtn = document.getElementById('btn-clear-logs');
const searchInput = document.getElementById('log-search');
const filterStatus = document.getElementById('log-filter-status');

// Form Input Fields
const inpAge = document.getElementById('person_age');
const inpGender = document.getElementById('person_gender');
const inpEducation = document.getElementById('person_education');
const inpHome = document.getElementById('person_home_ownership');
const inpIncome = document.getElementById('person_income');
const inpExp = document.getElementById('person_emp_exp');
const inpCreditScore = document.getElementById('credit_score');
const inpCredLen = document.getElementById('cb_person_cred_hist_length');
const inpDefaults = document.getElementById('previous_loan_defaults_on_file');
const inpLoan = document.getElementById('loan_amnt');
const inpIntent = document.getElementById('loan_intent');
const inpRate = document.getElementById('loan_int_rate');
const inpDti = document.getElementById('loan_percent_income');

// Result Output Fields
const resPlaceholder = document.getElementById('results-placeholder');
const resActive = document.getElementById('results-active');
const resGaugeFill = document.getElementById('gauge-fill');
const resProbText = document.getElementById('res-prob');
const resBadge = document.getElementById('res-badge');
const recCap = document.getElementById('rec-cap');
const recEmi = document.getElementById('rec-emi');
const recDecision = document.getElementById('rec-decision');
const resDrivers = document.getElementById('res-drivers');

const API_BASE = 'http://127.0.0.1:8000';

// Central Application Logs State
let assessments = [];

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    setupNavigation();
    setupCalculations();
    
    // Fetch initial database records at startup
    await loadLogsFromBackend();
    renderDashboard();
    renderLogsTable();
});

// Fetch assessments from FastAPI backend database
async function loadLogsFromBackend() {
    try {
        const response = await fetch(`${API_BASE}/api/history`);
        if (response.ok) {
            assessments = await response.json();
        } else {
            console.error('Failed to fetch historical logs from server');
        }
    } catch (err) {
        console.error('Network error loading history:', err);
    }
}

// Navigation Tab Switching
function setupNavigation() {
    sidebarLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-target');
            
            // Toggle active classes in menu
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Switch views
            views.forEach(view => {
                view.classList.remove('active');
                if (view.getAttribute('id') === target) {
                    view.classList.add('active');
                }
            });

            // Re-render views on transitions
            if (target === 'dashboard') {
                await loadLogsFromBackend();
                renderDashboard();
            } else if (target === 'logs') {
                await loadLogsFromBackend();
                renderLogsTable();
            }
        });
    });
}

// Debt-to-income live auto calculation
function setupCalculations() {
    const updateDTI = () => {
        const income = parseFloat(inpIncome.value) || 0;
        const loan = parseFloat(inpLoan.value) || 0;
        
        if (income > 0 && loan > 0) {
            const ratio = (loan / income) * 100;
            inpDti.value = ratio.toFixed(2) + '%';
        } else {
            inpDti.value = '';
        }
    };

    inpIncome.addEventListener('input', updateDTI);
    inpLoan.addEventListener('input', updateDTI);

    // Form submission
    assessmentForm.addEventListener('submit', handleFormSubmit);

    // Reset button
    resetBtn.addEventListener('click', () => {
        assessmentForm.reset();
        inpDti.value = '';
        resActive.style.display = 'none';
        resPlaceholder.style.display = 'flex';
    });

    // Clear logs button
    clearLogsBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear all database logs? This cannot be undone.')) {
            try {
                const response = await fetch(`${API_BASE}/api/history`, { method: 'DELETE' });
                if (response.ok) {
                    assessments = [];
                    renderLogsTable();
                } else {
                    alert('Error clearing historical logs on backend.');
                }
            } catch (err) {
                console.error(err);
                alert('Network error connecting to API.');
            }
        }
    });

    // Search and filters
    searchInput.addEventListener('input', renderLogsTable);
    filterStatus.addEventListener('change', renderLogsTable);
}

// Render Dashboard widgets
function renderDashboard() {
    const total = assessments.length;
    document.getElementById('kpi-total').textContent = total;

    if (total === 0) {
        document.getElementById('kpi-approvals').textContent = '0%';
        document.getElementById('kpi-warnings').textContent = '0';
        document.getElementById('kpi-credit').textContent = 'N/A';
        document.getElementById('dashboard-recent-rows').innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--text-secondary);">No applications processed yet.</td>
            </tr>
        `;
        document.getElementById('intent-share-container').innerHTML = `
            <div style="text-align: center; color: var(--text-secondary)">No intents loaded yet.</div>
        `;
        return;
    }

    const approvals = assessments.filter(x => x.risk < 30).length;
    const approvalRate = ((approvals / total) * 100).toFixed(0) + '%';
    document.getElementById('kpi-approvals').textContent = approvalRate;

    const highRisks = assessments.filter(x => x.risk >= 50).length;
    document.getElementById('kpi-warnings').textContent = highRisks;

    const avgCredit = (assessments.reduce((sum, item) => sum + item.credit_score, 0) / total).toFixed(0);
    document.getElementById('kpi-credit').textContent = avgCredit;

    // Recent 5 rows
    const sorted = [...assessments].sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = sorted.slice(0, 5);

    let recentHtml = '';
    recent.forEach(app => {
        let statusBadge = '';
        if (app.decision === 'Approved') {
            statusBadge = `<span class="badge success">Approved</span>`;
        } else if (app.decision === 'Rejected') {
            statusBadge = `<span class="badge danger">Rejected</span>`;
        } else {
            statusBadge = `<span class="badge info">Conditional</span>`;
        }

        const riskColor = app.risk >= 50 ? 'text-danger' : (app.risk >= 30 ? 'text-warning' : 'text-success');

        recentHtml += `
            <tr>
                <td>
                    <div style="font-weight: 600;">Applicant (Age ${app.age})</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${app.education} Education</div>
                </td>
                <td>
                    <div style="font-weight: 500;">$${app.loan.toLocaleString()}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${app.intent} Purpose</div>
                </td>
                <td>$${app.income.toLocaleString()}</td>
                <td class="${riskColor} font-bold">${app.risk.toFixed(1)}%</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    });
    document.getElementById('dashboard-recent-rows').innerHTML = recentHtml;

    // Intent breakdown
    const intentCounts = {};
    assessments.forEach(item => {
        intentCounts[item.intent] = (intentCounts[item.intent] || 0) + 1;
    });

    let intentHtml = '';
    Object.keys(intentCounts).forEach(intent => {
        const count = intentCounts[intent];
        const percent = ((count / total) * 100).toFixed(0);
        intentHtml += `
            <div>
                <div class="flex-between" style="font-size: 0.8125rem; margin-bottom: 6px;">
                    <span>${intent}</span>
                    <span style="color: var(--text-secondary); font-weight: 500;">${count} (${percent}%)</span>
                </div>
                <div style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 999px; overflow: hidden;">
                    <div style="width: ${percent}%; height: 100%; background: var(--color-accent); border-radius: 999px;"></div>
                </div>
            </div>
        `;
    });
    document.getElementById('intent-share-container').innerHTML = intentHtml;
}

// Render Historical Table log records
function renderLogsTable() {
    const search = searchInput.value.toLowerCase();
    const status = filterStatus.value;

    let filtered = assessments.filter(item => {
        if (status !== 'all') {
            if (status === 'Approved' && item.decision !== 'Approved') return false;
            if (status === 'Rejected' && item.decision !== 'Rejected') return false;
        }

        if (search) {
            const matchIntent = item.intent.toLowerCase().includes(search);
            const matchEdu = item.education.toLowerCase().includes(search);
            return matchIntent || matchEdu;
        }

        return true;
    });

    if (filtered.length === 0) {
        document.getElementById('logs-rows').innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: var(--text-secondary);">No assessment records found.</td>
            </tr>
        `;
        return;
    }

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    let tableHtml = '';
    filtered.forEach(item => {
        const dateStr = new Date(item.date).toLocaleString(undefined, { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        let statusBadge = '';
        if (item.decision === 'Approved') {
            statusBadge = `<span class="badge success">Approved</span>`;
        } else if (item.decision === 'Rejected') {
            statusBadge = `<span class="badge danger">Rejected</span>`;
        } else {
            statusBadge = `<span class="badge info">Conditional</span>`;
        }

        const riskColor = item.risk >= 50 ? 'text-danger' : (item.risk >= 30 ? 'text-warning' : 'text-success');

        tableHtml += `
            <tr>
                <td>${dateStr}</td>
                <td>
                    <div style="font-weight: 500;">${item.gender.toUpperCase()}, ${item.age}y</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${item.education} / ${item.home}</div>
                </td>
                <td>
                    <div>$${item.income.toLocaleString()}/yr</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${item.exp} yrs exp</div>
                </td>
                <td style="font-weight: 600;">$${item.loan.toLocaleString()}</td>
                <td><span style="font-size: 0.8125rem; font-weight: 500;">${item.intent}</span></td>
                <td>
                    <div style="font-weight: 600;">${item.credit_score}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${item.cred_len}y cred hist</div>
                </td>
                <td class="${riskColor} font-bold">${item.risk.toFixed(1)}%</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    });
    document.getElementById('logs-rows').innerHTML = tableHtml;
}

// Handle dynamic model evaluation request
async function handleFormSubmit(e) {
    e.preventDefault();

    // 1. Capture Form Values
    const age = parseInt(inpAge.value);
    const gender = inpGender.value;
    const education = inpEducation.value;
    const home = inpHome.value;
    const income = parseFloat(inpIncome.value);
    const exp = parseInt(inpExp.value);
    const creditScore = parseInt(inpCreditScore.value);
    const credLen = parseInt(inpCredLen.value);
    const defaults = inpDefaults.value;
    const loan = parseFloat(inpLoan.value);
    const intent = inpIntent.value;
    const rate = parseFloat(inpRate.value);

    // 2. Front End Validation Check
    if (exp > (age - 15)) {
        alert("Employment experience years cannot exceed historical active working age limit (Age - 15).");
        return;
    }
    if (credLen > (age - 15)) {
        alert("Credit history length cannot exceed historical active age limit (Age - 15).");
        return;
    }

    // 3. Assemble JSON Payload matching Backend schema
    const payload = {
        person_age: age,
        person_gender: gender,
        person_education: education,
        person_income: income,
        person_emp_exp: exp,
        person_home_ownership: home,
        loan_amnt: loan,
        loan_intent: intent,
        loan_int_rate: rate,
        loan_percent_income: loan / income, // Ratio value (e.g. 0.33)
        cb_person_cred_hist_length: credLen,
        credit_score: creditScore,
        previous_loan_defaults_on_file: defaults
    };

    // 4. Submit POST Request to FastAPI model API
    try {
        const response = await fetch(`${API_BASE}/api/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json();
            alert('Prediction Error: ' + (errData.detail || 'Server encountered an issue.'));
            return;
        }

        const result = await response.json();

        // 5. Update UI results card
        resPlaceholder.style.display = 'none';
        resActive.style.display = 'block';

        // Animate circular gauge fill (circumference offset is 220 -> 110)
        const riskProb = result.risk;
        const offset = 220 - ((riskProb / 100) * 110);
        resGaugeFill.style.strokeDashoffset = offset;

        // Apply status class colors
        let statusClass = 'safe';
        let gaugeColor = 'var(--color-success)';
        if (riskProb >= 50.0) {
            statusClass = 'danger';
            gaugeColor = 'var(--color-danger)';
        } else if (riskProb >= 30.0) {
            statusClass = 'warning';
            gaugeColor = 'var(--color-warning)';
        }
        resGaugeFill.style.stroke = gaugeColor;

        resProbText.textContent = riskProb.toFixed(1) + '%';
        resProbText.style.color = gaugeColor;

        resBadge.textContent = result.decision;
        resBadge.className = `result-badge ${statusClass === 'warning' ? 'danger' : statusClass}`;

        recCap.textContent = `$${result.recommended_cap.toLocaleString()}`;
        recEmi.textContent = `$${result.affordable_emi.toLocaleString()}/mo`;
        
        let decisionText = '';
        if (result.decision === 'Approved') {
            decisionText = `<span class="text-success">Approved (Low Risk)</span>`;
        } else if (result.decision === 'Rejected') {
            decisionText = `<span class="text-danger">Declined (High Risk)</span>`;
        } else {
            decisionText = `<span class="text-warning">Review Needed (Medium Risk)</span>`;
        }
        recDecision.innerHTML = decisionText;

        // Drivers rendering
        if (result.drivers.length === 0) {
            resDrivers.innerHTML = `
                <div class="factor-item">
                    <i class="fa-solid fa-circle-check text-success"></i> No critical triggers recorded.
                </div>
            `;
        } else {
            resDrivers.innerHTML = result.drivers.map(item => `
                <div class="factor-item ${item.positive ? 'positive' : 'negative'}">
                    <i class="fa-solid ${item.positive ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i>
                    <span>${item.text}</span>
                </div>
            `).join('');
        }

        // Reload data from backend to sync table state
        await loadLogsFromBackend();

    } catch (err) {
        console.error(err);
        alert('Network error connecting to FastAPI credit evaluation server.');
    }
}
