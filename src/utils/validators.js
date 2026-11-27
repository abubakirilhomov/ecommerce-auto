import { sanitizeUrl } from './sanitize.js';

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

  const trimmed = String(value).trim();
  if (!trimmed) {
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
 * Например: "+998 (90) 123-45-67" -> "+998901234567".
 * @param {*} value
 * @returns {string}
 */
export function normalizeUzPhone(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim().replace(/[\s()-]/g, '');
}

/**
 * Проверяет узбекский номер телефона формата `+998XXXXXXXXX` (9 цифр после +998).
 * Допускает пробелы, скобки и дефисы при вводе.
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

/**
 * Парсит числовое значение цены или числа, убирая пробелы-разделители.
 * @param {*} value
 * @returns {number}
 */
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
 * @param {number} [options.min=1] - минимально допустимая цена
 * @param {number} [options.max=100000000000] - максимально допустимая цена
 * @param {boolean} [options.allowZero=false] - разрешать ли цену 0
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
 * Проверяет год выпуска автомобиля (целое число от 1950 до текущего года + 1).
 * @param {*} value
 * @param {Object} [options]
 * @param {number} [options.min=1950]
 * @param {number} [options.max] - по умолчанию текущий год + 1
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
 * Проверяет пробег автомобиля (неотрицательное целое число).
 * @param {*} value
 * @param {Object} [options]
 * @param {number} [options.max=2000000]
 * @returns {{ valid: boolean, error: string }}
 */
export function validateMileage(value, { max = 2_000_000 } = {}) {
  const requiredCheck = validateRequired(value, 'Пробег');
  if (!requiredCheck.valid) return requiredCheck;

  const mileage = parseNumericInput(value);
  if (!Number.isInteger(mileage) || mileage < 0) {
    return createResult(false, 'Пробег должен быть целым числом от 0');
  }
  if (mileage > max) {
    return createResult(false, `Пробег не может превышать ${max} км`);
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
 * Проверяет URL изображения или ссылки с помощью `sanitizeUrl`.
 * @param {*} value
 * @param {Object} [options]
 * @param {boolean} [options.required=true]
 * @param {string} [options.fieldName='Ссылка']
 * @returns {{ valid: boolean, error: string }}
 */
export function validateSafeUrl(value, { required = true, fieldName = 'Ссылка' } = {}) {
  if (!required && (value === null || value === undefined || String(value).trim() === '')) {
    return createResult(true);
  }

  const requiredCheck = validateRequired(value, fieldName);
  if (!requiredCheck.valid) return requiredCheck;

  const safe = sanitizeUrl(String(value), '');
  if (!safe) {
    return createResult(false, `${fieldName} содержит недопустимый или небезопасный адрес`);
  }

  return createResult(true);
}

/**
 * Запускает набор правил валидации для объекта данных формы.
 * @param {Object} data - значения полей формы
 * @param {Record<string, (value: *) => { valid: boolean, error: string }>} rules - карта валидаторов
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

// Короткие булевы хелперы для быстрых проверок
export const isNonEmpty = (value) => validateRequired(value).valid;
export const isValidUzPhone = (value) => validateUzPhone(value).valid;
export const isValidPrice = (value, options) => validatePrice(value, options).valid;
export const isValidYear = (value, options) => validateYear(value, options).valid;
export const isValidEmail = (value) => validateEmail(value).valid;
