// Type declarations for Jest globals in tests
import '@testing-library/jest-dom';

// These declarations make TypeScript recognize the global Jest functions
// which are available in the testing environment
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveAttribute(attr: string, value?: string): R;
    }
  }

  const jest: typeof import('jest');
  const describe: (name: string, fn: () => void) => void;
  const it: (name: string, fn: () => void) => void;
  const test: (name: string, fn: () => void) => void;
  const expect: typeof import('@jest/expect').expect;
  const beforeEach: (fn: () => void) => void;
  const afterEach: (fn: () => void) => void;
  const beforeAll: (fn: () => void) => void;
  const afterAll: (fn: () => void) => void;
}

// This is required for TypeScript modules
export {};
