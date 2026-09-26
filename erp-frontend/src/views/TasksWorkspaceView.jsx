import React from "react";

import TaskCreationForm from "../components/shared/TaskCreationForm";
import TaskList from "../components/shared/TaskList";

import {
  Inbox,
  Send,
  ListFilter,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TasksWorkspaceView({ state }) {
  const {
    tasks,
    loadingTasks,
    loadTasks,
    filteredTasks,
    viewTab,
    setViewTab,
    statusFilter,
    expandedTaskId,
    newTaskTitle,
    setNewTaskTitle,
    newTaskDetails,
    setNewTaskDetails,
    selectedAssignees,
    setSelectedAssignees,
    newTaskDeadline,
    setNewTaskDeadline,
    newTaskFile,
    setNewTaskFile,
    handleFormSubmit,
    createTask,
    toggleTask,
    updateTask,
    deleteTask,
    openAttachment,
    downloadTaskPDF,
    setExpandedTaskId,
    setStatusFilter,
    systemUsers,
  } = state;

  return (
    <Card
      className="
        w-full
        overflow-hidden
        border
        border-[var(--border-subtle)]
        bg-[var(--bg-surface)]
        text-[var(--text-primary)]
        shadow-[var(--shadow-sm)]
      "
    >
      {/* ============================================================
          HEADER
      ============================================================ */}

      <CardHeader
        className="
          border-b
          border-[var(--border-light)]
          bg-[var(--bg-muted)]
          px-5
          py-5
          md:px-6
        "
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* TITLE */}

          <div className="space-y-1">
            <CardTitle className="text-xl text-[var(--text-primary)]">
              Corporate Workflow Task Manager
            </CardTitle>

            <p className="text-sm text-[var(--text-muted)]">
              Delegate, track, and dispatch operational queues.
            </p>
          </div>

          {/* CONTROLS */}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* STATUS FILTER */}

            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger
                className="
                  w-full
                  border-[var(--border-light)]
                  bg-[var(--bg-main)]
                  text-[var(--text-primary)]
                  focus:border-[var(--brand-accent)]
                  focus:ring-[var(--brand-accent)]
                  sm:w-[170px]
                "
              >
                <div className="flex items-center gap-2">
                  <ListFilter className="h-4 w-4 text-[var(--text-muted)]" />

                  <SelectValue placeholder="Filter status" />
                </div>
              </SelectTrigger>

              <SelectContent
                className="
                  border-[var(--border-light)]
                  bg-[var(--bg-surface)]
                  text-[var(--text-primary)]
                "
              >
                <SelectItem
                  value="all"
                  className="
                    focus:bg-[var(--combobox-hover)]
                    focus:text-[var(--text-primary)]
                  "
                >
                  🚦 All Statuses
                </SelectItem>

                <SelectItem
                  value="pending"
                  className="
                    focus:bg-[var(--combobox-hover)]
                    focus:text-[var(--text-primary)]
                  "
                >
                  ⏳ Pending Only
                </SelectItem>

                <SelectItem
                  value="done"
                  className="
                    focus:bg-[var(--combobox-hover)]
                    focus:text-[var(--text-primary)]
                  "
                >
                  ✅ Completed Only
                </SelectItem>
              </SelectContent>
            </Select>

            {/* VIEW TABS */}

            <div
              className="
                flex
                rounded-md
                border
                border-[var(--border-light)]
                bg-[var(--bg-main)]
                p-1
              "
            >
              <Button
                type="button"
                variant={
                  viewTab === "received"
                    ? "default"
                    : "ghost"
                }
                size="sm"
                className={
                  viewTab === "received"
                    ? "gap-2 bg-[var(--brand-accent)] text-white shadow-[var(--shadow-sm)] hover:opacity-90"
                    : "gap-2 text-[var(--text-primary)] hover:bg-[var(--combobox-hover)] hover:text-[var(--text-primary)]"
                }
                onClick={() => setViewTab("received")}
              >
                <Inbox className="h-4 w-4" />
                My Inbox
              </Button>

              <Button
                type="button"
                variant={
                  viewTab === "dispatched"
                    ? "default"
                    : "ghost"
                }
                size="sm"
                className={
                  viewTab === "dispatched"
                    ? "gap-2 bg-[var(--brand-accent)] text-white shadow-[var(--shadow-sm)] hover:opacity-90"
                    : "gap-2 text-[var(--text-primary)] hover:bg-[var(--combobox-hover)] hover:text-[var(--text-primary)]"
                }
                onClick={() => setViewTab("dispatched")}
              >
                <Send className="h-4 w-4" />
                Dispatched
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* ============================================================
          CONTENT
      ============================================================ */}

      <CardContent
        className="
          space-y-6
          bg-[var(--bg-surface)]
          p-5
          text-[var(--text-primary)]
          md:p-6
        "
      >
        {/* TASK CREATION */}

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

        {/* TASK LIST */}

        <TaskList
          tasks={filteredTasks}
          viewTab={viewTab}
          expandedTaskId={expandedTaskId}
          setExpandedTaskId={setExpandedTaskId}
          state={state}
          handleFileAction={state.openAttachment}
        />
      </CardContent>
    </Card>
  );
}