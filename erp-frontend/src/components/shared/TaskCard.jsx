import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Edit2,
  FileText,
  Paperclip,
  Save,
  Trash2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

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

  const isExpanded = expandedTaskId === task.id;

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

    const underscoreIndex =
      baseName.indexOf("_");

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
      await state.updateTask(
        task.id,
        editForm
      );

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

  const toggleExpanded = () => {
    if (!isEditing) {
      setExpandedTaskId(
        isExpanded ? null : task.id
      );
    }
  };

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        {/* Task identity */}
        <div
          className={`min-w-0 flex-1 ${
            isEditing
              ? ""
              : "cursor-pointer"
          }`}
          onClick={toggleExpanded}
        >
          {isEditing ? (
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
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h3
                  className={`truncate text-sm font-semibold md:text-base ${
                    task.is_incomplete
                      ? ""
                      : "text-muted-foreground line-through"
                  }`}
                >
                  {task.title}
                </h3>

                <Badge
                  variant={
                    task.is_incomplete
                      ? "outline"
                      : "secondary"
                  }
                >
                  {task.is_incomplete
                    ? "Pending"
                    : "Done"}
                </Badge>
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                {viewTab === "received"
                  ? `Assigned by: ${getUserName(
                      task.assigned_by
                    )}`
                  : `Assigned to: ${task.assigned_to
                      .map(getUserName)
                      .join(", ")}`}
              </p>
            </>
          )}
        </div>

        {/* Actions */}
        <div
          className="flex flex-wrap items-center gap-2"
          onClick={(e) =>
            e.stopPropagation()
          }
        >
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
                      size="sm"
                      onClick={() =>
                        handleFileAction(file)
                      }
                    >
                      <Paperclip className="mr-1.5 h-3.5 w-3.5" />
                      <span className="max-w-[180px] truncate">
                        {getDisplayFileName(file)}
                      </span>
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
                    onClick={() => {
                      setIsEditing(true);
                      setExpandedTaskId(
                        task.id
                      );
                    }}
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
                    variant="ghost"
                    size="sm"
                    className="text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      state.downloadTaskPDF(
                        task.id
                      );
                    }}
                  >
                    <Download className="mr-1.5 h-4 w-4" />
                    Download Task
                  </Button>
                </>
              )}

              <label
                className="flex cursor-pointer items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs"
                onClick={(e) =>
                  e.stopPropagation()
                }
              >
                <span>
                  Status:{" "}
                  <strong
                    className={
                      task.is_incomplete
                        ? "text-destructive"
                        : "text-emerald-600 dark:text-emerald-400"
                    }
                  >
                    {task.is_incomplete
                      ? "Pending"
                      : "Done"}
                  </strong>
                </span>

                <Checkbox
                  checked={!task.is_incomplete}
                  onCheckedChange={() =>
                    state.toggleTask(task.id)
                  }
                />
              </label>

              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={toggleExpanded}
                title={
                  isExpanded
                    ? "Collapse task"
                    : "Expand task"
                }
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Details */}
      {isExpanded && (
        <>
          <Separator />

          <CardContent className="space-y-5 bg-muted/20 p-5">
            {isEditing ? (
              <div
                className="space-y-4"
                onClick={(e) =>
                  e.stopPropagation()
                }
              >
                <div className="space-y-2">
                  <Label>Task Details</Label>

                  <Textarea
                    rows={5}
                    value={editForm.details}
                    onChange={(e) =>
                      updateEditField(
                        "details",
                        e.target.value
                      )
                    }
                    placeholder="Task details..."
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
              <>
                <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                  {task.details}
                </p>

                <div className="grid gap-3 rounded-lg border bg-background p-4 sm:grid-cols-3">
                  <InfoItem
                    label="Created"
                    value={formatDateTime(
                      task.created_at
                    )}
                  />

                  {task.deadline && (
                    <InfoItem
                      label="Deadline"
                      value={formatDateTime(
                        task.deadline
                      )}
                      valueClassName="text-primary"
                    />
                  )}

                  {task.completed_at &&
                    !task.is_incomplete && (
                      <InfoItem
                        label="Completed"
                        value={formatDateTime(
                          task.completed_at
                        )}
                        valueClassName="text-emerald-600 dark:text-emerald-400"
                      />
                    )}
                </div>
              </>
            )}
          </CardContent>
        </>
      )}
    </Card>
  );
}

function InfoItem({
  label,
  value,
  valueClassName = "",
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">
        {label}
      </p>

      <p
        className={`mt-1 text-sm font-semibold ${valueClassName}`}
      >
        {value || "—"}
      </p>
    </div>
  );
}