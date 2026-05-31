export async function load() {
	const serverTime = new Date().toISOString();
	const buildInfo = `Built at: ${new Date().toLocaleString()}`;
	const environment = import.meta.env.PROD ? 'production' : 'development';

	return {
		serverTime,
		buildInfo,
		environment
	};
}
