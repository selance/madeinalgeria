import { cn } from "../lib/utils";
import React from "react";

const ChartBarIcon = (props: React.ComponentProps<"svg">) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      className={cn("size-3 fill-neutral-500", props.className)}
      viewBox="0 0 256 256"
    >
      <path d="M224,208H32V48a8,8,0,0,1,8-8H216a8,8,0,0,1,8,8Z" opacity="0.2"></path>
      <path d="M224,200h-8V40a8,8,0,0,0-8-8H160a8,8,0,0,0-8,8V80H112a8,8,0,0,0-8,8v40H64a8,8,0,0,0-8,8v56H32V48a8,8,0,0,0-16,0V208a8,8,0,0,0,8,8H224a8,8,0,0,0,0-16ZM168,48h32V200H168Zm-48,48h32V200H120ZM72,144h32v56H72Z"></path>
    </svg>
  );
};

export default ChartBarIcon;
