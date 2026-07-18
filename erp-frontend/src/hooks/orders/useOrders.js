import useOrderWorkspace from "./useOrderWorkspace";
import useOrderLookup from "./useOrderLookup";
import useOrderCalculations from "./useOrderCalculations";
import useOrderSubmit from "./useOrderSubmit";

export default function useOrders(props){
    const workspace = useOrderWorkspace(props);
    const oaLookup = useOrderLookup({...props, ...workspace});
    const calculations = useOrderCalculations({orderHeader: workspace.orderHeader, orderItems: workspace.orderItems});
    const submit = useOrderSubmit({...props, ...workspace, ...oaLookup});

    return{...workspace, ...oaLookup, ...calculations, ...submit};

}
