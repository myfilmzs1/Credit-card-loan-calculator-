
import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { generateAmortizationSchedule } from './services/loanCalculator';
import type { ScheduleEntry, LoanSummary } from './types';
import { AmortizationTable } from './components/AmortizationTable';
import { Input } from './components/Input';
import { Button } from './components/Button';
import { SummaryCard } from './components/SummaryCard';
import { PieChart } from './components/PieChart';
import { InstallmentBreakdown } from './components/InstallmentBreakdown';
import { InstallPWAButton } from './components/InstallPWAButton';
import { AIInsights } from './components/AIInsights';
import { 
    SbiLogo, 
    CalculatorIcon, 
    CurrencyRupeeIcon, 
    PercentIcon, 
    CalendarIcon, 
    TrashIcon, 
    SpinnerIcon,
    WalletIcon,
    PiggyBankIcon,
    BuildingLibraryIcon,
    ReceiptPercentIcon,
    ShieldCheckIcon,
    ChartPieIcon,
    BriefcaseIcon,
    ExclamationTriangleIcon,
    FilePdfIcon,
    FileExcelIcon,
    InformationCircleIcon
} from './constants';

declare const jspdf: any;
declare const XLSX: any;

const App: React.FC = () => {
    const [loanAmount, setLoanAmount] = useState<string>('100000');
    const [interestRate, setInterestRate] = useState<string>('14');
    const [tenure, setTenure] = useState<string>('24');
    const [taxRate, setTaxRate] = useState<string>('18');

    const [transactionDate, setTransactionDate] = useState<string>('');
    const [billingDate, setBillingDate] = useState<string>('');
    const [firstEmiDueDate, setFirstEmiDueDate] = useState<string>('');
    
    const [feeType, setFeeType] = useState<'percentage' | 'amount'>('percentage');
    const [processingFeeRate, setProcessingFeeRate] = useState<string>('0');
    const [processingFeeAmount, setProcessingFeeAmount] = useState<string>('');

    const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
    const [summary, setSummary] = useState<LoanSummary | null>(null);
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [aiInsights, setAiInsights] = useState<string>('');
    const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
    const [aiError, setAiError] = useState<string>('');

    const handleClear = useCallback(() => {
        setLoanAmount('100000');
        setInterestRate('14');
        setTenure('24');
        setTaxRate('18');
        setTransactionDate('');
        setBillingDate('');
        setFirstEmiDueDate('');
        setFeeType('percentage');
        setProcessingFeeRate('0');
        setProcessingFeeAmount('');
        setSchedule([]);
        setSummary(null);
        setError('');
        setAiInsights('');
        setIsAiLoading(false);
        setAiError('');
    }, []);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('new')) {
            handleClear();
            // Clean up the URL to avoid re-triggering on refresh
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [handleClear]);

    useEffect(() => {
        if (transactionDate) {
            const tDate = new Date(transactionDate + 'T00:00:00');
            if (isNaN(tDate.getTime())) {
                setBillingDate('');
                setFirstEmiDueDate('');
                return;
            }
    
            let billingYear = tDate.getFullYear();
            let billingMonth = tDate.getMonth();
    
            if (tDate.getDate() > 20) {
                billingMonth += 1;
            }
            
            const billingDateObj = new Date(billingYear, billingMonth, 20);
            const dueDateObj = new Date(billingDateObj);
            dueDateObj.setDate(dueDateObj.getDate() + 20);
            
            const formatDate = (date: Date): string => {
                 const year = date.getFullYear();
                 const month = (date.getMonth() + 1).toString().padStart(2, '0');
                 const day = date.getDate().toString().padStart(2, '0');
                 return `${year}-${month}-${day}`;
            };
    
            setBillingDate(formatDate(billingDateObj));
            setFirstEmiDueDate(formatDate(dueDateObj));
        } else {
            setBillingDate('');
            setFirstEmiDueDate('');
        }
    }, [transactionDate]);
    
    const formatCurrency = useCallback((value: number) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    }, []);

    const handleCalculate = useCallback(() => {
        setError('');
        setAiInsights('');
        setAiError('');
        const p = parseFloat(loanAmount);
        const r = parseFloat(interestRate);
        const n = parseInt(tenure, 10);
        const t = parseFloat(taxRate);

        let feeAmount = 0;
        let feeInputIsInvalid = false;

        if (feeType === 'percentage') {
            const pfRate = parseFloat(processingFeeRate);
            if (isNaN(pfRate) || pfRate < 0) {
                feeInputIsInvalid = true;
            } else {
                feeAmount = p * (pfRate / 100);
            }
        } else { // feeType is 'amount'
            const pfAmount = parseFloat(processingFeeAmount);
            if (isNaN(pfAmount) || pfAmount < 0 || processingFeeAmount.trim() === '') {
                feeInputIsInvalid = true;
            } else {
                feeAmount = pfAmount;
            }
        }
        
        const isInvalidDate = (dateStr: string) => dateStr && isNaN(new Date(dateStr).getTime());

        if (isInvalidDate(transactionDate) || isInvalidDate(firstEmiDueDate)) {
             setError('Please enter valid dates for transaction and first EMI due date.');
             return;
        }

        if (isNaN(p) || p <= 0 || isNaN(r) || r < 0 || isNaN(n) || n <= 0 || isNaN(t) || t < 0 || feeInputIsInvalid) {
            setError('Please enter valid positive numbers for all fields, including the processing fee.');
            setSchedule([]);
            setSummary(null);
            return;
        }

        setIsLoading(true);
        // Simulate calculation time to show loading spinner
        setTimeout(() => {
            try {
                const { schedule: newSchedule, summary: newSummary } = generateAmortizationSchedule(p, r, n, feeAmount, t, transactionDate, firstEmiDueDate);
                setSchedule(newSchedule);
                setSummary(newSummary);
            } catch (e) {
                if (e instanceof Error) {
                    setError(e.message);
                } else {
                    setError('An unknown error occurred during calculation.');
                }
                setSchedule([]);
                setSummary(null);
            } finally {
                setIsLoading(false);
            }
        }, 500);

    }, [loanAmount, interestRate, tenure, taxRate, feeType, processingFeeRate, processingFeeAmount, transactionDate, firstEmiDueDate]);

    const handleGetAIInsights = async () => {
        if (!summary) {
            setAiError('Please generate a loan schedule first.');
            return;
        }
    
        setIsAiLoading(true);
        setAiError('');
        setAiInsights('');
    
        const apiKey = (typeof process !== 'undefined' && process?.env?.API_KEY) ? process.env.API_KEY : undefined;

        if (!apiKey) {
            setAiError("The AI Insights feature is not configured. An API key is required for it to function.");
            setIsAiLoading(false);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `You are a friendly and insightful financial advisor. A user is considering an SBI Credit Card loan with the following details:
- Loan Amount: ${formatCurrency(summary.principal)}
- Annual Interest Rate: ${interestRate}%
- Tenure: ${tenure} months
- Total Interest Payable: ${formatCurrency(summary.totalInterest)}
- Total Taxes & Fees: ${formatCurrency(summary.totalTax + summary.processingFee)}
- Total Amount to be Repaid: ${formatCurrency(summary.totalPayable)}

Based on these figures, provide a concise and easy-to-understand analysis in 2-3 paragraphs. Then, offer 2-3 actionable tips for managing this loan effectively. Use markdown for formatting (e.g., **bold** for emphasis and * for bullet points). Keep the tone encouraging and helpful. Do not include a disclaimer about not being a financial advisor.`;
    
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
    
            setAiInsights(response.text);
    
        } catch (e) {
            console.error("Error fetching AI insights:", e);
            if (e instanceof Error) {
                if (e.message.includes('API key')) {
                     setAiError('The API key is invalid or missing required permissions. Please check your configuration.');
                } else {
                     setAiError(`Failed to get AI insights: ${e.message}`);
                }
            } else {
                setAiError('An unknown error occurred while fetching AI insights.');
            }
        } finally {
            setIsAiLoading(false);
        }
    };

    const handlePdfExport = useCallback(() => {
        if (!summary || schedule.length === 0) return;

        if (typeof jspdf === 'undefined' || typeof jspdf.jsPDF === 'undefined') {
            setError('PDF export library failed to load. Please check your internet connection and refresh the page.');
            return;
        }
        
        const formatCurrencyForPdf = (value: number) => {
            return new Intl.NumberFormat('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(value);
        };

        const doc = new jspdf.jsPDF();
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 14;

        // --- 1. Header ---
        const sbiLogoPngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAMAAACahl6sAAAAQlBMVEX///8zN0iAgYEAAADc3Nyampv7+/vX19dPT1IAAAAzMzdubm739/fJycnj4+NfX1+fn59wcHDh4eGTk5OioqLq6upEREQe45D3AAADpUlEQVR4nO3b63LiMBCGYUQxLC9h+/+f7dI9SyaQAAnalPfeO1s6QBAwIICtDwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA/4Hft7/d/Hi8f5/f72/ffLq8/y1/aB2Jvx+b491j7G+2P2j9gfsn7P/z7+P7c/P74+f/9D+0f/D7Qfs37X/j+w/sX7L/1P7T+9/qf2l//v57/W/t39l/Z/9x/av7j+w/v39D/xP7j+t/fP/S/v39f/b/2v9b/2//j/1v9T+1f6f/t/4v93+4/8r+X/d/uv/L/h/5P9x/fP+C/r/1f6P/5/o/1//d/m/7P9z/W//P/b/0//r/lf5v93+4/8v+R/f/uv/D/l/6P93/W/83+5/c/1//B/o/3f+D/c/3P9f/2f4n+9/q/3z/S/3P7j/Q/2P9T++//P9y/1f6n9w/0f4j++f7n+1/vv+7/V/v//T/xf4H9y/2f7n/0/4v95/df3j/x/ov7H98/+f+7/Y/2//j/qf2f7j/0/4v95/df3j/Z/uv+P/b/2v9b/8/9T+1/c//P/j/3v9T/W/9v/S/1v7z/7P7T+4/s39n/YP27+2/tv9b/2/tr/X/t/7X+p/ev23/L/pP7V/Z/uv/M/h/6v9P/af+P/W/1/7L/X/s/7X+y/6f2L/d/uv/U/p3+X/r/4P+D+9/ff2v/c/1P7l/c/3L/3/p/7n9w/7P9z/av2//d/k/7P93/4P5H91/c//j+r/af3n/y/qX7z+x/fP/b/U/sP7f/w/pv73+9/fP/v/h/2P9n/Y/9v/R/v/2v9z+5/fP+z/b/2f9T/6f5n91/c/3T/z/o/3X/5/o/1n+1/ff+D/S/v39f/W/8n+7/Z/1v/h/1f7n9y/8f+H/b/2f9f+x/r/2j/d/tn9J/ff3L/j/0/9v9Z/w/7P9z/af/p/h/7f7z/w/5f+j/d/3P9D+8/vv9x/af3X9z/6f7n9j/V/7f+L/c/uf/j/if3v7n/2f7P9j/c/+H+B/ef3X9x/9f9P/T/rf/j/T/uv7z/5P73+j/Z/6H9n+x/rP/L/h/6/9P+J/e/vP/Z/f/2/9j/t/7v9//p/3L/t/3P9v/af3L/wP4X9r/Z//n+b/cf2H98/5f9T+9/ff/d/h/7P9j/W/9v/e/3P7r/6v5397/e/0/73+t/ef/T/S/2f7L/3f6v9p/ff3T/n/1f7L+y/9v+3/of239w/8X+L/ff3H98/6f9X+2/vf/f/rf3L+0/sf/r/U/uf6L/W/8n+r/d/u//k/pP7f9x/Yf9P/S/1/7j/3f5P9z/W/9X+x/o/2f/D/t/7n+j/ff1v7V/W/9v+F/q/1v/n/q/1P7f/0/5X+n/W/+H+T/s/7L+y/9H+x/ev2n/l/v/3n98/+f+F/e/s/+t/p/1v9T/sP7j+t/rv9H/gP1/7j++//v97/d/uv/j/kf2P9f/2P7b+T/ff3b/6/0f9L+8/sf+L/p/7f7b/w/73+1/s/3X/+/1v9j+x/5/2P97/tP7V/q/3X9v/WP+P/b/0//n+P/e/uX98/4v93+1/qf3h/e/1P97/cf3v9H+9/7v9n+9/pv/f/c/vP7//1P7P9b/2P53+1/c/2z/qP2n9w/sP7z/g/0/9f+x/of2v9j/pf2v97/q/3D/d/t/6f+5/sP7n+z/fv/Z/gf3v7z/z/0f9H+2/0H9tP6/9L+3/6L9b/f/2n96/+P+3/qf3H9x/6H9//e/2/8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMh/AAcQ4F03BvHCAAAAAElFTSuQmCC';
        
        try {
            doc.addImage(sbiLogoPngBase64, 'PNG', margin, margin, 12, 12);
        } catch (e) {
            console.error("Error adding image to PDF:", e);
        }
        
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text("Amortization Schedule", margin + 15, margin + 9);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageWidth - margin, margin + 9, { align: 'right' });

        doc.setDrawColor(226, 232, 240); // slate-200
        doc.line(margin, margin + 18, pageWidth - margin, margin + 18);

        // --- 2. Summary (REVISED FOR BETTER ALIGNMENT & DESIGN) ---
        const summaryStartY = margin + 28;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(48, 59, 77);
        doc.text("Loan Details Summary", margin, summaryStartY);
        
        const summaryTableY = summaryStartY + 6;

        const leftSummaryData = [
            ['Loan Amount:', `${formatCurrencyForPdf(summary.principal)} INR`],
            ['Annual Interest Rate:', `${interestRate}%`],
            ['Tenure:', `${tenure} months`],
            ['Processing Fee (Base):', `${formatCurrencyForPdf(summary.processingFee)} INR`],
            ['Tax Rate (GST):', `${taxRate}%`],
        ];

        const rightSummaryData = [
            summary.firstEmi ? ['First EMI:', `${formatCurrencyForPdf(summary.firstEmi)} INR`] : ['Monthly EMI:', `${formatCurrencyForPdf(summary.emi)} INR`],
            summary.firstEmi ? ['Standard EMI:', `${formatCurrencyForPdf(summary.emi)} INR`] : ['Total Interest:', `${formatCurrencyForPdf(summary.totalInterest)} INR`],
            summary.firstEmi ? ['Total Interest:', `${formatCurrencyForPdf(summary.totalInterest)} INR`] : ['Total Tax:', `${formatCurrencyForPdf(summary.totalTax)} INR`],
            summary.firstEmi ? ['Total Tax:', `${formatCurrencyForPdf(summary.totalTax)} INR`] : [{ content: 'Total Payable:', styles: { fontStyle: 'bold' } }, { content: `${formatCurrencyForPdf(summary.totalPayable)} INR`, styles: { fontStyle: 'bold' } }],
            summary.firstEmi ? [{ content: 'Total Payable:', styles: { fontStyle: 'bold' } }, { content: `${formatCurrencyForPdf(summary.totalPayable)} INR`, styles: { fontStyle: 'bold' } }] : [{ content: 'Cost of Loan:', styles: { fontStyle: 'bold' } }, { content: `${formatCurrencyForPdf(summary.excessPayable)} INR`, styles: { fontStyle: 'bold' } }],
            summary.firstEmi ? [{ content: 'Cost of Loan:', styles: { fontStyle: 'bold' } }, { content: `${formatCurrencyForPdf(summary.excessPayable)} INR`, styles: { fontStyle: 'bold' } }] : []
        ].filter(row => row.length > 0);
        
        const tableWidth = (pageWidth - (margin * 2.5)) / 2; // Two tables with a small margin in between

        doc.autoTable({
            body: leftSummaryData,
            startY: summaryTableY,
            theme: 'grid',
            styles: {
                font: 'helvetica',
                fontSize: 9,
                cellPadding: 2,
                lineWidth: 0.1,
                lineColor: [203, 213, 225],
            },
            columnStyles: {
                0: { fontStyle: 'bold', textColor: [48, 59, 77] },
                1: { halign: 'right' },
            },
            margin: { left: margin, right: pageWidth - margin - tableWidth },
        });

        doc.autoTable({
            body: rightSummaryData,
            startY: summaryTableY,
            theme: 'grid',
            styles: {
                font: 'helvetica',
                fontSize: 9,
                cellPadding: 2,
                lineWidth: 0.1,
                lineColor: [203, 213, 225],
            },
            columnStyles: {
                0: { fontStyle: 'bold', textColor: [48, 59, 77] },
                1: { halign: 'right' },
            },
            margin: { left: margin + tableWidth + (margin / 2) },
        });


        // --- 3. Amortization Table ---
        const tableStartY = doc.lastAutoTable.finalY + 12;
        
        const tableColumn = ["Month", "Principal (INR)", "Interest (INR)", `Tax (${taxRate}%) (INR)`, "Fee (INR)", "Total Payment (INR)", "Balance (INR)"];
        const tableRows = schedule.map(entry => [
            entry.month,
            formatCurrencyForPdf(entry.principal),
            formatCurrencyForPdf(entry.interest),
            formatCurrencyForPdf(entry.tax),
            formatCurrencyForPdf(entry.processingFee),
            formatCurrencyForPdf(entry.totalPayment),
            formatCurrencyForPdf(entry.balance)
        ]);
        const totalsRow = [
            { content: "Totals", colSpan: 1, styles: { fontStyle: 'bold', halign: 'left' } },
            { content: formatCurrencyForPdf(summary.principal), styles: { fontStyle: 'bold', halign: 'right' } },
            { content: formatCurrencyForPdf(summary.totalInterest), styles: { fontStyle: 'bold', halign: 'right' } },
            { content: formatCurrencyForPdf(summary.totalTax), styles: { fontStyle: 'bold', halign: 'right' } },
            { content: formatCurrencyForPdf(summary.processingFee), styles: { fontStyle: 'bold', halign: 'right' } },
            { content: formatCurrencyForPdf(summary.totalPayable), styles: { fontStyle: 'bold', halign: 'right' } },
            { content: "", styles: { fontStyle: 'bold' } },
        ];
        
        const drawDisclaimer = (data: any) => {
            doc.setFontSize(8);
            doc.setTextColor(150);
            const footerText = "This is a computer-generated schedule for illustrative purposes only.";
            doc.text(footerText, pageWidth / 2, pageHeight - 8, { align: 'center' });
        };
        
        const columnStyles = {
            0: { halign: 'left' },
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right' },
        };

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            foot: [totalsRow],
            startY: tableStartY,
            showFoot: 'lastPage', // Show footer only on the last page
            margin: { left: margin, right: margin },
            theme: 'striped',
            headStyles: { 
                fillColor: [0, 85, 164], // SBI Blue
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            footStyles: {
                fillColor: [226, 232, 240], // slate-200
                textColor: [15, 23, 42], // slate-900
                fontStyle: 'bold',
                lineWidth: 0.2,
            },
            columnStyles: columnStyles,
            didDrawPage: drawDisclaimer,
        });

        // --- 4. Final Footer with "Page X of Y" ---
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            const pageStr = `Page ${i} of ${totalPages}`;
            doc.text(pageStr, pageWidth - margin, pageHeight - 8, { align: 'right' });
        }

        doc.save("SBI_Amortization_Schedule.pdf");
    }, [schedule, summary, interestRate, tenure, taxRate]);

    const handleExcelExport = useCallback(() => {
        if (!summary || schedule.length === 0) return;

        // Summary Sheet
        const summaryData = [
            ["Loan Details Summary"],
            [],
            ["Loan Amount", summary.principal],
            ["Annual Interest Rate (%)", parseFloat(interestRate)],
            ["Tenure (Months)", parseInt(tenure)],
            ["Tax Rate (GST) (%)", parseFloat(taxRate)],
            ["Processing Fee (Base)", summary.processingFee],
            [],
            ["Calculated Summary"],
            [],
            summary.firstEmi ? ["First EMI", summary.firstEmi] : ["Monthly EMI", summary.emi],
            summary.firstEmi ? ["Standard EMI (from 2nd Month)", summary.emi] : ["Total Interest", summary.totalInterest],
            summary.firstEmi ? ["Total Interest", summary.totalInterest] : ["Total Tax", summary.totalTax],
            summary.firstEmi ? ["Total Tax", summary.totalTax] : ["Total Payable", summary.totalPayable],
            summary.firstEmi ? ["Total Payable", summary.totalPayable] : ["Excess Payable (Cost of Loan)", summary.excessPayable],
            summary.firstEmi ? ["Excess Payable (Cost of Loan)", summary.excessPayable] : []
        ].filter(row => row.length > 0);
        
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        const currencyFormat = '₹#,##0.00';
        ['B3', 'B7', 'B11', 'B12', 'B13', 'B14', 'B15', 'B16'].forEach(cellRef => {
            if (summarySheet[cellRef]) summarySheet[cellRef].z = currencyFormat;
        });

        // Schedule Sheet
        const scheduleForExport = schedule.map(entry => ({
            'Month': entry.month,
            'Principal': entry.principal,
            'Interest': entry.interest,
            'Tax': entry.tax,
            'Processing Fee': entry.processingFee,
            'Total Payment': entry.totalPayment,
            'Balance': entry.balance,
        }));
        const scheduleSheet = XLSX.utils.json_to_sheet(scheduleForExport);
        ['B', 'C', 'D', 'E', 'F', 'G'].forEach(col => {
            for (let i = 2; i <= schedule.length + 1; i++) {
                if(scheduleSheet[col + i]) scheduleSheet[col + i].z = currencyFormat;
            }
        });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
        XLSX.utils.book_append_sheet(wb, scheduleSheet, "Amortization Schedule");

        summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
        scheduleSheet['!cols'] = [ { wch: 8 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];

        XLSX.writeFile(wb, "Amortization_Schedule.xlsx");

    }, [schedule, summary, interestRate, tenure, taxRate]);

    const chartData = summary ? [
        { label: 'Principal Amount', value: summary.principal, color: '#3b82f6' }, // blue-500
        { label: 'Total Interest', value: summary.totalInterest, color: '#f97316' }, // orange-500
        { label: `Total Tax (on Interest & Fee at ${taxRate}%)`, value: summary.totalTax, color: '#ef4444' }, // red-500
        { label: 'Processing Fee (Base)', value: summary.processingFee, color: '#8b5cf6' }, // violet-500
    ] : [];

    const isFirstEmiAdjusted = summary && summary.firstEmi && summary.firstEmi.toFixed(2) !== summary.emi.toFixed(2);

    return (
        <div className="bg-slate-100 min-h-screen font-sans text-slate-800">
            <header className="bg-white shadow-md">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <SbiLogo />
                        <div>
                           <h1 className="text-xl md:text-2xl font-bold text-slate-900">Credit Card EMI Calculator</h1>
                           <p className="text-sm text-slate-500">Amortization Schedule Generator</p>
                        </div>
                    </div>
                    <InstallPWAButton />
                </div>
            </header>
            
            <main className="container mx-auto p-4 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Input Form Section */}
                    <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-slate-800">
                            <CalculatorIcon />
                            Loan Details
                        </h2>
                        <div className="space-y-4">
                            <Input 
                                label="Loan Amount (₹)" 
                                id="loanAmount"
                                type="number"
                                placeholder="e.g., 100000"
                                value={loanAmount}
                                onChange={(e) => setLoanAmount(e.target.value)}
                                icon={<CurrencyRupeeIcon />}
                            />
                            <Input 
                                label="Annual Interest Rate (%)" 
                                id="interestRate"
                                type="number"
                                placeholder="e.g., 14"
                                value={interestRate}
                                onChange={(e) => setInterestRate(e.target.value)}
                                icon={<PercentIcon />}
                            />
                            <Input 
                                label="Tenure (Months)" 
                                id="tenure"
                                type="number"
                                placeholder="e.g., 24"
                                value={tenure}
                                onChange={(e) => setTenure(e.target.value)}
                                icon={<CalendarIcon />}
                            />
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-slate-600">First EMI Adjustment (Optional)</h3>
                                    <div className="relative group">
                                        <InformationCircleIcon />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-slate-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            To accurately calculate the first EMI, enter your transaction date. The first billing date (fixed at the 20th) and the due date (20 days after billing) will be calculated automatically. This reflects how SBI adjusts interest for the first payment cycle.
                                            <svg className="absolute text-slate-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                                        </div>
                                    </div>
                                </div>
                                <Input 
                                    label="Transaction Date" 
                                    id="transactionDate"
                                    type="date"
                                    value={transactionDate}
                                    onChange={(e) => setTransactionDate(e.target.value)}
                                    icon={<CalendarIcon />}
                                />
                                <Input 
                                    label="First Billing Date (auto-calculated)" 
                                    id="billingDate"
                                    type="date"
                                    value={billingDate}
                                    readOnly
                                    className="bg-slate-100 cursor-not-allowed"
                                    icon={<CalendarIcon />}
                                />
                                <Input 
                                    label="First EMI Due Date (auto-calculated)" 
                                    id="firstEmiDueDate"
                                    type="date"
                                    value={firstEmiDueDate}
                                    readOnly
                                    className="bg-slate-100 cursor-not-allowed"
                                    icon={<CalendarIcon />}
                                />
                            </div>
                             <Input 
                                label="Tax Rate (GST) (%)" 
                                id="taxRate"
                                type="number"
                                placeholder="e.g., 18"
                                value={taxRate}
                                onChange={(e) => setTaxRate(e.target.value)}
                                icon={<PercentIcon />}
                            />

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Processing Fee</label>
                                <div className="flex rounded-md shadow-sm">
                                    <button 
                                        onClick={() => setFeeType('percentage')}
                                        className={`px-4 py-2 text-sm rounded-l-md border border-slate-300 ${feeType === 'percentage' ? 'bg-blue-600 text-white border-blue-600 z-10' : 'bg-white hover:bg-slate-50'}`}
                                    >
                                        Percent (%)
                                    </button>
                                     <button 
                                        onClick={() => setFeeType('amount')}
                                        className={`px-4 py-2 text-sm rounded-r-md border border-l-0 border-slate-300 ${feeType === 'amount' ? 'bg-blue-600 text-white border-blue-600 z-10' : 'bg-white hover:bg-slate-50'}`}
                                    >
                                        Amount (₹)
                                    </button>
                                </div>

                                {feeType === 'percentage' ? (
                                    <Input 
                                        label=""
                                        id="processingFeeRate"
                                        type="number"
                                        placeholder="e.g., 1"
                                        value={processingFeeRate}
                                        onChange={(e) => setProcessingFeeRate(e.target.value)}
                                        className="mt-2"
                                        icon={<PercentIcon />}
                                    />
                                ) : (
                                    <Input 
                                        label=""
                                        id="processingFeeAmount"
                                        type="number"
                                        placeholder="e.g., 1000"
                                        value={processingFeeAmount}
                                        onChange={(e) => setProcessingFeeAmount(e.target.value)}
                                        className="mt-2"
                                        icon={<CurrencyRupeeIcon />}
                                    />
                                )}
                            </div>
                        </div>
                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                            <Button onClick={handleCalculate} disabled={isLoading} className="w-full">
                                {isLoading ? <SpinnerIcon /> : <CalculatorIcon />}
                                {isLoading ? 'Calculating...' : 'Generate Schedule'}
                            </Button>
                             <Button onClick={handleClear} disabled={isLoading} className="w-full bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 focus:ring-slate-400">
                                <TrashIcon />
                                Clear
                            </Button>
                        </div>
                         {error && <p className="mt-4 text-sm text-red-600 bg-red-100 p-3 rounded-md border border-red-200">{error}</p>}
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-2 space-y-8">
                        {summary && (
                            <div style={{ animationDelay: '100ms' }} className="animate-fadeInUp">
                                <h2 className="text-xl font-semibold mb-4 text-slate-800 flex items-center gap-2"><ChartPieIcon />Loan Summary</h2>
                                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                                        <PieChart data={chartData} formatCurrency={formatCurrency} />
                                    </div>
                                    <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {isFirstEmiAdjusted && summary.firstEmi && (
                                            <SummaryCard 
                                                title="First EMI"
                                                value={formatCurrency(summary.firstEmi)}
                                                icon={<WalletIcon />}
                                                className="sm:col-span-2 bg-indigo-50 border-indigo-200"
                                                iconBgClass="bg-indigo-100"
                                                iconTextColorClass="text-indigo-600"
                                            />
                                        )}
                                        <SummaryCard 
                                            title={isFirstEmiAdjusted ? "Standard EMI (from 2nd Month)" : "Monthly EMI"}
                                            value={formatCurrency(summary.emi)}
                                            icon={<WalletIcon />}
                                        />
                                        <SummaryCard 
                                            title="Principal Amount"
                                            value={formatCurrency(summary.principal)}
                                            icon={<PiggyBankIcon />}
                                        />
                                        <SummaryCard
                                            title="Total Interest"
                                            value={formatCurrency(summary.totalInterest)}
                                            icon={<BuildingLibraryIcon />}
                                        />
                                        <SummaryCard 
                                            title={`Total Tax (at ${taxRate}%)`}
                                            value={formatCurrency(summary.totalTax)}
                                            icon={<ReceiptPercentIcon />}
                                        />
                                        <SummaryCard
                                            title="Processing Fee (Base)"
                                            value={formatCurrency(summary.processingFee)}
                                            icon={<BriefcaseIcon />}
                                        />
                                        <SummaryCard
                                            title="Total Payable"
                                            value={formatCurrency(summary.totalPayable)}
                                            icon={<ShieldCheckIcon />}
                                            className="sm:col-span-2 bg-blue-50 border-blue-200"
                                            iconBgClass="bg-blue-100"
                                            iconTextColorClass="text-blue-600"
                                        />
                                        <SummaryCard
                                            title="Excess Payable (Cost of Loan)"
                                            value={formatCurrency(summary.excessPayable)}
                                            icon={<ExclamationTriangleIcon />}
                                            className="sm:col-span-2 bg-amber-50 border-amber-200"
                                            iconBgClass="bg-amber-100"
                                            iconTextColorClass="text-amber-600"
                                        />
                                   </div>
                                </div>
                            </div>
                        )}

                        {summary && schedule.length > 0 && (
                            <div style={{ animationDelay: '150ms' }} className="animate-fadeInUp">
                                <InstallmentBreakdown schedule={schedule} summary={summary} formatCurrency={formatCurrency} />
                            </div>
                        )}

                        {summary && (
                            <div style={{ animationDelay: '200ms' }} className="animate-fadeInUp">
                                <AIInsights
                                    onGetInsights={handleGetAIInsights}
                                    insights={aiInsights}
                                    isLoading={isAiLoading}
                                    error={aiError}
                                />
                            </div>
                        )}

                        {schedule.length > 0 && (
                             <div style={{ animationDelay: '250ms' }} className="animate-fadeInUp">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                                    <h2 className="text-xl font-semibold text-slate-800">Amortization Schedule</h2>
                                    <div className="flex gap-2">
                                        <Button onClick={handlePdfExport} className="w-full sm:w-auto text-sm bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:ring-red-400">
                                            <FilePdfIcon />
                                            Export PDF
                                        </Button>
                                        <Button onClick={handleExcelExport} className="w-full sm:w-auto text-sm bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:ring-green-400">
                                            <FileExcelIcon />
                                            Export Excel
                                        </Button>
                                    </div>
                                </div>
                                <AmortizationTable schedule={schedule} summary={summary} formatCurrency={formatCurrency} taxRate={parseFloat(taxRate) || 18} />
                             </div>
                        )}
                         {!summary && !isLoading && (
                            <div className="text-center py-16 px-6 bg-white rounded-2xl shadow-lg border border-slate-200">
                                <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                  <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="mt-2 text-lg font-medium text-slate-900">No schedule generated</h3>
                                <p className="mt-1 text-sm text-slate-500">Enter your loan details and click "Generate Schedule" to see your results.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
