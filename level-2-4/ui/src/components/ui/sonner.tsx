import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckCircleIcon, InfoIcon, WarningIcon, XCircleIcon, CircleNotch } from "@phosphor-icons/react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      richColors
      closeButton
      icons={{
        success: (
          <CheckCircleIcon weight="fill" className="size-4" />
        ),
        info: (
          <InfoIcon weight="fill" className="size-4" />
        ),
        warning: (
          <WarningIcon weight="fill" className="size-4" />
        ),
        error: (
          <XCircleIcon weight="fill" className="size-4" />
        ),
        loading: (
          <CircleNotch className="size-4 animate-spin" />
        ),
      }}
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl group-[.toaster]:px-4 group-[.toaster]:py-3",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-[10px] font-medium",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:text-emerald-500 group-[.toaster]:bg-emerald-500/10 group-[.toaster]:border-emerald-500/20",
          error: "group-[.toaster]:text-destructive group-[.toaster]:bg-destructive/10 group-[.toaster]:border-destructive/20",
          info: "group-[.toaster]:text-primary group-[.toaster]:bg-primary/10 group-[.toaster]:border-primary/20",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
