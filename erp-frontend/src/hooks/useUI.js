import { useState, useEffect } from "react";

export default function useUI(){
    const [alertMessage, setAlertMessage] = useState('');

    const [errorModal, setErrorModal] = useState({title: "", message: "" });

    const [toasts, setToasts] = useState([]);

    const [activeTab, setActiveTab] = useState('global-pulse');

    const [notifications, setNotifications] = useState([]);

    const addToast = (message, type="info") => {
        const id = Date.now();
        setToasts(prev => [...prev, {id, message, type}]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));   
        }, 5000);
    };

    const showErrorModal = ( title, message) => {
        setErrorModal({
            title,
            message
        });

        setErrorModalOpen(true);
    };

    const clearNotifications = () => {
        setNotifications([])
    }

    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            // Ignore keystrokes if the user isn't logged in or a modal is open
            if (!sessionToken || isAlertOpen) return;

            // Prevent default browser behavior for our specific shortcuts
            const isAltShortcut = e.altKey && ['c', 'i', 'o', 'b', 't', 'n'].includes(e.key.toLowerCase());
            const isCtrlS = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's';
                
            if (isAltShortcut || isCtrlS) {
                e.preventDefault();
            }

            // 1. Contextual Save (Ctrl + S)
            if (isCtrlS) {
                // Find the active form's submit button and click it to preserve HTML5 validation
                const activeSubmitBtn = document.querySelector('form button[type="submit"]');
                if (activeSubmitBtn) activeSubmitBtn.click();
                return;
            }

            // 2. Global Navigation (Alt + Key)
            if (e.altKey) {
                switch (e.key.toLowerCase()) {
                    case 'c': setActiveTab('companies-list'); break;
                    case 'i': setActiveTab('items-master'); break;
                    case 'o': setActiveTab('orders-list'); break;
                    case 'b': setActiveTab('bills-list'); break;
                    case 't': setActiveTab('tasks-workspace'); break;
                    case 'd': setActiveTab('dispatch-planner'); break;
                    case 'p': setActiveTab('accountability-hub'); break;
                    case 'l': setActiveTab('partner-new'); break;
                    case 'm': setActiveTab('admin-users'); break;
                    case 'w': setActiveTab('crm-workspace'); break;
                    case 'g': setActiveTab('grn-workspace'); break;
                    case 'e': setActiveTab('lead-generation'); break;
                    case 'r': setActiveTab('grn-workspace'); break;
                    case 'f': setActiveTab('tally-sync'); break;
                    case 'n': // Contextual New Record
                        if (activeTab.includes('company')) setActiveTab('company-new');
                        else if (activeTab.includes('order')) triggerNewOrderInitialization();
                        else if (activeTab.includes('bill')) setActiveTab('bill-new');
                        break;
                }
                return;
            }

            // 3. Escape to Discard / Go Back
            if (e.key === 'Escape') {
                if (activeTab === 'company-new') setActiveTab('companies-list');
                else if (activeTab === 'order-new') setActiveTab('orders-list');
                else if (activeTab === 'bill-new') setActiveTab('bills-list');
            }
        };

            // Attach listener to window
        window.addEventListener('keydown', handleGlobalKeyDown);
            
        // Cleanup loop to prevent memory leaks
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [sessionToken, activeTab, isAlertOpen]);
}