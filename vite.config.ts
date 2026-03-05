import { defineConfig } from 'vite';
import eslint from 'vite-plugin-eslint2';

// https://vitejs.dev/config/
export default defineConfig({
    base: '/extremni-appka/',
    plugins: [eslint()],
});
