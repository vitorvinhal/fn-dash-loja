import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <p className="text-6xl font-bold mb-2 text-accent">404</p>
        <p className="text-foreground font-medium mb-2">Página não encontrada</p>
        <p className="text-muted-foreground text-sm mb-6">
          A página que você procura não existe ou foi movida.
        </p>
        <Link
          href="/"
          className="text-accent text-sm underline underline-offset-4 hover:text-accent/80"
        >
          Voltar ao dashboard
        </Link>
      </div>
    </div>
  );
}