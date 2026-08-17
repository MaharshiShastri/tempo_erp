import { useMemo, useState } from "react";
import { Line, Bar, Pie } from "react-chartjs-2";

import GeoMapCanvas from "../components/geo/GeoMapCanvas";
import SearchableMultiSelect from "../components/shared/SearchableMultiselect";

export default function ProductionAnalyticsView({ state }) {

    const {
        productionBarChart,
        productionPieChart,
        productionLineChart,
        prodKpis,
        fetchAnalytics,
        fromDate,
        toDate,
        setFromDate,
        setToDate,
        downloadPendingOrdersExcel,
        isDownloadingPendingOrders,

        // Existing geographic state
        indiaMap,
        visibleMap,
        isLoading,

        selectedStates,
        setSelectedStates,

        selectedItems,
        setSelectedItems,

        selectedGroups,
        setSelectedGroups,
    } = state;

    const [activeView, setActiveView] = useState("statistics");

    const orderSummary =
        prodKpis?.order_quantity_summary || {
            ordered: 0,
            shipped: 0,
            pending: 0,
        };

    const fulfillmentPercentage =
        orderSummary.ordered > 0
            ? (
                  (orderSummary.shipped / orderSummary.ordered) *
                  100
              ).toFixed(1)
            : "0.0";

    // ============================================================
    // Geographic data
    // ============================================================

    const stateList = useMemo(() => {

        if (!Array.isArray(indiaMap?.features)) {
            return [];
        }

        return indiaMap.features
            .map(feature => feature?.properties?.ST_NM)
            .filter(Boolean)
            .sort();

    }, [indiaMap]);

    const itemsMaster = state?.itemsMaster ?? [];

    const itemGroups = useMemo(() => {

        return [
            ...new Set(
                itemsMaster
                    .map(item => item?.item_group)
                    .filter(Boolean)
            ),
        ].sort();

    }, [itemsMaster]);

    // item_code -> item_group
    const itemGroupMap = useMemo(() => {

        return Object.fromEntries(
            itemsMaster.map(item => [
                item.item_code,
                item.item_group || "General",
            ])
        );

    }, [itemsMaster]);

    // item_code -> item data
    const itemMap = useMemo(() => {

        return Object.fromEntries(
            itemsMaster.map(item => [
                item.item_code,
                item,
            ])
        );

    }, [itemsMaster]);

    // ============================================================
    // Pending orders
    // ============================================================

    const pendingOrderItems =
        prodKpis?.pending_order_items ?? [];

    const filteredPendingOrderItems = useMemo(() => {

        return pendingOrderItems.filter(row => {

            const itemCode = row?.item_code || "";

            const group =
                itemGroupMap[itemCode] || "General";

            const itemMatches =
                !selectedItems?.length ||
                selectedItems.includes(itemCode);

            const groupMatches =
                !selectedGroups?.length ||
                selectedGroups.includes(group);

            const stateMatches =
                !selectedStates?.length ||
                selectedStates.includes(row?.state_name);

            return (
                itemMatches &&
                groupMatches &&
                stateMatches
            );

        });

    }, [
        pendingOrderItems,
        itemGroupMap,
        selectedItems,
        selectedGroups,
        selectedStates,
    ]);

    // ============================================================
    // Geo totals
    // ============================================================

    const geoSummary = useMemo(() => {

        return filteredPendingOrderItems.reduce(
            (summary, row) => {

                summary.ordered += Number(
                    row?.ordered_quantity || 0
                );

                summary.shipped += Number(
                    row?.shipped_quantity || 0
                );

                summary.pending += Number(
                    row?.pending_quantity || 0
                );

                return summary;

            },
            {
                ordered: 0,
                shipped: 0,
                pending: 0,
            }
        );

    }, [filteredPendingOrderItems]);

    // ============================================================
    // Geo fulfillment %
    // ============================================================

    const geoFulfillmentPercentage =
        geoSummary.ordered > 0
            ? (
                  (geoSummary.shipped /
                      geoSummary.ordered) *
                  100
              ).toFixed(1)
            : "0.0";

    // ============================================================
    // Loading
    // ============================================================

    if (isLoading) {
        return (
            <div className="frappe-card">
                <p>Loading analytics...</p>
            </div>
        );
    }

    return (
        <div className="print-section">

            {/* =====================================================
                HEADER
            ====================================================== */}

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 25,
                }}
            >

                <div>

                    <h2>🏭 Production Dashboard</h2>

                    <p className="text-muted">
                        Shop Floor Performance Analytics
                    </p>

                </div>

                <div
                    style={{
                        display: "flex",
                        gap: 15,
                        alignItems: "end",
                    }}
                >

                    <div className="form-group">

                        <label>From</label>

                        <input
                            className="form-input"
                            type="date"
                            value={fromDate}
                            onChange={e =>
                                setFromDate(e.target.value)
                            }
                        />

                    </div>

                    <div className="form-group">

                        <label>To</label>

                        <input
                            className="form-input"
                            type="date"
                            value={toDate}
                            onChange={e =>
                                setToDate(e.target.value)
                            }
                        />

                    </div>

                    <button
                        className="btn-primary"
                        onClick={() =>
                            fetchAnalytics(
                                "Shop Floor Administrator",
                                fromDate,
                                toDate
                            )
                        }
                    >
                        Refresh
                    </button>

                </div>

            </div>

            {/* =====================================================
                NAVIGATION
            ====================================================== */}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(4, minmax(0, 1fr))",
                    marginBottom: 25,
                    gap: 12,
                }}
            >

                <button
                    className={
                        activeView === "statistics"
                            ? "btn-primary"
                            : "btn-text"
                    }
                    onClick={() =>
                        setActiveView("statistics")
                    }
                >
                    Statistics
                </button>

                <button
                    className={
                        activeView === "charts"
                            ? "btn-primary"
                            : "btn-text"
                    }
                    onClick={() =>
                        setActiveView("charts")
                    }
                >
                    Charts
                </button>

                <button
                    className={
                        activeView === "shopfloor"
                            ? "btn-primary"
                            : "btn-text"
                    }
                    onClick={() =>
                        setActiveView("shopfloor")
                    }
                >
                    Shop Floor
                </button>

                <button
                    className={
                        activeView === "geo"
                            ? "btn-primary"
                            : "btn-text"
                    }
                    onClick={() =>
                        setActiveView("geo")
                    }
                >
                    Geographic
                </button>

            </div>

            {/* =====================================================
                STATISTICS
            ====================================================== */}

            {activeView === "statistics" && (

                <>

                    <div className="frappe-card" style={{ marginBottom: 25, padding: "18px 22px", border: "1px solid var(--border-subtle)", background: "var(--bg-surface)",}}>
                        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap",}}>

                            {/* Left */}
                            <div style={{display: "flex", alignItems: "center", gap: 14,}}>

                                <div
                                    style={{
                                        width: 46,
                                        height: 46,
                                        borderRadius: 10,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        background: "rgba(34,197,94,.10)",
                                        color: "var(--brand-success)",
                                        fontSize: 22,
                                        flexShrink: 0,
                                    }}
                                >
                                    📊
                                </div>

                                <div>

                                    <h3
                                        style={{
                                            margin: 0,
                                            fontSize: 16,
                                        }}
                                    >
                                        Pending Orders Report
                                    </h3>

                                    <p
                                        style={{
                                            margin: "4px 0 0",
                                            color: "var(--text-muted)",
                                            fontSize: 13,
                                        }}
                                    >
                                        Export all pending order quantities for the
                                        selected date range to Excel.
                                    </p>

                                </div>

                            </div>

                            {/* Right */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 14,
                                }}
                            >

                                <div
                                    style={{
                                        textAlign: "right",
                                        minWidth: 90,
                                    }}
                                >

                                    <strong
                                        style={{
                                            display: "block",
                                            fontSize: 20,
                                            color: "var(--brand-danger)",
                                        }}
                                    >
                                        {orderSummary.pending}
                                    </strong>

                                    <span
                                        style={{
                                            fontSize: 11,
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        Pending quantity
                                    </span>

                                </div>

                                <button

                                    type="button"
                                    className="btn-primary"
                                    onClick={() => {downloadPendingOrdersExcel(fromDate, toDate)}}
                                    disabled={
                                        isDownloadingPendingOrders ||
                                        !fromDate ||
                                        !toDate
                                    }
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 8,
                                        minWidth: 180,
                                        padding: "10px 16px",
                                        opacity:
                                            isDownloadingPendingOrders
                                                ? 0.7
                                                : 1,
                                    }}
                                >

                                    {isDownloadingPendingOrders ? (
                                        <>
                                            <span>⏳</span>
                                            Preparing Excel...
                                        </>
                                    ) : (
                                        <>
                                            <span>⬇️</span>
                                            Download Excel
                                        </>
                                    )}

                                </button>

                            </div>

                        </div>

                        {/* Date context */}
                        <div
                            style={{
                                marginTop: 14,
                                paddingTop: 12,
                                borderTop:
                                    "1px solid var(--border-subtle)",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                color: "var(--text-muted)",
                                fontSize: 12,
                            }}
                        >
                            <span>📅</span>

                            <span>
                                Report period:
                            </span>

                            <strong
                                style={{
                                    color: "var(--text-primary)",
                                }}
                            >
                                {fromDate || "—"}
                            </strong>

                            <span>→</span>

                            <strong
                                style={{
                                    color: "var(--text-primary)",
                                }}
                            >
                                {toDate || "—"}
                            </strong>

                        </div>

                    </div>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(4, minmax(0, 1fr))",
                            gap: 20,
                            marginBottom: 25,
                        }}
                    >

                        <div className="frappe-card">

                            <h4>Products Ordered</h4>

                            <h1>
                                {orderSummary.ordered}
                            </h1>

                            <small
                                style={{
                                    color:
                                        "var(--text-muted)",
                                }}
                            >
                                Order quantity
                            </small>

                        </div>

                        <div className="frappe-card">

                            <h4>Products Shipped</h4>

                            <h1
                                style={{
                                    color:
                                        "var(--brand-success)",
                                }}
                            >
                                {orderSummary.shipped}
                            </h1>

                            <small
                                style={{
                                    color:
                                        "var(--text-muted)",
                                }}
                            >
                                Delivered quantity
                            </small>

                        </div>

                        <div className="frappe-card">

                            <h4>Products Pending</h4>

                            <h1
                                style={{
                                    color:
                                        "var(--brand-danger)",
                                }}
                            >
                                {orderSummary.pending}
                            </h1>

                            <small
                                style={{
                                    color:
                                        "var(--text-muted)",
                                }}
                            >
                                Remaining quantity
                            </small>

                        </div>

                        <div className="frappe-card">

                            <h4>Fulfillment</h4>

                            <h1
                                style={{
                                    color:
                                        "var(--brand-accent)",
                                }}
                            >
                                {fulfillmentPercentage}%
                            </h1>

                            <small
                                style={{
                                    color:
                                        "var(--text-muted)",
                                }}
                            >
                                Shipped / ordered
                            </small>

                        </div>

                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "1fr 1fr",
                            gap: 25,
                        }}
                    >

                        {/* Pending */}

                        <div className="frappe-card">

                            <div className="system-header">

                                <div>

                                    <h3>
                                        Pending Order Fulfillment
                                    </h3>

                                    <p
                                        style={{
                                            margin:
                                                "4px 0 0",
                                            color:
                                                "var(--text-muted)",
                                            fontSize: 13,
                                        }}
                                    >
                                        Ordered quantity remaining
                                        to be shipped
                                    </p>

                                </div>

                                <strong
                                    style={{
                                        color:
                                            "var(--brand-danger)",
                                        fontSize: 18,
                                    }}
                                >
                                    {orderSummary.pending}
                                </strong>

                            </div>

                            <div
                                style={{
                                    overflowX: "auto",
                                }}
                            >

                                <table>

                                    <thead>

                                        <tr>
                                            <th>OA ID</th>
                                            <th>Order Date</th>
                                            <th>Item</th>

                                            <th
                                                style={{
                                                    textAlign:
                                                        "right",
                                                }}
                                            >
                                                Ordered
                                            </th>

                                            <th
                                                style={{
                                                    textAlign:
                                                        "right",
                                                }}
                                            >
                                                Shipped
                                            </th>

                                            <th
                                                style={{
                                                    textAlign:
                                                        "right",
                                                }}
                                            >
                                                Pending
                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {(
                                            prodKpis?.pending_order_items ||
                                            []
                                        ).map(row => (

                                            <tr
                                                key={
                                                    row.order_item_id
                                                }
                                            >

                                                <td>
                                                    <strong
                                                        style={{
                                                            fontFamily:
                                                                "monospace",
                                                            color:
                                                                "var(--brand-accent)",
                                                        }}
                                                    >
                                                        {
                                                            row.order_acceptance_id
                                                        }
                                                    </strong>
                                                </td>

                                                <td>
                                                    {
                                                        row.order_acceptance_date
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        row.item_code
                                                    }
                                                </td>

                                                <td
                                                    style={{
                                                        textAlign:
                                                            "right",
                                                    }}
                                                >
                                                    {
                                                        row.ordered_quantity
                                                    }
                                                </td>

                                                <td
                                                    style={{
                                                        textAlign:
                                                            "right",
                                                        color:
                                                            "var(--brand-success)",
                                                    }}
                                                >
                                                    {
                                                        row.shipped_quantity
                                                    }
                                                </td>

                                                <td
                                                    style={{
                                                        textAlign:
                                                            "right",
                                                        fontWeight:
                                                            700,
                                                        color:
                                                            "var(--brand-danger)",
                                                    }}
                                                >
                                                    {
                                                        row.pending_quantity
                                                    }
                                                </td>

                                            </tr>

                                        ))}

                                        {!prodKpis?.pending_order_items
                                            ?.length && (

                                            <tr>

                                                <td
                                                    colSpan="6"
                                                    style={{
                                                        textAlign:
                                                            "center",
                                                        padding:
                                                            30,
                                                        color:
                                                            "var(--brand-success)",
                                                    }}
                                                >
                                                    ✅ No pending order
                                                    quantities
                                                </td>

                                            </tr>

                                        )}

                                    </tbody>

                                </table>

                            </div>

                        </div>

                        {/* Operator */}

                        <div className="frappe-card">

                            <h3>
                                Operator Performance
                            </h3>

                            <table className="frappe-table">

                                <thead>

                                    <tr>
                                        <th>
                                            Operator
                                        </th>
                                        <th>
                                            Production
                                        </th>
                                    </tr>

                                </thead>

                                <tbody>

                                    {prodKpis?.operator_summary?.map(
                                        operator => (

                                            <tr
                                                key={
                                                    operator?.operator
                                                }
                                            >

                                                <td>
                                                    {
                                                        operator?.operator
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        operator?.production
                                                    }
                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </>

            )}

            {/* =====================================================
                CHARTS
            ====================================================== */}

            {activeView === "charts" && (

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "2fr 1fr",
                        gap: 25,
                    }}
                >

                    <div className="frappe-card">

                        <Line
                            data={productionLineChart}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    title: {
                                        display: true,
                                        text:
                                            "Tasks Completed Daily",
                                    },
                                },
                            }}
                        />

                    </div>

                    <div className="frappe-card">

                        <Pie
                            data={productionPieChart}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: "bottom",
                                    },
                                },
                            }}
                        />

                    </div>

                    <div
                        className="frappe-card"
                        style={{
                            gridColumn:
                                "1 / span 2",
                        }}
                    >

                        <Bar
                            data={productionBarChart}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    title: {
                                        display: true,
                                        text:
                                            "Tasks Assigned vs Received",
                                    },
                                },
                            }}
                        />

                    </div>

                </div>

            )}

            {/* =====================================================
                SHOP FLOOR
            ====================================================== */}

            {activeView === "shopfloor" && (

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(3, 1fr)",
                        gap: 20,
                    }}
                >

                    <div className="frappe-card">

                        <h3>
                            Machine Utilization
                        </h3>

                        <h1>92%</h1>

                    </div>

                    <div className="frappe-card">

                        <h3>
                            Downtime
                        </h3>

                        <h1>1.8%</h1>

                    </div>

                    <div className="frappe-card">

                        <h3>
                            Efficiency
                        </h3>

                        <h1>97%</h1>

                    </div>

                </div>

            )}

            {/* =====================================================
                GEOGRAPHIC
            ====================================================== */}

            {activeView === "geo" && (

                <div>

                    {/* -------------------------------------------------
                        Geo header
                    -------------------------------------------------- */}

                    <div
                        className="system-header"
                        style={{
                            marginBottom: 20,
                        }}
                    >

                        <div>

                            <h3>
                                🌎 Geographic & Fulfillment Analytics
                            </h3>

                            <p
                                style={{
                                    margin:
                                        "4px 0 0",
                                    color:
                                        "var(--text-muted)",
                                    fontSize: 13,
                                }}
                            >
                                Filter pending orders by state,
                                product group and product.
                            </p>

                        </div>

                    </div>

                    {/* -------------------------------------------------
                        Geo filters

                        Product Group deliberately appears BEFORE
                        Products.
                    -------------------------------------------------- */}

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(260px, 1fr))",
                            gap: 16,
                            marginBottom: 20,
                        }}
                    >

                        <SearchableMultiSelect
                            label="Product Group"
                            options={itemGroups}
                            value={
                                selectedGroups || []
                            }
                            onChange={
                                setSelectedGroups
                            }
                        />

                        <SearchableMultiSelect
                            label="Products"
                            options={
                                itemsMaster.map(
                                    item =>
                                        item.item_code
                                )
                            }
                            value={
                                selectedItems || []
                            }
                            onChange={
                                setSelectedItems
                            }
                        />

                        <SearchableMultiSelect
                            label="States"
                            options={stateList}
                            value={
                                selectedStates || []
                            }
                            onChange={
                                setSelectedStates
                            }
                        />

                    </div>

                    {/* -------------------------------------------------
                        Selected filters
                    -------------------------------------------------- */}

                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 24,
                            padding:
                                "12px 18px",
                            background:
                                "var(--bg-surface)",
                            borderRadius: 10,
                            marginBottom: 20,
                            border:
                                "1px solid var(--border-subtle)",
                        }}
                    >

                        <span>
                            <b>
                                {
                                    selectedGroups?.length ||
                                    0
                                }
                            </b>{" "}
                            Product Groups
                        </span>

                        <span>
                            <b>
                                {
                                    selectedItems?.length ||
                                    0
                                }
                            </b>{" "}
                            Products
                        </span>

                        <span>
                            <b>
                                {
                                    selectedStates?.length ||
                                    0
                                }
                            </b>{" "}
                            States
                        </span>

                    </div>

                    {/* -------------------------------------------------
                        Geo map
                    -------------------------------------------------- */}

                    <GeoMapCanvas
                        visibleMap={visibleMap}
                        isDispatcher={
                            state?.user?.role ===
                            "Dispatch Engineer"
                        }
                    />

                    {/* -------------------------------------------------
                        Geo fulfillment KPIs
                    -------------------------------------------------- */}

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(4, minmax(0, 1fr))",
                            gap: 16,
                            marginTop: 25,
                        }}
                    >

                        <div className="frappe-card">

                            <h4>
                                Filtered Ordered
                            </h4>

                            <h2>
                                {
                                    geoSummary.ordered
                                }
                            </h2>

                        </div>

                        <div className="frappe-card">

                            <h4>
                                Filtered Shipped
                            </h4>

                            <h2
                                style={{
                                    color:
                                        "var(--brand-success)",
                                }}
                            >
                                {
                                    geoSummary.shipped
                                }
                            </h2>

                        </div>

                        <div className="frappe-card">

                            <h4>
                                Filtered Pending
                            </h4>

                            <h2
                                style={{
                                    color:
                                        "var(--brand-danger)",
                                }}
                            >
                                {
                                    geoSummary.pending
                                }
                            </h2>

                        </div>

                        <div className="frappe-card">

                            <h4>
                                Fulfillment
                            </h4>

                            <h2
                                style={{
                                    color:
                                        "var(--brand-accent)",
                                }}
                            >
                                {
                                    geoFulfillmentPercentage
                                }%
                            </h2>

                        </div>

                    </div>

                    {/* -------------------------------------------------
                        Filtered pending register
                    -------------------------------------------------- */}

                    <div
                        className="frappe-card"
                        style={{
                            marginTop: 20,
                        }}
                    >

                        <div className="system-header">

                            <div>

                                <h3>
                                    Pending Order Register
                                </h3>

                                <p
                                    style={{
                                        margin:
                                            "4px 0 0",
                                        color:
                                            "var(--text-muted)",
                                        fontSize: 13,
                                    }}
                                >
                                    Pending quantities matching
                                    the selected filters.
                                </p>

                            </div>

                            <strong
                                style={{
                                    color:
                                        "var(--brand-danger)",
                                    fontSize: 18,
                                }}
                            >
                                {
                                    geoSummary.pending
                                }
                            </strong>

                        </div>

                        <div
                            style={{
                                overflowX: "auto",
                            }}
                        >

                            <table>

                                <thead>

                                    <tr>

                                        <th>
                                            OA ID
                                        </th>

                                        <th>
                                            Order Date
                                        </th>

                                        <th>
                                            State
                                        </th>

                                        <th>
                                            Product Group
                                        </th>

                                        <th>
                                            Product
                                        </th>

                                        <th
                                            style={{
                                                textAlign:
                                                    "right",
                                            }}
                                        >
                                            Ordered
                                        </th>

                                        <th
                                            style={{
                                                textAlign:
                                                    "right",
                                            }}
                                        >
                                            Shipped
                                        </th>

                                        <th
                                            style={{
                                                textAlign:
                                                    "right",
                                            }}
                                        >
                                            Pending
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {filteredPendingOrderItems.length ? (

                                        filteredPendingOrderItems.map(
                                            row => {

                                                const group =
                                                    itemGroupMap[
                                                        row.item_code
                                                    ] ||
                                                    "General";

                                                return (
                                                    <tr
                                                        key={
                                                            row.order_item_id
                                                        }
                                                    >

                                                        <td>

                                                            <strong
                                                                style={{
                                                                    fontFamily:
                                                                        "monospace",
                                                                    color:
                                                                        "var(--brand-accent)",
                                                                }}
                                                            >
                                                                {
                                                                    row.order_acceptance_id
                                                                }
                                                            </strong>

                                                        </td>

                                                        <td>
                                                            {
                                                                row.order_acceptance_date
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                row.state_name ||
                                                                "—"
                                                            }
                                                        </td>

                                                        <td>

                                                            <span
                                                                style={{
                                                                    background:
                                                                        "var(--combobox-hover)",
                                                                    padding:
                                                                        "3px 8px",
                                                                    borderRadius:
                                                                        "999px",
                                                                    fontSize:
                                                                        11,
                                                                }}
                                                            >
                                                                {group}
                                                            </span>

                                                        </td>

                                                        <td>

                                                            <div
                                                                style={{
                                                                    fontWeight:
                                                                        600,
                                                                }}
                                                            >
                                                                {
                                                                    row.item_code
                                                                }
                                                            </div>

                                                        </td>

                                                        <td
                                                            style={{
                                                                textAlign:
                                                                    "right",
                                                            }}
                                                        >
                                                            {
                                                                row.ordered_quantity
                                                            }
                                                        </td>

                                                        <td
                                                            style={{
                                                                textAlign:
                                                                    "right",
                                                                color:
                                                                    "var(--brand-success)",
                                                            }}
                                                        >
                                                            {
                                                                row.shipped_quantity
                                                            }
                                                        </td>

                                                        <td
                                                            style={{
                                                                textAlign:
                                                                    "right",
                                                                color:
                                                                    "var(--brand-danger)",
                                                                fontWeight:
                                                                    700,
                                                            }}
                                                        >
                                                            {
                                                                row.pending_quantity
                                                            }
                                                        </td>

                                                    </tr>
                                                );

                                            }
                                        )

                                    ) : (

                                        <tr>

                                            <td
                                                colSpan="8"
                                                style={{
                                                    textAlign:
                                                        "center",
                                                    padding:
                                                        40,
                                                    color:
                                                        "var(--brand-success)",
                                                }}
                                            >
                                                ✅ No pending orders
                                                match the selected
                                                filters.
                                            </td>

                                        </tr>

                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}