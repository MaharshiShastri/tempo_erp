import { useState, useEffect } from "react";
import API from "../../api/api";

export default function useGeoAnalytics({sessionToken, showErrorModal, indiaMap}){
    const [selectedStates, setSelectedStates] = useState([]);
    const [stateSummary, setStateSummary] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);

    async function loadStateSummary(fromDate, toDate, items=selectedItems){
        try{
            const data = await API.fetchStateSummary(sessionToken, fromDate, toDate, items);
            setStateSummary(data)
        }catch(err){
            showErrorModal("Geo analytics", err.message);
        }
    }

    useEffect(() => {
        loadStateSummary("2026-01-01", "2026-12-31", selectedItems);
    }, [selectedItems]);
    
    const visibleMap = !indiaMap ? null : {
        type: "FeatureCollection",
        features: indiaMap.features.filter(feature=>
            selectedStates.length === 0 || selectedStates.includes(feature.properties.ST_NM)
        ).map(feature=>{
            const summary = stateSummary.find(s=>s.state === feature.properties.ST_NM);
            return {
                ...feature, properties: {...feature.properties, shipments: summary?.shipments ?? 0,
                    revenue: summary?.revenue ?? 0, quantity: summary?.quantity ?? 0
                }
            }
        })
    };

    return {selectedStates, setSelectedStates, stateSummary, setStateSummary, loadStateSummary,
        visibleMap, selectedItems, setSelectedItems
    };
}