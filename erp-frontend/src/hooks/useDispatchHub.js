import useDispatchPlanner from "./useDispatchPlanner";
import useTransportPartners from "./useTransportPartners";
import useTruckVisualizer from "./useTruckVisualizer";

export default function useDispatchHub(props) {

    const planner = useDispatchPlanner(props);

    const partners = useTransportPartners(props);
    
    const visualizer = useTruckVisualizer(planner.products, planner.unit)
    return {...planner, ...partners, ...visualizer};

}