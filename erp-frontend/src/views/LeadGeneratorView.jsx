import React from "react";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { Separator } from "@/components/ui/separator";

import {
    FiMail,
    FiRefreshCw,
    FiSend,
    FiPaperclip,
    FiFilter,
    FiTrash2,
    FiUserCheck,
    FiPlus,
    FiEdit2,
    FiX,
    FiUpload,
    FiDatabase,
    FiClock,
    FiCheckCircle,
    FiAlertCircle,
} from "react-icons/fi";


const STATUS_CONFIG = {
    Pending: {
        label: "Pending Sync",
        icon: FiClock,
        className:
            "border-[var(--border-light)] bg-[var(--bg-muted)] text-[var(--brand-accent)]",
    },

    "Awaiting Review": {
        label: "Awaiting Review",
        icon: FiEdit2,
        className:
            "border-[var(--border-light)] bg-[var(--bg-muted)] text-[var(--brand-accent)]",
    },

    Completed: {
        label: "Completed",
        icon: FiCheckCircle,
        className:
            "border-[var(--brand-success)]/40 bg-[var(--bg-muted)] text-[var(--brand-success)]",
    },

    Failed: {
        label: "Failed",
        icon: FiAlertCircle,
        className:
            "border-[var(--brand-danger)]/40 bg-[var(--warning-row)] text-[var(--brand-danger)]",
    },

    Rejected: {
        label: "Rejected",
        icon: FiX,
        className:
            "border-[var(--brand-danger)]/40 bg-[var(--warning-row)] text-[var(--brand-danger)]",
    },
};


function StatusBadge({ status }) {
    const config = STATUS_CONFIG[status] || {
        label: status || "Unknown",
        icon: FiClock,
        className:
            "border-[var(--border-light)] bg-[var(--bg-muted)] text-[var(--text-muted)]",
    };

    const Icon = config.icon;

    return (
        <Badge
            variant="outline"
            className={`gap-1.5 px-2.5 py-1 text-[10px] font-semibold ${config.className}`}
        >
            <Icon className="size-3" />
            {config.label}
        </Badge>
    );
}


function ProductTags({ query }) {
    if (!query) {
        return (
            <span className="text-xs text-[var(--text-muted)]">
                No specific product
            </span>
        );
    }

    return (
        <div className="flex flex-wrap gap-1.5">
            {query
                .split(",")
                .map((product) => product.trim())
                .filter(Boolean)
                .map((product, index) => (
                    <Badge
                        key={`${product}-${index}`}
                        variant="secondary"
                        className="border border-[var(--border-light)] bg-[var(--bg-main)] text-[10px] text-[var(--brand-accent)]"
                    >
                        {product}
                    </Badge>
                ))}
        </div>
    );
}


export default function LeadGeneratorView({ state }) {
    const {
        companyName,
        setCompanyName,
        domain,
        setDomain,
        targets,
        expandedTargetId,
        contactsCache,
        statusFilter,
        setStatusFilter,
        file,
        setFile,
        editingTargetId,
        editForm,
        setEditForm,
        isLoading,
        uploading,
        handleTargetSubmit,
        handleBulkUpload,
        downloadSampleFile,
        handleAccordionToggle,
        startEditing,
        saveEdit,
        handleDelete,
        handleMockSync,
        stagedContacts,
        updateStagedContactField,
        addStagedContactRow,
        removeStagedContactRow,
        handleApproveStaging,
        handleRejectStaging,
        emailModal,
        selectedProductCode,
        setSelectedProductCode,
        draftSubject,
        setDraftSubject,
        draftBody,
        setDraftBody,
        feedback,
        setFeedback,
        attachments,
        isGenerating,
        openEmailModal,
        closeEmailModal,
        handleFileChange,
        removeAttachment,
        generateEmail,
        handleSendYahoo,
    } = state;

    const isBulkMode = Boolean(file);

    const filteredTargets = (targets ?? []).filter((target) => {
        if (statusFilter === "all") return true;
        return target.status === statusFilter;
    });

    const themedInputClass =
        "border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]";

    const themedSelectContentClass =
        "border-[var(--border-light)] bg-[var(--bg-surface)] text-[var(--text-primary)]";

    const themedSelectItemClass =
        "focus:bg-[var(--combobox-hover)] focus:text-[var(--text-primary)]";

    return (
        <div className="mx-auto w-full max-w-6xl space-y-4 bg-[var(--bg-main)] text-[var(--text-primary)]">

            {/* ========================================================= */}
            {/* PAGE HEADER */}
            {/* ========================================================= */}

            <Card className="overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]">

                <CardHeader className="border-b border-[var(--border-light)] bg-[var(--bg-muted)] p-5 md:p-6">

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                        <div>

                            <div className="mb-1 text-xs font-medium text-[var(--text-muted)]">
                                CRM / Prospecting
                            </div>

                            <CardTitle className="text-xl tracking-tight text-[var(--text-primary)]">
                                Lead Generator Engine
                            </CardTitle>

                            <CardDescription className="mt-1 max-w-2xl text-[var(--text-muted)]">
                                Target enterprise domains during the day;
                                harvest prioritized contacts overnight.
                            </CardDescription>

                        </div>


                        <Badge
                            variant="outline"
                            className="w-fit gap-1.5 border-[var(--border-light)] bg-[var(--bg-main)] px-3 py-1.5 text-[var(--brand-accent)]"
                        >
                            <FiDatabase className="size-3.5" />
                            Automated prospecting
                        </Badge>

                    </div>

                </CardHeader>

            </Card>


            {/* ========================================================= */}
            {/* TARGET QUEUE */}
            {/* ========================================================= */}

            <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">

                <CardHeader className="pb-4">

                    <CardTitle className="text-base text-[var(--text-primary)]">
                        Queue New Corporate Target
                    </CardTitle>

                    <CardDescription className="text-[var(--text-muted)]">
                        Add an individual company or upload a spreadsheet for
                        bulk prospecting.
                    </CardDescription>

                </CardHeader>


                <CardContent>

                    <form
                        onSubmit={handleTargetSubmit}
                        className="space-y-4"
                    >

                        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.2fr]">

                            {/* COMPANY */}

                            <div className="space-y-2">

                                <Label
                                    htmlFor="company-name"
                                    className="text-[var(--text-primary)]"
                                >
                                    Company Name
                                </Label>

                                <Input
                                    id="company-name"
                                    required
                                    placeholder="e.g. Tata Motors"
                                    value={companyName}
                                    onChange={(event) =>
                                        setCompanyName(event.target.value)
                                    }
                                    disabled={isBulkMode}
                                    className={themedInputClass}
                                />

                            </div>


                            {/* DOMAIN */}

                            <div className="space-y-2">

                                <Label
                                    htmlFor="corporate-domain"
                                    className="text-[var(--text-primary)]"
                                >
                                    Corporate Domain
                                </Label>

                                <Input
                                    id="corporate-domain"
                                    required
                                    placeholder="e.g. tatamotors.com"
                                    value={domain}
                                    onChange={(event) =>
                                        setDomain(event.target.value)
                                    }
                                    disabled={isBulkMode}
                                    className={themedInputClass}
                                />

                            </div>


                            {/* BULK FILE */}

                            <div className="space-y-2">

                                <Label
                                    htmlFor="bulk-target-file"
                                    className="text-[var(--text-primary)]"
                                >
                                    Upload Excel / CSV
                                </Label>

                                <Input
                                    id="bulk-target-file"
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={(event) => {
                                        const selectedFile =
                                            event.target.files?.[0] ?? null;

                                        setFile(selectedFile);
                                        setCompanyName("");
                                        setDomain("");
                                    }}
                                    className={`${themedInputClass} cursor-pointer`}
                                />

                            </div>

                        </div>


                        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border-light)] pt-4">

                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBulkUpload}
                                disabled={uploading || !file}
                                className="gap-2 border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)] hover:text-[var(--text-primary)]"
                            >
                                <FiUpload className="size-3.5" />

                                {uploading
                                    ? "Uploading..."
                                    : "Upload Excel"}
                            </Button>


                            <Button
                                type="submit"
                                disabled={isLoading || isBulkMode}
                                className="gap-2 bg-[var(--brand-accent)] text-white hover:opacity-90"
                            >
                                <FiPlus className="size-3.5" />

                                {isLoading
                                    ? "Queueing..."
                                    : "Add to Night Queue"}
                            </Button>


                            <Button
                                type="button"
                                variant="ghost"
                                onClick={downloadSampleFile}
                                className="text-xs text-[var(--text-muted)] hover:bg-[var(--combobox-hover)] hover:text-[var(--text-primary)]"
                            >
                                ↓ Download Sample
                            </Button>

                        </div>

                    </form>

                </CardContent>

            </Card>


            {/* ========================================================= */}
            {/* PIPELINE */}
            {/* ========================================================= */}

            <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">

                <CardHeader className="pb-4">

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                            <CardTitle className="text-base text-[var(--text-primary)]">
                                Scraping Pipeline
                            </CardTitle>

                            <CardDescription className="mt-1 text-[var(--text-muted)]">
                                Corporate domains queued for contact
                                discovery.
                            </CardDescription>

                        </div>


                        <div className="flex items-center gap-2">

                            <FiFilter className="size-3.5 text-[var(--text-muted)]" />

                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >

                                <SelectTrigger
                                    className={`${themedInputClass} h-9 w-[190px] text-xs`}
                                >
                                    <SelectValue placeholder="Filter status" />
                                </SelectTrigger>

                                <SelectContent
                                    className={themedSelectContentClass}
                                >

                                    <SelectItem
                                        value="all"
                                        className={themedSelectItemClass}
                                    >
                                        Show All Statuses
                                    </SelectItem>

                                    <SelectItem
                                        value="Pending"
                                        className={themedSelectItemClass}
                                    >
                                        Pending Sync
                                    </SelectItem>

                                    <SelectItem
                                        value="Awaiting Review"
                                        className={themedSelectItemClass}
                                    >
                                        Awaiting Review
                                    </SelectItem>

                                    <SelectItem
                                        value="Completed"
                                        className={themedSelectItemClass}
                                    >
                                        Completed
                                    </SelectItem>

                                    <SelectItem
                                        value="Failed"
                                        className={themedSelectItemClass}
                                    >
                                        Failed
                                    </SelectItem>

                                    <SelectItem
                                        value="Rejected"
                                        className={themedSelectItemClass}
                                    >
                                        Rejected
                                    </SelectItem>

                                </SelectContent>

                            </Select>

                        </div>

                    </div>

                </CardHeader>


                <CardContent>

                    {filteredTargets.length === 0 ? (

                        <div className="rounded-xl border border-dashed border-[var(--border-light)] bg-[var(--bg-muted)] px-6 py-12 text-center">

                            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-[var(--bg-main)] text-[var(--brand-accent)]">
                                <FiDatabase className="size-5" />
                            </div>

                            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                                No matching targets
                            </h3>

                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                No targets match the selected status filter.
                            </p>

                        </div>

                    ) : (

                        <Accordion
                            type="single"
                            collapsible
                            value={
                                expandedTargetId
                                    ? String(expandedTargetId)
                                    : undefined
                            }
                            onValueChange={(value) => {
                                const target = filteredTargets.find(
                                    (item) =>
                                        String(item.id) === String(value)
                                );

                                if (target) {
                                    handleAccordionToggle(target);
                                }
                            }}
                            className="space-y-2"
                        >

                            {filteredTargets.map((target) => {

                                const targetId = String(target.id);

                                const contacts =
                                    contactsCache?.[target.id] ?? [];

                                const rawEmails =
                                    target.snovio_raw_data?.raw_emails ?? [];

                                const isEditing =
                                    editingTargetId === target.id;

                                return (

                                    <AccordionItem
                                        key={target.id}
                                        value={targetId}
                                        className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-4"
                                    >

                                        {/* ================================================= */}
                                        {/* ACCORDION HEADER */}
                                        {/* ================================================= */}

                                        <div className="flex items-center gap-3">

                                            <AccordionTrigger className="min-w-0 flex-1 py-4 hover:no-underline">

                                                <div className="min-w-0 text-left">

                                                    {isEditing ? (

                                                        <div
                                                            className="flex flex-col gap-2 sm:flex-row"
                                                            onClick={(event) =>
                                                                event.stopPropagation()
                                                            }
                                                        >

                                                            <Input
                                                                value={
                                                                    editForm.company_name
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    setEditForm(
                                                                        {
                                                                            ...editForm,
                                                                            company_name:
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                        }
                                                                    )
                                                                }
                                                                className={`${themedInputClass} h-8 text-xs`}
                                                            />

                                                            <Input
                                                                value={
                                                                    editForm.domain
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    setEditForm(
                                                                        {
                                                                            ...editForm,
                                                                            domain:
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                        }
                                                                    )
                                                                }
                                                                className={`${themedInputClass} h-8 text-xs`}
                                                            />

                                                        </div>

                                                    ) : (

                                                        <>

                                                            <div className="truncate text-sm font-semibold text-[var(--brand-accent)]">
                                                                {
                                                                    target.company_name
                                                                }
                                                            </div>

                                                            <div className="mt-1 truncate text-[11px] text-[var(--text-muted)]">

                                                                {
                                                                    target.domain
                                                                }

                                                                {" · "}

                                                                Queued:{" "}
                                                                {target.created_at?.split(
                                                                    "T"
                                                                )[0] ?? "—"}

                                                                {" · "}

                                                                By:{" "}
                                                                {target.requested_by?.split(
                                                                    "@"
                                                                )[0] ?? "—"}

                                                            </div>

                                                        </>

                                                    )}

                                                </div>

                                            </AccordionTrigger>


                                            <div
                                                className="flex shrink-0 items-center gap-2"
                                                onClick={(event) =>
                                                    event.stopPropagation()
                                                }
                                            >

                                                <StatusBadge
                                                    status={target.status}
                                                />


                                                <div className="hidden items-center gap-1 sm:flex">

                                                    {isEditing ? (

                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="ghost"
                                                            className="size-8 text-[var(--brand-success)] hover:bg-[var(--combobox-hover)] hover:text-[var(--brand-success)]"
                                                            onClick={() =>
                                                                saveEdit(
                                                                    target.id
                                                                )
                                                            }
                                                        >
                                                            <FiCheckCircle className="size-3.5" />
                                                        </Button>

                                                    ) : (

                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="ghost"
                                                            className="size-8 text-[var(--brand-accent)] hover:bg-[var(--combobox-hover)] hover:text-[var(--brand-accent)]"
                                                            onClick={(event) =>
                                                                startEditing(
                                                                    event,
                                                                    target
                                                                )
                                                            }
                                                        >
                                                            <FiEdit2 className="size-3.5" />
                                                        </Button>

                                                    )}


                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="ghost"
                                                        className="size-8 text-[var(--brand-danger)] hover:bg-[var(--warning-row)] hover:text-[var(--brand-danger)]"
                                                        onClick={(event) =>
                                                            handleDelete(
                                                                event,
                                                                target.id
                                                            )
                                                        }
                                                    >
                                                        <FiTrash2 className="size-3.5" />
                                                    </Button>

                                                </div>

                                            </div>

                                        </div>


                                        {/* ================================================= */}
                                        {/* EXPANDED CONTENT */}
                                        {/* ================================================= */}

                                        <AccordionContent className="pb-4">

                                            {/* PENDING */}

                                            {target.status === "Pending" && (

                                                <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-muted)] p-5 text-center">

                                                    <FiClock className="mx-auto mb-2 size-5 text-[var(--text-muted)]" />

                                                    <p className="text-sm text-[var(--text-muted)]">
                                                        The scraper engine will
                                                        search for contacts
                                                        matching this domain
                                                        during the overnight
                                                        batch process.
                                                    </p>

                                                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                                                        Check back tomorrow
                                                        morning.
                                                    </p>

                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="mt-3 text-xs text-[var(--brand-accent)] hover:bg-[var(--combobox-hover)]"
                                                        onClick={(event) =>
                                                            handleMockSync(
                                                                event,
                                                                target.id
                                                            )
                                                        }
                                                    >
                                                        Force Sync
                                                    </Button>

                                                </div>

                                            )}


                                            {/* AWAITING REVIEW */}

                                            {target.status ===
                                                "Awaiting Review" && (

                                                <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-muted)]">

                                                    <div className="flex flex-col gap-3 border-b border-[var(--border-light)] p-4 lg:flex-row lg:items-center lg:justify-between">

                                                        <div>

                                                            <h4 className="text-sm font-semibold text-[var(--brand-accent)]">
                                                                Review & Map
                                                                Harvested Leads
                                                            </h4>

                                                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                                                Verify harvested
                                                                contacts before
                                                                importing them
                                                                into CRM.
                                                            </p>

                                                        </div>


                                                        <div className="flex flex-wrap gap-2">

                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={
                                                                    addStagedContactRow
                                                                }
                                                                className="gap-1.5 border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)]"
                                                            >
                                                                <FiPlus className="size-3.5" />
                                                                Add Contact
                                                            </Button>


                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleApproveStaging(
                                                                        target.id
                                                                    )
                                                                }
                                                                className="gap-1.5 bg-[var(--brand-success)] text-white hover:opacity-90"
                                                            >
                                                                <FiUserCheck className="size-3.5" />
                                                                Approve &
                                                                Import
                                                            </Button>


                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-[var(--brand-danger)] hover:bg-[var(--warning-row)] hover:text-[var(--brand-danger)]"
                                                                onClick={() =>
                                                                    handleRejectStaging(
                                                                        target.id
                                                                    )
                                                                }
                                                            >
                                                                Reject
                                                            </Button>

                                                        </div>

                                                    </div>


                                                    <div className="overflow-x-auto">

                                                        <Table>

                                                            <TableHeader className="bg-[var(--bg-main)]">

                                                                <TableRow className="border-[var(--border-light)] hover:bg-[var(--bg-main)]">

                                                                    <TableHead className="text-[var(--text-primary)]">
                                                                        Name
                                                                    </TableHead>

                                                                    <TableHead className="text-[var(--text-primary)]">
                                                                        Designation
                                                                    </TableHead>

                                                                    <TableHead className="min-w-[330px] text-[var(--text-primary)]">
                                                                        Matched
                                                                        Email
                                                                    </TableHead>

                                                                    <TableHead className="text-center text-[var(--text-primary)]">
                                                                        Priority
                                                                    </TableHead>

                                                                    <TableHead className="text-center text-[var(--text-primary)]">
                                                                        Action
                                                                    </TableHead>

                                                                </TableRow>

                                                            </TableHeader>


                                                            <TableBody>

                                                                {(
                                                                    stagedContacts ??
                                                                    []
                                                                ).map(
                                                                    (
                                                                        contact,
                                                                        index
                                                                    ) => (

                                                                        <TableRow
                                                                            key={
                                                                                index
                                                                            }
                                                                            className="border-[var(--border-light)] hover:bg-[var(--combobox-hover)]"
                                                                        >

                                                                            <TableCell>

                                                                                <Input
                                                                                    value={
                                                                                        contact.full_name ??
                                                                                        ""
                                                                                    }
                                                                                    onChange={(
                                                                                        event
                                                                                    ) =>
                                                                                        updateStagedContactField(
                                                                                            index,
                                                                                            "full_name",
                                                                                            event
                                                                                                .target
                                                                                                .value
                                                                                        )
                                                                                    }
                                                                                    className={`${themedInputClass} h-8 min-w-[150px] text-xs`}
                                                                                />

                                                                            </TableCell>


                                                                            <TableCell>

                                                                                <Input
                                                                                    value={
                                                                                        contact.designation ??
                                                                                        ""
                                                                                    }
                                                                                    onChange={(
                                                                                        event
                                                                                    ) =>
                                                                                        updateStagedContactField(
                                                                                            index,
                                                                                            "designation",
                                                                                            event
                                                                                                .target
                                                                                                .value
                                                                                        )
                                                                                    }
                                                                                    className={`${themedInputClass} h-8 min-w-[140px] text-xs`}
                                                                                />

                                                                            </TableCell>


                                                                            <TableCell>

                                                                                <div className="flex min-w-[300px] flex-col gap-2 sm:flex-row">

                                                                                    <Select
                                                                                        value={
                                                                                            contact.email ||
                                                                                            undefined
                                                                                        }
                                                                                        onValueChange={(
                                                                                            value
                                                                                        ) =>
                                                                                            updateStagedContactField(
                                                                                                index,
                                                                                                "email",
                                                                                                value
                                                                                            )
                                                                                        }
                                                                                    >

                                                                                        <SelectTrigger
                                                                                            className={`${themedInputClass} h-8 text-xs`}
                                                                                        >
                                                                                            <SelectValue placeholder="Select email" />
                                                                                        </SelectTrigger>

                                                                                        <SelectContent
                                                                                            className={
                                                                                                themedSelectContentClass
                                                                                            }
                                                                                        >

                                                                                            <SelectItem
                                                                                                value="__none__"
                                                                                                className={
                                                                                                    themedSelectItemClass
                                                                                                }
                                                                                            >
                                                                                                No
                                                                                                Email
                                                                                            </SelectItem>


                                                                                            {rawEmails.map(
                                                                                                (
                                                                                                    email,
                                                                                                    emailIndex
                                                                                                ) => (

                                                                                                    <SelectItem
                                                                                                        key={
                                                                                                            emailIndex
                                                                                                        }
                                                                                                        value={
                                                                                                            email
                                                                                                        }
                                                                                                        className={
                                                                                                            themedSelectItemClass
                                                                                                        }
                                                                                                    >
                                                                                                        {
                                                                                                            email
                                                                                                        }
                                                                                                    </SelectItem>

                                                                                                )
                                                                                            )}

                                                                                        </SelectContent>

                                                                                    </Select>


                                                                                    <Input
                                                                                        value={
                                                                                            contact.email ??
                                                                                            ""
                                                                                        }
                                                                                        placeholder="Or type manually..."
                                                                                        onChange={(
                                                                                            event
                                                                                        ) =>
                                                                                            updateStagedContactField(
                                                                                                index,
                                                                                                "email",
                                                                                                event
                                                                                                    .target
                                                                                                    .value
                                                                                            )
                                                                                        }
                                                                                        className={`${themedInputClass} h-8 text-xs`}
                                                                                    />

                                                                                </div>

                                                                            </TableCell>


                                                                            <TableCell className="text-center">

                                                                                <Checkbox
                                                                                    checked={Boolean(
                                                                                        contact.is_priority
                                                                                    )}
                                                                                    onCheckedChange={(
                                                                                        checked
                                                                                    ) =>
                                                                                        updateStagedContactField(
                                                                                            index,
                                                                                            "is_priority",
                                                                                            Boolean(
                                                                                                checked
                                                                                            )
                                                                                        )
                                                                                    }
                                                                                />

                                                                            </TableCell>


                                                                            <TableCell className="text-center">

                                                                                <Button
                                                                                    type="button"
                                                                                    size="icon"
                                                                                    variant="ghost"
                                                                                    className="size-8 text-[var(--brand-danger)] hover:bg-[var(--warning-row)] hover:text-[var(--brand-danger)]"
                                                                                    onClick={() =>
                                                                                        removeStagedContactRow(
                                                                                            index
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <FiTrash2 className="size-3.5" />
                                                                                </Button>

                                                                            </TableCell>

                                                                        </TableRow>

                                                                    )
                                                                )}


                                                                {(
                                                                    stagedContacts ??
                                                                    []
                                                                ).length ===
                                                                    0 && (

                                                                    <TableRow>

                                                                        <TableCell
                                                                            colSpan={
                                                                                5
                                                                            }
                                                                            className="h-24 text-center text-xs text-[var(--text-muted)]"
                                                                        >
                                                                            No
                                                                            contacts
                                                                            loaded.
                                                                            Use
                                                                            "Add
                                                                            Contact"
                                                                            to
                                                                            populate
                                                                            details
                                                                            manually.
                                                                        </TableCell>

                                                                    </TableRow>

                                                                )}

                                                            </TableBody>

                                                        </Table>

                                                    </div>

                                                </div>

                                            )}


                                            {/* COMPLETED */}

                                            {target.status === "Completed" && (

                                                <div>

                                                    {contacts.length === 0 ? (

                                                        <div className="rounded-lg border border-dashed border-[var(--border-light)] bg-[var(--bg-muted)] p-8 text-center">

                                                            <FiUserCheck className="mx-auto mb-2 size-5 text-[var(--text-muted)]" />

                                                            <p className="text-sm text-[var(--text-muted)]">
                                                                No contacts found
                                                                for this domain.
                                                            </p>

                                                        </div>

                                                    ) : (

                                                        <div className="overflow-x-auto rounded-xl border border-[var(--border-light)]">

                                                            <Table>

                                                                <TableHeader className="bg-[var(--bg-muted)]">

                                                                    <TableRow className="border-[var(--border-light)] hover:bg-[var(--bg-muted)]">

                                                                        <TableHead className="text-[var(--text-primary)]">
                                                                            Executive
                                                                        </TableHead>

                                                                        <TableHead className="text-[var(--text-primary)]">
                                                                            Designation
                                                                        </TableHead>

                                                                        <TableHead className="text-[var(--text-primary)]">
                                                                            Contact
                                                                            Email
                                                                        </TableHead>

                                                                        <TableHead className="text-right text-[var(--text-primary)]">
                                                                            Actions
                                                                        </TableHead>

                                                                    </TableRow>

                                                                </TableHeader>


                                                                <TableBody>

                                                                    {contacts.map(
                                                                        (
                                                                            contact,
                                                                            index
                                                                        ) => (

                                                                            <TableRow
                                                                                key={
                                                                                    index
                                                                                }
                                                                                className="border-[var(--border-light)] hover:bg-[var(--combobox-hover)]"
                                                                            >

                                                                                <TableCell>

                                                                                    <div className="flex items-center gap-2">

                                                                                        <span className="font-medium text-[var(--text-primary)]">
                                                                                            {
                                                                                                contact.full_name
                                                                                            }
                                                                                        </span>


                                                                                        {contact.is_priority && (

                                                                                            <Badge
                                                                                                variant="secondary"
                                                                                                className="border border-[var(--border-light)] bg-[var(--bg-muted)] text-[9px] text-[var(--brand-accent)]"
                                                                                            >
                                                                                                HIGH
                                                                                                PRIORITY
                                                                                            </Badge>

                                                                                        )}

                                                                                    </div>

                                                                                </TableCell>


                                                                                <TableCell className="text-[var(--text-muted)]">
                                                                                    {
                                                                                        contact.designation
                                                                                    }
                                                                                </TableCell>


                                                                                <TableCell className="text-[var(--brand-accent)]">
                                                                                    {
                                                                                        contact.email
                                                                                    }
                                                                                </TableCell>


                                                                                <TableCell className="text-right">

                                                                                    <Button
                                                                                        type="button"
                                                                                        size="sm"
                                                                                        variant="outline"
                                                                                        onClick={() =>
                                                                                            openEmailModal(
                                                                                                contact,
                                                                                                target
                                                                                            )
                                                                                        }
                                                                                        className="gap-1.5 border-[var(--border-light)] bg-[var(--bg-main)] text-xs text-[var(--text-primary)] hover:bg-[var(--combobox-hover)]"
                                                                                    >
                                                                                        <FiMail className="size-3.5" />
                                                                                        Draft
                                                                                        Email
                                                                                    </Button>

                                                                                </TableCell>

                                                                            </TableRow>

                                                                        )
                                                                    )}

                                                                </TableBody>

                                                            </Table>

                                                        </div>

                                                    )}

                                                </div>

                                            )}

                                        </AccordionContent>

                                    </AccordionItem>

                                );

                            })}

                        </Accordion>

                    )}

                </CardContent>

            </Card>


            {/* ========================================================= */}
            {/* EMAIL DRAFT DIALOG */}
            {/* ========================================================= */}

            <Dialog
                open={Boolean(emailModal?.isOpen)}
                onOpenChange={(open) => {
                    if (!open) closeEmailModal();
                }}
            >

                <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-3xl flex-col gap-0 overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0 text-[var(--text-primary)] shadow-[var(--shadow-sm)]">

                    <DialogHeader className="border-b border-[var(--border-light)] bg-[var(--brand-accent)] px-5 py-4 text-white">

                        <DialogTitle className="flex items-center gap-2 text-base text-white">

                            <FiMail className="size-4" />

                            AI Cold Outreach Drafter

                        </DialogTitle>


                        <DialogDescription className="text-white/75">
                            Generate, edit and review the outbound message
                            before opening Yahoo Business.
                        </DialogDescription>

                    </DialogHeader>


                    <div className="min-h-0 flex-1 overflow-y-auto p-5">

                        {emailModal?.contact && emailModal?.target && (

                            <div className="space-y-5">

                                {/* CONTACT CONTEXT */}

                                <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-muted)] p-4">

                                    <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                                        Target Context
                                    </div>

                                    <div className="text-sm text-[var(--text-primary)]">

                                        <strong>
                                            {
                                                emailModal.contact
                                                    .full_name
                                            }
                                        </strong>

                                        {" — "}

                                        {
                                            emailModal.contact
                                                .designation
                                        }

                                        {" @ "}

                                        {
                                            emailModal.target
                                                .company_name
                                        }

                                    </div>

                                    <div className="mt-1 text-xs text-[var(--brand-accent)]">
                                        {emailModal.contact.email}
                                    </div>

                                </div>


                                {/* PRODUCT + ATTACHMENTS */}

                                <div className="grid gap-4 md:grid-cols-[1fr_220px]">

                                    <div className="space-y-2">

                                        <Label className="text-[var(--text-primary)]">
                                            Feature Product from Catalog
                                        </Label>

                                        <Select
                                            value={
                                                selectedProductCode ||
                                                undefined
                                            }
                                            onValueChange={
                                                setSelectedProductCode
                                            }
                                        >

                                            <SelectTrigger
                                                className={themedInputClass}
                                            >
                                                <SelectValue placeholder="Select Product Context" />
                                            </SelectTrigger>

                                            <SelectContent
                                                className={
                                                    themedSelectContentClass
                                                }
                                            >

                                                {(
                                                    state.itemsMaster ??
                                                    []
                                                ).map((item) => (

                                                    <SelectItem
                                                        key={
                                                            item.item_code
                                                        }
                                                        value={
                                                            item.item_code
                                                        }
                                                        className={
                                                            themedSelectItemClass
                                                        }
                                                    >
                                                        {item.item_code} —{" "}
                                                        {
                                                            item.item_name
                                                        }
                                                    </SelectItem>

                                                ))}

                                            </SelectContent>

                                        </Select>

                                    </div>


                                    <div className="space-y-2">

                                        <Label className="text-[var(--text-primary)]">
                                            Attachments (
                                            {attachments?.length ?? 0}/5)
                                        </Label>

                                        <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-[var(--border-light)] bg-[var(--bg-main)] px-3 text-sm font-medium text-[var(--text-primary)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--combobox-hover)]">

                                            <FiPaperclip className="size-3.5" />

                                            Add Files

                                            <input
                                                type="file"
                                                multiple
                                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
                                                className="hidden"
                                                onChange={
                                                    handleFileChange
                                                }
                                            />

                                        </label>

                                    </div>

                                </div>


                                {/* ATTACHMENTS */}

                                {attachments?.length > 0 && (

                                    <div className="flex flex-wrap gap-2">

                                        {attachments.map(
                                            (attachment, index) => (

                                                <Badge
                                                    key={index}
                                                    variant="secondary"
                                                    className="gap-1.5 border border-[var(--border-light)] bg-[var(--bg-muted)] py-1 text-[var(--text-primary)]"
                                                >

                                                    {attachment.name}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeAttachment(
                                                                index
                                                            )
                                                        }
                                                        className="text-[var(--text-muted)] transition-colors hover:text-[var(--brand-danger)]"
                                                    >
                                                        <FiX className="size-3" />
                                                    </button>

                                                </Badge>

                                            )
                                        )}

                                    </div>

                                )}


                                <Separator className="bg-[var(--border-light)]" />


                                {/* INITIAL GENERATION */}

                                {!draftBody && (

                                    <Button
                                        type="button"
                                        className="w-full gap-2 bg-[var(--brand-accent)] text-white hover:opacity-90"
                                        onClick={() =>
                                            generateEmail(false)
                                        }
                                        disabled={
                                            isGenerating ||
                                            !selectedProductCode
                                        }
                                    >

                                        {isGenerating ? (

                                            <>
                                                <FiRefreshCw className="size-4 animate-spin" />
                                                AI is drafting...
                                            </>

                                        ) : (

                                            <>
                                                ✨ Generate Intelligent
                                                Draft
                                            </>

                                        )}

                                    </Button>

                                )}


                                {/* DRAFT */}

                                {draftBody && (

                                    <div className="space-y-4">

                                        <div className="space-y-2">

                                            <Label
                                                htmlFor="draft-subject"
                                                className="text-[var(--text-primary)]"
                                            >
                                                Subject Line
                                            </Label>

                                            <Input
                                                id="draft-subject"
                                                className={themedInputClass}
                                                value={draftSubject}
                                                onChange={(event) =>
                                                    setDraftSubject(
                                                        event.target
                                                            .value
                                                    )
                                                }
                                            />

                                        </div>


                                        <div className="space-y-2">

                                            <Label
                                                htmlFor="draft-body"
                                                className="text-[var(--text-primary)]"
                                            >
                                                Email Body
                                            </Label>

                                            <Textarea
                                                id="draft-body"
                                                rows={10}
                                                value={draftBody}
                                                onChange={(event) =>
                                                    setDraftBody(
                                                        event.target
                                                            .value
                                                    )
                                                }
                                                className={`${themedInputClass} min-h-[220px] resize-y leading-6`}
                                            />

                                        </div>


                                        {/* AI REWRITE */}

                                        <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-muted)] p-4">

                                            <div className="mb-3">

                                                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-accent)]">

                                                    <FiRefreshCw className="size-3.5" />

                                                    AI Human-in-the-loop
                                                    Rewrite

                                                </div>

                                                <p className="mt-1 text-xs text-[var(--text-muted)]">
                                                    Give the AI an editing
                                                    instruction while keeping
                                                    the final message under
                                                    your control.
                                                </p>

                                            </div>


                                            <div className="flex flex-col gap-2 sm:flex-row">

                                                <Input
                                                    placeholder="e.g. Make it shorter, more formal, remove the question..."
                                                    value={feedback}
                                                    onChange={(event) =>
                                                        setFeedback(
                                                            event.target
                                                                .value
                                                        )
                                                    }
                                                    className={`${themedInputClass} flex-1`}
                                                />

                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() =>
                                                        generateEmail(
                                                            true
                                                        )
                                                    }
                                                    disabled={
                                                        isGenerating ||
                                                        !feedback
                                                    }
                                                    className="shrink-0 gap-1.5 border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)]"
                                                >

                                                    <FiRefreshCw
                                                        className={
                                                            isGenerating
                                                                ? "animate-spin"
                                                                : ""
                                                        }
                                                    />

                                                    {isGenerating
                                                        ? "Rewriting..."
                                                        : "Rewrite"}

                                                </Button>

                                            </div>

                                        </div>

                                    </div>

                                )}

                            </div>

                        )}

                    </div>


                    <DialogFooter className="border-t border-[var(--border-light)] bg-[var(--bg-muted)] px-5 py-3">

                        <Button
                            type="button"
                            variant="outline"
                            onClick={closeEmailModal}
                            className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)]"
                        >
                            Discard
                        </Button>

                        <Button
                            type="button"
                            onClick={handleSendYahoo}
                            disabled={!draftBody || isGenerating}
                            className="gap-2 bg-[var(--brand-accent)] text-white hover:opacity-90"
                        >
                            <FiSend className="size-3.5" />
                            Open in Yahoo Business
                        </Button>

                    </DialogFooter>

                </DialogContent>

            </Dialog>

        </div>
    );
}