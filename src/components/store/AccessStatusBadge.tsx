import { Badge } from '../ui/Badge';
import { StoreAccessStatus } from '../../types/store';

interface AccessStatusBadgeProps {
  status: StoreAccessStatus;
  expiresAt?: string | null;
}

export function AccessStatusBadge({ status, expiresAt }: AccessStatusBadgeProps) {
  const isExpired = expiresAt && new Date(expiresAt) <= new Date();

  if (isExpired) {
    return <Badge variant="danger">EXPIRED</Badge>;
  }

  const variants: Record<StoreAccessStatus, "gold" | "neutral" | "danger"> = {
    approved: "gold",
    pending: "neutral",
    rejected: "danger",
  };

  return (
    <Badge variant={variants[status]}>
      {status.toUpperCase()}
    </Badge>
  );
}
