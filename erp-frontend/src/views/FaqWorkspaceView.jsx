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

        // NEW KNOWLEDGE BASE FILTERS
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
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
            {/* ===================================================== */}
            {/* HEADER */}
            {/* ===================================================== */}

            <Card className="relative overflow-hidden border-blue-500/20 bg-gradient-to-br from-blue-500/[0.07] via-background to-violet-500/[0.04]">
            {/* Decorative color accents */}
            <div className="absolute -right-16 -top-16 size-48 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="absolute -bottom-20 left-1/3 size-40 rounded-full bg-violet-500/10 blur-3xl" />

            <CardHeader className="relative">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-600 shadow-sm dark:text-blue-400">
                            <FiDatabase className="size-5" />
                        </div>

                        <div>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <FiMessageCircle className="size-5 text-blue-600 dark:text-blue-400" />

                                <span>R&D Knowledge Base</span>
                            </CardTitle>

                            <CardDescription className="mt-1.5 max-w-2xl leading-6">
                                Sales inquiries and technical product
                                resolutions. Every resolved answer becomes
                                searchable knowledge for future AI
                                recommendations.
                            </CardDescription>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <Badge className="gap-1 border-blue-500/20 bg-blue-500/10 text-blue-700 hover:bg-blue-500/10 dark:text-blue-300">
                                    <FiSearch className="size-3" />
                                    Searchable Knowledge
                                </Badge>

                                <Badge className="gap-1 border-violet-500/20 bg-violet-500/10 text-violet-700 hover:bg-violet-500/10 dark:text-violet-300">
                                    <FiLayers className="size-3" />
                                    AI Ready
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <Badge
                        variant="secondary"
                        className="hidden gap-1.5 border border-blue-500/20 bg-blue-500/10 text-blue-700 sm:flex dark:text-blue-300"
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
                <Card className="group border-blue-500/15 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-md">
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 transition-transform duration-200 group-hover:scale-110 dark:text-blue-400">
                            <FiMessageCircle className="size-[18px]" />
                        </div>

                        <div>
                            <p className="text-2xl font-bold leading-none">
                                {faqs.length}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                                Total questions
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="group border-amber-500/15 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-500/30 hover:shadow-md">
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 transition-transform duration-200 group-hover:scale-110 dark:text-amber-400">
                            <FiClock className="size-[18px]" />
                        </div>

                        <div>
                            <p className="text-2xl font-bold leading-none">
                                {pendingCount}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                                Awaiting R&D
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="group border-emerald-500/15 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/30 hover:shadow-md">
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 transition-transform duration-200 group-hover:scale-110 dark:text-emerald-400">
                            <FiCheckCircle className="size-[18px]" />
                        </div>

                        <div>
                            <p className="text-2xl font-bold leading-none">
                                {answeredCount}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
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
                <Card className="border-dashed">
                    <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                <FiUpload className="size-4" />
                            </div>

                            <div>
                                <p className="text-sm font-semibold">
                                    Batch Import General FAQs
                                </p>

                                <p className="mt-1 text-xs text-muted-foreground">
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

                            <span className="inline-flex h-8 items-center justify-center gap-2 rounded-md border bg-background px-3 text-xs font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground">
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

            <Card className="overflow-visible border-blue-500/15">
                <CardHeader className="pb-4">
                    <div className="flex items-start gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <FiMessageCircle className="size-4" />
                        </div>

                        <div>
                            <CardTitle className="text-base">
                                Ask a Technical Question
                            </CardTitle>

                            <CardDescription className="mt-1">
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
                            className="min-h-[90px] resize-none border-blue-500/20 bg-blue-500/[0.02] focus-visible:ring-blue-500/40"
                        />

                        {/* PRODUCT CONTEXT */}
                        <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/[0.03] p-4">
                            <div className="mb-3 flex items-center gap-2">
                                <div className="flex size-6 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                                    <FiLayers className="size-3.5" />
                                </div>

                                <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                                    Product Context
                                </span>

                                <Badge
                                    variant="outline"
                                    className="border-cyan-500/20 bg-cyan-500/5 text-[10px] text-cyan-700 dark:text-cyan-300"
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
                                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t pt-3">
                                    <span className="mr-1 text-[11px] text-muted-foreground">
                                        Attached:
                                    </span>

                                    {selectedItemGroup.map((group) => (
                                        <Badge
                                            key={group}
                                            variant="secondary"
                                            className="bg-blue-500/10 text-[10px] text-blue-600 hover:bg-blue-500/10 dark:text-blue-400"
                                        >
                                            Group: {group}
                                        </Badge>
                                    ))}

                                    {selectedItemCode.map((code) => (
                                        <Badge
                                            key={code}
                                            variant="secondary"
                                            className="bg-emerald-500/10 text-[10px] text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
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
                                className="gap-2"
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

            <Card className="min-h-0 overflow-hidden border-violet-500/15">
                <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                <FiDatabase className="size-4" />
                            </div>

                            <div>
                                <CardTitle className="text-base">
                                    Knowledge Base Index
                                </CardTitle>

                                <CardDescription className="mt-1">
                                    Questions are prioritised by resolution
                                    status.
                                </CardDescription>
                            </div>
                        </div>

                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                            <div className="flex flex-wrap items-center gap-2">

                                {/* FILTER ICON */}
                                <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                                    <FiFilter className="size-3.5" />
                                </div>

                                {/* STATUS */}
                                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/[0.04]">
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
                                            bg-background
                                            px-3
                                            text-xs
                                            font-medium
                                            text-foreground
                                            outline-none
                                            ring-0
                                            transition-colors
                                            hover:bg-cyan-500/[0.05]
                                            focus:ring-2
                                            focus:ring-cyan-500/30
                                        "
                                    >
                                        <option
                                            value="all"
                                            className="bg-background text-foreground"
                                        >
                                            All questions
                                        </option>

                                        <option
                                            value="pending"
                                            className="bg-background text-foreground"
                                        >
                                            Pending answers
                                        </option>

                                        <option
                                            value="completed"
                                            className="bg-background text-foreground"
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
                                        className="
                                            size-9
                                            text-muted-foreground
                                            hover:bg-rose-500/10
                                            hover:text-rose-600
                                            dark:hover:text-rose-400
                                        "
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
                                            className="border border-blue-500/15 bg-blue-500/10 text-[10px] text-blue-700 dark:text-blue-300"
                                        >
                                            Group: {group}
                                        </Badge>
                                    ))}

                                    {filterItemCode.map((code) => (
                                        <Badge
                                            key={code}
                                            variant="secondary"
                                            className="border border-emerald-500/15 bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-300"
                                        >
                                            Item: {code}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <Separator />

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
                                    "group relative p-5 transition-all duration-200",
                                    isAnswered
                                        ? "hover:bg-emerald-500/[0.025]"
                                        : "hover:bg-amber-500/[0.025]",
                                    ].join(" ")}
                                >
                                    {/* QUESTION HEADER */}
                                    <div className="flex gap-3">
                                        <div
                                            className={[
                                                "absolute left-0 top-0 h-full w-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100",
                                                isAnswered
                                                    ? "bg-emerald-500"
                                                    : "bg-amber-500",
                                            ].join(" ")}
                                        >
                                            Q
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold leading-5">
                                                        {faq.question}
                                                    </p>

                                                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
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
                                                            ? "w-fit gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                            : "w-fit gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
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
                                                            className="bg-blue-500/10 text-[10px] text-blue-600 hover:bg-blue-500/10 dark:text-blue-400"
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
                                                            className="bg-emerald-500/10 text-[10px] text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
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
                                                <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-4">
                                                    <div className="mb-2 flex items-center gap-2">
                                                        <div className="flex size-6 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                            <FiCheckCircle className="size-3.5" />
                                                        </div>

                                                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                                            Technical Resolution
                                                        </span>

                                                        {faq.answered_by && (
                                                            <span className="text-[10px] text-muted-foreground">
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

                                                    <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                                                        {faq.answer}
                                                    </p>
                                                </div>
                                            ) : (
                                                isRnD && (
                                                    <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                                                        <div className="mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex size-6 items-center justify-center rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                                                    <FiDatabase className="size-3.5" />
                                                                </div>

                                                                <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                                                                    Provide Technical Resolution
                                                                </p>
                                                            </div>

                                                            <p className="mt-1 text-[11px] text-muted-foreground">
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
                                                            className="resize-none bg-background"
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
                                                                className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
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
                                        <Separator className="mt-5" />
                                    )}
                                </div>
                            );
                        })}

                        {filteredFaqs.length === 0 && (
                            <div className="flex min-h-[180px] flex-col items-center justify-center px-5 text-center">
                                <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                    <FiMessageCircle className="size-5" />
                                </div>

                                <p className="text-sm font-medium">
                                    No questions found
                                </p>

                                <p className="mt-1 text-xs text-muted-foreground">
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