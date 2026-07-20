import { useMemo } from "react";

export default function useGTMAnalytics({gtmKpis = []}) {

    return useMemo(() => {

        const total_completed = gtmKpis.reduce((sum,x)=>sum+Number(x.completed||0),0);

        const totalQueued = gtmKpis.reduce((sum,x)=>sum+Number(x.total_targets||0),0);

        const conversionRatio = totalQueued ? total_completed / totalQueued *100 : 0;

        const completionChart={

            labels:gtmKpis.map(g=>`${g.gtm_source}\n${g.month}`),

            datasets:[

                {
                    label:"Completed",

                    data:gtmKpis.map(g=>Number(g.completed)),

                    backgroundColor:"#4CAF50"
                },

                {

                    label:"Awaiting Review",

                    data:gtmKpis.map(g=>Number(g.awaiting_review)),

                    backgroundColor:"#2196F3"

                },

                {

                    label:"Rejected",

                    data:gtmKpis.map(g=>Number(g.rejected)),

                    backgroundColor:"#F44336"

                }

            ]

        };

        return{total_completed, totalQueued, conversionRatio, completionChart};

    },[gtmKpis]);

}