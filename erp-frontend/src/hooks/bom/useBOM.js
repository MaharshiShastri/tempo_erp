import { useState } from "react";
import useBOMws from "./useBOMws";

export default function useBOM({
    sessionToken,
    setAlertMessage,
    setIsAlertOpen,
}) {
    const [bomView, setBomView] = useState("list");
    const [isOpeningBOM, setIsOpeningBOM] = useState(false);

    const bomState = useBOMws({sessionToken, setAlertMessage, setIsAlertOpen,});

    const handleCreateBOM = () => {
        bomState.resetBOM();
        setBomView("workspace");
    };

    const handleEditBOM = async (bomID) => {
        try {
            setIsOpeningBOM(true);

            await bomState.loadBOM(bomID);

            setBomView("workspace");
        } catch (err) {
            console.error("Failed to open BOM:", err);
        } finally {
            setIsOpeningBOM(false);
        }
    };

    const handleBackToBOMList = () => {
        setBomView("list");
        bomState.refreshBOMList();
    };

    return {
        ...bomState,

        bomView,
        setBomView,

        isOpeningBOM,
        setIsOpeningBOM,

        handleCreateBOM,
        handleEditBOM,
        handleBackToBOMList,
    };
}