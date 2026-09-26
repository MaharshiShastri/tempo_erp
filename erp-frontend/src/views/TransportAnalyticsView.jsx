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

  const themedInputClass =
    "border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]";

  const cardClass =
    "border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]";

  const cardHeaderClass =
    "border-b border-[var(--border-light)] bg-[var(--bg-muted)]";

  const tableHeaderClass =
    "bg-[var(--bg-muted)] text-[var(--text-muted)]";

  const tableRowClass =
    "border-[var(--border-light)] hover:bg-[var(--combobox-hover)]";

  return (
    <div className="w-full space-y-6 bg-[var(--bg-main)] text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            Transport Analytics
          </h2>

          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Logistics performance dashboard
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <Label
              htmlFor="transport-from-date"
              className="text-[var(--text-primary)]"
            >
              From
            </Label>

            <Input
              id="transport-from-date"
              type="date"
              value={state.fromDate}
              onChange={(e) => state.setFromDate(e.target.value)}
              className={`w-full sm:w-[160px] ${themedInputClass}`}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="transport-to-date"
              className="text-[var(--text-primary)]"
            >
              To
            </Label>

            <Input
              id="transport-to-date"
              type="date"
              max={today}
              value={state.toDate}
              onChange={(e) => state.setToDate(e.target.value)}
              className={`w-full sm:w-[160px] ${themedInputClass}`}
            />
          </div>

          <Button
            type="button"
            onClick={() =>
              state.fetchAnalytics(
                state.user.role,
                state.fromDate,
                state.toDate
              )
            }
            className="bg-[var(--brand-accent)] text-white hover:opacity-90"
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
        <TabsList className="flex h-auto w-full flex-row items-stretch justify-start gap-1 overflow-x-auto border border-[var(--border-light)] bg-[var(--bg-muted)] p-1">
          <TabsTrigger
            value="statistics"
            className="text-[var(--text-muted)] data-[state=active]:bg-[var(--bg-surface)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-[var(--shadow-sm)]"
          >
            Statistics
          </TabsTrigger>

          <TabsTrigger
            value="charts"
            className="text-[var(--text-muted)] data-[state=active]:bg-[var(--bg-surface)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-[var(--shadow-sm)]"
          >
            Charts
          </TabsTrigger>

          <TabsTrigger
            value="geo"
            className="text-[var(--text-muted)] data-[state=active]:bg-[var(--bg-surface)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-[var(--shadow-sm)]"
          >
            Geo Analytics
          </TabsTrigger>
        </TabsList>

        {/* ============================================================
            STATISTICS
        ============================================================ */}
        <TabsContent value="statistics" className="mt-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className={cardClass}>
              <CardHeader className={`pb-2 ${cardHeaderClass}`}>
                <CardTitle className="text-sm font-medium text-[var(--text-muted)]">
                  Total Logistics Partners
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="text-2xl font-bold text-[var(--brand-accent)]">
                  {formatNumber(totalPartners)}
                </div>
              </CardContent>
            </Card>

            <Card className={cardClass}>
              <CardHeader className={`pb-2 ${cardHeaderClass}`}>
                <CardTitle className="text-sm font-medium text-[var(--text-muted)]">
                  Total Dispatches
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="text-2xl font-bold text-[var(--brand-success)]">
                  {formatNumber(totalDispatches)}
                </div>
              </CardContent>
            </Card>

            <Card className={cardClass}>
              <CardHeader className={`pb-2 ${cardHeaderClass}`}>
                <CardTitle className="text-sm font-medium text-[var(--text-muted)]">
                  Total Freight Spend
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="text-2xl font-bold text-[var(--brand-danger)]">
                  {formatCurrency(totalCost)}
                </div>
              </CardContent>
            </Card>

            <Card className={cardClass}>
              <CardHeader className={`pb-2 ${cardHeaderClass}`}>
                <CardTitle className="text-sm font-medium text-[var(--text-muted)]">
                  Average Freight
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="text-2xl font-bold text-[var(--text-primary)]">
                  {formatCurrency(averageDispatchCost)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Summary */}
          <Card className={cardClass}>
            <CardHeader className={cardHeaderClass}>
              <CardTitle className="text-[var(--text-primary)]">
                Monthly Summary
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow
                      className={`border-[var(--border-light)] ${tableHeaderClass}`}
                    >
                      <TableHead className="text-[var(--text-muted)]">
                        Month
                      </TableHead>
                      <TableHead className="text-[var(--text-muted)]">
                        Dispatches
                      </TableHead>
                      <TableHead className="text-[var(--text-muted)]">
                        Total Cost
                      </TableHead>
                      <TableHead className="text-[var(--text-muted)]">
                        Average
                      </TableHead>
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
                          <TableRow
                            key={month.month_period}
                            className={tableRowClass}
                          >
                            <TableCell className="font-medium text-[var(--text-primary)]">
                              {month.month_period}
                            </TableCell>

                            <TableCell className="text-[var(--text-primary)]">
                              {formatNumber(dispatches)}
                            </TableCell>

                            <TableCell className="text-[var(--text-primary)]">
                              {formatCurrency(cost)}
                            </TableCell>

                            <TableCell className="text-[var(--text-primary)]">
                              {formatCurrency(average.toFixed(0))}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow className="border-[var(--border-light)]">
                        <TableCell
                          colSpan={4}
                          className="h-24 text-center text-[var(--text-muted)]"
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
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Dispatch Records
              </h3>

              <p className="text-sm text-[var(--text-muted)]">
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
                      className={`rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] px-4 shadow-[var(--shadow-sm)]`}
                    >
                      <AccordionTrigger className="text-[var(--text-primary)] hover:no-underline">
                        <div className="flex items-center gap-2 text-left">
                          <span className="font-medium text-[var(--text-primary)]">
                            {month}
                          </span>

                          <span className="text-sm text-[var(--text-muted)]">
                            ({records.length} Dispatches)
                          </span>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent>
                        <div className="overflow-x-auto pb-2">
                          <Table>
                            <TableHeader>
                              <TableRow
                                className={`border-[var(--border-light)] ${tableHeaderClass}`}
                              >
                                <TableHead className="text-[var(--text-muted)]">
                                  Partner
                                </TableHead>
                                <TableHead className="text-[var(--text-muted)]">
                                  Zone
                                </TableHead>
                                <TableHead className="text-[var(--text-muted)]">
                                  Weight
                                </TableHead>
                                <TableHead className="text-[var(--text-muted)]">
                                  Subtotal
                                </TableHead>
                                <TableHead className="text-[var(--text-muted)]">
                                  GST
                                </TableHead>
                                <TableHead className="text-[var(--text-muted)]">
                                  Operator
                                </TableHead>
                                <TableHead className="text-[var(--text-muted)]">
                                  Date
                                </TableHead>
                              </TableRow>
                            </TableHeader>

                            <TableBody>
                              {records.map((record) => (
                                <TableRow
                                  key={record.id}
                                  className={tableRowClass}
                                >
                                  <TableCell className="font-medium text-[var(--text-primary)]">
                                    {record.partner_name}
                                  </TableCell>

                                  <TableCell className="text-[var(--text-primary)]">
                                    {record.destination_zone}
                                  </TableCell>

                                  <TableCell className="text-[var(--text-primary)]">
                                    {record.chargeable_weight}
                                  </TableCell>

                                  <TableCell className="text-[var(--text-primary)]">
                                    {formatCurrency(record.subtotal)}
                                  </TableCell>

                                  <TableCell className="text-[var(--text-primary)]">
                                    {formatCurrency(record.gst)}
                                  </TableCell>

                                  <TableCell className="text-[var(--text-primary)]">
                                    {record.operator}
                                  </TableCell>

                                  <TableCell className="whitespace-nowrap text-[var(--text-primary)]">
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
              <Card className={cardClass}>
                <CardContent className="flex h-24 items-center justify-center text-sm text-[var(--text-muted)]">
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
            <Card className={cardClass}>
              <CardHeader className={cardHeaderClass}>
                <CardTitle className="text-[var(--text-primary)]">
                  Monthly Logistics Spend
                </CardTitle>
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

            <Card className={cardClass}>
              <CardHeader className={cardHeaderClass}>
                <CardTitle className="text-[var(--text-primary)]">
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