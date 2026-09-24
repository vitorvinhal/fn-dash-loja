"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowDown, Package, ShoppingCart, Store, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function HeroPage() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, -50]);

  const features = [
    { icon: Package, title: "Controle de Estoque", description: "Gerencie seus produtos com alertas de estoque baixo, categorias e SKUs." },
    { icon: ShoppingCart, title: "Gestão de Vendas", description: "Registre vendas, acompanhe lucro real e analise por canal de venda." },
    { icon: Store, title: "Marketplace Integrado", description: "Visualize seus produtos como em uma loja online com links diretos." },
    { icon: TrendingUp, title: "Relatórios Avançados", description: "Gráficos de receita, margem por produto e análise por canal." },
  ];

  return (
    <div className="min-h-[200vh] bg-background">
      <div ref={ref} className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        <motion.div style={{ opacity, scale, y }} className="text-center px-6 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="w-20 h-20 rounded-2xl bg-foreground flex items-center justify-center mx-auto mb-8">
              <Package className="w-10 h-10 text-background" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-foreground mb-6 leading-tight">
              Controle Total da Sua{" "}
              <span className="text-muted-foreground">Loja</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10">
              Dashboard moderno para gerenciar estoque, vendas e marketplace.
              Controle completo com visual profissional e dados em tempo real.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/" className="px-8 py-3.5 bg-foreground text-background font-semibold rounded-xl hover:opacity-90 transition-opacity text-sm">
                Acessar Dashboard
              </Link>
              <Link href="/marketplace" className="px-8 py-3.5 bg-secondary hover:bg-accent text-foreground font-semibold rounded-xl border border-border transition-colors text-sm">
                Ver Produtos
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }} className="bg-card border border-border rounded-2xl p-5 text-left hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-3">
                  <f.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="text-foreground font-semibold text-sm mb-1">{f.title}</h3>
                <p className="text-muted-foreground text-xs">{f.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div style={{ opacity: useTransform(scrollYProgress, [0, 0.2], [1, 0]) }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <ArrowDown className="w-5 h-5 text-muted-foreground animate-bounce" />
        </motion.div>
      </div>
    </div>
  );
}
