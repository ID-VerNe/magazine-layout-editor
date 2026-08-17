import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
		base: '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            // 手动拆包：把体积大的第三方库与业务代码分离，
            // 并与路由级动态导入配合，避免首屏出现超 500kB 的单一大包。
            manualChunks(id) {
              if (!id.includes('node_modules')) return undefined;
              // React 相关（运行时时必须在任何业务代码前加载，独立成块利于缓存）
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'react-vendor';
              }
              // 富文本编辑 Tiptap + ProseMirror（体量最大，且仅编辑页使用）
              if (id.includes('@tiptap') || id.includes('prosemirror')) {
                return 'tiptap';
              }
              // 动画库
              if (id.includes('framer-motion') || id.includes('motion')) {
                return 'motion';
              }
              // 图标库
              if (id.includes('lucide-react')) {
                return 'icons';
              }
              // 图片导出
              if (id.includes('html-to-image')) {
                return 'export';
              }
              // HTML 消毒
              if (id.includes('dompurify')) {
                return 'sanitize';
              }
              // 其余第三方依赖归为通用 vendor
              return 'vendor';
            },
          },
        },
        // 保留 Vite 默认 500kB 告警，用于发现后续新引入的大依赖
        chunkSizeWarningLimit: 500,
      }
    };
});
