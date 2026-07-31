import { useState, useEffect } from "react";
import API from "../../api/api";

export default function useGeoAnalytics({sessionToken, showErrorModal, indiaMap, itemsMaster}){
    const [selectedStates, setSelectedStates] = useState([]);
    const [stateSummary, setStateSummary] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectedGroups, setSelectedGroups] = useState([]);

    const today = new Date().toISOString().split("T")[0];
    const [fromGeoDate, setFromGeoDate] = useState("2026-01-01");
    const [toGeoDate, setToGeoDate] = useState(today);
    
    async function loadStateSummary(fromGeoDate, toGeoDate){
        
        let items = [...selectedItems];

        if(selectedGroups.length){
            const groupedItems = itemsMaster.filter(i=>selectedGroups.includes(i.item_group)).map(i=>i.item_code);

            items = [...new Set([...selectedItems, ...groupedItems])];

        }
        
        try{
            const data = await API.fetchStateSummary(sessionToken, fromGeoDate, toGeoDate, items);
            setStateSummary(data);
        }catch(err){
            showErrorModal("Geo analytics", err.message);
        }
    }

    useEffect(() => {
        loadStateSummary(fromGeoDate, toGeoDate);
    }, [fromGeoDate, toGeoDate, selectedItems, selectedGroups]);
    
    const visibleMap = !indiaMap ? null : {
        type: "FeatureCollection",
        features: indiaMap.features.filter(feature=>
            selectedStates.length === 0 || selectedStates.includes(feature.properties.ST_NM)
        ).map(feature=>{
            const summary = stateSummary.find(s=>s?.state?.toLowerCase() === feature.properties.ST_NM.toLowerCase());

            return {
                ...feature, properties: {...feature.properties, shipments: summary?.shipments ?? 0,
                    revenue: summary?.revenue ?? 0, quantity: summary?.quantity ?? 0
                }
            }
        })
    };

    return {selectedStates, setSelectedStates, stateSummary, setStateSummary, loadStateSummary,
        visibleMap, selectedItems, setSelectedItems, selectedGroups, setSelectedGroups, fromGeoDate, setFromGeoDate,
        toGeoDate, setToGeoDate,
    };
}