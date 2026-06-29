import React, { useState } from "react";
import TaskCreationForm from "../components/shared/TaskCreationForm";
import TaskList from "../components/shared/TaskList";
import API from "../api/api"; 

export default function TasksWorkspaceView({ state }) {
    const [expandedTaskId, setExpandedTaskId] = useState(null);
    const [viewTab, setViewTab] = useState('received'); 
    const [statusFilter, setStatusFilter] = useState('all'); 
    
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDetails, setNewTaskDetails] = useState('');
    const [selectedAssignees, setSelectedAssignees] = useState([]);
    const [newTaskDeadline, setNewTaskDeadline] = useState('');
    const [newTaskFile, setNewTaskFile] = useState(null);

    const tasksArray = state.tasks || [];
    
    const filteredTasks = tasksArray.filter(t => {
        const matchesTab = viewTab === 'received' ? t.assigned_to.includes(state.user.email) : t.assigned_by === state.user.email;
        const matchesStatus = statusFilter === 'all' ? true : (statusFilter === 'pending' ? t.is_incomplete : !t.is_incomplete);
        return matchesTab && matchesStatus;
    });

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        await state.handleCreateTask({
            title: newTaskTitle,
            details: newTaskDetails,
            direction: 'dispatched',
            assigned_to: selectedAssignees,
            attachment: newTaskFile,
            deadline: newTaskDeadline
        });
        setNewTaskTitle('');
        setNewTaskDetails('');
        setSelectedAssignees([]);
        setNewTaskFile(null);
        setNewTaskDeadline('');
        document.getElementById('task-file-input').value = "";
    };

    // UPDATED: Uses Native Browser Tabs instead of a custom modal
    const handleFileAction = async (attachmentPath) => {
        try {
            const baseName = attachmentPath.split(/[\\/]/).pop();
            const displayName = baseName.substring(baseName.indexOf('_') + 1) || baseName;
            const ext = displayName.split('.').pop().toLowerCase();

            state.setAlertMessage("Fetching secure attachment...");
            state.setIsAlertOpen(true);

            const rawBlob = await API.fetchTaskAttachment(baseName, state.user.access_token);
            
            // Explicitly map MIME types so the browser knows how to render the new tab
            let mimeType = rawBlob.type;
            if (ext === 'pdf') mimeType = 'application/pdf';
            else if (['jpg', 'jpeg'].includes(ext)) mimeType = 'image/jpeg';
            else if (ext === 'png') mimeType = 'image/png';

            // Reconstruct the blob with the explicit MIME type
            const typedBlob = new Blob([rawBlob], { type: mimeType });
            const url = URL.createObjectURL(typedBlob);
            
            state.setIsAlertOpen(false);

            const previewable = ['pdf', 'jpg', 'jpeg', 'png'].includes(ext);

            if (previewable) {
                // Open native browser viewer in a new tab
                const newWindow = window.open(url, '_blank');
                if (!newWindow) {
                    throw new Error("Popup blocked. Please allow popups for this site to view files.");
                }
            } else {
                // Word/Excel force a direct browser download due to security restrictions
                const a = document.createElement("a");
                a.href = url;
                a.download = displayName;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 1000); 
            }
        } catch (e) {
            state.setIsAlertOpen(false);
            state.showErrorModal("File Access Error", e.message);
        }
    };

    return (
        <div className="frappe-card">
            <div className="system-header">
                <div>
                    <h2>Corporate Workflow Task Manager</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Delegate, track, and dispatch operational queues.</p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <select 
                        className="form-select-native" 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '6px', fontSize: '13px', minWidth: '120px' }}
                    >
                        <option value="all">🚦 All Statuses</option>
                        <option value="pending">⏳ Pending Only</option>
                        <option value="done">✅ Completed Only</option>
                    </select>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className={`btn ${viewTab === 'received' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewTab('received')}>📥 My Inbox</button>
                        <button className={`btn ${viewTab === 'dispatched' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewTab('dispatched')}>📤 Dispatched</button>
                    </div>
                </div>
            </div>

            <TaskCreationForm
                state={state}
                selectedAssignees={selectedAssignees}
                setSelectedAssignees={setSelectedAssignees}
                newTaskTitle={newTaskTitle}
                setNewTaskTitle={setNewTaskTitle}
                newTaskDetails={newTaskDetails}
                setNewTaskDetails={setNewTaskDetails}
                setNewTaskFile={setNewTaskFile}
                newTaskDeadline={newTaskDeadline}
                setNewTaskDeadline={setNewTaskDeadline}
                handleFormSubmit={handleFormSubmit}
            />

            <TaskList
                tasks={filteredTasks}
                viewTab={viewTab}
                expandedTaskId={expandedTaskId}
                setExpandedTaskId={setExpandedTaskId}
                state={state}
                handleFileAction={handleFileAction} 
            />
        </div>
    );
}