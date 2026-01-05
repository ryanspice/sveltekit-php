export const prerender = process.env.ADAPTER_MODE === 'node-ssr' ? false : true;

export async function load() {
    return {
        step1: 'init',
        step2: new Promise(resolve => {
            setTimeout(() => {
                resolve('delayed');
            }, 500);
        })
    };
}
