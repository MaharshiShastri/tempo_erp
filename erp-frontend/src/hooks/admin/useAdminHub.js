import useAdminRegistry from "./useAdminRegistry";

export default function useAdminHub({sessionToken, setAlertMessage, setIsAlertOpen}) {
    const registry = useAdminRegistry({sessionToken, setAlertMessage, setIsAlertOpen});
    return {...registry};
}