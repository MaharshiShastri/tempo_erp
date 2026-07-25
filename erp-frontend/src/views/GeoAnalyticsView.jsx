import { useEffect } from "react";
import GeoMapCanvas from "../components/geo/GeoMapCanvas";

export default function GeoAnalyticsView({ state }) {

    useEffect(() => {

        if (!state.indiaMap) {
            state.loadIndia();
        }

    }, []);
    
    const visibleMap = state.selectedStates.length === 0 ? state.indiaMap : {
            type: "FeatureCollection", features: state.indiaMap.features.filter(feature=>
                state.selectedStates.includes(feature.properties.ST_NM)
            )
    };
    
    const stateList = state.indiaMap ? state.indiaMap.features.map(f=>f.properties.ST_NM).sort() : [];
    
    if (state.isLoading)
        return <p>Loading map...</p>;

    return (
        <div className="frappe-card">
            <div style={{display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20}}>
                <label>
                    <input type="checkbox" 
                checked={state.selectedStates.length === stateList.length && stateList.length > 0}
                onChange={(e)=>state.setSelectedStates(e.target.checked ? stateList : [])}
                />
                Select all states
                </label>
                
                {stateList.map(name=>(
                    <label key={name}>
                        <input type="checkbox" checked={state.selectedStates.includes(name)}
                        onChange={(e)=>{
                            if(e.target.checked){
                                state.setSelectedStates([...state.selectedStates, name]);
                            } else {
                                state.setSelectedStates(state.selectedStates.filter(s=> s !== name));
                            }
                        }}
                        />
                        {name}
                    </label>
                ))}
            </div>
            <GeoMapCanvas visibleMap={visibleMap}/>
        </div>
    );
}