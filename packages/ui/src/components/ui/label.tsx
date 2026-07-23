"use client";

import * as React from "react";
import { Field } from "@base-ui/react/field";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const labelVariants = cva(
  "text-sm font-medium leading-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70 data-[invalid]:text-error-600"
);

const fieldVariants = cva(
  "space-y-2 data-[disabled]:opacity-50"
);

const errorVariants = cva(
  "text-[0.8rem] font-medium text-error-600"
);

const descriptionVariants = cva(
  "text-[0.8rem] text-neutral-500"
);

type FieldRootProps = React.ComponentProps<typeof Field.Root> & 
  VariantProps<typeof fieldVariants>;

const FieldRoot = ({ className, ...props }: FieldRootProps) => (
  <Field.Root
    className={cn(fieldVariants(), className)}
    {...props}
  />
);
FieldRoot.displayName = "FieldRoot";

type LabelProps = React.ComponentProps<typeof Field.Label> & 
  VariantProps<typeof labelVariants>;

const Label = ({ className, ...props }: LabelProps) => (
  <Field.Label
    className={cn(labelVariants(), className)}
    {...props}
  />
);
Label.displayName = "Label";

type FieldControlProps = React.ComponentProps<typeof Field.Control>;

const FieldControl = ({ className, ...props }: FieldControlProps) => (
  <Field.Control
    className={cn(
      "flex h-9 w-full rounded border border-neutral-200 bg-white px-3 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 data-[invalid]:!border-error-500",
      className
    )}
    {...props}
  />
);
FieldControl.displayName = "FieldControl";

type FieldDescriptionProps = React.ComponentProps<typeof Field.Description> & 
  VariantProps<typeof descriptionVariants>;

const FieldDescription = ({ className, ...props }: FieldDescriptionProps) => (
  <Field.Description
    className={cn(descriptionVariants(), className)}
    {...props}
  />
);
FieldDescription.displayName = "FieldDescription";

type FieldErrorProps = React.ComponentProps<typeof Field.Error> & 
  VariantProps<typeof errorVariants>;

const FieldError = ({ className, ...props }: FieldErrorProps) => (
  <Field.Error
    className={cn(errorVariants(), className)}
    {...props}
  />
);
FieldError.displayName = "FieldError";

type FieldValidityProps = React.ComponentProps<typeof Field.Validity>;

const FieldValidity = ({ ...props }: FieldValidityProps) => (
  <Field.Validity {...props} />
);
FieldValidity.displayName = "FieldValidity";

// Compound component for easy use
const FormField = {
  Root: FieldRoot,
  Label,
  Control: FieldControl,
  Description: FieldDescription,
  Error: FieldError,
  Validity: FieldValidity,
};

export { 
  Label,
  FieldRoot,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldValidity,
  FormField
};