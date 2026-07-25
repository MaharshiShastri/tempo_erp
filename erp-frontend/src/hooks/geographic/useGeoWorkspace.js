import { useState } from "react";
import shp from "shpjs";
import API from "../../api/api";

export default function useGeoWorkspace({sessionToken, setAlertMessage, setIsAlertOpen, showErrorModal}) {

    const [indiaMap, setIndiaMap] = useState(null);

    const [isLoading, setIsLoading] = useState(false);
    
    async function loadIndia() {

        setIsLoading(true);

        try {
            
            const zippedFile = await API.indiaStates(sessionToken);

            const geojson = await shp(zippedFile);
            
            setIndiaMap(geojson);
            setAlertMessage("Successfully loaded the shapefile");
            
        } catch(err){
            setAlertMessage("Error in trying to load the shapefile");
            setIsAlertOpen(true);

        }
         finally {

            setIsLoading(false);

        }

    }

    return {indiaMap, isLoading, loadIndia,};

}