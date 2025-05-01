import React from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-destructive text-3xl mb-2">⚠️</div>
      <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-muted-foreground mb-4">{error.message || 'An unexpected error occurred while loading archives.'}</p>
      <button
        className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition"
        onClick={() => reset()}
      >
        Try Again
      </button>
    </div>
  );
} 