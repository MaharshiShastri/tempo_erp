import { useMemo } from "react";

export default function useProductionAnalytics({prodKpis=[]}){

    return useMemo(()=>{

        const activeOrders = prodKpis.reduce((sum,x)=>sum+Number(x.count),0);

        const productionPieChart={

            labels: prodKpis.map(p=>p.stage),

            datasets:[

                {

                    data: prodKpis.map(p=>p.count),

                    backgroundColor:[

                        "rgba(201,203,207,.8)",

                        "rgba(54,162,235,.8)",

                        "rgba(255,206,86,.8)",

                        "rgba(75,192,192,.8)",

                        "rgba(153,102,255,.8)"

                    ]

                }

            ]

        };

        return{activeOrders, productionPieChart};

    },[prodKpis]);

}