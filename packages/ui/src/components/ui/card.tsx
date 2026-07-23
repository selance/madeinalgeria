import * as React from "react";
import { cn } from "../../lib/utils";

const Card = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("rounded-card border border-neutral-200 bg-white drop-shadow-default p-4", className)} {...props} />
);
Card.displayName = "Card";

const ChatBoxCard = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("rounded-card drop-shadow-default chat-box-border-gradient p-[1px]")}>
    <div className={cn("chat-box-gradient w-full h-full p-4 rounded-card", className)} {...props}>
      {props.children}
    </div>
  </div>
);

const SpecialBoxCard = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("rounded-card drop-shadow-default special-box-border-gradient p-[1px]")}>
    <div className={cn("special-box-gradient w-full h-full p-4 rounded-card", className)} {...props}>
      {props.children}
    </div>
  </div>
);

const CardHeader = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
);
CardHeader.displayName = "CardHeader";

const CardTitle = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("leading-none font-semibold tracking-tight", className)} {...props} />
);
CardTitle.displayName = "CardTitle";

const CardDescription = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("text-neutral-500 text-sm", className)} {...props} />
);
CardDescription.displayName = "CardDescription";

const CardContent = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("p-6 pt-0", className)} {...props} />
);
CardContent.displayName = "CardContent";

const CardFooter = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, ChatBoxCard, SpecialBoxCard };
