const adapterMode = process.env.ADAPTER_MODE;

export const prerender = adapterMode === 'js-ssr' ? false : true;

export function load() {
	return {
		message: 'Hello from Node Sidecar',
		time: Date.now()
	};
}
