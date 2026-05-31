export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name');
		const email = formData.get('email');
		const message = formData.get('message');

		// Basic validation
		if (!name || !email || !message) {
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
				name: name.trim(),
				email: email.trim().toLowerCase(),
				message: message.trim(),
				processedAt: new Date().toISOString(),
				messageLength: message.length
			}
		};
	}
};
