import { useState, useEffect } from "react";
import API from "../../api/api";

export default function useAnalyticsData({sessionToken, showErrorModal}) {

    const [isLoading, setIsLoading] = useState(true);

    const [salesKpis, setSalesKpis] = useState([]);
    const [rndKpis, setRndKpis] = useState([]);
    const [transportKpis, setTransportKpis] = useState({total_partners:0, monthly_costs:[], partner_distribution:[]});
    const [gtmKpis, setGtmKpis] = useState([]);
    const [prodKpis, setProdKpis] = useState([]);
    const [errorLogs, setErrorLogs] = useState([]);

    async function fetchAnalytics(role, fromDate, toDate){
        
        setIsLoading(true);

        try{
            switch (role) {

        case "Admin":
            case "Chief Full Stack Developer": {
                const [sales, transport, rnd, gtm, errors, production] =
                    await Promise.all([
                        API.fetchSalesKPIs(sessionToken, fromDate, toDate),
                        API.fetchTransportKPIs(sessionToken, fromDate, toDate),
                        API.fetchRnDKPIs(sessionToken, fromDate, toDate),
                        API.fetchGtmAnalytics(sessionToken, fromDate, toDate),
                        API.fetchSystemHealth(sessionToken, fromDate, toDate),
                        API.fetchProductionKPIs(sessionToken, fromDate, toDate)
                    ]);

                setSalesKpis(sales);
                setTransportKpis(transport);
                setRndKpis(rnd);
                setGtmKpis(gtm);
                setErrorLogs(errors);
                setProdKpis(production);
                break;
            }

            case "Shop Floor Administrator": {
                const production = await API.fetchProductionKPIs(sessionToken, fromDate, toDate);
                setProdKpis(production);
                break;
            }

            case "Sales Representative": {
                const sales = await API.fetchSalesKPIs(
                    sessionToken,
                    fromDate,
                    toDate
                );

                setSalesKpis(sales);
                break;
            }

            case "Dispatch Engineer": {
                const transport = await API.fetchTransportKPIs(
                    sessionToken,
                    fromDate,
                    toDate
                );

                setTransportKpis(transport);
                break;
            }

            default:
                console.warn(`No analytics configured for role: ${role}`);
                break;
            }
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