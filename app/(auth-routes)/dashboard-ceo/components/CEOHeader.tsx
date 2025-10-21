'use client';

import React from 'react';
import { TrendingUp, BarChart3, DollarSign } from 'lucide-react';

export function CEOHeader() {
  return (
    <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg">
      <div className="px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard CEO</h1>
              <p className="text-orange-100 text-sm mt-1">
                Visão Executiva e Indicadores Estratégicos
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center space-x-4 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-orange-200" />
                <span className="text-sm font-medium">Performance</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-orange-200" />
                <span className="text-sm font-medium">Financeiro</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


