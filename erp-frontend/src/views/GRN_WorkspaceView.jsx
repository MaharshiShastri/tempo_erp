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
    <div className="mx-auto w-full max-w-[1400px]">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FiPackage className="h-5 w-5" />
              Goods Receipt Note (GRN) Desk
            </CardTitle>

            <CardDescription>
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
              className="gap-2"
            >
              <FiUploadCloud className="h-4 w-4" />

              {isScanning ? "Processing OCR..." : "Scan Vendor Invoice"}
            </Button>
          </div>
        </CardHeader>

        {scannedData && (
          <CardContent className="space-y-6">
            {/* Header Information */}
            <Card>
              <CardContent className="grid gap-4 p-5 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="vendor-name">Vendor Name</Label>

                  <Input
                    id="vendor-name"
                    value={scannedData.vendor_name}
                    onChange={(e) =>
                      updateHeader("vendor_name", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice-number">
                    Vendor Invoice No.
                  </Label>

                  <Input
                    id="invoice-number"
                    value={scannedData.invoice_number}
                    onChange={(e) =>
                      updateHeader("invoice_number", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grn-number">
                    Internal GRN Assignment
                  </Label>

                  <Input
                    id="grn-number"
                    disabled
                    value={scannedData.grn_number}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Material Line Items */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold">
                  Material Line Items
                </h3>

                <p className="text-sm text-muted-foreground">
                  Review OCR results and verify material mappings.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addNewRow}
                className="gap-2"
              >
                <FiPlus className="h-4 w-4" />
                Add Row
              </Button>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="px-3 py-3 text-left font-medium">
                      Item Code *
                    </th>

                    <th className="px-3 py-3 text-left font-medium">
                      Description
                    </th>

                    <th className="px-3 py-3 text-left font-medium">
                      Qty
                    </th>

                    <th className="px-3 py-3 text-left font-medium">
                      Rate
                    </th>

                    <th className="bg-muted px-3 py-3 text-left font-medium">
                      Gross
                    </th>

                    <th className="px-3 py-3 text-left font-medium">
                      Disc %
                    </th>

                    <th className="bg-muted px-3 py-3 text-left font-medium">
                      Disc Amt
                    </th>

                    <th className="px-3 py-3 text-left font-medium text-primary">
                      Net Amt
                    </th>

                    <th className="w-12 px-3 py-3 text-center" />
                  </tr>
                </thead>

                <tbody>
                  {scannedData.items.map((item, idx) => (
                    <tr
                      key={idx}
                      className={`border-b last:border-0 ${
                        item.isMatched
                          ? "bg-background"
                          : "bg-destructive/5"
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
                              ? ""
                              : "border-destructive focus-visible:ring-destructive"
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
                          <div className="mt-1.5 flex items-center gap-1 text-xs font-medium text-destructive">
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
                          onChange={(e) =>
                            updateItem(
                              idx,
                              "item_name",
                              e.target.value
                            )
                          }
                        />

                        {item.item_description && (
                          <div className="mt-2 rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">
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
                      <td className="bg-muted/50 px-3 py-3 align-top font-medium text-muted-foreground">
                        ₹{(item.gross_amount || 0).toFixed(2)}
                      </td>

                      {/* Discount % */}
                      <td className="p-3 align-top">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.discount_percent || 0}
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
                      <td className="bg-muted/50 px-3 py-3 align-top font-medium text-destructive">
                        ₹{(item.discount_amount || 0).toFixed(2)}
                      </td>

                      {/* Net Amount */}
                      <td className="px-3 py-3 align-top font-semibold text-primary">
                        ₹{(item.net_amount || 0).toFixed(2)}
                      </td>

                      {/* Delete */}
                      <td className="px-3 py-3 text-center align-top">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
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
              <Card className="w-full sm:w-[360px]">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Gross Total:
                    </span>

                    <span className="font-semibold">
                      ₹{(scannedData.gross_total || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-destructive">
                      Total Item Discounts (-):
                    </span>

                    <span className="font-semibold text-destructive">
                      ₹{(scannedData.discount_total || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="border-t border-dashed pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        Subtotal (Taxable):
                      </span>

                      <span className="font-semibold">
                        ₹{(scannedData.subtotal || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      SGST (9%):
                    </span>

                    <span className="font-semibold">
                      ₹{scannedData.taxes.sgst.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      CGST (9%):
                    </span>

                    <span className="font-semibold">
                      ₹{scannedData.taxes.cgst.toFixed(2)}
                    </span>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between text-lg font-bold text-primary">
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
                className="gap-2"
              >
                <FiDownload className="h-4 w-4" />
                Export Excel
              </Button>

              <Button
                type="button"
                onClick={handleSaveInit}
                className="gap-2"
              >
                <FiSave className="h-4 w-4" />
                Confirm & Log BOM Receipt
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
        <DialogContent className="max-h-[90vh] max-w-[850px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <FiAlertCircle className="h-5 w-5" />
              Unmapped Components Detected
            </DialogTitle>

            <DialogDescription>
              We noticed items from the OCR scan that do not exist
              in your Product Master. Would you like to register them
              into the system now, or proceed with saving the GRN
              anyway?
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-2">
            {unmappedDrafts.map((draft, idx) => (
              <Card key={idx}>
                <CardContent className="p-4">
                  <div className="grid gap-4 md:grid-cols-[1fr_2fr_1fr]">
                    <div className="space-y-2">
                      <Label htmlFor={`draft-code-${idx}`}>
                        Internal Item Code
                      </Label>

                      <Input
                        id={`draft-code-${idx}`}
                        value={draft.item_code}
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
                      <Label htmlFor={`draft-name-${idx}`}>
                        Item Name / Description
                      </Label>

                      <Input
                        id={`draft-name-${idx}`}
                        value={draft.item_name}
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
                      <Label htmlFor={`draft-group-${idx}`}>
                        Inventory Group
                      </Label>

                      <Input
                        id={`draft-group-${idx}`}
                        list="inventory-groups-list"
                        value={draft.item_group}
                        placeholder="Select or type new..."
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

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowUnmappedModal(false)}
            >
              Cancel & Review Table
            </Button>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={handleProceedWithoutAdding}
              >
                Save GRN Without Registering
              </Button>

              <Button
                type="button"
                onClick={handleRegisterAndSave}
                className="gap-2"
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