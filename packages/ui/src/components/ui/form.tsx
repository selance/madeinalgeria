"use client";

import * as React from "react";
import { Field } from "@base-ui/react/field";
import { Fieldset } from "@base-ui/react/fieldset";
import { Input } from "@base-ui/react/input";
import { Controller, ControllerProps, FormProvider, useFormContext } from "react-hook-form";
import type { FieldPath, FieldValues } from "react-hook-form";

import { cn } from "../../lib/utils";

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  return {
    name: fieldContext.name,
    ...fieldState,
  };
};

type FormFieldsetProps = React.ComponentProps<typeof Fieldset.Root>;

const FormFieldset = ({ className, ...props }: FormFieldsetProps) => (
  <Fieldset.Root className={cn("space-y-4", className)} {...props} />
);
FormFieldset.displayName = "FormFieldset";

type FormLegendProps = React.ComponentProps<typeof Fieldset.Legend>;

const FormLegend = ({ className, ...props }: FormLegendProps) => (
  <Fieldset.Legend className={cn("text-lg leading-none font-semibold tracking-tight", className)} {...props} />
);
FormLegend.displayName = "FormLegend";

type FormItemProps = React.ComponentProps<typeof Field.Root>;

const FormItem = ({ className, ...props }: FormItemProps) => {
  const { name } = useFormField();
  return <Field.Root name={name} className={cn("space-y-2", className)} {...props} />;
};
FormItem.displayName = "FormItem";

type FormLabelProps = React.ComponentProps<typeof Field.Label>;

const FormLabel = ({ className, ...props }: FormLabelProps) => {
  const { error } = useFormField();

  return <Field.Label className={cn(error && "text-error-600", className)} {...props} />;
};
FormLabel.displayName = "FormLabel";

type FormControlProps = React.ComponentProps<typeof Input>;

const FormControl = ({ className, ...props }: FormControlProps) => {
  const { error } = useFormField();

  return (
    <Input
      className={cn(
        "flex h-9 w-full rounded border border-neutral-200 bg-white px-3 py-1 text-sm placeholder:text-neutral-400 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus:outline-none focus:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-50",
        error && "!border-error-500",
        className,
      )}
      {...props}
    />
  );
};
FormControl.displayName = "FormControl";

type FormDescriptionProps = React.ComponentProps<typeof Field.Description>;

const FormDescription = ({ className, ...props }: FormDescriptionProps) => (
  <Field.Description className={cn("text-neutral-500 text-[0.8rem]", className)} {...props} />
);
FormDescription.displayName = "FormDescription";

type FormMessageProps = React.ComponentProps<typeof Field.Error>;

const FormMessage = ({ className, children, ...props }: FormMessageProps) => {
  const { error } = useFormField();
  const body = error ? String(error?.message) : children;

  if (!body) {
    return null;
  }

  return (
    <Field.Error className={cn("text-error-600 text-[0.8rem] font-medium", className)} {...props}>
      {body}
    </Field.Error>
  );
};
FormMessage.displayName = "FormMessage";

export {
  useFormField,
  Form,
  FormFieldset,
  FormLegend,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
