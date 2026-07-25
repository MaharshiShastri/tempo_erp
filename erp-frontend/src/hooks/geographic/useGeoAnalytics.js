import { useState } from "react";

export default function useGeoAnalytics(){
    const [selectedStates, setSelectedStates] = useState([]);

    return {selectedStates, setSelectedStates};
}