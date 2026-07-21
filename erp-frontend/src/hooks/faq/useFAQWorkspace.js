import { useState, useMemo, useCallback } from "react";
import API from "../../api/api";

export default function useFAQWorkspace({sessionToken, user, showErrorModal, addToast, setAlertMessage, setIsAlertOpen}) {

    const [faqs, setFaqs] = useState([]);
    const [newQuestion, setNewQuestion] = useState("");
    const [answerTexts, setAnswerTexts] = useState({});
    const [statusFilter, setStatusFilter] = useState("all");
    const [isLoading, setIsLoading] = useState(false);

    const isRnD = ["R&D Engineer", "Admin", "Chief Full Stack Developer"].includes(user?.role);

    const loadFaqs = useCallback(async () => {
        if (!sessionToken) return;

        try {
            const data = await API.fetchFaqs(sessionToken);
            setFaqs(Array.isArray(data) ? data : []);
        } catch (err) {
            showErrorModal?.("Fetch Error", err.message);
        }
    }, [sessionToken, showErrorModal]);

    const handleAskQuestion = async (e) => {
        e.preventDefault();

        if (!newQuestion.trim()) return;

        setIsLoading(true);

        try {
            await API.askFaqQuestion({ question: newQuestion }, sessionToken);

            setNewQuestion("");
            await loadFaqs();

            setAlertMessage?.("✅ Question submitted to R&D.");
            setIsAlertOpen?.(true);

        } catch (err) {
            showErrorModal?.("Error", err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswerQuestion = async (faqId) => {

        const answer = answerTexts[faqId];

        if (!answer?.trim()) return;

        try {

            await API.answerFaqQuestion(faqId, { answer }, sessionToken);

            setAnswerTexts(prev => ({...prev, [faqId]: ""}));

            await loadFaqs();

            setAlertMessage?.("✅ Answer saved to Vector Database.");
            setIsAlertOpen?.(true);

        } catch (err) {
            showErrorModal?.("Error", err.message);
        }
    };

    const handleFaqUpload = useCallback(async (e) => {
        const file = e.target.files?.[0];

        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {

            await API.uploadFaqDoc(formData, sessionToken);

            addToast?.("FAQ Document parsed and embedded successfully, refreshing the page", "success");
            setIsLoading(true);
            await loadFaqs();
            setIsLoading(false);
        } catch (err) {
            showErrorModal?.("Upload Failed", err.message);
        }finally{
            e.target.value = "";
            
        }
    }, [sessionToken, loadFaqs, addToast, showErrorModal]);

    const filteredFaqs = useMemo(() => {

        const sorted = [...faqs].sort((a, b) => {
            if (a.status === b.status) return 0;
            return a.status === "Answered" ? 1 : -1;
        });

        return sorted.filter(faq => {
            if (statusFilter === "pending")
                return faq.status === "Pending";

            if (statusFilter === "completed")
                return faq.status === "Answered";

            return true;
        });

    }, [faqs, statusFilter]);

    return {faqs, filteredFaqs, newQuestion, setNewQuestion, answerTexts, setAnswerTexts, statusFilter, setStatusFilter, isLoading, isRnD, loadFaqs,
        handleAskQuestion, handleAnswerQuestion, handleFaqUpload};
}