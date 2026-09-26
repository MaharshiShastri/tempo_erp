import {
    FiActivity,
    FiArrowRight,
    FiBox,
    FiCalendar,
    FiLayers,
} from "react-icons/fi";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function GlobalProductionPulseView({ state }) {
    const {
        STAGES,
        orders,
        isLoading,
        isFactory,
        loadPulse,
        handleMoveStage,
        isDispatcher,
    } = state;

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center bg-[var(--bg-main)] text-[var(--text-primary)]">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="relative flex size-12 items-center justify-center rounded-full bg-[var(--bg-muted)]">
                        <FiActivity className="size-6 animate-pulse text-[var(--brand-accent)]" />

                        <span className="absolute inset-0 animate-ping rounded-full border border-[var(--border-light)]" />
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                            Loading Factory Floor...
                        </p>

                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                            Fetching the latest production movement.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const totalProducts = orders.reduce((total, order) => {
        return (
            total +
            (order.items && order.items.length > 0
                ? order.items.length
                : 1)
        );
    }, 0);

    const activeOrders = orders.length;

    return (
        <div className="mx-auto flex h-[85vh] w-full max-w-[1500px] flex-col gap-5 bg-[var(--bg-main)] text-[var(--text-primary)]">
            {/* ===================================================== */}
            {/* PRODUCTION PULSE HEADER */}
            {/* ===================================================== */}

            <Card className="relative shrink-0 overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
                {/* Decorative accent */}
                <div className="absolute inset-y-0 left-0 w-1 bg-[var(--brand-accent)]" />

                <CardHeader className="pl-6">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        {/* TITLE */}
                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--bg-muted)] text-[var(--brand-accent)]">
                                    <FiActivity className="size-5" />
                                </div>

                                <Badge
                                    variant="outline"
                                    className="border-[var(--brand-success)] bg-[var(--bg-muted)] text-[var(--brand-success)]"
                                >
                                    <span className="mr-1.5 size-1.5 animate-pulse rounded-full bg-[var(--brand-success)]" />
                                    LIVE FLOOR
                                </Badge>
                            </div>

                            <CardTitle className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                                Global Production Pulse
                            </CardTitle>

                            <CardDescription className="mt-1 max-w-2xl text-[var(--text-muted)]">
                                Company-wide transparency across active
                                production. Track products as they move
                                through the factory floor.
                            </CardDescription>
                        </div>

                        {/* SUMMARY METRICS */}
                        <div className="flex flex-wrap gap-2">
                            <PulseMetric
                                icon={<FiLayers />}
                                label="Orders"
                                value={activeOrders}
                                className="bg-[var(--bg-muted)] text-[var(--brand-accent)]"
                            />

                            <PulseMetric
                                icon={<FiBox />}
                                label="Products"
                                value={totalProducts}
                                className="bg-[var(--bg-muted)] text-[var(--brand-accent)]"
                            />

                            <PulseMetric
                                icon={<FiActivity />}
                                label="Stages"
                                value={STAGES.length}
                                className="bg-[var(--bg-muted)] text-[var(--brand-accent)]"
                            />
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* ===================================================== */}
            {/* KANBAN BOARD */}
            {/* ===================================================== */}

            <div className="min-h-0 flex-1 overflow-x-auto pb-2">
                <div className="flex h-full min-w-max gap-3.5">
                    {STAGES.map((stage, stageIndex) => {
                        const stageOrders = orders.filter(
                            (order) =>
                                order.production_stage === stage.key ||
                                (!order.production_stage &&
                                    stage.key === "PO_SUBMITTED")
                        );

                        const stageItems = stageOrders.flatMap((order) => {
                            const items =
                                order.items && order.items.length > 0
                                    ? order.items
                                    : [
                                          {
                                              item_code:
                                                  "Item details unavailable",
                                          },
                                      ];

                            return items.map((item, index) => ({
                                ...item,
                                _parentOrder: order,
                                _uniqueKey: `${order.order_id}-${index}`,
                            }));
                        });

                        return (
                            <ProductionStageColumn
                                key={stage.key}
                                stage={stage}
                                stageIndex={stageIndex}
                                stageItems={stageItems}
                                isFactory={isFactory}
                                handleMoveStage={handleMoveStage}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/* ========================================================= */
/* STAGE COLUMN */
/* ========================================================= */

function ProductionStageColumn({
    stage,
    stageIndex,
    stageItems,
    isFactory,
    handleMoveStage,
}) {
    return (
        <Card
            className="
                group
                flex
                h-full
                min-h-0
                w-[295px]
                shrink-0
                flex-col
                gap-0
                overflow-hidden
                border border-[var(--border-subtle)]
                bg-[var(--bg-muted)]
                py-0
                text-[var(--text-primary)]
                shadow-[var(--shadow-sm)]
                transition-all
                duration-200
                hover:shadow-[var(--shadow-sm)]
                lg:flex-1
            "
        >
            {/* ================================================= */}
            {/* STAGE HEADER */}
            {/* ================================================= */}

            <div
                className="relative shrink-0 overflow-hidden border-b-[3px] px-4 py-3.5"
                style={{
                    backgroundColor: stage.bg,
                    borderBottomColor: stage.color,
                }}
            >
                {/* Background glow */}
                <div
                    className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full opacity-20 blur-2xl"
                    style={{
                        backgroundColor: stage.color,
                    }}
                />

                <div className="relative flex items-center justify-between gap-3">
                    {/* Stage identity */}
                    <div className="flex min-w-0 items-center gap-3">
                        <div
                            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white shadow-[var(--shadow-sm)]"
                            style={{
                                backgroundColor: stage.color,
                            }}
                        >
                            <FiActivity className="size-4" />
                        </div>

                        <div className="min-w-0">
                            <div
                                className="truncate text-[13px] font-bold"
                                style={{
                                    color: stage.color,
                                }}
                            >
                                {stage.label}
                            </div>

                            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                                Stage {stageIndex + 1}
                            </div>
                        </div>
                    </div>

                    {/* Count */}
                    <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold"
                        style={{
                            color: stage.color,
                            backgroundColor: stage.bg,
                            borderColor: stage.color,
                        }}
                    >
                        {stageItems.length}
                    </div>
                </div>
            </div>

            {/* ================================================= */}
            {/* STAGE BODY */}
            {/* ================================================= */}

            <ScrollArea className="min-h-0 flex-1">
                <div
                    className="flex min-h-full flex-col gap-2.5 p-2.5"
                    style={{
                        backgroundColor: "var(--bg-muted)",
                    }}
                >
                    {stageItems.map((item) => (
                        <ProductionItemCard
                            key={item._uniqueKey}
                            item={item}
                            stage={stage}
                            isFactory={isFactory}
                            handleMoveStage={handleMoveStage}
                        />
                    ))}

                    {/* EMPTY STATE */}
                    {stageItems.length === 0 && (
                        <EmptyStage stage={stage} />
                    )}
                </div>
            </ScrollArea>
        </Card>
    );
}

/* ========================================================= */
/* PRODUCT CARD */
/* ========================================================= */

function ProductionItemCard({
    item,
    stage,
    isFactory,
    handleMoveStage,
}) {
    const order = item._parentOrder;

    const canAdvance =
        isFactory &&
        stage.key !== "DISPATCHED" &&
        stage.key !== "READY_TO_DISPATCH";

    return (
        <Card
            className="
                group/card
                relative
                overflow-hidden
                border border-[var(--border-light)]
                bg-[var(--bg-main)]
                py-0
                text-[var(--text-primary)]
                shadow-[var(--shadow-sm)]
                transition-all
                duration-200
                hover:-translate-y-[1px]
                hover:shadow-[var(--shadow-sm)]
            "
        >
            {/* Stage colour rail */}
            <div
                className="absolute inset-y-0 left-0 w-1"
                style={{
                    backgroundColor: stage.color,
                }}
            />

            <CardContent className="p-3 pl-4">
                {/* ================================================= */}
                {/* PRODUCT HEADER */}
                {/* ================================================= */}

                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <div
                                className="flex size-7 shrink-0 items-center justify-center rounded-md"
                                style={{
                                    backgroundColor: stage.bg,
                                    color: stage.color,
                                }}
                            >
                                <FiBox className="size-3.5" />
                            </div>

                            <span className="truncate text-sm font-bold text-[var(--text-primary)]">
                                {item.item_code}
                            </span>
                        </div>
                    </div>

                    {/* QUANTITY */}
                    {item.quantity ? (
                        <Badge
                            variant="secondary"
                            className="shrink-0 border border-[var(--border-light)] bg-[var(--bg-muted)] text-[10px] font-bold text-[var(--text-primary)]"
                        >
                            ×{item.quantity}
                        </Badge>
                    ) : null}
                </div>

                {/* ================================================= */}
                {/* INFORMATION */}
                {/* ================================================= */}

                <div className="mt-3 grid grid-cols-2 gap-2">
                    {/* OA */}
                    <InfoTile
                        icon={<FiLayers />}
                        label="Order"
                        value={order.order_id}
                        className="bg-[var(--bg-muted)]"
                        iconClassName="text-[var(--brand-accent)]"
                    />

                    {/* DUE DATE */}
                    <InfoTile
                        icon={<FiCalendar />}
                        label="Due"
                        value={order.due_date || "—"}
                        className="bg-[var(--bg-muted)]"
                        iconClassName="text-[var(--brand-danger)]"
                        valueClassName="text-[var(--brand-danger)]"
                    />
                </div>

                {/* ================================================= */}
                {/* ACTION */}
                {/* ================================================= */}

                {canAdvance && (
                    <Button
                        type="button"
                        size="sm"
                        className="
                            mt-3
                            h-8
                            w-full
                            gap-1.5
                            border-0
                            text-[11px]
                            font-semibold
                            shadow-none
                            transition-all
                        "
                        style={{
                            backgroundColor: stage.bg,
                            color: stage.color,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                                stage.color;
                            e.currentTarget.style.color = "#ffffff";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                                stage.bg;
                            e.currentTarget.style.color = stage.color;
                        }}
                        onClick={() =>
                            handleMoveStage(
                                order.order_id,
                                stage.key
                            )
                        }
                    >
                        Advance Stage

                        <FiArrowRight className="size-3.5 transition-transform group-hover/card:translate-x-0.5" />
                    </Button>
                )}

                {/* TERMINAL STATE */}
                {!canAdvance && isFactory && (
                    <div
                        className="mt-3 flex h-7 items-center justify-center rounded-md text-[10px] font-semibold"
                        style={{
                            color: stage.color,
                            backgroundColor: stage.bg,
                        }}
                    >
                        <FiActivity className="mr-1.5 size-3" />
                        {stage.key === "DISPATCHED"
                            ? "Dispatched"
                            : "Ready for Dispatch"}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/* ========================================================= */
/* INFORMATION TILE */
/* ========================================================= */

function InfoTile({
    icon,
    label,
    value,
    className = "",
    iconClassName = "",
    valueClassName = "",
}) {
    return (
        <div
            className={`min-w-0 rounded-md border border-[var(--border-light)] px-2 py-1.5 ${className}`}
        >
            <div className="flex items-center gap-1.5">
                <span className={`shrink-0 ${iconClassName}`}>
                    {icon}
                </span>

                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {label}
                </span>
            </div>

            <div
                className={`mt-0.5 truncate font-mono text-[10px] font-semibold text-[var(--text-primary)] ${valueClassName}`}
                title={String(value)}
            >
                {value}
            </div>
        </div>
    );
}

/* ========================================================= */
/* HEADER METRIC */
/* ========================================================= */

function PulseMetric({
    icon,
    label,
    value,
    className = "",
}) {
    return (
        <div
            className={`flex min-w-[90px] items-center gap-2 rounded-lg border border-[var(--border-light)] px-3 py-2 ${className}`}
        >
            <div className="text-sm">
                {icon}
            </div>

            <div>
                <div className="text-base font-bold leading-none text-[var(--text-primary)]">
                    {value}
                </div>

                <div className="mt-1 text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {label}
                </div>
            </div>
        </div>
    );
}

/* ========================================================= */
/* EMPTY STAGE */
/* ========================================================= */

function EmptyStage({ stage }) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
            <div
                className="mb-3 flex size-11 items-center justify-center rounded-full"
                style={{
                    backgroundColor: stage.bg,
                    color: stage.color,
                }}
            >
                <FiBox className="size-5" />
            </div>

            <p
                className="text-xs font-semibold"
                style={{
                    color: stage.color,
                }}
            >
                No products here
            </p>

            <p className="mt-1 max-w-[180px] text-[10px] leading-relaxed text-[var(--text-muted)]">
                Products entering this stage will appear here
                automatically.
            </p>
        </div>
    );
}