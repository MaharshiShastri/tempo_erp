import { useState } from "react";
import API from "../../api/api";

export default function useGeoWorkspace({sessionToken, setAlertMessage, setIsAlertOpen, showErrorModal}){
    const [indiaMap, setIndiaMap] = useState(null);
    const [isLoading, setIsLoading] = useState(null);

    async function loadIndia(){

        setIsLoading(true);
        try{
            const data = await API.fetchIndiaGeoJSON(sessionToken);
            setIndiaMap(data);
        } catch(err){
            showErrorModal("GeoJSON Error: ", err.message);
        }finally{
            setIsLoading(false);
        }
    }
    return{indiaMap, isLoading, loadIndia};
}