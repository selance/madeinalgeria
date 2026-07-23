import { cn } from "../lib/utils";
import React from "react";

const SidebarIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      className={cn("size-3 fill-neutral-500", props.className)}
      viewBox="0 0 256 256"
    >
      <path d="M88,48V208H40a8,8,0,0,1-8-8V56a8,8,0,0,1,8-8Z" opacity="0.2"></path>
      <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,56H80V200H40ZM216,200H96V56H216V200Z"></path>
    </svg>
  );
};

export default SidebarIcon;
