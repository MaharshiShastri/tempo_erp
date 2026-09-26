import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const themedInputClass =
  "border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]";

const themedSelectTriggerClass =
  "border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]";

const themedSelectContentClass =
  "border-[var(--border-light)] bg-[var(--bg-surface)] text-[var(--text-primary)]";

const themedSelectItemClass =
  "focus:bg-[var(--combobox-hover)] focus:text-[var(--text-primary)]";

export default function LogisticsPartnerReadOnlyView({ state }) {
  const hasSelectedPartner = Boolean(state.selectedPartnerId);

  return (
    <div className="mx-auto w-full max-w-[1200px] bg-[var(--bg-main)] p-4 text-[var(--text-primary)] md:p-6">
      <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
        <CardHeader className="flex flex-col gap-4 border-b border-[var(--border-light)] bg-[var(--bg-muted)] sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-xl text-[var(--text-primary)]">
            <span>🚚</span>
            <span>Logistics Configuration</span>
          </CardTitle>

          <div className="w-full sm:w-[280px]">
            <Select
              value={state.selectedPartnerId || ""}
              onValueChange={(value) => {
                // shadcn Select does not emit a normal event,
                // so adapt the value to the existing handler.
                state.handlePartnerSelection({
                  target: {
                    value,
                  },
                });
              }}
            >
              <SelectTrigger className={themedSelectTriggerClass}>
                <SelectValue placeholder="No partner selected" />
              </SelectTrigger>

              <SelectContent className={themedSelectContentClass}>
                <SelectItem
                  value="__none__"
                  className={themedSelectItemClass}
                >
                  No partner selected
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
        </CardHeader>

        <CardContent className="space-y-8 pt-6">
          {!hasSelectedPartner && (
            <div className="rounded-lg border border-dashed border-[var(--border-light)] bg-[var(--bg-muted)] px-6 py-12 text-center">
              <p className="text-sm text-[var(--text-muted)]">
                Select a transporter to view its logistics configuration.
              </p>
            </div>
          )}

          {hasSelectedPartner && (
            <div className="space-y-8">
              {/* Core Contract Parameters */}
              <section className="space-y-4">
                <SectionHeading>
                  Core Contract Parameters
                </SectionHeading>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <ReadOnlyField
                    label="Transporter Name"
                    value={state.partner?.name}
                  />

                  <ReadOnlyField
                    label="Distance Calculator Link"
                    value={state.partner?.partner_link}
                  />

                  <ReadOnlyField
                    label="Mobile Number"
                    value={state.partner?.mobile_number}
                  />

                  <ReadOnlyField
                    label="CFT Factor"
                    value={state.partner?.cft_factor}
                    type="number"
                  />

                  <ReadOnlyField
                    label="Min Weight (KG)"
                    value={state.partner?.minimum_weight}
                    type="number"
                  />

                  <ReadOnlyField
                    label="Min Freight Value (₹)"
                    value={state.partner?.minimum_freight_value}
                    type="number"
                  />

                  <ReadOnlyField
                    label="Docs/GC Charge"
                    value={state.partner?.documentation_charge}
                    type="number"
                  />

                  <ReadOnlyField
                    label="FOV Risk (%)"
                    value={state.partner?.fov_percentage}
                    type="number"
                  />

                  <ReadOnlyField
                    label="Local Loading Cost (₹)"
                    value={state.partner?.local_loading_cost}
                    type="number"
                    labelClassName="text-[var(--brand-success)]"
                  />

                  <ReadOnlyField
                    label="Max Hub Loading Cap (₹)"
                    value={state.partner?.hub_loading_max_cost}
                    type="number"
                    labelClassName="text-[var(--brand-danger)]"
                  />

                  <ReadOnlyField
                    label="GST Rate (%)"
                    value={state.partner?.gst_percentage}
                    type="number"
                  />
                </div>
              </section>

              {/* Zone Definitions */}
              <section className="space-y-4">
                <SectionHeading>
                  Zone Definitions & Freight Rates
                </SectionHeading>

                <div className="overflow-x-auto rounded-lg border border-[var(--border-light)]">
                  <Table className="bg-[var(--bg-main)] text-[var(--text-primary)]">
                    <TableHeader>
                      <TableRow className="border-[var(--border-light)] bg-[var(--bg-muted)]">
                        <TableHead className="text-[var(--text-primary)]">
                          Zone Code
                        </TableHead>
                        <TableHead className="text-[var(--text-primary)]">
                          Regions Served
                        </TableHead>
                        <TableHead className="text-[var(--text-primary)]">
                          States (Comma Separated)
                        </TableHead>
                        <TableHead className="text-[var(--text-primary)]">
                          Rate (₹/kg)
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {state.zones?.length > 0 ? (
                        state.zones.map((zone, index) => (
                          <TableRow
                            key={index}
                            className="border-[var(--border-light)] hover:bg-[var(--combobox-hover)]"
                          >
                            <TableCell className="border-[var(--border-light)]">
                              <ReadOnlyTableInput
                                value={zone.zone_code}
                                className="uppercase"
                              />
                            </TableCell>

                            <TableCell className="border-[var(--border-light)]">
                              <ReadOnlyTableInput
                                value={zone.zone_name}
                              />
                            </TableCell>

                            <TableCell className="border-[var(--border-light)]">
                              <ReadOnlyTableInput
                                value={zone.states_raw}
                              />
                            </TableCell>

                            <TableCell className="border-[var(--border-light)]">
                              <ReadOnlyTableInput
                                value={zone.rate_per_kg}
                                type="number"
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <EmptyTableRow
                          colSpan={4}
                          message="No zone rates configured."
                        />
                      )}
                    </TableBody>
                  </Table>
                </div>
              </section>

              {/* Fuel Escalation */}
              <section className="space-y-4">
                <SectionHeading>
                  Fuel Escalation (FSC)
                </SectionHeading>

                <div className="overflow-x-auto rounded-lg border border-[var(--border-light)]">
                  <Table className="bg-[var(--bg-main)] text-[var(--text-primary)]">
                    <TableHeader>
                      <TableRow className="border-[var(--border-light)] bg-[var(--bg-muted)]">
                        <TableHead className="text-[var(--text-primary)]">
                          Diesel Price From (₹)
                        </TableHead>

                        <TableHead className="text-[var(--text-primary)]">
                          Diesel Price To (₹)
                        </TableHead>

                        <TableHead className="text-[var(--text-primary)]">
                          FSC Applicable (%)
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {state.fuelMatrix?.length > 0 ? (
                        state.fuelMatrix.map((fuel, index) => (
                          <TableRow
                            key={index}
                            className="border-[var(--border-light)] hover:bg-[var(--combobox-hover)]"
                          >
                            <TableCell className="border-[var(--border-light)]">
                              <ReadOnlyTableInput
                                value={fuel.fuel_price_from}
                                type="number"
                              />
                            </TableCell>

                            <TableCell className="border-[var(--border-light)]">
                              <ReadOnlyTableInput
                                value={fuel.fuel_price_to}
                                type="number"
                              />
                            </TableCell>

                            <TableCell className="border-[var(--border-light)]">
                              <ReadOnlyTableInput
                                value={fuel.surcharge_percentage}
                                type="number"
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <EmptyTableRow
                          colSpan={3}
                          message="No fuel escalation slabs configured."
                        />
                      )}
                    </TableBody>
                  </Table>
                </div>
              </section>

              {/* ODA Matrix */}
              <section className="space-y-4">
                <SectionHeading>
                  ODA Delivery Matrix
                </SectionHeading>

                <div className="overflow-x-auto rounded-lg border border-[var(--border-light)]">
                  <Table className="min-w-[800px] bg-[var(--bg-main)] text-[var(--text-primary)]">
                    <TableHeader>
                      <TableRow className="border-[var(--border-light)] bg-[var(--bg-muted)]">
                        <TableHead className="min-w-[150px] border-r border-[var(--border-light)] bg-[var(--bg-muted)]">
                          <div className="flex flex-col gap-1">
                            <span className="text-right text-[11px] font-medium text-[var(--text-muted)]">
                              Weights (KG) →
                            </span>

                            <span className="text-left text-[11px] font-medium text-[var(--text-muted)]">
                              Distances (KM) ↓
                            </span>
                          </div>
                        </TableHead>

                        {state.odaWeights?.map((weight) => (
                          <TableHead
                            key={weight.id}
                            className="border-r border-[var(--border-light)] bg-[var(--bg-muted)] text-center text-[var(--text-primary)]"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <Input
                                readOnly
                                placeholder="Min"
                                value={weight.from ?? ""}
                                className={`${themedInputClass} h-8 w-[60px] px-2 text-center text-xs disabled:opacity-70`}
                              />

                              <span className="text-[var(--text-muted)]">
                                -
                              </span>

                              <Input
                                readOnly
                                placeholder="Max"
                                value={weight.to ?? ""}
                                className={`${themedInputClass} h-8 w-[60px] px-2 text-center text-xs disabled:opacity-70`}
                              />
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {state.odaDistances?.length > 0 ? (
                        state.odaDistances.map((distance) => (
                          <TableRow
                            key={distance.id}
                            className="border-[var(--border-light)] hover:bg-[var(--combobox-hover)]"
                          >
                            <TableCell className="border-r border-[var(--border-light)] bg-[var(--bg-muted)]">
                              <div className="flex items-center gap-2">
                                <Input
                                  readOnly
                                  placeholder="Min"
                                  value={distance.from ?? ""}
                                  className={`${themedInputClass} h-8 w-[60px] px-2 text-center text-xs`}
                                />

                                <span className="text-[var(--text-muted)]">
                                  -
                                </span>

                                <Input
                                  readOnly
                                  placeholder="Max"
                                  value={distance.to ?? ""}
                                  className={`${themedInputClass} h-8 w-[60px] px-2 text-center text-xs`}
                                />
                              </div>
                            </TableCell>

                            {state.odaWeights?.map((weight) => {
                              const cellKey = `${distance.id}_${weight.id}`;

                              return (
                                <TableCell
                                  key={cellKey}
                                  className="min-w-[110px] border-[var(--border-light)]"
                                >
                                  <Input
                                    readOnly
                                    type="number"
                                    placeholder="₹"
                                    value={
                                      state.odaCharges?.[cellKey] ?? ""
                                    }
                                    className={`${themedInputClass} h-9 text-center`}
                                  />
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow className="border-[var(--border-light)]">
                          <TableCell
                            colSpan={
                              (state.odaWeights?.length || 0) + 1
                            }
                            className="h-24 border-[var(--border-light)] text-center text-sm text-[var(--text-muted)]"
                          >
                            No ODA delivery matrix configured.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </section>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function SectionHeading({ children }) {
  return (
    <div className="flex items-center gap-3">
      <h4 className="text-base font-semibold text-[var(--brand-accent)]">
        {children}
      </h4>

      <div className="h-px flex-1 bg-[var(--border-light)]" />
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  type = "text",
  labelClassName = "",
}) {
  return (
    <div className="space-y-2">
      <label
        className={`text-sm font-medium text-[var(--text-primary)] ${labelClassName}`}
      >
        {label}
      </label>

      <Input
        readOnly
        type={type}
        value={value ?? ""}
        className={`${themedInputClass} bg-[var(--bg-muted)]`}
      />
    </div>
  );
}

function ReadOnlyTableInput({
  value,
  type = "text",
  className = "",
}) {
  return (
    <Input
      readOnly
      type={type}
      value={value ?? ""}
      className={`${themedInputClass} h-9 bg-[var(--bg-muted)] ${className}`}
    />
  );
}

function EmptyTableRow({ colSpan, message }) {
  return (
    <TableRow className="border-[var(--border-light)]">
      <TableCell
        colSpan={colSpan}
        className="h-24 border-[var(--border-light)] text-center text-sm text-[var(--text-muted)]"
      >
        {message}
      </TableCell>
    </TableRow>
  );
}