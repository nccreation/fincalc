/**
 * EMI Calculator Logic & DOM Updates
 */

let isYears = true;
let myChart = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Theme application is handled in HTML script as well but helpful here for persistence
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
        document.documentElement.classList.add('dark');
    }
    updateCalculation();
});

function updateChart(principal, totalInterest) {
    const canvas = document.getElementById('emiChart');
    if (!canvas) return;

    if (myChart) {
        myChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    
    // Premium Blue & Orange Palette (iPhone-like)
    const principalColor = '#2196F3'; 
    const interestColor = '#FF9F0A';

    // If both are 0, show a secondary grey ring
    const hasData = principal > 0 || totalInterest > 0;
    const plotData = hasData ? [principal, totalInterest] : [1];
    const plotColors = hasData ? [principalColor, interestColor] : ['#e2e8f0'];

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal', 'Interest'],
            datasets: [{
                data: plotData,
                backgroundColor: plotColors,
                borderWidth: 0,
                hoverOffset: hasData ? 15 : 0,
                borderRadius: hasData ? 6 : 0
            }]
        },
        options: {
            cutout: '82%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: hasData,
                    callbacks: {
                        label: function(context) {
                            let value = context.parsed || 0;
                            return ' ₹ ' + Math.round(value).toLocaleString('en-IN');
                        }
                    },
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: 12,
                    titleFont: { size: 10 },
                    bodyFont: { size: 14, weight: 'bold' }
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

function toggleTenure(val) {
    isYears = val;
    const yrBtn = document.getElementById('yrBtn');
    const moBtn = document.getElementById('moBtn');
    
    if (isYears) {
        yrBtn.classList.add('bg-white', 'dark:bg-white/10', 'shadow-sm', 'text-black', 'dark:text-white');
        yrBtn.classList.remove('text-slate-500', 'dark:text-slate-400');
        
        moBtn.classList.remove('bg-white', 'dark:bg-white/10', 'shadow-sm', 'text-black', 'dark:text-white');
        moBtn.classList.add('text-slate-500', 'dark:text-slate-400');
    } else {
        moBtn.classList.add('bg-white', 'dark:bg-white/10', 'shadow-sm', 'text-black', 'dark:text-white');
        moBtn.classList.remove('text-slate-500', 'dark:text-slate-400');
        
        yrBtn.classList.remove('bg-white', 'dark:bg-white/10', 'shadow-sm', 'text-black', 'dark:text-white');
        yrBtn.classList.add('text-slate-500', 'dark:text-slate-400');
    }
    updateCalculation();
}

function updateCalculation() {
    const amountInput = document.getElementById('amount');
    const rateInput = document.getElementById('rate');
    const tenureInput = document.getElementById('tenure');

    const principal = parseFloat(amountInput.value) || 0;
    const rate = parseFloat(rateInput.value) || 0;
    const tenure = parseFloat(tenureInput.value) || 0;

    const emiRes = document.getElementById('emiRes');
    const interestRes = document.getElementById('interestRes');
    const totalRes = document.getElementById('totalRes');

    if (principal <= 0 || tenure <= 0) {
        emiRes.innerText = "₹ 0";
        interestRes.innerText = "₹ 0";
        totalRes.innerText = "₹ 0";
        updateChart(0, 0);
        return;
    }

    const r = rate / (12 * 100);
    const n = isYears ? tenure * 12 : tenure;

    let emi, totalAmount, totalInterest;

    if (r === 0) {
        emi = principal / n;
        totalAmount = principal;
        totalInterest = 0;
    } else {
        // EMI = [P x R x (1+R)^N]/[(1+R)^N-1]
        emi = principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
        totalAmount = emi * n;
        totalInterest = totalAmount - principal;
    }

    // Numerical Updates
    emiRes.innerText = '₹ ' + Math.round(emi).toLocaleString('en-IN');
    interestRes.innerText = '₹ ' + Math.round(totalInterest).toLocaleString('en-IN');
    totalRes.innerText = '₹ ' + Math.round(totalAmount).toLocaleString('en-IN');
    
    // Real-time Chart Update
    updateChart(principal, totalInterest);
}

function resetEMI() {
    document.getElementById('amount').value = 1000000;
    document.getElementById('rate').value = 8.5;
    document.getElementById('tenure').value = 5;
    toggleTenure(true); // Default to Years
    updateCalculation();
}

// Attach to global window object for HTML onclick/oninput handlers
window.toggleTenure = toggleTenure;
window.updateCalculation = updateCalculation;
window.resetEMI = resetEMI;
