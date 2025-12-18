import { createFileRoute } from '@tanstack/react-router';

import { DashboardPreview } from '@/components/landing/dashboard-preview';
import { Features } from '@/components/landing/features';
import { Footer } from '@/components/landing/footer';
import { Hero } from '@/components/landing/hero';
import { Navbar } from '@/components/landing/navbar';

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
			</main>
			<Footer />
		</div>
	);
}
