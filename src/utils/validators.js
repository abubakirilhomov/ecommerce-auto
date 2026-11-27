const UZ_PHONE_RE = /^\+998\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const DEFAULT_MIN_YEAR = 1950;
const DEFAULT_MAX_PRICE = 100_000_000_000;

/**
 * Формирует стандартный результат валидации.
 * @param {boolean} valid
 * @param {string} [error='']
 * @returns {{ valid: boolean, error: string }}
 */
function createResult(valid, error = '') {
  return { valid, error: valid ? '' : error };
}

/**
 * Проверяет, что значение не пустое (после обрезки пробелов).
 * @param {*} value
 * @param {string} [fieldName='Поле']
 * @returns {{ valid: boolean, error: string }}
 */
export function validateRequired(value, fieldName = 'Поле') {
  if (value === null || value === undefined) {
    return createResult(false, `${fieldName} обязательно для заполнения`);
  }

  if (!String(value).trim()) {
    return createResult(false, `${fieldName} не должно быть пустым`);
  }

  return createResult(true);
}

/**
 * Проверяет минимальную и максимальную длину строки.
 * @param {*} value
 * @param {Object} [options]
 * @param {string} [options.fieldName='Поле']
 * @param {number} [options.min=1]
 * @param {number} [options.max=200]
 * @returns {{ valid: boolean, error: string }}
 */
export function validateLength(value, { fieldName = 'Поле', min = 1, max = 200 } = {}) {
  const requiredCheck = validateRequired(value, fieldName);
  if (!requiredCheck.valid) return requiredCheck;

  const length = String(value).trim().length;
  if (length < min) {
    return createResult(false, `${fieldName} должно содержать минимум ${min} симв.`);
  }
  if (length > max) {
    return createResult(false, `${fieldName} не должно превышать ${max} симв.`);
  }

  return createResult(true);
}

/**
 * Нормализует узбекский номер телефона, убирая пробелы, скобки и дефисы.
 * @param {*} value
 * @returns {string}
 */
export function normalizeUzPhone(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim().replace(/[\s()-]/g, '');
}

/**
 * Проверяет узбекский номер телефона формата `+998XXXXXXXXX`.
 * @param {*} value
 * @returns {{ valid: boolean, error: string }}
 */
export function validateUzPhone(value) {
  const requiredCheck = validateRequired(value, 'Номер телефона');
  if (!requiredCheck.valid) return requiredCheck;

  const normalized = normalizeUzPhone(value);
  if (!UZ_PHONE_RE.test(normalized)) {
    return createResult(
      false,
      'Введите корректный номер Узбекистана в формате +998901234567'
    );
  }

  return createResult(true);
}

function parseNumericInput(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.trim().replace(/\s+/g, '').replace(',', '.');
    if (!cleaned) return Number.NaN;
    return Number(cleaned);
  }
  return Number.NaN;
}

/**
 * Проверяет цену автомобиля (положительное конечное число в заданном диапазоне).
 * @param {*} value
 * @param {Object} [options]
 * @returns {{ valid: boolean, error: string }}
 */
export function validatePrice(
  value,
  { min = 1, max = DEFAULT_MAX_PRICE, allowZero = false } = {}
) {
  const requiredCheck = validateRequired(value, 'Цена');
  if (!requiredCheck.valid) return requiredCheck;

  const num = parseNumericInput(value);
  if (!Number.isFinite(num)) {
    return createResult(false, 'Цена должна быть корректным числом');
  }

  const effectiveMin = allowZero ? Math.min(0, min) : min;
  if (allowZero && num < 0) {
    return createResult(false, 'Цена не может быть отрицательной');
  }
  if (!allowZero && num <= 0) {
    return createResult(false, 'Цена должна быть больше 0');
  }
  if (num < effectiveMin) {
    return createResult(false, `Цена должна быть не меньше ${effectiveMin}`);
  }
  if (num > max) {
    return createResult(false, `Цена не может превышать ${max}`);
  }

  return createResult(true);
}

/**
 * Проверяет год выпуска автомобиля.
 * @param {*} value
 * @param {Object} [options]
 * @returns {{ valid: boolean, error: string }}
 */
export function validateYear(
  value,
  { min = DEFAULT_MIN_YEAR, max = new Date().getFullYear() + 1 } = {}
) {
  const requiredCheck = validateRequired(value, 'Год выпуска');
  if (!requiredCheck.valid) return requiredCheck;

  const year = parseNumericInput(value);
  if (!Number.isInteger(year)) {
    return createResult(false, 'Год выпуска должен быть целым числом');
  }
  if (year < min || year > max) {
    return createResult(false, `Год выпуска должен быть от ${min} до ${max}`);
  }

  return createResult(true);
}

/**
 * Проверяет корректность email-адреса.
 * @param {*} value
 * @returns {{ valid: boolean, error: string }}
 */
export function validateEmail(value) {
  const requiredCheck = validateRequired(value, 'Email');
  if (!requiredCheck.valid) return requiredCheck;

  const trimmed = String(value).trim();
  if (!EMAIL_RE.test(trimmed)) {
    return createResult(false, 'Введите корректный email (например, name@autouz.uz)');
  }

  return createResult(true);
}

/**
 * Запускает набор правил валидации для объекта данных формы.
 * @param {Object} data
 * @param {Record<string, (value: *) => { valid: boolean, error: string }>} rules
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
export function validateForm(data = {}, rules = {}) {
  const errors = {};

  for (const [field, validator] of Object.entries(rules)) {
    if (typeof validator !== 'function') continue;
    const result = validator(data[field]);
    if (!result.valid) {
      errors[field] = result.error;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export const isNonEmpty = (value) => validateRequired(value).valid;
export const isValidUzPhone = (value) => validateUzPhone(value).valid;
export const isValidPrice = (value, options) => validatePrice(value, options).valid;
export const isValidYear = (value, options) => validateYear(value, options).valid;
export const isValidEmail = (value) => validateEmail(value).valid;
