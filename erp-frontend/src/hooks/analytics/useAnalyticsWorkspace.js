import { useState } from "react";

export default function useAnalyticsWorkspace(){

    const today = new Date();

    const [selectedYear,setSelectedYear] = useState(today.getFullYear());

    const [selectedMonth,setSelectedMonth] = useState(today.getMonth()+1);

    const [selectedQuarter,setSelectedQuarter] = useState(Math.floor(today.getMonth()/3)+1);

    const [selectedAnalytics, setSelectedAnalytics] = useState("overview");
    
    const [isExporting, setIsExporting] = useState(false);
    
    const [quarterlyTargets, setQuarterlyTargets] = useState({});
    
    const [dateRange,setDateRange] = useState("month");

    return{selectedYear, setSelectedYear, selectedMonth, setSelectedMonth, selectedQuarter, setSelectedQuarter, dateRange, setDateRange, quarterlyTargets, setQuarterlyTargets,
        isExporting, setIsExporting, selectedAnalytics, setSelectedAnalytics,
    };

}