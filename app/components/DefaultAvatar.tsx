'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface DefaultAvatarProps {
  src?: string;
  alt?: string;
  size?: number;
  className?: string;
}

/**
 * Componente de avatar que exibe uma imagem padrão caso a imagem original não seja encontrada
 */
export default function DefaultAvatar({ src, alt = 'Avatar', size = 40, className = '' }: DefaultAvatarProps) {
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | undefined>(src);
  const defaultSrc = '/images/default-avatar.svg';
  
  // Atualizar src quando a prop mudar
  useEffect(() => {
    // Resetar o erro quando a fonte da imagem mudar
    setError(false);
    
    // Adicionar parâmetro de cache busting se for URL do vendedor
    if (src && src.includes('/uploads/vendedores/')) {
      const timestamp = Date.now();
      const newSrc = src.includes('?') 
        ? `${src}&t=${timestamp}` 
        : `${src}?t=${timestamp}`;
      setImageSrc(newSrc);
    } else {
      setImageSrc(src);
    }
  }, [src]);
  
  const handleError = () => {
    setError(true);
  };

  return (
    <div 
      className={`relative overflow-hidden rounded-full ${className}`} 
      style={{ width: size, height: size }}
    >
      <Image
        src={error || !imageSrc ? defaultSrc : imageSrc}
        alt={alt}
        width={size}
        height={size}
        className="object-cover"
        onError={handleError}
        priority
      />
    </div>
  );
} 