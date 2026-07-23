import * as React from "react";
import { Input as BaseInput } from "@base-ui/react/input";

import { cn } from "../../lib/utils";
import { inputClasses } from "../../styles/ui/input";

type InputProps = Omit<React.ComponentProps<typeof BaseInput>, "onChange"> & {
  /** Standard React handler — synthesized from Base UI's onValueChange. */
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
};

const Input = ({ className, onChange, onValueChange, name, ...props }: InputProps) => {
  return (
    <BaseInput
      className={cn(inputClasses, className)}
      name={name}
      {...props}
      onValueChange={(value, eventDetails) => {
        onValueChange?.(value, eventDetails);
        // react-hook-form `register` compatibility: Base UI's Field.Control
        // owns the native change event internally, so event-based consumers
        // receive a synthesized change carrying target.name/value instead.
        onChange?.({
          target: { name: name ?? "", value },
          type: "change",
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      }}
    />
  );
};
Input.displayName = "Input";

export { Input };
