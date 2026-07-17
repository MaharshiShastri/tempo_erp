export default function useActivityDashboard({sessionToken, user, showErrorModal, addToast, setAlertMessage, setIsAlertOpen}){
    const [treeData, setTreeData] = useState({ past: [], ongoing: [], future: [] });
    const [loading, setLoading] = useState(true);
    const [openSection, setOpenSection] = useState('ongoing'); 
    const [openRows, setOpenRows] = useState(new Set());
        
    // Manual Logging State
    const [manualLogInputs, setManualLogInputs] = useState({});
    const [isSubmittingLog, setIsSubmittingLog] = useState(false);
    
    useEffect(() => { loadData(); }, []);
    
    const loadData = async () => {
        try {
            setLoading(true);
            const data = await API.fetchActivityTree(sesssionToken);
            setTreeData(data);
        } catch (err) {
            setAlertMessage(err.message);
            setIsAlertOpen(true);
        } finally {
            setLoading(false);
        }
    };
    
    const toggleSection = (sectionKey) => {
        setOpenSection(prev => prev === sectionKey ? null : sectionKey);
        setOpenRows(new Set()); 
    };
    
    const toggleRow = (orderId) => {
        setOpenRows(prev => {
            const next = new Set(prev);
            if (next.has(orderId)) next.delete(orderId);
            else next.add(orderId);
            return next;
        });
    };
    
    const handleAddManualLog = async (orderId) => {
        const message = manualLogInputs[orderId];
        if (!message?.trim()) return;
    
        setIsSubmittingLog(true);
        try {
            await API.addManualActivityLog(orderId, { message }, state.user.access_token);
            setManualLogInputs(prev => ({ ...prev, [orderId]: "" }));
            addToast("Activity manually logged.", "success");
            await loadData();
        } catch (err) {
            showErrorModal("Logging Failed", err.message);
        } finally {
            setIsSubmittingLog(false);
        }
    };
    
    const handleDeleteLog = async (logId) => {
        if (role !== 'Admin' && role !== 'Chief Full Stack Developer') {
            showErrorModal("Unauthorized", "Only System Administrators can alter the audit trail.");
            return;
        }
    
        if (!window.confirm("WARNING: Deleting an audit log alters the immutable history of this order. Proceed?")) return;
    
        try {
            await API.deleteActivityLog(logId, state.user.access_token);
            addToast("Audit log wiped.", "success");
            await loadData();
        } catch (err) {
            showErrorModal("Deletion Failed", err.message);
        }
    };
    
    const renderSection = (title, sectionKey, dataArray, colorVar) => {
        const isOpen = openSection === sectionKey;
    }
    return{loadData, toggleSection, toggleRow, setManualLogInputs, handleAddManualLog, handleDeleteLog,
        treeData, setTreeData, loading, setLoading, openSection, setOpenSection, openRows, setOpenRows,
        manualLogInputs, setManualLogInputs
    };

}