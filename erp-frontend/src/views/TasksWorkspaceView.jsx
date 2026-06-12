import React from "react";
import TaskCreationForm from "../components/shared/TaskCreationForm";
import TaskList from "../components/shared/TaskList";

export default function TasksWorkspaceView({ state }) {
    const [expandedTaskId, setExpandedTaskId] = React.useState(null);
    const [viewTab, setViewTab] = React.useState('received'); 
    const [newTaskTitle, setNewTaskTitle] = React.useState('');
    const [newTaskDetails, setNewTaskDetails] = React.useState('');
    const [selectedAssignees, setSelectedAssignees] = React.useState([]);

    const tasksArray = state.tasks || [];
    
    const filteredTasks = tasksArray.filter(t => {
        if (viewTab === 'received') return t.assigned_to.includes(state.user.email);
        return t.assigned_by === state.user.email;
    });

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        await state.handleCreateTask({
            title: newTaskTitle,
            details: newTaskDetails,
            direction: 'dispatched',
            assigned_to: selectedAssignees
        });
        setNewTaskTitle('');
        setNewTaskDetails('');
        setSelectedAssignees([]);
    };

    return (
        <div className="frappe-card">
            <div className="system-header">
                <div>
                    <h2>Corporate Workflow Task Manager</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Delegate, track, and dispatch operational queues.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className={`btn ${viewTab === 'received' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewTab('received')}>📥 My Inbox (Received)</button>
                    <button className={`btn ${viewTab === 'dispatched' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewTab('dispatched')}>📤 Dispatched by Me</button>
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
                handleFormSubmit={handleFormSubmit}
            />

            <TaskList
                tasks={filteredTasks}
                viewTab={viewTab}
                expandedTaskId={expandedTaskId}
                setExpandedTaskId={setExpandedTaskId}
                state={state}
            />
        </div>
    );
};