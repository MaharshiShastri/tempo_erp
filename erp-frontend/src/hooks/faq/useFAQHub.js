import useFAQWorkspace from "./useFAQWorkspace";

export default function useFAQHub({sessionToken, user, showErrorModal, addToast, setAlertMessage, setIsAlertOpen}){

    const workspace = useFAQWorkspace({sessionToken, user, showErrorModal, addToast, setAlertMessage, setAlertMessage});

    return {...workspace};
}