import { useNavigate } from 'react-router-dom';
import { LogOut, Flame } from 'lucide-react';
import { AccessStatusBadge } from './AccessStatusBadge';
import { StoreAccessStatus } from '../../types/store';

interface StoreHeaderProps {
  status: StoreAccessStatus;
  expiresAt?: string | null;
}

export function StoreHeader({ status, expiresAt }: StoreHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4 mb-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl text-gold-primary tracking-widest uppercase flex items-center gap-2">
            Store Mode <Flame size={20} className="text-danger" />
          </h1>
        </div>
        <button 
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-xl neumorphic-inset flex items-center justify-center text-text-muted hover:text-danger transition-colors"
        >
          <LogOut size={20} />
        </button>
      </div>
      <div className="flex items-center justify-between px-4 py-3 neumorphic-inset rounded-2xl">
        <span className="text-xs text-text-muted uppercase tracking-widest font-bold">Terminal Status</span>
        <AccessStatusBadge status={status} expiresAt={expiresAt} />
      </div>
    </div>
  );
}
