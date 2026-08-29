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

        await new Promise((resolve) => setTimeout(resolve, 150));
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
    <div className="space-y-6">
      {/* ============================================================
          HEADER
      ============================================================ */}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            🚚 Freight Logistics Evaluator
          </CardTitle>

          <CardDescription>
            Contract Rate Comparison
          </CardDescription>
        </CardHeader>
      </Card>

      {/* ============================================================
          INPUT FORM
      ============================================================ */}

      <form
        onSubmit={handleEvaluate}
        className="space-y-6"
      >
        {/* ==========================================================
            SHIPMENT CONTENTS
        ========================================================== */}

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">
                Shipment Contents
              </CardTitle>

              <CardDescription>
                Add the packages included in this shipment.
              </CardDescription>
            </div>

            {/* Unit selector */}
            <div className="flex w-fit overflow-hidden rounded-lg border bg-muted p-1">
              <button
                type="button"
                onClick={() => state?.setUnit("cm")}
                className={[
                  "rounded-md px-3 py-1.5 text-xs font-medium transition",
                  state?.unit === "cm"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
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
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
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
                className="border-muted-foreground/20 bg-muted/20"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">
                      Product Packaging {idx + 1}
                    </Badge>

                    {idx > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
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
                className="w-full border-dashed"
                onClick={state?.addProduct}
              >
                + Add Another Package{" "}
                <span className="ml-1 text-muted-foreground">
                  ({state?.products?.length}/5)
                </span>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* ==========================================================
            SHIPMENT DETAILS
        ========================================================== */}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Shipment Details
            </CardTitle>

            <CardDescription>
              Enter the commercial and destination information.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
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
                    <span className="text-destructive">
                      (CITY ONLY!)
                    </span>
                  </>
                }
              >
                <Input
                  type="text"
                  required
                  value={state?.dim?.destination_city}
                  onChange={(e) =>
                    state?.setDim({
                      ...state?.dim,
                      destination_city: e.target.value,
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
            </div>
          </CardContent>
        </Card>

        {/* ==========================================================
            OPERATIONS
        ========================================================== */}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Operations & Loading
            </CardTitle>

            <CardDescription>
              Configure loading and final delivery behavior.
              <span className="ml-1 font-medium text-amber-600">
                Ask from Mr. Sachin
              </span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-3">
              {/* ====================================================
                  LOADING METHOD
              ==================================================== */}

              <SelectionCard
                title="Loading Method"
                description="Choose where the shipment is loaded."
                active={isHubLoading}
                activeLabel="Hub Loading"
                inactiveLabel="Local Loading"
                activeBadgeClass="border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                activeSwitchClass="data-[state=checked]:bg-blue-600"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {isHubLoading
                        ? "🏢 Hub"
                        : "📍 Local"}
                    </p>

                    <p className="text-xs text-muted-foreground">
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
                        loading_type: checked ? "hub" : "local",
                        })
                    }
                    aria-label="Toggle loading method"
                    className="
                        h-7 w-12
                        border-2
                        border-emerald-600
                        bg-emerald-500
                        shadow-sm
                        transition-colors

                        data-[state=checked]:border-orange-600
                        data-[state=checked]:bg-orange-500

                        [&>span]:h-5
                        [&>span]:w-5
                        [&>span]:bg-white
                        [&>span]:shadow-md

                        data-[state=checked]:[&>span]:translate-x-5
                    "
                    />
                </div>

                <Badge
                  className={
                    isHubLoading
                      ? "border-blue-500/30 bg-blue-500/10 text-blue-700 hover:bg-blue-500/10 dark:text-blue-300"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"
                  }
                  variant="outline"
                >
                  {isHubLoading
                    ? "🏢 Hub Selected"
                    : "📍 Local Selected"}
                </Badge>

                {isHubLoading && (
                  <div className="space-y-2 border-t pt-4">
                    <Label
                      htmlFor="hub-loading"
                      className="text-xs text-blue-600"
                    >
                      Enter Hub Amount (₹)
                    </Label>

                    <Input
                      id="hub-loading"
                      type="number"
                      min="0"
                      required
                      value={
                        state?.dim?.hub_loading_input
                      }
                      onChange={(e) =>
                        state?.setDim({
                          ...state?.dim,
                          hub_loading_input:
                            +e.target.value,
                        })
                      }
                    />

                    <p className="text-[11px] text-muted-foreground">
                      * Will be capped by partner max
                      threshold if defined.
                    </p>
                  </div>
                )}
              </SelectionCard>

              {/* ====================================================
                  DELIVERY TYPE
              ==================================================== */}

              <SelectionCard
                title="Final Delivery"
                description="Choose how the shipment reaches its destination."
                active={isDoorDelivery}
                activeLabel="Door Delivery"
                inactiveLabel="Godown Hub"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {isDoorDelivery
                        ? "🚪 Door"
                        : "🏭 Godown Hub"}
                    </p>

                    <p className="text-xs text-muted-foreground">
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
                        delivery_type: checked ? "door" : "godown",
                        })
                    }
                    aria-label="Toggle delivery type"
                    className="
                        h-7 w-12
                        border-2
                        border-orange-600
                        bg-orange-500
                        shadow-sm
                        transition-colors

                        data-[state=checked]:border-emerald-600
                        data-[state=checked]:bg-emerald-500

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
                      ? "border-orange-500/30 bg-orange-500/10 text-orange-700 hover:bg-orange-500/10 dark:text-orange-300"
                      : "border-violet-500/30 bg-violet-500/10 text-violet-700 hover:bg-violet-500/10 dark:text-violet-300"
                  }
                >
                  {isDoorDelivery
                    ? "🚪 Door Delivery Selected"
                    : "🏭 Godown Hub Selected"}
                </Badge>

                <div
                  className={
                    isDoorDelivery
                      ? "rounded-md bg-orange-500/10 p-3 text-xs text-orange-700 dark:text-orange-300"
                      : "rounded-md bg-violet-500/10 p-3 text-xs text-violet-700 dark:text-violet-300"
                  }
                >
                  {isDoorDelivery
                    ? "Requires manual distance mapping below."
                    : "Distance mapping disabled. No ODA charges will apply."}
                </div>
              </SelectionCard>

              {/* ====================================================
                  HAMALI
              ==================================================== */}

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
                      value={state?.dim?.hamali_cost}
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

            {/* ========================================================
                DISTANCE MAPPING
            ======================================================== */}

            {isDoorDelivery && (
              <>
                <Separator />

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">
                      Transporter Distance Mapping
                    </h3>

                    <p className="text-sm text-muted-foreground">
                      Required for door delivery.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {state?.partners
                      ?.filter(
                        (partner) => partner?.partner_link
                      )
                      .map((partner) => (
                        <Card
                          key={partner.id}
                          className="bg-muted/20"
                        >
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                              {partner.name}
                            </CardTitle>

                            {partner.partner_link && (
                              <CardDescription>
                                <a
                                  href={partner.partner_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-primary hover:underline"
                                >
                                  Find distance calculator
                                  <FiExternalLink
                                    size={13}
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
                                  state?.partnerDistances?.[
                                    partner.id
                                  ] || 0
                                }
                                onChange={(e) =>
                                  state?.setPartnerDistances({
                                    ...state.partnerDistances,
                                    [partner.id]:
                                      Number(
                                        e.target.value
                                      ),
                                  })
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
              className="w-full sm:w-auto"
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
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>
                  Dispatch Options
                </CardTitle>

                <CardDescription>
                  {state.resultsData.options.length} transporter
                  option
                  {state.resultsData.options.length === 1
                    ? ""
                    : "s"} evaluated.
                </CardDescription>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={generatePDF}
              >
                <FiPrinter className="mr-2" />
                Download Dispatch Report
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="mb-4">
              <Badge variant="secondary">
                Total Options:{" "}
                {state.resultsData.options.length}
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {state.resultsData.options.map((opt, idx) => {
                const isBest =
                  state.selectedTransport?.partner_name ===
                  opt.partner_name;

                return (
                  <Card
                    key={idx}
                    className={
                      isBest
                        ? "border-2 border-emerald-500 bg-emerald-500/5"
                        : ""
                    }
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">
                          {opt.partner_name}
                        </CardTitle>

                        {isBest && (
                          <Badge className="shrink-0 bg-emerald-600">
                            🟢 Cheapest
                          </Badge>
                        )}
                      </div>

                      <CardDescription>
                        Partners Evaluation
                      </CardDescription>

                      <div className="text-xl font-bold text-primary">
                        ₹{opt.dispatch_cost_gst}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <details>
                        <summary className="cursor-pointer text-sm font-medium">
                          Cost Breakdown
                        </summary>

                        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <span className="text-muted-foreground">
                            Destination Zone
                          </span>
                          <strong className="text-right">
                            {opt.destination_zone}
                          </strong>

                          <span className="text-muted-foreground">
                            State
                          </span>
                          <strong className="text-right">
                            {opt.state}
                          </strong>

                          <span className="text-muted-foreground">
                            Chargeable Weight
                          </span>
                          <strong className="text-right">
                            {opt.chargeable_weight} kg
                          </strong>

                          <span className="text-muted-foreground">
                            Basic Freight
                          </span>
                          <strong className="text-right">
                            ₹{opt.basic_freight}
                          </strong>

                          <span className="text-muted-foreground">
                            Loading Charge
                          </span>
                          <strong className="text-right">
                            ₹{opt.loading_charge}
                          </strong>

                          <span className="text-muted-foreground">
                            Fuel Charge
                          </span>
                          <strong className="text-right">
                            ₹{opt.fuel_charge}
                          </strong>

                          <span className="text-muted-foreground">
                            Documentation Charge
                          </span>
                          <strong className="text-right">
                            ₹{opt.documentation_charge}
                          </strong>

                          <span className="text-muted-foreground">
                            FOV Charge
                          </span>
                          <strong className="text-right">
                            ₹{opt.fov_charge}
                          </strong>

                          <span className="text-muted-foreground">
                            ODA Charge
                          </span>
                          <strong className="text-right">
                            ₹{opt.oda_charge}
                          </strong>

                          {opt.hamali_cost > 0 && (
                            <>
                              <span className="text-primary">
                                {opt.hamali_detail ||
                                  "Hamali Charges"}
                              </span>

                              <strong className="text-right text-primary">
                                ₹{opt.hamali_cost}
                              </strong>
                            </>
                          )}

                          <Separator className="col-span-2 my-2" />

                          <span className="font-medium">
                            Charges before Taxes
                          </span>

                          <strong className="text-right">
                            ₹{opt.subtotal}
                          </strong>

                          <span className="font-semibold">
                            Total Cost after Taxes
                          </span>

                          <strong className="text-right text-lg text-primary">
                            ₹{opt.dispatch_cost_gst}
                          </strong>
                        </div>
                      </details>

                      <Button
                        type="button"
                        className="w-full"
                        variant={
                          isBest ? "default" : "secondary"
                        }
                        onClick={() =>
                          state?.confirmTransport(opt)
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-md shadow-xl">
              <CardHeader>
                <CardTitle>
                  Confirmed Transport
                </CardTitle>

                <CardDescription>
                  Selected transporter
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Transporter
                  </p>

                  <p className="font-semibold">
                    {
                      state.selectedTransport
                        ?.partner_name
                    }
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Final Cost
                  </p>

                  <p className="text-2xl font-bold text-primary">
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
                    className="flex-1"
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
                    className="flex-1"
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
              "w-full max-w-md shadow-2xl",
              state?.modalAlert?.isError
                ? "border-t-4 border-t-destructive"
                : state?.modalAlert?.type === "loading"
                  ? "border-0"
                  : "border-t-4 border-t-emerald-500",
            ].join(" ")}
          >
            <CardHeader>
              <CardTitle
                className={
                  state?.modalAlert?.isError
                    ? "text-destructive"
                    : state?.modalAlert?.type === "loading"
                      ? "text-foreground"
                      : "text-emerald-600"
                }
              >
                {state?.modalAlert?.title}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {state?.modalAlert?.type === "loading" ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  {/* Spinner */}
                  <div className="mb-6">
                    <div
                      className="h-14 w-14 animate-spin rounded-full border-4 border-muted border-t-primary"
                      aria-hidden="true"
                    />
                  </div>

                  <p className="text-lg font-semibold text-foreground">
                    {loadingMessage}
                  </p>

                  <p className="mt-2 text-sm text-muted-foreground">
                    Please wait while we evaluate the available transporters.
                  </p>

                  {/* Progress dots */}
                  <div className="mt-6 flex items-center gap-1.5">
                    <span
                      className={[
                        "h-1.5 w-1.5 rounded-full transition-all",
                        loadingMessage === "AI is finding the zone rate"
                          ? "scale-125 bg-primary"
                          : "bg-muted-foreground/30",
                      ].join(" ")}
                    />

                    <span
                      className={[
                        "h-1.5 w-1.5 rounded-full transition-all",
                        loadingMessage ===
                        "Performing calculation for each transporter"
                          ? "scale-125 bg-primary"
                          : "bg-muted-foreground/30",
                      ].join(" ")}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm">
                    {state?.modalAlert?.message}
                  </p>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
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
      <Label>{label}</Label>
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
      className={`bg-muted/20 ${className}`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {title}
        </CardTitle>

        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}