import React from 'react';
import type { ScheduleEntry, LoanSummary } from '../types';

interface AmortizationTableProps {
    schedule: ScheduleEntry[];
    summary: LoanSummary | null;
    formatCurrency: (value: number) => string;
    taxRate: number;
}

export const AmortizationTable: React.FC<AmortizationTableProps> = ({ schedule, summary, formatCurrency, taxRate }) => {
    const isFirstEmiAdjusted = summary && summary.firstEmi && summary.firstEmi.toFixed(2) !== summary.emi.toFixed(2);
    
    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-lg bg-white">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-700">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Month</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Principal</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Interest</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">{`Tax (${taxRate}%)`}</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Processing Fee</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Total Payment</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Balance</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {schedule.map((entry) => {
                        const isAdjustedRow = isFirstEmiAdjusted && entry.month === 1;
                        return (
                            <tr 
                                key={entry.month} 
                                className={`${isAdjustedRow ? 'bg-amber-50' : 'even:bg-slate-50'} hover:bg-blue-50 transition-colors duration-150`}
                            >
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{entry.month}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-right font-mono">{formatCurrency(entry.principal)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-right font-mono">{formatCurrency(entry.interest)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right font-mono">{formatCurrency(entry.tax)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 text-right font-mono">{formatCurrency(entry.processingFee)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800 text-right font-mono">{formatCurrency(entry.totalPayment)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-right font-mono">{formatCurrency(entry.balance)}</td>
                            </tr>
                        );
                    })}
                </tbody>
                {summary && (
                    <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                        <tr className="font-bold text-slate-800">
                            <td className="px-6 py-4 text-left text-sm uppercase tracking-wider">Totals</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">{formatCurrency(summary.principal)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">{formatCurrency(summary.totalInterest)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-700 text-right font-mono">{formatCurrency(summary.totalTax)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-700 text-right font-mono">{formatCurrency(summary.processingFee)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">{formatCurrency(summary.totalPayable)}</td>
                            <td className="px-6 py-4"></td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
};