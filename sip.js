let myChart = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Theme application handled by HTML but nice to have
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark');
    }
    updateSIP();
});

function updateChart(invested, returns) {
    const canvas = document.getElementById('sipChart');
    if (!canvas) return;

    if (myChart) {
        myChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    
    // Apple-standard Premium Palette
    const investedColor = '#007AFF'; // Apple Blue
    const returnsColor = '#34C759';  // Apple Green

    const hasData = invested > 0 || returns > 0;
    const plotData = hasData ? [invested, returns] : [1];
    const plotColors = hasData ? [investedColor, returnsColor] : ['#e2e8f0'];

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Invested', 'Returns'],
            datasets: [{
                data: plotData,
                backgroundColor: plotColors,
                borderWidth: 0,
                hoverOffset: hasData ? 12 : 0,
                borderRadius: hasData ? 12 : 0, // More pronounced rounded edges
                spacing: hasData ? 2 : 0        // Slight gap between segments for elegance
            }]
        },
        options: {
            cutout: '85%', // Thinner ring
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: hasData,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: 12,
                    displayColors: false,
                    titleFont: { size: 10, weight: 'normal' },
                    bodyFont: { size: 14, weight: '600' },
                    callbacks: {
                        label: function(context) {
                            let value = context.parsed || 0;
                            return ' ₹ ' + Math.round(value).toLocaleString('en-IN');
                        }
                    }
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 1200,
                easing: 'easeOutQuart'
            }
        }
    });
}

function updateSIP() {
    const monthly = parseFloat(document.getElementById('monthly').value) || 0;
    const rate = parseFloat(document.getElementById('rate').value) || 0;
    const years = parseFloat(document.getElementById('years').value) || 0;

    const totalValEl = document.getElementById('totalVal');
    const investedResEl = document.getElementById('investedRes');
    const returnsResEl = document.getElementById('returnsRes');

    if (monthly <= 0 || years <= 0) {
        totalValEl.innerText = "₹ 0";
        investedResEl.innerText = "₹ 0";
        returnsResEl.innerText = "₹ 0";
        updateChart(0, 0);
        return;
    }

    const i = (rate / 100) / 12; // monthly rate
    const n = years * 12; // months

    let maturityValue = 0;
    
    if (i === 0) {
        maturityValue = monthly * n;
    } else {
        // M = P × ({[1 + i]^n – 1} / i) × (1 + i)
        maturityValue = monthly * ( (Math.pow(1 + i, n) - 1) / i ) * (1 + i);
    }

    const investedAmount = monthly * n;
    const estimatedReturns = maturityValue - investedAmount;

    totalValEl.innerText = '₹ ' + Math.round(maturityValue).toLocaleString('en-IN');
    investedResEl.innerText = '₹ ' + Math.round(investedAmount).toLocaleString('en-IN');
    returnsResEl.innerText = '₹ ' + Math.round(estimatedReturns).toLocaleString('en-IN');

    updateChart(investedAmount, estimatedReturns);
}
