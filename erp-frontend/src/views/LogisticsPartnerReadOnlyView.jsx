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

export default function LogisticsPartnerReadOnlyView({ state }) {
  const hasSelectedPartner = Boolean(state.selectedPartnerId);

  return (
    <div className="mx-auto w-full max-w-[1200px] p-4 md:p-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
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
              <SelectTrigger>
                <SelectValue placeholder="No partner selected" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="__none__">
                  No partner selected
                </SelectItem>

                {state.availablePartners.map((partner) => (
                  <SelectItem
                    key={partner.id}
                    value={String(partner.id)}
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
            <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
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
                    labelClassName="text-emerald-600"
                  />

                  <ReadOnlyField
                    label="Max Hub Loading Cap (₹)"
                    value={state.partner?.hub_loading_max_cost}
                    type="number"
                    labelClassName="text-red-600"
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

                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Zone Code</TableHead>
                        <TableHead>Regions Served</TableHead>
                        <TableHead>States (Comma Separated)</TableHead>
                        <TableHead>Rate (₹/kg)</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {state.zones?.length > 0 ? (
                        state.zones.map((zone, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <ReadOnlyTableInput
                                value={zone.zone_code}
                                className="uppercase"
                              />
                            </TableCell>

                            <TableCell>
                              <ReadOnlyTableInput
                                value={zone.zone_name}
                              />
                            </TableCell>

                            <TableCell>
                              <ReadOnlyTableInput
                                value={zone.states_raw}
                              />
                            </TableCell>

                            <TableCell>
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

                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          Diesel Price From (₹)
                        </TableHead>

                        <TableHead>
                          Diesel Price To (₹)
                        </TableHead>

                        <TableHead>
                          FSC Applicable (%)
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {state.fuelMatrix?.length > 0 ? (
                        state.fuelMatrix.map((fuel, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <ReadOnlyTableInput
                                value={fuel.fuel_price_from}
                                type="number"
                              />
                            </TableCell>

                            <TableCell>
                              <ReadOnlyTableInput
                                value={fuel.fuel_price_to}
                                type="number"
                              />
                            </TableCell>

                            <TableCell>
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

                <div className="overflow-x-auto rounded-lg border">
                  <Table className="min-w-[800px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px] bg-muted/50">
                          <div className="flex flex-col gap-1">
                            <span className="text-right text-[11px] font-medium text-muted-foreground">
                              Weights (KG) →
                            </span>

                            <span className="text-left text-[11px] font-medium text-muted-foreground">
                              Distances (KM) ↓
                            </span>
                          </div>
                        </TableHead>

                        {state.odaWeights?.map((weight) => (
                          <TableHead
                            key={weight.id}
                            className="bg-muted/50 text-center"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <Input
                                readOnly
                                placeholder="Min"
                                value={weight.from ?? ""}
                                className="h-8 w-[60px] px-2 text-center text-xs"
                              />

                              <span className="text-muted-foreground">
                                -
                              </span>

                              <Input
                                readOnly
                                placeholder="Max"
                                value={weight.to ?? ""}
                                className="h-8 w-[60px] px-2 text-center text-xs"
                              />
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {state.odaDistances?.length > 0 ? (
                        state.odaDistances.map((distance) => (
                          <TableRow key={distance.id}>
                            <TableCell className="bg-muted/30">
                              <div className="flex items-center gap-2">
                                <Input
                                  readOnly
                                  placeholder="Min"
                                  value={distance.from ?? ""}
                                  className="h-8 w-[60px] px-2 text-center text-xs"
                                />

                                <span className="text-muted-foreground">
                                  -
                                </span>

                                <Input
                                  readOnly
                                  placeholder="Max"
                                  value={distance.to ?? ""}
                                  className="h-8 w-[60px] px-2 text-center text-xs"
                                />
                              </div>
                            </TableCell>

                            {state.odaWeights?.map((weight) => {
                              const cellKey = `${distance.id}_${weight.id}`;

                              return (
                                <TableCell
                                  key={cellKey}
                                  className="min-w-[110px]"
                                >
                                  <Input
                                    readOnly
                                    type="number"
                                    placeholder="₹"
                                    value={
                                      state.odaCharges?.[cellKey] ?? ""
                                    }
                                    className="h-9 text-center"
                                  />
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={
                              (state.odaWeights?.length || 0) + 1
                            }
                            className="h-24 text-center text-sm text-muted-foreground"
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
      <h4 className="text-base font-semibold text-primary">
        {children}
      </h4>

      <div className="h-px flex-1 bg-border" />
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
        className={`text-sm font-medium ${labelClassName}`}
      >
        {label}
      </label>

      <Input
        readOnly
        type={type}
        value={value ?? ""}
        className="bg-muted/30"
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
      className={`h-9 bg-muted/30 ${className}`}
    />
  );
}

function EmptyTableRow({ colSpan, message }) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="h-24 text-center text-sm text-muted-foreground"
      >
        {message}
      </TableCell>
    </TableRow>
  );
}