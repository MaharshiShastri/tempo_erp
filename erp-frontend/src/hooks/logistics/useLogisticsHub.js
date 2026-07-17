import useContractExtraction from "./useContractExtraction";
import usePartnerEditor from "./usePartnerEditor";
import useZoneMatrix from "./useZoneMatrix";
import useOdaMatrix from "./useOdaMatrix";

export default function useLogisticsHub({sessionToken, showErrorModal, addToast}){

    const matrices = useZoneMatrix();

    const oda = useOdaMatrix();

    const editor = usePartnerEditor({sessionToken, showErrorModal, addToast, ...matrices, ...oda});
    
    const extraction = useContractExtraction({sessionToken, showErrorModal, addToast, populateState: editor.populateState, setSelectedPartnerId: editor.setSelectedPartnerId});
        
    return {...editor, ...matrices, ...oda, ...extraction};
}