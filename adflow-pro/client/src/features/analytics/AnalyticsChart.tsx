import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

const CHART_DEFAULTS = {
  plugins: {
    legend: { labels: { color: '#9ca3af', font: { family: 'DM Sans' } } },
    tooltip: {
      backgroundColor: '#1a1a1a',
      borderColor: '#2a2a2a',
      borderWidth: 1,
      titleColor: '#fff',
      bodyColor: '#9ca3af',
    },
  },
  scales: {
    x: { ticks: { color: '#6b7280' }, grid: { color: '#1f1f1f' } },
    y: { ticks: { color: '#6b7280' }, grid: { color: '#1f1f1f' } },
  },
};

interface AnalyticsData {
  labels: string[];
  datasets: { label: string; data: number[]; color?: string }[];
}

export function RevenueChart({ data }: { data: AnalyticsData }) {
  return (
    <Bar
      data={{
        labels: data.labels,
        datasets: data.datasets.map((d, i) => ({
          label: d.label,
          data: d.data,
          backgroundColor: d.color || ['rgba(217,70,239,0.7)', 'rgba(249,115,22,0.7)', 'rgba(59,130,246,0.7)'][i % 3],
          borderRadius: 6,
        })),
      }}
      options={{ ...CHART_DEFAULTS, responsive: true, maintainAspectRatio: false }}
    />
  );
}

export function AdTrendsChart({ data }: { data: AnalyticsData }) {
  return (
    <Line
      data={{
        labels: data.labels,
        datasets: data.datasets.map((d, i) => ({
          label: d.label,
          data: d.data,
          borderColor: d.color || ['#d946ef', '#f97316', '#3b82f6'][i % 3],
          backgroundColor: (d.color || '#d946ef') + '20',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
        })),
      }}
      options={{ ...CHART_DEFAULTS, responsive: true, maintainAspectRatio: false }}
    />
  );
}

export function PackageBreakdownChart({ data }: { data: { label: string; value: number }[] }) {
  return (
    <Doughnut
      data={{
        labels: data.map((d) => d.label),
        datasets: [{
          data: data.map((d) => d.value),
          backgroundColor: ['rgba(107,114,128,0.8)', 'rgba(59,130,246,0.8)', 'rgba(217,70,239,0.8)'],
          borderWidth: 0,
        }],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#9ca3af', padding: 16, font: { family: 'DM Sans' } },
          },
          tooltip: CHART_DEFAULTS.plugins.tooltip,
        },
      }}
    />
  );
}

// Stat card
interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  color?: string;
}

export function StatCard({ label, value, change, icon, color = 'brand' }: StatCardProps) {
  const colorMap: Record<string, string> = {
    brand: 'bg-brand-900/30 text-brand-400',
    orange: 'bg-orange-900/30 text-orange-400',
    blue: 'bg-blue-900/30 text-blue-400',
    green: 'bg-green-900/30 text-green-400',
    red: 'bg-red-900/30 text-red-400',
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm">{label}</p>
          <p className="font-display font-bold text-2xl text-white mt-1">{value}</p>
          {change !== undefined && (
            <p className={`text-xs mt-1 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% from last month
            </p>
          )}
        </div>
        {icon && (
          <div className={`p-2.5 rounded-lg ${colorMap[color] || colorMap.brand}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}