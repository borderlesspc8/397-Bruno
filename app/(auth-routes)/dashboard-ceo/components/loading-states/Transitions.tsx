'use client';

import React, { useEffect, useState } from 'react';

interface TransitionProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

/**
 * Componente de transição Fade In
 * Faz elementos aparecerem suavemente com opacidade
 */
export function FadeIn({ children, delay = 0, duration = 300, className = '' }: TransitionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-opacity ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Componente de transição Slide In
 * Faz elementos deslizarem para dentro da tela
 */
export function SlideIn({
  children,
  delay = 0,
  duration = 300,
  direction = 'up',
  className = '',
}: TransitionProps & { direction?: 'up' | 'down' | 'left' | 'right' }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const getTransform = () => {
    if (isVisible) return 'translate(0, 0)';
    
    switch (direction) {
      case 'up':
        return 'translate(0, 20px)';
      case 'down':
        return 'translate(0, -20px)';
      case 'left':
        return 'translate(20px, 0)';
      case 'right':
        return 'translate(-20px, 0)';
      default:
        return 'translate(0, 20px)';
    }
  };

  return (
    <div
      className={`transition-all ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Componente de transição Scale In
 * Faz elementos aparecerem com efeito de escala
 */
export function ScaleIn({ children, delay = 0, duration = 300, className = '' }: TransitionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-all ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.95)',
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Componente de transição em stagger
 * Faz múltiplos elementos aparecerem em sequência
 */
export function StaggeredChildren({
  children,
  staggerDelay = 100,
  className = '',
}: {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}) {
  const childArray = React.Children.toArray(children);

  return (
    <div className={className}>
      {childArray.map((child, index) => (
        <FadeIn key={index} delay={index * staggerDelay}>
          {child}
        </FadeIn>
      ))}
    </div>
  );
}

