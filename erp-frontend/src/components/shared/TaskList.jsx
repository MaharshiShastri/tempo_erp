import React from "react";
import TaskCard from "./TaskCard";
export default function TaskList({ tasks, viewTab, expandedTaskId, setExpandedTaskId, state}) {
    if (tasks.length === 0) {
        return (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Queue clear. No pending operations logged here.</div>
        );
    } 
    
    return(
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px'}}>
            {tasks.map(task => (
                <TaskCard
                    key={task.id}
                    task={task}
                    viewTab={viewTab}
                    expandedTaskId={expandedTaskId}
                    setExpandedTaskId={setExpandedTaskId}
                    handleFileAction={handleFileAction}
                    state={state}
                />
                ))}
        </div>
    );
};