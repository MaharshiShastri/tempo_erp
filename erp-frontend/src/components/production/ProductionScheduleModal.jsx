import { useEffect, useRef, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    CalendarDays,
    Factory,
    Loader2,
    Users,
} from "lucide-react";

/**
 * Convert an ISO datetime returned by the backend into the
 * value expected by <input type="datetime-local" />.
 */
function toDateTimeLocal(value) {
    if (!value) return "";

    try {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        const pad = (number) => String(number).padStart(2, "0");

        return (
            `${date.getFullYear()}-${pad(date.getMonth() + 1)}-` +
            `${pad(date.getDate())}T${pad(date.getHours())}:` +
            `${pad(date.getMinutes())}`
        );
    } catch {
        return "";
    }
}

const SCHEDULE_STATUS_STYLES = {
    PLANNED: {
        bg: "#dbeafe",
        color: "#1d4ed8",
    },
    IN_PROGRESS: {
        bg: "#fef3c7",
        color: "#b45309",
    },
    COMPLETED: {
        bg: "#dcfce7",
        color: "#15803d",
    },
    CANCELLED: {
        bg: "#fee2e2",
        color: "#b91c1c",
    },
};

/**
 * Convert datetime-local back to ISO for the API.
 */
function toISOStringOrNull(value) {
    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toISOString();
}

export default function ProductionScheduleModal({ state }) {
    const {
        STAGES, 
        isProductionScheduleModalOpen,
        productionScheduleForm,
        setProductionScheduleForm,
        isEditingProductionSchedule,
        closeProductionScheduleModal,
        saveProductionSchedule,
        stageOptions = [],
        teamOptions = [],

        handleProductionScheduleOaInputChange,
        handleProductionScheduleOaSelect,

        oaSuggestions = [],
        showOaSuggestions,
        setShowOaSuggestions,
        oaInputRef,
        oaSearching = false,
    } = state;

    const [saving, setSaving] = useState(false);
    const [validationError, setValidationError] = useState("");

    const form = productionScheduleForm || {};

    /**
     * Reset local modal state whenever the modal opens/closes.
     */
    useEffect(() => {
        if (isProductionScheduleModalOpen) {
            setSaving(false);
            setValidationError("");
        }
    }, [isProductionScheduleModalOpen]);

    const updateField = (field, value) => {
        setProductionScheduleForm((current) => ({
            ...(current || {}),
            [field]: value,
        }));

        if (validationError) {
            setValidationError("");
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!productionScheduleForm) {
            return;
        }

        if (!productionScheduleForm.order_acceptance_id) {
            setValidationError("Order ID is required.");
            return;
        }

        if (!productionScheduleForm.stage_code) {
            setValidationError("Production stage is required.");
            return;
        }

        if (!productionScheduleForm.planned_start) {
            setValidationError("Planned start is required.");
            return;
        }

        if (!productionScheduleForm.planned_end) {
            setValidationError("Planned end is required.");
            return;
        }

        const plannedStart = new Date(
            productionScheduleForm.planned_start
        );

        const plannedEnd = new Date(
            productionScheduleForm.planned_end
        );

        if (
            !Number.isNaN(plannedStart.getTime()) &&
            !Number.isNaN(plannedEnd.getTime()) &&
            plannedEnd <= plannedStart
        ) {
            setValidationError(
                "Planned end must be after planned start."
            );
            return;
        }

        try {
            setSaving(true);
            setValidationError("");

            await saveProductionSchedule({
                ...productionScheduleForm,

                planned_start: toISOStringOrNull(
                    productionScheduleForm.planned_start
                ),

                planned_end: toISOStringOrNull(
                    productionScheduleForm.planned_end
                ),

                actual_start: toISOStringOrNull(
                    productionScheduleForm.actual_start
                ),

                actual_end: toISOStringOrNull(
                    productionScheduleForm.actual_end
                ),

                priority:
                    Number(productionScheduleForm.priority) || 0,
            });
        } catch {
            // saveProductionSchedule already handles the
            // application's error modal.
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog
            open={isProductionScheduleModalOpen}
            onOpenChange={(open) => {
                if (!open && !saving) {
                    closeProductionScheduleModal();
                }
            }}
        >
            <DialogContent
                className="
                    max-h-[90vh]
                    overflow-y-auto
                    sm:max-w-[760px]
                "
            >
                <DialogHeader>
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <CalendarDays className="size-5" />
                        </div>

                        <div>
                            <DialogTitle>
                                {isEditingProductionSchedule
                                    ? "Edit Production Schedule"
                                    : "Schedule Production"}
                            </DialogTitle>

                            <DialogDescription>
                                {isEditingProductionSchedule
                                    ? "Update the production schedule, timing, team and status."
                                    : "Create a new production schedule for a manufacturing operation."}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 pt-2"
                >
                    {/* Order information */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <Factory className="size-4 text-orange-500" />

                            <h3 className="text-sm font-semibold">
                                Production Details
                            </h3>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div
                                ref={oaInputRef}
                                className="relative grid gap-2"
                            >
                                <Label htmlFor="schedule-order-id">
                                    Order Acceptance ID
                                    <span className="ml-1 text-destructive">*</span>
                                </Label>

                                <Input
                                    id="schedule-order-id"
                                    value={form.order_acceptance_id ?? ""}
                                    onChange={handleProductionScheduleOaInputChange}
                                    onFocus={() => {
                                        if (oaSuggestions.length > 0) {
                                            setShowOaSuggestions(true);
                                        }
                                    }}
                                    placeholder="Start typing an OA ID..."
                                    disabled={saving}
                                    autoComplete="off"
                                />

                                {showOaSuggestions && oaSuggestions.length > 0 && (
                                    <div
                                        className="
                                            absolute
                                            left-0
                                            right-0
                                            top-full
                                            z-50
                                            mt-1
                                            overflow-hidden
                                            rounded-md
                                            border
                                            border-zinc-700
                                            bg-zinc-800
                                            text-zinc-100
                                            shadow-xl
                                        "
                                    >
                                        <div className="border-b border-zinc-700 bg-zinc-900/60 px-3 py-2 text-xs font-medium text-zinc-400">
                                            Order Acceptance recommendations
                                        </div>

                                        <div className="max-h-56 overflow-y-auto">
                                            {oaSuggestions.map((oa, index) => (
                                                <button
                                                    key={`${oa.order_id}-${index}`}
                                                    type="button"
                                                    className="
                                                        block
                                                        w-full
                                                        border-b
                                                        border-zinc-700/70
                                                        px-3
                                                        py-2.5
                                                        text-left
                                                        text-sm
                                                        text-zinc-100
                                                        transition-colors
                                                        last:border-b-0
                                                        hover:bg-zinc-700
                                                        focus:bg-zinc-700
                                                        focus:outline-none
                                                    "
                                                    onClick={() =>
                                                        handleProductionScheduleOaSelect(
                                                            oa.order_acceptance_id
                                                        )
                                                    }
                                                >
                                                    <div className="font-medium">
                                                        {oa.order_acceptance_id}
                                                    </div>

                                                    {oa.billing_name && (
                                                        <div className="mt-0.5 text-xs text-zinc-400">
                                                            {oa.billing_name}
                                                        </div>
                                                    )}

                                                    {oa.order_acceptance_date && (
                                                        <div className="mt-0.5 text-xs text-zinc-500">
                                                            {oa.order_acceptance_date}
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {oaSearching && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Loader2 className="size-3 animate-spin" />
                                        Searching order acceptances...
                                    </div>
                                )}

                                {form.order_acceptance_id && (
                                    <p className="text-xs text-muted-foreground">
                                        Order ID:{" "}
                                        <span className="font-medium text-foreground">
                                            {form.order_acceptance_id}
                                        </span>
                                    </p>
                                )}
                            </div>
                            
                            <div className="grid gap-2">
                                <Label htmlFor="schedule-stage">
                                    Production Stage
                                    <span className="ml-1 text-destructive">*</span>
                                </Label>

                                <Select
                                    value={form.stage_code || undefined}
                                    onValueChange={(value) =>
                                        updateField("stage_code", value)
                                    }
                                    disabled={saving}
                                >
                                    <SelectTrigger id="schedule-stage">
                                        <SelectValue placeholder="Select stage" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {STAGES.map((stage) => (
                                            <SelectItem
                                                key={stage.key}
                                                value={stage.key}
                                                className="cursor-pointer"
                                                style={{
                                                    backgroundColor: stage.bg,
                                                    color: stage.color,
                                                }}
                                            >
                                                {stage.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </section>

                    {/* Schedule timing */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <CalendarDays className="size-4 text-blue-500" />

                            <h3 className="text-sm font-semibold">
                                Schedule Timing
                            </h3>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="planned-start">
                                    Planned Start
                                    <span className="ml-1 text-destructive">
                                        *
                                    </span>
                                </Label>

                                <Input
                                    id="planned-start"
                                    type="datetime-local"
                                    value={toDateTimeLocal(
                                        form.planned_start
                                    )}
                                    onChange={(event) =>
                                        updateField(
                                            "planned_start",
                                            event.target.value
                                        )
                                    }
                                    disabled={saving}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="planned-end">
                                    Planned End
                                    <span className="ml-1 text-destructive">
                                        *
                                    </span>
                                </Label>

                                <Input
                                    id="planned-end"
                                    type="datetime-local"
                                    value={toDateTimeLocal(
                                        form.planned_end
                                    )}
                                    onChange={(event) =>
                                        updateField(
                                            "planned_end",
                                            event.target.value
                                        )
                                    }
                                    disabled={saving}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Actual timing */}
                    {isEditingProductionSchedule && (
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <CalendarDays className="size-4 text-emerald-500" />

                                <h3 className="text-sm font-semibold">
                                    Actual Timing
                                </h3>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="actual-start">
                                        Actual Start
                                    </Label>

                                    <Input
                                        id="actual-start"
                                        type="datetime-local"
                                        value={toDateTimeLocal(
                                            form.actual_start
                                        )}
                                        onChange={(event) =>
                                            updateField(
                                                "actual_start",
                                                event.target.value
                                            )
                                        }
                                        disabled={saving}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="actual-end">
                                        Actual End
                                    </Label>

                                    <Input
                                        id="actual-end"
                                        type="datetime-local"
                                        value={toDateTimeLocal(
                                            form.actual_end
                                        )}
                                        onChange={(event) =>
                                            updateField(
                                                "actual_end",
                                                event.target.value
                                            )
                                        }
                                        disabled={saving}
                                    />
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Assignment and status */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <Users className="size-4 text-emerald-500" />

                            <h3 className="text-sm font-semibold">
                                Assignment & Status
                            </h3>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="grid gap-2">
                                <Label htmlFor="assigned-team">
                                    Assigned Team
                                </Label>

                                <Select
                                    value={
                                        form.assigned_team ||
                                        undefined
                                    }
                                    onValueChange={(value) =>
                                        updateField(
                                            "assigned_team",
                                            value
                                        )
                                    }
                                    disabled={saving}
                                >
                                    <SelectTrigger id="assigned-team">
                                        <SelectValue placeholder="Select team" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {teamOptions.map((team) => {
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
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="schedule-priority">
                                    Priority
                                </Label>

                                <Input
                                    id="schedule-priority"
                                    type="number"
                                    min="0"
                                    value={form.priority ?? 0}
                                    onChange={(event) =>
                                        updateField(
                                            "priority",
                                            event.target.value
                                        )
                                    }
                                    disabled={saving}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="schedule-status">
                                    Status
                                </Label>

                                <Select
                                    value={form.status || "PLANNED"}
                                    onValueChange={(value) =>
                                        updateField("status", value)
                                    }
                                    disabled={saving}
                                >
                                    <SelectTrigger
                                        id="schedule-status"
                                        style={{
                                            backgroundColor:
                                                SCHEDULE_STATUS_STYLES[
                                                    form.status || "PLANNED"
                                                ]?.bg,
                                            color:
                                                SCHEDULE_STATUS_STYLES[
                                                    form.status || "PLANNED"
                                                ]?.color,
                                        }}
                                    >
                                        <SelectValue />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {Object.entries(SCHEDULE_STATUS_STYLES).map(
                                            ([status, style]) => (
                                                <SelectItem
                                                    key={status}
                                                    value={status}
                                                    className="cursor-pointer"
                                                    style={{
                                                        backgroundColor: style.bg,
                                                        color: style.color,
                                                    }}
                                                >
                                                    {status
                                                        .replaceAll("_", " ")
                                                        .replace(
                                                            /\b\w/g,
                                                            (char) => char.toUpperCase()
                                                        )}
                                                </SelectItem>
                                            )
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </section>

                    {/* Edit-only information */}
                    {isEditingProductionSchedule &&
                        (form.order_acceptance_id ||
                            form.client_name) && (
                            <div className="rounded-lg border bg-muted/30 p-3">
                                <div className="grid gap-3 text-sm md:grid-cols-2">
                                    {form.order_acceptance_id && (
                                        <div>
                                            <p className="text-xs text-muted-foreground">
                                                Order Acceptance
                                            </p>

                                            <p className="font-medium">
                                                {
                                                    form.order_acceptance_id
                                                }
                                            </p>
                                        </div>
                                    )}

                                    {form.client_name && (
                                        <div>
                                            <p className="text-xs text-muted-foreground">
                                                Client
                                            </p>

                                            <p className="font-medium">
                                                {form.client_name}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    {/* Validation */}
                    {validationError && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {validationError}
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={closeProductionScheduleModal}
                            disabled={saving}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            disabled={
                                saving ||
                                !productionScheduleForm
                            }
                        >
                            {saving && (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            )}

                            {isEditingProductionSchedule
                                ? "Update Schedule"
                                : "Create Schedule"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}