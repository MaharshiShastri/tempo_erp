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
        <div className="space-y-4">
            {/* HEADER */}
            <Card className="overflow-hidden border-primary/20 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-primary/10 via-background to-blue-500/10">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                                <ClipboardList className="size-5" />
                            </div>

                            <div className="min-w-0">
                                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                                    <ShoppingCart className="size-3.5 text-blue-500" />
                                    <span>Sales</span>
                                    <span>/</span>
                                    <span>Order Management</span>
                                </div>

                                <CardTitle className="text-xl tracking-tight">
                                    Order Acceptance Manifest
                                </CardTitle>

                                <CardDescription className="mt-1">
                                    Review customer orders, production stage
                                    progress, billing information and ordered
                                    items.
                                </CardDescription>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Badge
                                variant="outline"
                                className="gap-2 border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-blue-600 dark:text-blue-400"
                            >
                                <ShoppingCart className="size-3.5" />

                                {orders.length}{" "}
                                {orders.length === 1
                                    ? "order"
                                    : "orders"}
                            </Badge>

                            <Button
                                type="button"
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
                <Card className="border-dashed border-border/80 shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
                        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <ClipboardList className="size-7" />
                        </div>

                        <h3 className="text-base font-semibold">
                            No Orders Found
                        </h3>

                        <p className="mt-2 max-w-md text-sm text-muted-foreground">
                            No order acceptance records are currently
                            available for this account.
                        </p>

                        <Button
                            type="button"
                            variant="outline"
                            className="mt-5"
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