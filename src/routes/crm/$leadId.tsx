import { createFileRoute } from '@tanstack/react-router';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/crm/$leadId')({
	component: LeadDetailPage,
});

function LeadDetailPage() {
	const { leadId } = Route.useParams();

	return (
		<div className="container mx-auto py-6">
			<Card>
				<CardHeader>
					<CardTitle>Lead Detail</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<p>
							<strong>Lead ID:</strong> {leadId}
						</p>
						<p className="text-muted-foreground">
							This is a placeholder implementation. In a real application, this page would fetch and
							display detailed information for the lead with ID: {leadId}.
						</p>
						<div className="bg-muted p-4 rounded-md">
							<h3 className="font-semibold mb-2">Implementation Notes:</h3>
							<ul className="list-disc list-inside space-y-1 text-sm">
								<li>
									Fetch lead data using Convex: <code>api.leads.getById({leadId})</code>
								</li>
								<li>Display lead information in a structured format</li>
								<li>Add edit functionality for updating lead details</li>
								<li>Include activity history and communication log</li>
								<li>Add navigation back to CRM list</li>
							</ul>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
