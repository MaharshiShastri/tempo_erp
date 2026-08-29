import React from "react";
import { Paperclip, Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import OperatorMultiSelect from "./OperatorMultiSelect";

export default function TaskCreationForm({
  state,
  selectedAssignees,
  setSelectedAssignees,
  newTaskTitle,
  setNewTaskTitle,
  newTaskDetails,
  setNewTaskDetails,
  newTaskFile,
  setNewTaskFile,
  newTaskDeadline,
  setNewTaskDeadline,
  handleFormSubmit,
}) {
  const getTomorrowDateString = () => {
    const tomorrow = new Date();

    tomorrow.setDate(tomorrow.getDate() + 1);

    const offset = tomorrow.getTimezoneOffset() * 60000;

    return new Date(
      tomorrow.getTime() - offset
    )
      .toISOString()
      .slice(0, 16);
  };

  const assignableUsers = (
    state.systemUsers || []
  ).filter((u) =>
    [
      "Shop Floor Worker",
      "Shop Floor Administrator",
      "Admin",
      "Chief Full Stack Developer",
    ].includes(u.role)
  );

  const handleFiles = (event) => {
    const files = Array.from(event.target.files);

    if (files.length > 5) {
      alert("You can upload a maximum of 5 files.");
      event.target.value = "";
      return;
    }

    setNewTaskFile(files);
  };

  return (
    <Card className="border-muted bg-muted/20">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-semibold">
          Delegate New Workflow Target
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleFormSubmit} className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-3">
            {/* From */}
            <div className="space-y-2">
              <Label>From (Operator)</Label>

              <Input
                value={state.user.name}
                disabled
                className="bg-background"
              />
            </div>

            {/* Assignees */}
            <div className="space-y-2 lg:col-span-2">
              <Label>
                To (Target Assignees){" "}
                <span className="text-destructive">*</span>
              </Label>

              <OperatorMultiSelect
                users={assignableUsers}
                selectedEmails={selectedAssignees}
                onChange={setSelectedAssignees}
              />
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label>Target Deadline (Optional)</Label>

              <Input
                type="datetime-local"
                min={getTomorrowDateString()}
                value={newTaskDeadline}
                onChange={(e) =>
                  setNewTaskDeadline(e.target.value)
                }
              />
            </div>

            {/* Title */}
            <div className="space-y-2 lg:col-span-3">
              <Label>
                Task Title{" "}
                <span className="text-destructive">*</span>
              </Label>

              <Input
                required
                placeholder="Task Title (View Metadata)"
                value={newTaskTitle}
                onChange={(e) =>
                  setNewTaskTitle(e.target.value)
                }
              />
            </div>

            {/* Details */}
            <div className="space-y-2 lg:col-span-3">
              <Label>
                Detailed Instructions{" "}
                <span className="text-destructive">*</span>
              </Label>

              <Textarea
                required
                rows={4}
                placeholder="Detailed Instructions..."
                value={newTaskDetails}
                onChange={(e) =>
                  setNewTaskDetails(e.target.value)
                }
              />
            </div>

            {/* Files */}
            <div className="space-y-2 lg:col-span-2">
              <Label>Attachments</Label>

              <div className="flex items-center gap-3">
                <Input
                  id="task-file-input"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx"
                  multiple
                  onChange={handleFiles}
                  className="cursor-pointer bg-background"
                />

                <Paperclip className="hidden h-4 w-4 text-muted-foreground sm:block" />
              </div>

              <p className="text-xs text-muted-foreground">
                Optional · PDF, image, Excel, or Word · maximum 5
                files.
              </p>
            </div>

            {/* Submit */}
            <div className="flex items-end justify-start lg:justify-end">
              <Button
                type="submit"
                disabled={selectedAssignees.length === 0}
                className="w-full sm:w-auto"
              >
                <Rocket className="mr-2 h-4 w-4" />
                Deploy Task
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}