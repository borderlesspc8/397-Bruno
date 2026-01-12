import React from 'react';

export const CardSkeleton = () => <div className="bg-gray-200 h-20 rounded" />;
export const MetricCardSkeleton = () => <div className="bg-gray-200 h-20 rounded" />;
export const MetricsGridSkeleton = () => <div className="grid grid-cols-3 gap-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>;
