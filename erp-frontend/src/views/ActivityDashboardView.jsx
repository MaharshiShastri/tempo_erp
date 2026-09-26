import React from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Package,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { ScrollArea } from "@/components/ui/scroll-area";

export default function ActivityDashboardView({ state }) {
  const renderSection = (title, sectionKey, dataArray, accentClass) => {
    const isOpen = state.openSection === sectionKey;

    return (
      <Collapsible
        open={isOpen}
        onOpenChange={() => state.toggleSection(sectionKey)}
        className="mb-4"
      >
        <Card className="overflow-hidden border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[var(--combobox-hover)]"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`h-8 w-1 rounded-full ${accentClass}`}
                />

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      {title}
                    </h3>

                    <Badge
                      variant="secondary"
                      className="border-[var(--border-light)] bg-[var(--bg-muted)] text-[11px] text-[var(--text-primary)]"
                    >
                      {dataArray.length}
                    </Badge>
                  </div>
                </div>
              </div>

              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
              ) : (
                <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
              )}
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <Separator className="bg-[var(--border-light)]" />

            <CardContent className="p-3">
              {dataArray.length === 0 ? (
                <div className="flex min-h-[100px] items-center justify-center text-center text-sm text-[var(--text-muted)]">
                  No orders in this category.
                </div>
              ) : (
                <div className="space-y-2">
                  {dataArray.map((order) => {
                    const orderId = order.order_acceptance_id;
                    const isRowOpen = state.openRows.has(orderId);

                    const shortOrderId =
                      orderId.length > 7
                        ? `${orderId.substring(0, 7)}...`
                        : orderId.substring(0, 7);

                    return (
                      <Collapsible
                        key={orderId}
                        open={isRowOpen}
                        onOpenChange={() =>
                          state.toggleRow(orderId)
                        }
                        className="overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-main)]"
                      >
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-[var(--combobox-hover)]"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <Badge
                                variant="outline"
                                className="shrink-0 border-[var(--border-light)] bg-[var(--bg-muted)] font-mono text-[11px] text-[var(--text-primary)]"
                              >
                                {shortOrderId}
                              </Badge>

                              <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
                                {order.billing_name}
                              </span>

                              <span className="hidden text-xs text-[var(--text-muted)] sm:inline">
                                Due: {order.due_date}
                              </span>
                            </div>

                            <div className="flex shrink-0 items-center gap-3">
                              <Badge
                                variant="secondary"
                                className="hidden border-[var(--border-light)] bg-[var(--bg-muted)] text-[11px] text-[var(--text-primary)] sm:inline-flex"
                              >
                                {order.logs.length} Updates
                              </Badge>

                              {isRowOpen ? (
                                <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
                              )}
                            </div>
                          </button>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <Separator className="bg-[var(--border-light)]" />

                          <div className="bg-[var(--bg-muted)] p-4">
                            {/* Manual Log Entry */}
                            <div className="mb-5 flex gap-2">
                              <Input
                                type="text"
                                placeholder="Log manual activity or note..."
                                value={
                                  state.manualLogInputs[orderId] || ""
                                }
                                onChange={(e) =>
                                  state.setManualLogInputs(
                                    (prev) => ({
                                      ...prev,
                                      [orderId]: e.target.value,
                                    })
                                  )
                                }
                                className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:ring-[var(--brand-accent)]"
                              />

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={
                                  state.isSubmittingLog ||
                                  !state.manualLogInputs[
                                    orderId
                                  ]?.trim()
                                }
                                onClick={() =>
                                  state.handleAddManualLog(orderId)
                                }
                                className="shrink-0 border-[var(--border-light)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)]"
                              >
                                <Plus className="mr-1.5 h-4 w-4" />
                                Add Log
                              </Button>
                            </div>

                            {/* Logs */}
                            {order.logs.length === 0 ? (
                              <p className="text-xs italic text-[var(--text-muted)]">
                                No activity logged for this order yet.
                              </p>
                            ) : (
                              <ScrollArea className="max-h-[500px]">
                                <div className="space-y-4 pr-3">
                                  {order.logs.map((log) => (
                                    <div
                                      key={log.log_id}
                                      className="grid grid-cols-[55px_1fr] gap-3"
                                    >
                                      {/* Time */}
                                      <div className="pt-1 text-[11px] text-[var(--text-muted)]">
                                        {new Date(
                                          log.created_at
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </div>

                                      {/* Log content */}
                                      <div className="relative border-l border-[var(--border-light)] pl-4">
                                        <div className="mb-1 flex items-start justify-between gap-3">
                                          <span className="text-xs font-semibold text-[var(--brand-accent)]">
                                            {log.operator_name ||
                                              log.operator_email}
                                          </span>

                                          <div className="flex shrink-0 items-center gap-2">
                                            <Badge
                                              variant="outline"
                                              className="border-[var(--border-light)] bg-[var(--bg-main)] text-[10px] text-[var(--text-primary)]"
                                            >
                                              {log.log_type}
                                            </Badge>

                                            {(
                                              state.user.role ===
                                                "Admin" ||
                                              state.user.role ===
                                                "Chief Full Stack Developer"
                                            ) && (
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                  state.handleDeleteLog(
                                                    log.log_id
                                                  )
                                                }
                                                title="Delete Audit Record"
                                                className="h-6 w-6 text-[var(--brand-danger)] hover:bg-[var(--warning-row)] hover:text-[var(--brand-danger)]"
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </Button>
                                            )}
                                          </div>
                                        </div>

                                        <p className="text-xs leading-relaxed text-[var(--text-primary)]">
                                          {log.message}
                                        </p>

                                        {/* Material metadata */}
                                        {log.metadata && (
                                          <div className="mt-2 flex items-center gap-2 rounded-md border border-[var(--brand-success)]/40 bg-[var(--bg-main)] px-3 py-2 font-mono text-xs text-[var(--brand-success)]">
                                            <Package className="h-3.5 w-3.5 shrink-0" />

                                            <span>
                                              Material Block:{" "}
                                              <strong>
                                                {log.metadata.qty}x
                                              </strong>{" "}
                                              {
                                                log.metadata
                                                  .item_code
                                              }
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  };

  if (state.loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center bg-[var(--bg-main)]">
        <div className="text-sm text-[var(--text-muted)]">
          Loading Dashboard Telemetry...
        </div>
      </div>
    );
  }

  return (
    <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
      <CardHeader className="border-b border-[var(--border-light)]">
        <CardTitle className="text-lg text-[var(--text-primary)]">
          Shop Floor Accountability Hub
        </CardTitle>

        <CardDescription className="text-[var(--text-muted)]">
          Audit trails, manual logging, and historical progression.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 bg-[var(--bg-main)] p-4">
        {renderSection(
          "Work-in-Progress (WIP)",
          "ongoing",
          state.treeData.ongoing,
          "bg-[var(--brand-accent)]"
        )}

        {renderSection(
          "Order Pipeline",
          "future",
          state.treeData.future,
          "bg-[var(--brand-danger)]"
        )}

        {renderSection(
          "Archived / Completed",
          "past",
          state.treeData.past,
          "bg-[var(--brand-success)]"
        )}
      </CardContent>
    </Card>
  );
}
