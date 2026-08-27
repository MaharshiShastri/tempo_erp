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


    return (
        <div className="min-h-full space-y-6 p-4 md:p-6">

            {/* =========================================================
                PAGE HEADER
            ========================================================= */}

            <div className="flex flex-col gap-4">

                <div className="flex items-start gap-4">

                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
                        <WandSparkles className="size-5" />
                    </div>

                    <div className="min-w-0">

                        <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <span>AI Tools</span>
                            <span>/</span>
                            <span className="text-foreground">
                                Prompt Generator
                            </span>
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight">
                            AI Prompt Generator
                        </h1>

                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
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

                <Card className="overflow-hidden border-border/70 shadow-sm">

                    <CardHeader className="border-b bg-gradient-to-r from-violet-500/10 via-background to-blue-500/10">

                        <div className="flex items-start gap-3">

                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                <Settings2 className="size-4.5" />
                            </div>

                            <div>

                                <CardTitle className="text-lg">
                                    Prompt Configuration
                                </CardTitle>

                                <CardDescription className="mt-1">
                                    Describe what you want the prompt
                                    to accomplish and choose the target
                                    model.
                                </CardDescription>

                            </div>

                        </div>

                    </CardHeader>


                    <CardContent className="space-y-6 p-5 md:p-6">


                        {/* =================================================
                            REQUIREMENTS
                        ================================================= */}

                        <div className="space-y-2">

                            <Label
                                htmlFor="prompt-requirements"
                                className="flex items-center gap-2 text-sm font-semibold"
                            >
                                <FileText className="size-4 text-violet-500" />
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
                                className="
                                    min-h-[240px]
                                    resize-y
                                    bg-background
                                    text-foreground
                                    placeholder:text-muted-foreground
                                    focus-visible:ring-violet-500/30
                                "
                            />

                            <p className="text-xs text-muted-foreground">
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
                                    className="flex items-center gap-2 text-sm font-semibold"
                                >
                                    <Bot className="size-4 text-blue-500" />
                                    Target LLM
                                </Label>

                                <Select
                                    value={promptLLM}
                                    onValueChange={setPromptLLM}
                                >

                                    <SelectTrigger
                                        id="prompt-llm"
                                        className="
                                            w-full
                                            bg-background
                                            text-foreground
                                            border-border
                                        "
                                    >
                                        <SelectValue placeholder="Select model" />
                                    </SelectTrigger>

                                    <SelectContent>

                                        {LLM_OPTIONS.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
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
                                    className="flex items-center gap-2 text-sm font-semibold"
                                >
                                    <Sparkles className="size-4 text-amber-500" />
                                    Prompt Type
                                </Label>

                                <Select
                                    value={promptType}
                                    onValueChange={setPromptType}
                                >

                                    <SelectTrigger
                                        id="prompt-type"
                                        className="
                                            w-full
                                            bg-background
                                            text-foreground
                                            border-border
                                        "
                                    >
                                        <SelectValue placeholder="Select prompt type" />
                                    </SelectTrigger>

                                    <SelectContent>

                                        {PROMPT_TYPES.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
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

                        <div className="flex justify-end border-t pt-5">

                            <Button
                                type="button"
                                onClick={generatePrompt}
                                disabled={
                                    promptLoading ||
                                    !promptRequirements.trim()
                                }
                                className="
                                    min-w-[170px]
                                    bg-violet-600
                                    text-white
                                    shadow-sm
                                    hover:bg-violet-700
                                    dark:bg-violet-500
                                    dark:hover:bg-violet-600
                                "
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
                            <Alert
                                variant="destructive"
                                className="border-red-500/30 bg-red-500/5"
                            >

                                <AlertCircle className="size-4" />

                                <AlertDescription>
                                    {promptError}
                                </AlertDescription>

                            </Alert>
                        )}

                    </CardContent>

                </Card>


                {/* =====================================================
                    OUTPUT CARD
                ===================================================== */}

                <Card className="overflow-hidden border-border/70 shadow-sm">

                    <CardHeader className="border-b bg-gradient-to-r from-emerald-500/10 via-background to-cyan-500/10">

                        <div className="flex items-start justify-between gap-4">

                            <div className="flex items-start gap-3">

                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <Sparkles className="size-4.5" />
                                </div>

                                <div>

                                    <CardTitle className="text-lg">
                                        Generated Prompt
                                    </CardTitle>

                                    <CardDescription className="mt-1">
                                        Your model-specific prompt will
                                        appear here.
                                    </CardDescription>

                                </div>

                            </div>


                            {/* COPY BUTTON */}

                            {generatedPrompt && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={handleCopy}
                                    title={
                                        copied
                                            ? "Copied"
                                            : "Copy prompt"
                                    }
                                    aria-label={
                                        copied
                                            ? "Copied"
                                            : "Copy prompt"
                                    }
                                    className={`
                                        shrink-0
                                        transition-all
                                        ${
                                            copied
                                                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15"
                                                : "hover:bg-muted"
                                        }
                                    `}
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


                    <CardContent className="p-5 md:p-6">

                        {generatedPrompt ? (

                            <div className="space-y-3">

                                <div className="flex items-center justify-between">

                                    <div className="flex items-center gap-2">

                                        <span className="size-2 rounded-full bg-emerald-500" />

                                        <span className="text-xs font-medium text-muted-foreground">
                                            Generated output
                                        </span>

                                    </div>

                                    <span className="text-xs text-muted-foreground">
                                        Read only
                                    </span>

                                </div>

                                <Textarea
                                    value={generatedPrompt}
                                    readOnly
                                    className="
                                        min-h-[500px]
                                        resize-y
                                        bg-muted/30
                                        font-mono
                                        text-sm
                                        leading-6
                                        text-foreground
                                        placeholder:text-muted-foreground
                                    "
                                />

                            </div>

                        ) : (

                            <div
                                className="
                                    flex
                                    min-h-[500px]
                                    flex-col
                                    items-center
                                    justify-center
                                    rounded-xl
                                    border
                                    border-dashed
                                    border-border
                                    bg-muted/20
                                    px-6
                                    text-center
                                "
                            >

                                <div className="
                                    mb-4
                                    flex
                                    size-14
                                    items-center
                                    justify-center
                                    rounded-2xl
                                    bg-violet-500/10
                                    text-violet-600
                                    dark:text-violet-400
                                ">
                                    <Sparkles className="size-7" />
                                </div>

                                <h3 className="text-sm font-semibold">
                                    No prompt generated yet
                                </h3>

                                <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
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