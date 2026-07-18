import { useState, useEffect, useCallback } from "react";
import API from "../../api/api";

export default function useAdminRegistry({sessionToken, setAlertMessage, setIsAlertOpen}) {

    const defaultForm = {email: "", name: "", password: "", role: "", dob: "", phone_personal: "", phone_business: "", regions: []};

    const availableRegions = [
        "Amazon","Andhra Pradesh","Assam","Cement","Central",
        "Chattisgarh","Delhi","East Zone","Goa","Gujarat",
        "Gujarat-STC","Haryana","Himachal Pradesh","J&K",
        "Kanpur","Karnataka","Kerala","Lucknow",
        "Madhya Pradesh","Maharashtra","Mumbai","New Delhi",
        "Pune","Punjab","Rajasthan","Tamil Nadu","Thane",
        "UP","Uttrakhand","Varanasi","Vidarbh","Vizag"
    ];

    const [form, setForm] = useState({ ...defaultForm });
    const [users, setUsers] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadUsers = useCallback(async () => {
        setLoading(true);

        try {
            const data = await API.fetchUsers(sessionToken);
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            setAlertMessage("Failed to fetch users: " + err.message);
            setIsAlertOpen(true);
        } finally {
            setLoading(false);
        }

    }, [sessionToken, setAlertMessage, setIsAlertOpen]);

    useEffect(() => {
        if (sessionToken) loadUsers();
    }, [sessionToken, loadUsers]);

    const handleRoleChange = (role) => {
        setForm(prev => ({
            ...prev,
            role,
            regions: role === "Sales Representative"
                ? prev.regions
                : []
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();

        try {

            if (isEditing) {
                await API.updateUser(form.email, form, sessionToken);
            } else {

                const response = await fetch("/api/v1/auth/users/create", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${sessionToken}`
                    },
                    body: JSON.stringify(form)
                });

                if (!response.ok)
                    throw new Error("Registration failed. Email might already exist.");
            }

            setAlertMessage(
                `Team Member ${isEditing ? "Updated" : "Registered"} Successfully`
            );
            setIsAlertOpen(true);

            setForm({ ...defaultForm });
            setIsEditing(false);

            await loadUsers();

        } catch (err) {

            setAlertMessage(err.message);
            setIsAlertOpen(true);

        }
    };

    const handleEditClick = (user) => {

        setForm({
            email: user.email,
            name: user.name,
            password: "",
            role: user.role,
            dob: user.dob || "",
            phone_personal: user.phone_personal || "",
            phone_business: user.phone_business || "",
            regions: user.regions || []
        });

        setIsEditing(true);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    };

    const handleDelete = async (email) => {

        if (!window.confirm(`Delete ${email}?`))
            return;

        try {

            await API.deleteUser(email, sessionToken);

            if (form.email === email) {
                setForm({ ...defaultForm });
                setIsEditing(false);
            }

            await loadUsers();

        } catch (err) {

            setAlertMessage(err.message);
            setIsAlertOpen(true);

        }

    };

    const handleCancelEdit = () => {
        setForm({ ...defaultForm });
        setIsEditing(false);
    };

    return {users, form, loading, isEditing, availableRegions, setForm, loadUsers, handleSave, handleDelete, handleEditClick,
        handleCancelEdit, handleRoleChange};

}