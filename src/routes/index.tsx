import { createFileRoute } from '@tanstack/react-router';

import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { DashboardPreview } from '@/components/landing/dashboard-preview';
import { Features } from '@/components/landing/features';
import { Footer } from '@/components/landing/footer';

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
