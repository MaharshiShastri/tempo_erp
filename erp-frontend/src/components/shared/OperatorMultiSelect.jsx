import React, { useMemo, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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

export default function OperatorMultiSelect({
  users,
  selectedEmails,
  onChange,
}) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase();

    return users
      .filter((u) => {
        const name = u.name.toLowerCase();

        return (
          name.startsWith(query) ||
          name.includes(query)
        );
      })
      .sort((a, b) => {
        const query = search.toLowerCase();

        const aStarts = a.name
          .toLowerCase()
          .startsWith(query);

        const bStarts = b.name
          .toLowerCase()
          .startsWith(query);

        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        return a.name.localeCompare(b.name);
      });
  }, [users, search]);

  const toggleUser = (email) => {
    if (selectedEmails.includes(email)) {
      onChange(
        selectedEmails.filter(
          (selected) => selected !== email
        )
      );
    } else {
      onChange([...selectedEmails, email]);
    }
  };

  const removeUser = (email) => {
    onChange(
      selectedEmails.filter(
        (selected) => selected !== email
      )
    );
  };

  return (
    <Popover
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="h-auto min-h-10 w-full justify-between px-3 py-2"
        >
          <div className="flex flex-1 flex-wrap gap-1.5">
            {selectedEmails.length === 0 ? (
              <span className="text-sm text-muted-foreground">
                Search & Assign Operators...
              </span>
            ) : (
              selectedEmails.map((email) => {
                const user = users.find(
                  (u) => u.email === email
                );

                return (
                  <Badge
                    key={email}
                    variant="secondary"
                    className="gap-1"
                  >
                    {user ? user.name : email}

                    <span
                      role="button"
                      tabIndex={0}
                      className="cursor-pointer rounded-full hover:bg-destructive/10"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeUser(email);
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" ||
                          e.key === " "
                        ) {
                          e.preventDefault();
                          e.stopPropagation();
                          removeUser(email);
                        }
                      }}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                );
              })
            )}
          </div>

          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder="Search operators..."
            value={search}
            onValueChange={setSearch}
          />

          <CommandList>
            <CommandEmpty>
              No operators found.
            </CommandEmpty>

            <CommandGroup>
              {filteredUsers.map((user) => {
                const selected =
                  selectedEmails.includes(user.email);

                return (
                  <CommandItem
                    key={user.email}
                    value={`${user.name} ${user.email}`}
                    onSelect={() =>
                      toggleUser(user.email)
                    }
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        selected
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    />

                    <div className="flex flex-col">
                      <span className="font-medium">
                        {user.name}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        {user.role}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}