import { useEffect, useState } from "react";
import API from "../../api/api";

const EMPTY_BOM = {
    item_code: "",
    bom_name: "",
    revision_no: 1,
    status: "Draft",
    output_quantity: 1,
    uom: "NOS",
    components: [],
};

const EMPTY_COST_RANGE = {
    components: [],
    minimum_material_cost: 0,
    maximum_material_cost: 1000000000,
};

export default function useBOMws({
    sessionToken,
    setAlertMessage,
    setIsAlertOpen,
}) {
    const [bom, setBom] = useState(EMPTY_BOM);
    const [rawItemMaster, setRawItemMaster] = useState([]);

    const [isLoadingItems, setIsLoadingItems] = useState(false);
    const [isLoadingBOMs, setIsLoadingBOMs] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false);

    const [costRange, setCostRange] = useState(EMPTY_COST_RANGE);
    const [bomList, setBomList] = useState([]);

    // =========================================================
    // RESET
    // =========================================================

    const resetBOM = () => {
        setBom({
            ...EMPTY_BOM,
            components: [],
        });

        setCostRange({
            ...EMPTY_COST_RANGE,
            components: [],
        });
    };

    // =========================================================
    // BOM LIST
    // =========================================================

    const refreshBOMList = async () => {
        if (!sessionToken) {
            return;
        }

        try {
            setIsLoadingBOMs(true);

            const result = await API.fetchBOMs(sessionToken);

            setBomList(
                Array.isArray(result)
                    ? result
                    : result?.items || []
            );
        } catch (err) {
            console.error(
                "Failed to load BOM list:",
                err
            );

            setBomList([]);

            if (setAlertMessage) {
                setAlertMessage(
                    err.message ||
                    "Failed to load BOM list"
                );
                setIsAlertOpen(true);
            }
        } finally {
            setIsLoadingBOMs(false);
        }
    };

    // =========================================================
    // RAW MATERIALS
    // =========================================================

    const refreshRawMaterials = async () => {
        if (!sessionToken) {
            return;
        }

        try {
            setIsLoadingItems(true);

            const items = await API.fetchMaterials(
                sessionToken
            );

            setRawItemMaster(
                Array.isArray(items)
                    ? items
                    : []
            );
        } catch (err) {
            console.error(
                "Failed to load raw materials:",
                err
            );

            setRawItemMaster([]);

            if (setAlertMessage) {
                setAlertMessage(
                    err.message ||
                    "Failed to load raw materials"
                );
                setIsAlertOpen(true);
            }
        } finally {
            setIsLoadingItems(false);
        }
    };

    useEffect(() => {
        if (!sessionToken) {
            return;
        }

        refreshRawMaterials();
        refreshBOMList();
    }, [sessionToken]);

    // =========================================================
    // BOM HEADER
    // =========================================================

    const updateBOM = (field, value) => {
        setBom((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // =========================================================
    // COMPONENTS
    // =========================================================

    const addComponent = () => {
        setBom((prev) => ({
            ...prev,
            components: [
                ...prev.components,
                {
                    item_code: "",
                    quantity: 1,
                    uom: "NOS",
                    scrap_percent: 0,
                    notes: "",
                },
            ],
        }));
    };

    const updateComponent = (
        index,
        field,
        value
    ) => {
        setBom((prev) => {
            const components = [
                ...prev.components,
            ];

            components[index] = {
                ...components[index],
                [field]: value,
            };

            return {
                ...prev,
                components,
            };
        });
    };

    const removeComponent = (index) => {
        setBom((prev) => ({
            ...prev,
            components:
                prev.components.filter(
                    (_, i) => i !== index
                ),
        }));
    };

    // =========================================================
    // COST CALCULATION
    // =========================================================

    const calculateCostRange = async () => {
        try {
            setIsCalculating(true);

            const validComponents =
                bom.components.filter(
                    (component) =>
                        component.item_code
                );

            if (validComponents.length === 0) {
                setAlertMessage(
                    "Please select at least one raw material before calculating cost."
                );
                setIsAlertOpen(true);
                return;
            }

            const result =
                await API.getBOMCostRange(
                    validComponents,
                    sessionToken
                );

            setCostRange(result);
        } catch (err) {
            console.error(
                "BOM calculation failed:",
                err
            );

            if (setAlertMessage) {
                setAlertMessage(
                    "BOM Calculation failed: " +
                    err.message
                );
                setIsAlertOpen(true);
            }
        } finally {
            setIsCalculating(false);
        }
    };

    // =========================================================
    // SAVE
    // =========================================================

    const saveBOM = async () => {
        try {
            console.log(
                "The BOM data sent:",
                JSON.stringify(bom)
            );

            const result =
                await API.saveBOM(
                    bom,
                    sessionToken
                );

            /*
             * Important:
             * Keep the generated BOM ID in local state.
             */
            if (result?.id) {
                setBom((prev) => ({
                    ...prev,
                    id: result.id,
                }));
            }

            /*
             * Refresh list so the new/updated BOM
             * immediately appears in BOM Register.
             */
            await refreshBOMList();

            if (setAlertMessage) {
                setAlertMessage(
                    "BOM saved successfully"
                );
                setIsAlertOpen(true);
            }

            return result;
        } catch (error) {
            console.error(
                "Failed to save BOM:",
                error
            );

            if (setAlertMessage) {
                setAlertMessage(
                    "Failed to save BOM: " +
                    error.message
                );
                setIsAlertOpen(true);
            }

            throw error;
        }
    };

    // =========================================================
    // LOAD
    // =========================================================

    const loadBOM = async (bomID) => {
        try {
            const result =
                await API.getBOM(
                    bomID,
                    sessionToken
                );

            setBom({
                id: result.id,
                item_code:
                    result.item_code || "",
                bom_name:
                    result.bom_name || "",
                revision_no:
                    result.revision_no || 1,
                status:
                    result.status || "Draft",
                output_quantity:
                    result.output_quantity || 1,
                uom:
                    result.uom || "NOS",

                components:
                    Array.isArray(
                        result.components
                    )
                        ? result.components.map(
                            (component) => ({
                                id: component.id,
                                item_code:
                                    component.item_code,
                                quantity:
                                    component.quantity,
                                uom:
                                    component.uom ||
                                    "NOS",
                                scrap_percent:
                                    Number(
                                        component.scrap_percent ||
                                        0
                                    ),
                                notes:
                                    component.notes ||
                                    "",
                            })
                        )
                        : [],
            });

            return result;
        } catch (err) {
            console.error(
                "Failed to load BOM:",
                err
            );

            if (setAlertMessage) {
                setAlertMessage(
                    "Failed to load BOM: " +
                    err.message
                );
                setIsAlertOpen(true);
            }

            throw err;
        }
    };

    // =========================================================
    // DELETE
    // =========================================================

    const deleteBOM = async (bomID) => {
        try {
            await API.deleteBOM(
                bomID,
                sessionToken
            );

            setBomList((prev) =>
                prev.filter(
                    (item) =>
                        item.id !== bomID
                )
            );

            if (setAlertMessage) {
                setAlertMessage(
                    "BOM deleted successfully!"
                );
                setIsAlertOpen(true);
            }
        } catch (err) {
            console.error(
                "Failed to delete BOM:",
                err
            );

            if (setAlertMessage) {
                setAlertMessage(
                    "Failed to delete BOM: " +
                    err.message
                );
                setIsAlertOpen(true);
            }

            throw err;
        }
    };

    // =========================================================
    // PDF
    // =========================================================

    const generateBOMPdf = async (bomId) => {
        try {
            if (!bomId) {
                throw new Error(
                    "Please save the BOM before generating the PDF."
                );
            }

            const blob =
                await API.getBOMPdf(
                    bomId,
                    sessionToken
                );

            const url =
                window.URL.createObjectURL(
                    blob
                );

            window.open(
                url,
                "_blank",
                "noopener,noreferrer"
            );

            setTimeout(() => {
                window.URL.revokeObjectURL(
                    url
                );
            }, 60000);
        } catch (err) {
            console.error(
                "Failed to generate BOM PDF:",
                err
            );

            if (setAlertMessage) {
                setAlertMessage(
                    "Failed to generate BOM PDF: " +
                    err.message
                );
                setIsAlertOpen(true);
            }
        }
    };

    return {
        // List
        bomList,
        isLoadingBOMs,
        refreshBOMList,

        // Workspace
        bom,
        setBom,
        resetBOM,
        loadBOM,
        updateBOM,
        addComponent,
        updateComponent,
        removeComponent,

        // Materials
        rawItemMaster,
        isLoadingItems,
        refreshRawMaterials,

        // Costing
        costRange,
        calculateCostRange,
        isCalculating,

        // Actions
        saveBOM,
        deleteBOM,
        generateBOMPdf,
    };
}