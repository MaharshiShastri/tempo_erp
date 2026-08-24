import useTruckPlanner from "./useTruckPlanner";
import useTruckLayout from "./useTruckLayout";

export default function useDispatchPlannerHub() {
    const planner = useTruckPlanner();

    const { packedBoxes } = useTruckLayout(
        planner.plannerProducts,
        planner.unit,
        planner.truckDim
    );

    return {
        ...planner,
        packedBoxes,
    };
}