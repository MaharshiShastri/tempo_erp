import { useState, useEffect } from "react";

export default function useCore(){
    const [user, setUser] = useState(() => {
        const cache = localStorage.getItem("tempo_erp_user");
        return cache ? JSON.parse(cache) : null;
    });
    const sessionToken = user ? user.access_token : null;
    const [activeTab, setActiveTab] = useState('global-pulse');
    const [toasts, setToasts] = useState([]);
    
    const [errorModal, setErrorModal] = useState({title: "", message: "" });
    const [errorModalOpen, setErrorModalOpen] = useState(false);
        
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    const showErrorModal = ( title, message) => {
        setErrorModal({title, message});

        setErrorModalOpen(true);
    };

    const addToast = (message, type="info") => {
        const id = Date.now();
        setToasts(prev => [...prev, {id, message, type}]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));   
        }, 5000);
    };

    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        if (!user?.access_token) return;

        try {
            const payload = JSON.parse(atob(user.access_token.split('.')[1]));

            const expiresAt = payload.exp * 1000;
            const remaining = expiresAt - Date.now();

            if (remaining <= 0) {
                localStorage.removeItem("tempo_erp_user");
                setUser(null);
                return;
            }

            const timer = setTimeout(() => {
                localStorage.removeItem("tempo_erp_user");
                setUser(null);

                alert("Your session has expired. Please login again.");
            }, remaining);

            return () => clearTimeout(timer);

        } catch {
            localStorage.removeItem("tempo_erp_user");
            setUser(null);
        }
    }, [user]);

    return {user, setUser, sessionToken, activeTab, setActiveTab, showErrorModal, errorModal, errorModalOpen,
        setErrorModalOpen, addToast, toasts, isAlertOpen, setIsAlertOpen, alertMessage, setAlertMessage, errorMessage,
        setErrorMessage, loginEmail, setLoginEmail, loginPassword, setLoginPassword,
    };

}