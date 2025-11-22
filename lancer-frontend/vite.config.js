import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import process from 'process'; // Import process from node
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const root = process.cwd();

	return {
		plugins: [
			react(),
			tailwindcss(),
		],
		resolve: {
			alias: {
				'@configs': path.resolve(root, '../configs'),
			},
		},
		server: {
			host: '0.0.0.0',
			proxy: {
				'/api': {
					target: env.VITE_API_URL,
					changeOrigin: true,
				},
			},
			fs: {
				// Allow importing from the repo root (parent of AIMS-frontend)
				allow: [path.resolve(root, '..')],
			},
		},
	}
})
