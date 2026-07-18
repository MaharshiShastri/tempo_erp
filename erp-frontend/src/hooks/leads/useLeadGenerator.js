import useLeadTargets from "./useLeadTargets";
import useLeadStaging from "./useLeadStaging";
import useLeadEmail from "./useLeadEmail";

export default function useLeadGenerator({user, setAlertMessage, setIsAlertOpen, showErrorModal, itemsMaster}){
    const targets = useLeadTargets({user, setAlertMessage, setIsAlertOpen, showErrorModal});

    const staging = useLeadStaging({...targets, user: user, setAlertMessage: setAlertMessage, setIsAlertOpen: setIsAlertOpen, showErrorModal: showErrorModal, stagedContacts: targets.stagedContacts, setStagedContacts: targets.setStagedContacts});

    const email = useLeadEmail({itemsMaster: itemsMaster, user: user, setAlertMessage: setAlertMessage, setIsAlertOpen: setIsAlertOpen, showErrorModal: showErrorModal});

    return{...targets, ...staging, ...email};
    
}