import React from 'react';
import type { ScheduleEntry, LoanSummary } from '../types';
import { PiggyBankIcon, BuildingLibraryIcon, ReceiptPercentIcon, WalletIcon } from '../constants';

interface InstallmentBreakdownProps {
    schedule: ScheduleEntry[];
    summary: LoanSummary | null;
    formatCurrency: (value: number) => string;
}

interface Breakdown {
    principal: number;
    interest: number;
    tax: number;
    total: number;
}

const BreakdownCard: React.FC<{ title: string; data: Breakdown; formatCurrency: (value: number) => string, note?: string }> = ({ title, data, formatCurrency, note }) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
        <ul className="space-y-3">
            <li className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <PiggyBankIcon />
                    </span>
                    <span className="text-sm text-slate-600">Principal</span>
                </div>
                <span className="text-sm font-semibold text-slate-900 font-mono">{formatCurrency(data.principal)}</span>
            </li>
            <li className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-orange-100 text-orange-600">
                        <BuildingLibraryIcon />
                    </span>
                    <span className="text-sm text-slate-600">Interest</span>
                </div>
                <span className="text-sm font-semibold text-slate-900 font-mono">{formatCurrency(data.interest)}</span>
            </li>
            <li className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-red-100 text-red-600">
                        <ReceiptPercentIcon />
                    </span>
                    <span className="text-sm text-slate-600">Tax (GST)</span>
                </div>
                <span className="text-sm font-semibold text-slate-900 font-mono">{formatCurrency(data.tax)}</span>
            </li>
        </ul>
        <div className="border-t border-slate-200 my-4"></div>
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
                <span className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-800">
                    <WalletIcon />
                </span>
                <span className="text-sm font-bold text-slate-800">Total Payment</span>
            </div>
            <span className="text-base font-bold text-slate-900 font-mono">{formatCurrency(data.total)}</span>
        </div>
        {note && <p className="text-xs text-slate-500 mt-3 text-center">{note}</p>}
    </div>
);


export const InstallmentBreakdown: React.FC<InstallmentBreakdownProps> = ({ schedule, summary, formatCurrency }) => {
    if (!summary || schedule.length === 0) {
        return null;
    }

    const firstEmiData = schedule[0];
    const isFirstEmiAdjusted = summary.firstEmi && summary.firstEmi.toFixed(2) !== summary.emi.toFixed(2);
    
    // Use the second month's data as a representative for the standard EMI breakdown
    const standardEmiData = schedule.length > 1 ? schedule[1] : null;

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4 text-slate-800 flex items-center gap-2">
                Monthly Installment Breakdown
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {isFirstEmiAdjusted && (
                     <BreakdownCard 
                        title="First EMI Breakdown"
                        data={{
                            principal: firstEmiData.principal,
                            interest: firstEmiData.interest,
                            tax: firstEmiData.tax,
                            total: firstEmiData.totalPayment
                        }}
                        formatCurrency={formatCurrency}
                        note="Interest is adjusted based on your transaction date."
                     />
                )}
                
                {standardEmiData && (
                    <div className={!isFirstEmiAdjusted ? 'md:col-span-2' : ''}>
                         <BreakdownCard 
                            title="Standard EMI Breakdown"
                            data={{
                                principal: standardEmiData.principal,
                                interest: standardEmiData.interest,
                                tax: standardEmiData.tax,
                                total: standardEmiData.totalPayment
                            }}
                            formatCurrency={formatCurrency}
                            note="This is a representative breakdown. Principal and interest amounts will vary slightly each month."
                         />
                    </div>
                )}
            </div>
        </div>
    );
};
