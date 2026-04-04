import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { visualizer } from "rollup-plugin-visualizer";
import { resolve, dirname } from "path";
import { copyFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => ({
	plugins: [
		react(),
		mode === "analyze" &&
			visualizer({
				filename: "dist/stats.html",
				gzipSize: true,
				template: "treemap",
			}),
		{
			name: "copy-files",
			closeBundle: () => {
				mkdirSync("dist/icons", { recursive: true });

				copyFileSync("manifest.json", "dist/manifest.json");

				copyFileSync(
					"public/icons/icon16.png",
					"dist/icons/icon16.png"
				);
				copyFileSync(
					"public/icons/icon48.png",
					"dist/icons/icon48.png"
				);
				copyFileSync(
					"public/icons/icon128.png",
					"dist/icons/icon128.png"
				);

			},
		},
	].filter(Boolean),
	build: {
		sourcemap: false,
		target: "es2022",
		rollupOptions: {
			input: {
				sidepanel: resolve(__dirname, "index.html"),
				background: resolve(__dirname, "src/background.js"),
				contentScript: resolve(__dirname, "src/contentScript/index.js"),
			},
			output: {
				entryFileNames: (chunkInfo) => {
					if (chunkInfo.name === "background" || chunkInfo.name === "contentScript") {
						return "[name].js";
					}
					return "assets/[name]-[hash].js";
				},
				/**
				 * Keep a single vendor chunk for all node_modules. Splitting react / mui / rest
				 * caused "Cannot access '…' before initialization" (TDZ) in the minified vendor
				 * bundle due to cross-chunk circular imports at runtime in the side panel.
				 */
				manualChunks(id) {
					if (id.includes("node_modules")) {
						return "vendor";
					}
				},
			},
		},
		outDir: "dist",
	},
	server: {
		port: 7173,
	},
}));
