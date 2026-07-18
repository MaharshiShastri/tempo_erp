import useCRMWorkspace from "./useCRMWorkspace";

export default function useCRMHub({sessionToken, setAlertMessage, setIsAlertOpen}) {

    const workspace = useCRMWorkspace({sessionToken, setAlertMessage, setIsAlertOpen});

    return {...workspace};
}