import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const prerender = false;

export const load: PageServerLoad = async () => {
    return {
        page_uuid: 'page_form_basic_ts_' + Date.now()
    };
};

export const actions: Actions = {
    default: async ({ request }) => {
        const data = await request.formData();
        const val = data.get('val');

        if (val === 'fail') {
            return fail(400, { error: 'invalid' });
        }

        return {
            success: true,
            echo: val
        };
    }
};
