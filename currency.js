const api1 = 'https://open.er-api.com/v6/latest/USD';
const api2 = 'https://api.exchangerate-api.com/v4/latest/USD';

let rates = {};

document.addEventListener('DOMContentLoaded', () => {
    loadRates();
});

async function loadRates() {
    const refreshIcon = document.getElementById('refreshIcon');
    const updatedAt = document.getElementById('updatedAt');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    if (refreshIcon) refreshIcon.classList.add('animate-spin');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
        loadingOverlay.style.opacity = '1';
    }

    try {
        console.log("Fetching primary exchange rates...");
        const response = await fetch(api1, { mode: 'cors' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        rates = data.rates;
        initApp(data.time_last_update_utc);
    } catch (error) {
        console.warn("Primary API fail, trying backup:", error.message);
        try {
            const response = await fetch(api2, { mode: 'cors' });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            rates = data.rates;
            initApp(data.date || new Date().toUTCString());
        } catch (err) {
            console.error("All currency APIs failed:", err.message);
            handleFetchError();
        }
    } finally {
        if (refreshIcon) refreshIcon.classList.remove('animate-spin');
    }
}

function initApp(timestamp) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const updatedAt = document.getElementById('updatedAt');

    populateDropdowns(Object.keys(rates));
    updateTimestamp(timestamp);
    
    if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 500);
    }
    
    updatedAt.classList.remove('text-amber-500');
    convert('from');
}

function handleFetchError() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const updatedAt = document.getElementById('updatedAt');
    
    // Solid fallback data in case of complete internet outage
    rates = { 
        "USD": 1, "INR": 83.50, "EUR": 0.92, "GBP": 0.78, "AED": 3.67, 
        "JPY": 155.0, "AUD": 1.51, "CAD": 1.36, "SGD": 1.35, "CHF": 0.90 
    };
    
    populateDropdowns(Object.keys(rates));
    updatedAt.innerText = 'Offline: Using cached rates';
    updatedAt.classList.add('text-amber-500');

    if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 500);
    }
    
    convert('from');
}

function populateDropdowns(codes) {
    const fromSelect = document.getElementById('fromCurrency');
    const toSelect = document.getElementById('toCurrency');
    
    const prevFrom = fromSelect.value || 'USD';
    const prevTo = toSelect.value || 'INR';
    
    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';

    codes.sort().forEach(code => {
        const opt1 = document.createElement('option');
        opt1.value = code;
        opt1.innerText = code;
        fromSelect.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = code;
        opt2.innerText = code;
        toSelect.appendChild(opt2);
    });

    fromSelect.value = codes.includes(prevFrom) ? prevFrom : 'USD';
    toSelect.value = codes.includes(prevTo) ? prevTo : 'INR';
    
    updateUIFlags();
}

function updateUIFlags() {
    const from = document.getElementById('fromCurrency').value;
    const to = document.getElementById('toCurrency').value;
    
    document.getElementById('fromFlag').innerText = from.substring(0, 2);
    document.getElementById('toFlag').innerText = to.substring(0, 2);
    
    updateExchangeRateText();
}

function updateExchangeRateText() {
    const from = document.getElementById('fromCurrency').value;
    const to = document.getElementById('toCurrency').value;
    
    if (rates[from] && rates[to]) {
        const rate = rates[to] / rates[from];
        document.getElementById('exchangeRateText').innerText = `1 ${from} = ${rate.toFixed(4)} ${to}`;
    }
}

function updateTimestamp(utcStr) {
    const date = new Date(utcStr);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('updatedAt').innerText = 'Last updated: ' + timeStr;
}

function convert(direction) {
    const fromAmountEl = document.getElementById('fromAmount');
    const toAmountEl = document.getElementById('toAmount');
    const fromUnit = document.getElementById('fromCurrency').value;
    const toUnit = document.getElementById('toCurrency').value;

    if (!rates[fromUnit] || !rates[toUnit]) return;

    if (direction === 'from') {
        const val = parseFloat(fromAmountEl.value);
        if (isNaN(val)) { toAmountEl.value = ''; return; }
        const result = (val / rates[fromUnit]) * rates[toUnit];
        toAmountEl.value = result.toFixed(2);
    } else {
        const val = parseFloat(toAmountEl.value);
        if (isNaN(val)) { fromAmountEl.value = ''; return; }
        const result = (val / rates[toUnit]) * rates[fromUnit];
        fromAmountEl.value = result.toFixed(2);
    }
}

function swapCurrencies() {
    const fromSelect = document.getElementById('fromCurrency');
    const toSelect = document.getElementById('toCurrency');
    
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
    
    updateUIFlags();
    convert('from');
}

function resetCurrency() {
    document.getElementById('fromAmount').value = '';
    document.getElementById('toAmount').value = '';
    document.getElementById('fromAmount').focus();
}

window.fetchRates = loadRates;
window.resetCurrency = resetCurrency;
window.swapCurrencies = swapCurrencies;

