/**
 * Typebot Script: Phone Validation & Formatting
 *
 * Instructions:
 * 1. Add a "Set Variable" block before the HTTP Request.
 * 2. Set variable: {{Telefone}}
 * 3. Script value: use the logic below.
 */

function _validatePhone(rawPhone) {
	// 1. Remove non-numeric characters
	let phone = rawPhone.replace(/\D/g, '');

	// 2. Handle Brazilian numbers
	if ((phone.length === 11 || phone.length === 10) && !phone.startsWith('55')) {
		phone = `55${phone}`;
	}

	// 3. Add '+' prefix (Convex expects international format)
	if (!phone.startsWith('+')) {
		phone = `+${phone}`;
	}

	return phone;
}
