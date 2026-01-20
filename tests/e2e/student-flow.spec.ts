import { expect, test } from '@playwright/test';

test.describe('Student Creation Flow', () => {
	// Note: This test assumes the user is authenticated.
	// In a production environment, we would use a storageState or a mock auth provider.

	test.beforeEach(async ({ page }) => {
		// Navigate to the students page
		await page.goto('/students');

		// If redirected to sign-in, it means auth is required and not mocked.
		// For the purpose of this task, we proceed with the selectors.
	});

	test('should create a new student with LGPD consent', async ({ page }) => {
		// Click "Novo Aluno" button
		const newStudentButton = page.getByRole('button', { name: /Novo Aluno/i });
		await expect(newStudentButton).toBeVisible();
		await newStudentButton.click();

		// Fill the form
		const uniqueId = Date.now();
		await page.getByLabel(/Nome Completo/i).fill(`Aluno de Teste E2E ${uniqueId}`);
		await page.getByLabel(/Email/i).fill(`teste.e2e.${uniqueId}@grupous.com.br`);
		await page.getByLabel(/Telefone/i).fill(
			'119' +
				Math.floor(Math.random() * 100_000_000)
					.toString()
					.padStart(8, '0'),
		);
		await page.getByLabel(/CPF/i).fill('123.456.789-01');
		await page.getByLabel(/Profissão/i).fill('Esteticista');

		// LGPD Consent - Using the label to click
		const lgpdLabel = page.getByText(
			/Estou de acordo com o processamento dos meus dados pessoais/i,
		);
		await expect(lgpdLabel).toBeVisible();
		await lgpdLabel.click();

		// Submit
		const submitButton = page.getByRole('button', { name: /Criar Aluno/i });
		await expect(submitButton).toBeEnabled();
		await submitButton.click();

		// Verify success toast or error toast to understand what's happening
		const successToast = page.getByText(/Aluno criado com sucesso!/i);
		const errorToast = page.getByText(/Erro ao criar aluno/i);

		await expect(successToast.or(errorToast)).toBeVisible({ timeout: 15_000 });
		await expect(successToast).toBeVisible();
	});

	test('should show validation error if LGPD consent is not checked', async ({ page }) => {
		// Click "Novo Aluno" button
		const newStudentButton = page.getByRole('button', { name: /Novo Aluno/i });
		await newStudentButton.click();

		// Fill required fields
		await page.getByLabel(/Nome Completo/i).fill('Aluno Sem Consentimento');
		await page.getByLabel(/Email/i).fill('sem.consentimento@grupous.com.br');
		await page.getByLabel(/Telefone/i).fill('11988887777');
		await page.getByLabel(/Profissão/i).fill('Esteticista');

		// Do NOT check LGPD consent

		// Submit
		const submitButton = page.getByRole('button', { name: /Criar Aluno/i });
		await submitButton.click();

		// Verify error message for LGPD
		await expect(page.getByText(/Você deve aceitar os termos da LGPD/i)).toBeVisible();
	});
});
