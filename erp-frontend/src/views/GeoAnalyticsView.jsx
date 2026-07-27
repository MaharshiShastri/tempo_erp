import { useEffect } from "react";
import GeoMapCanvas from "../components/geo/GeoMapCanvas";
import SearchableMultiSelect from "../components/shared/SearchableMultiselect";
export default function GeoAnalyticsView({ state }) {
        
    const stateList = state.indiaMap ? state.indiaMap.features.map(f=>f.properties.ST_NM).sort() : [];
    
    const itemGroups = [...new Set((state.itemsMaster ?? []).map(item => item.item_group).filter(Boolean))].sort();
    
    if (state.isLoading)
        return <p>Loading map...</p>;

    return (
        <div className="frappe-card">
            <div style={{display: "flex", flexDirection: "column", gap: 18, marginBottom: 20}}>
                <div>
                    <label className="form-label">From Date</label>
                    <input type="date" className="form-input" min="2026-01-01" max={new Date().toISOString().split("T")[0]}
                        value={state.fromGeoDate} onChange={e=>state.setFromGeoDate(e.target.value)}/>
                </div>

                <div>
                    <label className="form-label">To Date</label>
                    <input type="date" className="form-input" min={state.fromGeoDate} max={new Date().toISOString().split("T")[0]}
                    value={state.toGeoDate} onChange={e=>state.setToGeoDate(e.target.value)}/>
                </div>

                <div style={{display:"grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap:16}}>
                    <SearchableMultiSelect label="States" options={stateList} value={state.selectedStates} onChange={state.setSelectedStates}/>

                    <SearchableMultiSelect label="Products" options={state.itemsMaster? state.itemsMaster.map(item => item.item_code) : []} value={state.selectedItems} onChange={state.setSelectedItems}/>
                    
                    <SearchableMultiSelect label="Product group" options={itemGroups} value={state.selectedGroups} onChange={state.setSelectedGroups} />
                </div>
            </div>
            
            <div style={{display:"flex", gap: 24, padding:"12px 18px", background: "var(--bg-surface)", borderRadius: 10, marginBottom: 10, border:"1px solid var(--border-subtle)"}}>
                <span><b>Selected {state.selectedGroups.length}</b> Groups</span>
                <span><b>Selected {state.selectedItems.length}</b> Items</span>
                <span><b>Selected {state.selectedStates.length}</b> states</span>
            </div>
            <GeoMapCanvas visibleMap={state.visibleMap}/>
        </div>
    );
}