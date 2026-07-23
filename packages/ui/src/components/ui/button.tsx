import * as React from "react";
import { Slot } from "radix-ui";
import { type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";
import { buttonVariants } from "../../styles/ui/buttons";

export type ButtonProps = React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & {
  asChild?: boolean;
}

const Button = ({ className, variant, size, asChild = false, ...props }: ButtonProps) => {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
};
Button.displayName = "Button";

export { Button };
