import React, { useMemo } from "react";

import QuotationKpiCards from "../components/Quotation/QuotationKpiCards";

import QuotationTable from "../components/Quotation/QuotationTable";

import QuotationDetailsModal from "../components/Quotation/QuotationDetailsModal";

import QuotationDeleteModal from "../components/Quotation/QuotationDeleteModal";

import QuotationChangeModal from "../components/Quotation/QuotationChangeModal";

export default function QuotationListView({state,}) {

    const quotations = useMemo(() => {

        const list =
            Array.isArray(
                state?.quotations
            )
                ? state.quotations
                : [];

        return [...list].sort(
            (a, b) =>
                new Date(
                    b.generated_at || 0
                ) -
                new Date(
                    a.generated_at || 0
                )
        );

    }, [state?.quotations]);


    return (
        <div className="frappe-card">

            <div className="system-header">

                <div>
                    <h3>
                        📄 Quotation Register
                    </h3>

                    <p
                        style={{
                            margin: "4px 0 0",
                            color:
                                "var(--text-muted)",
                            fontSize: 13,
                        }}
                    >
                        Sales quotation lifecycle
                        and conversion tracking
                    </p>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={() =>
                        state.setActiveTab(
                            "quote-generation"
                        )
                    }
                >
                    + New Quotation
                </button>

            </div>


            <QuotationKpiCards
                quotations={quotations}
            />


            <QuotationTable
                quotations={quotations}
                onView={state.openQuotation}
                onEdit={state.editQuotation}
                onOrder={quotation =>
                    state.updateQuotationStatus(
                        quotation,
                        "ORDERED"
                    )
                }
                onReject={quotation =>
                    state.updateQuotationStatus(
                        quotation,
                        "REJECTED"
                    )
                }
                onChanged={
                    state.openQuotationChange
                }
                onDownload={
                    state.downloadQuotation
                }
            />


            <QuotationDeleteModal
                quotation={
                    state.quotationDeleteOpen
                        ? state.selectedQuotation
                        : null
                }
                onCancel={() => {
                    state.setQuotationDeleteOpen(
                        false
                    );
                    state.setSelectedQuotation(
                        null
                    );
                }}
                onConfirm={
                    state.deactivateQuotation
                }
            />


            <QuotationDetailsModal
                quotation={
                    state.quotationModalOpen
                        ? state.selectedQuotation
                        : null
                }
                editMode={
                    state.quotationEditMode
                }
                editForm={
                    state.quotationEditForm
                }
                saving={
                    state.quotationSaving
                }
                onChange={
                    state.updateQuotationField
                }
                onSave={
                    state.saveQuotationChanges
                }
                onClose={
                    state.closeQuotationModal
                }
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
                form={
                    state.quotationChangeForm
                }
                onChange={
                    state.updateQuotationChangeField
                }
                onCancel={
                    state.closeQuotationChange
                }
                onSubmit={
                    state.submitQuotationChange
                }
            />

        </div>
    );
}