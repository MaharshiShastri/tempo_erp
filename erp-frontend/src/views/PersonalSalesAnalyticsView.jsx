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
    <div className="mx-auto w-full max-w-[1100px] space-y-8 bg-[var(--bg-main)] p-6 text-[var(--text-primary)] md:p-8">
      {/* ============================================================
          PERSONAL QUOTA
      ============================================================ */}

      {user.role === "Sales Representative" && (
        <section className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-[var(--brand-accent)]" />

              <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                My Quarterly Quota
              </h2>
            </div>

            <p className="text-sm text-[var(--text-muted)]">
              Track your personal progress against your quarterly goal.
            </p>
          </div>

          <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
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
                  valueClassName="text-[var(--brand-success)]"
                />

                <QuotaMetric
                  label="Current Shortfall"
                  value={`₹${Number(shortfall || 0).toLocaleString(
                    "en-IN"
                  )}`}
                  valueClassName={
                    shortfall > 0
                      ? "text-[var(--brand-danger)]"
                      : "text-[var(--brand-success)]"
                  }
                />
              </div>

              {/* PROGRESS */}

              <div className="mt-8 space-y-3">
                <Progress
                  value={Math.min(100, Math.max(0, progressPercentage || 0))}
                  className="h-4 bg-[var(--bg-muted)] [&>div]:bg-[var(--brand-accent)]"
                />

                <div
                  className={[
                    "flex items-center justify-center gap-2 text-sm font-semibold",
                    isTargetAchieved
                      ? "text-[var(--brand-success)]"
                      : "text-[var(--text-primary)]",
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
            <Award className="h-5 w-5 text-[var(--brand-accent)]" />

            <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
              Team Leaderboards
            </h2>
          </div>

          <p className="text-sm text-[var(--text-muted)]">
            See how you rank against the rest of the sales force.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* ==========================================================
              TOP CLOSERS
          ========================================================== */}

          <Card className="overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
            <CardHeader className="border-b border-[var(--border-light)] bg-[var(--bg-muted)] px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <Activity className="h-4 w-4 text-[var(--brand-accent)]" />
                Top Closers
                <span className="font-normal text-[var(--text-muted)]">
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
                        className={[
                          "border-b border-[var(--border-light)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)]",
                          isCurrentUser
                            ? "bg-[var(--brand-accent)]/10 hover:bg-[var(--brand-accent)]/15"
                            : "",
                        ].join(" ")}
                      >
                        <TableCell className="font-semibold">
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                idx < 3
                                  ? "text-[var(--brand-accent)]"
                                  : "text-[var(--text-primary)]"
                              }
                            >
                              {idx + 1}. {kpi.name?.split(" ")[0]}
                            </span>

                            {isCurrentUser && (
                              <Badge
                                variant="outline"
                                className="border-[var(--border-light)] bg-[var(--bg-muted)] px-1.5 py-0 text-[10px] text-[var(--text-primary)]"
                              >
                                You
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-right font-semibold text-[var(--brand-success)]">
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

          <Card className="overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
            <CardHeader className="border-b border-[var(--border-light)] bg-[var(--bg-muted)] px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <TrendingUp className="h-4 w-4 text-[var(--brand-success)]" />
                Target Crushers
                <span className="font-normal text-[var(--text-muted)]">
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
                        className={[
                          "border-b border-[var(--border-light)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)]",
                          isCurrentUser
                            ? "bg-[var(--brand-accent)]/10 hover:bg-[var(--brand-accent)]/15"
                            : "",
                        ].join(" ")}
                      >
                        <TableCell className="w-[35%] font-semibold">
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                idx < 3
                                  ? "text-[var(--brand-accent)]"
                                  : "text-[var(--text-primary)]"
                              }
                            >
                              {idx + 1}. {kpi.name?.split(" ")[0]}
                            </span>

                            {isCurrentUser && (
                              <Badge
                                variant="outline"
                                className="border-[var(--border-light)] bg-[var(--bg-muted)] px-1.5 py-0 text-[10px] text-[var(--text-primary)]"
                              >
                                You
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="w-[45%]">
                          <Progress
                            value={Math.min(100, Math.max(0, pct))}
                            className="h-2 bg-[var(--bg-muted)] [&>div]:bg-[var(--brand-accent)]"
                          />
                        </TableCell>

                        <TableCell className="text-right font-semibold text-[var(--brand-success)]">
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
  valueClassName = "text-[var(--text-primary)]",
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
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