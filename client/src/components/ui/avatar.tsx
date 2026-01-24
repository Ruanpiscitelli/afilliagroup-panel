import * as React from "react"
import { cn } from "@/lib/utils"

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    src?: string
    alt?: string
    fallback?: string
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
    ({ className, src, alt, fallback, ...props }, ref) => {
        const [hasError, setHasError] = React.useState(false)

        return (
            <div
                ref={ref}
                className={cn(
                    "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100",
                    className
                )}
                {...props}
            >
                {src && !hasError ? (
                    <img
                        src={src}
                        alt={alt}
                        className="aspect-square h-full w-full object-cover"
                        onError={() => setHasError(true)}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-200 text-sm font-medium text-slate-600">
                        {fallback || alt?.charAt(0).toUpperCase() || "?"}
                    </div>
                )}
            </div>
        )
    }
)
Avatar.displayName = "Avatar"

export { Avatar }
