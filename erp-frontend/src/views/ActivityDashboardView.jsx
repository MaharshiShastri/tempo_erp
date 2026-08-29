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
  const renderSection = (
    title,
    sectionKey,
    dataArray,
    accentClass
  ) => {
    const isOpen = state.openSection === sectionKey;

    return (
      <Collapsible
        open={isOpen}
        onOpenChange={() => state.toggleSection(sectionKey)}
        className="mb-4"
      >
        <Card className="overflow-hidden">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`h-8 w-1 rounded-full ${accentClass}`}
                />

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">
                      {title}
                    </h3>

                    <Badge
                      variant="secondary"
                      className="text-[11px]"
                    >
                      {dataArray.length}
                    </Badge>
                  </div>
                </div>
              </div>

              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <Separator />

            <CardContent className="p-3">
              {dataArray.length === 0 ? (
                <div className="flex min-h-[100px] items-center justify-center text-center text-sm text-muted-foreground">
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
                        className="overflow-hidden rounded-md border"
                      >
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <Badge
                                variant="outline"
                                className="shrink-0 font-mono text-[11px]"
                              >
                                {shortOrderId}
                              </Badge>

                              <span className="truncate text-sm font-semibold">
                                {order.billing_name}
                              </span>

                              <span className="hidden text-xs text-muted-foreground sm:inline">
                                Due: {order.due_date}
                              </span>
                            </div>

                            <div className="flex shrink-0 items-center gap-3">
                              <Badge
                                variant="secondary"
                                className="hidden text-[11px] sm:inline-flex"
                              >
                                {order.logs.length} Updates
                              </Badge>

                              {isRowOpen ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </button>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <Separator />

                          <div className="bg-muted/20 p-4">
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
                                className="text-xs"
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
                                className="shrink-0"
                              >
                                <Plus className="mr-1.5 h-4 w-4" />
                                Add Log
                              </Button>
                            </div>

                            {/* Logs */}
                            {order.logs.length === 0 ? (
                              <p className="text-xs italic text-muted-foreground">
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
                                      <div className="pt-1 text-[11px] text-muted-foreground">
                                        {new Date(
                                          log.created_at
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </div>

                                      {/* Log content */}
                                      <div className="relative border-l pl-4">
                                        <div className="mb-1 flex items-start justify-between gap-3">
                                          <span className="text-xs font-semibold text-primary">
                                            {log.operator_name ||
                                              log.operator_email}
                                          </span>

                                          <div className="flex shrink-0 items-center gap-2">
                                            <Badge
                                              variant="outline"
                                              className="text-[10px]"
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
                                                className="h-6 w-6 text-destructive hover:text-destructive"
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </Button>
                                            )}
                                          </div>
                                        </div>

                                        <p className="text-xs leading-relaxed text-foreground">
                                          {log.message}
                                        </p>

                                        {/* Material metadata */}
                                        {log.metadata && (
                                          <div className="mt-2 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 font-mono text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
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
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-sm text-muted-foreground">
          Loading Dashboard Telemetry...
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Shop Floor Accountability Hub
        </CardTitle>

        <CardDescription>
          Audit trails, manual logging, and historical progression.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {renderSection(
          "Work-in-Progress (WIP)",
          "ongoing",
          state.treeData.ongoing,
          "bg-primary"
        )}

        {renderSection(
          "Order Pipeline",
          "future",
          state.treeData.future,
          "bg-destructive"
        )}

        {renderSection(
          "Archived / Completed",
          "past",
          state.treeData.past,
          "bg-emerald-500"
        )}
      </CardContent>
    </Card>
  );
}