import { FiCopy, FiCheck } from "react-icons/fi";
import { useState } from "react";

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


    return (
        <div className="prompt-generator-page">

            <div className="prompt-generator-header">

                <div>

                    <div className="prompt-generator-breadcrumb">
                        <span>AI Tools</span>
                        <span>/</span>
                        <span>Prompt Generator</span>
                    </div>

                    <h1>
                        AI Prompt Generator
                    </h1>

                    <p>
                        Create a model-specific prompt from your
                        requirements and your company context.
                    </p>

                </div>

            </div>


            <div className="prompt-generator-grid">

                <div className="frappe-card prompt-generator-card">

                    <div className="system-header">

                        <div>

                            <h2>
                                Prompt Configuration
                            </h2>

                            <p className="prompt-generator-section-description">
                                Describe what you want the prompt to accomplish.
                            </p>

                        </div>

                    </div>


                    <div className="form-group">

                        <label className="input-label">
                            Requirements
                        </label>

                        <textarea
                            className="form-input prompt-generator-requirements"
                            value={promptRequirements}
                            onChange={(event) =>
                                setPromptRequirements(
                                    event.target.value
                                )
                            }
                            placeholder={
                                "Describe what you want the prompt to accomplish..."
                            }
                            rows={10}
                        />

                    </div>


                    <div className="form-grid-layout">

                        <div className="form-group">

                            <label className="input-label">
                                Target LLM
                            </label>

                            <select
                                className="form-select-native"
                                value={promptLLM}
                                onChange={(event) =>
                                    setPromptLLM(
                                        event.target.value
                                    )
                                }
                            >

                                {LLM_OPTIONS.map(
                                    (option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    )
                                )}

                            </select>

                        </div>


                        <div className="form-group">

                            <label className="input-label">
                                Prompt Type
                            </label>

                            <select
                                className="form-select-native"
                                value={promptType}
                                onChange={(event) =>
                                    setPromptType(
                                        event.target.value
                                    )
                                }
                            >

                                {PROMPT_TYPES.map(
                                    (option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    )
                                )}

                            </select>

                        </div>

                    </div>


                    <div className="prompt-generator-actions">

                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={generatePrompt}
                            disabled={
                                promptLoading ||
                                !promptRequirements.trim()
                            }
                        >
                            {promptLoading
                                ? "Generating..."
                                : "Generate Prompt"}
                        </button>

                    </div>


                    {promptError && (
                        <div className="prompt-generator-error">
                            {promptError}
                        </div>
                    )}

                </div>


                <div className="frappe-card prompt-generator-output-card">

                    <div className="system-header">

                        <div>

                            <h2>
                                Generated Prompt
                            </h2>

                            <p className="prompt-generator-section-description">
                                Your generated prompt will appear here.
                            </p>

                        </div>


                        {generatedPrompt && (
                            <button
                                type="button"
                                className="prompt-copy-icon-button"
                                onClick={async () => {

                                    const success = await copyPrompt();

                                    if (success) {
                                        setCopied(true);

                                        setTimeout(() => {
                                            setCopied(false);
                                        }, 1800);
                                    }

                                }}
                                title={copied ? "Copied" : "Copy prompt"}
                                aria-label={copied ? "Copied" : "Copy prompt"}
                            >
                                {copied ? (
                                    <FiCheck size={18} />
                                ) : (
                                    <FiCopy size={18} />
                                )}
                            </button>
                        )}

                    </div>


                    {generatedPrompt ? (

                        <textarea
                            className="form-input prompt-generator-output"
                            value={generatedPrompt}
                            readOnly
                            rows={20}
                        />

                    ) : (

                        <div className="prompt-generator-empty">

                            <div className="prompt-generator-empty-icon">
                                ✦
                            </div>

                            <strong>
                                No prompt generated yet
                            </strong>

                            <span>
                                Enter your requirements and generate a
                                model-specific prompt.
                            </span>

                        </div>

                    )}

                </div>

            </div>

        </div>
    );
}