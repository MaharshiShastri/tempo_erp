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
                    x => x.count
                ),

                backgroundColor: [
                    "rgba(201,203,207,.8)",
                    "rgba(54,162,235,.8)",
                    "rgba(255,206,86,.8)",
                    "rgba(75,192,192,.8)",
                    "rgba(153,102,255,.8)"
                ]
            }
        ]
    }), [prodKpis]);

    const productionBarChart = useMemo(() => ({
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
    }), [prodKpis]);

    const productionLineChart = useMemo(() => ({
        labels: (prodKpis?.daily_completed ?? []).map(
            x => x.day
        ),

        datasets: [
            {
                label: "Completed Tasks",

                data: (prodKpis?.daily_completed ?? []).map(
                    x => x.completed
                ),

                borderColor: "#2490ef",
                backgroundColor: "rgba(36,144,239,.25)",
                pointBackgroundColor: "#2490ef",
                pointBorderColor: "#2490ef",
                fill: true,
                tension: 0.35
            }
        ]
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