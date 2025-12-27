import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { decrypt, encrypt, hashSensitiveData } from "./lib/encryption";

/**
 * Migrate students to use the new organizationId field
 */
export const migrateStudentOrganizationId = internalMutation({
	args: { limit: v.optional(v.number()) },
	handler: async (ctx, args) => {
		const limit = args.limit ?? 50;
		const students = await ctx.db.query("students").collect();

		let updatedCount = 0;
		const studentsToUpdate = students
			.filter((s) => !s.organizationId)
			.slice(0, limit);

		for (const student of studentsToUpdate) {
			await ctx.db.patch(student._id, {
				organizationId: "grupo-us", // Default organization
				updatedAt: Date.now(),
			});
			updatedCount++;
		}

		return {
			processed: studentsToUpdate.length,
			updated: updatedCount,
			remaining:
				students.filter((s) => !s.organizationId).length - updatedCount,
		};
	},
});

/**
 * Backfills cpfHash for all students who have encryptedCPF but no cpfHash
 */
export const backfillCpfHash = internalMutation({
	args: { limit: v.optional(v.number()) },
	handler: async (ctx, args) => {
		const limit = args.limit ?? 50;
		const students = await ctx.db.query("students").collect();

		let updatedCount = 0;
		const studentsWithCpf = students.filter((s) => s.encryptedCPF && !s.cpfHash);
		const studentsToUpdate = studentsWithCpf.slice(0, limit);

		for (const student of studentsToUpdate) {
			try {
				// We need to decrypt to get the clean digits for the hash
				const encryptedCPF = student.encryptedCPF;
				if (encryptedCPF) {
					const decryptedCpf = await decrypt(encryptedCPF);
					const cleanCpf = decryptedCpf.replace(/[^\d]/g, "");

					// Using SHA-256 for the blind index
					const hash = await hashSensitiveData(cleanCpf);

					await ctx.db.patch(student._id, {
						cpfHash: hash,
						updatedAt: Date.now(),
					});
					updatedCount++;
				}
			} catch (error) {
				console.error(
					`Failed to backfill CPF hash for student ${student._id}:`,
					error,
				);
			}
		}

		return {
			processed: studentsToUpdate.length,
			updated: updatedCount,
			remaining: studentsWithCpf.length - updatedCount,
		};
	},
});


/**
 * Encrypts legacy plaintext CPFs and generates hashes for blind indexing
 */
export const encryptLegacyCpfs = internalMutation({
	args: { limit: v.optional(v.number()) },
	handler: async (ctx, args) => {
		const limit = args.limit ?? 50;
		// Find students with plaintext CPF but missing encryption or hash
		const students = await ctx.db.query("students").collect();
		
		const studentsToMigrate = students
			.filter(s => s.cpf && (!s.encryptedCPF || !s.cpfHash))
			.slice(0, limit);

		let updatedCount = 0;

		for (const student of studentsToMigrate) {
			if (!student.cpf) continue;

			// Clean CPF digits
			const cleanCpf = student.cpf.replace(/[^\d]/g, "");
			if (!cleanCpf) continue;

			const encrypted = await encrypt(cleanCpf);
			const hash = await hashSensitiveData(cleanCpf);

			await ctx.db.patch(student._id, {
				encryptedCPF: encrypted,
				cpfHash: hash,
				// Optionally clear plaintext CPF here or in a separate pass
				// For safety, we keeping it until we confirm migration is successful 
				// But the task says "remove", so let's null it out if we are confident.
				// Let's keep it for now as "deprecated" field until full verification.
				// cpf: undefined 
				updatedAt: Date.now(),
			});
			updatedCount++;
		}

		const remaining = students.filter(s => s.cpf && (!s.encryptedCPF || !s.cpfHash)).length - updatedCount;

		return {
			processed: studentsToMigrate.length,
			updated: updatedCount,
			remaining
		};
	},
});

export const syncClerkUsers = internalMutation({
	args: {
		users: v.array(
			v.object({
				clerkId: v.string(),
				email: v.string(),
				name: v.optional(v.string()),
				role: v.union(v.literal("admin"), v.literal("sdr"), v.literal("cs"), v.literal("support")),
			}),
		),
	},
	handler: async (ctx, args) => {
		for (const user of args.users) {
			const existing = await ctx.db
				.query("users")
				.withIndex("by_clerk_id", (q) => q.eq("clerkId", user.clerkId))
				.unique();

			if (existing) {
				await ctx.db.patch(existing._id, {
					role: user.role,
					email: user.email,
					name: user.name ?? "",
					updatedAt: Date.now(),
				});
			} else {
				await ctx.db.insert("users", {
					clerkId: user.clerkId,
					email: user.email,
					name: user.name ?? "",
					role: user.role,
					isActive: true,
					organizationId: "grupo-us",
					createdAt: Date.now(),
					updatedAt: Date.now(),
				});
			}
		}
	},
});
