import * as React from "react";

interface AlertProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "destructive";
}

interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function Alert({
  children,
  className = "",
  variant = "default",
}: AlertProps) {
  const variantStyles = {
    default: "bg-blue-50 border-blue-200 text-blue-900",
    destructive: "bg-red-50 border-red-200 text-red-900",
  };

  return (
    <div
      className={`relative w-full rounded-lg border p-4 ${variantStyles[variant]} ${className}`}
    >
      {children}
    </div>
  );
}

export function AlertDescription({
  children,
  className = "",
}: AlertDescriptionProps) {
  return <div className={`text-sm ${className}`}>{children}</div>;
}
