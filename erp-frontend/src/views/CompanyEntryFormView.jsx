import React from "react";

import {
    Building2,
    MapPin,
    UserRound,
    Phone,
    Trash2,
    ArrowLeft,
    Save,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function SectionHeader({
    icon: Icon,
    title,
    description,
}) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                </div>

                <h3 className="text-sm font-semibold">
                    {title}
                </h3>
            </div>

            {description && (
                <p className="pl-10 text-xs text-muted-foreground">
                    {description}
                </p>
            )}
        </div>
    );
}

export default function CompanyEntryFormView({ state }) {
    const form = state.companyForm;

    if (!form) {
        return null;
    }

    const updateField = (field, value) => {
        state.setCompanyForm((current) => ({
            ...(current || {}),
            [field]: value,
        }));
    };

    return (
        <div className="mx-auto w-full max-w-5xl space-y-4">
            {/* PAGE HEADER */}
            <Card className="overflow-hidden border-primary/20 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-primary/10 via-background to-blue-500/10">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                                <Building2 className="size-5" />
                            </div>

                            <div className="min-w-0">
                                <CardTitle className="text-xl">
                                    {state.isEditingCompany
                                        ? `Edit Profile: ${state.selectedCompanyId}`
                                        : "New Customer Profile"}
                                </CardTitle>

                                <CardDescription className="mt-1">
                                    {state.isEditingCompany
                                        ? "Update the existing enterprise master account."
                                        : "Provision a new enterprise master account."}
                                </CardDescription>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {state.isEditingCompany && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="border-red-500/30 text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400"
                                    onClick={() =>
                                        state.deleteCompany(
                                            state.selectedCompanyId
                                        )
                                    }
                                >
                                    <Trash2 className="mr-2 size-4" />
                                    Delete
                                </Button>
                            )}

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    state.setActiveTab(
                                        "companies-list"
                                    )
                                }
                            >
                                <ArrowLeft className="mr-2 size-4" />
                                Discard
                            </Button>

                            <Button
                                type="submit"
                                form="company-entry-form"
                            >
                                <Save className="mr-2 size-4" />
                                {state.isEditingCompany
                                    ? "Save Changes"
                                    : "Save Profile"}

                                <kbd className="ml-2 rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] font-medium">
                                    Ctrl+S
                                </kbd>
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* FORM */}
            <form
                id="company-entry-form"
                onSubmit={state.commitCompanySubmit}
                className="space-y-5"
            >
                {/* BASIC INFORMATION */}
                <Card className="border-border/70 shadow-sm">
                    <CardHeader>
                        <SectionHeader
                            icon={Building2}
                            title="Basic Information"
                            description="The registered legal identity of the customer."
                        />
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="company-name">
                                Registered Legal Name
                                <span className="ml-1 text-destructive">
                                    *
                                </span>
                            </Label>

                            <Input
                                id="company-name"
                                type="text"
                                required
                                value={form.name || ""}
                                onChange={(event) =>
                                    updateField(
                                        "name",
                                        event.target.value
                                    )
                                }
                                placeholder="e.g. Tempo Instruments Manufacturing Pvt Ltd"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* ADDRESS */}
                <Card className="border-border/70 shadow-sm">
                    <CardHeader>
                        <SectionHeader
                            icon={MapPin}
                            title="Registered Address"
                            description="Primary registered business location."
                        />
                    </CardHeader>

                    <CardContent className="space-y-5">
                        <div className="grid gap-2">
                            <Label htmlFor="address-line-1">
                                Address Line 1
                                <span className="ml-1 text-destructive">
                                    *
                                </span>
                            </Label>

                            <Input
                                id="address-line-1"
                                type="text"
                                required
                                value={
                                    form.address_line_1 || ""
                                }
                                onChange={(event) =>
                                    updateField(
                                        "address_line_1",
                                        event.target.value
                                    )
                                }
                                placeholder="Plot No, Industrial Estate, Phase, Complex Area..."
                            />
                        </div>

                        <Separator />

                        <div className="grid gap-4 md:grid-cols-2">
                            {/* CITY */}
                            <div className="grid gap-2">
                                <Label htmlFor="company-city">
                                    City
                                    <span className="ml-1 text-destructive">
                                        *
                                    </span>
                                </Label>

                                <Input
                                    id="company-city"
                                    list="company-city-options"
                                    required
                                    value={form.city || ""}
                                    onChange={(event) =>
                                        updateField(
                                            "city",
                                            event.target.value
                                        )
                                    }
                                    placeholder="Select or type city..."
                                />

                                <datalist id="company-city-options">
                                    {(state.industrialCities ||
                                        []).map((city) => (
                                        <option
                                            key={city}
                                            value={city}
                                        />
                                    ))}
                                </datalist>
                            </div>

                            {/* STATE */}
                            <div className="grid gap-2">
                                <Label htmlFor="company-state">
                                    State / Province
                                    <span className="ml-1 text-destructive">
                                        *
                                    </span>
                                </Label>

                                <Input
                                    id="company-state"
                                    list="company-state-options"
                                    required
                                    value={form.state || ""}
                                    onChange={(event) =>
                                        updateField(
                                            "state",
                                            event.target.value
                                        )
                                    }
                                    placeholder="Select or type state..."
                                />

                                <datalist id="company-state-options">
                                    {(state.indianStates || []).map(
                                        (stateName) => (
                                            <option
                                                key={stateName}
                                                value={stateName}
                                            />
                                        )
                                    )}
                                </datalist>
                            </div>

                            {/* PIN */}
                            <div className="grid gap-2">
                                <Label htmlFor="company-pincode">
                                    Postal PIN Code
                                    <span className="ml-1 text-destructive">
                                        *
                                    </span>
                                </Label>

                                <Input
                                    id="company-pincode"
                                    type="text"
                                    required
                                    pattern="^[0-9]{6}$"
                                    maxLength={6}
                                    inputMode="numeric"
                                    value={form.pincode || ""}
                                    onChange={(event) =>
                                        updateField(
                                            "pincode",
                                            event.target.value
                                        )
                                    }
                                    placeholder="e.g. 400001"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* PRIMARY CONTACT */}
                <Card className="border-border/70 shadow-sm">
                    <CardHeader>
                        <SectionHeader
                            icon={UserRound}
                            title="Primary Contact"
                            description="Main customer representative for day-to-day communication."
                        />
                    </CardHeader>

                    <CardContent className="space-y-5">
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* NAME */}
                            <div className="grid gap-2">
                                <Label htmlFor="contact-name">
                                    Full Name
                                    <span className="ml-1 text-destructive">
                                        *
                                    </span>
                                </Label>

                                <Input
                                    id="contact-name"
                                    type="text"
                                    required
                                    value={
                                        form.contact_name || ""
                                    }
                                    onChange={(event) =>
                                        updateField(
                                            "contact_name",
                                            event.target.value
                                        )
                                    }
                                    placeholder="Enter handling executive's name"
                                />
                            </div>

                            {/* ROLE */}
                            <div className="grid gap-2">
                                <Label htmlFor="contact-role">
                                    Corporate Designation
                                    <span className="ml-1 text-destructive">
                                        *
                                    </span>
                                </Label>

                                <Input
                                    id="contact-role"
                                    list="company-role-options"
                                    type="text"
                                    required
                                    value={
                                        form.contact_role || ""
                                    }
                                    onChange={(event) =>
                                        updateField(
                                            "contact_role",
                                            event.target.value
                                        )
                                    }
                                    placeholder="Select or type role..."
                                />

                                <datalist id="company-role-options">
                                    {(state.professionalRoles ||
                                        []).map((role) => (
                                        <option
                                            key={role}
                                            value={role}
                                        />
                                    ))}
                                </datalist>
                            </div>
                        </div>

                        {/* PHONE */}
                        <div className="grid gap-2 md:max-w-md">
                            <Label htmlFor="contact-phone">
                                Direct Phone Number
                                <span className="ml-1 text-destructive">
                                    *
                                </span>
                            </Label>

                            <div className="relative">
                                <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                <Input
                                    id="contact-phone"
                                    type="tel"
                                    required
                                    value={
                                        form.contact_phone || ""
                                    }
                                    onChange={(event) =>
                                        updateField(
                                            "contact_phone",
                                            event.target.value
                                        )
                                    }
                                    placeholder="+91 9876543210"
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}