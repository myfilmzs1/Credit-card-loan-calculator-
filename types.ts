export interface ScheduleEntry {
  month: number;
  principal: number;
  interest: number;
  tax: number;
  processingFee: number;
  totalPayment: number;
  balance: number;
}

export interface LoanSummary {
  emi: number;
  firstEmi?: number;
  principal: number;
  totalInterest: number;
  totalTax: number;
  processingFee: number;
  totalPayable: number;
  excessPayable: number;
}