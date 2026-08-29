import React from "react";
import { ListChecks } from "lucide-react";

import TaskCard from "./TaskCard";

export default function TaskList({
  tasks,
  viewTab,
  expandedTaskId,
  setExpandedTaskId,
  state,
  handleFileAction,
}) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-14 text-center">
        <div className="mb-3 rounded-full bg-muted p-3">
          <ListChecks className="h-6 w-6 text-muted-foreground" />
        </div>

        <p className="font-medium">
          Queue clear
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          No pending operations logged here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {tasks.map((task) => (
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
}