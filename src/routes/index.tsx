import { createFileRoute } from '@tanstack/react-router';

import { DashboardPreview } from '@/components/landing/dashboard-preview';
import { Features } from '@/components/landing/features';
import { Footer } from '@/components/landing/footer';
import { Hero } from '@/components/landing/hero';
import { Navbar } from '@/components/landing/navbar';
import { ScrollFloat } from '@/components/ui/scroll-float';

export const Route = createFileRoute('/')({
	component: LandingPage,
});

function LandingPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<Navbar />
			<main>
				<Hero />
				<DashboardPreview />
				<Features />
				<section className="container mx-auto py-24 text-center">
					<ScrollFloat
						textClassName="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/50"
						containerClassName="max-w-4xl mx-auto"
					>
						Veja seu negócio em tempo real
					</ScrollFloat>
					<ScrollFloat
						textClassName="text-xl md:text-2xl text-muted-foreground mt-6"
						containerClassName="max-w-3xl mx-auto mt-4"
					>
						Dashboard completo com métricas atualizadas e insights acionáveis para tomar decisões
						melhores.
					</ScrollFloat>
				</section>
			</main>
			<Footer />
		</div>
	);
}
