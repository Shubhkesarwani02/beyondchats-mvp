'use client';

import React from 'react';

interface Topic {
  topic: string;
  avgScore: number;
  attempts: number;
  totalScore: number;
  maxScore: number;
}

interface StrengthListProps {
  topics: Topic[];
}

export default function StrengthList({ topics }: StrengthListProps) {
  if (!topics || topics.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Topic Performance</h3>
        <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No topic data available</p>
        </div>
      </div>
    );
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-blue-600 bg-blue-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getPerformanceLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Topic Performance</h3>
        <p className="text-sm text-gray-600">Your strengths and areas for improvement</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">Topic</th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">Attempts</th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">Avg Score</th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">Performance</th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">Progress</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((topic, index) => (
              <tr key={topic.topic} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="py-3 px-4">
                  <div className="font-medium text-gray-900">{topic.topic}</div>
                  <div className="text-sm text-gray-500">
                    {topic.totalScore}/{topic.maxScore} points
                  </div>
                </td>
                <td className="text-center py-3 px-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {topic.attempts}
                  </span>
                </td>
                <td className="text-center py-3 px-4">
                  <span className="font-semibold text-lg">{topic.avgScore}%</span>
                </td>
                <td className="text-center py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPerformanceColor(topic.avgScore)}`}>
                    {getPerformanceLabel(topic.avgScore)}
                  </span>
                </td>
                <td className="text-center py-3 px-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${topic.avgScore}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 mt-1">{topic.avgScore}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Performance Legend</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 rounded"></div>
            <span className="text-green-700">Excellent (90%+)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-100 rounded"></div>
            <span className="text-blue-700">Good (70-89%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-100 rounded"></div>
            <span className="text-yellow-700">Fair (50-69%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-100 rounded"></div>
            <span className="text-red-700">Needs Improvement (&lt;50%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}