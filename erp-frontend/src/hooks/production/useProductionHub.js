import useProductionPulse from "./useProductionPulse";

export default function useProductionHub({sessionToken, user, addToast, showErrorModal, orders, setOrders}){

    const pulse = useProductionPulse({sessionToken, user, addToast, showErrorModal, orders, setOrders});

    return {...pulse};

}