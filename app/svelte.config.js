import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({ fallback: undefined }),
		paths: {
			// For GitHub project pages set BASE_PATH=/<repo-name> in the build env.
			base: process.env.BASE_PATH ?? ''
		}
	}
};

export default config;
