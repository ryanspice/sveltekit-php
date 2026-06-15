import adapter from '../../../../adapter/index.js';

const config = {
	kit: {
		adapter: adapter({
			mode: 'php-static'
		}),
		paths: {
			base: '/blog'
		}
	}
};

export default config;
