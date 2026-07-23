import * as React from "react";

import { cn } from "../../lib/utils";
import { textareaClasses } from "../../styles/ui/input";

const Textarea = ({ className, ...props }: React.ComponentProps<"textarea">) => {
  return <textarea className={cn(textareaClasses, className)} {...props} />;
};
Textarea.displayName = "Textarea";

export { Textarea };
