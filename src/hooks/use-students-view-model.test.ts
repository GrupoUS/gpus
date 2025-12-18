// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useStudentsViewModel } from './use-students-view-model';

// Mocks
const mockUseNavigate = vi.fn();
const mockUseQuery = vi.fn();

vi.mock('@tanstack/react-router', () => ({
	useNavigate: () => mockUseNavigate,
}));

vi.mock('convex/react', () => ({
	// biome-ignore lint/suspicious/noExplicitAny: mock arguments
	useQuery: (...args: any[]) => mockUseQuery(...args),
	useConvexAuth: () => ({ isAuthenticated: true }),
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
		// Default search params
		mockRoute.useSearch.mockReturnValue({
			page: 1,
			view: 'grid',
			search: '',
			status: 'all',
			churnRisk: 'all',
			product: 'all',
		});
	});

	it('should group students by product correctly using Convex query', () => {
		// Mock data for list query (table view / stats)
		const mockStudents = [
			{ _id: '1', name: 'Student A', status: 'ativo' },
			{ _id: '2', name: 'Student B', status: 'ativo' },
			{ _id: '3', name: 'Student C', status: 'ativo' },
			{ _id: '4', name: 'Student D', status: 'ativo' },
		];

		// Mock data for getStudentsGroupedByProducts query (grid view)
		const mockGroupedData = [
			{
				id: 'trintae3',
				name: 'trintae3',
				students: [
					{ _id: '1', name: 'Student A', status: 'ativo' },
					{ _id: '3', name: 'Student C', status: 'ativo' },
				],
				count: 2,
			},
			{
				id: 'otb',
				name: 'otb',
				students: [{ _id: '2', name: 'Student B', status: 'ativo' }],
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
				students: [{ _id: '4', name: 'Student D', status: 'ativo' }],
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

		const { groupedStudents, paginatedStudents } = result.current;

		expect(paginatedStudents).toHaveLength(4);

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
			{
				id: 'otb',
				name: 'otb',
				students: [],
				count: 0,
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
				students: [],
				count: 0,
			},
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

		// paginatedStudents is for table view - still respects PAGE_SIZE
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
});
