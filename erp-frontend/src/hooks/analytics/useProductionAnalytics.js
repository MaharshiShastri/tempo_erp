import { useCallback, useMemo, useState } from "react";
import API from "../../api/api";

export default function useProductionAnalytics({
    prodKpis = {},
    sessionToken,
    showErrorModal,
}) {

    const activeOrders = useMemo(() => {
        return (prodKpis?.production_stage ?? []).reduce(
            (sum, x) => sum + Number(x.count || 0),
            0
        );
    }, [prodKpis]);

    const productionPieChart = useMemo(() => ({
        labels: (prodKpis?.production_stage ?? []).map(
            x => x.stage
        ),

        datasets: [
            {
                data: (prodKpis?.production_stage ?? []).map(
                    x => Number(x.count || 0)
                ),

                backgroundColor: [
                    "#94a3b8", // Slate
                    "#3b82f6", // Blue
                    "#f59e0b", // Amber
                    "#10b981", // Emerald
                    "#8b5cf6", // Violet
                    "#06b6d4", // Cyan
                ],

                borderColor: "#ffffff",
                borderWidth: 3,

                hoverOffset: 10,

                borderRadius: 6,
            },
        ],
    }), [prodKpis]);

    const productionBarChart = useMemo(() => ({
        labels: (prodKpis?.task_summary ?? []).map(
            x => x.operator
        ),

        datasets: [
            {
                label: "Assigned",

                data: (prodKpis?.task_summary ?? []).map(
                    x => Number(x.assigned || 0)
                ),

                backgroundColor: "#3b82f6",

                borderRadius: 8,
                borderSkipped: false,

                barThickness: 22,

                hoverBackgroundColor: "#2563eb",
            },

            {
                label: "Received",

                data: (prodKpis?.task_summary ?? []).map(
                    x => Number(x.received || 0)
                ),

                backgroundColor: "#10b981",

                borderRadius: 8,
                borderSkipped: false,

                barThickness: 22,

                hoverBackgroundColor: "#059669",
            },
        ],
    }), [prodKpis]);

    const productionLineChart = useMemo(() => ({
        labels: (prodKpis?.daily_completed ?? []).map(
            x => x.day
        ),

        datasets: [
            {
                label: "Completed Tasks",

                data: (prodKpis?.daily_completed ?? []).map(
                    x => Number(x.completed || 0)
                ),

                borderColor: "#3b82f6",

                backgroundColor: "rgba(59, 130, 246, 0.12)",

                pointBackgroundColor: "#ffffff",
                pointBorderColor: "#3b82f6",
                pointBorderWidth: 3,
                pointRadius: 4,
                pointHoverRadius: 7,

                fill: true,

                tension: 0.4,

                borderWidth: 3,
            },
        ],
    }), [prodKpis]);

    // =========================================================
    // Pending orders
    // =========================================================

    const pendingOrderItems = useMemo(
        () => prodKpis?.pending_order_items ?? [],
        [prodKpis]
    );

    const pendingQuantity = useMemo(
        () => Number(
            prodKpis?.order_quantity_summary?.pending ?? 0
        ),
        [prodKpis]
    );

    // =========================================================
    // Download Excel
    // =========================================================

    const [isDownloadingPendingOrders, setIsDownloadingPendingOrders] =
        useState(false);

    const downloadPendingOrdersExcel = useCallback(async (fromDate, toDate) => {
        console.log("DOWNLOAD STARTED");
        console.log("DATE DEBUG:", { fromDate, toDate, fromDateType: typeof fromDate, toDateType: typeof toDate,});
        if (!fromDate || !toDate) {
            console.log("RETURNING: missing date");
            showErrorModal?.(
                "Pending Orders Report",
                "Please select a valid date range first."
            );

            return;
        }

        if (fromDate > toDate) {
            showErrorModal?.(
                "Pending Orders Report",
                "The start date cannot be later than the end date."
            );

            return;
        }

        try {
            setIsDownloadingPendingOrders(true);

            const blob = await API.downloadPendingOrdersExcel(
                sessionToken,
                fromDate,
                toDate
            );

            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = url;

            link.download =
                `Pending_Orders_${fromDate}_to_${toDate}.xlsx`;

            document.body.appendChild(link);

            link.click();

            link.remove();

            window.URL.revokeObjectURL(url);

        } catch (err) {

            console.error("Pending orders Excel download error:",err);

            showErrorModal?.(
                "Pending Orders Report",
                err?.message ||
                    "Unable to download pending orders report."
            );

        } finally {

            setIsDownloadingPendingOrders(false);

        }

    }, [
        sessionToken,
        showErrorModal,
    ]);

    return {
        activeOrders,

        productionPieChart,
        productionBarChart,
        productionLineChart,

        pendingOrderItems,
        pendingQuantity,

        downloadPendingOrdersExcel,
        isDownloadingPendingOrders,
    };
}