// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useStudentsViewModel } from './use-students-view-model';

// Mocks
const mockUseNavigate = vi.fn();
const mockStudentsData = { data: [] as Record<string, unknown>[] };

vi.mock('@tanstack/react-router', () => ({
	useNavigate: () => mockUseNavigate,
}));

vi.mock('@clerk/clerk-react', () => ({
	useAuth: () => ({ isSignedIn: true, userId: 'test-user' }),
}));

vi.mock('../lib/trpc', () => ({
	trpc: {
		students: {
			list: {
				useQuery: (_args: unknown, _opts: unknown) => ({
					data: mockStudentsData,
					isLoading: false,
				}),
			},
		},
	},
}));

describe('useStudentsViewModel', () => {
	const mockRoute = {
		useSearch: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		// Default search params
		mockRoute.useSearch.mockReturnValue({
			page: 1,
			view: 'grid',
			search: '',
			status: 'all',
			churnRisk: 'all',
			product: 'all',
		});
		// Mock window.location.search
		Object.defineProperty(window, 'location', {
			value: {
				search: '?view=grid&page=1',
			},
			writable: true,
		});
	});

	it('should return empty data when no students loaded', () => {
		mockStudentsData.data = [];

		const { result } = renderHook(() => useStudentsViewModel(mockRoute));

		expect(result.current.students).toEqual([]);
		expect(result.current.groupedStudents).toEqual({});
		expect(result.current.totalStudents).toBe(0);
		expect(result.current.paginatedStudents).toHaveLength(0);
	});

	it('should compute stats correctly from student data', () => {
		mockStudentsData.data = [
			{ id: 1, name: 'Student A', status: 'ativo', churnRisk: 'baixo' },
			{ id: 2, name: 'Student B', status: 'ativo', churnRisk: 'alto' },
			{ id: 3, name: 'Student C', status: 'ativo', churnRisk: 'baixo' },
			{ id: 4, name: 'Student D', status: 'inativo', churnRisk: 'baixo' },
		];

		const { result } = renderHook(() => useStudentsViewModel(mockRoute));

		expect(result.current.totalStudents).toBe(4);
		expect(result.current.activeStudents).toBe(3);
		expect(result.current.highRiskStudents).toBe(1);
	});

	it('should paginate students correctly', () => {
		mockStudentsData.data = Array.from({ length: 15 }, (_, i) => ({
			id: i + 1,
			name: `Student ${i}`,
			status: 'ativo',
			churnRisk: 'baixo',
		}));

		mockRoute.useSearch.mockReturnValue({
			page: 1,
			view: 'grid',
			search: '',
			status: 'all',
			churnRisk: 'all',
			product: 'all',
		});

		const { result } = renderHook(() => useStudentsViewModel(mockRoute));

		// PAGE_SIZE is 12
		expect(result.current.paginatedStudents).toHaveLength(12);
		expect(result.current.totalPages).toBe(2);
	});

	it('should handle filter changes correctly', () => {
		const { result } = renderHook(() => useStudentsViewModel(mockRoute));

		act(() => {
			result.current.handleFilterChange('status', 'ativo');
		});

		expect(mockUseNavigate).toHaveBeenCalledWith({
			to: '/students',
			search: expect.objectContaining({
				status: 'ativo',
				page: 1,
			}),
		});
	});

	it('should clear filters correctly', () => {
		const { result } = renderHook(() => useStudentsViewModel(mockRoute));

		act(() => {
			result.current.clearFilters();
		});

		expect(mockUseNavigate).toHaveBeenCalledWith({
			to: '/students',
			search: {
				view: 'grid',
				page: 1,
				search: '',
				status: 'all',
				churnRisk: 'all',
				product: 'all',
				studentId: undefined,
			},
		});
	});

	it('should navigate to student correctly', () => {
		const { result } = renderHook(() => useStudentsViewModel(mockRoute));

		act(() => {
			result.current.navigateToStudent(123);
		});

		expect(mockUseNavigate).toHaveBeenCalledWith({
			to: '/students/$studentId',
			params: { studentId: '123' },
			search: expect.objectContaining({
				view: 'grid',
			}),
		});
	});

	it('should toggle sections correctly', () => {
		const { result } = renderHook(() => useStudentsViewModel(mockRoute));

		// Initial state: all true
		expect(result.current.expandedSections.trintae3).toBe(true);

		// Toggle trintae3
		act(() => {
			result.current.toggleSection('trintae3');
		});
		expect(result.current.expandedSections.trintae3).toBe(false);

		// Collapse all
		act(() => {
			result.current.collapseAll();
		});
		expect(result.current.expandedSections.trintae3).toBe(false);
		expect(result.current.expandedSections.otb).toBe(false);

		// Expand all
		act(() => {
			result.current.expandAll();
		});
		expect(result.current.expandedSections.trintae3).toBe(true);
		expect(result.current.expandedSections.otb).toBe(true);
	});

	it('should redirect to default params if none are present', () => {
		Object.defineProperty(window, 'location', {
			value: {
				search: '',
			},
			writable: true,
		});

		renderHook(() => useStudentsViewModel(mockRoute));

		expect(mockUseNavigate).toHaveBeenCalledWith({
			to: '/students',
			search: {
				view: 'grid',
				page: 1,
				search: '',
				status: 'all',
				churnRisk: 'all',
				product: 'all',
				studentId: undefined,
			},
		});
	});
});
