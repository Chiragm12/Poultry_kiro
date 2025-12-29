import { Egg } from "lucide-react"

interface LogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
}

export default function Logo({ className = "", showText = true, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl"
  }

  return (
    <div className={`flex items-center ${className}`}>
      <Egg className={`${sizeClasses[size]} text-blue-600`} />
      {showText && (
        <span className={`ml-2 ${textSizeClasses[size]} font-bold text-gray-900`}>
          PoultryPro
        </span>
      )}
    </div>
  )
}