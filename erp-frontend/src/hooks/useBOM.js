import {useEffect, useState} from "react";
import API from "../api/api";

export default function useBOM({sessionToken, setAlertMessage, setIsAlertOpen}){
    const [bom, setBom] = useState({
        item_code: "", bom_name: "", revision_no: 1, status: "DRAFT", output_quantity: 1, uom: "NOS", components: [],
    });

    const [rawItemMaster, setRawItemMaster] = useState([]);
    const [isLoadingItems, setIsLoadingItems] = useState(false);
    const [isLoadingBOMs, setIsLoadingBOMs] = useState(false);
    const [costRange, setCostRange] = useState({components: [], minimum_material_cost: 0, maximum_material_cost: 1000000000});
    const [bomList, setBomList] = useState([]);
    const [isCalculating, setIsCalculating] = useState(false);

    const resetBOM = () => {
        setBom({item_code: "", bom_name:"", revision_no: 1, status: "DRAFT", output_quantity: 1, uom: 'NOS', components: []});
        setCostRange({components: [], minimum_material_cost: 0, maximum_material_cost: 1000000000});
    };

    const refreshBOMList = async () => {
        try{
            setIsLoadingBOMs(true);
            const result = await API.fetchBOMs(sessionToken);
            setBomList(Array.isArray(result) ? result : result?.items || []);
        }catch(err){
            console.error("Failed to load BOM List: ", err);
            if(setAlertMessage){
                setAlertMessage(err.message || "Failed to load BOM list");
                setIsAlertOpen(true);
            }
            setBomList([]);
        }finally{
            setIsLoadingBOMs(false);
        }
    }
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
        console.log(`Updated ${index} row of field ${field} & value ${value}`);
    };

    const removeComponent = (index) => {
        setBom((prev) => ({...prev, components: prev.components.filter((_, i) => i !== index)}));
    };

    const calculateCostRange = async () => {
        try{
            setIsCalculating(true);
            if(!bom.components.some(c => c.item_code)){
                setAlertMessage("Please select atleast one item code for components before calculating cost.");
                setIsAlertOpen(true);
                setIsCalculating(false);
                return;
            }
            
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
            console.log(`The BOM data sent: ${JSON.stringify(bom)}`)
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

    const loadBOM = async(bomID) => {
        try{
            const result = await API.getBOM(bomID, sessionToken);
            setBom({
                id: result.id,
                item_code: result.item_code,
                bom_name: result.bom_name || "",
                revision_no: result.revision_no || 1,
                status: result.status || "Draft",
                output_quantity: result.output_quantity || 1,
                uom: result.uom || "NOS",
                components: Array.isArray(result.components) ? 
                    result.components.map((component) => ({
                        id: component.id,
                        item_code: component.item_code,
                        quantity: component.quantity,
                        uom: component.uom,
                        scrap_percent: Number(component.scrap_percent || 0),
                        notes: component.notes || ""
                    }))
                    : 
                    [],
            });

            return result;
        }catch(err){
            console.error("FAiled to load BOM: ", err);
            if(setAlertMessage){
                setAlertMessage("Failed to load BOM : " + err.message);
                setIsAlertOpen(true);
            }

            throw err;
        }
    };

    const generateBOMPdf = async (bomId) => {
        try {
            if (!bomId) {
                throw new Error("Please save the BOM before generating the PDF.");
            }

            const blob = await API.getBOMPdf(bomId, sessionToken);

            const url = window.URL.createObjectURL(blob);

            window.open(url, "_blank", "noopener,noreferrer");

            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 60000);

        } catch (err) {
            console.error("Failed to generate BOM PDF:", err);

            if (setAlertMessage) {
                setAlertMessage("Failed to generate BOM PDF: " + err.message);
                setIsAlertOpen(true);
            }
        }
    };

    const deleteBOM = async(bomID) => {
        try{
            await API.deleteBOM(bomID, sessionToken);
            setBomList((prev) => prev.filter(((item) => item.id != bomID)));
            if(setAlertMessage){
                setAlertMessage("BOM Deleted Successfully!");
                setIsAlertOpen(true);
            }
        }catch(err){
            console.error("Failed to delete BOM: ", err);
            if(setAlertMessage){
                setAlertMessage("Failed to delete BOM: " + err.message);
                setIsAlertOpen(true);
            }
            throw err;
        }
    };

    return{
        //list
        bomList, isLoadingBOMs, refreshBOMList,
        //workspace
        bom, setBom, resetBOM, loadBOM, updateBOM, addComponent, updateComponent, removeComponent, 
        //materials
        rawItemMaster, isLoadingItems, refreshRawMaterials,
        //costing
        costRange, calculateCostRange, isCalculating,
        //actions
        saveBOM, deleteBOM, generateBOMPdf,
    };
}