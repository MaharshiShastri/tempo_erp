import useDispatchPlanner from "./useDispatchPlanner";
import useTransportPartners from "./useTransportPartners";

export default function useDispatchCalculator({sessionToken, showErrorModal, addToast}) {
    
    const planner = useDispatchPlanner({sessionToken, showErrorModal, addToast});

    const partners = useTransportPartners({sessionToken, showErrorModal, addToast});
    
    return {...planner, ...partners};

}