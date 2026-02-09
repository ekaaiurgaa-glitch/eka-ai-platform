import '@testing-library/jest-dom';

// Extend vitest matchers
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeInTheDocument(): void;
    toHaveClass(className: string): void;
    toHaveAttribute(attr: string, value?: string): void;
    toHaveTextContent(text: string): void;
    toBeDisabled(): void;
    toBeEnabled(): void;
    toBeVisible(): void;
    toBeHidden(): void;
  }
}
