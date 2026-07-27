import useGeoAnalytics from "./useGeoAnalytics";
import useGeoWorkspace from "./useGeoWorkspace";

export default function useGeo({sessionToken, setAlertMessage, setIsAlertOpen, showErrorModal}){
    const geoWorkspace = useGeoWorkspace({sessionToken, setAlertMessage, setIsAlertOpen, showErrorModal});
    const analytics = useGeoAnalytics({sessionToken, showErrorModal, indiaMap: geoWorkspace.indiaMap});

    return{...geoWorkspace, ...analytics};

}