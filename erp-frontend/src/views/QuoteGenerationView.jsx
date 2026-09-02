import { useMemo } from "react";
import SearchableMultiselect from "../components/shared/SearchableMultiselect";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";

export default function QuoteGenerationView({ state }) {
  const productGroups = useMemo(
    () =>
      [
        ...new Set(
          (state?.itemsMaster ?? [])
            .map((item) => item.item_group)
            .filter(Boolean)
        ),
      ].sort(),
    [state?.itemsMaster]
  );

  const productItems = useMemo(() => {
    const selectedProduct = state?.quoteSelectedGroup?.[0];

    if (!selectedProduct) return [];

    return (state?.itemsMaster ?? [])
      .filter((item) => item.item_group === selectedProduct)
      .filter((item) => item.item_code)
      .map((item) => item.item_code)
      .sort();
  }, [state?.itemsMaster, state?.quoteSelectedGroup]);

  const field = (label, value, onChange, props = {}) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quotation Generator</CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate quotations from the current Ex-Works price list
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={state?.handleGenerateQuote} className="space-y-8">
          {/* Product Selection */}
          <section className="space-y-4">
            <div>
              <h3 className="text-base font-semibold">
                Product Selection
              </h3>
              <p className="text-sm text-muted-foreground">
                Select the product group and item to quote.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <SearchableMultiselect
                label="Product Group"
                options={productGroups}
                value={state?.quoteSelectedGroup}
                onChange={(value) => {
                  state?.setQuoteSelectedGroup(value);
                  state?.setQuoteSelectedItemCode([]);}}
              />

              {state?.quoteSelectedGroup?.length === 1 && (
                <SearchableMultiselect
                  label="Item code"
                  options={productItems}
                  value={state?.quoteSelectedItemCode}
                  onChange={state?.setQuoteSelectedItemCode}
                />
              )}
            </div>
          </section>

          {/* Customer Details */}
          <section className="space-y-4">
            <div>
              <h3 className="text-base font-semibold">
                Customer Details
              </h3>
              <p className="text-sm text-muted-foreground">
                Enter the customer and quotation information.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {field(
                "Quote Number: Tempo/Quote/",
                state?.qouteNum,
                state?.setQouteNum,
                { required: true }
              )}

              {field(
                "Company",
                state?.clientQuoteCompany,
                state?.setClientQuoteCompany,
                { required: true }
              )}

              {field(
                "Buyer / Contact Person",
                state?.buyerQuoteName,
                state?.setBuyerQuoteName,
                { required: true }
              )}

              {field(
                "Email",
                state?.clientQuoteEmail,
                state?.setClientQuoteEmail,
                { required: true, type: "email" }
              )}

              {field(
                "Phone",
                state?.buyerQouteNum,
                state?.setBuyerQouteNum,
                { required: true }
              )}

              {field(
                "Address",
                state?.qouteAddress,
                state?.setQouteAddress,
                { required: true }
              )}

              {field(
                "City",
                state?.qouteCity,
                state?.setQouteCity,
                { required: true }
              )}

              {field(
                "Postal Code",
                state?.qoutePostalCode,
                state?.setQoutePostalCode,
                { required: true }
              )}

              {field(
                "Supply",
                state?.quoteSupply,
                state?.setQuoteSupply,
                { required: true }
              )}

              {field(
                "Installation",
                state?.quoteInstallation,
                state?.setQuoteInstallation,
                { required: true }
              )}

              {field(
                "Freight",
                state?.quoteFreight,
                state?.setQuoteFreight,
                { required: true }
              )}

              {field(
                "Customer Enquiry Date",
                state?.qouteDateInput,
                state?.setQouteDateInput,
                {
                  required: true,
                  type: "date",
                  max: new Date().toISOString().split("T")[0],
                }
              )}
            </div>

            <div className="flex flex-col gap-4 pt-2 sm:flex-row">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox
                  checked={!!state?.quoteDealer}
                  onCheckedChange={state?.setQuoteDealer}
                />
                Dealer quotation
              </label>

              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox
                  checked={!!state?.quoteSpecialModel}
                  onCheckedChange={state?.handleSpecialModelChange}
                />
                Special Model
              </label>
            </div>
            {/* Pricing Configuration */}
            <div>
              <h3 className="text-base font-semibold">Financials</h3>

              <p className="text-sm text-muted-foreground">Configure pricing, packing, freight, and tax details.</p>
            </div>

            <div className="rounded-lg border">
              <div className="grid grid-cols-2 border-b bg-muted/40">
                <div className="px-4 py-3 text-sm font-semibold">
                  Financial Input Details
                </div>

                <div className="border-l px-4 py-3 text-sm font-semibold">
                  Amount
                </div>
              </div>

              {/* Base Model Price */}
              <div className="grid grid-cols-2 border-b">
                <div className="flex items-center px-4 py-3 text-sm font-medium">
                  Base Model Price
                </div>

                <div className="border-l p-2">
                  <Input type="number" min="0" step="0.01" value={state?.quoteBaseModelPrice ?? ""} onChange={(e) =>state?.setQuoteBaseModelPrice(e.target.value)}
                    placeholder="Enter base model price"
                  />
                </div>
              </div>

              {/* Packing */}
              <div className="grid grid-cols-2 border-b">
                <div className="p-2">
                  <Select value={state?.quotePackingMode} onValueChange={state?.setQuotePackingMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select packing mode" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="INCLUSIVE">
                        Packing - Inclusive
                      </SelectItem>

                      <SelectItem value="ACTUAL">
                        Packing - Actual
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-l p-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={state?.quotePackingAmount ?? ""}
                    onChange={(e) =>
                      state?.setQuotePackingAmount(e.target.value)
                    }
                    placeholder={state?.quotePackingMode === "ACTUAL" ? "Enter packing amount" : "Inclusive"}
                    disabled={state?.quotePackingMode !== "ACTUAL"}
                  />
                </div>
              </div>

              {/* Freight */}
              <div className="grid grid-cols-2 border-b">
                <div className="p-2">
                  <Select value={state?.quoteFreightMode} onValueChange={state?.setQuoteFreightMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select freight mode" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="INCLUSIVE">
                        Freight - Inclusive
                      </SelectItem>

                      <SelectItem value="ACTUAL">
                        Freight - Actual
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-l p-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={state?.quoteFreightAmount ?? ""}
                    onChange={(e) =>
                      state?.setQuoteFreightAmount(e.target.value)
                    }
                    placeholder={state?.quoteFreightMode === "ACTUAL" ? "Enter freight amount" : "Inclusive"}
                    disabled={state?.quoteFreightMode !== "ACTUAL"}
                  />
                </div>
              </div>

              {/* Tax Rate */}
              <div className="grid grid-cols-2">
                <div className="flex items-center px-4 py-3 text-sm font-medium">
                  GST / Tax Rate (%)
                </div>

                <div className="border-l p-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={state?.quoteTaxRate ?? ""}
                    onChange={(e) =>
                      state?.setQuoteTaxRate(e.target.value)
                    }
                    placeholder="Enter tax rate"
                  />
                </div>
              </div>
            </div>
          </section>
            
          {/* Special Model */}
          {state?.quoteSpecialModel && (
            <section className="space-y-4">
              <div>
                <h3 className="text-base font-semibold">
                  Special Model Configuration
                </h3>
                <p className="text-sm text-muted-foreground">
                  Configure the special model parameters.
                </p>
              </div>

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {state?.quoteSpecialColumns?.map(
                        (column, columnIndex) => (
                          <TableHead key={columnIndex}>
                            <Input
                              value={column}
                              onChange={(e) =>
                                state?.updateSpecialColumn(
                                  columnIndex,
                                  e.target.value
                                )
                              }
                              className="h-8"
                            />
                          </TableHead>
                        )
                      )}

                      <TableHead className="w-[100px]">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {state?.quoteSpecialRows?.map(
                      (row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {row.map((cell, columnIndex) => (
                            <TableCell key={columnIndex}>
                              <Input
                                value={cell}
                                placeholder={
                                  columnIndex === 0
                                    ? "Parameter"
                                    : "Value"
                                }
                                onChange={(e) =>
                                  state?.updateSpecialCell(
                                    rowIndex,
                                    columnIndex,
                                    e.target.value
                                  )
                                }
                              />
                            </TableCell>
                          ))}

                          <TableCell>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                state?.removeSpecialRow(rowIndex)
                              }
                              disabled={
                                state?.quoteSpecialRows?.length === 1
                              }
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={state?.addSpecialRow}
                >
                  + Add Row
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={state?.addSpecialColumn}
                >
                  + Add Column
                </Button>
              </div>
            </section>
          )}

          <div className="flex justify-end border-t pt-6">
            <Button
              type="submit"
              disabled={state?.qouteGenerating}
            >
              {state?.qouteGenerating
                ? "Generating..."
                : "Generate Quotation"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}