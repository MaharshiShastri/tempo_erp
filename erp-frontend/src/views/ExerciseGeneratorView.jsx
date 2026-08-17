export default function ExerciseGeneratorView({
    state,
}) {

    return (
        <div className="frappe-card">

            <div className="system-header">

                <h2>
                    Exercise Explanation & Acknowledgement
                </h2>

            </div>

            <form onSubmit={(e) => { e.preventDefault(); console.log("[UI] FORM SUBMITTED"); state.generateExercise();}}>
                <div className="form-grid-layout" style={{gridTemplateColumns:"repeat(3, 1fr)",}}>

                    {/* Exercise */}

                    <div className="form-group">

                        <label className="input-label">
                            Exercise Name *
                        </label>
                        <input type="text" className="form-input" value={state.exerciseName} onChange={(e) => state.setExerciseName(e.target.value)}  placeholder="Enter exercise name" required/>

                    </div>


                    {/* Role */}

                    <div className="form-group">

                        <label className="input-label">
                            Filter by Role
                        </label>

                        <select className="form-input" value={state.roleFilter} onChange={(e) => state.setRoleFilter(e.target.value)}>
                            <option value="">All Roles</option>

                            {state.roles.map((role) => (<option key={role} value={role}>{role}</option>))}
                        </select>

                    </div>


                    {/* Person */}

                    <div className="form-group">

                        <label className="input-label">
                            Person
                        </label>

                        <select className="form-input" value={state.selectedPersonEmail} onChange={e =>state.handlePersonChange(e.target.value)} disabled={state.isLoadingPeople}>
                            <option value="">
                                {state.isLoadingPeople ? "Loading people..." : "All matching people"}
                            </option>

                            {state.people.map((person) => (
                                <option key={person.email} value={person.email}>
                                    {person.name}
                                    {person.role ? ` — ${person.role}` : ""}
                                </option>
                            ))}
                        </select>

                    </div>

                </div>


                {/* Selected person */}

                {state?.selectedPersonName && (

                    <div style={{marginTop: "15px", padding: "12px", background: "var(--bg-main)", borderRadius:"var(--radius-sm)", }}>

                        <strong>
                            Exercise will be generated for:
                        </strong>{" "}

                        {state?.selectedPersonName}

                    </div>

                )}


                {/* Generate */}

                <div style={{display: "flex", justifyContent: "flex-end", marginTop: "20px", gap: "10px",}}>

                    <button type="submit" className={`${state.isExerciseGenerating ? "btn-text-danger" : "btn btn-success"}`} disabled={state.isExerciseGenerating || !state.exerciseName.trim()}>
                        {state.isExerciseGenerating ? "Generating Document..." : "Generate Exercise Document"}
                    </button>

                </div>
            </form>
        </div>
    );
}