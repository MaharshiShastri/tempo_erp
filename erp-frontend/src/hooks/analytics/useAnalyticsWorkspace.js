import { useState } from "react";

export default function useAnalyticsWorkspace(){

    const today = new Date();

    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
    
    const lastDay = new Date(today.getFullYear(), today.getMonth()+ 1, 0).toISOString().split("T")[0];

    const [fromDate, setFromDate] = useState(firstDay);
    const[toDate, setToDate] = useState(lastDay);

    const [selectedAnalytics, setSelectedAnalytics] = useState("overview");
    
    const [isExporting, setIsExporting] = useState(false);
    
    const [quarterlyTargets, setQuarterlyTargets] = useState({});
    
    return{fromDate, setFromDate, toDate, setToDate, quarterlyTargets, setQuarterlyTargets,
        isExporting, setIsExporting, selectedAnalytics, setSelectedAnalytics,
    };

}