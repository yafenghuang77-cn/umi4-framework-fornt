import '@testing-library/jest-dom';

import { TextDecoder, TextEncoder } from 'node:util';

// jsdom 不提供这两个 Web API，供路由和文本处理模块使用。
Object.defineProperties(globalThis, {
  TextEncoder: { configurable: true, writable: true, value: TextEncoder },
  TextDecoder: { configurable: true, writable: true, value: TextDecoder },
});

// Ant Design 的响应式组件会订阅 matchMedia；jsdom 不执行真实媒体查询。
Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  writable: true,
  value: jest.fn((query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(() => false),
  })),
});

afterEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});
