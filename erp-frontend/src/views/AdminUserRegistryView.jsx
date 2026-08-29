import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="flex flex-col gap-5">
      {/* ============================================================
          USER FORM
      ============================================================ */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">
            {isEditing
              ? "✏️ Edit Team Member"
              : "🔐 Provision New Team Member"}
          </CardTitle>

          {isEditing && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelEdit}
            >
              Cancel Edit
            </Button>
          )}
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSave}
            className="rounded-lg border bg-muted/30 p-5"
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="user-name">
                  Full Name <span className="text-destructive">*</span>
                </Label>

                <Input
                  id="user-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                />
              </div>

              {/* Business Email */}
              <div className="space-y-2">
                <Label htmlFor="user-email">
                  Business Email (Login ID){" "}
                  <span className="text-destructive">*</span>
                </Label>

                <Input
                  id="user-email"
                  type="email"
                  required
                  disabled={isEditing}
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="user-password">
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
                  onChange={(e) => updateForm("password", e.target.value)}
                />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="user-role">
                  Role Definition{" "}
                  <span className="text-destructive">*</span>
                </Label>

                <Select
                  value={form.role || ""}
                  onValueChange={handleRoleChange}
                  required
                >
                  <SelectTrigger id="user-role" className="w-full">
                    <SelectValue placeholder="-- Assign Role Matrix --" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="Sales Representative">
                      Sales Representative
                    </SelectItem>

                    <SelectItem value="Dispatch Engineer">
                      Dispatch Engineer
                    </SelectItem>

                    <SelectItem value="Admin">
                      System Administrator
                    </SelectItem>

                    <SelectItem value="Shop Floor Worker">
                      Shop Floor Worker
                    </SelectItem>

                    <SelectItem value="Shop Floor Administrator">
                      Shop Floor Administrator
                    </SelectItem>

                    <SelectItem value="R&D Engineer">
                      R&amp;D Engineer
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="user-dob">Date of Birth</Label>

                <Input
                  id="user-dob"
                  type="date"
                  value={form.dob}
                  onChange={(e) => updateForm("dob", e.target.value)}
                />
              </div>

              {/* Personal Phone */}
              <div className="space-y-2">
                <Label htmlFor="user-phone-personal">
                  Personal Phone
                </Label>

                <Input
                  id="user-phone-personal"
                  type="text"
                  value={form.phone_personal}
                  onChange={(e) =>
                    updateForm("phone_personal", e.target.value)
                  }
                />
              </div>

              {/* Business Phone */}
              <div className="space-y-2">
                <Label htmlFor="user-phone-business">
                  Business Phone
                </Label>

                <Input
                  id="user-phone-business"
                  type="text"
                  value={form.phone_business}
                  onChange={(e) =>
                    updateForm("phone_business", e.target.value)
                  }
                />
              </div>

              {/* ======================================================
                  SALES REGIONS
              ====================================================== */}
              {form.role === "Sales Representative" && (
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-primary">
                    Assigned Operational Regions &amp; Territories{" "}
                    <span className="text-muted-foreground">
                      (Sales Only)
                    </span>
                  </Label>

                  <div className="rounded-lg border border-dashed border-primary/50 bg-muted/20 p-4">
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
                                toggleRegion(region, Boolean(value))
                              }
                            />

                            <Label
                              htmlFor={`region-${region}`}
                              className="cursor-pointer text-sm font-normal"
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
              <div className="flex justify-end border-t pt-4 md:col-span-2">
                <Button type="submit">
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            👥 Current Team Directory
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Business Phone</TableHead>
                  <TableHead>Territories (If Sales)</TableHead>
                  <TableHead className="text-right">Manage</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Loading Directory...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No team members found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.email}>
                      {/* Member */}
                      <TableCell>
                        <div className="font-semibold">
                          {user.name}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {user.email}
                        </div>
                      </TableCell>

                      {/* Role */}
                      <TableCell>
                        <Badge variant="secondary">
                          {user.role}
                        </Badge>
                      </TableCell>

                      {/* Business Phone */}
                      <TableCell className="text-muted-foreground">
                        {user.phone_business || "N/A"}
                      </TableCell>

                      {/* Territories */}
                      <TableCell>
                        {user.regions && user.regions.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1">
                            {user.regions.slice(0, 3).map((region) => (
                              <Badge
                                key={region}
                                variant="outline"
                                className="text-xs"
                              >
                                {region}
                              </Badge>
                            ))}

                            {user.regions.length > 3 && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                +{user.regions.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
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
                          >
                            Edit
                          </Button>

                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(user.email)}
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