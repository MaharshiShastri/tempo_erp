import React, { useState } from "react";
import TaskCreationForm from "../components/shared/TaskCreationForm";
import TaskList from "../components/shared/TaskList";

export default function TasksWorkspaceView({ state }) {
    const [expandedTaskId, setExpandedTaskId] = useState(null);
    const [viewTab, setViewTab] = useState('received'); 
    const [statusFilter, setStatusFilter] = useState('all'); 
    
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDetails, setNewTaskDetails] = useState('');
    const [selectedAssignees, setSelectedAssignees] = useState([]);
    const [newTaskDeadline, setNewTaskDeadline] = useState('');
    const [newTaskFile, setNewTaskFile] = useState([]);
    
    const tasksArray = state.tasks || [];
    
    const filteredTasks = tasksArray.filter(t => {
        const matchesTab = viewTab === 'received' ? t.assigned_to.includes(state.user.email) : t.assigned_by === state.user.email;
        const matchesStatus = statusFilter === 'all' ? true : (statusFilter === 'pending' ? t.is_incomplete : !t.is_incomplete);
        return matchesTab && matchesStatus;
    });

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        await state.createTask({
            title: newTaskTitle,
            details: newTaskDetails,
            direction: 'dispatched',
            assigned_to: selectedAssignees,
            attachments: newTaskFile,
            deadline: newTaskDeadline
        });
        setNewTaskTitle('');
        setNewTaskDetails('');
        setSelectedAssignees([]);
        setNewTaskFile([]);
        setNewTaskDeadline('');
        document.getElementById('task-file-input').value = "";
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
                handleFileAction={state.openAttachment} 
            />
        </div>
    );
}