import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// 独立 test 配置：与构建配置分离，避免 build 时 manualChunks 干扰测试。
// 环境统一用 jsdom（sanitize.ts 依赖 DOMPurify，需要真实的 window 对象）。
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // 默认只跑单线程足够；如遇到 jsdom 环境资源争用可再放开
    environmentOptions: {
      jsdom: { url: 'http://localhost:3000/' },
    },
  },
});