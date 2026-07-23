import { cn } from "../lib/utils";
import React from "react";

const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" {...props} className={cn("size-3 text-neutral-500 fill-neutral-500", props.className)} viewBox="0 0 256 256">
      <path
        d="M232,56V200a16,16,0,0,1-16,16H40a16,16,0,0,1-16-16V56A16,16,0,0,1,40,40H216A16,16,0,0,1,232,56Z"
        opacity="0.2"
      ></path>
      <path d="M205.66,85.66l-96,96a8,8,0,0,1-11.32,0l-40-40a8,8,0,0,1,11.32-11.32L104,164.69l90.34-90.35a8,8,0,0,1,11.32,11.32Z"></path>
    </svg>
  );
};

export default CheckIcon;
