import useActivityDashboard from "./useActivityDashboard";

export default function useActivityHub({sessionToken, user, showErrorModal, addToast, setAlertMessage, setIsAlertOpen}){
    const dashboard = useActivityDashboard({sessionToken, user, showErrorModal, addToast, setAlertMessage, setIsAlertOpen});

    return {...dashboard};
}