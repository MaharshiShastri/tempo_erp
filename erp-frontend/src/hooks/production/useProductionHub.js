import useProductionPulse from "./useProductionPulse";

export default function useProductionHub({sessionToken, user, addToast, showErrorModal}){

    const pulse = useProductionPulse({sessionToken, user, addToast, showErrorModal});

    return {...pulse};

}