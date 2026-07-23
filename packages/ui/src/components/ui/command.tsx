"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import type { Dialog as DialogType } from "@base-ui/react/dialog";
import { cn } from "../../lib/utils";
import { Dialog, DialogPopup } from "../../components/ui/dialog";
import { LuSearch } from "react-icons/lu";

type CommandProps = React.ComponentProps<typeof CommandPrimitive>;

const Command = ({ className, ...props }: CommandProps) => (
  <CommandPrimitive
    className={cn(
      "bg-white text-neutral-700 flex h-full w-full flex-col overflow-hidden rounded-card",
      className,
    )}
    {...props}
  />
);
Command.displayName = CommandPrimitive.displayName;

const CommandDialog = ({ children, ...props }: { children: React.ReactNode } & DialogType.Root.Props) => {
  return (
    <Dialog {...props}>
      <DialogPopup className="overflow-hidden p-0">
        <Command className="[&_[cmdk-group-heading]]:text-neutral-500 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogPopup>
    </Dialog>
  );
};

type CommandInputProps = React.ComponentProps<typeof CommandPrimitive.Input>;

const CommandInput = ({ className, ...props }: CommandInputProps) => (
  <div className="flex items-center border-b border-neutral-200 px-3" cmdk-input-wrapper="">
    <LuSearch className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      className={cn(
        "flex h-10 w-full rounded bg-transparent py-3 text-sm outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  </div>
);

CommandInput.displayName = CommandPrimitive.Input.displayName;

type CommandListProps = React.ComponentProps<typeof CommandPrimitive.List>;

const CommandList = ({ className, ...props }: CommandListProps) => (
  <CommandPrimitive.List className={cn("max-h-[300px] overflow-x-hidden overflow-y-auto", className)} {...props} />
);

CommandList.displayName = CommandPrimitive.List.displayName;

type CommandEmptyProps = React.ComponentProps<typeof CommandPrimitive.Empty>;

const CommandEmpty = (props: CommandEmptyProps) => (
  <CommandPrimitive.Empty className="py-6 text-center text-sm" {...props} />
);

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

type CommandGroupProps = React.ComponentProps<typeof CommandPrimitive.Group>;

const CommandGroup = ({ className, ...props }: CommandGroupProps) => (
  <CommandPrimitive.Group
    className={cn(
      "text-neutral-700 [&_[cmdk-group-heading]]:text-neutral-500 overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium",
      className,
    )}
    {...props}
  />
);

CommandGroup.displayName = CommandPrimitive.Group.displayName;

type CommandSeparatorProps = React.ComponentProps<typeof CommandPrimitive.Separator>;

const CommandSeparator = ({ className, ...props }: CommandSeparatorProps) => (
  <CommandPrimitive.Separator className={cn("-mx-1 h-px bg-neutral-200", className)} {...props} />
);
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

type CommandItemProps = React.ComponentProps<typeof CommandPrimitive.Item>;

const CommandItem = ({ className, ...props }: CommandItemProps) => (
  <CommandPrimitive.Item
    className={cn(
      "relative flex h-9 w-full cursor-default items-center rounded py-1.5 pr-2 pl-8 text-sm text-neutral-600 outline-none select-none hover:bg-neutral-100 hover:text-neutral-800",
      className,
    )}
    {...props}
  />
);

CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return <span className={cn("text-neutral-400 ml-auto text-xs tracking-widest", className)} {...props} />;
};
CommandShortcut.displayName = "CommandShortcut";

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
