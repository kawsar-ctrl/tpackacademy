import React, { useState } from 'react';
import { Leaf } from 'lucide-react';

interface EcoImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export const EcoImage: React.FC<EcoImageProps> = ({
  src,
  alt,
  className = '',
  fallbackLabel
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#E6EFE9] via-[#D8E7DD] to-[#C8DDD0] text-[#166534] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Leaf className="w-10 h-10 mb-2 opacity-75" aria-hidden="true" />
        <span className="text-sm font-medium text-[#132219]">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
