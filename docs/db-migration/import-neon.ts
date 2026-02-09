import { db } from "../server/db";
import * as schema from "../drizzle/schema";
import { readFileSync, readdirSync } from "fs";
import path from "path";

const dataExportDir = "data-export";

// List of all tables to be imported, in order of dependency
const tablesInOrder = [
    'users',
    'leads',
    'students',
    'enrollments',
    'tags',
    'leadTags',
    // ... add all other tables, ensuring dependencies are met
];

async function importAllData() {
    console.log("Starting data import to NeonDB...");

    for (const tableName of tablesInOrder) {
        const filePath = path.join(dataExportDir, `${tableName}.json`);
        try {
            const data = JSON.parse(readFileSync(filePath, 'utf-8'));
            if (data.length === 0) {
                console.log(`⚪️ No data to import for '${tableName}'.`);
                continue;
            }

            // @ts-ignore
            const tableSchema = schema[tableName];
            if (!tableSchema) {
                console.warn(`⚠️ Schema for table '${tableName}' not found. Skipping.`);
                continue;
            }

            // Transform data if necessary (e.g., snake_case)
            const transformedData = data.map((row: any) => {
                const newRow: { [key: string]: any } = {};
                for (const key in row) {
                    const snakeCaseKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                    newRow[snakeCaseKey] = row[key];
                }
                // Convex _id becomes id
                if (newRow._id) {
                    newRow.id = newRow._id;
                    delete newRow._id;
                }
                // Convex _creationTime becomes createdAt
                if (newRow._creation_time) {
                    newRow.created_at = new Date(newRow._creation_time);
                    delete newRow._creation_time;
                }
                return newRow;
            });

            await db.insert(tableSchema).values(transformedData).onConflictDoNothing();
            console.log(`✅ Successfully imported ${data.length} records into '${tableName}'`);

        } catch (error) {
            console.error(`❌ Failed to import data for '${tableName}':`, error);
        }
    }

    console.log("\nData import process completed.");
}

importAllData();
