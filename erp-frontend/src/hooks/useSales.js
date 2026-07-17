import { useState, useEffect } from "react";
import API from "../api/api";

export default function useSales(){ 
    const [orderHeader, setOrderHeader] = useState({ ...defaultOrderHeader });
    const executePrintWorkflow = (data, type) => {
        setActivePrintJob(data); setPrintType(type);
        setTimeout(() => { window.print(); setActivePrintJob(null); setPrintType(null); }, 300);
    };
}