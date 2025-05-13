// src/setupTests.ts

// 1️⃣ Jest DOM matchers
import '@testing-library/jest-dom';

// 2️⃣ Mock localStorage
class LocalStorageMock implements Storage {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string) {
    this.store[key] = value;
  }

  removeItem(key: string) {
    delete this.store[key];
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] ?? null;
  }

  get length(): number {
    return Object.keys(this.store).length;
  }
}

// Attach to window
Object.defineProperty(window, "localStorage", {
  value: new LocalStorageMock(),
});

// 3️⃣ Mock navigator.clipboard
class ClipboardMock {
  private text = "";

  async writeText(text: string): Promise<void> {
    this.text = text;
  }

  async readText(): Promise<string> {
    return this.text;
  }
}

// Only define clipboard if it doesn't exist yet
if (!navigator.clipboard) {
  Object.defineProperty(navigator, "clipboard", {
    value: new ClipboardMock(),
    configurable: true,
    writable: true
  });
}

// 4️⃣ Mock @solana/web3.js Keypair.generate()
jest.mock("@solana/web3.js", () => {
  const actual = jest.requireActual("@solana/web3.js");
  return {
    ...actual,
    Keypair: {
      generate: jest.fn().mockReturnValue({
        publicKey: {
          toBase58: jest
            .fn()
            .mockReturnValue("ExampleSolanaPublicKeyInBase58Format123456789"),
        },
        secretKey: new Uint8Array(32).fill(1),
      }),
    },
  };
});

// 5️⃣ Mock global Buffer.from()
// Define a type for our mocked Buffer
interface MockedBuffer {
  from: (arr: Uint8Array) => { toString: () => string };
}

// Only define Buffer if it's not already defined in the global object
// This allows individual test files to override this mock
if (!(global as unknown as { Buffer?: unknown }).Buffer) {
  // Apply the type to global
  // First cast to unknown to avoid type compatibility issues
  Object.defineProperty(global, 'Buffer', {
    value: {
      from: jest.fn().mockImplementation((_arr: Uint8Array) => ({
        toString: jest
          .fn()
          .mockReturnValue("mockedSecretKeyInHexFormat123456789abcdef"),
      })),
    },
    configurable: true,
    writable: true
  });
}
