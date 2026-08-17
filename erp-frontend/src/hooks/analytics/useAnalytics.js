import useAnalyticsWorkspace from "./useAnalyticsWorkspace";
import useDispatchAnalytics from "./useDispatchAnalytics";
import useExecutiveAnalytics from "./useExecutiveAnalytics";
import useFAQAnalytics from "./useFAQAnalytics";
import useGTMAnalytics from "./useGTMAnalytics";
import usePersonalAnalytics from "./usePersonalAnalytics";
import useProductionAnalytics from "./useProductionAnalytics";
import useSalesAnalytics from "./useSalesAnalytics";
import useSystemAnalytics from "./useSystemAnalytics";
import useAnalyticsData from "./useAnalyticsData";

export default function useAnalytics(props){

    const workspace = useAnalyticsWorkspace();

    const data = useAnalyticsData(props);
    
    const personal = usePersonalAnalytics({salesKpis: data.salesKpis, user: props.user});

    const sales = useSalesAnalytics({ salesKpis: data.salesKpis});

    const production = useProductionAnalytics({prodKpis: data.prodKpis, sessionToken: props?.sessionToken, showErrorModal: props?.showErrorModal});

    //const inventory = useInventoryAnalytics({...props, ...workspace});

    //const finance = useFinanceAnalytics({...props, ...workspace});

    const dispatch = useDispatchAnalytics({transportKpis: data.transportKpis});
    
    const faq = useFAQAnalytics({salesKpis: data.salesKpis, rndKpis: data.rndKpis});
    
    const gtm = useGTMAnalytics({gtmKpis: data.gtmKpis, salesKpis: data.salesKpis})

    const system = useSystemAnalytics({errorLogs: data.errorLogs});

    const executive = useExecutiveAnalytics({salesKpis: data.salesKpis, rndKpis: data.rndKpis, gtmKpis: data.gtmKpis, errorLogs: data.errorLogs});

    return{...workspace, ...data, ...personal, ...sales, ...faq, ...dispatch, ...production, ...gtm,
        ...system, ...executive,
    };

}