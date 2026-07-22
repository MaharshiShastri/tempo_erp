import useGeoWorkspace from "./useGeoWorkspace";

export default function useGeo({sessionToken, setAlertMessage, setIsAlertOpen, showErrorModal}){
    const geoWorkspace = useGeoWorkspace({sessionToken, setAlertMessage, setIsAlertOpen, showErrorModal});
    
    return{...geoWorkspace};

}