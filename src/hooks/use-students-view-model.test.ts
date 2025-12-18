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
}));

// Mock the API object
vi.mock('../../convex/_generated/api', () => ({
	api: {
		students: {
			list: 'api.students.list',
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

	it('should group students by mainProduct correctly', () => {
		// Mock data
		const mockStudents = [
			{ _id: '1', name: 'Student A', mainProduct: 'trintae3', status: 'ativo' },
			{ _id: '2', name: 'Student B', mainProduct: 'otb', status: 'ativo' },
			{ _id: '3', name: 'Student C', mainProduct: 'trintae3', status: 'ativo' },
			{ _id: '4', name: 'Student D', mainProduct: undefined, status: 'ativo' }, // Should default to sem_produto
		];

		mockUseQuery.mockReturnValue(mockStudents);

		const { result } = renderHook(() => useStudentsViewModel(mockRoute));

		const { groupedStudents, paginatedStudents } = result.current;

		expect(paginatedStudents).toHaveLength(4);

		// Check grouping
		expect(Object.keys(groupedStudents)).toHaveLength(3); // trintae3, otb, sem_produto
		expect(groupedStudents.trintae3).toHaveLength(2);
		expect(groupedStudents.otb).toHaveLength(1);
		expect(groupedStudents.sem_produto).toHaveLength(1);

		// Check content
		expect(groupedStudents.trintae3[0].name).toBe('Student A');
		expect(groupedStudents.trintae3[1].name).toBe('Student C');
		expect(groupedStudents.sem_produto[0].name).toBe('Student D');
	});

	it('should handle pagination correctly in grouping', () => {
		// Create 15 students (PAGE_SIZE is 12)
		const mockStudents = Array.from({ length: 15 }, (_, i) => ({
			_id: `${i}`,
			name: `Student ${i}`,
			mainProduct: 'trintae3',
			status: 'ativo',
		}));

		mockUseQuery.mockReturnValue(mockStudents);

		// Test Page 1
		mockRoute.useSearch.mockReturnValue({
			page: 1,
			view: 'grid',
			search: '',
			status: 'all',
			churnRisk: 'all',
			product: 'all',
		});

		const { result: resultPage1 } = renderHook(() => useStudentsViewModel(mockRoute));

		expect(resultPage1.current.paginatedStudents).toHaveLength(12);
		expect(resultPage1.current.groupedStudents.trintae3).toHaveLength(12);

		// Test Page 2
		mockRoute.useSearch.mockReturnValue({
			page: 2,
			view: 'grid',
			search: '',
			status: 'all',
			churnRisk: 'all',
			product: 'all',
		});

		const { result: resultPage2 } = renderHook(() => useStudentsViewModel(mockRoute));

		expect(resultPage2.current.paginatedStudents).toHaveLength(3);
		expect(resultPage2.current.groupedStudents.trintae3).toHaveLength(3);
	});
});
