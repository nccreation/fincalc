/**
 * EMI Calculation Logic
 * Formual: [P x R x (1+R)^N]/[(1+R)^N-1]
 */

export function calculateEMI(principal, annualRate, tenure, isYears) {
  const p = parseFloat(principal);
  const r = parseFloat(annualRate) / (12 * 100); // monthly interest rate
  const n = isYears ? parseFloat(tenure) * 12 : parseFloat(tenure); // total months

  if (isNaN(p) || isNaN(r) || isNaN(n) || p <= 0 || r < 0 || n <= 0) {
    return null;
  }

  // If rate is 0
  if (r === 0) {
    return {
      monthlyEMI: p / n,
      totalInterest: 0,
      totalAmount: p,
      principalPercent: 100,
      interestPercent: 0
    };
  }

  const emi = p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  const totalAmount = emi * n;
  const totalInterest = totalAmount - p;

  const principalPercent = (p / totalAmount) * 100;
  const interestPercent = (totalInterest / totalAmount) * 100;

  return {
    monthlyEMI: Math.round(emi),
    totalInterest: Math.round(totalInterest),
    totalAmount: Math.round(totalAmount),
    principalPercent,
    interestPercent
  };
}
