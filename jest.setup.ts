import '@testing-library/jest-dom';

jest.mock('@vercel/kv', () => ({
  kv: {
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1)
  }
}));
