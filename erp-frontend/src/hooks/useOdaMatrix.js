import { useState } from "react";

export default function useOdaMatrix(){
    const [odaDistances, setOdaDistances] = useState([]); 
    const [odaWeights, setOdaWeights] = useState([]);     
    const [odaCharges, setOdaCharges] = useState({});     

    const addOdaRow = () => setOdaDistances([...odaDistances, { id: `d_${Date.now()}`, from: "", to: "" }]);
    const addOdaCol = () => setOdaWeights([...odaWeights, { id: `w_${Date.now()}`, from: "", to: "" }]);
    const updateOdaAxis = (setter, list, id, field, val) => setter(list.map(item => item.id === id ? { ...item, [field]: val } : item));
    const updateOdaCharge = (dId, wId, val) => setOdaCharges(prev => ({ ...prev, [`${dId}_${wId}`]: val }));
    const removeOdaRow = (id) => setOdaDistances(prev => prev.filter(r => r.id !== id));
    const removeOdaCol = (id) => setOdaWeights(prev => prev.filter(c => c.id !== id));

    return {odaDistances, setOdaDistances, odaWeights, setOdaWeights, odaCharges, setOdaCharges, addOdaRow, addOdaCol, updateOdaAxis, updateOdaCharge, removeOdaRow, removeOdaCol};
    
}
