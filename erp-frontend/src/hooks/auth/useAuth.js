import { useState, useEffect} from "react";
import API from "../api/api";

export default function useAuth(){
    const [user, setUser] = useState(() => {
        const cache = localStorage.getItem('tempo_erp_user');
        return cache ? JSON.parse(cache) : null;
    });

    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            setErrorMessage('');
            const data = await API.login(loginEmail, loginPassword);
            localStorage.setItem('tempo_erp_user', JSON.stringify(data));
            setUser(data);
            await refreshTaskHub();
        } catch (err) { setErrorMessage('Access denied. Invalid signature parameters.'); }
    };

    const handleLogout = () => { localStorage.removeItem('tempo_erp_user'); setUser(null); };
    
}