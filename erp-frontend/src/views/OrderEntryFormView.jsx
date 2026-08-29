import React from "react";
import SearchBox from "../components/SearchBox";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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
        <div className="mx-auto w-full max-w-[1400px] px-4 py-6">
            <Card className="overflow-hidden">
                {/* Header */}
                <CardHeader className="border-b bg-muted/20 px-6 py-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <FileText className="size-5" />
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold tracking-tight">
                                    Establish Order Acceptance
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Create and register a new customer order acceptance
                                    against the corporate master.
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
                                className="border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/70"
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
                                <h3 className="text-sm font-semibold">
                                    Order Information
                                </h3>

                                <p className="mt-1 text-xs text-muted-foreground">
                                    Core order acceptance and delivery information.
                                </p>
                            </div>

                            <Separator />

                            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                                {/* OA ID */}
                                <div
                                    ref={oaInputRef}
                                    className="relative space-y-2"
                                >
                                    <Label htmlFor="order-acceptance-id">
                                        Order Acceptance ID
                                        <span className="ml-1 text-destructive">
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
                                        />

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                handleOaSearch(
                                                    orderHeader.order_acceptance_id
                                                )
                                            }
                                            className="shrink-0"
                                        >
                                            <Search className="mr-2 size-4" />
                                            Lookup
                                        </Button>
                                    </div>

                                    {/* OA Suggestions */}
                                    {showOaSuggestions &&
                                        oaSuggestions.length > 0 && (
                                            <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg">
                                                <div className="border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
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
                                                                    className="block w-full border-b px-3 py-2.5 text-left text-sm transition-colors last:border-b-0 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                                                                >
                                                                    <span
                                                                        className={
                                                                            isMatch
                                                                                ? "font-semibold"
                                                                                : "font-normal"
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
                                    <Label htmlFor="customer-po-ref">
                                        Customer PO Reference
                                        <span className="ml-1 text-destructive">
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
                                    />
                                </div>

                                {/* Acceptance Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="acceptance-date">
                                        Acceptance Date
                                        <span className="ml-1 text-destructive">
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
                                    />
                                </div>

                                {/* PO Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="po-date">
                                        Customer PO Date
                                        <span className="ml-1 text-destructive">
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
                                    />
                                </div>

                                {/* Due Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="delivery-due-date">
                                        Delivery Expiry Due Date
                                        <span className="ml-1 text-destructive">
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
                                    />
                                </div>

                                {/* Payment Terms */}
                                <div className="space-y-2">
                                    <Label htmlFor="payment-terms">
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
                                    <h3 className="text-sm font-semibold">
                                        Customer Master Registry
                                    </h3>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Link this order to an existing customer
                                        or register a temporary client.
                                    </p>
                                </div>

                                <Button
                                    type="button"
                                    size="sm"
                                    variant={
                                        isNewClient
                                            ? "destructive"
                                            : "secondary"
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

                            <Separator />

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
                                        <div className="flex flex-col gap-2 rounded-lg border bg-blue-50/60 px-4 py-3 text-sm dark:bg-blue-950/20 sm:flex-row sm:items-center">
                                            <span>
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
                                                    className="w-fit border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400"
                                                >
                                                    Not registered yet
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label htmlFor="temporary-client">
                                        Temporary Client Corporate Name
                                        <span className="ml-1 text-destructive">
                                            *
                                        </span>
                                    </Label>

                                    <Input
                                        id="temporary-client"
                                        type="text"
                                        required
                                        className="border-dashed border-emerald-500"
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
                                <h3 className="text-sm font-semibold">
                                    Billing Configuration
                                </h3>

                                <p className="mt-1 text-xs text-muted-foreground">
                                    Configure whether billing information should
                                    match the customer entity.
                                </p>
                            </div>

                            <Separator />

                            <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id="billing-same"
                                        checked={isBillingSameAsCustomer}
                                        onCheckedChange={(checked) =>
                                            setIsBillingSameAsCustomer(
                                                checked === true
                                            )
                                        }
                                    />

                                    <div className="space-y-1">
                                        <Label
                                            htmlFor="billing-same"
                                            className="cursor-pointer font-medium"
                                        >
                                            Billing parameters and Customer
                                            Entity details are identical
                                        </Label>

                                        <p className="text-xs text-muted-foreground">
                                            Disable this if the commercial
                                            billing entity is different.
                                        </p>
                                    </div>
                                </div>

                                <Badge
                                    variant={
                                        isBillingSameAsCustomer
                                            ? "default"
                                            : "destructive"
                                    }
                                    className="w-fit"
                                >
                                    {isBillingSameAsCustomer
                                        ? "AUTO-MATCH ON"
                                        : "OVERRIDE OFF"}
                                </Badge>
                            </div>

                            {!isBillingSameAsCustomer && (
                                <div className="space-y-5 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="billing-name"
                                            className="text-destructive"
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
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="billing-address"
                                            className="text-destructive"
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
                                    <h3 className="text-sm font-semibold">
                                        Order Line Items
                                    </h3>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Add products, specifications,
                                        quantities, rates and discounts.
                                    </p>
                                </div>

                                <Badge variant="secondary">
                                    {orderItems.length}{" "}
                                    {orderItems.length === 1
                                        ? "Line"
                                        : "Lines"}
                                </Badge>
                            </div>

                            <Separator />

                            <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full min-w-[1100px] text-sm">
                                    <thead className="bg-muted/50">
                                        <tr className="border-b">
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
                                                    className="border-b last:border-b-0"
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
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Choose item" />
                                                            </SelectTrigger>

                                                            <SelectContent>
                                                                {itemsMaster?.map(
                                                                    (im) => (
                                                                        <SelectItem
                                                                            key={
                                                                                im.item_code
                                                                            }
                                                                            value={
                                                                                im.item_code
                                                                            }
                                                                        >
                                                                            {
                                                                                im.item_code
                                                                            }
                                                                        </SelectItem>
                                                                    )
                                                                )}

                                                                <SelectItem value="TRIGGER_ERR_UNREGISTERED_PART">
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
                                                            className="min-h-[80px] resize-y"
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
                                                        />
                                                    </td>

                                                    {/* Amount */}
                                                    <td className="whitespace-nowrap px-3 py-2 text-right align-middle">
                                                        <span className="font-mono font-semibold">
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
                                                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
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
                            >
                                <Plus className="mr-2 size-4" />
                                Append Line Item
                            </Button>
                        </section>

                        {/* ================================================== */}
                        {/* TOTALS */}
                        {/* ================================================== */}

                        <section className="flex justify-end">
                            <Card className="w-full max-w-md bg-muted/20">
                                <CardContent className="space-y-4 p-5">
                                    {/* Subtotal */}
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Item Subtotal
                                        </span>

                                        <span className="font-semibold">
                                            ₹
                                            {totals.itemSubtotal.toFixed(2)}
                                        </span>
                                    </div>

                                    {/* Packing */}
                                    <div className="flex items-center justify-between gap-4 text-sm">
                                        <Label
                                            htmlFor="packing-charges"
                                            className="font-normal"
                                        >
                                            Packing Charges (₹)
                                        </Label>

                                        <Input
                                            id="packing-charges"
                                            type="number"
                                            step="0.01"
                                            className="w-32 text-right"
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
                                            className="font-normal"
                                        >
                                            Freight Charges (₹)
                                        </Label>

                                        <Input
                                            id="freight-charges"
                                            type="number"
                                            step="0.01"
                                            className="w-32 text-right"
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
                                            className="font-normal"
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
                                                className="w-32"
                                            >
                                                <SelectValue />
                                            </SelectTrigger>

                                            <SelectContent>
                                                <SelectItem value="0">
                                                    0%
                                                </SelectItem>
                                                <SelectItem value="5">
                                                    5%
                                                </SelectItem>
                                                <SelectItem value="12">
                                                    12%
                                                </SelectItem>
                                                <SelectItem value="18">
                                                    18%
                                                </SelectItem>
                                                <SelectItem value="28">
                                                    28%
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Separator />

                                    {/* Tax */}
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Tax Amount (CGST/SGST/IGST)
                                        </span>

                                        <span className="font-semibold">
                                            ₹{totals.taxAmount.toFixed(2)}
                                        </span>
                                    </div>

                                    {/* Grand Total */}
                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-base font-semibold">
                                            Grand Total
                                        </span>

                                        <span className="text-xl font-bold text-primary">
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

                    <CardFooter className="flex flex-col-reverse gap-2 border-t bg-muted/20 px-6 py-4 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                setActiveTab("orders-list")
                            }
                        >
                            Discard Form
                        </Button>

                        <Button type="submit">
                            <Save className="mr-2 size-4" />

                            {state.isPendingTallyOrder
                                ? "Claim Order"
                                : "Create Order"}

                            <kbd className="ml-2 rounded border border-primary-foreground/20 bg-primary-foreground/10 px-1.5 py-0.5 text-[10px] font-normal">
                                Ctrl+S
                            </kbd>
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}