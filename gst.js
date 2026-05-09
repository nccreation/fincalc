let myChart = null;
let isAddGst = true;

document.addEventListener('DOMContentLoaded', () => {
    updateGST();
});

function toggleGstMode(isAdd) {
    isAddGst = isAdd;
    const addBtn = document.getElementById('addGstBtn');
    const remBtn = document.getElementById('remGstBtn');
    
    if (isAddGst) {
        addBtn.className = "flex-1 py-3 text-[10px] font-bold uppercase rounded-xl transition-all bg-white dark:bg-white/10 shadow-sm text-black dark:text-white";
        remBtn.className = "flex-1 py-3 text-[10px] font-bold uppercase rounded-xl transition-all text-slate-500 dark:text-zinc-400";
    } else {
        remBtn.className = "flex-1 py-3 text-[10px] font-bold uppercase rounded-xl transition-all bg-white dark:bg-white/10 shadow-sm text-black dark:text-white";
        addBtn.className = "flex-1 py-3 text-[10px] font-bold uppercase rounded-xl transition-all text-slate-500 dark:text-zinc-400";
    }
    updateGST();
}

function setGstRate(rate) {
    document.getElementById('gstRate').value = rate;
    // Update button visual ring
    const buttons = document.querySelectorAll('.grid button');
    buttons.forEach(btn => {
        if(btn.innerText === rate + '%') {
            btn.classList.add('ring-2', 'ring-orange-500/20', 'bg-white');
        } else {
            btn.classList.remove('ring-2', 'ring-orange-500/20', 'bg-white');
        }
    });
    updateGST();
}

function updateChart(net, gst) {
    const canvas = document.getElementById('gstChart');
    if (!canvas) return;

    if (myChart) {
        myChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    
    // Palette
    const netColor = '#A5A5A5'; 
    const gstColor = '#FF9F0A';

    const hasData = net > 0 || gst > 0;
    const plotData = hasData ? [net, gst] : [1];
    const plotColors = hasData ? [netColor, gstColor] : ['#e2e8f0'];

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Net', 'GST'],
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

function updateGST() {
    const amount = parseFloat(document.getElementById('baseAmount').value) || 0;
    const rate = parseFloat(document.getElementById('gstRate').value) || 0;

    const totalValEl = document.getElementById('totalVal');
    const netAmountResEl = document.getElementById('netAmountRes');
    const gstAmountResEl = document.getElementById('gstAmountRes');

    let netAmount = 0;
    let gstAmount = 0;
    let totalAmount = 0;

    if (isAddGst) {
        netAmount = amount;
        gstAmount = (amount * rate) / 100;
        totalAmount = netAmount + gstAmount;
    } else {
        totalAmount = amount;
        netAmount = amount / (1 + (rate / 100));
        gstAmount = totalAmount - netAmount;
    }

    totalValEl.innerText = '₹ ' + Math.round(totalAmount).toLocaleString('en-IN');
    netAmountResEl.innerText = '₹ ' + Math.round(netAmount).toLocaleString('en-IN');
    gstAmountResEl.innerText = '₹ ' + Math.round(gstAmount).toLocaleString('en-IN');

    updateChart(netAmount, gstAmount);
}

function resetGST() {
    document.getElementById('baseAmount').value = 1000;
    document.getElementById('gstRate').value = 18;
    toggleGstMode(true);
    setGstRate(18);
}

window.toggleGstMode = toggleGstMode;
window.setGstRate = setGstRate;
window.updateGST = updateGST;
window.resetGST = resetGST;
