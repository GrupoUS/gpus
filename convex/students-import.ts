/**
 * Student Import Mutation
 * Bulk import students from CSV/XLSX with LGPD compliance
 */

import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { encrypt, encryptCPF } from './lib/encryption';
import { logAudit } from './lgpd';

// Define student import data shape
const studentImportData = v.object({
  // Required fields
  name: v.string(),
  email: v.string(),
  phone: v.string(),
  profession: v.string(),
  hasClinic: v.boolean(),

  // Optional fields
  cpf: v.optional(v.string()),
  clinicName: v.optional(v.string()),
  clinicCity: v.optional(v.string()),
  status: v.optional(v.union(
    v.literal('ativo'),
    v.literal('inativo'),
    v.literal('pausado'),
    v.literal('formado')
  )),

  // Address fields
  birthDate: v.optional(v.number()),
  address: v.optional(v.string()),
  addressNumber: v.optional(v.string()),
  complement: v.optional(v.string()),
  neighborhood: v.optional(v.string()),
  city: v.optional(v.string()),
  state: v.optional(v.string()),
  zipCode: v.optional(v.string()),
  country: v.optional(v.string()),

  // Sale/Origin fields
  saleDate: v.optional(v.number()),
  salesperson: v.optional(v.string()),
  contractStatus: v.optional(v.string()),
  leadSource: v.optional(v.string()),
  cohort: v.optional(v.string()),
});

// Import result for a single row
interface ImportRowResult {
  rowNumber: number;
  success: boolean;
  studentId?: string;
  error?: string;
  warnings?: string[];
}

/**
 * Bulk import students from CSV/XLSX data
 * Handles validation, encryption, duplicate checking, and LGPD audit logging
 */
export const bulkImport = mutation({
  args: {
    students: v.array(studentImportData),
    fileName: v.string(),
    skipDuplicates: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{
    totalRows: number;
    successCount: number;
    failureCount: number;
    results: ImportRowResult[];
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Não autenticado');
    }

    const results: ImportRowResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    // Pre-fetch existing emails and CPFs for duplicate checking
    const existingStudents = await ctx.db.query('students').collect();
    const existingEmails = new Set(existingStudents.map(s => s.email.toLowerCase()));
    const existingCPFs = new Set(
      existingStudents
        .filter(s => s.cpf)
        .map(s => s.cpf?.replace(/\D/g, ''))
    );

    // Process each student
    for (let i = 0; i < args.students.length; i++) {
      const student = args.students[i];
      const rowNumber = i + 2; // +2 because row 1 is header, and arrays are 0-indexed
      const warnings: string[] = [];

      try {
        // Validate required fields
        if (!student.name || student.name.trim().length < 2) {
          throw new Error('Nome é obrigatório e deve ter pelo menos 2 caracteres');
        }
        if (!student.email || !student.email.includes('@')) {
          throw new Error('Email é obrigatório e deve ser válido');
        }
        if (!student.phone || student.phone.replace(/\D/g, '').length < 10) {
          throw new Error('Telefone é obrigatório e deve ter pelo menos 10 dígitos');
        }
        if (!student.profession) {
          throw new Error('Profissão é obrigatória');
        }

        // Normalize email
        const normalizedEmail = student.email.trim().toLowerCase();

        // Check for duplicate email
        if (existingEmails.has(normalizedEmail)) {
          if (args.skipDuplicates) {
            warnings.push('Email já existe, registro ignorado');
            results.push({
              rowNumber,
              success: false,
              error: 'Email duplicado (ignorado)',
              warnings,
            });
            failureCount++;
            continue;
          }
          throw new Error(`Email já cadastrado: ${normalizedEmail}`);
        }

        // Check for duplicate CPF
        if (student.cpf) {
          const normalizedCPF = student.cpf.replace(/\D/g, '');
          if (existingCPFs.has(normalizedCPF)) {
            if (args.skipDuplicates) {
              warnings.push('CPF já existe, registro ignorado');
              results.push({
                rowNumber,
                success: false,
                error: 'CPF duplicado (ignorado)',
                warnings,
              });
              failureCount++;
              continue;
            }
            throw new Error(`CPF já cadastrado: ${student.cpf}`);
          }
          // Add to set to prevent duplicates within the batch
          existingCPFs.add(normalizedCPF);
        }

        // Add email to set to prevent duplicates within the batch
        existingEmails.add(normalizedEmail);

        // Encrypt sensitive fields
        const encryptedEmail = encrypt(normalizedEmail);
        const encryptedPhone = encrypt(student.phone.replace(/\D/g, ''));
        const encryptedCPF = student.cpf ? encryptCPF(student.cpf) : undefined;

        // Prepare student data for insertion
        const studentData = {
          name: student.name.trim(),
          email: normalizedEmail,
          phone: student.phone.replace(/\D/g, ''),
          profession: student.profession,
          hasClinic: student.hasClinic,
          status: student.status || 'ativo' as const,
          churnRisk: 'baixo' as const,

          // Encrypted fields
          encryptedEmail,
          encryptedPhone,
          encryptedCPF,

          // Optional fields
          cpf: student.cpf ? student.cpf.replace(/\D/g, '') : undefined,
          clinicName: student.clinicName,
          clinicCity: student.clinicCity,

          // Address fields
          birthDate: student.birthDate,
          address: student.address,
          addressNumber: student.addressNumber,
          complement: student.complement,
          neighborhood: student.neighborhood,
          city: student.city,
          state: student.state,
          zipCode: student.zipCode,
          country: student.country,

          // Sale/Origin fields
          saleDate: student.saleDate,
          salesperson: student.salesperson,
          contractStatus: student.contractStatus,
          leadSource: student.leadSource,
          cohort: student.cohort,

          // Timestamps
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        // Insert student
        const studentId = await ctx.db.insert('students', studentData);

        // Log LGPD audit
        await logAudit(ctx, {
          studentId,
          actionType: 'data_creation',
          dataCategory: 'personal_data',
          description: `Student imported from CSV: ${args.fileName}`,
          legalBasis: 'contract_execution',
          metadata: {
            importSource: 'csv_upload',
            fileName: args.fileName,
            rowNumber,
            importedBy: identity.subject,
          },
        });

        results.push({
          rowNumber,
          success: true,
          studentId: studentId.toString(),
          warnings: warnings.length > 0 ? warnings : undefined,
        });
        successCount++;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        results.push({
          rowNumber,
          success: false,
          error: errorMessage,
          warnings: warnings.length > 0 ? warnings : undefined,
        });
        failureCount++;
      }
    }

    return {
      totalRows: args.students.length,
      successCount,
      failureCount,
      results,
    };
  },
});

/**
 * Validate import data before actual import
 * Used for preview and validation step
 */
export const validateImport = mutation({
  args: {
    students: v.array(studentImportData),
  },
  handler: async (ctx, args): Promise<{
    valid: boolean;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateEmails: string[];
    duplicateCPFs: string[];
    errors: Array<{ rowNumber: number; errors: string[] }>;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Não autenticado');
    }

    // Fetch existing data for duplicate detection
    const existingStudents = await ctx.db.query('students').collect();
    const existingEmails = new Set(existingStudents.map(s => s.email.toLowerCase()));
    const existingCPFs = new Set(
      existingStudents
        .filter(s => s.cpf)
        .map(s => s.cpf?.replace(/\D/g, ''))
    );

    const errors: Array<{ rowNumber: number; errors: string[] }> = [];
    const duplicateEmails: string[] = [];
    const duplicateCPFs: string[] = [];
    const seenEmails = new Set<string>();
    const seenCPFs = new Set<string>();
    let validRows = 0;
    let invalidRows = 0;

    for (let i = 0; i < args.students.length; i++) {
      const student = args.students[i];
      const rowNumber = i + 2;
      const rowErrors: string[] = [];

      // Validate required fields
      if (!student.name || student.name.trim().length < 2) {
        rowErrors.push('Nome é obrigatório e deve ter pelo menos 2 caracteres');
      }
      if (!student.email || !student.email.includes('@')) {
        rowErrors.push('Email é obrigatório e deve ser válido');
      } else {
        const normalizedEmail = student.email.trim().toLowerCase();
        if (existingEmails.has(normalizedEmail) || seenEmails.has(normalizedEmail)) {
          rowErrors.push(`Email duplicado: ${normalizedEmail}`);
          if (!duplicateEmails.includes(normalizedEmail)) {
            duplicateEmails.push(normalizedEmail);
          }
        }
        seenEmails.add(normalizedEmail);
      }
      if (!student.phone || student.phone.replace(/\D/g, '').length < 10) {
        rowErrors.push('Telefone é obrigatório e deve ter pelo menos 10 dígitos');
      }
      if (!student.profession) {
        rowErrors.push('Profissão é obrigatória');
      }

      // Check CPF duplicates
      if (student.cpf) {
        const normalizedCPF = student.cpf.replace(/\D/g, '');
        if (existingCPFs.has(normalizedCPF) || seenCPFs.has(normalizedCPF)) {
          rowErrors.push(`CPF duplicado: ${student.cpf}`);
          if (!duplicateCPFs.includes(student.cpf)) {
            duplicateCPFs.push(student.cpf);
          }
        }
        seenCPFs.add(normalizedCPF);
      }

      if (rowErrors.length > 0) {
        errors.push({ rowNumber, errors: rowErrors });
        invalidRows++;
      } else {
        validRows++;
      }
    }

    return {
      valid: invalidRows === 0,
      totalRows: args.students.length,
      validRows,
      invalidRows,
      duplicateEmails,
      duplicateCPFs,
      errors,
    };
  },
});
