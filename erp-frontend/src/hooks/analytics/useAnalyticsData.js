import { useState, useEffect } from "react";
import API from "../../api/api";

export default function useAnalyticsData({sessionToken, showErrorModal}) {

    const [isLoading, setIsLoading] = useState(true);

    const [salesKpis, setSalesKpis] = useState([]);
    const [rndKpis, setRndKpis] = useState([]);
    const [transportKpis, setTransportKpis] = useState({total_partners:0, monthly_costs:[]});
    const [gtmKpis, setGtmKpis] = useState([]);
    const [prodKpis, setProdKpis] = useState([]);
    const [errorLogs, setErrorLogs] = useState([]);

    async function fetchAnalytics(){

        try{

            const [sales, transport, rnd, gtm, errors, production] = await Promise.all([
                API.fetchSalesKPIs(sessionToken),
                API.fetchTransportKPIs(sessionToken),
                API.fetchRnDKPIs(sessionToken),
                API.fetchGtmAnalytics(sessionToken),
                API.fetchSystemHealth(sessionToken),
                API.fetchProductionKPIs(sessionToken)
                ]);

            setSalesKpis(sales);
            setTransportKpis(transport);
            setRndKpis(rnd);
            setGtmKpis(gtm);
            setErrorLogs(errors);
            setProdKpis(production);

        }
        catch(err){
            showErrorModal("Analytics Error",err.message);
        }
        finally{
            setIsLoading(false);
        }

    };

    return{isLoading, salesKpis, rndKpis, transportKpis, gtmKpis, prodKpis, errorLogs, fetchAnalytics };

}