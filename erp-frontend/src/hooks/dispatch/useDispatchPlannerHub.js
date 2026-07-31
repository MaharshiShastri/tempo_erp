import useTruckPlanner from "./useTruckPlanner";
import useTruckLayout from "./useTruckLayout";

export default function useDispatchPlannerHub({sessionToken, showErrorModal, addToast}) {

    const planner = useTruckPlanner();

    const visualizer = useTruckLayout(planner.plannerProducts, planner.unit, planner.truckDim);

    return {...planner, ...visualizer};
}