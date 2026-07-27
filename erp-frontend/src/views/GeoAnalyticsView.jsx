import { useEffect } from "react";
import GeoMapCanvas from "../components/geo/GeoMapCanvas";
import SearchableMultiSelect from "../components/shared/SearchableMultiselect";
export default function GeoAnalyticsView({ state }) {
    
    useEffect(() => {
        if(!state.indiaMap){
            state.loadIndia();
        }
        state.loadStateSummary("2026-01-01", "2026-12-31");
    }, []);
    const stateList = state.indiaMap ? state.indiaMap.features.map(f=>f.properties.ST_NM).sort() : [];
    
    if (state.isLoading)
        return <p>Loading map...</p>;

    return (
        <div className="frappe-card">
            <div style={{display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20}}>
                <span>From 2026-01-01 to 2026-12-31</span><br/>
                
                <SearchableMultiSelect label="States" options={stateList} value={state.selectedStates} onChange={state.setSelectedStates}/>

                <SearchableMultiSelect label="Products" options={state.itemsMaster? state.itemsMaster.map(item => item.item_code) : []} value={state.selectedItems} onChange={state.setSelectedItems}/>
            </div>
            
            <GeoMapCanvas visibleMap={state.visibleMap}/>
        </div>
    );
}