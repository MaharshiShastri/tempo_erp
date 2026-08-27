import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { Label } from "@/components/ui/label";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Separator } from "@/components/ui/separator";

import {
    CalendarDays,
    RefreshCw,
    Plus,
    Factory,
    Users,
    Filter,
    X,
    Radio,
    Loader2,
    Layers3,
} from "lucide-react";

const STATUS_OPTIONS = [
    { value: "all", label: "All statuses" },
    { value: "PLANNED", label: "Planned" },
    { value: "IN_PROGRESS", label: "In progress" },
    { value: "COMPLETED", label: "Completed" },
    { value: "ON_HOLD", label: "On hold" },
    { value: "CANCELLED", label: "Cancelled" },
];

const STATUS_COLORS = {
    PLANNED: {
        backgroundColor: "#3b82f6",
        borderColor: "#2563eb",
    },

    IN_PROGRESS: {
        backgroundColor: "#f59e0b",
        borderColor: "#d97706",
    },

    COMPLETED: {
        backgroundColor: "#10b981",
        borderColor: "#059669",
    },

    ON_HOLD: {
        backgroundColor: "#f97316",
        borderColor: "#ea580c",
    },

    CANCELLED: {
        backgroundColor: "#ef4444",
        borderColor: "#dc2626",
    },
};

const STATUS_BADGE_STYLES = {
    PLANNED:
        "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",

    IN_PROGRESS:
        "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",

    COMPLETED:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",

    ON_HOLD:
        "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",

    CANCELLED:
        "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
};

function formatStatus(status) {
    return String(status || "")
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function ProductionCalendar({ state }) {
    const {
        calendarRef,
        calendarOptions,
        filters,
        loading,

        updateFilter,
        clearFilters,
        refresh,

        handleDateSelect,
        handleEventDrop,
        handleEventResize,
        handleEventClick,

        handleCreateSchedule,

        stageOptions = [],
        teamOptions = [],
    } = state;

    const renderEventContent = (eventInfo) => {
        const schedule =
            eventInfo.event.extendedProps?.schedule;

        const status = schedule?.status || "PLANNED";

        return (
            <div className="min-w-0 px-1 py-0.5 text-white">
                <div className="truncate text-[11px] font-bold leading-tight">
                    {schedule?.order_acceptance_id ||
                        `Order #${schedule?.order_id ?? ""}`}
                </div>

                <div className="mt-1 flex flex-wrap gap-1">
                    {schedule?.stage_code && (
                        <span className="rounded bg-black/10 px-1.5 py-0.5 text-[9px] font-medium text-white/95">
                            {schedule.stage_code}
                        </span>
                    )}

                    {schedule?.assigned_team && (
                        <span className="rounded bg-black/10 px-1.5 py-0.5 text-[9px] font-medium text-white/95">
                            {schedule.assigned_team}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    const hasActiveFilters = Boolean(
        filters.stageCode ||
            filters.assignedTeam ||
            filters.status
    );

    return (
        <div className="space-y-4">
            {/* HEADER */}

            <Card className="overflow-hidden border-primary/20 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-primary/10 via-background to-blue-500/10">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                                <CalendarDays className="size-5" />
                            </div>

                            <div className="min-w-0">
                                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                                    <Factory className="size-3.5 text-orange-500" />

                                    <span>Manufacturing</span>
                                    <span>/</span>
                                    <span>Production</span>
                                </div>

                                <CardTitle className="text-xl">
                                    Production Planning
                                </CardTitle>

                                <CardDescription className="mt-1 max-w-2xl">
                                    Plan, schedule and monitor
                                    manufacturing operations across
                                    production stages and teams.
                                </CardDescription>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                onClick={refresh}
                                disabled={loading}
                            >
                                <RefreshCw
                                    className={`mr-2 size-4 ${
                                        loading
                                            ? "animate-spin"
                                            : ""
                                    }`}
                                />
                                Refresh
                            </Button>

                            <Button
                                onClick={() =>handleCreateSchedule()}
                                className="shadow-sm"
                            >
                                <Plus className="mr-2 size-4" />
                                Schedule Production
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* FILTER BAR */}

            <Card className="border-border/70 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                        <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-end">
                            <div className="flex items-center gap-2 pb-1 text-sm font-medium text-muted-foreground">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                    <Filter className="size-4" />
                                </div>

                                <span>Filters</span>
                            </div>

                            {/* STAGE */}

                            <div className="grid min-w-[180px] gap-2">
                                <Label className="flex items-center gap-1.5 text-xs">
                                    <Layers3 className="size-3.5 text-blue-500" />
                                    Stage
                                </Label>

                                <Select
                                    value={
                                        filters.stageCode ||
                                        "all"
                                    }
                                    onValueChange={(value) =>
                                        updateFilter(
                                            "stageCode",
                                            value === "all"
                                                ? ""
                                                : value
                                        )
                                    }
                                >
                                    <SelectTrigger className="border-border bg-background text-foreground shadow-sm">
                                        <SelectValue placeholder="All stages" />
                                    </SelectTrigger>

                                    <SelectContent className="border-border bg-popover text-popover-foreground">
                                        <SelectItem value="all">
                                            All stages
                                        </SelectItem>

                                        {stageOptions.map(
                                            (stage) => {
                                                const value =
                                                    stage.value ||
                                                    stage.code;

                                                const label =
                                                    stage.label ||
                                                    stage.name ||
                                                    stage.code;

                                                return (
                                                    <SelectItem
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {label}
                                                    </SelectItem>
                                                );
                                            }
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* TEAM */}

                            <div className="grid min-w-[180px] gap-2">
                                <Label className="flex items-center gap-1.5 text-xs">
                                    <Users className="size-3.5 text-emerald-500" />
                                    Team
                                </Label>

                                <Select
                                    value={
                                        filters.assignedTeam ||
                                        "all"
                                    }
                                    onValueChange={(value) =>
                                        updateFilter(
                                            "assignedTeam",
                                            value === "all"
                                                ? ""
                                                : value
                                        )
                                    }
                                >
                                    <SelectTrigger className="border-border bg-background text-foreground shadow-sm">
                                        <SelectValue placeholder="All teams" />
                                    </SelectTrigger>

                                    <SelectContent className="border-border bg-popover text-popover-foreground">
                                        <SelectItem value="all">
                                            All teams
                                        </SelectItem>

                                        {teamOptions.map(
                                            (team) => {
                                                const value =
                                                    team.value ||
                                                    team.code ||
                                                    team.name;

                                                const label =
                                                    team.label ||
                                                    team.name ||
                                                    team.code;

                                                return (
                                                    <SelectItem
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {label}
                                                    </SelectItem>
                                                );
                                            }
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* STATUS */}

                            <div className="grid min-w-[180px] gap-2">
                                <Label className="flex items-center gap-1.5 text-xs">
                                    <Radio className="size-3.5 text-orange-500" />
                                    Status
                                </Label>

                                <Select
                                    value={
                                        filters.status ||
                                        "all"
                                    }
                                    onValueChange={(value) =>
                                        updateFilter(
                                            "status",
                                            value === "all"
                                                ? ""
                                                : value
                                        )
                                    }
                                >
                                    <SelectTrigger className="border-border bg-background text-foreground shadow-sm">
                                        <SelectValue placeholder="All statuses" />
                                    </SelectTrigger>

                                    <SelectContent className="border-border bg-popover text-popover-foreground">
                                        {STATUS_OPTIONS.map(
                                            (status) => (
                                                <SelectItem
                                                    key={
                                                        status.value
                                                    }
                                                    value={
                                                        status.value
                                                    }
                                                >
                                                    {status.label}
                                                </SelectItem>
                                            )
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="text-muted-foreground hover:bg-red-500/10 hover:text-red-600"
                                >
                                    <X className="mr-1.5 size-4" />
                                    Clear
                                </Button>
                            )}
                        </div>

                        <Separator
                            orientation="vertical"
                            className="hidden h-10 xl:block"
                        />

                        <Badge
                            variant="outline"
                            className={
                                loading
                                    ? "gap-2 border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-amber-600"
                                    : "gap-2 border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-emerald-600"
                            }
                        >
                            {loading ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                            )}

                            {loading
                                ? "Loading schedule"
                                : "Live planning"}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* ACTIVE FILTERS */}

            {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 px-1">
                    <span className="text-xs font-medium text-muted-foreground">
                        Active filters:
                    </span>

                    {filters.stageCode && (
                        <Badge
                            variant="secondary"
                            className="border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        >
                            Stage: {filters.stageCode}
                        </Badge>
                    )}

                    {filters.assignedTeam && (
                        <Badge
                            variant="secondary"
                            className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        >
                            Team: {filters.assignedTeam}
                        </Badge>
                    )}

                    {filters.status && (
                        <Badge
                            variant="secondary"
                            className={
                                STATUS_BADGE_STYLES[
                                    filters.status
                                ]
                            }
                        >
                            {formatStatus(filters.status)}
                        </Badge>
                    )}
                </div>
            )}

            {/* CALENDAR */}

            <Card className="overflow-hidden border-border/70 shadow-sm">
                <CardContent className="relative p-0">
                    <div className="production-calendar-wrapper h-[calc(100vh-420px)] min-h-[500px] p-3 md:p-5">
                        <FullCalendar
                            ref={calendarRef}
                            plugins={[
                                dayGridPlugin,
                                timeGridPlugin,
                                interactionPlugin,
                            ]}
                            {...calendarOptions}
                            eventContent={renderEventContent}
                            select={handleDateSelect}
                            eventDrop={handleEventDrop}
                            eventResize={handleEventResize}
                            eventClick={handleEventClick}
                        />
                    </div>

                    {loading && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
                            <div className="flex items-center gap-3 rounded-xl border bg-background px-5 py-3 shadow-lg">
                                <Loader2 className="size-5 animate-spin text-primary" />

                                <div>
                                    <p className="text-sm font-medium">
                                        Updating schedule
                                    </p>

                                    <p className="text-xs text-muted-foreground">
                                        Loading production data…
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* LEGEND */}

            <Card className="border-border/60">
                <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-3 p-4">
                    <div className="text-sm font-medium">
                        Schedule Status
                    </div>

                    <Separator
                        orientation="vertical"
                        className="hidden h-5 sm:block"
                    />

                    <div className="flex flex-wrap gap-2">
                        <Badge
                            variant="outline"
                            className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        >
                            <span className="mr-2 size-2 rounded-full bg-blue-500" />
                            Planned
                        </Badge>

                        <Badge
                            variant="outline"
                            className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        >
                            <span className="mr-2 size-2 rounded-full bg-amber-500" />
                            In progress
                        </Badge>

                        <Badge
                            variant="outline"
                            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        >
                            <span className="mr-2 size-2 rounded-full bg-emerald-500" />
                            Completed
                        </Badge>

                        <Badge
                            variant="outline"
                            className="border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                        >
                            <span className="mr-2 size-2 rounded-full bg-orange-500" />
                            On hold
                        </Badge>

                        <Badge
                            variant="outline"
                            className="border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                        >
                            <span className="mr-2 size-2 rounded-full bg-red-500/10 text-red-600 dark:text-red-400" />
                            Cancelled
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}