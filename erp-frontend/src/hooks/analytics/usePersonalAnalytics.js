import { useMemo } from "react";

export default function usePersonalAnalytics({salesKpis=[], user}){

    return useMemo(()=>{

        const myData = user?.role==="Sales Representative" ? salesKpis.find(x=>x.email===user.email) : null;

        const target = Number(myData?.quarterly_order_value_target||0);

        const harvested = Number(myData?.targets_harvested||0);

        const shortfall = Math.max(0,target-harvested);

        const progressPercentage = target>0 ? harvested/target*100 : 0;

        return{myData, target, harvested, shortfall, progressPercentage};

    },[salesKpis,user]);

}