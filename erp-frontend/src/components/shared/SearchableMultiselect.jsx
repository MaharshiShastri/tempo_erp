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
}) {
  const [open, setOpen] = useState(false);

  const selected = value || [];

  const toggleOption = (option) => {
    if (selected.includes(option)) {
      onChange(
        selected.filter((item) => item !== option)
      );
    } else {
      onChange([...selected, option]);
    }
  };

  const buttonText = useMemo(() => {
    if (!selected.length) {
      return `Select ${label.toLowerCase()}...`;
    }

    if (selected.length === 1) {
      return selected[0];
    }

    return `${selected.length} selected`;
  }, [selected, label]);

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>

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
              placeholder={`Search ${label.toLowerCase()}...`}
            />

            <CommandList>
              <CommandEmpty>
                No {label.toLowerCase()} found.
              </CommandEmpty>

              <CommandGroup>
                {options.map((option) => {
                  const isSelected =
                    selected.includes(option);

                  return (
                    <CommandItem
                      key={option}
                      value={option}
                      onSelect={() =>
                        toggleOption(option)
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

                      {option}
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