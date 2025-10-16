import React from 'react';

interface SummaryCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    className?: string;
    iconBgClass?: string;
    iconTextColorClass?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, className = '', iconBgClass = 'bg-blue-100', iconTextColorClass = 'text-blue-600' }) => {
    return (
        <div className={`bg-slate-50 p-4 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4 transition-all duration-300 hover:shadow-md hover:border-blue-300 ${className}`}>
             <div className={`flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full transition-colors duration-300 ${iconBgClass} ${iconTextColorClass}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-slate-600">{title}</p>
                <p className="text-xl lg:text-2xl font-bold text-slate-900">{value}</p>
            </div>
        </div>
    );
};
