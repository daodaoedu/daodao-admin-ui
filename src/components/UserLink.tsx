import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface UserLinkProps {
  userId: string | number
  name: string
  photoURL?: string | null
  showAvatar?: boolean
  className?: string
}

export function UserLink({ userId, name, photoURL, showAvatar = true, className }: UserLinkProps) {
  return (
    <Link
      to={`/users/${userId}`}
      className={cn(
        'inline-flex items-center gap-2 hover:text-primary transition-colors group',
        className,
      )}
    >
      {showAvatar &&
        (photoURL ? (
          <img
            src={photoURL}
            alt={name}
            className="h-6 w-6 flex-shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
            {name.charAt(0)}
          </div>
        ))}
      <span className="truncate group-hover:underline underline-offset-2">{name}</span>
    </Link>
  )
}
