import React from 'react';

interface PieChartData {
    label: string;
    value: number;
    color: string;
}

interface PieChartProps {
    data: PieChartData[];
    formatCurrency: (value: number) => string;
}

const Slice: React.FC<{
    percent: number;
    startPercent: number;
    radius: number;
    color: string;
    label: string;
    valueFormatted: string;
    index: number;
}> = ({ percent, startPercent, radius, color, label, valueFormatted, index }) => {

    const getCoordinates = (p: number) => {
        const x = Math.cos(2 * Math.PI * p) * radius;
        const y = Math.sin(2 * Math.PI * p) * radius;
        return [x, y];
    };

    const [startX, startY] = getCoordinates(startPercent);
    const endPercent = startPercent + percent;
    const [endX, endY] = getCoordinates(endPercent);

    const largeArcFlag = percent > 0.5 ? 1 : 0;

    const pathData = [
        `M ${startX} ${startY}`, // Move
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`, // Arc
        `L 0 0`, // Line to center
    ].join(' ');

    return (
        <path d={pathData} fill={color} className="pie-slice" style={{ animationDelay: `${index * 100}ms` }}>
            <title>{`${label}: ${valueFormatted} (${(percent * 100).toFixed(1)}%)`}</title>
        </path>
    );
};


export const PieChart: React.FC<PieChartProps> = ({ data, formatCurrency }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <p className="text-slate-500 text-center">Generate a schedule to see the cost breakdown.</p>
            </div>
        );
    }
    
    const radius = 48; // using a viewbox of 100x100
    let accumulatedPercent = 0;

    return (
        <div className="flex flex-col items-center p-4 h-full justify-center">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center">Total Payment Breakdown</h3>
            <div className="relative w-48 h-48 mb-4">
                <svg viewBox="-50 -50 100 100" className="transform -rotate-90 w-full h-full">
                    {data.map((item, index) => {
                        const percent = item.value > 0 ? item.value / total : 0;
                        const slice = (
                            <Slice
                                key={index}
                                index={index}
                                percent={percent}
                                startPercent={accumulatedPercent}
                                radius={radius}
                                color={item.color}
                                label={item.label}
                                valueFormatted={formatCurrency(item.value)}
                            />
                        );
                        accumulatedPercent += percent;
                        return slice;
                    })}
                </svg>
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                         <span className="text-xs text-slate-500">Total</span>
                         <p className="font-bold text-slate-800 text-lg leading-tight">{formatCurrency(total)}</p>
                    </div>
                </div>
            </div>
            <div className="w-full max-w-sm">
                <ul className="space-y-2">
                    {data.map((item, index) => (
                        <li key={index} className="flex items-center justify-between text-sm animate-fadeInUp" style={{ animationDelay: `${300 + index * 100}ms`}}>
                            <div className="flex items-center min-w-0">
                                <span className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                                <span className="text-slate-600 truncate mr-2" title={item.label}>{item.label}</span>
                            </div>
                            <span className="font-semibold text-slate-800 whitespace-nowrap">
                                {formatCurrency(item.value)}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
