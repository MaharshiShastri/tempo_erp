import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const STATUS_OPTIONS = [
    { value: "", label: "All statuses" },
    { value: "PLANNED", label: "Planned" },
    { value: "IN_PROGRESS", label: "In progress" },
    { value: "COMPLETED", label: "Completed" },
    { value: "ON_HOLD", label: "On hold" },
    { value: "CANCELLED", label: "Cancelled" },
];

export default function ProductionCalendar({ state }) {
    const {
        calendarRef,
        calendarOptions,
        filters,
        loading,
        updateFilter,
        clearFilters,
        refresh,
        handleDateSelect,
        handleEventDrop,
        handleEventResize,
        handleEventClick,
        stageOptions = [],
        teamOptions = [],
        onCreateSchedule,
    } = state;

    const renderEventContent = (eventInfo) => {
        const schedule = eventInfo.event.extendedProps.schedule;

        return (
            <div className="production-calendar-event">
                <div className="production-calendar-event-title">
                    {schedule?.order_acceptance_id ||
                        `Order #${schedule?.order_id ?? ""}`}
                </div>

                {schedule?.stage_code && (
                    <div className="production-calendar-event-stage">
                        {schedule.stage_code}
                    </div>
                )}

                {schedule?.assigned_team && (
                    <div className="production-calendar-event-team">
                        {schedule.assigned_team}
                    </div>
                )}
            </div>
        );
    };

    const hasActiveFilters = Boolean(
        filters.stageCode ||
        filters.assignedTeam ||
        filters.status
    );

    return (
        <div className="production-calendar-shell">

            <header className="production-calendar-header">
                <div className="production-calendar-header-info">
                    <div className="production-calendar-breadcrumb">
                        <span>Manufacturing</span>
                        <span>/</span>
                        <span>Production</span>
                    </div>

                    <h1>Production Planning</h1>

                    <p>
                        Plan and monitor production operations across
                        stages and teams.
                    </p>
                </div>

                <div className="production-calendar-actions">
                    <button
                        type="button"
                        className="production-calendar-button"
                        onClick={refresh}
                    >
                        Refresh
                    </button>

                    <button
                        type="button"
                        className="production-calendar-button production-calendar-button-primary"
                        onClick={() => onCreateSchedule({})}
                    >
                        + Schedule Production
                    </button>
                </div>
            </header>

            <div className="production-calendar-toolbar">
                <div className="production-calendar-toolbar-left">

                    <div className="production-calendar-filter">
                        <label htmlFor="production-stage-filter">
                            Stage
                        </label>

                        <select
                            id="production-stage-filter"
                            value={filters.stageCode}
                            onChange={(event) =>
                                updateFilter(
                                    "stageCode",
                                    event.target.value
                                )
                            }
                        >
                            <option value="">All stages</option>

                            {stageOptions.map((stage) => (
                                <option
                                    key={stage.value || stage.code}
                                    value={stage.value || stage.code}
                                >
                                    {stage.label ||
                                        stage.name ||
                                        stage.code}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="production-calendar-filter">
                        <label htmlFor="production-team-filter">
                            Team
                        </label>

                        <select
                            id="production-team-filter"
                            value={filters.assignedTeam}
                            onChange={(event) =>
                                updateFilter(
                                    "assignedTeam",
                                    event.target.value
                                )
                            }
                        >
                            <option value="">All teams</option>

                            {teamOptions.map((team) => (
                                <option
                                    key={
                                        team.value ||
                                        team.code ||
                                        team.name
                                    }
                                    value={
                                        team.value ||
                                        team.code ||
                                        team.name
                                    }
                                >
                                    {team.label ||
                                        team.name ||
                                        team.code}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="production-calendar-filter">
                        <label htmlFor="production-status-filter">
                            Status
                        </label>

                        <select
                            id="production-status-filter"
                            value={filters.status}
                            onChange={(event) =>
                                updateFilter(
                                    "status",
                                    event.target.value
                                )
                            }
                        >
                            {STATUS_OPTIONS.map((status) => (
                                <option
                                    key={status.value}
                                    value={status.value}
                                >
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            className="production-calendar-clear"
                            onClick={clearFilters}
                        >
                            Clear filters
                        </button>
                    )}
                </div>

                <div className="production-calendar-toolbar-right">
                    <div className="production-calendar-status">
                        <span
                            className={
                                loading
                                    ? "production-calendar-status-dot loading"
                                    : "production-calendar-status-dot"
                            }
                        />

                        {loading ? "Loading" : "Live planning"}
                    </div>
                </div>
            </div>

            <main className="production-calendar-container">
                <div className="production-calendar-frame">
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[
                            dayGridPlugin,
                            timeGridPlugin,
                            interactionPlugin,
                        ]}
                        {...calendarOptions}
                        eventContent={renderEventContent}
                        select={handleDateSelect}
                        eventDrop={handleEventDrop}
                        eventResize={handleEventResize}
                        eventClick={handleEventClick}
                    />
                </div>

                {loading && (
                    <div className="production-calendar-loading">
                        <div className="production-calendar-loading-spinner" />
                        <span>Loading production schedule…</span>
                    </div>
                )}
            </main>

            <footer className="production-calendar-legend">
                <div className="production-calendar-legend-item">
                    <span className="production-legend-dot planned" />
                    Planned
                </div>

                <div className="production-calendar-legend-item">
                    <span className="production-legend-dot progress" />
                    In progress
                </div>

                <div className="production-calendar-legend-item">
                    <span className="production-legend-dot completed" />
                    Completed
                </div>

                <div className="production-calendar-legend-item">
                    <span className="production-legend-dot hold" />
                    On hold
                </div>
            </footer>

        </div>
    );
}