import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function SearchableMultiselect({
  label,
  options = [],
  value = [],
  onChange,
  compact = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const normalizedOptions = useMemo(
    () => (options ?? []).filter(Boolean),
    [options]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return normalizedOptions;

    return normalizedOptions.filter((option) =>
      option.toLowerCase().includes(query)
    );
  }, [normalizedOptions, search]);

  const allSelected =
    normalizedOptions.length > 0 &&
    value.length === normalizedOptions.length;

  const toggleOption = (option) => {
    if (value.includes(option)) {
      onChange(value.filter((item) => item !== option));
    } else {
      onChange([...value, option]);
    }
  };

  const toggleAll = () => {
    onChange(allSelected ? [] : normalizedOptions);
  };

  return (
    <div className={cn(compact ? "w-auto" : "w-full")}>
      {!compact && (
        <Label className="mb-2 block">
          {label} ({normalizedOptions.length})
        </Label>
      )}

      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setSearch("");
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "justify-between",
              compact ? "h-9 text-xs" : "w-full",
            )}
          >
            <span className="truncate">
              {compact ? label : (
                value.length > 0
                  ? `${value.length} selected`
                  : `Select ${label}`
              )}
            </span>

            {compact && value.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 h-5 min-w-5 rounded-full px-1.5 text-[10px]"
              >
                {value.length}
              </Badge>
            )}

            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className={cn(
            "p-0",
            compact ? "w-[320px]" : "w-[320px]"
          )}
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={`Search ${label}`}
              value={search}
              onValueChange={setSearch}
            />

            <CommandList>
              <CommandEmpty>
                No {label.toLowerCase()} found.
              </CommandEmpty>

              <CommandGroup>
                <CommandItem
                  value="__select_all__"
                  onSelect={toggleAll}
                  className="cursor-pointer"
                >
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    className="mr-2"
                  />
                  <span>Select All</span>
                </CommandItem>

                {filtered.map((option) => {
                  const selected = value.includes(option);

                  return (
                    <CommandItem
                      key={option}
                      value={option}
                      onSelect={() => toggleOption(option)}
                      className="cursor-pointer"
                    >
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleOption(option)}
                        className="mr-2"
                      />

                      <span className="truncate">{option}</span>

                      {selected && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
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