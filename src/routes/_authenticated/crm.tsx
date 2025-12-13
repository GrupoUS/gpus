import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/crm')({
	component: CRMPage,
});

function CRMPage() {
	return (
		<div className="space-y-6">
			<div className="animate-fade-in-up">
				<h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">CRM</h1>
				<p className="font-sans text-base text-muted-foreground">
					Gerencie seus relacionamentos com clientes
				</p>
			</div>
			
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{[
					{ title: "Leads Recentes", count: 47, color: "text-blue-500" },
					{ title: "Clientes Ativos", count: 23, color: "text-green-500" },
					{ title: "Oportunidades", count: 12, color: "text-purple-500" },
					{ title: "Tarefas", count: 8, color: "text-orange-500" },
					{ title: "Reuniões", count: 5, color: "text-pink-500" },
					{ title: "Documentos", count: 19, color: "text-indigo-500" }
				].map((item, index) => (
					<div key={item.title} className={`glass-card p-6 animate-fade-in-up delay-${(index + 1) * 100}`}>
						<h3 className={`font-display text-lg font-semibold ${item.color} mb-2`}>
							{item.title}
						</h3>
						<p className="font-display text-3xl font-bold text-foreground">
							{item.count}
						</p>
					</div>
				))}
			</div>
		</div>
	);
}
