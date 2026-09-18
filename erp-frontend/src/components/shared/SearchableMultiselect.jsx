import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import { Label } from "@/components/ui/label";

export default function SearchableMultiSelect({
    label,
    options = [],
    value = [],
    onChange,
    single = false,
}) {
    const [open, setOpen] = useState(false);

    const selected = value || [];

    // Support both:
    // ["ABC", "DEF"]
    // and:
    // [{ value: "ABC", label: "ABC - Item" }]
    const normalizedOptions = useMemo(() => {
        return options.map((option) => {
            if (typeof option === "string") {
                return {
                    value: option,
                    label: option,
                };
            }

            return {
                value: option.value,
                label: option.label ?? option.value,
            };
        });
    }, [options]);

    const toggleOption = (optionValue) => {
        if (single) {
            if (selected.includes(optionValue)) {
                onChange([]);
            } else {
                onChange([optionValue]);
            }

            setOpen(false);
            return;
        }

        if (selected.includes(optionValue)) {
            onChange(
                selected.filter((item) => item !== optionValue)
            );
        } else {
            onChange([
                ...selected,
                optionValue,
            ]);
        }
    };

    const buttonText = useMemo(() => {
        if (!selected.length) {
            return `Select ${label?.toLowerCase() || "item"}...`;
        }

        const firstSelected = normalizedOptions.find(
            (option) => option.value === selected[0]
        );

        if (single) {
            return firstSelected?.label || selected[0];
        }

        if (selected.length === 1) {
            return firstSelected?.label || selected[0];
        }

        return `${selected.length} selected`;
    }, [selected, normalizedOptions, label, single]);

    return (
        <div className="grid gap-2">
            {label && <Label>{label}</Label>}

            <Popover
                open={open}
                onOpenChange={setOpen}
            >
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between font-normal"
                    >
                        <span className="truncate">
                            {buttonText}
                        </span>

                        <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>

                <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0"
                    align="start"
                >
                    <Command>
                        <CommandInput
                            placeholder={`Search ${
                                label?.toLowerCase() || "item"
                            }...`}
                        />

                        <CommandList>
                            <CommandEmpty>
                                No {label?.toLowerCase() || "item"} found.
                            </CommandEmpty>

                            <CommandGroup>
                                {normalizedOptions.map((option) => {
                                    const isSelected =
                                        selected.includes(option.value);

                                    return (
                                        <CommandItem
                                            key={option.value}
                                            value={option.label}
                                            onSelect={() =>
                                                toggleOption(option.value)
                                            }
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 size-4",
                                                    isSelected
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                )}
                                            />

                                            {option.label}
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}