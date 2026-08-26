import { useState, useMemo, useCallback } from "react";
import API from "../../api/api";

export default function useFAQWorkspace({sessionToken, user, itemsMaster = [], showErrorModal, addToast, setAlertMessage, setIsAlertOpen,}) {
    const [faqs, setFaqs] = useState([]);
    const [newQuestion, setNewQuestion] = useState("");
    const [answerTexts, setAnswerTexts] = useState({});
    const [statusFilter, setStatusFilter] = useState("all");
    const [isLoading, setIsLoading] = useState(false);

    // NEW
    const [selectedItemGroup, setSelectedItemGroup] = useState([]);
    const [selectedItemCode, setSelectedItemCode] = useState([]);
    const [filterItemGroup, setFilterItemGroup] = useState([]);
    const [filterItemCode, setFilterItemCode] = useState([]);
    
    const isRnD = ["R&D Engineer", "Admin", "Chief Full Stack Developer",].includes(user?.role);

    // ------------------------------------------------------------
    // PRODUCT OPTIONS
    // ------------------------------------------------------------

    const activeItems = useMemo(
        () =>
            (itemsMaster ?? []).filter(
                (item) => item?.is_active !== false
            ),
        [itemsMaster]
    );

    const itemGroupOptions = useMemo(
        () =>
            [
                ...new Set(
                    activeItems
                        .map((item) => item.item_group)
                        .filter(Boolean)
                ),
            ].sort(),
        [activeItems]
    );

    const filterItemCodeOptions = useMemo(() => {
        if (filterItemGroup.length === 0) {
            return activeItems
                .map((item) => item.item_code)
                .filter(Boolean)
                .sort();
        }

        return activeItems
            .filter((item) =>
                filterItemGroup.includes(item.item_group)
            )
            .map((item) => item.item_code)
            .filter(Boolean)
            .sort();
    }, [activeItems, filterItemGroup]);

    const handleFilterItemGroupChange = useCallback(
        (groups) => {
            setFilterItemGroup(groups);

            setFilterItemCode((currentCodes) =>
                currentCodes.filter((code) =>
                    activeItems.some(
                        (item) =>
                            item.item_code === code &&
                            groups.includes(item.item_group)
                    )
                )
            );
        },
        [activeItems]
    );
    const itemCodeOptions = useMemo(() => {
        const selectedGroups = selectedItemGroup ?? [];

        if (selectedGroups.length === 0) {
            return activeItems
                .map((item) => item.item_code)
                .filter(Boolean)
                .sort();
        }

        return activeItems
            .filter((item) =>
                selectedGroups.includes(item.item_group)
            )
            .map((item) => item.item_code)
            .filter(Boolean)
            .sort();
    }, [activeItems, selectedItemGroup]);

    // Keep selected item codes valid when group selection changes.
    const handleItemGroupChange = useCallback(
        (groups) => {
            setSelectedItemGroup(groups);

            setSelectedItemCode((currentCodes) =>
                currentCodes.filter((code) =>
                    activeItems.some(
                        (item) =>
                            item.item_code === code &&
                            groups.includes(item.item_group)
                    )
                )
            );
        },
        [activeItems]
    );

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
            await API.askFaqQuestion(
                {
                    question: newQuestion,

                    // NEW
                    item_code:
                        selectedItemCode.length === 1
                            ? selectedItemCode[0]
                            : null,

                    item_group:
                        selectedItemGroup.length === 1
                            ? selectedItemGroup[0]
                            : null,
                },
                sessionToken
            );

            setNewQuestion("");

            // Optional: reset context after submission.
            setSelectedItemGroup([]);
            setSelectedItemCode([]);

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
            await API.answerFaqQuestion(
                faqId,
                { answer },
                sessionToken
            );

            setAnswerTexts((prev) => ({
                ...prev,
                [faqId]: "",
            }));

            await loadFaqs();

            setAlertMessage?.("✅ Answer saved to Vector Database.");
            setIsAlertOpen?.(true);
        } catch (err) {
            showErrorModal?.("Error", err.message);
        }
    };

    const handleFaqUpload = useCallback(
        async (e) => {
            const file = e.target.files?.[0];

            if (!file) return;

            const formData = new FormData();
            formData.append("file", file);

            try {
                await API.uploadFaqDoc(
                    formData,
                    sessionToken
                );

                addToast?.(
                    "FAQ Document parsed and embedded successfully, refreshing the page",
                    "success"
                );

                setIsLoading(true);
                await loadFaqs();
                setIsLoading(false);
            } catch (err) {
                showErrorModal?.("Upload Failed", err.message);
            } finally {
                e.target.value = "";
            }
        },
        [
            sessionToken,
            loadFaqs,
            addToast,
            showErrorModal,
        ]
    );

    const filteredFaqs = useMemo(() => {
        const sorted = [...faqs].sort((a, b) => {
            if (a.status === b.status) return 0;

            return a.status === "Answered" ? 1 : -1;
        });

        return sorted.filter((faq) => {
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "pending" &&
                    faq.status === "Pending") ||
                (statusFilter === "completed" &&
                    faq.status === "Answered");

            const matchesGroup =
                filterItemGroup.length === 0 ||
                filterItemGroup.includes(faq.item_group);

            const matchesItemCode =
                filterItemCode.length === 0 ||
                filterItemCode.includes(faq.item_code);

            return (
                matchesStatus &&
                matchesGroup &&
                matchesItemCode
            );
        });
    }, [faqs, statusFilter, filterItemGroup, filterItemCode,]);

    return {
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

        // QUESTION PRODUCT CONTEXT
        selectedItemGroup,
        setSelectedItemGroup,
        selectedItemCode,
        setSelectedItemCode,

        itemGroupOptions,
        itemCodeOptions,
        handleItemGroupChange,

        // KNOWLEDGE BASE FILTERS
        filterItemGroup,
        setFilterItemGroup,

        filterItemCode,
        setFilterItemCode,

        filterItemCodeOptions,
        handleFilterItemGroupChange,

        loadFaqs,
        handleAskQuestion,
        handleAnswerQuestion,
        handleFaqUpload,
    };
}