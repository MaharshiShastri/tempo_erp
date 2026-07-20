import { useMemo } from "react";

export default function useDispatchAnalytics({transportKpis = {total_partners: 0,monthly_costs: []}}) {

    return useMemo(() => {

        const totalPartners = transportKpis.total_partners;

        const totalDispatches = transportKpis.monthly_costs.reduce((sum, month) =>sum + Number(month.total_dispatches),0);

        const totalFreightSpend = transportKpis.monthly_costs.reduce((sum, month) =>sum + Number(month.total_cost),0);

        const transportChart = {

            labels:transportKpis.monthly_costs.map(x => x.month_period),

            datasets: [{

                    label: "Dispatch Cost",

                    data:transportKpis.monthly_costs.map(x => Number(x.total_cost)),

                    borderColor: "#f44336",

                    backgroundColor:"rgba(244,67,54,0.25)",

                    fill: true,

                    tension: 0.35

                }

            ]

        };

        return {totalPartners, totalDispatches, totalFreightSpend, transportChart};

    }, [transportKpis]);

}