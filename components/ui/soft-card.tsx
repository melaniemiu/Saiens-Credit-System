import * as React from "react"
import { cn } from "@/lib/utils"

const SoftCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex flex-col min-w-0 break-words bg-white shadow-soft-xl rounded-lg bg-clip-border",
      className
    )}
    {...props}
  />
))
SoftCard.displayName = "SoftCard"

const SoftCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-auto p-4", className)}
    {...props}
  />
))
SoftCardHeader.displayName = "SoftCardHeader"

const SoftCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn(
      "mb-0 font-bold text-slate-700",
      className
    )}
    {...props}
  />
))
SoftCardTitle.displayName = "SoftCardTitle"

const SoftCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "mb-0 font-sans font-semibold leading-normal text-size-sm text-slate-400",
      className
    )}
    {...props}
  />
))
SoftCardDescription.displayName = "SoftCardDescription"

const SoftCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 pt-0", className)} {...props} />
))
SoftCardContent.displayName = "SoftCardContent"

const SoftCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-3",
      className
    )}
    {...props}
  />
))
SoftCardFooter.displayName = "SoftCardFooter"

interface SoftCardIconProps extends React.HTMLAttributes<HTMLDivElement> {
  gradient?: string
}

const SoftCardIcon = React.forwardRef<
  HTMLDivElement,
  SoftCardIconProps
>(({ className, gradient = "bg-gradient-fuchsia", children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-block w-12 h-12 text-center rounded-lg",
      gradient,
      className
    )}
    {...props}
  >
    <div className="flex items-center justify-center h-full text-white">
      {children}
    </div>
  </div>
))
SoftCardIcon.displayName = "SoftCardIcon"

export {
  SoftCard,
  SoftCardHeader,
  SoftCardFooter,
  SoftCardTitle,
  SoftCardDescription,
  SoftCardContent,
  SoftCardIcon,
}
