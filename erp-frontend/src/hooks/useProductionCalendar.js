import {useCallback, useEffect, useMemo, useRef, useState,} from "react";

import API from "../api/api";


const DEFAULT_FILTERS = {stageCode: "", assignedTeam: "", status: "",};


export default function useProductionCalendar({sessionToken, showErrorModal, onCreateSchedule, onEditSchedule,}) {
    const calendarRef = useRef(null);

    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    
    const filtersRef = useRef(DEFAULT_FILTERS);
    
    const [loading, setLoading] = useState(false);

    const [lastRefresh, setLastRefresh] = useState(null);

    const sessionTokenRef = useRef(sessionToken);
    const showErrorModalRef = useRef(showErrorModal);

    useEffect(() => {
        filtersRef.current = filters;
    }, [filters]);

    useEffect(() => {
        sessionTokenRef.current = sessionToken;
    }, [sessionToken]);

    useEffect(() => {
        showErrorModalRef.current = showErrorModal;
    }, [showErrorModal]);

    /*
     * ---------------------------------------------------------
     * Filters
     * ---------------------------------------------------------
     */

    useEffect(() => {
        const calendar =
            calendarRef.current?.getApi();

        if (!calendar) {
            return;
        }

        calendar.refetchEvents();
    }, [
        filters.stageCode,
        filters.assignedTeam,
        filters.status,
    ]);
    
    const refresh = useCallback(() => {
        const calendar =
            calendarRef.current?.getApi();

        if (!calendar) {
            return;
        }

        calendar.refetchEvents();

        setLastRefresh(new Date());
    }, []);


    const createProductionSchedule = useCallback(
        async (scheduleData) => {
            try {
                setLoading(true);

                const createdSchedule =
                    await API.createProductionSchedule(
                        sessionTokenRef.current,
                        scheduleData
                    );

                refresh();

                return createdSchedule;
            } catch (error) {
                showErrorModalRef.current?.(
                    "Create Production Schedule",
                    error.message || "Failed to create production schedule."
                );

                throw error;
            } finally {
                setLoading(false);
            }
        },
        [refresh]
    );

    const handleCreateSchedule = useCallback(
        (defaults = {}) => {
            onCreateSchedule?.({
                planned_start:
                    defaults.planned_start || "",
                planned_end:
                    defaults.planned_end || "",
                stage_code:
                    defaults.stage_code ||
                    filtersRef.current.stageCode ||
                    "",
                assigned_team:
                    defaults.assigned_team ||
                    filtersRef.current.assignedTeam ||
                    "",
                status:
                    defaults.status || "PLANNED",
                priority:
                    defaults.priority ?? 0,
            });
        },
        [onCreateSchedule]
    );

    const updateFilter = useCallback((name, value) => {
        setFilters((current) => {
            const nextFilters = {
                ...current,
                [name]: value,
            };

            filtersRef.current = nextFilters;

            return nextFilters;
        });
    }, []);
    
    const clearFilters = useCallback(() => {
        filtersRef.current = DEFAULT_FILTERS;
        setFilters(DEFAULT_FILTERS);
    }, []);


    const STAGE_OPTIONS = [
    { value: "CUTTING", label: "Cutting" },
    { value: "WELDING", label: "Welding" },
    { value: "PAINTING", label: "Painting" },
    { value: "ASSEMBLY", label: "Assembly" },
    ];

    const TEAM_OPTIONS = [
        { value: "TEAM_A", label: "Team A" },
        { value: "TEAM_B", label: "Team B" },
    ];
    /*
     * ---------------------------------------------------------
     * Load schedules
     * ---------------------------------------------------------
     *
     * FullCalendar calls this when it needs events for the
     * currently visible date range.
     */

    const loadSchedules = useCallback(async (fetchInfo) => {
        try {
            setLoading(true);

            const currentFilters = filtersRef.current;

            const schedules =
                await API.getProductionSchedules(
                    sessionTokenRef.current,
                    {
                        from: fetchInfo.start.toISOString(),
                        to: fetchInfo.end.toISOString(),

                        stageCode:
                            currentFilters.stageCode || undefined,

                        assignedTeam:
                            currentFilters.assignedTeam || undefined,

                        status:
                            currentFilters.status || undefined,
                    }
                );

            return schedules.map((schedule) => ({
                id: String(schedule.id),

                title: schedule.order_acceptance_id
                    ? `${schedule.order_acceptance_id} · ${schedule.stage_code}`
                    : schedule.stage_code,

                start: schedule.planned_start,
                end: schedule.planned_end,

                allDay: false,

                classNames: [
                    `production-event-${String(
                        schedule.status || "PLANNED"
                    )
                        .toLowerCase()
                        .replaceAll("_", "-")}`,
                ],

                extendedProps: {
                    schedule,
                },
            }));
        } catch (error) {
            showErrorModalRef.current?.(
                "Production Calendar",
                error.message
            );

            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    /*
     * ---------------------------------------------------------
     * Drag event
     * ---------------------------------------------------------
     */

    const handleEventDrop = useCallback(
        async (info) => {
            const schedule =
                info.event.extendedProps.schedule;

            try {
                const updated =
                    await API.updateProductionSchedule(
                        sessionToken,
                        schedule.id,
                        {
                            planned_start:
                                info.event.start
                                    .toISOString(),

                            planned_end:
                                info.event.end
                                    ? info.event.end.toISOString()
                                    : info.event.start.toISOString(),
                        }
                    );


                info.event.setExtendedProp(
                    "schedule",
                    updated
                );

            } catch (error) {
                info.revert();

                showErrorModal(
                    "Schedule Update",
                    error.message
                );
            }
        },
        [
            sessionToken,
            showErrorModal,
        ]
    );


    /*
     * ---------------------------------------------------------
     * Resize event
     * ---------------------------------------------------------
     */

    const handleEventResize = useCallback(
        async (info) => {
            const schedule =
                info.event.extendedProps.schedule;

            try {
                const updated =
                    await API.updateProductionSchedule(
                        sessionToken,
                        schedule.id,
                        {
                            planned_start:
                                info.event.start
                                    .toISOString(),

                            planned_end:
                                info.event.end
                                    .toISOString(),
                        }
                    );


                info.event.setExtendedProp(
                    "schedule",
                    updated
                );

            } catch (error) {
                info.revert();

                showErrorModal(
                    "Schedule Resize",
                    error.message
                );
            }
        },
        [
            sessionToken,
            showErrorModal,
        ]
    );


    /*
     * ---------------------------------------------------------
     * Calendar selection
     * ---------------------------------------------------------
     */

    const handleDateSelect = useCallback(
        (selection) => {
            onCreateSchedule?.({
                planned_start:
                    selection.start.toISOString(),

                planned_end:
                    selection.end.toISOString(),

                stage_code:
                    filtersRef.current.stageCode || "",

                assigned_team:
                    filtersRef.current.assignedTeam || "",

                status: "PLANNED",
                priority: 0,
            });
        },
        [onCreateSchedule]
    );

    /*
     * ---------------------------------------------------------
     * Event click
     * ---------------------------------------------------------
     */

    const handleEventClick = useCallback(
        (info) => {
            const schedule =
                info.event.extendedProps.schedule;

            onEditSchedule(schedule);
        },
        [onEditSchedule]
    );


    /*
     * ---------------------------------------------------------
     * Calendar options
     * ---------------------------------------------------------
     *
     * These are behavioral/configuration options only.
     * No JSX/rendering lives here.
     */

    const calendarOptions = useMemo(
        () => ({
            initialView: "timeGridWeek",

            headerToolbar: {
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
            },

            nowIndicator: true,

            selectable: true,
            editable: true,

            eventResizableFromStart: true,
            selectMirror: true,

            slotDuration: "00:30:00",
            slotLabelInterval: "01:00:00",

            slotMinTime: "07:00:00",
            slotMaxTime: "21:00:00",

            allDaySlot: false,

            eventDisplay: "block",

            events: loadSchedules,
        }),
        [loadSchedules]
    );


    return {calendarRef, calendarOptions, filters, loading, lastRefresh, updateFilter, clearFilters, refresh,
        handleDateSelect, handleEventDrop, handleEventResize, handleEventClick, stageOptions: STAGE_OPTIONS,
        teamOptions: TEAM_OPTIONS, onCreateSchedule, createProductionSchedule, handleCreateSchedule,
    };
}