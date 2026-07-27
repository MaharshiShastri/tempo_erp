import { useRef} from "react";
import "ol/ol.css";
import useOpenLayersMap from "../../hooks/geographic/useOpenLayersMap";
import GeoMapLegend from "./GeoMapLegend";

import { fromLonLat } from "ol/proj";

export default function GeoMapCanvas({visibleMap}){
    const mapRef = useRef(null);
    const toolTipRef = useRef(null);

    useOpenLayersMap(mapRef, toolTipRef,  visibleMap);
    return(
        <div style={{position:"relative"}}>
            <div ref={mapRef} style={{width: "100%", height:"700px", borderRadius: "8px", background: "#fff"}} />
            <div ref={toolTipRef} style={{
                position: "absolute", pointerEvents: "none", display: "none",
                background: "var(--bg-surface)", color: "var(--text-primary)",
                padding: "10px 14px", borderRadius: 8,
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)", border: "1px solid var(--border-light)",
                whiteSpace: "nowrap", zIndex: 1000
                }} />

            <GeoMapLegend />
        </div>
    );
}