import React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminUserRegistryView({ state }) {
  const {
    form,
    setForm,
    users,
    loading,
    isEditing,
    availableRegions,
    handleRoleChange,
    handleSave,
    handleEditClick,
    handleDelete,
    handleCancelEdit,
  } = state;

  const updateForm = (field, value) => {
    setForm({
      ...form,
      [field]: value,
    });
  };

  const toggleRegion = (region, checked) => {
    setForm({
      ...form,
      regions: checked
        ? [...form.regions, region]
        : form.regions.filter((r) => r !== region),
    });
  };

  return (
    <div className="flex flex-col gap-5 bg-[var(--bg-main)] text-[var(--text-primary)]">
      {/* ============================================================
          USER FORM
      ============================================================ */}
      <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-[var(--border-light)]">
          <CardTitle className="text-lg text-[var(--text-primary)]">
            {isEditing
              ? "✏️ Edit Team Member"
              : "🔐 Provision New Team Member"}
          </CardTitle>

          {isEditing && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelEdit}
              className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)]"
            >
              Cancel Edit
            </Button>
          )}
        </CardHeader>

        <CardContent className="bg-[var(--bg-surface)]">
          <form
            onSubmit={handleSave}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-5"
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Full Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="user-name"
                  className="text-[var(--text-primary)]"
                >
                  Full Name{" "}
                  <span className="text-[var(--brand-danger)]">*</span>
                </Label>

                <Input
                  id="user-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:ring-[var(--brand-accent)]"
                />
              </div>

              {/* Business Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="user-email"
                  className="text-[var(--text-primary)]"
                >
                  Business Email (Login ID){" "}
                  <span className="text-[var(--brand-danger)]">*</span>
                </Label>

                <Input
                  id="user-email"
                  type="email"
                  required
                  disabled={isEditing}
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:ring-[var(--brand-accent)]"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="user-password"
                  className="text-[var(--text-primary)]"
                >
                  {isEditing
                    ? "New Password (Leave blank to keep current)"
                    : "Temporary Password *"}
                </Label>

                <Input
                  id="user-password"
                  type="text"
                  required={!isEditing}
                  placeholder={isEditing ? "********" : ""}
                  value={form.password}
                  onChange={(e) =>
                    updateForm("password", e.target.value)
                  }
                  className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:ring-[var(--brand-accent)]"
                />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label
                  htmlFor="user-role"
                  className="text-[var(--text-primary)]"
                >
                  Role Definition{" "}
                  <span className="text-[var(--brand-danger)]">*</span>
                </Label>

                <Select
                  value={form.role || ""}
                  onValueChange={handleRoleChange}
                  required
                >
                  <SelectTrigger
                    id="user-role"
                    className="w-full border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] focus:ring-[var(--brand-accent)]"
                  >
                    <SelectValue placeholder="-- Assign Role Matrix --" />
                  </SelectTrigger>

                  <SelectContent className="border-[var(--border-light)] bg-[var(--bg-surface)] text-[var(--text-primary)]">
                    <SelectItem
                      value="Sales Representative"
                      className="focus:bg-[var(--combobox-hover)] focus:text-[var(--text-primary)]"
                    >
                      Sales Representative
                    </SelectItem>

                    <SelectItem
                      value="Dispatch Engineer"
                      className="focus:bg-[var(--combobox-hover)] focus:text-[var(--text-primary)]"
                    >
                      Dispatch Engineer
                    </SelectItem>

                    <SelectItem
                      value="Admin"
                      className="focus:bg-[var(--combobox-hover)] focus:text-[var(--text-primary)]"
                    >
                      System Administrator
                    </SelectItem>

                    <SelectItem
                      value="Shop Floor Worker"
                      className="focus:bg-[var(--combobox-hover)] focus:text-[var(--text-primary)]"
                    >
                      Shop Floor Worker
                    </SelectItem>

                    <SelectItem
                      value="Shop Floor Administrator"
                      className="focus:bg-[var(--combobox-hover)] focus:text-[var(--text-primary)]"
                    >
                      Shop Floor Administrator
                    </SelectItem>

                    <SelectItem
                      value="R&D Engineer"
                      className="focus:bg-[var(--combobox-hover)] focus:text-[var(--text-primary)]"
                    >
                      R&amp;D Engineer
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label
                  htmlFor="user-dob"
                  className="text-[var(--text-primary)]"
                >
                  Date of Birth
                </Label>

                <Input
                  id="user-dob"
                  type="date"
                  value={form.dob}
                  onChange={(e) => updateForm("dob", e.target.value)}
                  className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] focus-visible:ring-[var(--brand-accent)]"
                />
              </div>

              {/* Personal Phone */}
              <div className="space-y-2">
                <Label
                  htmlFor="user-phone-personal"
                  className="text-[var(--text-primary)]"
                >
                  Personal Phone
                </Label>

                <Input
                  id="user-phone-personal"
                  type="text"
                  value={form.phone_personal}
                  onChange={(e) =>
                    updateForm("phone_personal", e.target.value)
                  }
                  className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:ring-[var(--brand-accent)]"
                />
              </div>

              {/* Business Phone */}
              <div className="space-y-2">
                <Label
                  htmlFor="user-phone-business"
                  className="text-[var(--text-primary)]"
                >
                  Business Phone
                </Label>

                <Input
                  id="user-phone-business"
                  type="text"
                  value={form.phone_business}
                  onChange={(e) =>
                    updateForm("phone_business", e.target.value)
                  }
                  className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:ring-[var(--brand-accent)]"
                />
              </div>

              {/* ======================================================
                  SALES REGIONS
              ====================================================== */}
              {form.role === "Sales Representative" && (
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[var(--brand-accent)]">
                    Assigned Operational Regions &amp; Territories{" "}
                    <span className="text-[var(--text-muted)]">
                      (Sales Only)
                    </span>
                  </Label>

                  <div className="rounded-lg border border-dashed border-[var(--brand-accent)] bg-[var(--bg-main)] p-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {availableRegions.map((region) => {
                        const checked = form.regions.includes(region);

                        return (
                          <div
                            key={region}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              id={`region-${region}`}
                              checked={checked}
                              onCheckedChange={(value) =>
                                toggleRegion(
                                  region,
                                  Boolean(value)
                                )
                              }
                              className="border-[var(--border-light)] data-[state=checked]:border-[var(--brand-accent)] data-[state=checked]:bg-[var(--brand-accent)]"
                            />

                            <Label
                              htmlFor={`region-${region}`}
                              className="cursor-pointer text-sm font-normal text-[var(--text-primary)]"
                            >
                              {region}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================
                  SUBMIT
              ====================================================== */}
              <div className="flex justify-end border-t border-[var(--border-light)] pt-4 md:col-span-2">
                <Button
                  type="submit"
                  className="bg-[var(--brand-accent)] text-white hover:opacity-90"
                >
                  {isEditing
                    ? "Commit Changes"
                    : "Provision Member Access"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ============================================================
          TEAM DIRECTORY
      ============================================================ */}
      <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
        <CardHeader className="border-b border-[var(--border-light)]">
          <CardTitle className="text-lg text-[var(--text-primary)]">
            👥 Current Team Directory
          </CardTitle>
        </CardHeader>

        <CardContent className="bg-[var(--bg-surface)] p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[var(--bg-muted)]">
                <TableRow className="border-[var(--border-light)] hover:bg-[var(--bg-muted)]">
                  <TableHead className="text-[var(--text-primary)]">
                    Team Member
                  </TableHead>

                  <TableHead className="text-[var(--text-primary)]">
                    Role
                  </TableHead>

                  <TableHead className="text-[var(--text-primary)]">
                    Business Phone
                  </TableHead>

                  <TableHead className="text-[var(--text-primary)]">
                    Territories (If Sales)
                  </TableHead>

                  <TableHead className="text-right text-[var(--text-primary)]">
                    Manage
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow className="border-[var(--border-light)]">
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-[var(--text-muted)]"
                    >
                      Loading Directory...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow className="border-[var(--border-light)]">
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-[var(--text-muted)]"
                    >
                      No team members found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow
                      key={user.email}
                      className="border-[var(--border-light)] transition-colors hover:bg-[var(--combobox-hover)]"
                    >
                      {/* Member */}
                      <TableCell>
                        <div className="font-semibold text-[var(--text-primary)]">
                          {user.name}
                        </div>

                        <div className="text-xs text-[var(--text-muted)]">
                          {user.email}
                        </div>
                      </TableCell>

                      {/* Role */}
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="border-[var(--border-light)] bg-[var(--bg-muted)] text-[var(--text-primary)]"
                        >
                          {user.role}
                        </Badge>
                      </TableCell>

                      {/* Business Phone */}
                      <TableCell className="text-[var(--text-muted)]">
                        {user.phone_business || "N/A"}
                      </TableCell>

                      {/* Territories */}
                      <TableCell>
                        {user.regions &&
                        user.regions.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1">
                            {user.regions
                              .slice(0, 3)
                              .map((region) => (
                                <Badge
                                  key={region}
                                  variant="outline"
                                  className="border-[var(--border-light)] bg-[var(--bg-main)] text-xs text-[var(--text-primary)]"
                                >
                                  {region}
                                </Badge>
                              ))}

                            {user.regions.length > 3 && (
                              <span className="ml-1 text-xs text-[var(--text-muted)]">
                                +{user.regions.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">
                            None
                          </span>
                        )}
                      </TableCell>

                      {/* Manage */}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(user)}
                            className="border-[var(--border-light)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--combobox-hover)]"
                          >
                            Edit
                          </Button>

                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(user.email)}
                            className="bg-[var(--brand-danger)] text-white hover:opacity-90"
                          >
                            Revoke
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
