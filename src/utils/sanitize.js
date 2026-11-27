const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const ALLOWED_URL_PROTOCOLS = new Set(['http:', 'https:', 'tel:', 'mailto:']);
const SAFE_RELATIVE_URL_RE = /^(?:\/(?!\/)|\.\/|\.\.\/|#)/;
const CONTROL_CHARS_RE = /[\u0000-\u001F\u007F]/g;

/**
 * Экранирует спецсимволы HTML для защиты от XSS-атак.
 * Обязательно использовать при вставке любых данных из API или форм в HTML.
 * @param {*} value
 * @returns {string}
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]);
}

/**
 * Проверяет и очищает URL для безопасной вставки в атрибуты `href` и `src`.
 * Блокирует опасные схемы (`javascript:`, `data:`, `vbscript:` и т.д.)
 * и protocol-relative ссылки (`//...`).
 * @param {*} value - исходный URL
 * @param {string} [fallback=''] - значение по умолчанию, если URL небезопасен
 * @param {Object} [options]
 * @param {boolean} [options.allowRelative=true] - разрешать ли относительные пути (`/`, `./`, `../`, `#`)
 * @param {string[]} [options.allowedProtocols] - список разрешенных протоколов (с двоеточием, например `['http:', 'https:']`)
 * @returns {string}
 */
export function sanitizeUrl(value, fallback = '', options = {}) {
  if (typeof value !== 'string') return fallback;

  const { allowRelative = true, allowedProtocols } = options;
  const cleaned = value.replace(CONTROL_CHARS_RE, '').trim();
  if (!cleaned) return fallback;

  const protocols = allowedProtocols
    ? new Set(allowedProtocols.map((p) => String(p).toLowerCase()))
    : ALLOWED_URL_PROTOCOLS;

  // Запрещаем protocol-relative URL (//evil.com), чтобы ссылка не уводила на внешний домен
  if (cleaned.startsWith('//')) return fallback;

  const isRelative = SAFE_RELATIVE_URL_RE.test(cleaned);
  if (isRelative) {
    if (!allowRelative) return fallback;
    return encodeUnsafeAttrChars(cleaned);
  }

  try {
    const parsed = new URL(cleaned);
    if (!protocols.has(parsed.protocol.toLowerCase())) {
      return fallback;
    }
    return encodeUnsafeAttrChars(cleaned);
  } catch {
    return fallback;
  }
}

/**
 * Очищает текстовую строку от управляющих символов и лишних пробелов по краям.
 * @param {*} value
 * @returns {string}
 */
export function sanitizeText(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(CONTROL_CHARS_RE, '').trim();
}

function encodeUnsafeAttrChars(url) {
  return url
    .replace(/"/g, '%22')
    .replace(/'/g, '%27')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E');
}

