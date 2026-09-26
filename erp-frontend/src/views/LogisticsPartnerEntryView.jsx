import { useState } from "react";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function LogisticsPartnerEntryView({ state }) {
  const [modalAlert, setModalAlert] = useState({
    isOpen: false,
    title: "",
    message: "",
    isError: false,
  });

  const hasChanges =
    JSON.stringify(state.buildCurrentPayload()) !==
    state.originalPayloadString;

  const closeModal = () => {
    setModalAlert({
      isOpen: false,
      title: "",
      message: "",
      isError: false,
    });
  };

  const themedInputClass =
    "border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]";

  const themedSelectTriggerClass =
    "border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]";

  const themedSelectContentClass =
    "border-[var(--border-light)] bg-[var(--bg-surface)] text-[var(--text-primary)]";

  const themedSelectItemClass =
    "focus:bg-[var(--combobox-hover)] focus:text-[var(--text-primary)]";

  const themedTableClass =
    "border-[var(--border-light)] bg-[var(--bg-main)]";

  const themedTableHeaderClass =
    "border-[var(--border-light)] bg-[var(--bg-muted)] text-[var(--text-primary)]";

  const themedTableCellClass =
    "border-[var(--border-light)] text-[var(--text-primary)]";

  return (
    <div className="mx-auto w-full max-w-[1200px] bg-[var(--bg-main)] p-6 text-[var(--text-primary)]">
      <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-[var(--border-light)] bg-[var(--bg-muted)] p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
              🚚 Master Logistics Onboarding
            </h3>

            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Configure transporter contract parameters, zones, fuel escalation,
              and ODA delivery rates.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* PDF Upload */}
            <div>
              <input
                type="file"
                accept=".pdf"
                ref={state.fileInputRef}
                className="hidden"
                onChange={state.handleLogisticsFileUpload}
              />

              <Button
                type="button"
                onClick={() => state.fileInputRef.current?.click()}
                disabled={state.isExtracting}
                className="bg-[var(--brand-accent)] text-white hover:opacity-90"
              >
                {state.isExtracting
                  ? "⏳ Extracting..."
                  : "🤖 Auto-Fill via Contract PDF"}
              </Button>
            </div>

            {/* Partner Selector */}
            <Select
              value={state.selectedPartnerId || "__manual__"}
              onValueChange={(value) =>
                state.handlePartnerSelection({
                  target: {
                    value: value === "__manual__" ? "" : value,
                  },
                })
              }
            >
              <SelectTrigger
                className={`w-full sm:w-[240px] ${themedSelectTriggerClass}`}
              >
                <SelectValue placeholder="Select transporter" />
              </SelectTrigger>

              <SelectContent className={themedSelectContentClass}>
                <SelectItem
                  value="__manual__"
                  className={themedSelectItemClass}
                >
                  ➕ Create Manually
                </SelectItem>

                {state.availablePartners.map((partner) => (
                  <SelectItem
                    key={partner.id}
                    value={String(partner.id)}
                    className={themedSelectItemClass}
                  >
                    ✏️ {partner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <form onSubmit={state.handlePartnerSave}>
          <div className="space-y-8 p-6">
            {/* Core Contract Parameters */}
            <section>
              <div className="mb-5">
                <h4 className="text-lg font-semibold text-[var(--brand-accent)]">
                  Core Contract Parameters
                </h4>

                <p className="text-sm text-[var(--text-muted)]">
                  Basic transporter and commercial contract configuration.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                <FormField label="Transporter Name">
                  <Input
                    required
                    value={state.partner.name}
                    onChange={(e) =>
                      state.setPartner({
                        ...state.partner,
                        name: e.target.value,
                      })
                    }
                    className={themedInputClass}
                  />
                </FormField>

                <FormField label="Distance Calculator Link">
                  <Input
                    type="url"
                    value={state.partner.partner_link || ""}
                    onChange={(e) =>
                      state.setPartner({
                        ...state.partner,
                        partner_link: e.target.value,
                      })
                    }
                    className={themedInputClass}
                  />
                </FormField>

                <FormField label="Mobile Number">
                  <Input
                    type="text"
                    value={state.partner.mobile_number || ""}
                    onChange={(e) =>
                      state.setPartner({
                        ...state.partner,
                        mobile_number: e.target.value,
                      })
                    }
                    className={themedInputClass}
                  />
                </FormField>

                <FormField label="CFT Factor">
                  <Input
                    required
                    type="number"
                    step="0.01"
                    value={state.partner.cft_factor}
                    onChange={(e) =>
                      state.setPartner({
                        ...state.partner,
                        cft_factor: e.target.value,
                      })
                    }
                    className={themedInputClass}
                  />
                </FormField>

                <FormField label="Min Weight (KG)">
                  <Input
                    required
                    type="number"
                    value={state.partner.minimum_weight}
                    onChange={(e) =>
                      state.setPartner({
                        ...state.partner,
                        minimum_weight: e.target.value,
                      })
                    }
                    className={themedInputClass}
                  />
                </FormField>

                <FormField label="Min Freight Value (₹)">
                  <Input
                    required
                    type="number"
                    value={state.partner.minimum_freight_value}
                    onChange={(e) =>
                      state.setPartner({
                        ...state.partner,
                        minimum_freight_value: e.target.value,
                      })
                    }
                    className={themedInputClass}
                  />
                </FormField>

                <FormField label="Docs/GC Charge">
                  <Input
                    required
                    type="number"
                    value={state.partner.documentation_charge}
                    onChange={(e) =>
                      state.setPartner({
                        ...state.partner,
                        documentation_charge: e.target.value,
                      })
                    }
                    className={themedInputClass}
                  />
                </FormField>

                <FormField label="FOV Risk (%)">
                  <Input
                    required
                    type="number"
                    step="0.01"
                    value={state.partner.fov_percentage}
                    onChange={(e) =>
                      state.setPartner({
                        ...state.partner,
                        fov_percentage: e.target.value,
                      })
                    }
                    className={themedInputClass}
                  />
                </FormField>

                <FormField
                  label="Local Loading Cost (₹)"
                  labelClassName="text-[var(--brand-success)]"
                >
                  <Input
                    required
                    type="number"
                    step="1"
                    value={state.partner.local_loading_cost}
                    onChange={(e) =>
                      state.setPartner({
                        ...state.partner,
                        local_loading_cost: e.target.value,
                      })
                    }
                    className={themedInputClass}
                  />
                </FormField>

                <FormField
                  label="Max Hub Loading Cap (₹)"
                  labelClassName="text-[var(--brand-danger)]"
                >
                  <Input
                    required
                    type="number"
                    step="1"
                    value={state.partner.hub_loading_max_cost}
                    onChange={(e) =>
                      state.setPartner({
                        ...state.partner,
                        hub_loading_max_cost: e.target.value,
                      })
                    }
                    className={themedInputClass}
                  />
                </FormField>

                <FormField label="GST Rate (%)">
                  <Input
                    required
                    type="number"
                    value={state.partner.gst_percentage}
                    onChange={(e) =>
                      state.setPartner({
                        ...state.partner,
                        gst_percentage: e.target.value,
                      })
                    }
                    className={themedInputClass}
                  />
                </FormField>
              </div>
            </section>

            {/* Zone Definitions */}
            <section>
              <SectionHeader
                title="Zone Definitions & Freight Rates"
                description="Configure geographical zones and their applicable freight rates."
              >
                <Button
                  type="button"
                  variant="outline"
                  className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)]"
                  onClick={() =>
                    state.addZoneRow(state.setZones, {
                      zone_code: "",
                      zone_name: "",
                      states_raw: "",
                      rate_per_kg: "",
                    })
                  }
                >
                  + Add Zone Rate
                </Button>
              </SectionHeader>

              <div className="overflow-x-auto rounded-lg border border-[var(--border-light)]">
                <Table className={themedTableClass}>
                  <TableHeader>
                    <TableRow className={themedTableHeaderClass}>
                      <TableHead className={themedTableHeaderClass}>
                        Zone Code
                      </TableHead>
                      <TableHead className={themedTableHeaderClass}>
                        Regions Served
                      </TableHead>
                      <TableHead className={themedTableHeaderClass}>
                        States (Comma Separated)
                      </TableHead>
                      <TableHead className={themedTableHeaderClass}>
                        Rate (₹/kg)
                      </TableHead>
                      <TableHead
                        className={`${themedTableHeaderClass} w-[60px]`}
                      />
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {state.zones.map((zone, index) => (
                      <TableRow
                        key={index}
                        className="border-[var(--border-light)] hover:bg-[var(--combobox-hover)]"
                      >
                        <TableCell className={themedTableCellClass}>
                          <Input
                            className={`${themedInputClass} uppercase`}
                            value={zone.zone_code}
                            onChange={(e) =>
                              state.handleTableChange(
                                state.zones,
                                state.setZones,
                                index,
                                "zone_code",
                                e.target.value
                              )
                            }
                          />
                        </TableCell>

                        <TableCell className={themedTableCellClass}>
                          <Input
                            className={themedInputClass}
                            value={zone.zone_name}
                            onChange={(e) =>
                              state.handleTableChange(
                                state.zones,
                                state.setZones,
                                index,
                                "zone_name",
                                e.target.value
                              )
                            }
                          />
                        </TableCell>

                        <TableCell className={themedTableCellClass}>
                          <Input
                            className={themedInputClass}
                            value={zone.states_raw}
                            onChange={(e) =>
                              state.handleTableChange(
                                state.zones,
                                state.setZones,
                                index,
                                "states_raw",
                                e.target.value
                              )
                            }
                          />
                        </TableCell>

                        <TableCell className={themedTableCellClass}>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className={themedInputClass}
                            value={zone.rate_per_kg}
                            onChange={(e) =>
                              state.handleTableChange(
                                state.zones,
                                state.setZones,
                                index,
                                "rate_per_kg",
                                e.target.value
                              )
                            }
                          />
                        </TableCell>

                        <TableCell className={themedTableCellClass}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-[var(--brand-danger)] hover:bg-[var(--warning-row)] hover:text-[var(--brand-danger)]"
                            onClick={() =>
                              state.removeZoneRow(
                                state.zones,
                                state.setZones,
                                index
                              )
                            }
                          >
                            ✕
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>

            {/* Fuel Escalation */}
            <section>
              <SectionHeader
                title="Fuel Escalation (FSC)"
                description="Define fuel price slabs and their applicable surcharge percentages."
              >
                <Button
                  type="button"
                  variant="outline"
                  className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)]"
                  onClick={() =>
                    state.addZoneRow(state.setFuelMatrix, {
                      fuel_price_from: "",
                      fuel_price_to: "",
                      surcharge_percentage: "",
                    })
                  }
                >
                  + Add Fuel Slab
                </Button>
              </SectionHeader>

              <div className="overflow-x-auto rounded-lg border border-[var(--border-light)]">
                <Table className={themedTableClass}>
                  <TableHeader>
                    <TableRow className={themedTableHeaderClass}>
                      <TableHead className={themedTableHeaderClass}>
                        Diesel Price From (₹)
                      </TableHead>
                      <TableHead className={themedTableHeaderClass}>
                        Diesel Price To (₹)
                      </TableHead>
                      <TableHead className={themedTableHeaderClass}>
                        FSC Applicable (%)
                      </TableHead>
                      <TableHead
                        className={`${themedTableHeaderClass} w-[60px]`}
                      />
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {state.fuelMatrix.map((fuel, index) => (
                      <TableRow
                        key={index}
                        className="border-[var(--border-light)] hover:bg-[var(--combobox-hover)]"
                      >
                        <TableCell className={themedTableCellClass}>
                          <Input
                            type="number"
                            step="0.01"
                            className={themedInputClass}
                            value={fuel.fuel_price_from}
                            onChange={(e) =>
                              state.handleTableChange(
                                state.fuelMatrix,
                                state.setFuelMatrix,
                                index,
                                "fuel_price_from",
                                e.target.value
                              )
                            }
                          />
                        </TableCell>

                        <TableCell className={themedTableCellClass}>
                          <Input
                            type="number"
                            step="0.01"
                            className={themedInputClass}
                            value={fuel.fuel_price_to}
                            onChange={(e) =>
                              state.handleTableChange(
                                state.fuelMatrix,
                                state.setFuelMatrix,
                                index,
                                "fuel_price_to",
                                e.target.value
                              )
                            }
                          />
                        </TableCell>

                        <TableCell className={themedTableCellClass}>
                          <Input
                            type="number"
                            step="0.01"
                            className={themedInputClass}
                            value={fuel.surcharge_percentage}
                            onChange={(e) =>
                              state.handleTableChange(
                                state.fuelMatrix,
                                state.setFuelMatrix,
                                index,
                                "surcharge_percentage",
                                e.target.value
                              )
                            }
                          />
                        </TableCell>

                        <TableCell className={themedTableCellClass}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-[var(--brand-danger)] hover:bg-[var(--warning-row)] hover:text-[var(--brand-danger)]"
                            onClick={() =>
                              state.removeZoneRow(
                                state.fuelMatrix,
                                state.setFuelMatrix,
                                index
                              )
                            }
                          >
                            ✕
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>

            {/* ODA Matrix */}
            <section>
              <SectionHeader
                title="ODA Delivery Matrix"
                description="Configure ODA charges based on distance and weight ranges."
              >
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)]"
                    onClick={state.addOdaCol}
                  >
                    + Add Weight Column
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)]"
                    onClick={state.addOdaRow}
                  >
                    + Add Distance Row
                  </Button>
                </div>
              </SectionHeader>

              <div className="overflow-x-auto rounded-lg border border-[var(--border-light)]">
                <Table
                  className={`min-w-[800px] ${themedTableClass}`}
                >
                  <TableHeader>
                    <TableRow className={themedTableHeaderClass}>
                      <TableHead
                        className={`min-w-[180px] border-r-2 border-[var(--border-light)] bg-[var(--bg-muted)] ${themedTableHeaderClass}`}
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-right text-xs text-[var(--text-muted)]">
                            Weights (KG) →
                          </span>
                          <span className="text-left text-xs text-[var(--text-muted)]">
                            Distances (KM) ↓
                          </span>
                        </div>
                      </TableHead>

                      {state.odaWeights.map((weight) => (
                        <TableHead
                          key={weight.id}
                          className={`border-r border-[var(--border-light)] bg-[var(--bg-muted)] ${themedTableHeaderClass}`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Input
                              className={`${themedInputClass} h-8 w-[65px] px-2 text-center`}
                              placeholder="Min"
                              value={weight.from}
                              onChange={(e) =>
                                state.updateOdaAxis(
                                  state.setOdaWeights,
                                  state.odaWeights,
                                  weight.id,
                                  "from",
                                  e.target.value
                                )
                              }
                            />

                            <span className="text-[var(--text-muted)]">
                              -
                            </span>

                            <Input
                              className={`${themedInputClass} h-8 w-[65px] px-2 text-center`}
                              placeholder="Max"
                              value={weight.to}
                              onChange={(e) =>
                                state.updateOdaAxis(
                                  state.setOdaWeights,
                                  state.odaWeights,
                                  weight.id,
                                  "to",
                                  e.target.value
                                )
                              }
                            />

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-[var(--brand-danger)] hover:bg-[var(--warning-row)] hover:text-[var(--brand-danger)]"
                              onClick={() => state.removeOdaCol(weight.id)}
                            >
                              ×
                            </Button>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {state.odaDistances.map((distance) => (
                      <TableRow
                        key={distance.id}
                        className="border-[var(--border-light)] hover:bg-[var(--combobox-hover)]"
                      >
                        <TableCell
                          className={`border-r-2 border-[var(--border-light)] bg-[var(--bg-muted)] ${themedTableCellClass}`}
                        >
                          <div className="flex items-center gap-2">
                            <Input
                              className={`${themedInputClass} h-8 w-[65px] px-2 text-center`}
                              placeholder="Min"
                              value={distance.from}
                              onChange={(e) =>
                                state.updateOdaAxis(
                                  state.setOdaDistances,
                                  state.odaDistances,
                                  distance.id,
                                  "from",
                                  e.target.value
                                )
                              }
                            />

                            <span className="text-[var(--text-muted)]">
                              -
                            </span>

                            <Input
                              className={`${themedInputClass} h-8 w-[65px] px-2 text-center`}
                              placeholder="Max"
                              value={distance.to}
                              onChange={(e) =>
                                state.updateOdaAxis(
                                  state.setOdaDistances,
                                  state.odaDistances,
                                  distance.id,
                                  "to",
                                  e.target.value
                                )
                              }
                            />

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="ml-auto h-8 w-8 text-[var(--brand-danger)] hover:bg-[var(--warning-row)] hover:text-[var(--brand-danger)]"
                              onClick={() =>
                                state.removeOdaRow(distance.id)
                              }
                            >
                              ×
                            </Button>
                          </div>
                        </TableCell>

                        {state.odaWeights.map((weight) => {
                          const cellKey = `${distance.id}_${weight.id}`;

                          return (
                            <TableCell
                              key={cellKey}
                              className={`border-r border-[var(--border-light)] ${themedTableCellClass}`}
                            >
                              <Input
                                type="number"
                                placeholder="₹"
                                className={`${themedInputClass} text-center`}
                                value={
                                  state.odaCharges[cellKey] ?? ""
                                }
                                onChange={(e) =>
                                  state.updateOdaCharge(
                                    distance.id,
                                    weight.id,
                                    e.target.value
                                  )
                                }
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-[var(--border-light)] bg-[var(--bg-muted)] p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {state.selectedPartnerId && (
                <Button
                  type="button"
                  variant="destructive"
                  size="lg"
                  onClick={state.handlePartnerDelete}
                  disabled={state.isDeleting}
                  className="bg-[var(--brand-danger)] text-white hover:opacity-90"
                >
                  {state.isDeleting
                    ? "⏳ Deleting..."
                    : "🗑️ Delete Transporter"}
                </Button>
              )}
            </div>

            <div>
              {hasChanges && (
                <Button
                  type="submit"
                  size="lg"
                  className="bg-[var(--brand-accent)] font-semibold text-white hover:opacity-90"
                >
                  {state.selectedPartnerId
                    ? "Update Changed Matrices"
                    : "Save New Transporter Master"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Alert Dialog */}
      <Dialog
        open={modalAlert.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeModal();
          }
        }}
      >
        <DialogContent className="border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
          <DialogHeader>
            <DialogTitle
              className={
                modalAlert.isError
                  ? "text-[var(--brand-danger)]"
                  : "text-[var(--brand-success)]"
              }
            >
              {modalAlert.title}
            </DialogTitle>

            <DialogDescription className="whitespace-pre-wrap pt-2 text-[var(--text-muted)]">
              {modalAlert.message}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              onClick={closeModal}
              className="bg-[var(--brand-accent)] text-white hover:opacity-90"
            >
              {state.isExtracting ? "Dismiss" : "Acknowledge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Small presentational helpers                                               */
/* -------------------------------------------------------------------------- */

function FormField({
  label,
  children,
  labelClassName = "",
}) {
  return (
    <div className="space-y-2">
      <Label
        className={`text-[var(--text-primary)] ${labelClassName}`}
      >
        {label}
      </Label>
      {children}
    </div>
  );
}

function SectionHeader({
  title,
  description,
  children,
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h4 className="text-lg font-semibold text-[var(--brand-accent)]">
          {title}
        </h4>

        {description && (
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {description}
          </p>
        )}
      </div>

      <div className="shrink-0">{children}</div>
    </div>
  );
}