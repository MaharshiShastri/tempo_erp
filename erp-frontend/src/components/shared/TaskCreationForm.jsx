import React from "react";
import OperatorMultiSelect from "./OperatorMultiSelect";
export default function TaskCreationForm({state, selectedAssignees, setSelectedAssignees, newTaskTitle, setNewTaskTitle, newTaskDetails, setNewTaskDetails, handleFormSubmit}) {
 return (
    <form onSubmit={handleFormSubmit} style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: 'var(--radius-md)', marginBottom: '20px', border: '1px solid var(--border-light)' }}>
        <h4 style={{ margin: '0 0 15px 0', fontSize: '14px' }}>Delegate New Workflow Target</h4>
        <div className="form-grid-layout" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="form-group">
                <label className="input-label">FROM (Operator)</label>
                <input type="text" disabled className="form-input" style={{ opacity: 0.7 }} value={state.user.name} />
                </div>

                <div className="form-group grid-span-2">
                    <label className="input-label">TO (Target Assignees) *</label>
                    <OperatorMultiSelect users={state.systemUsers || []} selectedEmails={selectedAssignees} onChange={setSelectedAssignees} />
                </div>

                <div className="form-group grid-span-3" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                        <input type="text" placeholder="Task Title (View Metadata) *" required className="form-input" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} />
                    </div>
                    <div style={{ flex: 2 }}>
                        <input type="text" placeholder="Detailed Instructions... *" required className="form-input" value={newTaskDetails} onChange={e => setNewTaskDetails(e.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-success" disabled={selectedAssignees.length === 0} style={{ padding: '8px 24px', whiteSpace: 'nowrap' }}>Deploy Task</button>
            </div>
        </div>
    </form>
 );
};