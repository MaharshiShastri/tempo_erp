import { useState } from "react";

export default function useLogin({setUser, setLoginEmail, setLoginPassword, loginEmail, loginPassword}) {

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [modalAlert, setModalAlert] = useState({isOpen: false, title: "", message: ""});

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!loginEmail.trim() || !loginPassword.trim()) {
            setModalAlert({isOpen: true, title: "Incomplete Credentials", message: "Please enter both your credentials." });
            return;
        }

        setLoading(true);

        try {

            const res = await fetch("/api/v1/auth/login", {
                method: "POST",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify({email: loginEmail, password: loginPassword})
            });

            if(!res.ok){
                throw new Error("Invalid credentials");
            }

            const data = await res.json();

            const userData = {email:data.email, name:data.name, role:data.role, access_token:data.access_token};

            localStorage.setItem("tempo_erp_user", JSON.stringify(userData));

            setUser(userData);

        }
        catch(err){
            setModalAlert({isOpen:true, title:"Authentication Failed", message:err.message});
        }
        finally{
            setLoading(false);
        }

    };

    return {loading, showPassword, setShowPassword, modalAlert, setModalAlert, handleLogin};

}