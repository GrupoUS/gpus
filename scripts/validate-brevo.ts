const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL;

console.log('🔍 Validating Brevo Credentials...');

if (!BREVO_API_KEY) {
	console.error('❌ BREVO_API_KEY is missing in environment variables.');
	process.exit(1);
}

console.log('🔑 API Key present (' + BREVO_API_KEY.slice(0, 10) + '...)');

async function validateBrevo() {
	try {
		// 1. Check Account
		console.log('📡 Connecting to Brevo API (GET /account)...');
		const accountResponse = await fetch('https://api.brevo.com/v3/account', {
			headers: {
				'api-key': BREVO_API_KEY as string,
				accept: 'application/json',
			},
		});

		if (!accountResponse.ok) {
			const error = await accountResponse.json();
			console.error('❌ Failed to connect to Brevo:', JSON.stringify(error, null, 2));
			process.exit(1);
		}

		const accountData = await accountResponse.json();
		console.log('✅ Connection Successful! Account Email:', accountData.email);

		// 2. Check Sender
		console.log(`📡 Verifying Sender Email: ${BREVO_SENDER_EMAIL}...`);
		const sendersResponse = await fetch('https://api.brevo.com/v3/senders', {
			headers: {
				'api-key': BREVO_API_KEY as string,
				accept: 'application/json',
			},
		});

		if (sendersResponse.ok) {
			const sendersData = await sendersResponse.json();
			const found = sendersData.senders.find((s: any) => s.email === BREVO_SENDER_EMAIL);

			if (found) {
				console.log(`✅ Sender "${BREVO_SENDER_EMAIL}" is verified.`);
				if (!found.active) {
					console.warn(`⚠️ Sender is found but NOT ACTIVE.`);
				}
			} else {
				console.warn(`⚠️ Sender "${BREVO_SENDER_EMAIL}" NOT FOUND in verified senders list.`);
				console.log('Available senders:', sendersData.senders.map((s: any) => s.email).join(', '));
			}
		} else {
			console.error('❌ Failed to fetch senders.');
		}
	} catch (err) {
		console.error('❌ Exception during validation:', err);
		process.exit(1);
	}
}

validateBrevo();
