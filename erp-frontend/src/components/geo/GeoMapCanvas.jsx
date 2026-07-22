import { useRef} from "react";
import "ol/ol.css";
import useOpenLayersMap from "../../hooks/geographic/useOpenLayersMap";

import { fromLonLat } from "ol/proj";

export default function GeoMapCanvas({state}){
    const mapRef = useRef(null);
    useOpenLayersMap(mapRef, state.indiaMap);
    return(
        <div ref={mapRef} style={{width: "100%", height:"700px", borderRadius: "8px"}} />
    );
}