// @vitest-environment jsdom

import { zodResolver } from '@hookform/resolvers/zod';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import * as z from 'zod';

import { Button } from '../button';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '../form';
import { Input } from '../input';

const formSchema = z.object({
	username: z.string().min(2, {
		message: 'Username must be at least 2 characters.',
	}),
});

function TestForm({ onSubmit }: { onSubmit: (values: z.infer<typeof formSchema>) => void }) {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			username: '',
		},
	});

	return (
		<Form {...form}>
			<form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
				<FormField
					control={form.control}
					name="username"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Username</FormLabel>
							<FormControl>
								<Input placeholder="shadcn" {...field} />
							</FormControl>
							<FormDescription>This is your public display name.</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit">Submit</Button>
			</form>
		</Form>
	);
}

describe('Form Component', () => {
	it('renders form fields correctly', () => {
		render(<TestForm onSubmit={vi.fn()} />);
		expect(screen.getByLabelText('Username')).toBeDefined();
		expect(screen.getByPlaceholderText('shadcn')).toBeDefined();
		expect(screen.getByText('This is your public display name.')).toBeDefined();
	});

	it('shows validation error on invalid submit', async () => {
		const handleSubmit = vi.fn();
		render(<TestForm onSubmit={handleSubmit} />);

		fireEvent.click(screen.getByText('Submit'));

		await waitFor(() => {
			expect(screen.getByText('Username must be at least 2 characters.')).toBeDefined();
		});
		expect(handleSubmit).not.toHaveBeenCalled();
	});

	it('submits valid data', async () => {
		const handleSubmit = vi.fn();
		render(<TestForm onSubmit={handleSubmit} />);

		fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
		fireEvent.click(screen.getByText('Submit'));

		await waitFor(() => {
			expect(handleSubmit).toHaveBeenCalledWith({ username: 'testuser' }, expect.anything());
		});
	});
});
