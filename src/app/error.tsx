"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro global capturado:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <p className="text-5xl font-bold mb-4 text-accent">Ops!</p>
        <p className="text-foreground font-medium mb-2">Algo deu errado</p>
        <p className="text-muted-foreground text-sm mb-6">
          Ocorreu um erro inesperado ao carregar esta página.
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl bg-secondary text-foreground hover:bg-secondary/70 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}