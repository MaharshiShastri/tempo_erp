import { useCallback, useEffect, useState } from "react";
import API from "../api/api";

export default function useExerciseGenerator({
    sessionToken,
    setAlertMessage,
    setIsAlertOpen,
}) {

    const [exerciseName, setExerciseName] = useState("");
    const [selectedPersonEmail, setSelectedPersonEmail] = useState("");
    const [selectedPersonName, setSelectedPersonName] = useState("");

    const [roleFilter, setRoleFilter] = useState("");

    const [roles, setRoles] = useState([]);
    const [people, setPeople] = useState([]);

    const [isLoadingRoles, setIsLoadingRoles] = useState(false);
    const [isLoadingPeople, setIsLoadingPeople] = useState(false);
    const [isExerciseGenerating, setIsExerciseGenerating] = useState(false);

    // =========================================================
    // LOAD ROLES
    // =========================================================

    const loadRoles = useCallback(async () => {

        if (!sessionToken) {
            return;
        }

        try {

            setIsLoadingRoles(true);

            const result = await API.fetchExerciseRoles(
                sessionToken
            );

            setRoles(
                Array.isArray(result)
                    ? result
                    : []
            );

        } catch (error) {

            setAlertMessage(
                error.message || "Failed to load exercise roles."
            );

            setIsAlertOpen(true);

        } finally {

            setIsLoadingRoles(false);
        }

    }, [sessionToken, setAlertMessage, setIsAlertOpen,]);


    // =========================================================
    // LOAD PEOPLE
    // =========================================================

    const loadPeople = useCallback(async (role = "") => {

        if (!sessionToken) {
            return;
        }

        try {

            setIsLoadingPeople(true);

            const result = await API.fetchExerciseUsers(sessionToken, role || "");

            setPeople(
                Array.isArray(result)
                    ? result
                    : []
            );

        } catch (error) {

            setAlertMessage(error.message || "Failed to load ERP users.");

            setIsAlertOpen(true);

        } finally {

            setIsLoadingPeople(false);
        }

    }, [sessionToken, setAlertMessage, setIsAlertOpen,]);


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {
        if (!sessionToken) return;

        loadRoles();
    }, [sessionToken, loadRoles]);


    useEffect(() => {
        if (!sessionToken) return;

        setSelectedPersonEmail("");
        setSelectedPersonName("");

        loadPeople(roleFilter);
    }, [sessionToken, roleFilter, loadPeople]);

    // =========================================================
    // PERSON CHANGE
    // =========================================================

    const handlePersonChange = useCallback((email) => {

        setSelectedPersonEmail(email);

        const selected =people.find(person => person.email === email);

        setSelectedPersonName(selected?.name || "");

    }, [people]);


    // =========================================================
    // GENERATE
    // =========================================================

    const generateExercise = useCallback(async () => {

        console.log("[EXERCISE] generateExercise() ENTERED");

        const cleanExerciseName = exerciseName.trim();

        const cleanPersonEmail = selectedPersonEmail.trim();

        const cleanRole =
            roleFilter?.trim() || null;

        console.log(
            "[EXERCISE] values:",
            {
                exerciseName: cleanExerciseName,
                personEmail: cleanPersonEmail,
                role: cleanRole,
            }
        );

        // ---------------------------------------------------------
        // ONLY exercise name is compulsory.
        // ---------------------------------------------------------

        if (!cleanExerciseName) {

            setAlertMessage(
                "Exercise name is required."
            );

            setIsAlertOpen(true);

            return;
        }

        if (!sessionToken) {

            setAlertMessage(
                "Your session has expired. Please login again."
            );

            setIsAlertOpen(true);

            return;
        }

        try {

            setIsExerciseGenerating(true);

            const payload = {
                exercise_name: cleanExerciseName,
                person_email:
                    cleanPersonEmail || null,
                role: cleanRole,
            };

            console.log(
                "[EXERCISE] POST payload:",
                payload
            );

            const blob =
                await API.generateExerciseDocument(
                    payload,
                    sessionToken
                );

            console.log(
                "[EXERCISE] Document received:",
                {
                    size: blob?.size,
                    type: blob?.type,
                }
            );

            const url =
                window.URL.createObjectURL(blob);

            const anchor =
                document.createElement("a");

            anchor.href = url;

            const safeExerciseName =
                cleanExerciseName.replace(
                    /[^a-zA-Z0-9._-]/g,
                    "_"
                );

            const safePersonName =
                selectedPersonName
                    ?.replace(
                        /[^a-zA-Z0-9._-]/g,
                        "_"
                    ) || "";

            const isZip =
                blob.type === "application/zip";

            anchor.download = isZip
                ? `Exercises_${safeExerciseName}.zip`
                : `Exercise_${safeExerciseName}_${safePersonName}.docx`;

            document.body.appendChild(anchor);

            anchor.click();

            anchor.remove();

            window.URL.revokeObjectURL(url);

            setAlertMessage(
                cleanPersonEmail
                    ? "Exercise document generated successfully."
                    : "Exercise documents generated successfully."
            );

            setIsAlertOpen(true);

        } catch (error) {

            console.error(
                "[EXERCISE] Generation failed:",
                error
            );

            setAlertMessage(
                error.message ||
                "Failed to generate exercise document."
            );

            setIsAlertOpen(true);

        } finally {

            setIsExerciseGenerating(false);
        }

    }, [
        exerciseName,
        selectedPersonEmail,
        selectedPersonName,
        roleFilter,
        sessionToken,
        setAlertMessage,
        setIsAlertOpen,
    ]);

    return {exerciseName, setExerciseName, selectedPersonEmail, selectedPersonName, roleFilter, setRoleFilter, roles,
        people, isLoadingRoles, isLoadingPeople, isExerciseGenerating, handlePersonChange, generateExercise, loadRoles,
        loadPeople,
    };
}