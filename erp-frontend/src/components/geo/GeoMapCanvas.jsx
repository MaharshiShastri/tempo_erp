import { useRef} from "react";
import "ol/ol.css";
import useOpenLayersMap from "../../hooks/geographic/useOpenLayersMap";

import { fromLonLat } from "ol/proj";

export default function GeoMapCanvas({visibleMap}){
    const mapRef = useRef(null);
    useOpenLayersMap(mapRef, visibleMap);
    return(

        <div ref={mapRef} style={{width: "100%", height:"700px", borderRadius: "8px", background: "#fff"}} />
    );
}