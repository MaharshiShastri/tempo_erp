import React from "react";
import {
  Target,
  Award,
  AlertCircle,
  TrendingUp,
  Activity,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";

export default function PersonalSalesAnalyticsView({ state }) {
  const {
    target,
    harvested,
    progressPercentage,
    shortfall,
    leaderboardByAmount,
    leaderboardByPercent,
    getPercent,
    user,
  } = state;

  const isTargetAchieved = progressPercentage >= 100;

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-8 p-6 md:p-8">
      {/* ============================================================
          PERSONAL QUOTA
      ============================================================ */}

      {user.role === "Sales Representative" && (
        <section className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />

              <h2 className="text-xl font-semibold tracking-tight">
                My Quarterly Quota
              </h2>
            </div>

            <p className="text-sm text-muted-foreground">
              Track your personal progress against your quarterly goal.
            </p>
          </div>

          <Card>
            <CardContent className="p-6 md:p-8">
              {/* KPI VALUES */}

              <div className="grid gap-6 text-center md:grid-cols-3">
                <QuotaMetric
                  label="QTR Target Value"
                  value={`₹${Number(target || 0).toLocaleString("en-IN")}`}
                />

                <QuotaMetric
                  label="Achieved (Won)"
                  value={`₹${Number(harvested || 0).toLocaleString(
                    "en-IN"
                  )}`}
                  valueClassName="text-emerald-600 dark:text-emerald-400"
                />

                <QuotaMetric
                  label="Current Shortfall"
                  value={`₹${Number(shortfall || 0).toLocaleString(
                    "en-IN"
                  )}`}
                  valueClassName={
                    shortfall > 0
                      ? "text-destructive"
                      : "text-emerald-600 dark:text-emerald-400"
                  }
                />
              </div>

              {/* PROGRESS */}

              <div className="mt-8 space-y-3">
                <Progress
                  value={Math.min(100, Math.max(0, progressPercentage || 0))}
                  className="h-4"
                />

                <div
                  className={[
                    "flex items-center justify-center gap-2 text-sm font-semibold",
                    isTargetAchieved
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-foreground",
                  ].join(" ")}
                >
                  {isTargetAchieved ? (
                    <>
                      <Award className="h-4 w-4" />
                      Target Achieved! Excellent work.
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      You are {Number(progressPercentage || 0).toFixed(1)}% to
                      goal.
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ============================================================
          TEAM LEADERBOARDS
      ============================================================ */}

      <section className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />

            <h2 className="text-xl font-semibold tracking-tight">
              Team Leaderboards
            </h2>
          </div>

          <p className="text-sm text-muted-foreground">
            See how you rank against the rest of the sales force.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* ==========================================================
              TOP CLOSERS
          ========================================================== */}

          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/40 px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Activity className="h-4 w-4 text-primary" />
                Top Closers
                <span className="font-normal text-muted-foreground">
                  (By Total Value)
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableBody>
                  {leaderboardByAmount.map((kpi, idx) => {
                    const isCurrentUser = kpi.email === user.email;

                    return (
                      <TableRow
                        key={kpi.email || idx}
                        className={
                          isCurrentUser
                            ? "bg-primary/10 hover:bg-primary/15"
                            : undefined
                        }
                      >
                        <TableCell className="font-semibold">
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                idx < 3
                                  ? "text-primary"
                                  : "text-foreground"
                              }
                            >
                              {idx + 1}. {kpi.name?.split(" ")[0]}
                            </span>

                            {isCurrentUser && (
                              <Badge
                                variant="secondary"
                                className="px-1.5 py-0 text-[10px]"
                              >
                                You
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          ₹
                          {Number(
                            parseFloat(kpi.targets_harvested || 0)
                          ).toLocaleString("en-IN")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* ==========================================================
              TARGET CRUSHERS
          ========================================================== */}

          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/40 px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Target Crushers
                <span className="font-normal text-muted-foreground">
                  (By Quota %)
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableBody>
                  {leaderboardByPercent.map((kpi, idx) => {
                    const pct = Number(getPercent(kpi) || 0);
                    const isCurrentUser = kpi.email === user.email;

                    return (
                      <TableRow
                        key={kpi.email || idx}
                        className={
                          isCurrentUser
                            ? "bg-primary/10 hover:bg-primary/15"
                            : undefined
                        }
                      >
                        <TableCell className="w-[35%] font-semibold">
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                idx < 3
                                  ? "text-primary"
                                  : "text-foreground"
                              }
                            >
                              {idx + 1}. {kpi.name?.split(" ")[0]}
                            </span>

                            {isCurrentUser && (
                              <Badge
                                variant="secondary"
                                className="px-1.5 py-0 text-[10px]"
                              >
                                You
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="w-[45%]">
                          <Progress
                            value={Math.min(100, Math.max(0, pct))}
                            className="h-2"
                          />
                        </TableCell>

                        <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          {pct.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

/* ================================================================
   QUOTA METRIC
================================================================ */

function QuotaMetric({
  label,
  value,
  valueClassName = "text-foreground",
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>

      <div
        className={[
          "text-3xl font-bold tracking-tight md:text-4xl",
          valueClassName,
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}