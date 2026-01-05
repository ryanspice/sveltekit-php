
export const prerender = process.env.ADAPTER_MODE === 'node-ssr' ? false : true;

export function load() {
    return {
        message: 'Hello from Node Sidecar',
        time: Date.now()
    };
}
