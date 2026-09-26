import React from "react";
import SearchBox from "../components/SearchBox";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    FileText,
    Loader2,
    Plus,
    Search,
    Trash2,
    Sparkles,
    ArrowLeft,
    Save,
} from "lucide-react";

const themedInputClass =
    "border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]";

const themedSelectTriggerClass =
    "border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]";

const themedSelectContentClass =
    "border-[var(--border-light)] bg-[var(--bg-surface)] text-[var(--text-primary)]";

const themedSelectItemClass =
    "focus:bg-[var(--combobox-hover)] focus:text-[var(--text-primary)]";

export default function OrderEntryFormView({ state }) {
    const {
        orderHeader,
        setOrderHeader,
        orderItems,
        appendOrderItemRow,
        popOrderItemRow,
        updateOrderItemField,

        handleCustomerMasterSelection,

        oaSuggestions,
        showOaSuggestions,
        oaInputRef,
        handleOaInputChange,
        handleOaSelect,
        handleOaSearch,
        setShowOaSuggestions,

        isNewClient,
        setIsNewClient,

        temporaryClientName,
        setTemporaryClientName,

        handleFormSubmit,
        totals,

        isOcrLoading,

        isBillingSameAsCustomer,
        setIsBillingSameAsCustomer,

        itemsMaster,
        setActiveTab,

        handleItemMasterSelection,
    } = state;

    const today = new Date().toISOString().split("T")[0];

    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 5);

    const maxDateString = maxFutureDate.toISOString().split("T")[0];

    const updateHeaderField = (field, value) => {
        setOrderHeader((current) => ({
            ...current,
            [field]: value,
        }));
    };

    return (
        <div className="mx-auto w-full max-w-[1400px] bg-[var(--bg-main)] px-4 py-6 text-[var(--text-primary)]">
            <Card className="overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
                {/* Header */}
                <CardHeader className="border-b border-[var(--border-light)] bg-[var(--bg-muted)] px-6 py-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]">
                                <FileText className="size-5" />
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                                    Establish Order Acceptance
                                </h2>

                                <p className="mt-1 text-sm text-[var(--text-muted)]">
                                    Create and register a new customer order
                                    acceptance against the corporate master.
                                </p>
                            </div>
                        </div>

                        {/* AI OCR */}
                        <div className="relative shrink-0">
                            <input
                                type="file"
                                accept="image/png, image/jpeg, application/pdf"
                                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                                disabled={isOcrLoading}
                            />

                            <Button
                                type="button"
                                variant="outline"
                                disabled={isOcrLoading}
                                className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--brand-accent)] hover:bg-[var(--combobox-hover)]"
                            >
                                {isOcrLoading ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Scanning Document...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 size-4" />
                                        Auto-Fill via AI OCR
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <form onSubmit={handleFormSubmit}>
                    <CardContent className="space-y-8 px-6 py-6">
                        {/* ================================================== */}
                        {/* ORDER INFORMATION */}
                        {/* ================================================== */}

                        <section className="space-y-5">
                            <div>
                                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                                    Order Information
                                </h3>

                                <p className="mt-1 text-xs text-[var(--text-muted)]">
                                    Core order acceptance and delivery
                                    information.
                                </p>
                            </div>

                            <Separator className="bg-[var(--border-light)]" />

                            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                                {/* OA ID */}
                                <div
                                    ref={oaInputRef}
                                    className="relative space-y-2"
                                >
                                    <Label
                                        htmlFor="order-acceptance-id"
                                        className="text-[var(--text-primary)]"
                                    >
                                        Order Acceptance ID
                                        <span className="ml-1 text-[var(--brand-danger)]">
                                            *
                                        </span>
                                    </Label>

                                    <div className="flex gap-2">
                                        <Input
                                            id="order-acceptance-id"
                                            required
                                            value={
                                                orderHeader.order_acceptance_id
                                            }
                                            onChange={handleOaInputChange}
                                            onFocus={() => {
                                                if (
                                                    oaSuggestions.length > 0
                                                ) {
                                                    setShowOaSuggestions(
                                                        true
                                                    );
                                                }
                                            }}
                                            placeholder="XXX/000"
                                            maxLength={7}
                                            autoComplete="off"
                                            className={themedInputClass}
                                        />

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                handleOaSearch(
                                                    orderHeader.order_acceptance_id
                                                )
                                            }
                                            className="shrink-0 border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)]"
                                        >
                                            <Search className="mr-2 size-4 text-[var(--brand-accent)]" />
                                            Lookup
                                        </Button>
                                    </div>

                                    {/* OA Suggestions */}
                                    {showOaSuggestions &&
                                        oaSuggestions.length > 0 && (
                                            <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-[var(--border-light)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
                                                <div className="border-b border-[var(--border-light)] bg-[var(--bg-muted)] px-3 py-2 text-xs font-medium text-[var(--text-muted)]">
                                                    Order Acceptance
                                                    recommendations
                                                </div>

                                                <div className="max-h-56 overflow-y-auto">
                                                    {oaSuggestions.map(
                                                        (oa, index) => {
                                                            const isMatch =
                                                                oa
                                                                    .toLowerCase()
                                                                    .includes(
                                                                        orderHeader.order_acceptance_id.toLowerCase()
                                                                    );

                                                            return (
                                                                <button
                                                                    key={index}
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleOaSelect(
                                                                            oa
                                                                        )
                                                                    }
                                                                    className="block w-full border-b border-[var(--border-light)] px-3 py-2.5 text-left text-sm transition-colors last:border-b-0 hover:bg-[var(--combobox-hover)] focus:bg-[var(--combobox-hover)] focus:outline-none"
                                                                >
                                                                    <span
                                                                        className={
                                                                            isMatch
                                                                                ? "font-semibold text-[var(--brand-accent)]"
                                                                                : "font-normal text-[var(--text-primary)]"
                                                                        }
                                                                    >
                                                                        {oa}
                                                                    </span>
                                                                </button>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </div>

                                {/* PO Reference */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="customer-po-ref"
                                        className="text-[var(--text-primary)]"
                                    >
                                        Customer PO Reference
                                        <span className="ml-1 text-[var(--brand-danger)]">
                                            *
                                        </span>
                                    </Label>

                                    <Input
                                        id="customer-po-ref"
                                        required
                                        value={
                                            orderHeader.purchase_order_number
                                        }
                                        onChange={(e) =>
                                            updateHeaderField(
                                                "purchase_order_number",
                                                e.target.value
                                            )
                                        }
                                        placeholder="PO-XXXX"
                                        className={themedInputClass}
                                    />
                                </div>

                                {/* Acceptance Date */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="acceptance-date"
                                        className="text-[var(--text-primary)]"
                                    >
                                        Acceptance Date
                                        <span className="ml-1 text-[var(--brand-danger)]">
                                            *
                                        </span>
                                    </Label>

                                    <Input
                                        id="acceptance-date"
                                        type="date"
                                        required
                                        max={today}
                                        value={
                                            orderHeader.order_acceptance_date
                                        }
                                        onChange={(e) =>
                                            updateHeaderField(
                                                "order_acceptance_date",
                                                e.target.value
                                            )
                                        }
                                        className={themedInputClass}
                                    />
                                </div>

                                {/* PO Date */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="po-date"
                                        className="text-[var(--text-primary)]"
                                    >
                                        Customer PO Date
                                        <span className="ml-1 text-[var(--brand-danger)]">
                                            *
                                        </span>
                                    </Label>

                                    <Input
                                        id="po-date"
                                        type="date"
                                        required
                                        max={today}
                                        value={
                                            orderHeader.purchase_order_date
                                        }
                                        onChange={(e) =>
                                            updateHeaderField(
                                                "purchase_order_date",
                                                e.target.value
                                            )
                                        }
                                        className={themedInputClass}
                                    />
                                </div>

                                {/* Due Date */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="delivery-due-date"
                                        className="text-[var(--text-primary)]"
                                    >
                                        Delivery Expiry Due Date
                                        <span className="ml-1 text-[var(--brand-danger)]">
                                            *
                                        </span>
                                    </Label>

                                    <Input
                                        id="delivery-due-date"
                                        type="date"
                                        required
                                        min={today}
                                        max={maxDateString}
                                        value={orderHeader.due_date}
                                        onChange={(e) => {
                                            const value = e.target.value;

                                            if (value) {
                                                const yearPart =
                                                    value.split("-")[0];

                                                if (yearPart.length > 4) {
                                                    return;
                                                }
                                            }

                                            updateHeaderField(
                                                "due_date",
                                                value
                                            );
                                        }}
                                        className={themedInputClass}
                                    />
                                </div>

                                {/* Payment Terms */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="payment-terms"
                                        className="text-[var(--text-primary)]"
                                    >
                                        Payment Terms
                                    </Label>

                                    <Input
                                        id="payment-terms"
                                        value={orderHeader.payment_terms}
                                        onChange={(e) =>
                                            updateHeaderField(
                                                "payment_terms",
                                                e.target.value
                                            )
                                        }
                                        placeholder="e.g. Net 30 Days"
                                        className={themedInputClass}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* ================================================== */}
                        {/* CUSTOMER MASTER */}
                        {/* ================================================== */}

                        <section className="space-y-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                                        Customer Master Registry
                                    </h3>

                                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                                        Link this order to an existing customer
                                        or register a temporary client.
                                    </p>
                                </div>

                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className={
                                        isNewClient
                                            ? "border-[var(--brand-danger)] bg-[var(--warning-row)] text-[var(--brand-danger)] hover:opacity-90"
                                            : "border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)]"
                                    }
                                    onClick={() => {
                                        setIsNewClient(!isNewClient);

                                        if (!isNewClient) {
                                            setOrderHeader((previous) => ({
                                                ...previous,
                                                customer_code: "",
                                            }));
                                        }
                                    }}
                                >
                                    {isNewClient ? (
                                        <>
                                            <ArrowLeft className="mr-2 size-3.5" />
                                            Link Existing Client Instead
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="mr-2 size-3.5" />
                                            Register New Client
                                        </>
                                    )}
                                </Button>
                            </div>

                            <Separator className="bg-[var(--border-light)]" />

                            {!isNewClient ? (
                                <div className="space-y-3">
                                    <SearchBox
                                        searchUrl="/api/v1/orders/search/companies"
                                        placeholder="Search customer by name or code..."
                                        onSelect={(cust) =>
                                            handleCustomerMasterSelection(
                                                cust.id
                                            )
                                        }
                                    />

                                    {orderHeader.customer_name && (
                                        <div className="flex flex-col gap-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-muted)] px-4 py-3 text-sm sm:flex-row sm:items-center">
                                            <span className="text-[var(--text-primary)]">
                                                Selected Customer:{" "}
                                                <strong>
                                                    {
                                                        orderHeader.customer_name
                                                    }
                                                </strong>
                                            </span>

                                            {!orderHeader.customer_code && (
                                                <Badge
                                                    variant="outline"
                                                    className="w-fit border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--brand-accent)]"
                                                >
                                                    Not registered yet
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="temporary-client"
                                        className="text-[var(--text-primary)]"
                                    >
                                        Temporary Client Corporate Name
                                        <span className="ml-1 text-[var(--brand-danger)]">
                                            *
                                        </span>
                                    </Label>

                                    <Input
                                        id="temporary-client"
                                        type="text"
                                        required
                                        className={`${themedInputClass} border-dashed border-[var(--brand-success)]`}
                                        value={temporaryClientName}
                                        onChange={(e) => {
                                            const value = e.target.value;

                                            setTemporaryClientName(value);

                                            if (
                                                isBillingSameAsCustomer
                                            ) {
                                                setOrderHeader((previous) => ({
                                                    ...previous,
                                                    billing_name: value,
                                                }));
                                            }
                                        }}
                                        placeholder="Enter temporary client corporate name..."
                                    />
                                </div>
                            )}
                        </section>

                        {/* ================================================== */}
                        {/* BILLING */}
                        {/* ================================================== */}

                        <section className="space-y-5">
                            <div>
                                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                                    Billing Configuration
                                </h3>

                                <p className="mt-1 text-xs text-[var(--text-muted)]">
                                    Configure whether billing information should
                                    match the customer entity.
                                </p>
                            </div>

                            <Separator className="bg-[var(--border-light)]" />

                            <div className="flex flex-col gap-3 rounded-lg border border-[var(--border-light)] bg-[var(--bg-muted)] p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id="billing-same"
                                        checked={isBillingSameAsCustomer}
                                        onCheckedChange={(checked) =>
                                            setIsBillingSameAsCustomer(
                                                checked === true
                                            )
                                        }
                                        className="border-[var(--border-light)] data-[state=checked]:border-[var(--brand-accent)] data-[state=checked]:bg-[var(--brand-accent)]"
                                    />

                                    <div className="space-y-1">
                                        <Label
                                            htmlFor="billing-same"
                                            className="cursor-pointer font-medium text-[var(--text-primary)]"
                                        >
                                            Billing parameters and Customer
                                            Entity details are identical
                                        </Label>

                                        <p className="text-xs text-[var(--text-muted)]">
                                            Disable this if the commercial
                                            billing entity is different.
                                        </p>
                                    </div>
                                </div>

                                <Badge
                                    variant="outline"
                                    className={
                                        isBillingSameAsCustomer
                                            ? "w-fit border-[var(--brand-success)]/30 bg-[var(--brand-success)]/10 text-[var(--brand-success)]"
                                            : "w-fit border-[var(--brand-danger)]/30 bg-[var(--warning-row)] text-[var(--brand-danger)]"
                                    }
                                >
                                    {isBillingSameAsCustomer
                                        ? "AUTO-MATCH ON"
                                        : "OVERRIDE OFF"}
                                </Badge>
                            </div>

                            {!isBillingSameAsCustomer && (
                                <div className="space-y-5 rounded-lg border border-[var(--brand-danger)]/30 bg-[var(--warning-row)] p-4">
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="billing-name"
                                            className="text-[var(--brand-danger)]"
                                        >
                                            Override Billing Corporate Legal
                                            Name
                                            <span className="ml-1">*</span>
                                        </Label>

                                        <Input
                                            id="billing-name"
                                            required
                                            value={orderHeader.billing_name}
                                            onChange={(e) =>
                                                updateHeaderField(
                                                    "billing_name",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Enter distinct commercial recipient name..."
                                            className={themedInputClass}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="billing-address"
                                            className="text-[var(--brand-danger)]"
                                        >
                                            Override Billing Core Street
                                            Address
                                            <span className="ml-1">*</span>
                                        </Label>

                                        <Textarea
                                            id="billing-address"
                                            required
                                            rows={3}
                                            value={orderHeader.billing_address}
                                            onChange={(e) =>
                                                updateHeaderField(
                                                    "billing_address",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Enter distinct billing/logistics address..."
                                            className={themedInputClass}
                                        />
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* ================================================== */}
                        {/* LINE ITEMS */}
                        {/* ================================================== */}

                        <section className="space-y-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                                        Order Line Items
                                    </h3>

                                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                                        Add products, specifications,
                                        quantities, rates and discounts.
                                    </p>
                                </div>

                                <Badge
                                    variant="outline"
                                    className="w-fit border-[var(--border-light)] bg-[var(--bg-muted)] text-[var(--text-primary)]"
                                >
                                    {orderItems.length}{" "}
                                    {orderItems.length === 1
                                        ? "Line"
                                        : "Lines"}
                                </Badge>
                            </div>

                            <Separator className="bg-[var(--border-light)]" />

                            <div className="overflow-x-auto rounded-lg border border-[var(--border-light)]">
                                <table className="w-full min-w-[1100px] text-sm text-[var(--text-primary)]">
                                    <thead className="bg-[var(--bg-muted)]">
                                        <tr className="border-b border-[var(--border-light)]">
                                            <th className="px-3 py-3 text-left font-medium">
                                                Target Stock Code
                                            </th>

                                            <th className="px-3 py-3 text-left font-medium">
                                                Specifications Description
                                            </th>

                                            <th className="px-3 py-3 text-left font-medium">
                                                HSN Code
                                            </th>

                                            <th className="px-3 py-3 text-left font-medium">
                                                Qty
                                            </th>

                                            <th className="px-3 py-3 text-left font-medium">
                                                Per
                                            </th>

                                            <th className="px-3 py-3 text-left font-medium">
                                                Rate
                                            </th>

                                            <th className="px-3 py-3 text-left font-medium">
                                                Disc %
                                            </th>

                                            <th className="px-3 py-3 text-right font-medium">
                                                Amount
                                            </th>

                                            <th className="px-3 py-3 text-center font-medium">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {orderItems.map((item, index) => {
                                            const lineTotal =
                                                (item.quantity || 0) *
                                                (item?.rate || 0) *
                                                (1 -
                                                    (item.discount_percentage ||
                                                        0) /
                                                        100);

                                            return (
                                                <tr
                                                    key={index}
                                                    className="border-b border-[var(--border-light)] last:border-b-0 hover:bg-[var(--combobox-hover)]"
                                                >
                                                    {/* Item */}
                                                    <td className="p-2 align-top">
                                                        <Select
                                                            value={
                                                                item.item_code ||
                                                                ""
                                                            }
                                                            onValueChange={(
                                                                value
                                                            ) =>
                                                                handleItemMasterSelection(
                                                                    index,
                                                                    value
                                                                )
                                                            }
                                                            required
                                                        >
                                                            <SelectTrigger
                                                                className={
                                                                    themedSelectTriggerClass
                                                                }
                                                            >
                                                                <SelectValue placeholder="Choose item" />
                                                            </SelectTrigger>

                                                            <SelectContent
                                                                className={
                                                                    themedSelectContentClass
                                                                }
                                                            >
                                                                {itemsMaster?.map(
                                                                    (im) => (
                                                                        <SelectItem
                                                                            key={
                                                                                im.item_code
                                                                            }
                                                                            value={
                                                                                im.item_code
                                                                            }
                                                                            className={
                                                                                themedSelectItemClass
                                                                            }
                                                                        >
                                                                            {
                                                                                im.item_code
                                                                            }
                                                                        </SelectItem>
                                                                    )
                                                                )}

                                                                <SelectItem
                                                                    value="TRIGGER_ERR_UNREGISTERED_PART"
                                                                    className={
                                                                        themedSelectItemClass
                                                                    }
                                                                >
                                                                    Non-standard
                                                                    Code
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </td>

                                                    {/* Description */}
                                                    <td className="p-2 align-top">
                                                        <Textarea
                                                            required
                                                            rows={3}
                                                            className={`${themedInputClass} min-h-[80px] resize-y`}
                                                            value={
                                                                item.additional_spec_text ||
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                updateOrderItemField(
                                                                    index,
                                                                    "additional_spec_text",
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="Enter detailed specifications..."
                                                        />
                                                    </td>

                                                    {/* HSN */}
                                                    <td className="p-2 align-top">
                                                        <Input
                                                            value={
                                                                item.hsn_code ||
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                updateOrderItemField(
                                                                    index,
                                                                    "hsn_code",
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder="HSN"
                                                            className={
                                                                themedInputClass
                                                            }
                                                        />
                                                    </td>

                                                    {/* Quantity */}
                                                    <td className="p-2 align-top">
                                                        <Input
                                                            type="number"
                                                            required
                                                            min="0"
                                                            value={
                                                                item.quantity ??
                                                                0
                                                            }
                                                            onChange={(e) => {
                                                                const value =
                                                                    e.target
                                                                        .value;

                                                                updateOrderItemField(
                                                                    index,
                                                                    "quantity",
                                                                    value ===
                                                                        ""
                                                                        ? ""
                                                                        : Number(
                                                                              value
                                                                          )
                                                                );
                                                            }}
                                                            className={
                                                                themedInputClass
                                                            }
                                                        />
                                                    </td>

                                                    {/* Unit */}
                                                    <td className="p-2 align-top">
                                                        <Input
                                                            required
                                                            value={
                                                                item.unit_measure ||
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                updateOrderItemField(
                                                                    index,
                                                                    "unit_measure",
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder="NOS"
                                                            className={
                                                                themedInputClass
                                                            }
                                                        />
                                                    </td>

                                                    {/* Rate */}
                                                    <td className="p-2 align-top">
                                                        <Input
                                                            type="number"
                                                            required
                                                            step="0.01"
                                                            min="0"
                                                            value={
                                                                item.rate || 0
                                                            }
                                                            onChange={(e) =>
                                                                updateOrderItemField(
                                                                    index,
                                                                    "rate",
                                                                    parseFloat(
                                                                        e.target
                                                                            .value
                                                                    ) || 0
                                                                )
                                                            }
                                                            className={
                                                                themedInputClass
                                                            }
                                                        />
                                                    </td>

                                                    {/* Discount */}
                                                    <td className="p-2 align-top">
                                                        <Input
                                                            type="number"
                                                            required
                                                            step="0.01"
                                                            min="0"
                                                            max="100"
                                                            value={
                                                                item.discount_percentage ??
                                                                0
                                                            }
                                                            onChange={(e) =>
                                                                updateOrderItemField(
                                                                    index,
                                                                    "discount_percentage",
                                                                    parseFloat(
                                                                        e.target
                                                                            .value
                                                                    ) || 0
                                                                )
                                                            }
                                                            className={
                                                                themedInputClass
                                                            }
                                                        />
                                                    </td>

                                                    {/* Amount */}
                                                    <td className="whitespace-nowrap px-3 py-2 text-right align-middle">
                                                        <span className="font-mono font-semibold text-[var(--brand-accent)]">
                                                            ₹
                                                            {lineTotal.toFixed(
                                                                2
                                                            )}
                                                        </span>
                                                    </td>

                                                    {/* Remove */}
                                                    <td className="px-3 py-2 text-center align-middle">
                                                        {orderItems.length >
                                                            1 && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-[var(--brand-danger)] hover:bg-[var(--warning-row)] hover:text-[var(--brand-danger)]"
                                                                onClick={() =>
                                                                    popOrderItemRow(
                                                                        index
                                                                    )
                                                                }
                                                                title="Remove line"
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={appendOrderItemRow}
                                className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)]"
                            >
                                <Plus className="mr-2 size-4 text-[var(--brand-accent)]" />
                                Append Line Item
                            </Button>
                        </section>

                        {/* ================================================== */}
                        {/* TOTALS */}
                        {/* ================================================== */}

                        <section className="flex justify-end">
                            <Card className="w-full max-w-md border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
                                <CardContent className="space-y-4 p-5">
                                    {/* Subtotal */}
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-[var(--text-muted)]">
                                            Item Subtotal
                                        </span>

                                        <span className="font-semibold text-[var(--text-primary)]">
                                            ₹
                                            {totals.itemSubtotal.toFixed(2)}
                                        </span>
                                    </div>

                                    {/* Packing */}
                                    <div className="flex items-center justify-between gap-4 text-sm">
                                        <Label
                                            htmlFor="packing-charges"
                                            className="font-normal text-[var(--text-primary)]"
                                        >
                                            Packing Charges (₹)
                                        </Label>

                                        <Input
                                            id="packing-charges"
                                            type="number"
                                            step="0.01"
                                            className={`${themedInputClass} w-32 text-right`}
                                            value={
                                                orderHeader.packing_charges ||
                                                ""
                                            }
                                            onChange={(e) =>
                                                updateHeaderField(
                                                    "packing_charges",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="0.00"
                                        />
                                    </div>

                                    {/* Freight */}
                                    <div className="flex items-center justify-between gap-4 text-sm">
                                        <Label
                                            htmlFor="freight-charges"
                                            className="font-normal text-[var(--text-primary)]"
                                        >
                                            Freight Charges (₹)
                                        </Label>

                                        <Input
                                            id="freight-charges"
                                            type="number"
                                            step="0.01"
                                            className={`${themedInputClass} w-32 text-right`}
                                            value={
                                                orderHeader.freight_charges ||
                                                ""
                                            }
                                            onChange={(e) =>
                                                updateHeaderField(
                                                    "freight_charges",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="0.00"
                                        />
                                    </div>

                                    {/* GST */}
                                    <div className="flex items-center justify-between gap-4 text-sm">
                                        <Label
                                            htmlFor="gst-rate"
                                            className="font-normal text-[var(--text-primary)]"
                                        >
                                            GST Rate (%)
                                        </Label>

                                        <Select
                                            value={String(
                                                orderHeader.tax_rate || 18
                                            )}
                                            onValueChange={(value) =>
                                                updateHeaderField(
                                                    "tax_rate",
                                                    value
                                                )
                                            }
                                        >
                                            <SelectTrigger
                                                id="gst-rate"
                                                className={`w-32 ${themedSelectTriggerClass}`}
                                            >
                                                <SelectValue />
                                            </SelectTrigger>

                                            <SelectContent
                                                className={
                                                    themedSelectContentClass
                                                }
                                            >
                                                <SelectItem
                                                    value="0"
                                                    className={
                                                        themedSelectItemClass
                                                    }
                                                >
                                                    0%
                                                </SelectItem>
                                                <SelectItem
                                                    value="5"
                                                    className={
                                                        themedSelectItemClass
                                                    }
                                                >
                                                    5%
                                                </SelectItem>
                                                <SelectItem
                                                    value="12"
                                                    className={
                                                        themedSelectItemClass
                                                    }
                                                >
                                                    12%
                                                </SelectItem>
                                                <SelectItem
                                                    value="18"
                                                    className={
                                                        themedSelectItemClass
                                                    }
                                                >
                                                    18%
                                                </SelectItem>
                                                <SelectItem
                                                    value="28"
                                                    className={
                                                        themedSelectItemClass
                                                    }
                                                >
                                                    28%
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Separator className="bg-[var(--border-light)]" />

                                    {/* Tax */}
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-[var(--text-muted)]">
                                            Tax Amount (CGST/SGST/IGST)
                                        </span>

                                        <span className="font-semibold text-[var(--text-primary)]">
                                            ₹{totals.taxAmount.toFixed(2)}
                                        </span>
                                    </div>

                                    {/* Grand Total */}
                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-base font-semibold text-[var(--text-primary)]">
                                            Grand Total
                                        </span>

                                        <span className="text-xl font-bold text-[var(--brand-accent)]">
                                            ₹{totals.grandTotal.toFixed(2)}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>
                    </CardContent>

                    {/* ================================================== */}
                    {/* FORM ACTIONS */}
                    {/* ================================================== */}

                    <CardFooter className="flex flex-col-reverse gap-2 border-t border-[var(--border-light)] bg-[var(--bg-muted)] px-6 py-4 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                setActiveTab("orders-list")
                            }
                            className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)]"
                        >
                            Discard Form
                        </Button>

                        <Button
                            type="submit"
                            className="bg-[var(--brand-accent)] text-white hover:opacity-90"
                        >
                            <Save className="mr-2 size-4" />

                            {state.isPendingTallyOrder
                                ? "Claim Order"
                                : "Create Order"}

                            <kbd className="ml-2 rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] font-normal text-white">
                                Ctrl+S
                            </kbd>
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}