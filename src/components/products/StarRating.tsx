import { useState } from 'react';
import { Star, StarHalf } from 'lucide-react';

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
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div 
      className={`flex items-center gap-1 ${className}`}
      onMouseLeave={() => setHoverRating(null)}
    >
      {stars.map((star) => {
        const isHalf = displayRating + 0.5 === star;
        const isFull = star <= displayRating;

        return (
          <button
            key={star}
            type="button"
            disabled={!editable}
            onClick={() => {
              if (editable) {
                // Submit the exact star index they are clicking, bypassing complex hover states
                onChange?.(star);
              }
            }}
            onMouseMove={() => {
              if (!editable) return;
              // Snap strictly to whole numbers to prevent UI drift and DB cast mutations
              setHoverRating(star);
            }}
            className={editable ? 'cursor-pointer active:scale-95' : 'cursor-default'}
          >
            <div className="relative">
              {/* Base empty star */}
              <Star
                size={size}
                className="text-glass-border/30 fill-transparent"
              />
              {/* Full filled star */}
              {isFull && (
                <Star
                  size={size}
                  className="fill-gold-primary text-gold-primary absolute top-0 left-0"
                />
              )}
              {/* Half filled star */}
              {isHalf && (
                <StarHalf
                  size={size}
                  className="fill-gold-primary text-gold-primary absolute top-0 left-0"
                />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
