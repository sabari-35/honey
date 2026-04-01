import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: number;
  editable?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export function StarRating({ 
  rating, 
  max = 5, 
  size = 16, 
  editable = false, 
  onChange,
  className = ""
}: StarRatingProps) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={!editable}
          onClick={() => editable && onChange?.(star)}
          className={`transition-all duration-200 ${
            editable ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'
          }`}
        >
          <Star
            size={size}
            className={`${
              star <= rating 
                ? 'fill-gold-primary text-gold-primary' 
                : 'text-glass-border/30 fill-transparent'
            } transition-colors duration-300`}
          />
        </button>
      ))}
    </div>
  );
}
