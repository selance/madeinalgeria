import { cn } from "../lib/utils";
import React from "react";

const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 256 256" {...props} className={cn("size-3 fill-neutral-500",props.className)}>
      <path
        d="M216,56V200a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V56A16,16,0,0,1,56,40H200A16,16,0,0,1,216,56Z"
        opacity="0.2"
      ></path>
      <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
    </svg>
  );
};

export default PlusIcon;
