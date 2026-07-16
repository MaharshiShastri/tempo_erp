import useContractExtraction from "./useContractExtraction";
import usePartnerEditor from "./usePartnerEditor";
import useZoneMatrix from "./useZoneMatrix";
import useOdaMatrix from "./useOdaMatrix";

export default function useLogisticsHub(props){

    const matrices = useZoneMatrix();

    const oda = useOdaMatrix();

    const editor = usePartnerEditor({...props, ...matrices, ...oda});
    
    const extraction = useContractExtraction({...props, populateState: editor.populateState, setSelectedPartnerId: editor.setSelectedPartnerId});
        
    return {...editor, ...matrices, ...oda, ...extraction};
}