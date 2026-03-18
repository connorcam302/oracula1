import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth?.();

	if (!session?.user?.id) {
		throw redirect(302, '/auth/signin');
	}

	throw redirect(302, `/profile/${session.user.id}`);
};
