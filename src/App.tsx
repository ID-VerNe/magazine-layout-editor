import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UIProvider } from './context/UIContext';

// 路由级代码分割：首屏只加载 Dashboard，编辑页（含 tiptap 等大依赖）按需异步加载
const Dashboard = lazy(() => import('./pages/Dashboard'));
const EditorPage = lazy(() => import('./pages/EditorPage'));

// 轻量加载占位，避免首屏阻塞
function PageFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-neutral-100">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-500" />
    </div>
  );
}

export default function App() {
  return (
    <UIProvider>
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/editor/:projectId" element={<EditorPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </UIProvider>
  );
}
