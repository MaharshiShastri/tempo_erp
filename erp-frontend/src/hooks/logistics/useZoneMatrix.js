import { useState } from "react";

export default function useZoneMatrix(){
    const [zones, setZones] = useState([]);
    const [fuelMatrix, setFuelMatrix] = useState([]);

    const addZoneRow = (setter, defaultObj) => setter(prev => [...prev, defaultObj]);
    const removeZoneRow = (list, setter, idx) => setter(list.filter((_, i) => i !== idx));
    const handleTableChange = (list, setter, idx, field, val) => { const updated = [...list]; updated[idx][field] = val; setter(updated); };

    return {zones, setZones, fuelMatrix, setFuelMatrix, addZoneRow, removeZoneRow, handleTableChange};
    
}
