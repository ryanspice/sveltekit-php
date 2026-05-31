export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name');
		const email = formData.get('email');
		const message = formData.get('message');

		// Basic validation
		if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
			return {
				success: false,
				message: 'All fields are required'
			};
		}
		const cleanedName = name.trim();
		const cleanedEmail = email.trim().toLowerCase();
		const cleanedMessage = message.trim();

		if (!cleanedName || !cleanedEmail || !cleanedMessage) {
			return {
				success: false,
				message: 'All fields are required'
			};
		}

		// Simulate processing
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Return success with processed data
		return {
			success: true,
			data: {
				name: cleanedName,
				email: cleanedEmail,
				message: cleanedMessage,
				processedAt: new Date().toISOString(),
				messageLength: cleanedMessage.length
			}
		};
	}
};
