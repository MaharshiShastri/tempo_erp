import { useMemo } from "react";

import SearchableMultiselect from "../components/shared/SearchableMultiselect";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
      <Label className="text-sm font-medium text-[var(--text-primary)]">
        {label}
      </Label>

      <Input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]"
        {...props}
      />
    </div>
  );

  const themedSelectTriggerClass =
    "w-full border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]";

  const themedSelectContentClass =
    "border-[var(--border-light)] bg-[var(--bg-surface)] text-[var(--text-primary)]";

  const themedSelectItemClass =
    "focus:bg-[var(--combobox-hover)] focus:text-[var(--text-primary)]";

  return (
    <Card className="gap-0 overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-0 text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
      <CardHeader className="border-b border-[var(--border-light)] bg-[var(--bg-muted)] px-5 py-4 md:px-6">
        <CardTitle className="text-lg font-semibold text-[var(--text-primary)]">
          Quotation Generator
        </CardTitle>

        <p className="text-sm text-[var(--text-muted)]">
          Generate quotations from the current Ex-Works price list
        </p>
      </CardHeader>

      <CardContent className="bg-[var(--bg-surface)] p-5 text-[var(--text-primary)] md:p-6">
        <form
          onSubmit={state?.handleGenerateQuote}
          className="space-y-8"
        >
          {/* Product Selection */}
          <section className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Product Selection
              </h3>

              <p className="text-sm text-[var(--text-muted)]">
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
                  state?.setQuoteSelectedItemCode([]);
                }}
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
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Customer Details
              </h3>

              <p className="text-sm text-[var(--text-muted)]">
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
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                <Checkbox
                  checked={!!state?.quoteDealer}
                  onCheckedChange={state?.setQuoteDealer}
                  className="border-[var(--border-light)] data-[state=checked]:border-[var(--brand-accent)] data-[state=checked]:bg-[var(--brand-accent)]"
                />

                Dealer quotation
              </label>

              <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                <Checkbox
                  checked={!!state?.quoteSpecialModel}
                  onCheckedChange={state?.handleSpecialModelChange}
                  className="border-[var(--border-light)] data-[state=checked]:border-[var(--brand-accent)] data-[state=checked]:bg-[var(--brand-accent)]"
                />

                Special Model
              </label>
            </div>

            {/* Pricing Configuration */}
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Financials
              </h3>

              <p className="text-sm text-[var(--text-muted)]">
                Configure pricing, packing, freight, and tax details.
              </p>
            </div>

            <div className="overflow-hidden rounded-lg border border-[var(--border-subtle)]">
              <div className="grid grid-cols-2 border-b border-[var(--border-light)] bg-[var(--bg-muted)]">
                <div className="px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                  Financial Input Details
                </div>

                <div className="border-l border-[var(--border-light)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                  Amount
                </div>
              </div>

              {/* Base Model Price */}
              <div className="grid grid-cols-2 border-b border-[var(--border-light)]">
                <div className="flex items-center px-4 py-3 text-sm font-medium text-[var(--text-primary)]">
                  Base Model Price
                </div>

                <div className="border-l border-[var(--border-light)] p-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={state?.quoteBaseModelPrice ?? ""}
                    onChange={(e) =>
                      state?.setQuoteBaseModelPrice(e.target.value)
                    }
                    placeholder="Enter base model price"
                    className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]"
                  />
                </div>
              </div>

              {/* Packing */}
              <div className="grid grid-cols-2 border-b border-[var(--border-light)]">
                <div className="p-2">
                  <Select
                    value={state?.quotePackingMode}
                    onValueChange={state?.setQuotePackingMode}
                  >
                    <SelectTrigger className={themedSelectTriggerClass}>
                      <SelectValue placeholder="Select packing mode" />
                    </SelectTrigger>

                    <SelectContent className={themedSelectContentClass}>
                      <SelectItem
                        value="INCLUSIVE"
                        className={themedSelectItemClass}
                      >
                        Packing - Inclusive
                      </SelectItem>

                      <SelectItem
                        value="ACTUAL"
                        className={themedSelectItemClass}
                      >
                        Packing - Actual
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-l border-[var(--border-light)] p-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={state?.quotePackingAmount ?? ""}
                    onChange={(e) =>
                      state?.setQuotePackingAmount(e.target.value)
                    }
                    placeholder={
                      state?.quotePackingMode === "ACTUAL"
                        ? "Enter packing amount"
                        : "Inclusive"
                    }
                    disabled={
                      state?.quotePackingMode !== "ACTUAL"
                    }
                    className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)] disabled:bg-[var(--bg-muted)] disabled:text-[var(--text-muted)]"
                  />
                </div>
              </div>

              {/* Freight */}
              <div className="grid grid-cols-2 border-b border-[var(--border-light)]">
                <div className="p-2">
                  <Select
                    value={state?.quoteFreightMode}
                    onValueChange={state?.setQuoteFreightMode}
                  >
                    <SelectTrigger className={themedSelectTriggerClass}>
                      <SelectValue placeholder="Select freight mode" />
                    </SelectTrigger>

                    <SelectContent className={themedSelectContentClass}>
                      <SelectItem
                        value="INCLUSIVE"
                        className={themedSelectItemClass}
                      >
                        Freight - Inclusive
                      </SelectItem>

                      <SelectItem
                        value="ACTUAL"
                        className={themedSelectItemClass}
                      >
                        Freight - Actual
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-l border-[var(--border-light)] p-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={state?.quoteFreightAmount ?? ""}
                    onChange={(e) =>
                      state?.setQuoteFreightAmount(e.target.value)
                    }
                    placeholder={
                      state?.quoteFreightMode === "ACTUAL"
                        ? "Enter freight amount"
                        : "Inclusive"
                    }
                    disabled={
                      state?.quoteFreightMode !== "ACTUAL"
                    }
                    className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)] disabled:bg-[var(--bg-muted)] disabled:text-[var(--text-muted)]"
                  />
                </div>
              </div>

              {/* Tax Rate */}
              <div className="grid grid-cols-2">
                <div className="flex items-center px-4 py-3 text-sm font-medium text-[var(--text-primary)]">
                  GST / Tax Rate (%)
                </div>

                <div className="border-l border-[var(--border-light)] p-2">
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
                    className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Special Model */}
          {state?.quoteSpecialModel && (
            <section className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Special Model Configuration
                </h3>

                <p className="text-sm text-[var(--text-muted)]">
                  Configure the special model parameters.
                </p>
              </div>

              <div className="overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[var(--border-light)] bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)]">
                      {state?.quoteSpecialColumns?.map(
                        (column, columnIndex) => (
                          <TableHead
                            key={columnIndex}
                            className="text-[var(--text-primary)]"
                          >
                            <Input
                              value={column}
                              onChange={(e) =>
                                state?.updateSpecialColumn(
                                  columnIndex,
                                  e.target.value
                                )
                              }
                              className="h-8 border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]"
                            />
                          </TableHead>
                        )
                      )}

                      <TableHead className="w-[100px] text-[var(--text-primary)]">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {state?.quoteSpecialRows?.map(
                      (row, rowIndex) => (
                        <TableRow
                          key={rowIndex}
                          className="border-b border-[var(--border-light)] hover:bg-[var(--combobox-hover)]"
                        >
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
                                className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]"
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
                              className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)]"
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
                  className="bg-[var(--brand-accent)] text-white shadow-[var(--shadow-sm)] hover:opacity-90"
                >
                  + Add Row
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={state?.addSpecialColumn}
                  className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)]"
                >
                  + Add Column
                </Button>
              </div>
            </section>
          )}

          <div className="flex justify-end border-t border-[var(--border-light)] pt-6">
            <Button
              type="submit"
              disabled={state?.qouteGenerating}
              className="min-w-[180px] bg-[var(--brand-accent)] text-white shadow-[var(--shadow-sm)] hover:opacity-90 disabled:opacity-50"
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
