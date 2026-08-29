import { useState } from "react";
import { Line, Pie } from "react-chartjs-2";
import GeoAnalyticsView from "./GeoAnalyticsView";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function TransportAnalyticsView({ state }) {
  const { transportChart, transportKpis, partnerPie } = state;
  const [activeView, setActiveView] = useState("statistics");

  const today = new Date().toISOString().split("T")[0];

  const totalPartners = transportKpis?.total_partners ?? 0;
  const totalDispatches = transportKpis?.total_dispatches ?? 0;
  const totalCost = Number(transportKpis?.total_cost ?? 0);
  const averageDispatchCost = Number(
    transportKpis?.average_dispatch_cost ?? 0
  );

  const monthlyCosts = transportKpis?.monthly_costs ?? [];
  const dispatchRecords = transportKpis?.dispatch_records ?? {};

  const formatCurrency = (value) =>
    `₹${Number(value ?? 0).toLocaleString("en-IN")}`;

  const formatNumber = (value) =>
    Number(value ?? 0).toLocaleString("en-IN");

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Transport Analytics
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Logistics performance dashboard
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="transport-from-date">From</Label>

            <Input
              id="transport-from-date"
              type="date"
              value={state.fromDate}
              onChange={(e) => state.setFromDate(e.target.value)}
              className="w-full sm:w-[160px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transport-to-date">To</Label>

            <Input
              id="transport-to-date"
              type="date"
              max={today}
              value={state.toDate}
              onChange={(e) => state.setToDate(e.target.value)}
              className="w-full sm:w-[160px]"
            />
          </div>

          <Button
            type="button"
            onClick={() =>
              state.fetchAnalytics(state.fromDate, state.toDate)
            }
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Main navigation */}
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

          <TabsTrigger value="geo">
            Geo Analytics
          </TabsTrigger>
        </TabsList>

        {/* ============================================================
            STATISTICS
        ============================================================ */}
        <TabsContent value="statistics" className="mt-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Logistics Partners
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatNumber(totalPartners)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Dispatches
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatNumber(totalDispatches)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Freight Spend
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(totalCost)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Freight
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(averageDispatchCost)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Summary</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Dispatches</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Average</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {monthlyCosts.length > 0 ? (
                      monthlyCosts.map((month) => {
                        const dispatches = Number(
                          month.total_dispatches ?? 0
                        );

                        const cost = Number(month.total_cost ?? 0);

                        const average = cost / (dispatches || 1);

                        return (
                          <TableRow key={month.month_period}>
                            <TableCell className="font-medium">
                              {month.month_period}
                            </TableCell>

                            <TableCell>
                              {formatNumber(dispatches)}
                            </TableCell>

                            <TableCell>
                              {formatCurrency(cost)}
                            </TableCell>

                            <TableCell>
                              {formatCurrency(average.toFixed(0))}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No monthly data available.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Dispatch Records */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">
                Dispatch Records
              </h3>

              <p className="text-sm text-muted-foreground">
                Dispatch activity grouped by month
              </p>
            </div>

            {Object.keys(dispatchRecords).length > 0 ? (
              <Accordion
                type="multiple"
                className="space-y-3"
              >
                {Object.entries(dispatchRecords).map(
                  ([month, records]) => (
                    <AccordionItem
                      key={month}
                      value={month}
                      className="rounded-lg border bg-card px-4"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2 text-left">
                          <span className="font-medium">
                            {month}
                          </span>

                          <span className="text-sm text-muted-foreground">
                            ({records.length} Dispatches)
                          </span>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent>
                        <div className="overflow-x-auto pb-2">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Partner</TableHead>
                                <TableHead>Zone</TableHead>
                                <TableHead>Weight</TableHead>
                                <TableHead>Subtotal</TableHead>
                                <TableHead>GST</TableHead>
                                <TableHead>Operator</TableHead>
                                <TableHead>Date</TableHead>
                              </TableRow>
                            </TableHeader>

                            <TableBody>
                              {records.map((record) => (
                                <TableRow key={record.id}>
                                  <TableCell className="font-medium">
                                    {record.partner_name}
                                  </TableCell>

                                  <TableCell>
                                    {record.destination_zone}
                                  </TableCell>

                                  <TableCell>
                                    {record.chargeable_weight}
                                  </TableCell>

                                  <TableCell>
                                    {formatCurrency(record.subtotal)}
                                  </TableCell>

                                  <TableCell>
                                    {formatCurrency(record.gst)}
                                  </TableCell>

                                  <TableCell>
                                    {record.operator}
                                  </TableCell>

                                  <TableCell className="whitespace-nowrap">
                                    {record.created_at}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                )}
              </Accordion>
            ) : (
              <Card>
                <CardContent className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                  No dispatch records available.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ============================================================
            CHARTS
        ============================================================ */}
        <TabsContent value="charts" className="mt-6">
          <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Logistics Spend</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="h-[420px] w-full">
                  <Line
                    data={transportChart}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        title: {
                          display: false,
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
                  Dispatches by Logistics Partner
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="h-[420px] w-full">
                  <Pie
                    data={partnerPie}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        title: {
                          display: false,
                        },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ============================================================
            GEO ANALYTICS
        ============================================================ */}
        <TabsContent value="geo" className="mt-6">
          <GeoAnalyticsView state={state} />
        </TabsContent>
      </Tabs>
    </div>
  );
}