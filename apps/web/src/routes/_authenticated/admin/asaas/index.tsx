/**
 * Asaas Admin Route
 *
 * Dedicated admin page for Asaas synchronization management
 * with real-time metrics, sync controls, export, and monitoring.
 *
 * SECURITY: Admin role verification is done server-side through Convex auth.
 * Non-admin users will not be able to access admin data.
 */

import { createFileRoute } from '@tanstack/react-router';

import { AsaasAdminPageWrapper } from '@/components/admin/asaas/asaas-admin-page';

export const Route = createFileRoute('/_authenticated/admin/asaas/')({
	component: AsaasAdminRoute,
});

function AsaasAdminRoute() {
	return <AsaasAdminPageWrapper />;
}
