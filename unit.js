const units = {
    length: {
        km: { label: 'Kilometers (km)', factor: 1000 },
        m: { label: 'Meters (m)', factor: 1 },
        cm: { label: 'Centimeters (cm)', factor: 0.01 },
        mm: { label: 'Millimeters (mm)', factor: 0.001 },
        mi: { label: 'Miles (mi)', factor: 1609.34 },
        yd: { label: 'Yards (yd)', factor: 0.9144 },
        ft: { label: 'Feet (ft)', factor: 0.3048 },
        in: { label: 'Inches (in)', factor: 0.0254 }
    },
    weight: {
        kg: { label: 'Kilograms (kg)', factor: 1 },
        g: { label: 'Grams (g)', factor: 0.001 },
        mg: { label: 'Milligrams (mg)', factor: 0.000001 },
        lb: { label: 'Pounds (lb)', factor: 0.453592 },
        oz: { label: 'Ounces (oz)', factor: 0.0283495 }
    },
    temp: {
        c: { label: 'Celsius (°C)' },
        f: { label: 'Fahrenheit (°F)' },
        k: { label: 'Kelvin (K)' }
    }
};

let currentCategory = 'length';

document.addEventListener('DOMContentLoaded', () => {
    setCategory('length');
});

function setCategory(cat) {
    currentCategory = cat;
    
    // UI Update
    ['length', 'weight', 'temp'].forEach(c => {
        const btn = document.getElementById(`cat-${c}`);
        if (c === cat) {
            btn.classList.remove('opacity-50');
            btn.classList.add('ring-2', 'ring-violet-500/30');
        } else {
            btn.classList.add('opacity-50');
            btn.classList.remove('ring-2', 'ring-violet-500/30');
        }
    });

    // Units dropdowns update
    const fromSelect = document.getElementById('fromUnit');
    const toSelect = document.getElementById('toUnit');
    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';

    const catUnits = units[cat];
    Object.keys(catUnits).forEach((u, index) => {
        const optFrom = document.createElement('option');
        optFrom.value = u;
        optFrom.innerText = catUnits[u].label;
        fromSelect.appendChild(optFrom);

        const optTo = document.createElement('option');
        optTo.value = u;
        optTo.innerText = catUnits[u].label;
        toSelect.appendChild(optTo);
    });

    // Default selection
    if (cat === 'length') {
        fromSelect.value = 'km';
        toSelect.value = 'm';
    } else if (cat === 'weight') {
        fromSelect.value = 'kg';
        toSelect.value = 'g';
    } else {
        fromSelect.value = 'c';
        toSelect.value = 'f';
    }

    convert('from');
}

function convert(direction) {
    const fromInput = document.getElementById('fromInput');
    const toInput = document.getElementById('toInput');
    const fromUnit = document.getElementById('fromUnit').value;
    const toUnit = document.getElementById('toUnit').value;

    if (direction === 'from') {
        const value = parseFloat(fromInput.value);
        if (isNaN(value)) { toInput.value = ''; return; }
        toInput.value = performConversion(value, fromUnit, toUnit);
    } else {
        const value = parseFloat(toInput.value);
        if (isNaN(value)) { fromInput.value = ''; return; }
        fromInput.value = performConversion(value, toUnit, fromUnit);
    }
}

function performConversion(val, from, to) {
    if (currentCategory === 'temp') {
        // Temperature logic
        let celsius;
        if (from === 'c') celsius = val;
        else if (from === 'f') celsius = (val - 32) * 5/9;
        else if (from === 'k') celsius = val - 273.15;

        if (to === 'c') return parseFloat(celsius.toFixed(4));
        if (to === 'f') return parseFloat((celsius * 9/5 + 32).toFixed(4));
        if (to === 'k') return parseFloat((celsius + 273.15).toFixed(4));
    } else {
        // Standard factor logic (m or kg as base)
        const baseValue = val * units[currentCategory][from].factor;
        const result = baseValue / units[currentCategory][to].factor;
        return parseFloat(result.toFixed(6));
    }
}
