
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
    icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, id, icon, className, ...props }) => {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
                {label}
            </label>
            <div className="relative rounded-md shadow-sm">
                 {icon && (
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                       {icon}
                    </div>
                )}
                <input
                    id={id}
                    {...props}
                    className={`w-full h-11 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${icon ? 'pl-10' : ''} ${className || ''}`}
                />
            </div>
        </div>
    );
};
