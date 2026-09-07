import { useMemo, useState } from "react";
import { Line, Bar, Doughnut } from "react-chartjs-2";

import GeoMapCanvas from "../components/geo/GeoMapCanvas";
import SearchableMultiSelect from "../components/shared/SearchableMultiselect";
import PurchaseRateBoxPlot from "@/components/charts/PurchaseRateBoxPlot";
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import {Tabs, TabsContent, TabsList, TabsTrigger,} from "@/components/ui/tabs";

import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";

import { Separator } from "@/components/ui/separator";

export default function ProductionAnalyticsView({ state }) {
  const {productionBarChart, productionPieChart, productionLineChart, prodKpis, fetchAnalytics, fromDate,
        toDate, setFromDate, setToDate, downloadPendingOrdersExcel, isDownloadingPendingOrders, indiaMap,
        visibleMap, isLoading, selectedStates, setSelectedStates, selectedItems, setSelectedItems, selectedGroups,
        setSelectedGroups, summary, batches, supplierAnalysis, itemAnalysis, rateTrend, rateDistribution, 
        mostExpensiveBatch, cheapestBatch, largestBatches, getBoxStats, purchaseItemCodes, selectedPurchaseItem,
        setSelectedPurchaseItem} = state;

  const [activeView, setActiveView] = useState("statistics");

  const orderSummary = prodKpis?.order_quantity_summary || {ordered: 0, shipped: 0, pending: 0,};

  const fulfillmentPercentage = orderSummary.ordered > 0 ? ((orderSummary.shipped / orderSummary.ordered) * 100).toFixed(1) : "0.0";

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
      <div className="flex min-h-[300px] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">
              Loading analytics...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="print-section space-y-6">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            📦 Purchase Analytics
          </h2>

          <p className="text-sm text-muted-foreground">
            Purchased material cost, supplier pricing and batch-rate analysis
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="grid gap-2">
            <Label htmlFor="production-from">
              From
            </Label>

            <Input
              id="production-from"
              type="date"
              value={fromDate}
              onChange={(e) =>
                setFromDate(e.target.value)
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="production-to">
              To
            </Label>

            <Input
              id="production-to"
              type="date"
              value={toDate}
              onChange={(e) =>
                setToDate(e.target.value)
              }
            />
          </div>

          <Button
            onClick={() =>
              fetchAnalytics("Shop Floor Administrator", fromDate, toDate)
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
        <TabsList className="flex h-auto w-full flex-row items-stretch justify-start gap-1 overflow-x-auto">
          <TabsTrigger value="statistics">
            Statistics
          </TabsTrigger>

          <TabsTrigger value="charts">
            Charts
          </TabsTrigger>

          <TabsTrigger value="shopfloor">
            Purchase
          </TabsTrigger>

          <TabsTrigger value="geo">
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

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                <div className="flex items-center gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-xl">
                    📊
                  </div>

                  <div>
                    <h3 className="font-semibold">
                      Pending Orders Report
                    </h3>

                    <p className="text-sm text-muted-foreground">
                      Export all pending order quantities
                      for the selected date range to Excel.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <strong className="block text-xl text-destructive">
                      {orderSummary.pending}
                    </strong>

                    <span className="text-xs text-muted-foreground">
                      Pending quantity
                    </span>
                  </div>

                  <Button
                    type="button"
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

              <Separator className="my-4" />

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>📅</span>

                <span>Report period:</span>

                <strong className="text-foreground">
                  {fromDate || "—"}
                </strong>

                <span>→</span>

                <strong className="text-foreground">
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
              valueClassName="text-emerald-600"
            />

            <KpiCard
              title="Products Pending"
              value={orderSummary.pending}
              description="Remaining quantity"
              valueClassName="text-destructive"
            />

            <KpiCard
              title="Fulfillment"
              value={`${fulfillmentPercentage}%`}
              description="Shipped / ordered"
              valueClassName="text-primary"
            />
          </div>

          {/* Tables */}

          <div className="grid gap-6 xl:grid-cols-2">

            {/* Pending orders */}

            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>
                    Pending Order Fulfillment
                  </CardTitle>

                  <CardDescription>
                    Ordered quantity remaining to be shipped
                  </CardDescription>
                </div>

                <Badge variant="destructive">
                  {orderSummary.pending}
                </Badge>
              </CardHeader>

              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>OA ID</TableHead>
                        <TableHead>Order Date</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">
                          Ordered
                        </TableHead>
                        <TableHead className="text-right">
                          Shipped
                        </TableHead>
                        <TableHead className="text-right">
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
                            >
                              <TableCell>
                                <span className="font-mono text-sm font-semibold text-primary">
                                  {
                                    row.oa_id
                                  }
                                </span>
                              </TableCell>

                              <TableCell>
                                {
                                  row.oa_date
                                }
                              </TableCell>

                              <TableCell>
                                {row.item_code}
                              </TableCell>

                              <TableCell className="text-right">
                                {row.ordered_quantity}
                              </TableCell>

                              <TableCell className="text-right text-emerald-600">
                                {row.shipped_quantity}
                              </TableCell>

                              <TableCell className="text-right font-semibold text-destructive">
                                {row.pending_quantity}
                              </TableCell>
                            </TableRow>
                          )
                        )
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="py-10 text-center text-emerald-600"
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

            <Card>
              <CardHeader>
                <CardTitle>
                  Operator Performance
                </CardTitle>

                <CardDescription>
                  Production by operator
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Operator</TableHead>
                      <TableHead>Production</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {prodKpis?.operator_summary?.map(
                      (operator) => (
                        <TableRow
                          key={operator?.operator}
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
          <Card className="lg:col-span-2 overflow-hidden">
            <CardHeader className="border-b bg-gradient-to-r from-blue-500/10 via-background to-cyan-500/10">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base">
                            Daily Production Output
                        </CardTitle>

                        <CardDescription className="mt-1">
                            Completed production tasks over the selected period
                        </CardDescription>
                    </div>

                    <div className="flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                        <span className="size-2 rounded-full bg-blue-500" />
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
                                        color: "#64748b",
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
                                        color: "rgba(148, 163, 184, 0.15)",
                                    },

                                    ticks: {
                                        color: "#64748b",
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

          <Card>
            <CardHeader>
              <CardTitle>
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

          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-gradient-to-r from-emerald-500/10 via-background to-blue-500/10">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <CardTitle className="text-base">
                            Task Flow by Operator
                        </CardTitle>

                        <CardDescription className="mt-1">
                            Assigned versus received production tasks
                        </CardDescription>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-sm bg-blue-500" />
                            <span className="text-muted-foreground">
                                Assigned
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-sm bg-emerald-500" />
                            <span className="text-muted-foreground">
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
                                        color: "#64748b",
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
                                        color:
                                            "rgba(148, 163, 184, 0.15)",
                                    },

                                    ticks: {
                                        precision: 0,
                                        color: "#64748b",
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
          <Card>
            <CardHeader>
              <CardTitle>
                Purchase Item Analysis
              </CardTitle>

              <CardDescription>
                Select one purchased item to analyse its
                purchase rates, suppliers and batch history.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <SearchableMultiSelect
                  label="Purchased Item"
                  options={purchaseItemCodes}
                  value={selectedPurchaseItem ? [selectedPurchaseItem] : []}
                  onChange={(values) => setSelectedPurchaseItem(values[0] || "")}
                  single
                />

                {selectedPurchaseItem && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      setSelectedPurchaseItem("")
                    }
                  >
                    Clear Selection
                  </Button>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {purchaseItemCodes.length.toLocaleString("en-IN")} purchased items
                </Badge>

                {selectedPurchaseItem && (
                  <Badge>Analysing: {selectedPurchaseItem}</Badge>
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
              valueClassName="text-emerald-600"
            />

            <KpiCard
              title="Most Expensive Batch"
              value={`₹${summary.maximumBatchRate.toFixed(2)}`}
              description={
                mostExpensiveBatch
                  ? mostExpensiveBatch.supplier
                  : "No data"
              }
              valueClassName="text-destructive"
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

            <Card>
              <CardHeader>
                <CardTitle>
                  Supplier Rate Distribution
                </CardTitle>

                <CardDescription>
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


            <Card>
              <CardHeader>
                <CardTitle>
                  Item Rate Distribution
                </CardTitle>

                <CardDescription>
                  Compare purchase rate variability across
                  different material items.
                </CardDescription>
              </CardHeader>

            </Card>

          </div>


          {/* ======================================================
              SUPPLIER ANALYSIS
          ====================================================== */}

          <Card>
            <CardHeader>
              <CardTitle>
                Supplier Price Analysis
              </CardTitle>

              <CardDescription>
                Compare supplier pricing, purchase volume,
                and total spend.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <Table>

                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        Supplier
                      </TableHead>

                      <TableHead className="text-right">
                        Batches
                      </TableHead>

                      <TableHead className="text-right">
                        Quantity
                      </TableHead>

                      <TableHead className="text-right">
                        Spend
                      </TableHead>

                      <TableHead className="text-right">
                        Avg Rate
                      </TableHead>

                      <TableHead className="text-right">
                        Min Rate
                      </TableHead>

                      <TableHead className="text-right">
                        Max Rate
                      </TableHead>
                    </TableRow>
                  </TableHeader>


                  <TableBody>
                    {supplierAnalysis?.length ? (
                      supplierAnalysis.map((supplier) => (
                        <TableRow
                          key={supplier.supplier}
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
                            ₹{Number(
                              supplier.total_spend || 0
                            ).toLocaleString(
                              "en-IN",
                              {
                                maximumFractionDigits: 0,
                              }
                            )}
                          </TableCell>

                          <TableCell className="text-right font-semibold">
                            ₹{Number(
                              supplier.average_rate || 0
                            ).toFixed(2)}
                          </TableCell>

                          <TableCell className="text-right text-emerald-600">
                            ₹{Number(
                              supplier.minimum_rate || 0
                            ).toFixed(2)}
                          </TableCell>

                          <TableCell className="text-right text-destructive">
                            ₹{Number(
                              supplier.maximum_rate || 0
                            ).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-10 text-center text-muted-foreground"
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
          <Card>
            <CardHeader>
              <CardTitle>
                🌎 Geographic & Fulfillment Analytics
              </CardTitle>

              <CardDescription>
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

              <div className="flex flex-wrap gap-3 rounded-lg border bg-muted/30 p-3">
                <Badge variant="secondary">
                  {selectedGroups?.length || 0} Product Groups
                </Badge>

                <Badge variant="secondary">
                  {selectedItems?.length || 0} Products
                </Badge>

                <Badge variant="secondary">
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
                  valueClassName="text-emerald-600"
                />

                <KpiCard
                  title="Filtered Pending"
                  value={geoSummary.pending}
                  valueClassName="text-destructive"
                />

                <KpiCard
                  title="Fulfillment"
                  value={`${geoFulfillmentPercentage}%`}
                  valueClassName="text-primary"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pending register */}

          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>
                  Pending Order Register
                </CardTitle>

                <CardDescription>
                  Pending quantities matching the selected
                  filters.
                </CardDescription>
              </div>

              <Badge variant="destructive">
                {geoSummary.pending}
              </Badge>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>OA ID</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Product Group</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">
                        Ordered
                      </TableHead>
                      <TableHead className="text-right">
                        Shipped
                      </TableHead>
                      <TableHead className="text-right">
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
                            >
                              <TableCell>
                                <span className="font-mono text-sm font-semibold text-primary">
                                  {
                                    row.oa_id
                                  }
                                </span>
                              </TableCell>

                              <TableCell>
                                {
                                  row.oa_date
                                }
                              </TableCell>

                              <TableCell>
                                {row.state_name || "—"}
                              </TableCell>

                              <TableCell>
                                <Badge variant="secondary">
                                  {group}
                                </Badge>
                              </TableCell>

                              <TableCell className="font-medium">
                                {row.item_code}
                              </TableCell>

                              <TableCell className="text-right">
                                {row.ordered_quantity}
                              </TableCell>

                              <TableCell className="text-right text-emerald-600">
                                {row.shipped_quantity}
                              </TableCell>

                              <TableCell className="text-right font-semibold text-destructive">
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
                          className="py-12 text-center text-emerald-600"
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div
          className={`text-3xl font-bold tracking-tight ${
            valueClassName || ""
          }`}
        >
          {value}
        </div>

        {description && (
          <p className="mt-1 text-xs text-muted-foreground">
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
            <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                    No purchase data available.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>

                <CardDescription>
                    Single purchase batch with the
                    {variant === "expensive"
                        ? " highest"
                        : " lowest"} recorded rate
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">

                <div className="text-3xl font-bold">
                    ₹{Number(batch.rate).toFixed(2)}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                        / {batch.unit_measure || "unit"}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4">

                    <div>
                        <p className="text-xs text-muted-foreground">
                            Supplier
                        </p>
                        <p className="font-medium">
                            {batch.supplier}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">
                            Item
                        </p>
                        <p className="font-mono font-medium">
                            {batch.item_code}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">
                            Quantity
                        </p>
                        <p>
                            {batch.quantity.toLocaleString()}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">
                            Batch Value
                        </p>
                        <p>
                            ₹{batch.amount.toLocaleString(
                                "en-IN"
                            )}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">
                            Purchase Date
                        </p>
                        <p>{batch.purchase_date}</p>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground">
                            Voucher
                        </p>
                        <p className="font-mono">
                            {batch.voucher_number}
                        </p>
                    </div>

                </div>
            </CardContent>
        </Card>
    );
}