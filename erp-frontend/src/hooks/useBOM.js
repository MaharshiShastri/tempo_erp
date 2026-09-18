import {useEffect, useState} from "react";
import API from "../api/api";

export default function useBOM({sessionToken, setAlertMessage, setIsAlertOpen}){
    const [bom, setBom] = useState({
        item_code: "", bom_name: "", revision_no: 1, status: "DRAFT", output_quantity: 1, uom: "NOS", components: [],
    });

    const [rawItemMaster, setRawItemMaster] = useState([]);
    const [isLoadingItems, setIsLoadingItems] = useState(false);
    const [costRange, setCostRange] = useState({
        components: [], minimum_material_cost: 0, maximum_material_cost: 1000000000
    });

    const [isCalculating, setIsCalculating] = useState(false);

    const refreshRawMaterials = async () => {
        try{
            setIsLoadingItems(true);
            const items = await API.fetchMaterials(sessionToken);
            setRawItemMaster(Array.isArray(items) ? items : []);
        }catch(err){
            console.error("Failed to load raw materials");
            setAlertMessage(err.message || "Failed to load raw materials");
            setIsAlertOpen(true);
            setRawItemMaster([]);
        }finally{
            setIsLoadingItems(false);
        }
    }

    useEffect(() => {
        if (!sessionToken){
            return;
        }
        refreshRawMaterials();
    }, [sessionToken]);

    const updateBOM = (field, value) => {
        setBom((prev) => ({...prev, [field]: value}));
    };

    const addComponent = () => {
        setBom((prev) => ({...prev, components: [
                ...prev.components,
                {item_code: "", quantity: 1, uom: "NOS", scrap_percent: 0, notes: "",},
            ],
        }));
    };

    const updateComponent = (index, field, value) => {
        setBom((prev) => {
            const components = [...prev.components];
            components[index] = {...components[index], [field]: value};
            return {...prev, components,};
        });
    };

    const removeComponent = (index) => {
        setBom((prev) => ({...prev, components: prev.components.filter((_, i) => i !== index)}));
    };

    const calculateCostRange = async () => {
        try{
            setIsCalculating(true);
            const result = await API.getBOMCostRange(bom.components, sessionToken);
            setCostRange(result);
        }catch(err){
            if (setAlertMessage){
                setAlertMessage("BOM Calculation failed: " + err.message);
                setIsAlertOpen(true);
            }
        }finally{
            setIsCalculating(false);
        }
    };

    const saveBOM = async () => {
        try{
            const result = await API.saveBOM(bom, sessionToken);
            if (setAlertMessage){
                setAlertMessage("BOM Saved succcessfully");
                setIsAlertOpen(true);
            }

            return result;
        }catch(error){
            if (setAlertMessage){
                setAlertMessage("Falied to save BOM: " + error.message);
                setIsAlertOpen(true);
            }

            throw error;
        }
    };

    const generateBOMPdf = async (bomId) => {
        try {
            if (!bomId) {
                throw new Error(
                    "Please save the BOM before generating the PDF."
                );
            }

            const blob = await API.getBOMPdf(
                bomId,
                sessionToken
            );

            const url = window.URL.createObjectURL(blob);

            window.open(
                url,
                "_blank",
                "noopener,noreferrer"
            );

            setTimeout(() => {
                window.URL.revokeObjectURL(url);
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

    return{
        bom, setBom, updateBOM, addComponent, updateComponent, removeComponent, costRange, calculateCostRange,
        isCalculating, saveBOM, refreshRawMaterials, rawItemMaster, generateBOMPdf,
    };
}