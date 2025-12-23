// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Id } from '../../convex/_generated/dataModel';
import { useStudentsViewModel } from './use-students-view-model';

// Mocks
const mockUseNavigate = vi.fn();
const mockUseQuery = vi.fn();
const mockUseConvexAuth = vi.fn(() => ({ isAuthenticated: true }));

vi.mock('@tanstack/react-router', () => ({
	useNavigate: () => mockUseNavigate,
}));

vi.mock('convex/react', () => ({
	// biome-ignore lint/suspicious/noExplicitAny: mock arguments
	useQuery: (...args: any[]) => mockUseQuery(...args),
	useConvexAuth: () => mockUseConvexAuth(),
}));

// Mock the API object
vi.mock('../../convex/_generated/api', () => ({
	api: {
		students: {
			list: 'api.students.list',
			getStudentsGroupedByProducts: 'api.students.getStudentsGroupedByProducts',
		},
	},
}));

describe('useStudentsViewModel', () => {
	const mockRoute = {
		useSearch: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockUseConvexAuth.mockReturnValue({ isAuthenticated: true });
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

	it('should group students by product correctly using Convex query', () => {
		// Mock data for list query (table view / stats)
		const mockStudents = [
			{ _id: '1', name: 'Student A', status: 'ativo', churnRisk: 'baixo' },
			{ _id: '2', name: 'Student B', status: 'ativo', churnRisk: 'alto' },
			{ _id: '3', name: 'Student C', status: 'ativo', churnRisk: 'baixo' },
			{ _id: '4', name: 'Student D', status: 'inativo', churnRisk: 'baixo' },
		];

		// Mock data for getStudentsGroupedByProducts query (grid view)
		const mockGroupedData = [
			{
				id: 'trintae3',
				name: 'trintae3',
				students: [
					{ _id: '1', name: 'Student A', status: 'ativo', churnRisk: 'baixo' },
					{ _id: '3', name: 'Student C', status: 'ativo', churnRisk: 'baixo' },
				],
				count: 2,
			},
			{
				id: 'otb',
				name: 'otb',
				students: [{ _id: '2', name: 'Student B', status: 'ativo', churnRisk: 'alto' }],
				count: 1,
			},
			{
				id: 'black_neon',
				name: 'black_neon',
				students: [],
				count: 0,
			},
			{
				id: 'comunidade',
				name: 'comunidade',
				students: [],
				count: 0,
			},
			{
				id: 'auriculo',
				name: 'auriculo',
				students: [],
				count: 0,
			},
			{
				id: 'na_mesa_certa',
				name: 'na_mesa_certa',
				students: [],
				count: 0,
			},
			{
				id: 'sem_produto',
				name: 'sem_produto',
				students: [{ _id: '4', name: 'Student D', status: 'inativo', churnRisk: 'baixo' }],
				count: 1,
			},
		];

		// Mock useQuery to return different data based on the query
		mockUseQuery.mockImplementation((query: string) => {
			if (query === 'api.students.list') {
				return mockStudents;
			}
			if (query === 'api.students.getStudentsGroupedByProducts') {
				return mockGroupedData;
			}
			return undefined;
		});

		const { result } = renderHook(() => useStudentsViewModel(mockRoute));

		const { groupedStudents, paginatedStudents, totalStudents, activeStudents, highRiskStudents } =
			result.current;

		expect(paginatedStudents).toHaveLength(4);
		expect(totalStudents).toBe(4);
		expect(activeStudents).toBe(3);
		expect(highRiskStudents).toBe(1);

		// Check grouping (now includes ALL products, even empty ones)
		expect(Object.keys(groupedStudents)).toHaveLength(7); // All products
		expect(groupedStudents.trintae3).toHaveLength(2);
		expect(groupedStudents.otb).toHaveLength(1);
		expect(groupedStudents.sem_produto).toHaveLength(1);
		expect(groupedStudents.black_neon).toHaveLength(0); // Empty but present

		// Check content
		expect(groupedStudents.trintae3[0].name).toBe('Student A');
		expect(groupedStudents.trintae3[1].name).toBe('Student C');
		expect(groupedStudents.sem_produto[0].name).toBe('Student D');
	});

	it('should show all students in grid view (no client-side pagination for groups)', () => {
		// Create 15 students - all should be visible in grid view now
		// (pagination only affects table view and paginatedStudents)
		const mockStudents = Array.from({ length: 15 }, (_, i) => ({
			_id: `${i}`,
			name: `Student ${i}`,
			status: 'ativo',
		}));

		// All 15 students in one group from Convex
		const mockGroupedData = [
			{
				id: 'trintae3',
				name: 'trintae3',
				students: mockStudents,
				count: 15,
			},
			{ id: 'otb', name: 'otb', students: [], count: 0 },
			{ id: 'black_neon', name: 'black_neon', students: [], count: 0 },
			{ id: 'comunidade', name: 'comunidade', students: [], count: 0 },
			{ id: 'auriculo', name: 'auriculo', students: [], count: 0 },
			{ id: 'na_mesa_certa', name: 'na_mesa_certa', students: [], count: 0 },
			{ id: 'sem_produto', name: 'sem_produto', students: [], count: 0 },
		];

		mockUseQuery.mockImplementation((query: string) => {
			if (query === 'api.students.list') {
				return mockStudents;
			}
			if (query === 'api.students.getStudentsGroupedByProducts') {
				return mockGroupedData;
			}
			return undefined;
		});

		// Test Page 1 - grid view shows ALL students regardless of pagination
		mockRoute.useSearch.mockReturnValue({
			page: 1,
			view: 'grid',
			search: '',
			status: 'all',
			churnRisk: 'all',
			product: 'all',
		});

		const { result: resultPage1 } = renderHook(() => useStudentsViewModel(mockRoute));

		// Grid view should have ALL 15 students (no pagination in grid)
		expect(resultPage1.current.groupedStudents.trintae3).toHaveLength(15);

		// paginatedStudents is for table view - still respects PAGE_SIZE (12)
		expect(resultPage1.current.paginatedStudents).toHaveLength(12);

		// Test Page 2 - groupedStudents should still have all, paginatedStudents shows remaining
		mockRoute.useSearch.mockReturnValue({
			page: 2,
			view: 'grid',
			search: '',
			status: 'all',
			churnRisk: 'all',
			product: 'all',
		});

		const { result: resultPage2 } = renderHook(() => useStudentsViewModel(mockRoute));

		// Grid view STILL shows all 15 (decoupled from pagination)
		expect(resultPage2.current.groupedStudents.trintae3).toHaveLength(15);

		// paginatedStudents shows remaining 3 on page 2
		expect(resultPage2.current.paginatedStudents).toHaveLength(3);
	});

	it('should handle loading state correctly', () => {
		mockUseQuery.mockReturnValue(undefined);

		const { result } = renderHook(() => useStudentsViewModel(mockRoute));

		expect(result.current.students).toBeUndefined();
		expect(result.current.groupedStudents).toEqual({});
		expect(result.current.totalStudents).toBe(0);
		expect(result.current.paginatedStudents).toHaveLength(0);
	});

	it('should handle unauthenticated state', () => {
		mockUseQuery.mockReturnValue(undefined);
		mockUseConvexAuth.mockReturnValue({ isAuthenticated: false });

		renderHook(() => useStudentsViewModel(mockRoute));

		// Verify useQuery was called with 'skip'
		expect(mockUseQuery).toHaveBeenCalledWith('api.students.list', 'skip');
		expect(mockUseQuery).toHaveBeenCalledWith('api.students.getStudentsGroupedByProducts', 'skip');
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
			result.current.navigateToStudent('student123' as Id<'students'>);
		});

		expect(mockUseNavigate).toHaveBeenCalledWith({
			to: '/students/$studentId',
			params: { studentId: 'student123' },
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
		// Mock window.location.search to be empty
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
