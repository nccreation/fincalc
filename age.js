document.addEventListener('DOMContentLoaded', () => {
    // Set a default date (30 years ago)
    const today = new Date();
    const defaultDate = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());
    document.getElementById('dob').value = defaultDate.toISOString().split('T')[0];
    calculateAge();
});

function calculateAge() {
    const dobInput = document.getElementById('dob').value;
    if (!dobInput) return;

    const birthDate = new Date(dobInput);
    const today = new Date();

    if (birthDate > today) {
        // Reset if future date
        updateUI(0, 0, 0, 0, 0, "Future date!", 0);
        return;
    }

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    if (days < 0) {
        months--;
        const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        days += prevMonth.getDate();
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    // Total stats
    const diffTime = Math.abs(today - birthDate);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalMonths = (years * 12) + months;

    // Next Birthday
    const nextBday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    if (nextBday < today) {
        nextBday.setFullYear(today.getFullYear() + 1);
    }
    const daysToBday = Math.ceil((nextBday - today) / (1000 * 60 * 60 * 24));
    const nextBdayStr = daysToBday === 365 ? "Today is your birthday! 🎉" : `${daysToBday} days to go`;

    // Year Progress
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear(), 11, 31);
    const progressPerc = Math.round(((today - startOfYear) / (endOfYear - startOfYear)) * 100);

    updateUI(years, months, days, totalMonths, totalDays, nextBdayStr, progressPerc);
}

function updateUI(y, m, d, tm, td, next, prog) {
    document.getElementById('ageYears').innerText = y;
    document.getElementById('ageMonths').innerText = m;
    document.getElementById('ageDays').innerText = d;
    document.getElementById('totalMonths').innerText = tm.toLocaleString();
    document.getElementById('totalDays').innerText = td.toLocaleString();
    document.getElementById('nextBirthday').innerText = next;
    
    document.getElementById('progressPerc').innerText = prog + '%';
    document.getElementById('progressBar').style.width = prog + '%';
}
