"use client";

import * as React from "react";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { Radio } from "@base-ui/react/radio";
import { LuCircle } from "react-icons/lu";

import { cn } from "../../lib/utils";

type RadioGroupProps = React.ComponentProps<typeof RadioGroupPrimitive>

const RadioGroup = ({ className, ...props }: RadioGroupProps) => {
  return (
    <RadioGroupPrimitive
      className={cn("grid gap-2", className)}
      {...props}
    />
  );
};
RadioGroup.displayName = "RadioGroup";

type RadioGroupItemProps = React.ComponentProps<typeof Radio.Root>

const RadioGroupItem = ({ className, ...props }: RadioGroupItemProps) => {
  return (
    <Radio.Root
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-neutral-300 bg-white text-primary-500 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:border-primary-500 data-[checked]:bg-primary-500 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <Radio.Indicator className="flex items-center justify-center">
        <LuCircle className="h-2 w-2 fill-current text-neutral-50" />
      </Radio.Indicator>
    </Radio.Root>
  );
};
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };