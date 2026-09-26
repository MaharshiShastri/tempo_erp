import { useMemo, useState } from "react";
import { Line, Bar, Doughnut } from "react-chartjs-2";

import GeoMapCanvas from "../components/geo/GeoMapCanvas";
import SearchableMultiSelect from "../components/shared/SearchableMultiselect";
import PurchaseRateBoxPlot from "@/components/charts/PurchaseRateBoxPlot";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
    indiaMap,
    visibleMap,
    isLoading,
    selectedStates,
    setSelectedStates,
    selectedItems,
    setSelectedItems,
    selectedGroups,
    setSelectedGroups,
    summary,
    batches,
    supplierAnalysis,
    itemAnalysis,
    rateTrend,
    rateDistribution,
    mostExpensiveBatch,
    cheapestBatch,
    largestBatches,
    getBoxStats,
    purchaseItemCodes,
    selectedPurchaseItem,
    setSelectedPurchaseItem,
  } = state;

  const [activeView, setActiveView] = useState("statistics");

  const orderSummary = prodKpis?.order_quantity_summary || {
    ordered: 0,
    shipped: 0,
    pending: 0,
  };

  const fulfillmentPercentage =
    orderSummary.ordered > 0
      ? ((orderSummary.shipped / orderSummary.ordered) * 100).toFixed(1)
      : "0.0";

  // ------------------------------------------------------------
  // Geographic data
  // ------------------------------------------------------------

  const stateList = useMemo(() => {
    if (!Array.isArray(indiaMap?.features)) {
      return [];
    }

    return indiaMap.features
      .map((feature) => feature?.properties?.ST_NM)
      .filter(Boolean)
      .sort();
  }, [indiaMap]);

  const itemsMaster = state?.itemsMaster ?? [];

  const itemGroups = useMemo(() => {
    return [
      ...new Set(
        itemsMaster
          .map((item) => item?.item_group)
          .filter(Boolean)
      ),
    ].sort();
  }, [itemsMaster]);

  const itemGroupMap = useMemo(() => {
    return Object.fromEntries(
      itemsMaster.map((item) => [
        item.item_code,
        item.item_group || "General",
      ])
    );
  }, [itemsMaster]);

  // ------------------------------------------------------------
  // Pending orders
  // ------------------------------------------------------------

  const pendingOrderItems =
    prodKpis?.pending_order_items ?? [];

  const filteredPendingOrderItems = useMemo(() => {
    return pendingOrderItems.filter((row) => {
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

  // ------------------------------------------------------------
  // Geographic totals
  // ------------------------------------------------------------

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

  const geoFulfillmentPercentage =
    geoSummary.ordered > 0
      ? (
          (geoSummary.shipped /
            geoSummary.ordered) *
          100
        ).toFixed(1)
      : "0.0";

  // ------------------------------------------------------------
  // Loading
  // ------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center bg-[var(--bg-main)] text-[var(--text-primary)]">
        <Card className="w-full max-w-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-sm text-[var(--text-muted)]">
              Loading analytics...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="print-section space-y-6 bg-[var(--bg-main)] text-[var(--text-primary)]">
      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            📦 Purchase Analytics
          </h2>

          <p className="text-sm text-[var(--text-muted)]">
            Purchased material cost, supplier pricing and batch-rate analysis
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="grid gap-2">
            <Label
              htmlFor="production-from"
              className="text-[var(--text-primary)]"
            >
              From
            </Label>

            <Input
              id="production-from"
              type="date"
              value={fromDate}
              onChange={(e) =>
                setFromDate(e.target.value)
              }
              className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]"
            />
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor="production-to"
              className="text-[var(--text-primary)]"
            >
              To
            </Label>

            <Input
              id="production-to"
              type="date"
              value={toDate}
              onChange={(e) =>
                setToDate(e.target.value)
              }
              className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]"
            />
          </div>

          <Button
            className="bg-[var(--brand-accent)] text-white hover:opacity-90"
            onClick={() =>
              fetchAnalytics(
                "Shop Floor Administrator",
                fromDate,
                toDate
              )
            }
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* ======================================================
          NAVIGATION
      ======================================================= */}

      <Tabs
        value={activeView}
        onValueChange={setActiveView}
        className="flex w-full flex-col"
      >
        <TabsList className="flex h-auto w-full flex-row items-stretch justify-start gap-1 overflow-x-auto border border-[var(--border-light)] bg-[var(--bg-muted)] p-1">
          <TabsTrigger
            value="statistics"
            className="text-[var(--text-muted)] data-[state=active]:bg-[var(--bg-surface)] data-[state=active]:text-[var(--text-primary)]"
          >
            Statistics
          </TabsTrigger>

          <TabsTrigger
            value="charts"
            className="text-[var(--text-muted)] data-[state=active]:bg-[var(--bg-surface)] data-[state=active]:text-[var(--text-primary)]"
          >
            Charts
          </TabsTrigger>

          <TabsTrigger
            value="shopfloor"
            className="text-[var(--text-muted)] data-[state=active]:bg-[var(--bg-surface)] data-[state=active]:text-[var(--text-primary)]"
          >
            Purchase
          </TabsTrigger>

          <TabsTrigger
            value="geo"
            className="text-[var(--text-muted)] data-[state=active]:bg-[var(--bg-surface)] data-[var(--text-primary)] data-[state=active]:text-[var(--text-primary)]"
          >
            Geographic
          </TabsTrigger>
        </TabsList>

        {/* ====================================================
            STATISTICS
        ===================================================== */}

        <TabsContent
          value="statistics"
          className="space-y-6"
        >
          {/* Pending order export */}

          <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-success)]/10 text-xl text-[var(--brand-success)]">
                    📊
                  </div>

                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      Pending Orders Report
                    </h3>

                    <p className="text-sm text-[var(--text-muted)]">
                      Export all pending order quantities
                      for the selected date range to Excel.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <strong className="block text-xl text-[var(--brand-danger)]">
                      {orderSummary.pending}
                    </strong>

                    <span className="text-xs text-[var(--text-muted)]">
                      Pending quantity
                    </span>
                  </div>

                  <Button
                    type="button"
                    className="bg-[var(--brand-accent)] text-white hover:opacity-90"
                    onClick={() =>
                      downloadPendingOrdersExcel(
                        fromDate,
                        toDate
                      )
                    }
                    disabled={
                      isDownloadingPendingOrders ||
                      !fromDate ||
                      !toDate
                    }
                  >
                    {isDownloadingPendingOrders
                      ? "⏳ Preparing Excel..."
                      : "⬇️ Download Excel"}
                  </Button>
                </div>
              </div>

              <Separator className="my-4 bg-[var(--border-light)]" />

              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <span>📅</span>

                <span>Report period:</span>

                <strong className="text-[var(--text-primary)]">
                  {fromDate || "—"}
                </strong>

                <span>→</span>

                <strong className="text-[var(--text-primary)]">
                  {toDate || "—"}
                </strong>
              </div>
            </CardContent>
          </Card>

          {/* Main KPIs */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Products Ordered"
              value={orderSummary.ordered}
              description="Order quantity"
            />

            <KpiCard
              title="Products Shipped"
              value={orderSummary.shipped}
              description="Delivered quantity"
              valueClassName="text-[var(--brand-success)]"
            />

            <KpiCard
              title="Products Pending"
              value={orderSummary.pending}
              description="Remaining quantity"
              valueClassName="text-[var(--brand-danger)]"
            />

            <KpiCard
              title="Fulfillment"
              value={`${fulfillmentPercentage}%`}
              description="Shipped / ordered"
              valueClassName="text-[var(--brand-accent)]"
            />
          </div>

          {/* Tables */}

          <div className="grid gap-6 xl:grid-cols-2">
            {/* Pending orders */}

            <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
              <CardHeader className="flex flex-row items-start justify-between border-b border-[var(--border-light)] bg-[var(--bg-muted)]">
                <div>
                  <CardTitle className="text-[var(--text-primary)]">
                    Pending Order Fulfillment
                  </CardTitle>

                  <CardDescription className="text-[var(--text-muted)]">
                    Ordered quantity remaining to be shipped
                  </CardDescription>
                </div>

                <Badge
                  variant="outline"
                  className="border-[var(--brand-danger)]/30 bg-[var(--warning-row)] text-[var(--brand-danger)]"
                >
                  {orderSummary.pending}
                </Badge>
              </CardHeader>

              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-[var(--border-light)] bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)]">
                        <TableHead className="text-[var(--text-primary)]">
                          OA ID
                        </TableHead>
                        <TableHead className="text-[var(--text-primary)]">
                          Order Date
                        </TableHead>
                        <TableHead className="text-[var(--text-primary)]">
                          Item
                        </TableHead>
                        <TableHead className="text-right text-[var(--text-primary)]">
                          Ordered
                        </TableHead>
                        <TableHead className="text-right text-[var(--text-primary)]">
                          Shipped
                        </TableHead>
                        <TableHead className="text-right text-[var(--text-primary)]">
                          Pending
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {prodKpis?.pending_order_items?.length ? (
                        prodKpis.pending_order_items.map(
                          (row) => (
                            <TableRow
                              key={row.order_item_id}
                              className="border-b border-[var(--border-light)] hover:bg-[var(--combobox-hover)]"
                            >
                              <TableCell>
                                <span className="font-mono text-sm font-semibold text-[var(--brand-accent)]">
                                  {row.oa_id}
                                </span>
                              </TableCell>

                              <TableCell>
                                {row.oa_date}
                              </TableCell>

                              <TableCell>
                                {row.item_code}
                              </TableCell>

                              <TableCell className="text-right">
                                {row.ordered_quantity}
                              </TableCell>

                              <TableCell className="text-right text-[var(--brand-success)]">
                                {row.shipped_quantity}
                              </TableCell>

                              <TableCell className="text-right font-semibold text-[var(--brand-danger)]">
                                {row.pending_quantity}
                              </TableCell>
                            </TableRow>
                          )
                        )
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="py-10 text-center text-[var(--brand-success)]"
                          >
                            ✅ No pending order quantities
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Operator */}

            <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
              <CardHeader className="border-b border-[var(--border-light)] bg-[var(--bg-muted)]">
                <CardTitle className="text-[var(--text-primary)]">
                  Operator Performance
                </CardTitle>

                <CardDescription className="text-[var(--text-muted)]">
                  Production by operator
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[var(--border-light)] bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)]">
                      <TableHead className="text-[var(--text-primary)]">
                        Operator
                      </TableHead>
                      <TableHead className="text-[var(--text-primary)]">
                        Production
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {prodKpis?.operator_summary?.map(
                      (operator) => (
                        <TableRow
                          key={operator?.operator}
                          className="border-b border-[var(--border-light)] hover:bg-[var(--combobox-hover)]"
                        >
                          <TableCell>
                            {operator?.operator}
                          </TableCell>

                          <TableCell>
                            {operator?.production}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ====================================================
            CHARTS
        ===================================================== */}

        <TabsContent
          value="charts"
          className="space-y-6"
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)] lg:col-span-2">
              <CardHeader className="border-b border-[var(--border-light)] bg-[var(--bg-muted)]">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base text-[var(--text-primary)]">
                      Daily Production Output
                    </CardTitle>

                    <CardDescription className="mt-1 text-[var(--text-muted)]">
                      Completed production tasks over the selected period
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2 rounded-full border border-[var(--brand-accent)]/30 bg-[var(--brand-accent)]/10 px-3 py-1.5 text-xs font-medium text-[var(--brand-accent)]">
                    <span className="size-2 rounded-full bg-[var(--brand-accent)]" />
                    Completed
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 md:p-6">
                <div className="h-[380px]">
                  <Line
                    data={productionLineChart}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,

                      interaction: {
                        mode: "index",
                        intersect: false,
                      },

                      plugins: {
                        legend: {
                          display: false,
                        },

                        tooltip: {
                          backgroundColor: "rgba(15, 23, 42, 0.95)",
                          padding: 12,
                          cornerRadius: 10,

                          titleFont: {
                            size: 12,
                            weight: "600",
                          },

                          bodyFont: {
                            size: 13,
                          },

                          displayColors: false,
                        },
                      },

                      scales: {
                        x: {
                          grid: {
                            display: false,
                          },

                          border: {
                            display: false,
                          },

                          ticks: {
                            color: "var(--text-muted)",
                            font: {
                              size: 11,
                            },
                          },
                        },

                        y: {
                          beginAtZero: true,

                          border: {
                            display: false,
                          },

                          grid: {
                            color: "var(--border-light)",
                          },

                          ticks: {
                            color: "var(--text-muted)",
                            precision: 0,
                            font: {
                              size: 11,
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
              <CardHeader className="border-b border-[var(--border-light)] bg-[var(--bg-muted)]">
                <CardTitle className="text-[var(--text-primary)]">
                  Production Distribution
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="h-[400px]">
                  <Doughnut
                    data={productionPieChart}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,

                      cutout: "68%",

                      plugins: {
                        legend: {
                          position: "bottom",

                          labels: {
                            usePointStyle: true,
                            pointStyle: "circle",

                            padding: 18,

                            font: {
                              size: 11,
                            },

                            color: "var(--text-primary)",
                          },
                        },

                        tooltip: {
                          backgroundColor: "rgba(15, 23, 42, 0.95)",
                          padding: 12,
                          cornerRadius: 10,

                          callbacks: {
                            label: function (context) {
                              const value = context.raw ?? 0;

                              const dataset =
                                context.dataset.data || [];

                              const total = dataset.reduce(
                                (sum, item) =>
                                  sum + Number(item || 0),
                                0
                              );

                              const percentage =
                                total > 0
                                  ? ((value / total) * 100).toFixed(1)
                                  : 0;

                              return ` ${value} tasks (${percentage}%)`;
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
              <CardHeader className="border-b border-[var(--border-light)] bg-[var(--bg-muted)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base text-[var(--text-primary)]">
                      Task Flow by Operator
                    </CardTitle>

                    <CardDescription className="mt-1 text-[var(--text-muted)]">
                      Assigned versus received production tasks
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-sm bg-[var(--brand-accent)]" />
                      <span className="text-[var(--text-muted)]">
                        Assigned
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-sm bg-[var(--brand-success)]" />
                      <span className="text-[var(--text-muted)]">
                        Received
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 md:p-6">
                <div className="h-[400px]">
                  <Bar
                    data={productionBarChart}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,

                      interaction: {
                        mode: "index",
                        intersect: false,
                      },

                      plugins: {
                        legend: {
                          display: false,
                        },

                        tooltip: {
                          backgroundColor:
                            "rgba(15, 23, 42, 0.95)",

                          padding: 12,
                          cornerRadius: 10,
                        },
                      },

                      scales: {
                        x: {
                          grid: {
                            display: false,
                          },

                          border: {
                            display: false,
                          },

                          ticks: {
                            color: "var(--text-muted)",
                            font: {
                              size: 11,
                            },
                          },
                        },

                        y: {
                          beginAtZero: true,

                          border: {
                            display: false,
                          },

                          grid: {
                            color: "var(--border-light)",
                          },

                          ticks: {
                            precision: 0,
                            color: "var(--text-muted)",
                            font: {
                              size: 11,
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ====================================================
            SHOP FLOOR
        ===================================================== */}

        <TabsContent
          value="shopfloor"
          className="space-y-6"
        >
          <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
            <CardHeader className="border-b border-[var(--border-light)] bg-[var(--bg-muted)]">
              <CardTitle className="text-[var(--text-primary)]">
                Purchase Item Analysis
              </CardTitle>

              <CardDescription className="text-[var(--text-muted)]">
                Select one purchased item to analyse its
                purchase rates, suppliers and batch history.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <SearchableMultiSelect
                  label="Purchased Item"
                  options={purchaseItemCodes}
                  value={
                    selectedPurchaseItem
                      ? [selectedPurchaseItem]
                      : []
                  }
                  onChange={(values) =>
                    setSelectedPurchaseItem(values[0] || "")
                  }
                  single
                />

                {selectedPurchaseItem && (
                  <Button
                    variant="outline"
                    className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)] hover:text-[var(--text-primary)]"
                    onClick={() =>
                      setSelectedPurchaseItem("")
                    }
                  >
                    Clear Selection
                  </Button>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="border-[var(--border-light)] bg-[var(--bg-muted)] text-[var(--text-primary)]"
                >
                  {purchaseItemCodes.length.toLocaleString("en-IN")}{" "}
                  purchased items
                </Badge>

                {selectedPurchaseItem && (
                  <Badge className="border-[var(--brand-accent)]/30 bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]">
                    Analysing: {selectedPurchaseItem}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ======================================================
              PURCHASE KPIs
          ====================================================== */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Total Purchase Value"
              value={`₹${summary.totalPurchaseValue.toLocaleString(
                "en-IN",
                {
                  maximumFractionDigits: 0,
                }
              )}`}
              description="Total purchased value"
            />

            <KpiCard
              title="Purchase Batches"
              value={summary.batchCount}
              description="Purchase bill lines"
            />

            <KpiCard
              title="Suppliers"
              value={summary.supplierCount}
              description="Unique suppliers"
            />

            <KpiCard
              title="Items Purchased"
              value={summary.itemCount}
              description="Unique item codes"
            />
          </div>

          {/* ======================================================
              RATE KPIs
          ====================================================== */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Average Batch Rate"
              value={`₹${summary.averageBatchRate.toFixed(2)}`}
              description="Simple average purchase rate"
            />

            <KpiCard
              title="Weighted Average Rate"
              value={`₹${summary.weightedAverageRate.toFixed(2)}`}
              description="Quantity-weighted purchase rate"
            />

            <KpiCard
              title="Cheapest Batch"
              value={`₹${summary.minimumBatchRate.toFixed(2)}`}
              description={
                cheapestBatch
                  ? cheapestBatch.supplier
                  : "No data"
              }
              valueClassName="text-[var(--brand-success)]"
            />

            <KpiCard
              title="Most Expensive Batch"
              value={`₹${summary.maximumBatchRate.toFixed(2)}`}
              description={
                mostExpensiveBatch
                  ? mostExpensiveBatch.supplier
                  : "No data"
              }
              valueClassName="text-[var(--brand-danger)]"
            />
          </div>

          {/* ======================================================
              EXTREME BATCHES
          ====================================================== */}

          <div className="grid gap-6 lg:grid-cols-2">
            <PurchaseBatchCard
              title="Most Expensive Batch"
              batch={mostExpensiveBatch}
              variant="expensive"
            />

            <PurchaseBatchCard
              title="Cheapest Batch"
              batch={cheapestBatch}
              variant="cheap"
            />
          </div>

          {/* ======================================================
              BOX & WHISKER ANALYSIS
          ====================================================== */}

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
              <CardHeader className="border-b border-[var(--border-light)] bg-[var(--bg-muted)]">
                <CardTitle className="text-[var(--text-primary)]">
                  Supplier Rate Distribution
                </CardTitle>

                <CardDescription className="text-[var(--text-muted)]">
                  Purchase rate variation across suppliers.
                  The box represents the middle 50% of rates,
                  while whiskers show the spread.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="h-[450px]">
                  <PurchaseRateBoxPlot
                    batches={batches}
                    groupBy="supplier"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
              <CardHeader className="border-b border-[var(--border-light)] bg-[var(--bg-muted)]">
                <CardTitle className="text-[var(--text-primary)]">
                  Item Rate Distribution
                </CardTitle>

                <CardDescription className="text-[var(--text-muted)]">
                  Compare purchase rate variability across
                  different material items.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* ======================================================
              SUPPLIER ANALYSIS
          ====================================================== */}

          <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
            <CardHeader className="border-b border-[var(--border-light)] bg-[var(--bg-muted)]">
              <CardTitle className="text-[var(--text-primary)]">
                Supplier Price Analysis
              </CardTitle>

              <CardDescription className="text-[var(--text-muted)]">
                Compare supplier pricing, purchase volume,
                and total spend.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[var(--border-light)] bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)]">
                      <TableHead className="text-[var(--text-primary)]">
                        Supplier
                      </TableHead>

                      <TableHead className="text-right text-[var(--text-primary)]">
                        Batches
                      </TableHead>

                      <TableHead className="text-right text-[var(--text-primary)]">
                        Quantity
                      </TableHead>

                      <TableHead className="text-right text-[var(--text-primary)]">
                        Spend
                      </TableHead>

                      <TableHead className="text-right text-[var(--text-primary)]">
                        Avg Rate
                      </TableHead>

                      <TableHead className="text-right text-[var(--text-primary)]">
                        Min Rate
                      </TableHead>

                      <TableHead className="text-right text-[var(--text-primary)]">
                        Max Rate
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {supplierAnalysis?.length ? (
                      supplierAnalysis.map((supplier) => (
                        <TableRow
                          key={supplier.supplier}
                          className="border-b border-[var(--border-light)] hover:bg-[var(--combobox-hover)]"
                        >
                          <TableCell className="font-medium">
                            {supplier.supplier}
                          </TableCell>

                          <TableCell className="text-right">
                            {supplier.batch_count}
                          </TableCell>

                          <TableCell className="text-right">
                            {Number(
                              supplier.quantity || 0
                            ).toLocaleString()}
                          </TableCell>

                          <TableCell className="text-right">
                            ₹
                            {Number(
                              supplier.total_spend || 0
                            ).toLocaleString("en-IN", {
                              maximumFractionDigits: 0,
                            })}
                          </TableCell>

                          <TableCell className="text-right font-semibold">
                            ₹
                            {Number(
                              supplier.average_rate || 0
                            ).toFixed(2)}
                          </TableCell>

                          <TableCell className="text-right text-[var(--brand-success)]">
                            ₹
                            {Number(
                              supplier.minimum_rate || 0
                            ).toFixed(2)}
                          </TableCell>

                          <TableCell className="text-right text-[var(--brand-danger)]">
                            ₹
                            {Number(
                              supplier.maximum_rate || 0
                            ).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-10 text-center text-[var(--text-muted)]"
                        >
                          No supplier purchase data available.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====================================================
            GEOGRAPHIC
        ===================================================== */}

        <TabsContent
          value="geo"
          className="space-y-6"
        >
          <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
            <CardHeader className="border-b border-[var(--border-light)] bg-[var(--bg-muted)]">
              <CardTitle className="text-[var(--text-primary)]">
                🌎 Geographic & Fulfillment Analytics
              </CardTitle>

              <CardDescription className="text-[var(--text-muted)]">
                Filter pending orders by state, product
                group and product.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Filters */}

              <div className="grid gap-4 md:grid-cols-3">
                <SearchableMultiSelect
                  label="Product Group"
                  options={itemGroups}
                  value={selectedGroups || []}
                  onChange={setSelectedGroups}
                />

                <SearchableMultiSelect
                  label="Products"
                  options={itemsMaster.map(
                    (item) => item.item_code
                  )}
                  value={selectedItems || []}
                  onChange={setSelectedItems}
                />

                <SearchableMultiSelect
                  label="States"
                  options={stateList}
                  value={selectedStates || []}
                  onChange={setSelectedStates}
                />
              </div>

              {/* Filter summary */}

              <div className="flex flex-wrap gap-3 rounded-lg border border-[var(--border-light)] bg-[var(--bg-muted)] p-3">
                <Badge
                  variant="outline"
                  className="border-[var(--border-light)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                >
                  {selectedGroups?.length || 0} Product Groups
                </Badge>

                <Badge
                  variant="outline"
                  className="border-[var(--border-light)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                >
                  {selectedItems?.length || 0} Products
                </Badge>

                <Badge
                  variant="outline"
                  className="border-[var(--border-light)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                >
                  {selectedStates?.length || 0} States
                </Badge>
              </div>

              {/* Map */}

              <GeoMapCanvas
                visibleMap={visibleMap}
                isDispatcher={
                  state?.user?.role ===
                  "Dispatch Engineer"
                }
              />

              {/* Geographic KPIs */}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                  title="Filtered Ordered"
                  value={geoSummary.ordered}
                />

                <KpiCard
                  title="Filtered Shipped"
                  value={geoSummary.shipped}
                  valueClassName="text-[var(--brand-success)]"
                />

                <KpiCard
                  title="Filtered Pending"
                  value={geoSummary.pending}
                  valueClassName="text-[var(--brand-danger)]"
                />

                <KpiCard
                  title="Fulfillment"
                  value={`${geoFulfillmentPercentage}%`}
                  valueClassName="text-[var(--brand-accent)]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pending register */}

          <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
            <CardHeader className="flex flex-row items-start justify-between border-b border-[var(--border-light)] bg-[var(--bg-muted)]">
              <div>
                <CardTitle className="text-[var(--text-primary)]">
                  Pending Order Register
                </CardTitle>

                <CardDescription className="text-[var(--text-muted)]">
                  Pending quantities matching the selected
                  filters.
                </CardDescription>
              </div>

              <Badge
                variant="outline"
                className="border-[var(--brand-danger)]/30 bg-[var(--warning-row)] text-[var(--brand-danger)]"
              >
                {geoSummary.pending}
              </Badge>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[var(--border-light)] bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)]">
                      <TableHead className="text-[var(--text-primary)]">
                        OA ID
                      </TableHead>
                      <TableHead className="text-[var(--text-primary)]">
                        Order Date
                      </TableHead>
                      <TableHead className="text-[var(--text-primary)]">
                        State
                      </TableHead>
                      <TableHead className="text-[var(--text-primary)]">
                        Product Group
                      </TableHead>
                      <TableHead className="text-[var(--text-primary)]">
                        Product
                      </TableHead>
                      <TableHead className="text-right text-[var(--text-primary)]">
                        Ordered
                      </TableHead>
                      <TableHead className="text-right text-[var(--text-primary)]">
                        Shipped
                      </TableHead>
                      <TableHead className="text-right text-[var(--text-primary)]">
                        Pending
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredPendingOrderItems.length ? (
                      filteredPendingOrderItems.map(
                        (row) => {
                          const group =
                            itemGroupMap[
                              row.item_code
                            ] || "General";

                          return (
                            <TableRow
                              key={row.order_item_id}
                              className="border-b border-[var(--border-light)] hover:bg-[var(--combobox-hover)]"
                            >
                              <TableCell>
                                <span className="font-mono text-sm font-semibold text-[var(--brand-accent)]">
                                  {row.oa_id}
                                </span>
                              </TableCell>

                              <TableCell>
                                {row.oa_date}
                              </TableCell>

                              <TableCell>
                                {row.state_name || "—"}
                              </TableCell>

                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="border-[var(--border-light)] bg-[var(--bg-muted)] text-[var(--text-primary)]"
                                >
                                  {group}
                                </Badge>
                              </TableCell>

                              <TableCell className="font-medium">
                                {row.item_code}
                              </TableCell>

                              <TableCell className="text-right">
                                {row.ordered_quantity}
                              </TableCell>

                              <TableCell className="text-right text-[var(--brand-success)]">
                                {row.shipped_quantity}
                              </TableCell>

                              <TableCell className="text-right font-semibold text-[var(--brand-danger)]">
                                {row.pending_quantity}
                              </TableCell>
                            </TableRow>
                          );
                        }
                      )
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="py-12 text-center text-[var(--brand-success)]"
                        >
                          ✅ No pending orders match the
                          selected filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Reusable KPI card
 */
function KpiCard({
  title,
  value,
  description,
  valueClassName,
}) {
  return (
    <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
      <CardHeader className="border-b border-[var(--border-light)] bg-[var(--bg-muted)] pb-2">
        <CardTitle className="text-sm font-medium text-[var(--text-muted)]">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div
          className={`text-3xl font-bold tracking-tight ${
            valueClassName || "text-[var(--text-primary)]"
          }`}
        >
          {value}
        </div>

        {description && (
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function PurchaseBatchCard({
  title,
  batch,
  variant,
}) {
  if (!batch) {
    return (
      <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
        <CardContent className="py-10 text-center text-[var(--text-muted)]">
          No purchase data available.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
      <CardHeader className="border-b border-[var(--border-light)] bg-[var(--bg-muted)]">
        <CardTitle className="text-[var(--text-primary)]">
          {title}
        </CardTitle>

        <CardDescription className="text-[var(--text-muted)]">
          Single purchase batch with the
          {variant === "expensive"
            ? " highest"
            : " lowest"}{" "}
          recorded rate
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-3xl font-bold text-[var(--text-primary)]">
          ₹{Number(batch.rate).toFixed(2)}
          <span className="ml-2 text-sm font-normal text-[var(--text-muted)]">
            / {batch.unit_measure || "unit"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[var(--text-muted)]">
              Supplier
            </p>
            <p className="font-medium text-[var(--text-primary)]">
              {batch.supplier}
            </p>
          </div>

          <div>
            <p className="text-xs text-[var(--text-muted)]">
              Item
            </p>
            <p className="font-mono font-medium text-[var(--text-primary)]">
              {batch.item_code}
            </p>
          </div>

          <div>
            <p className="text-xs text-[var(--text-muted)]">
              Quantity
            </p>
            <p className="text-[var(--text-primary)]">
              {batch.quantity.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-xs text-[var(--text-muted)]">
              Batch Value
            </p>
            <p className="text-[var(--text-primary)]">
              ₹
              {batch.amount.toLocaleString(
                "en-IN"
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-[var(--text-muted)]">
              Purchase Date
            </p>
            <p className="text-[var(--text-primary)]">
              {batch.purchase_date}
            </p>
          </div>

          <div>
            <p className="text-xs text-[var(--text-muted)]">
              Voucher
            </p>
            <p className="font-mono text-[var(--text-primary)]">
              {batch.voucher_number}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}