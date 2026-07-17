import useDispatchPlanner from "./useDispatchPlanner";
import useTransportPartners from "./useTransportPartners";
import useTruckVisualizer from "./useTruckVisualizer";

export default function useDispatchHub({sessionToken, showErrorModal, addToast}) {
    
    const planner = useDispatchPlanner({sessionToken, showErrorModal, addToast});

    const partners = useTransportPartners({sessionToken, showErrorModal, addToast});
    
    const visualizer = useTruckVisualizer(planner.products, planner.unit)
    return {...planner, ...partners, ...visualizer};

}