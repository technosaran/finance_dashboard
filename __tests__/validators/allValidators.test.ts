import {
  validateEmail,
  validateBondQuery,
  validatePassword,
  validateStockQuery,
  validateMFCode,
  validateAmount,
  validateDate,
  validateString,
} from '@/lib/validators/input';

describe('validateEmail', () => {
  it('rejects empty email', () => {
    expect(validateEmail('').isValid).toBe(false);
    expect(validateEmail('   ').isValid).toBe(false);
  });

  it('accepts valid emails', () => {
    expect(validateEmail('user@example.com').isValid).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(validateEmail('notanemail').isValid).toBe(false);
  });
});

describe('validatePassword', () => {
  it('rejects short passwords', () => {
    expect(validatePassword('Ab1').isValid).toBe(false);
  });

  it('rejects passwords without uppercase', () => {
    expect(validatePassword('abcdefg1').isValid).toBe(false);
  });

  it('rejects passwords without lowercase', () => {
    expect(validatePassword('ABCDEFG1').isValid).toBe(false);
  });

  it('rejects passwords without numbers', () => {
    expect(validatePassword('Abcdefgh').isValid).toBe(false);
  });

  it('accepts valid passwords', () => {
    expect(validatePassword('Abcdefg1').isValid).toBe(true);
  });
});

describe('validateStockQuery', () => {
  it('rejects empty query', () => {
    expect(validateStockQuery('').isValid).toBe(false);
    expect(validateStockQuery('   ').isValid).toBe(false);
  });

  it('rejects query exceeding 50 characters', () => {
    expect(validateStockQuery('A'.repeat(51)).isValid).toBe(false);
  });

  it('rejects query with special characters', () => {
    expect(validateStockQuery('<script>').isValid).toBe(false);
  });

  it('accepts valid stock queries', () => {
    expect(validateStockQuery('RELIANCE').isValid).toBe(true);
    expect(validateStockQuery('M&M').isValid).toBe(true);
    expect(validateStockQuery('TCS.NS').isValid).toBe(true);
  });
});

describe('validateBondQuery', () => {
  it('accepts valid bond queries and ISIN lookups', () => {
    expect(validateBondQuery('NHAI 7.9% 2035').isValid).toBe(true);
    expect(validateBondQuery('IN0020230085').isValid).toBe(true);
  });

  it('rejects empty or unsafe bond queries', () => {
    expect(validateBondQuery('').isValid).toBe(false);
    expect(validateBondQuery('<script>alert(1)</script>').isValid).toBe(false);
  });
});

describe('validateMFCode', () => {
  it('rejects empty code', () => {
    expect(validateMFCode('').isValid).toBe(false);
  });

  it('rejects non-numeric code', () => {
    expect(validateMFCode('abcd').isValid).toBe(false);
  });

  it('accepts valid MF codes', () => {
    expect(validateMFCode('119551').isValid).toBe(true);
  });
});

describe('validateAmount', () => {
  it('rejects NaN', () => {
    expect(validateAmount('abc').isValid).toBe(false);
  });

  it('rejects amount below minimum', () => {
    expect(validateAmount(-1, 0).isValid).toBe(false);
  });

  it('rejects amount exceeding maximum (1e12)', () => {
    expect(validateAmount(2e12).isValid).toBe(false);
  });

  it('accepts valid amounts', () => {
    expect(validateAmount(100).isValid).toBe(true);
    expect(validateAmount('50.5').isValid).toBe(true);
    expect(validateAmount(0).isValid).toBe(true);
  });
});

describe('validateDate', () => {
  it('rejects empty date', () => {
    expect(validateDate('').isValid).toBe(false);
  });

  it('rejects invalid format', () => {
    expect(validateDate('01-01-2024').isValid).toBe(false);
    expect(validateDate('2024/01/01').isValid).toBe(false);
  });

  it('rejects invalid date values', () => {
    expect(validateDate('2024-13-01').isValid).toBe(false);
    expect(validateDate('2024-02-30').isValid).toBe(false);
  });

  it('accepts valid dates', () => {
    expect(validateDate('2024-06-15').isValid).toBe(true);
    expect(validateDate('2025-01-01').isValid).toBe(true);
  });
});

describe('validateString', () => {
  it('rejects empty strings', () => {
    expect(validateString('', 'name').isValid).toBe(false);
    expect(validateString('   ', 'name').isValid).toBe(false);
  });

  it('rejects strings below minLength', () => {
    expect(validateString('ab', 'name', 3).isValid).toBe(false);
  });

  it('rejects strings above maxLength', () => {
    expect(validateString('abcdef', 'name', 1, 5).isValid).toBe(false);
  });

  it('accepts valid strings', () => {
    expect(validateString('hello', 'name').isValid).toBe(true);
  });
});
