import { useRef } from "react";
import API from "../api/api";
import {
  FiTrendingUp,
  FiActivity,
  FiTruck,
  FiMapPin,
  FiPrinter,
  FiPieChart,
  FiAlertOctagon,
  FiTarget,
  FiDownload,
  FiUsers,
  FiPackage,
  FiMessageSquare,
} from "react-icons/fi";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import TransportAnalyticsView from "./TransportAnalyticsView";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function SalesAnalyticsView({ state }) {
  const {
    salesKpis,
    rndKpis,
    transportKpis,
    gtmKpis,
    errorLogs,
    email,
    prodKpis,
    isLoading,
    selectedAnalytics,
    setSelectedAnalytics,
    isExporting,
    setIsExporting,
    quarterlyTargets,
    setQuarterlyTargets,
    salesPerformanceChart,
    transportChart,
    faqAskedChart,
    faqAnswerChart,
    completionChart,
    productionPieChart,
    totalQueued,
    conversionRatio,
    total_completed,
    totalCRM,
    totalErrors,
    totalFaqAnswered,
    pendingFaqs,
    setAlertMessage,
    setIsAlertOpen,
    showErrorModal,
    user,
    fromDate,
    setFromDate,
    toDate,
    fetchAnalytics,
  } = state;

  const reportTabs = [
    "overview",
    "faq",
    "performance",
    "transport",
    "gtm",
    "production",
    "health",
  ];

  const dashboardRef = useRef(null);
  const reportRef = useRef(null);

  const wait = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;

    setIsExporting(true);
    setAlertMessage(
      "📸 Capturing high-resolution snapshot for PDF..."
    );
    setIsAlertOpen(true);

    try {
      const element = dashboardRef.current;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight =
        (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = 0;

      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(
        imgData,
        "PNG",
        0,
        position,
        pdfWidth,
        pdfHeight
      );

      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;

        pdf.addPage();

        pdf.addImage(
          imgData,
          "PNG",
          0,
          position,
          pdfWidth,
          pdfHeight
        );

        heightLeft -= pageHeight;
      }

      pdf.save(
        `Executive_Report_${
          new Date().toISOString().split("T")[0]
        }.pdf`
      );

      setAlertMessage("✅ PDF Downloaded Successfully.");
    } catch (error) {
      showErrorModal(
        "PDF Generation Failed",
        error.message
      );
    } finally {
      setIsExporting(false);
    }
  };

  const exportAllReports = async () => {
    const previousTab = selectedAnalytics;

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      let firstPage = true;

      for (const tab of reportTabs) {
        setSelectedAnalytics(tab);

        await new Promise(requestAnimationFrame);
        await wait(100);

        const canvas = await html2canvas(
          reportRef.current,
          {
            scale: 2,
            useCORS: true,
          }
        );

        const img = canvas.toDataURL("image/png");

        const pdfWidth =
          pdf.internal.pageSize.getWidth();

        const pdfHeight =
          (canvas.height * pdfWidth) /
          canvas.width;

        if (!firstPage) {
          pdf.addPage();
        }

        let heightLeft = pdfHeight;
        let position = 0;

        const pageHeight =
          pdf.internal.pageSize.getHeight();

        pdf.addImage(
          img,
          "PNG",
          0,
          position,
          pdfWidth,
          pdfHeight
        );

        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - pdfHeight;

          pdf.addPage();

          pdf.addImage(
            img,
            "PNG",
            0,
            position,
            pdfWidth,
            pdfHeight
          );

          heightLeft -= pageHeight;
        }

        firstPage = false;
      }

      pdf.save(
        `Executive Master report_${
          new Date().toISOString().split("T")[0]
        }.pdf`
      );
    } catch (err) {
      showErrorModal(
        "export failed",
        err.message
      );
    } finally {
      setSelectedAnalytics(previousTab);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1200px] space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-72" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>

          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleUpdateTarget = async (email) => {
    const targetValue = quarterlyTargets[email];

    if (!targetValue || isNaN(targetValue)) {
      showErrorModal(
        "Validation Error",
        "Please enter a valid target amount."
      );
      return;
    }

    try {
      await API.updateQuarterlyTarget(
        state.sessionToken,
        email,
        parseFloat(targetValue)
      );

      await state.fetchAnalytics?.();

      setAlertMessage(
        `✅ QTR Target set to ₹${targetValue} for ${email}`
      );

      setIsAlertOpen(true);
    } catch (error) {
      state.showErrorModal(
        "Update Failed",
        error.message
      );
    }
  };

  const tabConfig = [
    {
      value: "overview",
      label: "Overview",
      icon: FiPieChart,
    },
    {
      value: "faq",
      label: "F&Q Actions",
      icon: FiMessageSquare,
    },
    {
      value: "performance",
      label: "Team Matrix",
      icon: FiUsers,
    },
    {
      value: "transport",
      label: "Transport",
      icon: FiTruck,
    },
    {
      value: "gtm",
      label: "GTM ROI",
      icon: FiTarget,
    },
    {
      value: "production",
      label: "Production Analytics",
      icon: FiPackage,
    },
    {
      value: "health",
      label: "System Health",
      icon: FiAlertOctagon,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-4">
      {/* EXPORT ACTIONS */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          disabled={isExporting}
          onClick={exportAllReports}
        >
          <FiDownload className="mr-2 h-4 w-4" />
          Export Master Data
        </Button>

        <span className="px-1 text-sm text-muted-foreground">
          or
        </span>

        <Button
          disabled={isExporting}
          onClick={handleExportPDF}
          variant="outline"
        >
          <FiDownload className="mr-2 h-4 w-4" />
          {isExporting
            ? "Generating PDF..."
            : "Export to PDF"}
        </Button>
      </div>

      {/* MAIN DASHBOARD */}
      <Card
        ref={dashboardRef}
        className="overflow-hidden border-border"
      >
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <FiPieChart className="h-6 w-6" />
                Executive Command Center
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Financial data, GTM Evaluation, and System
                Health
              </p>
            </div>
          </div>

          {/* DATE FILTER */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                From
              </label>

              <Input
                type="date"
                value={fromDate}
                onChange={(e) =>
                  setFromDate(e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                To
              </label>

              <Input
                type="date"
                max={
                  new Date()
                    .toISOString()
                    .split("T")[0]
                }
                value={toDate}
                onChange={(e) =>
                  setToDate(e.target.value)
                }
              />
            </div>

            <Button
              onClick={() =>
                fetchAnalytics(user.role, fromDate, toDate)
              }
            >
              <FiActivity className="mr-2 h-4 w-4" />
              Refresh Analytics
            </Button>
          </div>

          <Separator />

          {/* ANALYTICS TABS */}
          <ScrollArea className="w-full whitespace-nowrap">
            <Tabs
              value={selectedAnalytics}
              onValueChange={setSelectedAnalytics}
            >
              <TabsList className="inline-flex h-auto min-w-max gap-1">
                {tabConfig.map(
                  ({
                    value,
                    label,
                    icon: Icon,
                  }) => (
                    <TabsTrigger
                      key={value}
                      value={value}
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </TabsTrigger>
                  )
                )}
              </TabsList>
            </Tabs>

            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardHeader>

        <CardContent ref={reportRef} className="space-y-8">
          {/* ===================================================== */}
          {/* OVERVIEW */}
          {/* ===================================================== */}

          {selectedAnalytics === "overview" && (
            <div className="space-y-8">
              {/* KPI CARDS */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground">
                      Total Targets Queued
                    </p>

                    <p className="mt-2 text-3xl font-bold">
                      {totalQueued}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground">
                      Lead Harvest Ratio
                    </p>

                    <p
                      className={`mt-2 text-3xl font-bold ${
                        conversionRatio > 50
                          ? "text-emerald-600"
                          : "text-destructive"
                      }`}
                    >
                      {conversionRatio.toFixed(2)}%
                    </p>

                    <p className="mt-1 text-xs font-medium">
                      {total_completed} out of{" "}
                      {totalQueued}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground">
                      Active CRM Deals
                    </p>

                    <p className="mt-2 text-3xl font-bold text-emerald-600">
                      {totalCRM}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
                  <CardContent className="p-5">
                    <p className="text-sm text-destructive">
                      System Faults
                    </p>

                    <p className="mt-2 text-3xl font-bold text-destructive">
                      {totalErrors}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* GTM COMPLETION */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold">
                    GTM Completion Ratio
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    Completion performance by month and GTM
                    source.
                  </p>
                </div>

                <div className="overflow-hidden rounded-lg border">
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">
                            Month
                          </TableHead>
                          <TableHead className="whitespace-nowrap">
                            GTM
                          </TableHead>
                          <TableHead className="whitespace-nowrap">
                            Queued
                          </TableHead>
                          <TableHead className="whitespace-nowrap">
                            Awaiting Review
                          </TableHead>
                          <TableHead className="whitespace-nowrap">
                            Completed
                          </TableHead>
                          <TableHead className="whitespace-nowrap">
                            Rejected
                          </TableHead>
                          <TableHead className="whitespace-nowrap">
                            Completion %
                          </TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {gtmKpis?.map((gtm) => {
                          const ratio =
                            gtm?.total_targets
                              ? (
                                  (gtm.completed /
                                    gtm.total_targets) *
                                  100
                                ).toFixed(1)
                              : 0;

                          return (
                            <TableRow
                              key={gtm.gtm_source}
                            >
                              <TableCell className="whitespace-nowrap">
                                {gtm.month}
                              </TableCell>

                              <TableCell className="whitespace-nowrap font-medium">
                                {gtm.gtm_source}
                              </TableCell>

                              <TableCell>
                                {gtm.total_targets}
                              </TableCell>

                              <TableCell>
                                {gtm.awaiting_review}
                              </TableCell>

                              <TableCell>
                                {gtm.completed}
                              </TableCell>

                              <TableCell>
                                {gtm.rejected}
                              </TableCell>

                              <TableCell>
                                <Badge variant="secondary">
                                  {ratio}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* TEAM PERFORMANCE */}
          {/* ===================================================== */}

          {selectedAnalytics === "performance" && (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Sales Team Activity Scores
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="h-[300px]">
                    <Bar
                      data={salesPerformanceChart}
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

              <div className="overflow-hidden rounded-lg border">
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serial number</TableHead>
                        <TableHead>
                          Executive Name
                        </TableHead>
                        <TableHead className="text-center">
                          Monthly Order Value
                        </TableHead>
                        <TableHead className="text-center">
                          Performance Score
                        </TableHead>
                        <TableHead className="text-center">
                          Quarterly Target
                        </TableHead>
                        <TableHead className="text-center">
                          Achievement %
                        </TableHead>
                        <TableHead className="text-center">
                          Set Quarterly Target
                        </TableHead>
                        <TableHead className="text-center">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {[...(salesKpis ?? [])].map(
                        (kpi, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              {idx + 1}
                            </TableCell>

                            <TableCell className="font-semibold">
                              {kpi.name}
                            </TableCell>

                            <TableCell className="text-center">
                              {kpi.monthly_order_value}
                            </TableCell>

                            <TableCell className="text-center font-semibold text-emerald-600">
                              {kpi.performance_score}
                            </TableCell>

                            <TableCell className="text-center">
                              {
                                kpi.quarterly_order_value_target
                              }
                            </TableCell>

                            <TableCell className="text-center">
                              {kpi.quarterly_order_value_target >
                              0
                                ? (
                                    (Number(
                                      kpi.monthly_order_value
                                    ) /
                                      Number(
                                        kpi.quarterly_order_value_target
                                      )) *
                                    100
                                  ).toFixed(1)
                                : 0}
                              %
                            </TableCell>

                            <TableCell className="text-center">
                              <Input
                                type="number"
                                min="0"
                                placeholder="Total QTR Value"
                                defaultValue={
                                  kpi.quarterly_target ||
                                  ""
                                }
                                className="mx-auto w-[140px]"
                                onChange={(e) =>
                                  setQuarterlyTargets(
                                    (prev) => ({
                                      ...prev,
                                      [kpi.email]:
                                        e.target.value,
                                    })
                                  )
                                }
                              />
                            </TableCell>

                            <TableCell className="text-center">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleUpdateTarget(
                                    kpi.email
                                  )
                                }
                              >
                                Save
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>

                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* TRANSPORT */}
          {/* ===================================================== */}

          {selectedAnalytics === "transport" && (
            <TransportAnalyticsView state={state} />
          )}

          {/* ===================================================== */}
          {/* FAQ */}
          {/* ===================================================== */}

          {selectedAnalytics === "faq" && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold">
                  Knowledge Base Performance
                </h3>

                <p className="text-sm text-muted-foreground">
                  Sales representative questions and R&D
                  knowledge performance.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Sales Representatives - Questions
                      Asked
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="h-[320px]">
                      <Bar
                        data={faqAskedChart}
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
                    <CardTitle className="text-base">
                      R&D Knowledge Scores
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="h-[320px]">
                      <Bar
                        data={faqAnswerChart}
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

              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground">
                      Answered
                    </p>

                    <p className="mt-2 text-3xl font-bold">
                      {totalFaqAnswered}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground">
                      Pending
                    </p>

                    <p className="mt-2 text-3xl font-bold text-amber-600">
                      {pendingFaqs}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* SALES RANKING */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Sales Representative Ranking
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="overflow-hidden rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>
                              Questions
                            </TableHead>
                            <TableHead>
                              Score
                            </TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {[
                            ...(salesKpis ?? []),
                          ]
                            .sort(
                              (a, b) =>
                                b.activity_score -
                                a.activity_score
                            )
                            .map((k, i) => (
                              <TableRow
                                key={k.email}
                              >
                                <TableCell>
                                  {i + 1}
                                </TableCell>

                                <TableCell className="font-medium">
                                  {k.name}
                                </TableCell>

                                <TableCell>
                                  {k.faqs_asked}
                                </TableCell>

                                <TableCell>
                                  <Badge>
                                    {k.activity_score}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* R&D RANKING */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      R&D Ranking
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="overflow-hidden rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>
                              Answered
                            </TableHead>
                            <TableHead>
                              Knowledge Score
                            </TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {[
                            ...(rndKpis ?? []),
                          ]
                            .sort(
                              (a, b) =>
                                b.knowledge_score -
                                a.knowledge_score
                            )
                            .map((k, i) => (
                              <TableRow
                                key={k.email}
                              >
                                <TableCell>
                                  {i + 1}
                                </TableCell>

                                <TableCell className="font-medium">
                                  {k.name}
                                </TableCell>

                                <TableCell>
                                  {k.faqs_answered}
                                </TableCell>

                                <TableCell>
                                  <Badge variant="secondary">
                                    {
                                      k.knowledge_score
                                    }
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* GTM */}
          {/* ===================================================== */}

          {selectedAnalytics === "gtm" && (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    API Credit Burn Rate (By Sales Rep)
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="overflow-hidden rounded-lg border">
                    <ScrollArea className="w-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              Sales Executive
                            </TableHead>

                            <TableHead className="text-center">
                              Total Lookups Generated
                            </TableHead>

                            <TableHead className="text-right">
                              Calculated Financial Cost
                            </TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {[
                            ...(salesKpis ?? []),
                          ].map((kpi, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-semibold">
                                {kpi.name}
                              </TableCell>

                              <TableCell className="text-center">
                                {kpi.targets_queued}
                              </TableCell>

                              <TableCell
                                className={`text-right font-medium ${
                                  Number(
                                    kpi.total_spend
                                  ) > 500
                                    ? "text-destructive"
                                    : ""
                                }`}
                              >
                                ₹
                                {Number(
                                  kpi.total_spend
                                ).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    GTM Performance Dashboard
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="h-[350px]">
                    <Bar
                      data={completionChart}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                        plugins: {
                          title: {
                            display: false,
                          },
                          legend: {
                            position: "bottom",
                          },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ===================================================== */}
          {/* PRODUCTION */}
          {/* ===================================================== */}

          {selectedAnalytics === "production" && (
            <div className="grid gap-8 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Production Distribution
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="h-[350px]">
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Active Order Staging
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <Table>
                    <TableBody>
                      {prodKpis?.map((k, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-semibold capitalize">
                            {k.stage.replace(
                              /\_/g,
                              " "
                            )}
                          </TableCell>

                          <TableCell className="text-right">
                            <Badge>
                              {k.count}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}

                      {prodKpis?.length === 0 && (
                        <TableRow>
                          <TableCell className="py-8 text-center text-muted-foreground">
                            No active orders on floor.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ===================================================== */}
          {/* SYSTEM HEALTH */}
          {/* ===================================================== */}

          {selectedAnalytics === "health" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FiAlertOctagon className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>

              <CardContent>
                {errorLogs?.length === 0 ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-400">
                    <div className="text-lg font-semibold">
                      ✅ Server is operating perfectly.
                    </div>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border">
                    <ScrollArea className="w-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              Timestamp
                            </TableHead>

                            <TableHead>
                              API Route
                            </TableHead>

                            <TableHead>
                              Exception Details
                            </TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {errorLogs?.map(
                            (log, idx) => (
                              <TableRow
                                key={idx}
                                className="bg-red-50/50 dark:bg-red-950/10"
                              >
                                <TableCell className="whitespace-nowrap text-muted-foreground">
                                  {log.created_at
                                    ?.split(".")?.[0]
                                    ?.replace(
                                      "T",
                                      " "
                                    )}
                                </TableCell>

                                <TableCell>
                                  <code className="rounded bg-muted px-2 py-1 text-xs font-semibold">
                                    {
                                      log.route_path
                                    }
                                  </code>
                                </TableCell>

                                <TableCell className="text-destructive">
                                  {
                                    log.error_message
                                  }
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>

                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}