import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";

export default function ExerciseGeneratorView({
  state,
}) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">
          Exercise Explanation & Acknowledgement
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            console.log("[UI] FORM SUBMITTED");
            state.generateExercise();
          }}
          className="space-y-6"
        >
          {/* Exercise / Role / Person */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

            {/* Exercise */}
            <div className="space-y-2">
              <Label htmlFor="exercise-name">
                Exercise Name <span className="text-destructive">*</span>
              </Label>

              <Input
                id="exercise-name"
                type="text"
                value={state.exerciseName}
                onChange={(e) =>
                  state.setExerciseName(e.target.value)
                }
                placeholder="Enter exercise name"
                required
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role-filter">
                Filter by Role
              </Label>

              <Select
                value={state.roleFilter}
                onValueChange={(value) =>
                  state.setRoleFilter(value)
                }
              >
                <SelectTrigger id="role-filter" className="w-full">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="">
                    All Roles
                  </SelectItem>

                  {state.roles.map((role) => (
                    <SelectItem
                      key={role}
                      value={role}
                    >
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Person */}
            <div className="space-y-2">
              <Label htmlFor="person">
                Person
              </Label>

              <Select
                value={state.selectedPersonEmail}
                onValueChange={(value) =>
                  state.handlePersonChange(value)
                }
                disabled={state.isLoadingPeople}
              >
                <SelectTrigger id="person" className="w-full">
                  <SelectValue
                    placeholder={
                      state.isLoadingPeople
                        ? "Loading people..."
                        : "All matching people"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="">
                    {state.isLoadingPeople
                      ? "Loading people..."
                      : "All matching people"}
                  </SelectItem>

                  {state.people.map((person) => (
                    <SelectItem
                      key={person.email}
                      value={person.email}
                    >
                      {person.name}
                      {person.role
                        ? ` — ${person.role}`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selected person */}
          {state?.selectedPersonName && (
            <div className="rounded-md border bg-muted/50 px-4 py-3 text-sm">
              <strong>
                Exercise will be generated for:
              </strong>{" "}
              {state?.selectedPersonName}
            </div>
          )}

          {/* Generate */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="submit"
              variant={
                state.isExerciseGenerating
                  ? "destructive"
                  : "default"
              }
              disabled={
                state.isExerciseGenerating ||
                !state.exerciseName.trim()
              }
            >
              {state.isExerciseGenerating
                ? "Generating Document..."
                : "Generate Exercise Document"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}