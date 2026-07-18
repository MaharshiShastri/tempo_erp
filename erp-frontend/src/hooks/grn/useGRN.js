import useGRNScanner from "./useGRNScanner";
import useGRNEditor from "./useGRNEditor";
import useGRNSave from "./useGRNSave";

export default function useGRN(props){
    
    const scanner = useGRNScanner(props);

    const editor = useGRNEditor({scannedData: scanner.scannedData, setScannedData: scanner.setScannedData, sessionToken: props.sessionToken})

    const saver = useGRNSave({...editor, scannedData: scanner.scannedData, setScannedData: scanner.setScannedData, sessionToken: props.sessionToken,
        setAlertMessage: props.setAlertMessage, setIsAlertOpen: props.setIsAlertOpen
    });
    return{...scanner, ...editor, ...saver};
}