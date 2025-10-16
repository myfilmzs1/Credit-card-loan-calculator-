import type { ScheduleEntry, LoanSummary } from '../types';

export const generateAmortizationSchedule = (
    principal: number,
    annualRate: number,
    tenureInMonths: number,
    processingFee: number, // This is the base fee
    taxRatePercent: number, // e.g., 18 for 18%
    transactionDateStr?: string,
    firstEmiDueDateStr?: string
): { schedule: ScheduleEntry[]; summary: LoanSummary } => {
    if (principal <= 0 || annualRate < 0 || tenureInMonths <= 0 || processingFee < 0 || taxRatePercent < 0) {
        throw new Error("Loan amount, rates, tenure, and fees must be non-negative numbers.");
    }
    
    const taxRate = taxRatePercent / 100;
    const processingFeeTax = processingFee * taxRate;

    // Handle zero interest rate case
    if (annualRate === 0) {
        const emi = principal / tenureInMonths;
        const schedule: ScheduleEntry[] = [];
        let balance = principal;
        const excessPayable = processingFee + processingFeeTax;
        
        for (let i = 1; i <= tenureInMonths; i++) {
            const principalPaid = emi;
            balance -= principalPaid;
            const feeForMonth = i === 1 ? processingFee : 0;
            const taxForMonth = i === 1 ? processingFeeTax : 0;
            
            schedule.push({
                month: i,
                principal: principalPaid,
                interest: 0,
                tax: taxForMonth,
                processingFee: feeForMonth,
                totalPayment: emi + feeForMonth + taxForMonth,
                balance: balance > 0.005 ? balance : 0,
            });
        }
        return {
            schedule,
            summary: {
                emi,
                principal,
                totalInterest: 0,
                totalTax: processingFeeTax,
                processingFee,
                totalPayable: principal + processingFee + processingFeeTax,
                excessPayable,
            },
        };
    }

    const monthlyRate = annualRate / 12 / 100;
    // Standard EMI calculation for the Principal + Interest part
    const emi =
        (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureInMonths)) /
        (Math.pow(1 + monthlyRate, tenureInMonths) - 1);

    const schedule: ScheduleEntry[] = [];
    let balance = principal;
    let totalInterest = 0;
    let totalTaxPayable = 0;
    let firstEmi: number | undefined = undefined;

    // First Month Calculation
    const standardInterestMonth1 = balance * monthlyRate;
    let adjustedInterestMonth1 = standardInterestMonth1;
    let daysInFirstCycle = 30;

    if (transactionDateStr && firstEmiDueDateStr) {
        const transactionDate = new Date(transactionDateStr + 'T00:00:00');
        const firstEmiDate = new Date(firstEmiDueDateStr + 'T00:00:00');
        
        // As per instruction, interest calculation starts from the day after the transaction,
        // effectively excluding the transaction date from the interest period.
        const interestPeriodStartDate = new Date(transactionDate);
        interestPeriodStartDate.setDate(interestPeriodStartDate.getDate() + 1);

        if (!isNaN(interestPeriodStartDate.getTime()) && !isNaN(firstEmiDate.getTime()) && firstEmiDate >= interestPeriodStartDate) {
            const timeDiff = firstEmiDate.getTime() - interestPeriodStartDate.getTime();
            // Calculate number of days for the interest period (end date is not included).
            daysInFirstCycle = Math.round(timeDiff / (1000 * 3600 * 24));
        } else {
             // If due date is before or on the transaction date, there's no interest period for the first cycle.
             daysInFirstCycle = 0;
        }
        adjustedInterestMonth1 = (standardInterestMonth1 / 30) * daysInFirstCycle;
    }

    const principalMonth1 = emi - standardInterestMonth1;
    const processingFeeMonth1 = processingFee;
    const taxOnInterestMonth1 = adjustedInterestMonth1 * taxRate;
    const taxOnFeeMonth1 = processingFeeMonth1 * taxRate;
    const taxMonth1 = taxOnInterestMonth1 + taxOnFeeMonth1;
    const totalPaymentMonth1 = principalMonth1 + adjustedInterestMonth1 + taxMonth1 + processingFeeMonth1;
    
    firstEmi = totalPaymentMonth1;
    totalInterest += adjustedInterestMonth1;
    totalTaxPayable += taxMonth1;
    balance -= principalMonth1;

    schedule.push({
        month: 1,
        principal: principalMonth1,
        interest: adjustedInterestMonth1,
        tax: taxMonth1,
        processingFee: processingFeeMonth1,
        totalPayment: totalPaymentMonth1,
        balance: balance,
    });

    // Subsequent Months Calculation
    for (let i = 2; i <= tenureInMonths; i++) {
        const interestForMonth = balance * monthlyRate;
        const taxOnInterestForMonth = interestForMonth * taxRate;
        
        let principalForMonth = emi - interestForMonth;
        let totalPaymentForMonth = emi + taxOnInterestForMonth;

        totalInterest += interestForMonth;
        totalTaxPayable += taxOnInterestForMonth;

        // On the last month, adjust payment to make balance exactly 0
        if (i === tenureInMonths) {
            principalForMonth = balance;
            totalPaymentForMonth = balance + interestForMonth + taxOnInterestForMonth;
        }
        
        balance -= principalForMonth;

        schedule.push({
            month: i,
            principal: principalForMonth,
            interest: interestForMonth,
            tax: taxOnInterestForMonth,
            processingFee: 0,
            totalPayment: totalPaymentForMonth,
            balance: balance > 0.005 ? balance : 0, // Correct for floating point inaccuracies
        });
    }
    
    const totalPayable = principal + totalInterest + totalTaxPayable + processingFee;
    const excessPayable = totalInterest + totalTaxPayable + processingFee;

    const summary: LoanSummary = {
        emi,
        firstEmi: firstEmi,
        principal,
        totalInterest,
        totalTax: totalTaxPayable,
        processingFee,
        totalPayable,
        excessPayable,
    };

    return { schedule, summary };
};