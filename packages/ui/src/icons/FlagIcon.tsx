import { cn } from "../lib/utils";
import React from "react";

const FlagIcon = (props: React.ComponentProps<"svg">) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      className={cn("size-3 fill-neutral-500", props.className)}
      viewBox="0 0 256 256"
    >
      <path d="M240,104,56,168V40Z" opacity="0.2"></path>
      <path d="M242.63,96.44l-184-64A8,8,0,0,0,48,40V216a8,8,0,0,0,16,0V173.69l178.63-62.13a8,8,0,0,0,0-15.12ZM64,156.75V51.25L215.65,104Z"></path>
    </svg>
  );
};

export default FlagIcon;
