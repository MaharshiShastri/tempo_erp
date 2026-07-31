import { useState } from "react";

export default function useTruckPlanner() {

    const [plannerProducts, setPlannerProducts] = useState([{ width: "", height: "", depth: "" }]);

    const [unit, setUnit] = useState("in");
    
    const [truckDim, setTruckDim] = useState({width:90, length:240});
    
    const updateProduct = (index, field, value) => {const updated = [...plannerProducts]; updated[index][field] = value; setPlannerProducts(updated);};

    const addProduct = () => {
        if (plannerProducts.length < 5) {
            setPlannerProducts([...plannerProducts, { width: "", height: "", depth: "" }]);
        }
    };

    const removeProduct = (index) => {
        if (plannerProducts.length > 1) {
            setPlannerProducts(plannerProducts.filter((_, i) => i !== index));
        }
    };

    return {plannerProducts, unit, setUnit, updateProduct, addProduct, removeProduct, truckDim, setTruckDim, setPlannerProducts};
}