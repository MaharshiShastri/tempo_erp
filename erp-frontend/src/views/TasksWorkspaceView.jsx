import React, { useState } from "react";
import TaskCreationForm from "../components/shared/TaskCreationForm";
import TaskList from "../components/shared/TaskList";

export default function TasksWorkspaceView({ state }) {
    const {tasks, loadingTasks, loadTasks, filteredTasks, viewTab, setViewTab, statusFilter, expandedTaskId,
        newTaskTitle, setNewTaskTitle, newTaskDetails, setNewTaskDetails, selectedAssignees, setSelectedAssignees, 
        newTaskDeadline, setNewTaskDeadline, newTaskFile, setNewTaskFile, handleFormSubmit, createTask, toggleTask,
        updateTask, deleteTask, openAttachment, downloadTaskPDF, setExpandedTaskId, setStatusFilter, systemUsers} = state;
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