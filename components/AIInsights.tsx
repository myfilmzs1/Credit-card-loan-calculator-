import React from 'react';
import { Button } from './Button';
import { SparklesIcon, SpinnerIcon } from '../constants';

const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    // This regex splits the text into paragraphs or list blocks
    const blocks = text.split(/(\n\n+|\n(?=\*))/).filter(Boolean);

    const renderBlock = (block: string, index: number) => {
        const lines = block.trim().split('\n');
        
        // Check if it's a list
        if (lines.every(line => line.trim().startsWith('* '))) {
            return (
                <ul key={index} className="list-disc pl-5 space-y-1">
                    {lines.map((line, j) => (
                        <li key={j} dangerouslySetInnerHTML={{ __html: line.trim().substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                    ))}
                </ul>
            );
        }

        // Otherwise, it's a paragraph
        return (
            <p key={index} dangerouslySetInnerHTML={{ __html: block.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
        );
    };

    return <div className="space-y-4 text-slate-700 leading-relaxed">{blocks.map(renderBlock)}</div>;
};


interface AIInsightsProps {
    onGetInsights: () => void;
    insights: string;
    isLoading: boolean;
    error: string;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ onGetInsights, insights, isLoading, error }) => {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
            <h2 className="text-xl font-semibold mb-4 text-slate-800 flex items-center gap-2">
                <SparklesIcon />
                AI Financial Insights
            </h2>
            
            {!insights && !isLoading && !error && (
                <div className="text-center py-4">
                    <p className="text-slate-600 mb-4">Get a personalized analysis of your loan and tips for effective management.</p>
                    <Button onClick={onGetInsights} disabled={isLoading} className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 focus:ring-violet-400">
                        <SparklesIcon />
                        Analyze My Loan
                    </Button>
                </div>
            )}

            {isLoading && (
                 <div className="flex items-center justify-center gap-3 text-slate-600 py-8">
                    <SpinnerIcon />
                    <span>Generating insights... This may take a moment.</span>
                </div>
            )}
            
            {error && <p className="mt-4 text-sm text-red-600 bg-red-100 p-3 rounded-md border border-red-200">{error}</p>}

            {insights && (
                 <div className="prose prose-slate max-w-none">
                    <SimpleMarkdown text={insights} />
                </div>
            )}
        </div>
    );
};