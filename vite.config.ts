import { cloudflare } from '@cloudflare/vite-plugin';
import { defineConfig, mergeConfig } from 'vite';
import base from './vite.base.ts';

const app = defineConfig({
  plugins: [cloudflare()],
  environments: {
    ssr: {
      build: {
        outDir: 'dist-ssr',
        rolldownOptions: { input: 'src/entry-prerender.tsx' },
      },
    },
  },
  builder: {
    // The Cloudflare plugin only builds client and Worker environments by default;
    // the SSR bundle feeds scripts/prerender.ts. The plugin still builds the Worker afterwards.
    async buildApp(builder) {
      await builder.build(builder.environments.client!);
      await builder.build(builder.environments.ssr!);
    },
  },
});

export default mergeConfig(base, app);
