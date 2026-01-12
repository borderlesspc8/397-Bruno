import React from 'react';

export const ProgressIndicator = () => <div className="bg-gray-200 h-2 rounded" />;
export const LoadingOverlay = () => <div className="fixed inset-0 bg-black/50 flex items-center justify-center"><div className="spinner" /></div>;
export const InlineLoader = () => <div className="inline-block animate-spin">⏳</div>;
