import * as React from "react";
import { cn } from "../../lib/utils";
import { Separator } from "../../components/ui/separator";
import { Badge } from "../../components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "../../components/ui/command";
import { LuCheck, LuX } from "react-icons/lu";

interface MultiSelectProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  onValueChange: (value: string[]) => void;
  defaultValue?: string[];
  placeholder?: string;
  animation?: number;
  maxCount?: number;
  modalPopover?: boolean;
  asChild?: boolean;
  className?: string;
  ref?: React.Ref<HTMLButtonElement>;
}

export const MultiSelect = ({
  options,
  onValueChange,
  defaultValue = [],
  placeholder = "Select options",
  maxCount = 3,
  modalPopover = false,
  ref,
}: MultiSelectProps) => {
  const [selectedValues, setSelectedValues] = React.useState<string[]>(defaultValue);
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      setIsPopoverOpen(true);
    } else if (event.key === "Backspace" && !event.currentTarget.value) {
      const newSelectedValues = [...selectedValues];
      newSelectedValues.pop();
      setSelectedValues(newSelectedValues);
      onValueChange(newSelectedValues);
    }
  };

  const toggleOption = (option: string) => {
    const newSelectedValues = selectedValues.includes(option)
      ? selectedValues.filter((value) => value !== option)
      : [...selectedValues, option];
    setSelectedValues(newSelectedValues);
    onValueChange(newSelectedValues);
  };

  const handleClear = () => {
    setSelectedValues([]);
    onValueChange([]);
  };

  const handleTogglePopover = () => {
    setIsPopoverOpen((prev) => !prev);
  };

  const clearExtraOptions = () => {
    const newSelectedValues = selectedValues.slice(0, maxCount);
    setSelectedValues(newSelectedValues);
    onValueChange(newSelectedValues);
  };

  const toggleAll = () => {
    if (selectedValues.length === options.length) {
      handleClear();
    } else {
      const allValues = options.map((option) => option.value);
      setSelectedValues(allValues);
      onValueChange(allValues);
    }
  };

  return (
    <>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen} modal={modalPopover}>
        <PopoverTrigger ref={ref} onClick={handleTogglePopover} className="!w-full">
          {selectedValues.length > 0 ? `اخترت ${selectedValues.length} ولاية` : placeholder}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Command className="rounded-none sm:rounded-card">
            <CommandInput className="rounded-none" placeholder="ابحث..." onKeyDown={handleInputKeyDown} />
            <CommandList>
              <CommandEmpty>لا توجد نتائج</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  key="all"
                  onSelect={toggleAll}
                  className={cn(
                    "cursor-pointer",
                    selectedValues.length === options.length &&
                      "bg-primary-50 text-primary-700 hover:bg-primary-50 hover:text-primary-700",
                  )}
                >
                  <div
                    className={cn(
                      "ml-2 flex h-4 w-4 items-center justify-center rounded border",
                      selectedValues.length === options.length
                        ? "border-primary-500 bg-primary-500 text-neutral-50"
                        : "border-neutral-300 bg-white opacity-50 [&_svg]:invisible",
                    )}
                  >
                    <LuCheck className="h-4 w-4" />
                  </div>
                  <span>(اختر الكل)</span>
                </CommandItem>
                {options.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => toggleOption(option.value)}
                      className={cn(
                        "cursor-pointer",
                        isSelected &&
                          "bg-primary-50 text-primary-700 hover:bg-primary-50 hover:text-primary-700",
                      )}
                    >
                      <div
                        className={cn(
                          "ml-2 flex h-4 w-4 items-center justify-center rounded border",
                          isSelected
                            ? "border-primary-500 bg-primary-500 text-neutral-50"
                            : "border-neutral-300 bg-white opacity-50 [&_svg]:invisible",
                        )}
                      >
                        <LuCheck className="h-4 w-4" />
                      </div>
                      {option.icon && <option.icon className="mr-2 h-4 w-4" />}
                      <span>{option.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <div className="flex items-center justify-between">
                  {selectedValues.length > 0 && (
                    <>
                      <CommandItem
                        onSelect={handleClear}
                        className="flex-1 cursor-pointer items-center justify-center rounded-l rounded-br p-0"
                      >
                        أفرغ
                      </CommandItem>
                      <Separator orientation="vertical" className="flex h-full min-h-6" />
                    </>
                  )}
                  <CommandItem
                    onSelect={() => setIsPopoverOpen(false)}
                    className={cn(
                      "max-w-full flex-1 cursor-pointer items-center justify-center rounded-b p-0",
                      selectedValues.length > 0 && "!rounded-r",
                    )}
                  >
                    أغلق
                  </CommandItem>
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedValues.length > 0 ? (
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-wrap items-center gap-1">
            {selectedValues.slice(0, maxCount).map((value) => {
              const option = options.find((o) => o.value === value);
              const IconComponent = option?.icon;
              return (
                <Badge key={value}>
                  {IconComponent && <IconComponent className="mr-2 h-4 w-4" />}
                  {option?.label}
                  <LuX
                    className="mr-2 h-3 w-3 cursor-pointer"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleOption(value);
                    }}
                  />
                </Badge>
              );
            })}
            {selectedValues.length > maxCount && (
              <Badge variant={"primary"}>
                {`أكثر من ${selectedValues.length - maxCount}`}
                <LuX
                  className="mr-2 h-3 w-3 cursor-pointer"
                  onClick={(event) => {
                    event.stopPropagation();
                    clearExtraOptions();
                  }}
                />
              </Badge>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
};

MultiSelect.displayName = "MultiSelect";
