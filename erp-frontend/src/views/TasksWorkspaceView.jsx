import React, { useState } from "react";
import TaskCreationForm from "../components/shared/TaskCreationForm";
import TaskList from "../components/shared/TaskList";
import API from "../api/api"; // Make sure API is imported for the file fetch

export default function TasksWorkspaceView({ state }) {
    const [expandedTaskId, setExpandedTaskId] = useState(null);
    const [viewTab, setViewTab] = useState('received'); 
    
    // NEW: Status Filter
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'done'
    
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDetails, setNewTaskDetails] = useState('');
    const [selectedAssignees, setSelectedAssignees] = useState([]);
    const [newTaskDeadline, setNewTaskDeadline] = useState('');
    const [newTaskFile, setNewTaskFile] = useState(null);
    
    // NEW: File Preview Modal State
    const [previewModal, setPreviewModal] = useState({ isOpen: false, fileUrl: null, fileType: null, fileName: null });

    const tasksArray = state.tasks || [];
    
    // UPDATED: Combined Tab Filter & Status Filter
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

    // NEW: Handles fetching the file with Auth, then previewing or downloading
    const handleFileAction = async (attachmentPath) => {
        try {
            const baseName = attachmentPath.split(/[\\/]/).pop();
            const displayName = baseName.substring(baseName.indexOf('_') + 1) || baseName;
            const ext = displayName.split('.').pop().toLowerCase();

            state.setAlertMessage("Fetching secure attachment...");
            state.setIsAlertOpen(true);

            const blob = await API.fetchTaskAttachment(baseName, state.user.access_token);
            const url = URL.createObjectURL(blob);
            state.setIsAlertOpen(false); // Close fetching alert

            const previewable = ['pdf', 'jpg', 'jpeg', 'png'].includes(ext);

            if (previewable) {
                setPreviewModal({
                    isOpen: true,
                    fileUrl: url,
                    fileName: displayName,
                    fileType: ext === 'pdf' ? 'application/pdf' : `image/${ext}`
                });
            } else {
                // Word/Excel force a direct browser download
                const a = document.createElement("a");
                a.href = url;
                a.download = displayName;
                document.body.appendChild(a);
                a.click();
                a.remove();
                // Revoke URL slightly later to ensure download starts
                setTimeout(() => URL.revokeObjectURL(url), 1000); 
            }
        } catch (e) {
            state.setIsAlertOpen(false);
            state.setAlertMessage("Failed to fetch file: " + e.message);
            state.setIsAlertOpen(true);
        }
    };

    const closePreviewModal = () => {
        if (previewModal.fileUrl) URL.revokeObjectURL(previewModal.fileUrl);
        setPreviewModal({ isOpen: false, fileUrl: null, fileType: null, fileName: null });
    };

    return (
        <div className="frappe-card">
            <div className="system-header">
                <div>
                    <h2>Corporate Workflow Task Manager</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Delegate, track, and dispatch operational queues.</p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {/* NEW: Status Filter Dropdown */}
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
                handleFileAction={handleFileAction} // Pass down to Card
            />

            {/* NEW: File Preview Modal */}
            {previewModal.isOpen && (
                <div className="modal-overlay" onClick={closePreviewModal}>
                    <div className="modal-box" style={{ maxWidth: '900px', width: '90%', height: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border-light)'}}>
                            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--brand-accent)' }}>📎 {previewModal.fileName}</h3>
                            <button className="btn-text-danger" style={{ fontSize: '14px', fontWeight: 'bold' }} onClick={closePreviewModal}>✕ Close</button>
                        </div>
                        
                        <div style={{ flexGrow: 1, marginTop: '15px', borderRadius: '4px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-sidebar)' }}>
                            {previewModal.fileType === 'application/pdf' ? (
                                <iframe src={previewModal.fileUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="PDF Preview" />
                            ) : (
                                <img src={previewModal.fileUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '15px', borderTop: '1px solid var(--border-light)', marginTop: '15px' }}>
                            <a href={previewModal.fileUrl} download={previewModal.fileName} className="btn btn-primary" style={{ textDecoration: 'none' }}>
                                ⬇️ Download File
                            </a>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}