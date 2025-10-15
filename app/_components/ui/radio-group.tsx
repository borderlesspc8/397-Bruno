"use client"

import * as React from "react"
import { Circle } from "lucide-react"

import { cn } from "@/app/_lib/utils"

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
}

const RadioGroup = React.forwardRef<
  HTMLDivElement,
  RadioGroupProps
>(({ className, children, value, onValueChange, ...props }, ref) => {
  return (
    <div
      className={cn("flex flex-col gap-2", className)}
      ref={ref}
      role="radiogroup"
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        
        return React.cloneElement(child, {
          ...child.props,
          isSelected: child.props.value === value,
          onChange: () => onValueChange?.(child.props.value)
        });
      })}
    </div>
  )
})
RadioGroup.displayName = "RadioGroup"

interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isSelected?: boolean;
  label?: string;
  description?: string;
}

const RadioGroupItem = React.forwardRef<
  HTMLInputElement,
  RadioGroupItemProps
>(({ className, isSelected, label, description, onChange, children, ...props }, ref) => {
  return (
    <label
      className={cn(
        "flex items-start space-x-3 rounded-md border p-3 cursor-pointer hover:border-primary",
        isSelected ? "border-primary bg-primary/5" : "border-muted",
        className
      )}
    >
      <input
        type="radio"
        className="sr-only"
        ref={ref}
        checked={isSelected}
        onChange={onChange}
        {...props}
      />
      <Circle
        className={cn(
          "h-5 w-5 mt-0.5 text-muted-foreground",
          isSelected ? "text-primary fill-primary" : ""
        )}
      />
      <div className="space-y-1">
        {label && <div className="font-medium">{label}</div>}
        {description && <div className="text-sm text-muted-foreground">{description}</div>}
        {children}
      </div>
    </label>
  )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem } 
