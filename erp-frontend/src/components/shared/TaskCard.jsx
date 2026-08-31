import React, { useState } from "react";
import {
  Download,
  Edit2,
  Paperclip,
  Save,
  Trash2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function TaskCard({
  task,
  viewTab,
  expandedTaskId,
  setExpandedTaskId,
  handleFileAction,
  state,
}) {
  const [isEditing, setIsEditing] = useState(false);

  const [editForm, setEditForm] = useState({
    title: task.title,
    details: task.details,
    deadline: task.deadline || "",
  });

  const getUserName = (email) => {
    const userMatch = state.systemUsers?.find(
      (u) => u.email === email
    );

    return userMatch ? userMatch.name : email;
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return "";

    const d = new Date(isoString);

    const pad = (n) =>
      n.toString().padStart(2, "0");

    return `${pad(d.getDate())}/${pad(
      d.getMonth() + 1
    )}/${d.getFullYear()} - ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };

  const getDisplayFileName = (path) => {
    if (!path) return "";

    const baseName = path.split(/[\\/]/).pop();

    const underscoreIndex = baseName.indexOf("_");

    return underscoreIndex >= 0
      ? baseName.substring(underscoreIndex + 1)
      : baseName;
  };

  const canEditOrDelete =
    state.user.email === task.assigned_by ||
    state.user.role === "Admin" ||
    state.user.role ===
      "Chief Full Stack Developer";

  const updateEditField = (field, value) => {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleUpdate = async (e) => {
    e.stopPropagation();

    try {
      await state.updateTask(task.id, editForm);
      setIsEditing(false);
    } catch (err) {
      state.showErrorModal(
        "Update Failed",
        err.message
      );
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();

    if (
      !window.confirm(
        "Are you sure you want to permanently delete this task?"
      )
    ) {
      return;
    }

    try {
      await state.deleteTask(task.id);
    } catch (err) {
      state.showErrorModal(
        "Delete Failed",
        err.message
      );
    }
  };

  return (
    <Card
      className="
        overflow-hidden
        border-border/70
        shadow-sm
        transition-shadow
        hover:shadow-md
      "
    >
      <div
        className="
          grid
          items-stretch
          gap-0
          lg:grid-cols-[18%_minmax(0,1fr)_13%_10%_auto]
        "
      >
        {/* =========================================================
            TASK / IDENTITY
        ========================================================= */}
        <div
          className="
            min-w-0
            border-b
            bg-muted/20
            p-4
            lg:border-b-0
            lg:border-r
          "
        >
          {isEditing ? (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Task
              </Label>

              <Input
                value={editForm.title}
                onChange={(e) =>
                  updateEditField(
                    "title",
                    e.target.value
                  )
                }
                onClick={(e) =>
                  e.stopPropagation()
                }
                className="font-semibold"
              />
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2">
                <h3
                  className={`
                    min-w-0
                    flex-1
                    text-sm
                    font-semibold
                    leading-5
                    md:text-base
                    ${
                      task.is_incomplete
                        ? "text-foreground"
                        : "text-muted-foreground line-through"
                    }
                  `}
                  title={task.title}
                >
                  {task.title}
                </h3>

                <Badge
                  variant={
                    task.is_incomplete
                      ? "outline"
                      : "secondary"
                  }
                  className="shrink-0"
                >
                  {task.is_incomplete
                    ? "Pending"
                    : "Done"}
                </Badge>
              </div>

              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {viewTab === "received"
                  ? `Assigned by: ${getUserName(
                      task.assigned_by
                    )}`
                  : `Assigned to: ${task.assigned_to
                      .map(getUserName)
                      .join(", ")}`}
              </p>

              <p className="mt-2 text-[11px] text-muted-foreground">
                Created{" "}
                {formatDateTime(task.created_at)}
              </p>
            </>
          )}
        </div>

        {/* =========================================================
            TASK INSTRUCTION
            This intentionally gets the maximum available space.
        ========================================================= */}
        <div
          className="
            min-w-0
            border-b
            p-4
            lg:border-b-0
            lg:border-r
          "
        >
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Task Instruction</Label>

                <Textarea
                  rows={6}
                  value={editForm.details}
                  onChange={(e) =>
                    updateEditField(
                      "details",
                      e.target.value
                    )
                  }
                  placeholder="Task details..."
                  className="min-h-[140px] resize-y"
                />
              </div>

              <div className="max-w-sm space-y-2">
                <Label>Deadline</Label>

                <Input
                  type="datetime-local"
                  value={editForm.deadline}
                  onChange={(e) =>
                    updateEditField(
                      "deadline",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>
          ) : (
            <div className="h-full">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Task Instruction
              </p>

              <div
                className="
                  whitespace-pre-wrap
                  break-words
                  text-sm
                  leading-6
                  text-foreground
                "
              >
                {task.details || "No instruction provided."}
              </div>
            </div>
          )}
        </div>

        {/* =========================================================
            DEADLINE
        ========================================================= */}
        <div
          className="
            min-w-0
            border-b
            p-4
            lg:border-b-0
            lg:border-r
          "
        >
          <p className="text-xs font-medium text-muted-foreground">
            Deadline
          </p>

          <p
            className="
              mt-2
              break-words
              text-sm
              font-semibold
              leading-5
              text-primary
            "
          >
            {task.deadline
              ? formatDateTime(task.deadline)
              : "—"}
          </p>

          {task.completed_at &&
            !task.is_incomplete && (
              <>
                <p className="mt-4 text-xs font-medium text-muted-foreground">
                  Completed
                </p>

                <p className="mt-2 text-sm font-semibold leading-5 text-emerald-600 dark:text-emerald-400">
                  {formatDateTime(
                    task.completed_at
                  )}
                </p>
              </>
            )}
        </div>

        {/* =========================================================
            STATUS
        ========================================================= */}
        <div
          className="
            flex
            items-center
            justify-center
            border-b
            p-4
            lg:border-b-0
            lg:border-r
          "
          onClick={(e) =>
            e.stopPropagation()
          }
        >
          <label
            className="
              flex
              cursor-pointer
              flex-col
              items-center
              gap-2
              rounded-lg
              border
              bg-muted/30
              px-3
              py-3
              text-center
            "
          >
            <span className="text-xs text-muted-foreground">
              Status
            </span>

            <strong
              className={
                task.is_incomplete
                  ? "text-xs text-destructive"
                  : "text-xs text-emerald-600 dark:text-emerald-400"
              }
            >
              {task.is_incomplete
                ? "Pending"
                : "Done"}
            </strong>

            <Checkbox
              checked={!task.is_incomplete}
              onCheckedChange={() =>
                state.toggleTask(task.id)
              }
            />
          </label>
        </div>

        {/* =========================================================
            ACTIONS
        ========================================================= */}
        <div
          className="
            flex
            flex-wrap
            items-center
            justify-center
            gap-1.5
            p-3
          "
          onClick={(e) =>
            e.stopPropagation()
          }
        >
          {/* Attachments */}
          {!isEditing &&
            task?.attachment_urls?.length >
              0 && (
              <div className="flex flex-wrap gap-1.5">
                {task.attachment_urls.map(
                  (file) => (
                    <Button
                      key={file}
                      type="button"
                      variant="outline"
                      size="icon"
                      title={getDisplayFileName(
                        file
                      )}
                      onClick={() =>
                        handleFileAction(file)
                      }
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                    </Button>
                  )
                )}
              </div>
            )}

          {isEditing ? (
            <>
              <Button
                size="sm"
                onClick={handleUpdate}
              >
                <Save className="mr-1.5 h-3.5 w-3.5" />
                Save
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(false);
                }}
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              {canEditOrDelete && (
                <>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    title="Edit task"
                    onClick={() =>
                      setIsEditing(true)
                    }
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    title="Delete task"
                    className="text-destructive hover:text-destructive"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    title="Download task"
                    className="text-primary"
                    onClick={() =>
                      state.downloadTaskPDF(
                        task.id
                      )
                    }
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}