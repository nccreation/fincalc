let myChart = null;

document.addEventListener('DOMContentLoaded', () => {
    updateDiscount();
});

function updateChart(final, saved) {
    const canvas = document.getElementById('discountChart');
    if (!canvas) return;

    if (myChart) {
        myChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    
    // Apple-style Palette
    const finalColor = '#007AFF'; 
    const savedColor = '#34C759';

    const hasData = final > 0 || saved > 0;
    const plotData = hasData ? [final, saved] : [1];
    const plotColors = hasData ? [finalColor, savedColor] : ['#e2e8f0'];

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Final Price', 'Saved'],
            datasets: [{
                data: plotData,
                backgroundColor: plotColors,
                borderWidth: 0,
                hoverOffset: hasData ? 12 : 0,
                borderRadius: hasData ? 12 : 0,
                spacing: hasData ? 2 : 0
            }]
        },
        options: {
            cutout: '85%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: hasData,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            let value = context.parsed || 0;
                            return ' ₹ ' + Math.round(value).toLocaleString('en-IN');
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

function updateDiscount() {
    const price = parseFloat(document.getElementById('basePrice').value) || 0;
    const discount = parseFloat(document.getElementById('discountPercent').value) || 0;

    const finalPriceEl = document.getElementById('finalPrice');
    const originalPriceResEl = document.getElementById('originalPriceRes');
    const savingsResEl = document.getElementById('savingsRes');

    const savings = (price * discount) / 100;
    const final = price - savings;

    finalPriceEl.innerText = '₹ ' + Math.round(final).toLocaleString('en-IN');
    originalPriceResEl.innerText = '₹ ' + Math.round(price).toLocaleString('en-IN');
    savingsResEl.innerText = '₹ ' + Math.round(savings).toLocaleString('en-IN');

    updateChart(final, savings);
}

function resetDiscount() {
    document.getElementById('basePrice').value = 5000;
    document.getElementById('discountPercent').value = 20;
    updateDiscount();
}

window.updateDiscount = updateDiscount;
window.resetDiscount = resetDiscount;
