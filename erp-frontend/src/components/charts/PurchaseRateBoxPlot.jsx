import { useMemo } from "react";
import { Chart } from "react-chartjs-2";

import { Chart as ChartJS, CategoryScale, LinearScale, Tooltip, Legend,} from "chart.js";

import {BoxPlotController, BoxAndWiskers,} from "@sgratzl/chartjs-chart-boxplot";

ChartJS.register(CategoryScale, LinearScale, Tooltip, Legend, BoxPlotController,BoxAndWiskers);

export default function PurchaseRateBoxPlot({batches = [], groupBy = "supplier",}) {
  const chartData = useMemo(() => {
    if (!Array.isArray(batches) || !batches.length) {
      return {labels: [], datasets: [],};
    }

    const grouped = batches.reduce((acc, batch) => {
      const key = groupBy === "item" ? batch.item_code || "Unknown Item" : batch.supplier || "Unknown Supplier";

      const rate = Number(batch.rate || 0);

      if (!acc[key]) {acc[key] = [];}

      if (rate > 0) {acc[key].push(rate);}

      return acc;
    }, {});

    const sortedEntries = Object.entries(grouped)
      .filter(([, values]) => values.length > 0)
      .sort((a, b) => {
        const avgA = a[1].reduce((sum, value) => sum + value, 0) / a[1].length;

        const avgB = b[1].reduce((sum, value) => sum + value, 0) / b[1].length;

        return avgB - avgA;
      });

    return {
      labels: sortedEntries.map(([label]) => label),

      datasets: [
        {
          label: "Purchase Rate",

          data: sortedEntries.map(([, values]) => values),

          backgroundColor: "rgba(59, 130, 246, 0.35)",

          borderColor: "rgb(59, 130, 246)",

          borderWidth: 2,

          outlierColor: "#ef4444",

          padding: 10,
        },
      ],
    };
  }, [batches, groupBy]);

  const options = useMemo(
    () => ({
      responsive: true,

      maintainAspectRatio: false,

      plugins: {legend: {display: false,},

        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.95)",

          padding: 12,

          cornerRadius: 10,

          callbacks: {
            label(context) {
              const raw = context.raw;

              if (!raw) return "";

              return [
                `Max: ₹${Number(raw.max ?? 0).toFixed(2)}`,
                `Q3: ₹${Number(raw.q3 ?? 0).toFixed(2)}`,
                `Median: ₹${Number(raw.median ?? 0).toFixed(2)}`,
                `Q1: ₹${Number(raw.q1 ?? 0).toFixed(2)}`,
                `Min: ₹${Number(raw.min ?? 0).toFixed(2)}`,
              ];
            },
          },
        },
      },

      scales: {
        x: {grid: 
            {display: false,},

            ticks: {
                color: "#64748b",

                maxRotation: 45,

                minRotation: 0,

                font: {size: 11,},
            },
        },

        y: {
          beginAtZero: true,

          title: {
            display: true,

            text: "Purchase Rate (₹)",
          },

          grid: {color: "rgba(148, 163, 184, 0.15)",},

          ticks: {
            color: "#64748b",

            callback(value) {return `₹${value}`;},
          },
        },
      },
    }),
    []
  );

  return (
    <Chart type="boxplot" data={chartData} options={options}/>
  );
}