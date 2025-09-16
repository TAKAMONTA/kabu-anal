"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  labels: string[];
  prices: number[];
  unit?: string;
}

export default function StockChart({ labels, prices, unit = "" }: Props) {
  const data = {
    labels,
    datasets: [
      {
        label: unit ? `株価（${unit}）` : "株価",
        data: prices,
        borderColor: "rgb(37, 99, 235)",
        backgroundColor: "rgba(37, 99, 235, 0.2)",
        tension: 0.2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: { display: true, text: "直近30日の株価推移" },
    },
    scales: {
      x: { ticks: { maxTicksLimit: 6 } },
    },
  };

  return <Line data={data} options={options} />;
}
