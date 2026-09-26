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

const themedInputClass =
  "border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]";

const themedSelectTriggerClass =
  "border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] focus:ring-[var(--brand-accent)]";

const themedSelectContentClass =
  "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)]";

const themedSelectItemClass =
  "focus:bg-[var(--combobox-hover)] focus:text-[var(--text-primary)]";

export default function ExerciseGeneratorView({
  state,
}) {
  return (
    <Card className="w-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
      <CardHeader className="border-b border-[var(--border-light)]">
        <CardTitle className="text-xl text-[var(--text-primary)]">
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
              <Label
                htmlFor="exercise-name"
                className="text-[var(--text-primary)]"
              >
                Exercise Name{" "}
                <span className="text-[var(--brand-danger)]">
                  *
                </span>
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
                className={themedInputClass}
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label
                htmlFor="role-filter"
                className="text-[var(--text-primary)]"
              >
                Filter by Role
              </Label>

              <Select
                value={state.roleFilter}
                onValueChange={(value) =>
                  state.setRoleFilter(value)
                }
              >
                <SelectTrigger
                  id="role-filter"
                  className={`w-full ${themedSelectTriggerClass}`}
                >
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>

                <SelectContent className={themedSelectContentClass}>
                  <SelectItem
                    value=""
                    className={themedSelectItemClass}
                  >
                    All Roles
                  </SelectItem>

                  {state.roles.map((role) => (
                    <SelectItem
                      key={role}
                      value={role}
                      className={themedSelectItemClass}
                    >
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Person */}
            <div className="space-y-2">
              <Label
                htmlFor="person"
                className="text-[var(--text-primary)]"
              >
                Person
              </Label>

              <Select
                value={state.selectedPersonEmail}
                onValueChange={(value) =>
                  state.handlePersonChange(value)
                }
                disabled={state.isLoadingPeople}
              >
                <SelectTrigger
                  id="person"
                  className={`w-full ${themedSelectTriggerClass}`}
                >
                  <SelectValue
                    placeholder={
                      state.isLoadingPeople
                        ? "Loading people..."
                        : "All matching people"
                    }
                  />
                </SelectTrigger>

                <SelectContent className={themedSelectContentClass}>
                  <SelectItem
                    value=""
                    className={themedSelectItemClass}
                  >
                    {state.isLoadingPeople
                      ? "Loading people..."
                      : "All matching people"}
                  </SelectItem>

                  {state.people.map((person) => (
                    <SelectItem
                      key={person.email}
                      value={person.email}
                      className={themedSelectItemClass}
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
            <div className="rounded-md border border-[var(--border-light)] bg-[var(--bg-muted)] px-4 py-3 text-sm text-[var(--text-primary)]">
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
              disabled={
                state.isExerciseGenerating ||
                !state.exerciseName.trim()
              }
              className={
                state.isExerciseGenerating
                  ? "bg-[var(--brand-danger)] text-white hover:opacity-90"
                  : "bg-[var(--brand-accent)] text-white hover:opacity-90"
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