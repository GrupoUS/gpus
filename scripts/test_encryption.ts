
// Mock process.env
process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';

import { encrypt, decrypt, encryptCPF, decryptCPF } from '../convex/lib/encryption.ts';
// Note: bun can import ts files directly.

console.log('Testing Encryption Library...');

try {
    const email = 'test@example.com';
    const enc = encrypt(email);
    const dec = decrypt(enc);

    if (dec !== email) throw new Error('Email encryption failed');
    console.log('Email encryption: PASS');

    const cpf = '123.456.789-00';
    const encCpf = encryptCPF(cpf);
    const decCpf = decryptCPF(encCpf);

    // decryptCPF returns formatted
    if (decCpf !== cpf) throw new Error(`CPF encryption failed: ${decCpf}`);
    console.log('CPF encryption: PASS');

    console.log('ALL TESTS PASSED');
    process.exit(0);
} catch (e) {
    console.error(e);
    process.exit(1);
}
