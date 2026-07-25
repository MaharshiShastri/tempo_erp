import useGeoAnalytics from "./useGeoAnalytics";
import useGeoWorkspace from "./useGeoWorkspace";

export default function useGeo({sessionToken, setAlertMessage, setIsAlertOpen, showErrorModal}){
    const geoWorkspace = useGeoWorkspace({sessionToken, setAlertMessage, setIsAlertOpen, showErrorModal});
    const analytics = useGeoAnalytics();

    return{...geoWorkspace, ...analytics};

}