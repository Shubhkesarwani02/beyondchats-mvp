'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

interface ProgressChartProps {
  data: Array<{
    quizTitle: string;
    score: number;
    maxScore: number;
    percentage: number;
    date: string;
  }>;
  type?: 'bar' | 'line' | 'pie';
}

interface ProgressChartProps {
  data: Array<{
    quizTitle: string;
    score: number;
    maxScore: number;
    percentage: number;
    date: string;
  }>;
  type?: 'bar' | 'line' | 'pie';
}

export default function ProgressChart({ data, type = 'bar' }: ProgressChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No quiz data available</p>
      </div>
    );
  }

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="quizTitle" 
          angle={-45}
          textAnchor="end"
          height={80}
          fontSize={12}
        />
        <YAxis label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }} />
        <Tooltip 
          formatter={(value) => [`${value}%`, 'Score']}
          labelFormatter={(label) => `Quiz: ${label}`}
        />
        <Bar dataKey="percentage" fill="var(--chart-bar)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          fontSize={12}
        />
        <YAxis label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }} />
        <Tooltip 
          formatter={(value) => [`${value}%`, 'Score']}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Line
          type="monotone"
          dataKey="percentage"
          stroke="var(--chart-line)"
          strokeWidth={3}
          dot={{ r: 5, stroke: 'var(--chart-line)', strokeWidth: 2 }}
          activeDot={{ r: 7 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => {
    // Group data by score ranges for pie chart
    const scoreRanges = [
      { name: 'Excellent (90-100%)', min: 90, max: 100, color: 'var(--chart-excellent)' },
      { name: 'Good (70-89%)', min: 70, max: 89, color: 'var(--chart-good)' },
      { name: 'Fair (50-69%)', min: 50, max: 69, color: 'var(--chart-fair)' },
      { name: 'Poor (0-49%)', min: 0, max: 49, color: 'var(--chart-poor)' },
    ];

    const pieData = scoreRanges.map(range => ({
      name: range.name,
      value: data.filter(item => 
        item.percentage >= range.min && item.percentage <= range.max
      ).length,
      color: range.color,
    })).filter(item => item.value > 0);

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-[var(--color-text-muted)] mb-1">
          {type === 'bar' && 'Quiz Performance Overview'}
          {type === 'line' && 'Performance Trend Over Time'}
          {type === 'pie' && 'Score Distribution'}
        </h3>
        <p className="text-xs text-[var(--color-text-muted)]">
          {type === 'bar' && 'Your scores across different quizzes'}
          {type === 'line' && 'How your performance has changed over time'}
          {type === 'pie' && 'Distribution of your quiz scores by performance level'}
        </p>
      </div>
      
      {type === 'bar' && renderBarChart()}
      {type === 'line' && renderLineChart()}
      {type === 'pie' && renderPieChart()}
    </div>
  );
}