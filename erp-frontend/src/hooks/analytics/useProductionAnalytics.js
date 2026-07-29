import { useMemo } from "react";

export default function useProductionAnalytics({prodKpis=[]}){

    return useMemo(() => {

        const activeOrders = (prodKpis?.production_stage ?? []).reduce((sum, x) => sum + Number(x.count), 0);

        const productionPieChart = { labels: (prodKpis?.production_stage ?? []).map(x => x.stage),
            datasets: [
                {
                    data: (prodKpis?.production_stage ?? []).map(x => x.count),
                    backgroundColor: [
                        "rgba(201,203,207,.8)",
                        "rgba(54,162,235,.8)",
                        "rgba(255,206,86,.8)",
                        "rgba(75,192,192,.8)",
                        "rgba(153,102,255,.8)"
                    ]
                }
            ]
        };

        // ==============================
        // Tasks Assigned / Received
        // ==============================

        const productionBarChart = {

            labels: (prodKpis?.task_summary ?? []).map(
                x => x.operator
            ),

            datasets: [

                {

                    label: "Assigned",

                    data: (prodKpis?.task_summary ?? []).map(
                        x => x.assigned
                    ),

                    backgroundColor: "#2490ef"

                },

                {

                    label: "Received",

                    data: (prodKpis?.task_summary ?? []).map(
                        x => x.received
                    ),

                    backgroundColor: "#22c55e"

                }

            ]

        };

        // ==============================
        // Daily Completed Tasks
        // ==============================

        const productionLineChart = {

            labels: (prodKpis?.daily_completed ?? []).map(x => x.day),

            datasets: [

                {

                    label: "Completed Tasks",

                    data: (prodKpis?.daily_completed ?? []).map(x => x.completed),

                    borderColor: "#2490ef",

                    backgroundColor: "rgba(36,144,239,.25)",

                    pointBackgroundColor: "#2490ef",

                    pointBorderColor: "#2490ef",

                    fill: true,

                    tension: 0.35

                }

            ]
        };


        return {activeOrders, productionPieChart, productionBarChart, productionLineChart};

    }, [prodKpis]);


}