import {
  FiUploadCloud,
  FiPlus,
  FiTrash2,
  FiSave,
  FiDownload,
  FiAlertCircle,
  FiPackage,
} from "react-icons/fi";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const themedInputClass =
  "border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]";

const themedCardClass =
  "border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]";

export default function GRN_WorkspaceView({ state }) {
  const {
    scannedData,
    isScanning,
    fileInputRef,
    handleFileUpload,
    updateHeader,
    updateItem,
    verifyItemCode,
    addNewRow,
    removeRow,
    exportExcel,
    handleSaveInit,
    showUnmappedModal,
    setShowUnmappedModal,
    unmappedDrafts,
    handleDraftChange,
    handleRegisterAndSave,
    handleProceedWithoutAdding,
  } = state;

  return (
    <div className="mx-auto w-full max-w-[1400px] bg-[var(--bg-main)] text-[var(--text-primary)]">
      <Card className={themedCardClass}>
        <CardHeader className="flex flex-col gap-4 border-b border-[var(--border-light)] md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
              <FiPackage className="h-5 w-5 text-[var(--brand-accent)]" />
              Goods Receipt Note (GRN) Desk
            </CardTitle>

            <CardDescription className="text-[var(--text-muted)]">
              Vendor Invoice to BOM Auto-Mapper
            </CardDescription>
          </div>

          <div>
            <input
              type="file"
              accept="image/jpeg, image/png, application/pdf"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
            />

            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              className="gap-2 bg-[var(--brand-accent)] text-white hover:opacity-90"
            >
              <FiUploadCloud className="h-4 w-4" />

              {isScanning ? "Processing OCR..." : "Scan Vendor Invoice"}
            </Button>
          </div>
        </CardHeader>

        {scannedData && (
          <CardContent className="space-y-6">
            {/* Header Information */}
            <Card className={themedCardClass}>
              <CardContent className="grid gap-4 p-5 md:grid-cols-3">
                <div className="space-y-2">
                  <Label
                    htmlFor="vendor-name"
                    className="text-[var(--text-primary)]"
                  >
                    Vendor Name
                  </Label>

                  <Input
                    id="vendor-name"
                    value={scannedData.vendor_name}
                    className={themedInputClass}
                    onChange={(e) =>
                      updateHeader("vendor_name", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="invoice-number"
                    className="text-[var(--text-primary)]"
                  >
                    Vendor Invoice No.
                  </Label>

                  <Input
                    id="invoice-number"
                    value={scannedData.invoice_number}
                    className={themedInputClass}
                    onChange={(e) =>
                      updateHeader("invoice_number", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="grn-number"
                    className="text-[var(--text-primary)]"
                  >
                    Internal GRN Assignment
                  </Label>

                  <Input
                    id="grn-number"
                    disabled
                    value={scannedData.grn_number}
                    className={themedInputClass}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Material Line Items */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Material Line Items
                </h3>

                <p className="text-sm text-[var(--text-muted)]">
                  Review OCR results and verify material mappings.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addNewRow}
                className="gap-2 border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)] hover:text-[var(--text-primary)]"
              >
                <FiPlus className="h-4 w-4" />
                Add Row
              </Button>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto rounded-md border border-[var(--border-light)]">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="bg-[var(--bg-muted)]">
                  <tr className="border-b border-[var(--border-light)]">
                    <th className="px-3 py-3 text-left font-medium text-[var(--text-primary)]">
                      Item Code *
                    </th>

                    <th className="px-3 py-3 text-left font-medium text-[var(--text-primary)]">
                      Description
                    </th>

                    <th className="px-3 py-3 text-left font-medium text-[var(--text-primary)]">
                      Qty
                    </th>

                    <th className="px-3 py-3 text-left font-medium text-[var(--text-primary)]">
                      Rate
                    </th>

                    <th className="bg-[var(--bg-muted)] px-3 py-3 text-left font-medium text-[var(--text-primary)]">
                      Gross
                    </th>

                    <th className="px-3 py-3 text-left font-medium text-[var(--text-primary)]">
                      Disc %
                    </th>

                    <th className="bg-[var(--bg-muted)] px-3 py-3 text-left font-medium text-[var(--text-primary)]">
                      Disc Amt
                    </th>

                    <th className="px-3 py-3 text-left font-medium text-[var(--brand-accent)]">
                      Net Amt
                    </th>

                    <th className="w-12 px-3 py-3 text-center" />
                  </tr>
                </thead>

                <tbody>
                  {scannedData.items.map((item, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-[var(--border-light)] last:border-0 ${
                        item.isMatched
                          ? "bg-[var(--bg-main)]"
                          : "bg-[var(--warning-row)]"
                      }`}
                    >
                      {/* Item Code */}
                      <td className="p-3 align-top">
                        <Input
                          value={item.item_code}
                          required
                          placeholder="Code..."
                          className={
                            item.isMatched
                              ? themedInputClass
                              : `${themedInputClass} border-[var(--brand-danger)] focus:border-[var(--brand-danger)] focus:ring-[var(--brand-danger)]`
                          }
                          onChange={(e) =>
                            updateItem(
                              idx,
                              "item_code",
                              e.target.value
                            )
                          }
                          onBlur={(e) =>
                            verifyItemCode(idx, e.target.value)
                          }
                        />

                        {!item.isMatched && (
                          <div className="mt-1.5 flex items-center gap-1 text-xs font-medium text-[var(--brand-danger)]">
                            <FiAlertCircle className="h-3.5 w-3.5" />
                            Unmapped
                          </div>
                        )}
                      </td>

                      {/* Description */}
                      <td className="p-3 align-top">
                        <Input
                          value={item.item_name}
                          required
                          className={themedInputClass}
                          onChange={(e) =>
                            updateItem(
                              idx,
                              "item_name",
                              e.target.value
                            )
                          }
                        />

                        {item.item_description && (
                          <div className="mt-2 rounded-md border border-[var(--border-light)] bg-[var(--bg-muted)] p-2 text-xs text-[var(--text-muted)]">
                            <span className="font-semibold text-[var(--text-primary)]">
                              Matched Spec:
                            </span>

                            <br />

                            {item.item_description}
                          </div>
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="p-3 align-top">
                        <Input
                          type="number"
                          value={item.quantity}
                          required
                          className={themedInputClass}
                          onChange={(e) =>
                            updateItem(
                              idx,
                              "quantity",
                              e.target.value
                            )
                          }
                        />
                      </td>

                      {/* Rate */}
                      <td className="p-3 align-top">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.rate}
                          required
                          className={themedInputClass}
                          onChange={(e) =>
                            updateItem(
                              idx,
                              "rate",
                              e.target.value
                            )
                          }
                        />
                      </td>

                      {/* Gross */}
                      <td className="bg-[var(--bg-muted)] px-3 py-3 align-top font-medium text-[var(--text-muted)]">
                        ₹{(item.gross_amount || 0).toFixed(2)}
                      </td>

                      {/* Discount % */}
                      <td className="p-3 align-top">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.discount_percent || 0}
                          className={themedInputClass}
                          onChange={(e) =>
                            updateItem(
                              idx,
                              "discount_percent",
                              e.target.value
                            )
                          }
                        />
                      </td>

                      {/* Discount Amount */}
                      <td className="bg-[var(--bg-muted)] px-3 py-3 align-top font-medium text-[var(--brand-danger)]">
                        ₹{(item.discount_amount || 0).toFixed(2)}
                      </td>

                      {/* Net Amount */}
                      <td className="px-3 py-3 align-top font-semibold text-[var(--brand-accent)]">
                        ₹{(item.net_amount || 0).toFixed(2)}
                      </td>

                      {/* Delete */}
                      <td className="px-3 py-3 text-center align-top">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-[var(--brand-danger)] hover:bg-[var(--warning-row)] hover:text-[var(--brand-danger)]"
                          onClick={() => removeRow(idx)}
                          title="Delete Row"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <Card
                className={`w-full sm:w-[360px] ${themedCardClass}`}
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-muted)]">
                      Gross Total:
                    </span>

                    <span className="font-semibold text-[var(--text-primary)]">
                      ₹{(scannedData.gross_total || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--brand-danger)]">
                      Total Item Discounts (-):
                    </span>

                    <span className="font-semibold text-[var(--brand-danger)]">
                      ₹{(scannedData.discount_total || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="border-t border-dashed border-[var(--border-light)] pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-[var(--text-primary)]">
                        Subtotal (Taxable):
                      </span>

                      <span className="font-semibold text-[var(--text-primary)]">
                        ₹{(scannedData.subtotal || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-muted)]">
                      SGST (9%):
                    </span>

                    <span className="font-semibold text-[var(--text-primary)]">
                      ₹{scannedData.taxes.sgst.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-muted)]">
                      CGST (9%):
                    </span>

                    <span className="font-semibold text-[var(--text-primary)]">
                      ₹{scannedData.taxes.cgst.toFixed(2)}
                    </span>
                  </div>

                  <div className="border-t border-[var(--border-light)] pt-3">
                    <div className="flex items-center justify-between text-lg font-bold text-[var(--brand-accent)]">
                      <span>Grand Total:</span>

                      <span>
                        ₹{scannedData.grand_total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={exportExcel}
                className="gap-2 border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)] hover:text-[var(--text-primary)]"
              >
                <FiDownload className="h-4 w-4" />
                Export Excel
              </Button>

              <Button
                type="button"
                onClick={handleSaveInit}
                className="gap-2 bg-[var(--brand-success)] text-white hover:opacity-90"
              >
                <FiSave className="h-4 w-4" />
                Confirm & Log GRN
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Unmapped Components Dialog */}
      <Dialog
        open={showUnmappedModal}
        onOpenChange={setShowUnmappedModal}
      >
        <DialogContent className="max-h-[90vh] max-w-[850px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--brand-danger)]">
              <FiAlertCircle className="h-5 w-5" />
              Unmapped Components Detected
            </DialogTitle>

            <DialogDescription className="text-[var(--text-muted)]">
              We noticed items from the OCR scan that do not exist
              in your Product Master. Would you like to register them
              into the system now, or proceed with saving the GRN
              anyway?
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-2">
            {unmappedDrafts.map((draft, idx) => (
              <Card
                key={idx}
                className={themedCardClass}
              >
                <CardContent className="p-4">
                  <div className="grid gap-4 md:grid-cols-[1fr_2fr_1fr]">
                    <div className="space-y-2">
                      <Label
                        htmlFor={`draft-code-${idx}`}
                        className="text-[var(--text-primary)]"
                      >
                        Internal Item Code
                      </Label>

                      <Input
                        id={`draft-code-${idx}`}
                        value={draft.item_code}
                        className={themedInputClass}
                        onChange={(e) =>
                          handleDraftChange(
                            idx,
                            "item_code",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor={`draft-name-${idx}`}
                        className="text-[var(--text-primary)]"
                      >
                        Item Name / Description
                      </Label>

                      <Input
                        id={`draft-name-${idx}`}
                        value={draft.item_name}
                        className={themedInputClass}
                        onChange={(e) =>
                          handleDraftChange(
                            idx,
                            "item_name",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor={`draft-group-${idx}`}
                        className="text-[var(--text-primary)]"
                      >
                        Inventory Group
                      </Label>

                      <Input
                        id={`draft-group-${idx}`}
                        list="inventory-groups-list"
                        value={draft.item_group}
                        placeholder="Select or type new..."
                        className={themedInputClass}
                        onChange={(e) =>
                          handleDraftChange(
                            idx,
                            "item_group",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <datalist id="inventory-groups-list">
            <option value="Raw Material" />
            <option value="Consumable" />
            <option value="Sub-Assembly" />
          </datalist>

          <DialogFooter className="flex-col gap-2 border-t border-[var(--border-light)] pt-4 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowUnmappedModal(false)}
              className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)] hover:text-[var(--text-primary)]"
            >
              Cancel & Review Table
            </Button>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={handleProceedWithoutAdding}
                className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)] hover:text-[var(--text-primary)]"
              >
                Save GRN Without Registering
              </Button>

              <Button
                type="button"
                onClick={handleRegisterAndSave}
                className="gap-2 bg-[var(--brand-success)] text-white hover:opacity-90"
              >
                <FiSave className="h-4 w-4" />
                Register Items & Save GRN
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}