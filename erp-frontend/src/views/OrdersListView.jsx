import {
    ClipboardList,
    Plus,
    ShoppingCart,
} from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import OrderCard from "../components/shared/OrderCard";

export default function OrdersListView({ state }) {
    const orders = state.orders || [];

    return (
        <div className="space-y-4 bg-[var(--bg-main)] text-[var(--text-primary)]">
            {/* HEADER */}
            <Card className="overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
                <CardHeader className="border-b border-[var(--border-light)] bg-[var(--bg-muted)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-accent)] text-white shadow-[var(--shadow-sm)]">
                                <ClipboardList className="size-5" />
                            </div>

                            <div className="min-w-0">
                                <div className="mb-1 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                                    <ShoppingCart className="size-3.5 text-[var(--brand-accent)]" />
                                    <span>Sales</span>
                                    <span>/</span>
                                    <span>Order Management</span>
                                </div>

                                <CardTitle className="text-xl tracking-tight text-[var(--text-primary)]">
                                    Order Acceptance Manifest
                                </CardTitle>

                                <CardDescription className="mt-1 text-[var(--text-muted)]">
                                    Review customer orders, production stage
                                    progress, billing information and ordered
                                    items.
                                </CardDescription>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Badge
                                variant="outline"
                                className="gap-2 border-[var(--brand-accent)]/30 bg-[var(--brand-accent)]/10 px-3 py-1.5 text-[var(--brand-accent)]"
                            >
                                <ShoppingCart className="size-3.5" />

                                {orders.length}{" "}
                                {orders.length === 1
                                    ? "order"
                                    : "orders"}
                            </Badge>

                            <Button
                                type="button"
                                className="bg-[var(--brand-accent)] text-white hover:opacity-90"
                                onClick={() =>
                                    state.triggerNewOrderInitialization()
                                }
                            >
                                <Plus className="mr-2 size-4" />
                                New Order Confirmation

                                <kbd className="ml-2 rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] font-medium">
                                    Alt+N
                                </kbd>
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* EMPTY STATE */}
            {orders.length === 0 ? (
                <Card className="border border-dashed border-[var(--border-light)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
                    <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
                        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]">
                            <ClipboardList className="size-7" />
                        </div>

                        <h3 className="text-base font-semibold text-[var(--text-primary)]">
                            No Orders Found
                        </h3>

                        <p className="mt-2 max-w-md text-sm text-[var(--text-muted)]">
                            No order acceptance records are currently
                            available for this account.
                        </p>

                        <Button
                            type="button"
                            variant="outline"
                            className="mt-5 border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)] hover:text-[var(--text-primary)]"
                            onClick={() =>
                                state.triggerNewOrderInitialization()
                            }
                        >
                            <Plus className="mr-2 size-4" />
                            Create Order
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <OrderCard
                            key={order.order_id}
                            order={order}
                            state={state}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}