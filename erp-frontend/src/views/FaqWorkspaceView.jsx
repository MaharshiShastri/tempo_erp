import {
    FiCheckCircle,
    FiClock,
    FiFilter,
    FiMessageCircle,
    FiSend,
    FiUpload,
    FiUser,
    FiDatabase,
    FiHelpCircle,
    FiLayers,
    FiSearch,
    FiX,
} from "react-icons/fi";

import SearchableMultiselect from "../components/shared/SearchableMultiselect";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const themedTextareaClass =
    "border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:border-[var(--brand-accent)] focus-visible:ring-1 focus-visible:ring-[var(--brand-accent)]";

export default function FaqWorkspaceView({ state }) {
    const {
        faqs,
        filteredFaqs,
        newQuestion,
        setNewQuestion,
        answerTexts,
        setAnswerTexts,
        statusFilter,
        setStatusFilter,
        isLoading,
        isRnD,

        selectedItemGroup,
        selectedItemCode,
        itemGroupOptions,
        itemCodeOptions,
        handleItemGroupChange,
        setSelectedItemCode,

        filterItemGroup,
        filterItemCode,
        filterItemCodeOptions,
        handleFilterItemGroupChange,
        setFilterItemCode,
        setFilterItemGroup,

        handleAskQuestion,
        handleAnswerQuestion,
        handleFaqUpload,
    } = state;

    const pendingCount = faqs.filter(
        (faq) => faq.status === "Pending"
    ).length;

    const answeredCount = faqs.filter(
        (faq) => faq.status === "Answered"
    ).length;

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 bg-[var(--bg-main)] text-[var(--text-primary)]">

            {/* ===================================================== */}
            {/* HEADER */}
            {/* ===================================================== */}

            <Card className="relative overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]">
                <div className="absolute -right-16 -top-16 size-48 rounded-full bg-[var(--bg-muted)] opacity-60 blur-3xl" />

                <div className="absolute -bottom-20 left-1/3 size-40 rounded-full bg-[var(--bg-muted)] opacity-50 blur-3xl" />

                <CardHeader className="relative">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border-light)] bg-[var(--bg-muted)] text-[var(--brand-accent)] shadow-[var(--shadow-sm)]">
                                <FiDatabase className="size-5" />
                            </div>

                            <div>
                                <CardTitle className="flex items-center gap-2 text-xl text-[var(--text-primary)]">
                                    <FiMessageCircle className="size-5 text-[var(--brand-accent)]" />

                                    <span>R&D Knowledge Base</span>
                                </CardTitle>

                                <CardDescription className="mt-1.5 max-w-2xl leading-6 text-[var(--text-muted)]">
                                    Sales inquiries and technical product
                                    resolutions. Every resolved answer becomes
                                    searchable knowledge for future AI
                                    recommendations.
                                </CardDescription>

                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className="gap-1 border-[var(--border-light)] bg-[var(--bg-muted)] text-[var(--brand-accent)]"
                                    >
                                        <FiSearch className="size-3" />
                                        Searchable Knowledge
                                    </Badge>

                                    <Badge
                                        variant="outline"
                                        className="gap-1 border-[var(--border-light)] bg-[var(--bg-muted)] text-[var(--brand-success)]"
                                    >
                                        <FiLayers className="size-3" />
                                        AI Ready
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <Badge
                            variant="outline"
                            className="hidden gap-1.5 border-[var(--border-light)] bg-[var(--bg-muted)] text-[var(--brand-accent)] sm:flex"
                        >
                            <FiHelpCircle className="size-3.5" />
                            FAQ Workspace
                        </Badge>
                    </div>
                </CardHeader>
            </Card>


            {/* ===================================================== */}
            {/* KNOWLEDGE BASE SUMMARY */}
            {/* ===================================================== */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                {/* TOTAL */}
                <Card className="group border border-[var(--border-light)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-accent)] hover:shadow-[var(--shadow-sm)]">
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--bg-muted)] text-[var(--brand-accent)] transition-transform duration-200 group-hover:scale-110">
                            <FiMessageCircle className="size-[18px]" />
                        </div>

                        <div>
                            <p className="text-2xl font-bold leading-none text-[var(--text-primary)]">
                                {faqs.length}
                            </p>

                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                Total questions
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* PENDING */}
                <Card className="group border border-[var(--border-light)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-accent)] hover:shadow-[var(--shadow-sm)]">
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--bg-muted)] text-[var(--brand-accent)] transition-transform duration-200 group-hover:scale-110">
                            <FiClock className="size-[18px]" />
                        </div>

                        <div>
                            <p className="text-2xl font-bold leading-none text-[var(--text-primary)]">
                                {pendingCount}
                            </p>

                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                Awaiting R&D
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* RESOLVED */}
                <Card className="group border border-[var(--border-light)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-success)] hover:shadow-[var(--shadow-sm)]">
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--bg-muted)] text-[var(--brand-success)] transition-transform duration-200 group-hover:scale-110">
                            <FiCheckCircle className="size-[18px]" />
                        </div>

                        <div>
                            <p className="text-2xl font-bold leading-none text-[var(--text-primary)]">
                                {answeredCount}
                            </p>

                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                Resolved
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>


            {/* ===================================================== */}
            {/* R&D IMPORT */}
            {/* ===================================================== */}

            {isRnD && (
                <Card className="border border-dashed border-[var(--border-light)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
                    <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-muted)] text-[var(--brand-accent)]">
                                <FiUpload className="size-4" />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-[var(--text-primary)]">
                                    Batch Import General FAQs
                                </p>

                                <p className="mt-1 text-xs text-[var(--text-muted)]">
                                    Import a DOCX containing alternating
                                    question and answer paragraphs.
                                </p>
                            </div>
                        </div>

                        <label className="inline-flex cursor-pointer">
                            <input
                                type="file"
                                accept=".docx"
                                className="hidden"
                                onChange={handleFaqUpload}
                            />

                            <span className="inline-flex h-8 items-center justify-center gap-2 rounded-md border border-[var(--border-light)] bg-[var(--bg-main)] px-3 text-xs font-medium text-[var(--text-primary)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--combobox-hover)]">
                                <FiUpload className="size-3.5" />
                                Select DOCX
                            </span>
                        </label>
                    </CardContent>
                </Card>
            )}


            {/* ===================================================== */}
            {/* ASK QUESTION */}
            {/* ===================================================== */}

            <Card className="overflow-visible border border-[var(--border-light)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
                <CardHeader className="pb-4">
                    <div className="flex items-start gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--bg-muted)] text-[var(--brand-accent)]">
                            <FiMessageCircle className="size-4" />
                        </div>

                        <div>
                            <CardTitle className="text-base text-[var(--text-primary)]">
                                Ask a Technical Question
                            </CardTitle>

                            <CardDescription className="mt-1 text-[var(--text-muted)]">
                                Add product context so R&D can give a more precise
                                technical resolution.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <form
                        onSubmit={handleAskQuestion}
                        className="flex flex-col gap-4"
                    >
                        {/* QUESTION */}
                        <Textarea
                            required
                            value={newQuestion}
                            onChange={(e) =>
                                setNewQuestion(e.target.value)
                            }
                            placeholder="e.g. What is the maximum operating temperature of the TI-128C Oven?"
                            className={`min-h-[90px] resize-none ${themedTextareaClass}`}
                        />

                        {/* PRODUCT CONTEXT */}
                        <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-muted)] p-4">
                            <div className="mb-3 flex items-center gap-2">
                                <div className="flex size-6 items-center justify-center rounded-md bg-[var(--bg-surface)] text-[var(--brand-accent)]">
                                    <FiLayers className="size-3.5" />
                                </div>

                                <span className="text-xs font-semibold text-[var(--brand-accent)]">
                                    Product Context
                                </span>

                                <Badge
                                    variant="outline"
                                    className="border-[var(--border-light)] bg-[var(--bg-main)] text-[10px] text-[var(--text-muted)]"
                                >
                                    Optional
                                </Badge>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <SearchableMultiselect
                                    label="Item Group"
                                    options={itemGroupOptions}
                                    value={selectedItemGroup}
                                    onChange={handleItemGroupChange}
                                    compact
                                />

                                <SearchableMultiselect
                                    label="Item Code"
                                    options={itemCodeOptions}
                                    value={selectedItemCode}
                                    onChange={setSelectedItemCode}
                                    compact
                                />
                            </div>

                            {(selectedItemGroup.length > 0 ||
                                selectedItemCode.length > 0) && (
                                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[var(--border-light)] pt-3">
                                    <span className="mr-1 text-[11px] text-[var(--text-muted)]">
                                        Attached:
                                    </span>

                                    {selectedItemGroup.map((group) => (
                                        <Badge
                                            key={group}
                                            variant="secondary"
                                            className="border border-[var(--border-light)] bg-[var(--bg-main)] text-[10px] text-[var(--brand-accent)]"
                                        >
                                            Group: {group}
                                        </Badge>
                                    ))}

                                    {selectedItemCode.map((code) => (
                                        <Badge
                                            key={code}
                                            variant="secondary"
                                            className="border border-[var(--border-light)] bg-[var(--bg-main)] text-[10px] text-[var(--brand-success)]"
                                        >
                                            Item: {code}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* SUBMIT */}
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="gap-2 bg-[var(--brand-accent)] text-white hover:opacity-90"
                            >
                                <FiSend className="size-3.5" />

                                {isLoading
                                    ? "Submitting..."
                                    : "Submit to R&D"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>


            {/* ===================================================== */}
            {/* KNOWLEDGE BASE INDEX */}
            {/* ===================================================== */}

            <Card className="min-h-0 overflow-hidden border border-[var(--border-light)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
                <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--bg-muted)] text-[var(--brand-accent)]">
                                <FiDatabase className="size-4" />
                            </div>

                            <div>
                                <CardTitle className="text-base text-[var(--text-primary)]">
                                    Knowledge Base Index
                                </CardTitle>

                                <CardDescription className="mt-1 text-[var(--text-muted)]">
                                    Questions are prioritised by resolution
                                    status.
                                </CardDescription>
                            </div>
                        </div>

                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                            <div className="flex flex-wrap items-center gap-2">

                                {/* FILTER ICON */}
                                <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--bg-muted)] text-[var(--brand-accent)]">
                                    <FiFilter className="size-3.5" />
                                </div>

                                {/* STATUS */}
                                <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-main)]">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) =>
                                            setStatusFilter(e.target.value)
                                        }
                                        className="
                                            h-9
                                            min-w-[150px]
                                            cursor-pointer
                                            rounded-lg
                                            border-0
                                            bg-[var(--bg-main)]
                                            px-3
                                            text-xs
                                            font-medium
                                            text-[var(--text-primary)]
                                            outline-none
                                            ring-0
                                            transition-colors
                                            hover:bg-[var(--combobox-hover)]
                                            focus:ring-2
                                            focus:ring-[var(--brand-accent)]
                                        "
                                    >
                                        <option
                                            value="all"
                                            className="bg-[var(--bg-surface)] text-[var(--text-primary)]"
                                        >
                                            All questions
                                        </option>

                                        <option
                                            value="pending"
                                            className="bg-[var(--bg-surface)] text-[var(--text-primary)]"
                                        >
                                            Pending answers
                                        </option>

                                        <option
                                            value="completed"
                                            className="bg-[var(--bg-surface)] text-[var(--text-primary)]"
                                        >
                                            Resolved / completed
                                        </option>
                                    </select>
                                </div>

                                {/* ITEM GROUP */}
                                <div className="min-w-[150px]">
                                    <SearchableMultiselect
                                        label="Group"
                                        options={itemGroupOptions}
                                        value={filterItemGroup}
                                        onChange={handleFilterItemGroupChange}
                                        compact
                                    />
                                </div>

                                {/* ITEM CODE */}
                                <div className="min-w-[150px]">
                                    <SearchableMultiselect
                                        label="Item"
                                        options={filterItemCodeOptions}
                                        value={filterItemCode}
                                        onChange={setFilterItemCode}
                                        compact
                                    />
                                </div>

                                {/* RESET */}
                                {(statusFilter !== "all" ||
                                    filterItemGroup.length > 0 ||
                                    filterItemCode.length > 0) && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="size-9 text-[var(--text-muted)] hover:bg-[var(--warning-row)] hover:text-[var(--brand-danger)]"
                                        title="Clear filters"
                                        onClick={() => {
                                            setStatusFilter("all");
                                            setFilterItemGroup([]);
                                            setFilterItemCode([]);
                                        }}
                                    >
                                        <FiX className="size-4" />
                                    </Button>
                                )}
                            </div>

                            {/* ACTIVE FILTER SUMMARY */}
                            {(filterItemGroup.length > 0 ||
                                filterItemCode.length > 0) && (
                                <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                                    {filterItemGroup.map((group) => (
                                        <Badge
                                            key={group}
                                            variant="secondary"
                                            className="border border-[var(--border-light)] bg-[var(--bg-muted)] text-[10px] text-[var(--brand-accent)]"
                                        >
                                            Group: {group}
                                        </Badge>
                                    ))}

                                    {filterItemCode.map((code) => (
                                        <Badge
                                            key={code}
                                            variant="secondary"
                                            className="border border-[var(--border-light)] bg-[var(--bg-muted)] text-[10px] text-[var(--brand-success)]"
                                        >
                                            Item: {code}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <Separator className="bg-[var(--border-light)]" />

                <CardContent className="p-0">
                    <div className="flex flex-col">
                        {filteredFaqs.map((faq, index) => {
                            const isAnswered =
                                faq.status === "Answered";

                            const asker =
                                faq.asked_by?.split("@")[0] ||
                                "Unknown";

                            return (
                                <div
                                    key={faq.id}
                                    className={[
                                        "group relative p-5 transition-all duration-200 hover:bg-[var(--combobox-hover)]",
                                    ].join(" ")}
                                >
                                    {/* QUESTION HEADER */}
                                    <div className="flex gap-3">
                                        <div
                                            className={[
                                                "absolute left-0 top-0 h-full w-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100",
                                                isAnswered
                                                    ? "bg-[var(--brand-success)]"
                                                    : "bg-[var(--brand-accent)]",
                                            ].join(" ")}
                                        />

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold leading-5 text-[var(--text-primary)]">
                                                        {faq.question}
                                                    </p>

                                                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[var(--text-muted)]">
                                                        <span className="inline-flex items-center gap-1">
                                                            <FiUser className="size-3" />
                                                            {asker}
                                                        </span>

                                                        <span>•</span>

                                                        <span>
                                                            {new Date(
                                                                faq.created_at
                                                            ).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        isAnswered
                                                            ? "w-fit gap-1 border-[var(--brand-success)] bg-[var(--bg-muted)] text-[var(--brand-success)]"
                                                            : "w-fit gap-1 border-[var(--brand-accent)] bg-[var(--bg-muted)] text-[var(--brand-accent)]"
                                                    }
                                                >
                                                    {isAnswered ? (
                                                        <>
                                                            <FiCheckCircle className="size-3" />
                                                            Resolved
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FiClock className="size-3" />
                                                            Pending
                                                        </>
                                                    )}
                                                </Badge>
                                            </div>

                                            {/* PRODUCT CONTEXT */}
                                            {(faq.item_group ||
                                                faq.item_code) && (
                                                <div className="mt-3 flex flex-wrap gap-1.5">
                                                    {faq.item_group && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="border border-[var(--border-light)] bg-[var(--bg-muted)] text-[10px] text-[var(--brand-accent)]"
                                                        >
                                                            Group:{" "}
                                                            {
                                                                faq.item_group
                                                            }
                                                        </Badge>
                                                    )}

                                                    {faq.item_code && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="border border-[var(--border-light)] bg-[var(--bg-muted)] text-[10px] text-[var(--brand-success)]"
                                                        >
                                                            Item:{" "}
                                                            {
                                                                faq.item_code
                                                            }
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}

                                            {/* ANSWER */}
                                            {isAnswered ? (
                                                <div className="mt-4 rounded-xl border border-[var(--brand-success)] bg-[var(--bg-muted)] p-4">
                                                    <div className="mb-2 flex items-center gap-2">
                                                        <div className="flex size-6 items-center justify-center rounded-md bg-[var(--bg-surface)] text-[var(--brand-success)]">
                                                            <FiCheckCircle className="size-3.5" />
                                                        </div>

                                                        <span className="text-xs font-semibold text-[var(--brand-success)]">
                                                            Technical Resolution
                                                        </span>

                                                        {faq.answered_by && (
                                                            <span className="text-[10px] text-[var(--text-muted)]">
                                                                •{" "}
                                                                {
                                                                    faq
                                                                        .answered_by
                                                                        .split(
                                                                            "@"
                                                                        )[0]
                                                                }
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--text-primary)]">
                                                        {faq.answer}
                                                    </p>
                                                </div>
                                            ) : (
                                                isRnD && (
                                                    <div className="mt-4 rounded-lg border border-[var(--brand-accent)] bg-[var(--bg-muted)] p-4">
                                                        <div className="mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex size-6 items-center justify-center rounded-md bg-[var(--bg-surface)] text-[var(--brand-accent)]">
                                                                    <FiDatabase className="size-3.5" />
                                                                </div>

                                                                <p className="text-xs font-semibold text-[var(--brand-accent)]">
                                                                    Provide Technical Resolution
                                                                </p>
                                                            </div>

                                                            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                                                                Your answer will
                                                                be published and
                                                                synchronised to
                                                                the knowledge
                                                                vector database.
                                                            </p>
                                                        </div>

                                                        <Textarea
                                                            rows={4}
                                                            value={
                                                                answerTexts[
                                                                    faq.id
                                                                ] || ""
                                                            }
                                                            onChange={(e) =>
                                                                setAnswerTexts(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        [faq.id]:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    })
                                                                )
                                                            }
                                                            placeholder="Provide the technical resolution here..."
                                                            className={`resize-none ${themedTextareaClass}`}
                                                        />

                                                        <div className="mt-3 flex justify-end">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                disabled={
                                                                    !answerTexts[
                                                                        faq.id
                                                                    ]?.trim()
                                                                }
                                                                onClick={() =>
                                                                    handleAnswerQuestion(
                                                                        faq.id
                                                                    )
                                                                }
                                                                className="gap-2 bg-[var(--brand-success)] text-white hover:opacity-90"
                                                            >
                                                                <FiCheckCircle className="size-3.5" />
                                                                Publish Answer
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    {index <
                                        filteredFaqs.length - 1 && (
                                        <Separator className="mt-5 bg-[var(--border-light)]" />
                                    )}
                                </div>
                            );
                        })}

                        {filteredFaqs.length === 0 && (
                            <div className="flex min-h-[180px] flex-col items-center justify-center px-5 text-center">
                                <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)]">
                                    <FiMessageCircle className="size-5" />
                                </div>

                                <p className="text-sm font-medium text-[var(--text-primary)]">
                                    No questions found
                                </p>

                                <p className="mt-1 text-xs text-[var(--text-muted)]">
                                    Try changing the status filter or submit
                                    a new technical question.
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}