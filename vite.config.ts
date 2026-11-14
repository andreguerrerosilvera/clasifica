import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

/** Genera `ads.txt` (lo exige AdSense) a partir del ID de editor de `.env.local`. */
function adsTxt(client: string | undefined): Plugin {
  return {
    name: 'ads-txt',
    generateBundle() {
      if (!client) return;
      const pub = client.replace(/^ca-/, '');
      this.emitFile({ type: 'asset', fileName: 'ads.txt', source: `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n` });
    },
  };
}

// `npm run build:single` genera un único index.html con todo embebido.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [react(), adsTxt(env.VITE_ADSENSE_CLIENT), ...(mode === 'single' ? [viteSingleFile()] : [])],
  };
});
