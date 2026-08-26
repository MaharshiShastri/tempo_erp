import useFAQWorkspace from "./useFAQWorkspace";

export default function useFAQHub({sessionToken, user, itemsMaster, showErrorModal, addToast, setAlertMessage, setIsAlertOpen}){

    const workspace = useFAQWorkspace({sessionToken, user, itemsMaster, showErrorModal, addToast, setAlertMessage, setIsAlertOpen});

    return {...workspace};
}