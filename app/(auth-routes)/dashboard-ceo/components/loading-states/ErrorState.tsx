import React from 'react';

export const ErrorState = ({ message = 'Erro' }) => <div className="bg-red-100 text-red-700 p-4 rounded">{message}</div>;
export const ApiErrorState = ({ message = 'Erro na API' }) => <div className="bg-red-100 text-red-700 p-4 rounded">{message}</div>;
export const NoDataState = ({ message = 'Nenhum dado' }) => <div className="bg-gray-100 text-gray-700 p-4 rounded">{message}</div>;
