# Student Filters Hook

```typescript

import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

// Route definition (needs to match the one in the component if we import it,
// or we can just assume the types from the generic usage)
// Since we can't easily import the Route object if it's defined in the page file
// without circular deps if we aren't careful, let's just use the hook logic.
// Actually, the Route is defined in the file. We should probably keep the Route definition in the file
// but move the logic consuming it.

export function useStudentFilters(Route: any) {
	// Type 'any' for now or import properly
	const navigate = useNavigate();
	const { search, status, churnRisk, product, view, page } = Route.useSearch();

	useEffect(() => {
		const searchParams = new URLSearchParams(window.location.search);
		const hasAnyParam = searchParams.toString().length > 0;

		if (!hasAnyParam) {
			void navigate({
				to: '/students',
				search: {
					view: 'grid',
					page: 1,
					search: '',
					status: 'all',
					churnRisk: 'all',
					product: 'all',
				},
			});
		}
	}, [navigate]);

	const clearFilters = () => {
		void navigate({
			to: '/students',
			search: {
				view: 'grid',
				page: 1,
				search: '',
				status: 'all',
				churnRisk: 'all',
				product: 'all',
			},
		});
	};

	const handleFilterChange = (key: string, value: string) => {
		void navigate({
			to: '/students',
			search: { ...{ search, status, churnRisk, product, view, page }, [key]: value, page: 1 },
		});
	};

	return {
		search,
		status,
		churnRisk,
		product,
		view,
		page,
		clearFilters,
		handleFilterChange,
		navigate,
	};
}
```
