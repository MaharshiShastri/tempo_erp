import { useState } from "react";

export default function useZoneMatrix(){
    const [zones, setZones] = useState([]);
    const [fuelMatrix, setFuelMatrix] = useState([]);

    const addRow = (setter, defaultObj) => setter(prev => [...prev, defaultObj]);
    const removeRow = (list, setter, idx) => setter(list.filter((_, i) => i !== idx));
    const handleTableChange = (list, setter, idx, field, val) => { const updated = [...list]; updated[idx][field] = val; setter(updated); };

    return {zones, setZones, fuelMatrix, setFuelMatrix, addRow, removeRow, handleTableChange};
    
}
