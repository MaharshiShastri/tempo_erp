import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Label } from "@/components/ui/label";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Textarea } from "@/components/ui/textarea";

import {
    Alert,
    AlertDescription,
} from "@/components/ui/alert";

import {
    Check,
    Copy,
    FileText,
    Sparkles,
    Bot,
    Settings2,
    AlertCircle,
    WandSparkles,
} from "lucide-react";

const LLM_OPTIONS = [
    {
        value: "chatgpt",
        label: "ChatGPT",
    },
    {
        value: "claude",
        label: "Claude",
    },
    {
        value: "gemini",
        label: "Gemini",
    },
    {
        value: "grok",
        label: "Grok",
    },
    {
        value: "deepseek",
        label: "DeepSeek",
    },
    {
        value: "llama",
        label: "Llama",
    },
    {
        value: "perplexity",
        label: "Perplexity",
    },
];

const PROMPT_TYPES = [
    {
        value: "normal",
        label: "Normal Prompt",
    },
    {
        value: "system",
        label: "System Prompt",
    },
];

export default function PromptGeneratorView({ state }) {
    const [copied, setCopied] = useState(false);

    const {
        promptRequirements,
        setPromptRequirements,

        promptLLM,
        setPromptLLM,

        promptType,
        setPromptType,

        generatedPrompt,

        promptLoading,
        promptError,

        generatePrompt,
        copyPrompt,
    } = state;

    const handleCopy = async () => {
        const success = await copyPrompt();

        if (success) {
            setCopied(true);

            setTimeout(() => {
                setCopied(false);
            }, 1800);
        }
    };

    const themedInputClass =
        "border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]";

    const themedSelectTriggerClass =
        "w-full border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]";

    const themedSelectContentClass =
        "border-[var(--border-light)] bg-[var(--bg-surface)] text-[var(--text-primary)]";

    const themedSelectItemClass =
        "focus:bg-[var(--combobox-hover)] focus:text-[var(--text-primary)]";

    return (
        <div className="min-h-full space-y-6 bg-[var(--bg-main)] p-4 text-[var(--text-primary)] md:p-6">

            {/* =========================================================
                PAGE HEADER
            ========================================================= */}

            <div className="flex flex-col gap-4">
                <div className="flex items-start gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] shadow-[var(--shadow-sm)]">
                        <WandSparkles className="size-5" />
                    </div>

                    <div className="min-w-0">
                        <div className="mb-1 flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
                            <span>AI Tools</span>
                            <span>/</span>
                            <span className="text-[var(--text-primary)]">
                                Prompt Generator
                            </span>
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                            AI Prompt Generator
                        </h1>

                        <p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">
                            Create a model-specific prompt from your
                            requirements and your company context.
                        </p>
                    </div>
                </div>
            </div>

            {/* =========================================================
                MAIN GRID
            ========================================================= */}

            <div className="grid gap-6 xl:grid-cols-2">

                {/* =====================================================
                    CONFIGURATION CARD
                ===================================================== */}

                <Card className="gap-0 overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-0 text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
                    <CardHeader className="space-y-0 border-b border-[var(--border-light)] bg-[var(--bg-muted)] px-5 py-4 md:px-6">
                        <div className="flex items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]">
                                <Settings2 className="size-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <CardTitle className="m-0 text-base font-semibold leading-tight text-[var(--text-primary)]">
                                    Prompt Configuration
                                </CardTitle>

                                <CardDescription className="m-0 mt-1 text-xs leading-5 text-[var(--text-muted)]">
                                    Describe what the prompt should accomplish
                                    and select the target model.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6 p-5 text-[var(--text-primary)] md:p-6">

                        {/* =================================================
                            REQUIREMENTS
                        ================================================= */}

                        <div className="space-y-2">
                            <Label
                                htmlFor="prompt-requirements"
                                className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]"
                            >
                                <FileText className="size-4 text-[var(--brand-accent)]" />
                                Requirements
                            </Label>

                            <Textarea
                                id="prompt-requirements"
                                value={promptRequirements}
                                onChange={(event) =>
                                    setPromptRequirements(
                                        event.target.value
                                    )
                                }
                                placeholder="Describe what you want the prompt to accomplish..."
                                className={`${themedInputClass} min-h-[240px] resize-y`}
                            />

                            <p className="text-xs text-[var(--text-muted)]">
                                Be specific about the task, expected output,
                                constraints, tone, and relevant context.
                            </p>
                        </div>

                        {/* =================================================
                            MODEL SETTINGS
                        ================================================= */}

                        <div className="grid gap-5 sm:grid-cols-2">

                            {/* TARGET LLM */}

                            <div className="space-y-2">
                                <Label
                                    htmlFor="prompt-llm"
                                    className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]"
                                >
                                    <Bot className="size-4 text-[var(--brand-accent)]" />
                                    Target LLM
                                </Label>

                                <Select
                                    value={promptLLM}
                                    onValueChange={setPromptLLM}
                                >
                                    <SelectTrigger
                                        id="prompt-llm"
                                        className={themedSelectTriggerClass}
                                    >
                                        <SelectValue placeholder="Select model" />
                                    </SelectTrigger>

                                    <SelectContent
                                        className={themedSelectContentClass}
                                    >
                                        {LLM_OPTIONS.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                                className={themedSelectItemClass}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* PROMPT TYPE */}

                            <div className="space-y-2">
                                <Label
                                    htmlFor="prompt-type"
                                    className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]"
                                >
                                    <Sparkles className="size-4 text-[var(--brand-accent)]" />
                                    Prompt Type
                                </Label>

                                <Select
                                    value={promptType}
                                    onValueChange={setPromptType}
                                >
                                    <SelectTrigger
                                        id="prompt-type"
                                        className={themedSelectTriggerClass}
                                    >
                                        <SelectValue placeholder="Select prompt type" />
                                    </SelectTrigger>

                                    <SelectContent
                                        className={themedSelectContentClass}
                                    >
                                        {PROMPT_TYPES.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                                className={themedSelectItemClass}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* =================================================
                            GENERATE BUTTON
                        ================================================= */}

                        <div className="flex justify-end border-t border-[var(--border-light)] pt-5">
                            <Button
                                type="button"
                                onClick={generatePrompt}
                                disabled={
                                    promptLoading ||
                                    !promptRequirements.trim()
                                }
                                className="min-w-[170px] bg-[var(--brand-accent)] text-white shadow-[var(--shadow-sm)] hover:opacity-90"
                            >
                                {promptLoading ? (
                                    <>
                                        <Sparkles className="mr-2 size-4 animate-pulse" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <WandSparkles className="mr-2 size-4" />
                                        Generate Prompt
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* =================================================
                            ERROR
                        ================================================= */}

                        {promptError && (
                            <Alert className="border-[var(--brand-danger)]/30 bg-[var(--warning-row)] text-[var(--brand-danger)]">
                                <AlertCircle className="size-4" />

                                <AlertDescription className="text-[var(--brand-danger)]">
                                    {promptError}
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* =====================================================
                    OUTPUT CARD
                ===================================================== */}

                <Card className="gap-0 overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-0 text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
                    <CardHeader className="space-y-0 border-b border-[var(--border-light)] bg-[var(--bg-muted)] px-5 py-4 md:px-6">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-success)]/10 text-[var(--brand-success)]">
                                    <Sparkles className="size-4" />
                                </div>

                                <div className="min-w-0">
                                    <CardTitle className="m-0 text-base font-semibold leading-tight text-[var(--text-primary)]">
                                        Generated Prompt
                                    </CardTitle>

                                    <CardDescription className="m-0 mt-1 text-xs leading-5 text-[var(--text-muted)]">
                                        Your model-specific prompt will appear here.
                                    </CardDescription>
                                </div>
                            </div>

                            {generatedPrompt && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={handleCopy}
                                    title={copied ? "Copied" : "Copy prompt"}
                                    aria-label={
                                        copied ? "Copied" : "Copy prompt"
                                    }
                                    className={
                                        copied
                                            ? "shrink-0 border-[var(--brand-success)]/40 bg-[var(--brand-success)]/10 text-[var(--brand-success)] hover:bg-[var(--brand-success)]/20]"
                                            : "shrink-0 border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)]"
                                    }
                                >
                                    {copied ? (
                                        <Check className="size-4" />
                                    ) : (
                                        <Copy className="size-4" />
                                    )}
                                </Button>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="p-5 text-[var(--text-primary)] md:p-6">
                        {generatedPrompt ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-[var(--brand-success)]" />

                                        <span className="text-xs font-medium text-[var(--text-muted)]">
                                            Generated output
                                        </span>
                                    </div>

                                    <span className="text-xs text-[var(--text-muted)]">
                                        Read only
                                    </span>
                                </div>

                                <Textarea
                                    value={generatedPrompt}
                                    readOnly
                                    className={`${themedInputClass} min-h-[500px] resize-y bg-[var(--bg-muted)] font-mono text-sm leading-6`}
                                />
                            </div>
                        ) : (
                            <div className="flex min-h-[500px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-light)] bg-[var(--bg-muted)] px-6 text-center">
                                <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]">
                                    <Sparkles className="size-7" />
                                </div>

                                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                                    No prompt generated yet
                                </h3>

                                <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--text-muted)]">
                                    Enter your requirements, choose the
                                    target model and prompt type, then
                                    generate your model-specific prompt.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}