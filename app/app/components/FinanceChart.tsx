"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface FinanceDataPoint {
  year: string;
  revenue: number;
  operating: number;
  net: number;
  roe: number;
  per: number;
  pbr: number;
  dividend: number;
}

interface Props {
  data: FinanceDataPoint[];
}

export default function FinanceChart({ data }: Props) {
  // データを表示用に変換
  const chartData = data.map((item) => ({
    year: item.year,
    revenue: Math.round(item.revenue / 100), // 億円
    operating: Math.round(item.operating / 100), // 億円
    net: Math.round(item.net / 100), // 億円
    roe: item.roe,
    dividend: item.dividend,
  }));

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4 text-indigo-700 flex items-center">
        <span className="mr-2">📊</span>財務推移グラフ
      </h3>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis yAxisId="left" orientation="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip
              formatter={(value, name) => {
                if (name === "ROE (%)" || name === "配当利回り (%)") {
                  return [`${value}%`, name];
                }
                return [`${value}億円`, name];
              }}
              labelFormatter={(label) => `${label}年度`}
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="revenue"
              fill="#3b82f6"
              name="売上高"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="operating"
              stroke="#f97316"
              strokeWidth={2}
              name="営業利益"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="net"
              stroke="#22c55e"
              strokeWidth={2}
              name="純利益"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="roe"
              stroke="#ef4444"
              strokeWidth={2}
              name="ROE (%)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="dividend"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="配当利回り (%)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700 flex items-center">
          <span className="mr-1">ℹ️</span>
          左軸: 金額（億円）、右軸:
          比率（%）。売上高は棒グラフ、その他は折れ線グラフで表示。
        </p>
      </div>
    </div>
  );
}
