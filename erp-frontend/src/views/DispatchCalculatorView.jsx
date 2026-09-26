import { FiExternalLink, FiPrinter } from "react-icons/fi";
import { useRef, useEffect, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import IndianCurrencyInput from "../components/shared/IndianCurrencyInput";
import DispatchReport from "../components/DispatchReport";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export default function DispatchCalculatorView({
    state = {},
    theme = "light",
    setTheme = () => {},
}) {
    const reportRef = useRef();

    const [isEvaluating, setIsEvaluating] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(
        "AI is finding the zone rate"
    );

    const handleEvaluate = async (event) => {
        event?.preventDefault();

        setIsEvaluating(true);
        setLoadingMessage("AI is finding the zone rate");

        state?.setModalAlert?.({
            isOpen: true,
            title: "Evaluating Dispatch Options",
            message: "AI is finding the zone rate",
            isError: false,
            type: "loading",
        });

        try {
            await state?.handleEvaluate?.(event);
        } finally {
            setIsEvaluating(false);

            state?.setModalAlert?.({
                isOpen: false,
                title: "",
                message: "",
                isError: false,
                type: null,
            });
        }
    };

    useEffect(() => {
        if (!isEvaluating) return;

        const messages = [
            "AI is finding the zone rate",
            "Performing calculation for each transporter",
        ];

        let index = 0;

        const interval = setInterval(() => {
            index = (index + 1) % messages.length;
            setLoadingMessage(messages[index]);
        }, 1800);

        return () => clearInterval(interval);
    }, [isEvaluating]);

    const generatePDF = async () => {
        const originalTheme =
            theme || localStorage.getItem("erp-theme") || "light";

        const wasDark = originalTheme === "dark";

        try {
            if (wasDark) {
                setTheme("light");
                localStorage.setItem("erp-theme", "light");

                await new Promise((resolve) =>
                    setTimeout(resolve, 150)
                );
            }

            if (!reportRef.current) {
                throw new Error("Dispatch report is not available.");
            }

            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: false,
            });

            const img = canvas.toDataURL("image/png");

            const pdf = new jsPDF("p", "mm", "a4");

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const imageRatio = canvas.width / canvas.height;

            let renderWidth = pdfWidth;
            let renderHeight = renderWidth / imageRatio;

            if (renderHeight > pdfHeight) {
                renderHeight = pdfHeight;
                renderWidth = renderHeight * imageRatio;
            }

            const x = (pdfWidth - renderWidth) / 2;
            const y = (pdfHeight - renderHeight) / 2;

            pdf.addImage(
                img,
                "PNG",
                x,
                y,
                renderWidth,
                renderHeight
            );

            pdf.save(`Dispatch_Report_${Date.now()}.pdf`);
        } catch (error) {
            console.error(error);

            state?.showErrorModal(
                "Error in printing!",
                "Unable to print, please check console or contact"
            );
        } finally {
            if (wasDark) {
                setTheme("dark");
                localStorage.setItem("erp-theme", "dark");
            }
        }
    };

    const isHubLoading = state?.dim?.loading_type === "hub";
    const isDoorDelivery = state?.dim?.delivery_type === "door";

    return (
        <div className="space-y-6 bg-[var(--bg-main)] text-[var(--text-primary)]">
            {/* ============================================================
                HEADER
            ============================================================ */}

            <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl text-[var(--text-primary)]">
                        🚚 Freight Logistics Evaluator
                    </CardTitle>

                    <CardDescription className="text-[var(--text-muted)]">
                        Contract Rate Comparison
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* ============================================================
                INPUT FORM
            ============================================================ */}

            <form onSubmit={handleEvaluate} className="space-y-6">
                {/* ==========================================================
                    SHIPMENT CONTENTS
                ========================================================== */}

                <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]">
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-lg text-[var(--text-primary)]">
                                Shipment Contents
                            </CardTitle>

                            <CardDescription className="text-[var(--text-muted)]">
                                Add the packages included in this shipment.
                            </CardDescription>
                        </div>

                        <div className="flex w-fit overflow-hidden rounded-lg border border-[var(--border-light)] bg-[var(--bg-muted)] p-1">
                            <button
                                type="button"
                                onClick={() => state?.setUnit("cm")}
                                className={[
                                    "rounded-md px-3 py-1.5 text-xs font-medium transition",
                                    state?.unit === "cm"
                                        ? "bg-[var(--brand-accent)] text-white shadow-[var(--shadow-sm)]"
                                        : "text-[var(--text-muted)] hover:bg-[var(--combobox-hover)] hover:text-[var(--text-primary)]",
                                ].join(" ")}
                            >
                                Centimeters
                            </button>

                            <button
                                type="button"
                                onClick={() => state?.setUnit("in")}
                                className={[
                                    "rounded-md px-3 py-1.5 text-xs font-medium transition",
                                    state?.unit === "in"
                                        ? "bg-[var(--brand-accent)] text-white shadow-[var(--shadow-sm)]"
                                        : "text-[var(--text-muted)] hover:bg-[var(--combobox-hover)] hover:text-[var(--text-primary)]",
                                ].join(" ")}
                            >
                                Inches
                            </button>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {state?.products?.map((product, idx) => (
                            <Card
                                key={idx}
                                className="border-[var(--border-light)] bg-[var(--bg-main)] shadow-none"
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <Badge
                                            variant="outline"
                                            className="border-[var(--border-light)] bg-[var(--bg-muted)] text-[var(--brand-accent)]"
                                        >
                                            Product Packaging {idx + 1}
                                        </Badge>

                                        {idx > 0 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-[var(--brand-danger)] hover:bg-[var(--warning-row)] hover:text-[var(--brand-danger)]"
                                                onClick={() =>
                                                    state?.removeProduct(idx)
                                                }
                                            >
                                                ✕ Remove
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>

                                <CardContent>
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <FormField
                                            label={`Width (${state?.unit})`}
                                        >
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                required
                                                value={product.width}
                                                onChange={(e) =>
                                                    state?.updateProduct(
                                                        idx,
                                                        "width",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </FormField>

                                        <FormField
                                            label={`Depth (${state?.unit})`}
                                        >
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                required
                                                value={product.depth}
                                                onChange={(e) =>
                                                    state?.updateProduct(
                                                        idx,
                                                        "depth",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </FormField>

                                        <FormField
                                            label={`Height (${state?.unit})`}
                                        >
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                required
                                                value={product.height}
                                                onChange={(e) =>
                                                    state?.updateProduct(
                                                        idx,
                                                        "height",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </FormField>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {state?.products?.length < 5 && (
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full border-dashed border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)] hover:text-[var(--text-primary)]"
                                onClick={state?.addProduct}
                            >
                                + Add Another Package{" "}
                                <span className="ml-1 text-[var(--text-muted)]">
                                    ({state?.products?.length}/5)
                                </span>
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* ==========================================================
                    SHIPMENT DETAILS
                ========================================================== */}

                <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]">
                    <CardHeader>
                        <CardTitle className="text-lg text-[var(--text-primary)]">
                            Shipment Details
                        </CardTitle>

                        <CardDescription className="text-[var(--text-muted)]">
                            Enter the commercial and destination information.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            <FormField label="Total Invoice Value (₹)">
                                <IndianCurrencyInput
                                    className="w-full"
                                    value={
                                        state?.dim?.invoice_value === 0
                                            ? ""
                                            : state?.dim?.invoice_value
                                    }
                                    onChange={(raw) =>
                                        state?.setDim({
                                            ...state?.dim,
                                            invoice_value: raw,
                                        })
                                    }
                                />
                            </FormField>

                            <FormField
                                label={
                                    <>
                                        Destination City{" "}
                                        <span className="text-[var(--brand-danger)]">
                                            (CITY ONLY!)
                                        </span>
                                    </>
                                }
                            >
                                <Input
                                    type="text"
                                    required
                                    value={
                                        state?.dim?.destination_city
                                    }
                                    onChange={(e) =>
                                        state?.setDim({
                                            ...state?.dim,
                                            destination_city:
                                                e.target.value,
                                        })
                                    }
                                />
                            </FormField>

                            <FormField label="Weight of the Material (KG)">
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    value={state?.dim?.weight}
                                    onChange={(e) =>
                                        state?.setDim({
                                            ...state?.dim,
                                            weight: +e.target.value,
                                        })
                                    }
                                />
                            </FormField>

                            <FormField label="Fuel Price(₹/L)">
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    value={
                                        state?.dim?.fuel_price ?? 0
                                    }
                                    onChange={(e) =>
                                        state?.setDim({
                                            ...state?.dim,
                                            fuel_price: Number(
                                                e.target.value
                                            ),
                                        })
                                    }
                                />
                            </FormField>
                        </div>
                    </CardContent>
                </Card>

                {/* ==========================================================
                    OPERATIONS
                ========================================================== */}

                <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]">
                    <CardHeader>
                        <CardTitle className="text-lg text-[var(--text-primary)]">
                            Operations & Loading
                        </CardTitle>

                        <CardDescription className="text-[var(--text-muted)]">
                            Configure loading and final delivery behavior.
                            <span className="ml-1 font-medium text-[var(--brand-accent)]">
                                Ask from Mr. Sachin
                            </span>
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="grid gap-4 lg:grid-cols-3">
                            {/* LOADING METHOD */}

                            <SelectionCard
                                title="Loading Method"
                                description="Choose where the shipment is loaded."
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <p className="font-medium text-[var(--text-primary)]">
                                            {isHubLoading
                                                ? "🏢 Hub"
                                                : "📍 Local"}
                                        </p>

                                        <p className="text-xs text-[var(--text-muted)]">
                                            {isHubLoading
                                                ? "Variable hub loading charge"
                                                : "Fixed local loading charge"}
                                        </p>
                                    </div>

                                    <Switch
                                        checked={isHubLoading}
                                        onCheckedChange={(checked) =>
                                            state?.setDim({
                                                ...state?.dim,
                                                loading_type: checked
                                                    ? "hub"
                                                    : "local",
                                            })
                                        }
                                        aria-label="Toggle loading method"
                                        className="
                                            h-7 w-12
                                            border-2
                                            border-[var(--brand-success)]
                                            bg-[var(--brand-success)]
                                            shadow-sm
                                            transition-colors
                                            data-[state=checked]:border-[var(--brand-accent)]
                                            data-[state=checked]:bg-[var(--brand-accent)]
                                            [&>span]:h-5
                                            [&>span]:w-5
                                            [&>span]:bg-white
                                            [&>span]:shadow-md
                                            data-[state=checked]:[&>span]:translate-x-5
                                        "
                                    />
                                </div>

                                <Badge
                                    variant="outline"
                                    className={
                                        isHubLoading
                                            ? "border-[var(--brand-accent)]/40 bg-[var(--bg-muted)] text-[var(--brand-accent)] hover:bg-[var(--bg-muted)]"
                                            : "border-[var(--brand-success)]/40 bg-[var(--bg-muted)] text-[var(--brand-success)] hover:bg-[var(--bg-muted)]"
                                    }
                                >
                                    {isHubLoading
                                        ? "🏢 Hub Selected"
                                        : "📍 Local Selected"}
                                </Badge>

                                {isHubLoading && (
                                    <div className="space-y-2 border-t border-[var(--border-light)] pt-4">
                                        <Label
                                            htmlFor="hub-loading"
                                            className="text-xs text-[var(--brand-accent)]"
                                        >
                                            Enter Hub Amount (₹)
                                        </Label>

                                        <Input
                                            id="hub-loading"
                                            type="number"
                                            min="0"
                                            required
                                            value={
                                                state?.dim
                                                    ?.hub_loading_input
                                            }
                                            onChange={(e) =>
                                                state?.setDim({
                                                    ...state?.dim,
                                                    hub_loading_input:
                                                        +e.target.value,
                                                })
                                            }
                                        />

                                        <p className="text-[11px] text-[var(--text-muted)]">
                                            * Will be capped by partner max
                                            threshold if defined.
                                        </p>
                                    </div>
                                )}
                            </SelectionCard>

                            {/* DELIVERY TYPE */}

                            <SelectionCard
                                title="Final Delivery"
                                description="Choose how the shipment reaches its destination."
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <p className="font-medium text-[var(--text-primary)]">
                                            {isDoorDelivery
                                                ? "🚪 Door"
                                                : "🏭 Godown Hub"}
                                        </p>

                                        <p className="text-xs text-[var(--text-muted)]">
                                            {isDoorDelivery
                                                ? "Distance mapping required"
                                                : "No ODA charges"}
                                        </p>
                                    </div>

                                    <Switch
                                        checked={isDoorDelivery}
                                        onCheckedChange={(checked) =>
                                            state?.setDim({
                                                ...state?.dim,
                                                delivery_type: checked
                                                    ? "door"
                                                    : "godown",
                                            })
                                        }
                                        aria-label="Toggle delivery type"
                                        className="
                                            h-7 w-12
                                            border-2
                                            border-[var(--brand-success)]
                                            bg-[var(--brand-success)]
                                            shadow-sm
                                            transition-colors
                                            data-[state=checked]:border-[var(--brand-accent)]
                                            data-[state=checked]:bg-[var(--brand-accent)]
                                            [&>span]:h-5
                                            [&>span]:w-5
                                            [&>span]:bg-white
                                            [&>span]:shadow-md
                                            data-[state=checked]:[&>span]:translate-x-5
                                        "
                                    />
                                </div>

                                <Badge
                                    variant="outline"
                                    className={
                                        isDoorDelivery
                                            ? "border-[var(--brand-accent)]/40 bg-[var(--bg-muted)] text-[var(--brand-accent)] hover:bg-[var(--bg-muted)]"
                                            : "border-[var(--border-light)] bg-[var(--bg-muted)] text-[var(--text-muted)] hover:bg-[var(--bg-muted)]"
                                    }
                                >
                                    {isDoorDelivery
                                        ? "🚪 Door Delivery Selected"
                                        : "🏭 Godown Hub Selected"}
                                </Badge>

                                <div
                                    className={
                                        isDoorDelivery
                                            ? "rounded-md border border-[var(--brand-accent)]/30 bg-[var(--bg-muted)] p-3 text-xs text-[var(--brand-accent)]"
                                            : "rounded-md border border-[var(--border-light)] bg-[var(--bg-muted)] p-3 text-xs text-[var(--text-muted)]"
                                    }
                                >
                                    {isDoorDelivery
                                        ? "Requires manual distance mapping below."
                                        : "Distance mapping disabled. No ODA charges will apply."}
                                </div>
                            </SelectionCard>

                            {/* HAMALI */}

                            <SelectionCard
                                title="Extra Hamali"
                                description="Optional additional handling adjustment."
                                className="border-dashed"
                            >
                                <div className="space-y-4">
                                    <FormField label="Detail">
                                        <Input
                                            placeholder="e.g. Unloading"
                                            value={
                                                state?.dim?.hamali_detail
                                            }
                                            onChange={(e) =>
                                                state?.setDim({
                                                    ...state?.dim,
                                                    hamali_detail:
                                                        e.target.value,
                                                })
                                            }
                                        />
                                    </FormField>

                                    <FormField label="Cost (₹)">
                                        <Input
                                            type="number"
                                            min="0"
                                            value={
                                                state?.dim?.hamali_cost
                                            }
                                            onChange={(e) =>
                                                state?.setDim({
                                                    ...state?.dim,
                                                    hamali_cost:
                                                        +e.target.value,
                                                })
                                            }
                                        />
                                    </FormField>
                                </div>
                            </SelectionCard>
                        </div>

                        {/* DISTANCE MAPPING */}

                        {isDoorDelivery && (
                            <>
                                <Separator className="bg-[var(--border-light)]" />

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-semibold text-[var(--text-primary)]">
                                            Transporter Distance Mapping
                                        </h3>

                                        <p className="text-sm text-[var(--text-muted)]">
                                            Required for door delivery.
                                        </p>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                        {state?.partners
                                            ?.filter(
                                                (partner) =>
                                                    partner?.partner_link
                                            )
                                            .map((partner) => (
                                                <Card
                                                    key={partner.id}
                                                    className="border-[var(--border-light)] bg-[var(--bg-main)] shadow-none"
                                                >
                                                    <CardHeader className="pb-3">
                                                        <CardTitle className="text-base text-[var(--text-primary)]">
                                                            {partner.name}
                                                        </CardTitle>

                                                        {partner.partner_link && (
                                                            <CardDescription>
                                                                <a
                                                                    href={
                                                                        partner.partner_link
                                                                    }
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 text-[var(--brand-accent)] hover:underline"
                                                                >
                                                                    Find distance
                                                                    calculator
                                                                    <FiExternalLink
                                                                        size={
                                                                            13
                                                                        }
                                                                    />
                                                                </a>
                                                            </CardDescription>
                                                        )}
                                                    </CardHeader>

                                                    <CardContent>
                                                        <FormField label="Distance from Hub (KM)">
                                                            <Input
                                                                type="number"
                                                                min={1}
                                                                value={
                                                                    state
                                                                        ?.partnerDistances?.[
                                                                        partner
                                                                            .id
                                                                    ] || 0
                                                                }
                                                                onChange={(e) =>
                                                                    state?.setPartnerDistances(
                                                                        {
                                                                            ...state.partnerDistances,
                                                                            [partner.id]:
                                                                                Number(
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                ),
                                                                        }
                                                                    )
                                                                }
                                                            />
                                                        </FormField>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                    </div>
                                </div>
                            </>
                        )}

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full bg-[var(--brand-accent)] text-white hover:bg-[var(--brand-accent)] hover:opacity-90 sm:w-auto"
                        >
                            🚚 Evaluate Dispatch Options
                        </Button>
                    </CardContent>
                </Card>
            </form>

            {/* ==============================================================
                RESULTS
            ============================================================== */}

            {state?.resultsData?.options?.length > 0 && (
                <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]">
                    <CardHeader>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <CardTitle className="text-[var(--text-primary)]">
                                    Dispatch Options
                                </CardTitle>

                                <CardDescription className="text-[var(--text-muted)]">
                                    {state.resultsData.options.length}{" "}
                                    transporter option
                                    {state.resultsData.options.length === 1
                                        ? ""
                                        : "s"}{" "}
                                    evaluated.
                                </CardDescription>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={generatePDF}
                                className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)] hover:text-[var(--text-primary)]"
                            >
                                <FiPrinter className="mr-2" />
                                Download Dispatch Report
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <div className="mb-4">
                            <Badge
                                variant="secondary"
                                className="border border-[var(--border-light)] bg-[var(--bg-muted)] text-[var(--text-muted)]"
                            >
                                Total Options:{" "}
                                {state.resultsData.options.length}
                            </Badge>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {state.resultsData.options.map((opt, idx) => {
                                const isBest =
                                    state.selectedTransport
                                        ?.partner_name ===
                                    opt.partner_name;

                                return (
                                    <Card
                                        key={idx}
                                        className={
                                            isBest
                                                ? "border-2 border-[var(--brand-success)] bg-[var(--bg-main)] shadow-[var(--shadow-sm)]"
                                                : "border-[var(--border-light)] bg-[var(--bg-main)] shadow-none"
                                        }
                                    >
                                        <CardHeader>
                                            <div className="flex items-start justify-between gap-2">
                                                <CardTitle className="text-base text-[var(--text-primary)]">
                                                    {opt.partner_name}
                                                </CardTitle>

                                                {isBest && (
                                                    <Badge className="shrink-0 bg-[var(--brand-success)] text-white hover:bg-[var(--brand-success)]">
                                                        🟢 Cheapest
                                                    </Badge>
                                                )}
                                            </div>

                                            <CardDescription className="text-[var(--text-muted)]">
                                                Partners Evaluation
                                            </CardDescription>

                                            <div className="text-xl font-bold text-[var(--brand-accent)]">
                                                ₹{opt.dispatch_cost_gst}
                                            </div>
                                        </CardHeader>

                                        <CardContent className="space-y-4">
                                            <details>
                                                <summary className="cursor-pointer text-sm font-medium text-[var(--text-primary)]">
                                                    Cost Breakdown
                                                </summary>

                                                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                                    <span className="text-[var(--text-muted)]">
                                                        Destination Zone
                                                    </span>
                                                    <strong className="text-right text-[var(--text-primary)]">
                                                        {
                                                            opt.destination_zone
                                                        }
                                                    </strong>

                                                    <span className="text-[var(--text-muted)]">
                                                        State
                                                    </span>
                                                    <strong className="text-right text-[var(--text-primary)]">
                                                        {opt.state}
                                                    </strong>

                                                    <span className="text-[var(--text-muted)]">
                                                        Chargeable Weight
                                                    </span>
                                                    <strong className="text-right text-[var(--text-primary)]">
                                                        {
                                                            opt.chargeable_weight
                                                        }{" "}
                                                        kg
                                                    </strong>

                                                    <span className="text-[var(--text-muted)]">
                                                        Basic Freight
                                                    </span>
                                                    <strong className="text-right text-[var(--text-primary)]">
                                                        ₹{opt.basic_freight}
                                                    </strong>

                                                    <span className="text-[var(--text-muted)]">
                                                        Loading Charge
                                                    </span>
                                                    <strong className="text-right text-[var(--text-primary)]">
                                                        ₹{opt.loading_charge}
                                                    </strong>

                                                    <span className="text-[var(--text-muted)]">
                                                        Fuel Charge
                                                    </span>
                                                    <strong className="text-right text-[var(--text-primary)]">
                                                        ₹{opt.fuel_charge}
                                                    </strong>

                                                    <span className="text-[var(--text-muted)]">
                                                        Documentation Charge
                                                    </span>
                                                    <strong className="text-right text-[var(--text-primary)]">
                                                        ₹
                                                        {
                                                            opt.documentation_charge
                                                        }
                                                    </strong>

                                                    <span className="text-[var(--text-muted)]">
                                                        FOV Charge
                                                    </span>
                                                    <strong className="text-right text-[var(--text-primary)]">
                                                        ₹{opt.fov_charge}
                                                    </strong>

                                                    <span className="text-[var(--text-muted)]">
                                                        ODA Charge
                                                    </span>
                                                    <strong className="text-right text-[var(--text-primary)]">
                                                        ₹{opt.oda_charge}
                                                    </strong>

                                                    {opt.hamali_cost > 0 && (
                                                        <>
                                                            <span className="text-[var(--brand-accent)]">
                                                                {opt.hamali_detail ||
                                                                    "Hamali Charges"}
                                                            </span>

                                                            <strong className="text-right text-[var(--brand-accent)]">
                                                                ₹
                                                                {
                                                                    opt.hamali_cost
                                                                }
                                                            </strong>
                                                        </>
                                                    )}

                                                    <Separator className="col-span-2 my-2 bg-[var(--border-light)]" />

                                                    <span className="font-medium text-[var(--text-primary)]">
                                                        Charges before Taxes
                                                    </span>

                                                    <strong className="text-right text-[var(--text-primary)]">
                                                        ₹{opt.subtotal}
                                                    </strong>

                                                    <span className="font-semibold text-[var(--text-primary)]">
                                                        Total Cost after Taxes
                                                    </span>

                                                    <strong className="text-right text-lg text-[var(--brand-accent)]">
                                                        ₹
                                                        {
                                                            opt.dispatch_cost_gst
                                                        }
                                                    </strong>
                                                </div>
                                            </details>

                                            <Button
                                                type="button"
                                                className={
                                                    isBest
                                                        ? "w-full bg-[var(--brand-success)] text-white hover:bg-[var(--brand-success)] hover:opacity-90"
                                                        : "w-full bg-[var(--bg-muted)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)]"
                                                }
                                                onClick={() =>
                                                    state?.confirmTransport(
                                                        opt
                                                    )
                                                }
                                            >
                                                Select
                                            </Button>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ==============================================================
                CONFIRMED TRANSPORT MODAL
            ============================================================== */}

            {state?.selectedTransport &&
                state?.isTransportModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <Card className="w-full max-w-md border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-[var(--text-primary)]">
                                    Confirmed Transport
                                </CardTitle>

                                <CardDescription className="text-[var(--text-muted)]">
                                    Selected transporter
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-[var(--text-muted)]">
                                        Transporter
                                    </p>

                                    <p className="font-semibold text-[var(--text-primary)]">
                                        {
                                            state.selectedTransport
                                                ?.partner_name
                                        }
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-[var(--text-muted)]">
                                        Final Cost
                                    </p>

                                    <p className="text-2xl font-bold text-[var(--brand-accent)]">
                                        ₹
                                        {
                                            state.selectedTransport
                                                ?.dispatch_cost_gst
                                        }
                                    </p>
                                </div>

                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <Button
                                        type="button"
                                        className="flex-1 bg-[var(--brand-accent)] text-white hover:bg-[var(--brand-accent)] hover:opacity-90"
                                        onClick={() =>
                                            state?.confirmTransport(
                                                state?.selectedTransport
                                            )
                                        }
                                    >
                                        <FiPrinter className="mr-2" />
                                        Print Invoice
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)] hover:text-[var(--text-primary)]"
                                        onClick={() =>
                                            state?.setIsTransportModalOpen(
                                                false
                                            )
                                        }
                                    >
                                        Close
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

            {/* ==============================================================
                ALERT MODAL
            ============================================================== */}

            {state?.modalAlert?.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <Card
                        className={[
                            "w-full max-w-md border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xl",
                            state?.modalAlert?.isError
                                ? "border-t-4 border-t-[var(--brand-danger)]"
                                : state?.modalAlert?.type === "loading"
                                  ? "border-0"
                                  : "border-t-4 border-t-[var(--brand-success)]",
                        ].join(" ")}
                    >
                        <CardHeader>
                            <CardTitle
                                className={
                                    state?.modalAlert?.isError
                                        ? "text-[var(--brand-danger)]"
                                        : state?.modalAlert?.type ===
                                            "loading"
                                          ? "text-[var(--text-primary)]"
                                          : "text-[var(--brand-success)]"
                                }
                            >
                                {state?.modalAlert?.title}
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {state?.modalAlert?.type === "loading" ? (
                                <div className="flex flex-col items-center justify-center py-6 text-center">
                                    <div className="mb-6">
                                        <div
                                            className="h-14 w-14 animate-spin rounded-full border-4 border-[var(--bg-muted)] border-t-[var(--brand-accent)]"
                                            aria-hidden="true"
                                        />
                                    </div>

                                    <p className="text-lg font-semibold text-[var(--text-primary)]">
                                        {loadingMessage}
                                    </p>

                                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                                        Please wait while we evaluate the
                                        available transporters.
                                    </p>

                                    <div className="mt-6 flex items-center gap-1.5">
                                        <span
                                            className={[
                                                "h-1.5 w-1.5 rounded-full transition-all",
                                                loadingMessage ===
                                                "AI is finding the zone rate"
                                                    ? "scale-125 bg-[var(--brand-accent)]"
                                                    : "bg-[var(--text-muted)]/30",
                                            ].join(" ")}
                                        />

                                        <span
                                            className={[
                                                "h-1.5 w-1.5 rounded-full transition-all",
                                                loadingMessage ===
                                                "Performing calculation for each transporter"
                                                    ? "scale-125 bg-[var(--brand-accent)]"
                                                    : "bg-[var(--text-muted)]/30",
                                            ].join(" ")}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-[var(--text-primary)]">
                                        {state?.modalAlert?.message}
                                    </p>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)] hover:text-[var(--text-primary)]"
                                        onClick={() =>
                                            state?.setModalAlert?.({
                                                isOpen: false,
                                                title: "",
                                                message: "",
                                                isError: false,
                                                type: null,
                                            })
                                        }
                                    >
                                        Acknowledge
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ==============================================================
                HIDDEN PDF REPORT
            ============================================================== */}

            <div
                className="absolute left-[-9999px] top-0"
                aria-hidden="true"
            >
                {state?.resultsData && (
                    <DispatchReport
                        ref={reportRef}
                        state={state}
                    />
                )}
            </div>
        </div>
    );
}

/* =====================================================================
   FORM FIELD
===================================================================== */

function FormField({ label, children }) {
    return (
        <div className="space-y-2">
            <Label className="text-[var(--text-primary)]">
                {label}
            </Label>
            {children}
        </div>
    );
}

/* =====================================================================
   SELECTION CARD
===================================================================== */

function SelectionCard({
    title,
    description,
    children,
    className = "",
}) {
    return (
        <Card
            className={`border-[var(--border-light)] bg-[var(--bg-main)] shadow-none ${className}`}
        >
            <CardHeader className="pb-3">
                <CardTitle className="text-base text-[var(--text-primary)]">
                    {title}
                </CardTitle>

                <CardDescription className="text-[var(--text-muted)]">
                    {description}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {children}
            </CardContent>
        </Card>
    );
}