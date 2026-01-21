import { expect, test } from '@playwright/test';

const NEW_STUDENT_REGEX = /Novo Aluno/i;
const FULL_NAME_REGEX = /Nome Completo/i;
const EMAIL_REGEX = /Email/i;
const PHONE_REGEX = /Telefone/i;
const CPF_REGEX = /CPF/i;
const PROFESSION_REGEX = /Profissão/i;
const LGPD_CONSENT_REGEX = /Estou de acordo com o processamento dos meus dados pessoais/i;
const CREATE_STUDENT_REGEX = /Criar Aluno/i;
const SUCCESS_TOAST_REGEX = /Aluno criado com sucesso!/i;
const ERROR_TOAST_REGEX = /Erro ao criar aluno/i;
const LGPD_ERROR_REGEX = /Você deve aceitar os termos da LGPD/i;

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
		const newStudentButton = page.getByRole('button', { name: NEW_STUDENT_REGEX });
		await expect(newStudentButton).toBeVisible();
		await newStudentButton.click();

		// Fill the form
		const uniqueId = Date.now();
		await page.getByLabel(FULL_NAME_REGEX).fill(`Aluno de Teste E2E ${uniqueId}`);
		await page.getByLabel(EMAIL_REGEX).fill(`teste.e2e.${uniqueId}@grupous.com.br`);
		await page.getByLabel(PHONE_REGEX).fill(
			'119' +
				Math.floor(Math.random() * 100_000_000)
					.toString()
					.padStart(8, '0'),
		);
		await page.getByLabel(CPF_REGEX).fill('123.456.789-01');
		await page.getByLabel(PROFESSION_REGEX).fill('Esteticista');

		// LGPD Consent - Using the label to click
		const lgpdLabel = page.getByText(LGPD_CONSENT_REGEX);
		await expect(lgpdLabel).toBeVisible();
		await lgpdLabel.click();

		// Submit
		const submitButton = page.getByRole('button', { name: CREATE_STUDENT_REGEX });
		await expect(submitButton).toBeEnabled();
		await submitButton.click();

		// Verify success toast or error toast to understand what's happening
		const successToast = page.getByText(SUCCESS_TOAST_REGEX);
		const errorToast = page.getByText(ERROR_TOAST_REGEX);

		await expect(successToast.or(errorToast)).toBeVisible({ timeout: 15_000 });
		await expect(successToast).toBeVisible();
	});

	test('should show validation error if LGPD consent is not checked', async ({ page }) => {
		// Click "Novo Aluno" button
		const newStudentButton = page.getByRole('button', { name: NEW_STUDENT_REGEX });
		await newStudentButton.click();

		// Fill required fields
		await page.getByLabel(FULL_NAME_REGEX).fill('Aluno Sem Consentimento');
		await page.getByLabel(EMAIL_REGEX).fill('sem.consentimento@grupous.com.br');
		await page.getByLabel(PHONE_REGEX).fill('11988887777');
		await page.getByLabel(PROFESSION_REGEX).fill('Esteticista');

		// Do NOT check LGPD consent

		// Submit
		const submitButton = page.getByRole('button', { name: CREATE_STUDENT_REGEX });
		await submitButton.click();

		// Verify error message for LGPD
		await expect(page.getByText(LGPD_ERROR_REGEX)).toBeVisible();
	});
});
