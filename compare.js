let myChart = null;

document.addEventListener('DOMContentLoaded', () => {
    compareLoans();
});

function calculateEMI(p, r, n) {
    const r_monthly = r / (12 * 100);
    const n_months = n * 12;
    if (r_monthly === 0) return p / n_months;
    const emi = p * r_monthly * Math.pow(1 + r_monthly, n_months) / (Math.pow(1 + r_monthly, n_months) - 1);
    return emi;
}

function updateChart(pA, iA, pB, iB) {
    const canvas = document.getElementById('compareChart');
    if (!canvas) return;

    if (myChart) {
        myChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Loan A', 'Loan B'],
            datasets: [
                {
                    label: 'Principal',
                    data: [pA, pB],
                    backgroundColor: '#007AFF', // Premium blue
                    borderRadius: 6,
                    barThickness: 45,
                    borderSkipped: false,
                },
                {
                    label: 'Total Interest',
                    data: [iA, iB],
                    backgroundColor: '#FF9F0A', // Premium orange
                    borderRadius: 6,
                    barThickness: 45,
                    borderSkipped: false,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    display: true,
                    position: 'bottom',
                    labels: {
                        boxWidth: 10,
                        usePointStyle: true,
                        font: { size: 10, weight: '600' },
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: 12,
                    callbacks: {
                        label: (context) => ` ${context.dataset.label}: ₹ ${Math.round(context.parsed.y).toLocaleString('en-IN')}`
                    }
                }
            },
            scales: {
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: { 
                        color: 'rgba(0,0,0,0.05)',
                        drawBorder: false
                    },
                    ticks: { 
                        font: { size: 9 },
                        callback: function(value) {
                            if (value >= 10000000) return (value/10000000).toFixed(1) + 'Cr';
                            if (value >= 100000) return (value/100000).toFixed(1) + 'L';
                            if (value >= 1000) return (value/1000).toFixed(0) + 'k';
                            return value;
                        }
                    }
                },
                x: {
                    stacked: true,
                    grid: { display: false },
                    ticks: {
                        font: { size: 11, weight: 'bold' }
                    }
                }
            }
        }
    });
}

function compareLoans() {
    const pA = parseFloat(document.getElementById('pA').value) || 0;
    const iRateA = parseFloat(document.getElementById('iA').value) || 0;
    const yA = parseFloat(document.getElementById('yA').value) || 0;

    const pB = parseFloat(document.getElementById('pB').value) || 0;
    const iRateB = parseFloat(document.getElementById('iB').value) || 0;
    const yB = parseFloat(document.getElementById('yB').value) || 0;

    const emiA = calculateEMI(pA, iRateA, yA);
    const emiB = calculateEMI(pB, iRateB, yB);

    const totalPayableA = emiA * yA * 12;
    const totalPayableB = emiB * yB * 12;

    const totalIntA = Math.max(0, totalPayableA - pA);
    const totalIntB = Math.max(0, totalPayableB - pB);

    // Update UI
    document.getElementById('emiA').innerText = '₹ ' + Math.round(emiA).toLocaleString('en-IN');
    document.getElementById('emiB').innerText = '₹ ' + Math.round(emiB).toLocaleString('en-IN');
    document.getElementById('totalIntA').innerText = '₹ ' + Math.round(totalIntA).toLocaleString('en-IN');
    document.getElementById('totalIntB').innerText = '₹ ' + Math.round(totalIntB).toLocaleString('en-IN');

    // Verdict
    const verdictBox = document.getElementById('verdictBox');
    const verdictText = document.getElementById('verdictText');
    
    if (emiA === emiB) {
        verdictText.innerText = "Both loans have equal monthly payments.";
        verdictBox.classList.replace('bg-emerald-500/10', 'bg-slate-500/10');
        verdictBox.classList.replace('text-emerald-500', 'text-slate-500');
    } else {
        const cheaper = emiA < emiB ? "Loan A" : "Loan B";
        const diff = Math.abs(emiA - emiB);
        verdictText.innerText = `${cheaper} is ₹ ${Math.round(diff).toLocaleString('en-IN')} cheaper per month.`;
        verdictBox.classList.replace('bg-slate-500/10', 'bg-emerald-500/10');
        verdictBox.classList.replace('text-slate-500', 'text-emerald-500');
    }

    updateChart(pA, totalIntA, pB, totalIntB);
}

function resetLoans() {
    document.getElementById('pA').value = 1000000;
    document.getElementById('iA').value = 8.5;
    document.getElementById('yA').value = 20;

    document.getElementById('pB').value = 1000000;
    document.getElementById('iB').value = 9.2;
    document.getElementById('yB').value = 20;

    compareLoans();
}

window.resetLoans = resetLoans;
window.compareLoans = compareLoans;
