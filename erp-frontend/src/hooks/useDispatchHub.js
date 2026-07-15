import useDispatchPlanner from "./useDispatchPlanner";
import useTransportPartners from "./useTransportPartners";

export default function useDispatchHub(props) {

    const planner = useDispatchPlanner(props);

    const partners = useTransportPartners(props);

    return {...planner, ...partners};

}