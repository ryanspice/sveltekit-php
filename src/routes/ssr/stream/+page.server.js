export async function load() {
	return {
		serverTime: new Date().toISOString(),
		streamId: Math.random().toString(36).substr(2, 9),
		streamed: new Promise((resolve) => {
			setTimeout(() => {
				resolve({
					message: 'Streamed content loaded!'
				});
			}, 500);
		})
	};
}
