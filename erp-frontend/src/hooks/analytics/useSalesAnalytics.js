import { useMemo } from "react";

export default function useSalesAnalytics({salesKpis}){

    const getPercent=(kpi)=>{

        const target=parseFloat( kpi.quarterly_order_value_target||0);

        const harvested=parseFloat(kpi.targets_harvested||0);

        return target>0 ? harvested/target*100 :0;

    };

    const leaderboardByAmount=useMemo(()=>[...salesKpis].sort( (a,b)=>parseFloat(b.targets_harvested||0)-parseFloat(a.targets_harvested||0)),
        [salesKpis]);

    const leaderboardByPercent=useMemo(()=>[...salesKpis].sort((a,b)=>getPercent(b)-getPercent(a)),
        [salesKpis]
    );

    const totalHarvested= salesKpis.reduce((sum,x)=>sum+parseFloat(x.targets_harvested||0),0);

    const totalTarget = salesKpis.reduce((sum,x)=>sum+parseFloat(x.quarterly_order_value_target||x.monthly_lead_target|| 0),0);

    
    const salesPerformanceChart = {
        labels:salesKpis.map(k=>k.name),

        datasets:[
            {
                label:"Monthly Order Value",

                data:salesKpis.map(k=>Number(k.monthly_order_value)),

                backgroundColor:"#2196f3"
            }
        ]
    };

    return{leaderboardByAmount, leaderboardByPercent, totalHarvested, totalTarget, getPercent, salesPerformanceChart};

}