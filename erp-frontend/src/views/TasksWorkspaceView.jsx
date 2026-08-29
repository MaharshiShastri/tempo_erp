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
    <Card className="w-full overflow-hidden">
      {/* ============================================================
          HEADER
      ============================================================ */}

      <CardHeader className="border-b px-5 py-5 md:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* TITLE */}

          <div className="space-y-1">
            <CardTitle className="text-xl">
              Corporate Workflow Task Manager
            </CardTitle>

            <p className="text-sm text-muted-foreground">
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
              <SelectTrigger className="w-full sm:w-[170px]">
                <div className="flex items-center gap-2">
                  <ListFilter className="h-4 w-4 text-muted-foreground" />

                  <SelectValue placeholder="Filter status" />
                </div>
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  🚦 All Statuses
                </SelectItem>

                <SelectItem value="pending">
                  ⏳ Pending Only
                </SelectItem>

                <SelectItem value="done">
                  ✅ Completed Only
                </SelectItem>
              </SelectContent>
            </Select>

            {/* VIEW TABS */}

            <div className="flex rounded-md border bg-muted/40 p-1">
              <Button
                type="button"
                variant={
                  viewTab === "received"
                    ? "default"
                    : "ghost"
                }
                size="sm"
                className="gap-2"
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
                className="gap-2"
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

      <CardContent className="space-y-6 p-5 md:p-6">
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