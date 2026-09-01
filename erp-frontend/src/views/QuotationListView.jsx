import { useMemo } from "react";

import QuotationKpiCards from "../components/Quotation/QuotationKpiCards";
import QuotationTable from "../components/Quotation/QuotationTable";
import QuotationDetailsModal from "../components/Quotation/QuotationDetailsModal";
import QuotationDeleteModal from "../components/Quotation/QuotationDeleteModal";
import QuotationChangeModal from "../components/Quotation/QuotationChangeModal";

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function QuotationListView({ state }) {
  const quotations = useMemo(() => {
    const list = Array.isArray(state?.quotations)
      ? state.quotations
      : [];

    return [...list].sort(
      (a, b) =>
        new Date(b.generated_at || 0) -
        new Date(a.generated_at || 0)
    );
  }, [state?.quotations]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            📄 Quotation Register
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Sales quotation lifecycle and conversion tracking
          </p>
        </div>

        <Button
          onClick={() =>
            state.setActiveTab("quote-generation")
          }
        >
          + New Quotation
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        <QuotationKpiCards quotations={quotations} />

        <QuotationTable
          quotations={quotations}
          onView={state.openQuotation}
          onEdit={state.editQuotation}
          onOrder={(quotation) =>state.updateQuotationStatus(quotation, "ORDERED")}
          onReject={(quotation) =>state.updateQuotationStatus(quotation, "REJECTED")}
          onChanged={state.openQuotationChange}
          onDownload={state.downloadQuotation}
          onOrderBooking={state.downloadQuotationOrderBooking}
        />

        <QuotationDeleteModal
          quotation={
            state.quotationDeleteOpen
              ? state.selectedQuotation
              : null
          }
          onCancel={() => {
            state.setQuotationDeleteOpen(false);
            state.setSelectedQuotation(null);
          }}
          onConfirm={state.deactivateQuotation}
        />

        <QuotationDetailsModal
          quotation={
            state.quotationModalOpen
              ? state.selectedQuotation
              : null
          }
          editMode={state.quotationEditMode}
          editForm={state.quotationEditForm}
          saving={state.quotationSaving}
          onChange={state.updateQuotationField}
          onSave={state.saveQuotationChanges}
          onClose={state.closeQuotationModal}
          onEdit={() =>
            state.editQuotation(
              state.selectedQuotation
            )
          }
        />

        <QuotationChangeModal
          quotation={
            state.quotationChangeOpen
              ? state.selectedQuotation
              : null
          }
          form={state.quotationChangeForm}
          onChange={state.updateQuotationChangeField}
          onCancel={state.closeQuotationChange}
          onSubmit={state.submitQuotationChange}
        />
      </CardContent>
    </Card>
  );
}