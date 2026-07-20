import { useMemo } from "react";

export default function useSystemAnalytics({errorLogs=[]}){

    return useMemo(()=>{

        const totalErrors = errorLogs.length;

        const latestError = errorLogs[0]||null;

        const hasErrors = totalErrors>0;

        return{totalErrors, latestError, hasErrors, errorLogs};

    },[errorLogs]);

}