import { useMemo } from "react";

export default function useExecutiveAnalytics({salesKpis = [], rndKpis = [], gtmKpis = [], errorLogs = []}) {

    return useMemo(() => {

        const totalQueued = salesKpis.reduce((sum, x) => sum + Number(x.targets_queued || 0),0);

        const totalOrderValue = salesKpis.reduce((sum, x) => sum + Number(x.monthly_order_value || 0),0);

        const totalCRM = salesKpis.reduce((sum, x) => sum + Number(x.total_crm_leads || 0),0);

        const totalDispatches = salesKpis.reduce((sum, x) => sum + Number(x.dispatches_logged || 0),0);

        const totalActions = salesKpis.reduce((sum, x) => sum + Number(x.actions_logged || 0),0);

        const totalRejected = salesKpis.reduce( (sum, x) => sum + Number(x.rejected || 0),0);

        const totalInactive = salesKpis.reduce((sum, x) => sum + Number(x.inactive || 0),0);

        const totalFaqAsked = salesKpis.reduce((sum, x) => sum + Number(x.faqs_asked || 0),0);

        const totalFaqAnswered = rndKpis.reduce((sum, x) => sum + Number(x.faqs_answered || 0),0);

        const pendingFaqs = totalFaqAsked - totalFaqAnswered;

        const totalCompleted = Number(gtmKpis[0]?.total_completed || 0);

        const conversionRatio = totalQueued > 0 ? (totalCompleted / totalQueued) * 100 : 0;

        return {totalQueued, totalOrderValue, totalCRM, totalDispatches, totalActions, totalRejected, totalInactive,
            totalFaqAsked, totalFaqAnswered, pendingFaqs, conversionRatio, totalErrors: errorLogs.length
        };

    }, [salesKpis, rndKpis, gtmKpis, errorLogs]);
    
}