import { useState } from "react";
import API from "../api/api";

export const usePromptGenerator = ({sessionToken}) => {

    const [promptRequirements, setPromptRequirements] = useState("");

    const [promptLLM, setPromptLLM] = useState("chatgpt");

    const [promptType, setPromptType] = useState("normal");

    const [generatedPrompt, setGeneratedPrompt] = useState("");

    const [promptLoading, setPromptLoading] = useState(false);

    const [promptError, setPromptError] = useState(null);


    const generatePrompt = async () => {

        if (!promptRequirements.trim()) {
            return;
        }

        setPromptLoading(true);
        setPromptError(null);
        setGeneratedPrompt("");

        try {

            const response = await API.generatePrompt(
                sessionToken,
                promptRequirements.trim(),
                promptLLM,
                promptType
            );

            setGeneratedPrompt(
                response.prompt || ""
            );

            return response;

        } catch (error) {

            setPromptError(
                error.message ||
                "Failed to generate prompt."
            );
            return null;
        } finally {

            setPromptLoading(false);
        }
    };


    const clearPrompt = () => {

        setGeneratedPrompt("");
        setPromptError(null);
    };


    const copyPrompt = async () => {
        if (!generatedPrompt) {
            return false;
        }

        try {
            // Modern Clipboard API
            if (
                navigator.clipboard &&
                typeof navigator.clipboard.writeText === "function"
            ) {
                await navigator.clipboard.writeText(generatedPrompt);
                return true;
            }

            // Fallback for HTTP / older browsers
            const textArea = document.createElement("textarea");

            textArea.value = generatedPrompt;
            textArea.setAttribute("readonly", "");
            textArea.style.position = "fixed";
            textArea.style.opacity = "0";
            textArea.style.pointerEvents = "none";

            document.body.appendChild(textArea);

            textArea.focus();
            textArea.select();

            const copied = document.execCommand("copy");

            document.body.removeChild(textArea);

            return copied;

        } catch (error) {
            console.error("Clipboard copy failed:", error);
            return false;
        }
    };


    return {
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
        clearPrompt,
        copyPrompt,
    };
};