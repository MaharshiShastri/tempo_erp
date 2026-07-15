import { useState, useCallback, useEffect } from "react";
import API from "../api/api";

export default function useTasks({sessionToken, user, setAlertMessage, setIsAlertOpen, showErrorModal, addToast, dispatchSystemNotification}) {
    const [tasks, setTasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(false);

    const loadTasks = useCallback(async () => {

        if (!sessionToken) return;

        setLoadingTasks(true);

        try {
            const data = await API.fetchTasks(sessionToken);
            console.log("Tasks fetched: ", data);
            setTasks(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            showErrorModal?.("Task Synchronization Failed", err.message || "Unable to load task workspace.");
        } finally {
            setLoadingTasks(false);
        }
    }, [sessionToken, showErrorModal]);

    const createTask = useCallback(async (payload) => {
        try {
            const createdTask = await API.saveTask(payload, sessionToken);
            await loadTasks();
            dispatchSystemNotification?.("Task Dispatched", "Notification sent to assigned operators.");
            addToast?.("Task successfully deployed.", "success");
            return createdTask;
        } catch (err) {
            showErrorModal?.("Task Creation Failed", err.message);
            throw err;
        }}, [sessionToken, dispatchSystemNotification, addToast, showErrorModal]);

    const toggleTask = useCallback(async (taskId) => {
        try {
            const updated = await API.toggleTaskStatus(taskId, sessionToken);
            await loadTasks();
            return updated;
        } catch (err) {
            showErrorModal?.("Task Update Failed", err.message);
        }

    }, [sessionToken, showErrorModal]);

    const updateTask = useCallback(async (taskId, payload) => {

        try {
            const updatedTask = await API.updateTask(taskId, payload, sessionToken);

            await loadTasks();

            setAlertMessage?.("Task updated successfully.");
            setIsAlertOpen?.(true);

            return updatedTask;
        } catch (err) {
            showErrorModal?.("Update Failed", err.message);
            throw err;
        }
    }, [sessionToken, setAlertMessage, setIsAlertOpen, showErrorModal]);

    const deleteTask = useCallback(async (taskId) => {

        try {
            await API.deleteTask(taskId, sessionToken);
            await loadTasks();
            setAlertMessage?.("Task deleted.");
            setIsAlertOpen?.(true);
        } catch (err) {
            showErrorModal?.("Delete Failed", err.message);
            throw err;
        }},[sessionToken, setAlertMessage, setIsAlertOpen, showErrorModal]);

    const openAttachment = useCallback(async (attachmentPath) => {

        try {
            const baseName = attachmentPath.split(/[\\/]/).pop();
            const displayName = baseName.substring(baseName.indexOf("_") + 1) ||baseName;

            const ext =displayName.split(".").pop().toLowerCase();

            setAlertMessage?.("Fetching secure attachment...");
            setIsAlertOpen?.(true);

            const rawBlob =await API.fetchTaskAttachment(baseName, sessionToken);

            let mimeType = rawBlob.type;

            if (ext === "pdf")
                mimeType = "application/pdf";

            else if (["jpg", "jpeg"].includes(ext))
                mimeType = "image/jpeg";

            else if (ext === "png")
                mimeType = "image/png";

            const typedBlob = new Blob([rawBlob], { type: mimeType });

            const url =URL.createObjectURL(typedBlob);

            setIsAlertOpen?.(false);

            const previewable = [
                "pdf",
                "jpg",
                "jpeg",
                "png"
            ].includes(ext);

            if (previewable) {
                const newWindow = window.open(url, "_blank");

                if (!newWindow) {
                    throw new Error("Popup blocked. Please allow popups.");
                }

            } else {
                const a = document.createElement("a");

                a.href = url;
                a.download = displayName;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => {URL.revokeObjectURL(url);}, 1000);
            }
        } catch (err) {
            setIsAlertOpen?.(false);
            showErrorModal?.("File Access Error", err.message);
        }},[sessionToken, setAlertMessage, setIsAlertOpen, showErrorModal]);

    const downloadTaskPDF = useCallback(async (taskId) => {

        try {
            await API.downloadPdf(taskId, sessionToken);
        } catch (err) {
            showErrorModal?.("PDF Export Failed", err.message);
        }}, [sessionToken, showErrorModal]);
    
    return {tasks, setTasks, loadingTasks, loadTasks, createTask, toggleTask, updateTask, deleteTask, openAttachment, downloadTaskPDF};

}