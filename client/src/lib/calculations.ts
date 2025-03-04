export interface CarLoanParams {
  carPrice: number;
  downPayment: number;
  loanPeriod: number;
  carType: 'normal' | 'hybrid' | 'electric';
  carStatus: 'new' | 'used';
  carAge: number;
}

export interface LoanDetails {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  apr: string;
  periodYears: number;
}

export function calculateLoanDetails(
  principal: number, 
  interestRate: number, 
  periodYears: number
): LoanDetails {
  const monthlyRate = interestRate / 12;
  const totalPayments = periodYears * 12;
  
  // Monthly payment formula: PMT = P * r * (1+r)^n / ((1+r)^n - 1)
  const monthlyPayment = principal * monthlyRate * Math.pow(1 + monthlyRate, totalPayments) / 
                        (Math.pow(1 + monthlyRate, totalPayments) - 1);
                        
  const totalPayment = monthlyPayment * totalPayments;
  const totalInterest = totalPayment - principal;
  
  // Simple APR calculation (not completely accurate but sufficient for illustration)
  const apr = interestRate * 1.1; // Adding approximate fees and other costs
  
  return {
    monthlyPayment: Math.round(monthlyPayment),
    totalPayment: Math.round(totalPayment),
    totalInterest: Math.round(totalInterest),
    apr: (apr * 100).toFixed(1),
    periodYears
  };
}
