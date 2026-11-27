import { renderToContainer } from '../core/component.js';
import { authService, USER_ROLES } from '../services/authService.js';
import { dealersService } from '../services/dealersService.js';
import { escapeHtml } from '../utils/sanitize.js';
import { validateEmail, validateLength, validateRequired } from '../utils/validators.js';

function getAuthQueryParams() {
  const rawHash = window.location.hash.replace(/^#/, '');
  const queryIndex = rawHash.indexOf('?');
  if (queryIndex === -1) {
    return { redirect: '', reason: '' };
  }
  const params = new URLSearchParams(rawHash.slice(queryIndex + 1));
  const redirect = params.get('redirect') || '';
  const safeRedirect = redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '';
  return {
    redirect: safeRedirect,
    reason: params.get('reason') || '',
  };
}

function getRoleLabel(role) {
  return role === USER_ROLES.DEALER ? 'Автосалон' : 'Клиент';
}

function renderSignedInView(user, dealers) {
  const isDealer = user.role === USER_ROLES.DEALER;
  const dealer = isDealer ? dealers.find((d) => d.id === user.dealerId) : null;

  return `
    <section class="max-w-lg mx-auto">
      <div class="card bg-base-100 shadow-lg border border-base-300">
        <div class="card-body gap-4">
          <div class="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 class="text-2xl font-bold">${escapeHtml(user.name)}</h1>
              <p class="text-sm opacity-70 mt-1">${escapeHtml(user.email || 'Без email')}</p>
            </div>
            <span class="badge ${isDealer ? 'badge-primary' : 'badge-secondary'} badge-lg">
              ${escapeHtml(getRoleLabel(user.role))}
            </span>
          </div>

          ${
            dealer
              ? `
                <div class="alert alert-info text-sm">
                  <span>Привязанный автосалон: <strong>${escapeHtml(dealer.name)}</strong> (${escapeHtml(dealer.city)})</span>
                </div>
              `
              : ''
          }

          <div class="card-actions justify-between items-center pt-2 gap-2 flex-wrap">
            <div class="flex flex-wrap gap-2">
              <a href="#/catalog" class="btn btn-outline btn-sm">В каталог</a>
              ${
                isDealer
                  ? '<a href="#/dealer" class="btn btn-primary btn-sm">Кабинет автосалона</a>'
                  : ''
              }
            </div>
            <button type="button" data-auth-logout class="btn btn-error btn-outline btn-sm">
              Выйти
            </button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderDemoAccounts(users, loadError) {
  if (loadError) {
    return `
      <div class="alert alert-warning text-sm">
        <span>${escapeHtml(loadError)}</span>
      </div>
    `;
  }

  if (!users.length) {
    return '<p class="text-sm opacity-70">В базе данных пока нет пользователей.</p>';
  }

  return `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      ${users
        .map((user) => {
          const isDealer = user.role === USER_ROLES.DEALER;
          return `
            <button
              type="button"
              data-demo-user-id="${escapeHtml(user.id)}"
              class="card bg-base-200 hover:bg-base-300 transition-colors text-left p-4 border border-base-300 cursor-pointer"
            >
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="font-semibold text-sm">${escapeHtml(user.name)}</span>
                <span class="badge badge-sm ${isDealer ? 'badge-primary' : 'badge-ghost'}">
                  ${escapeHtml(getRoleLabel(user.role))}
                </span>
              </div>
              <span class="text-xs opacity-75">${escapeHtml(user.email)}</span>
            </button>
          `;
        })
        .join('')}
    </div>
  `;
}

function renderAuthFormView({
  users,
  dealers,
  loadError,
  reason,
  selectedRole,
  formValues,
  fieldErrors,
  submitError,
  isSubmitting,
}) {
  const showReasonBanner = reason === 'auth-required' || reason === 'dealer-only';
  const reasonText =
    reason === 'dealer-only'
      ? 'Раздел автосалона доступен только для роли «Автосалон».'
      : 'Для входа в кабинет автосалона авторизуйтесь под ролью «Автосалон».';

  const isDealerRole = selectedRole === USER_ROLES.DEALER;

  return `
    <section class="max-w-2xl mx-auto flex flex-col gap-6">
      ${
        showReasonBanner
          ? `
            <div role="alert" class="alert alert-warning shadow-sm">
              <span>${escapeHtml(reasonText)}</span>
            </div>
          `
          : ''
      }

      <div class="card bg-base-100 shadow-lg border border-base-300">
        <div class="card-body gap-5">
          <div>
            <h1 class="text-2xl font-bold">Вход и выбор роли</h1>
            <p class="text-sm opacity-75 mt-1">
              Войдите как покупатель или представитель автосалона AutoUz.
            </p>
          </div>

          <div>
            <p class="text-xs font-semibold uppercase tracking-wide opacity-60 mb-2">
              Быстрый вход из базы (server/db.json)
            </p>
            ${renderDemoAccounts(users, loadError)}
          </div>

          <div class="divider text-xs opacity-60 my-0">или вход / регистрация по email</div>

          <form id="auth-form" class="flex flex-col gap-4" novalidate>
            <div class="form-control">
              <span class="label-text font-medium mb-2 block">Выберите роль</span>
              <div class="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Роль пользователя">
                <label class="btn btn-sm ${!isDealerRole ? 'btn-primary' : 'btn-outline'}">
                  <input
                    type="radio"
                    name="role"
                    value="${USER_ROLES.CLIENT}"
                    class="hidden"
                    ${!isDealerRole ? 'checked' : ''}
                  />
                  Клиент
                </label>
                <label class="btn btn-sm ${isDealerRole ? 'btn-primary' : 'btn-outline'}">
                  <input
                    type="radio"
                    name="role"
                    value="${USER_ROLES.DEALER}"
                    class="hidden"
                    ${isDealerRole ? 'checked' : ''}
                  />
                  Автосалон
                </label>
              </div>
            </div>

            <label class="form-control w-full">
              <span class="label-text font-medium mb-1">Email</span>
              <input
                type="email"
                name="email"
                value="${escapeHtml(formValues.email)}"
                placeholder="${isDealerRole ? 'dealer@autouz.uz' : 'client@autouz.uz'}"
                class="input input-bordered w-full ${fieldErrors.email ? 'input-error' : ''}"
                required
              />
              ${
                fieldErrors.email
                  ? `<span class="text-error text-xs mt-1">${escapeHtml(fieldErrors.email)}</span>`
                  : ''
              }
            </label>

            <label class="form-control w-full">
              <span class="label-text font-medium mb-1">
                Имя или название <span class="opacity-60 text-xs">(для нового аккаунта)</span>
              </span>
              <input
                type="text"
                name="name"
                value="${escapeHtml(formValues.name)}"
                placeholder="${isDealerRole ? 'Например, Tashkent Auto Plaza' : 'Например, Сардор'}"
                class="input input-bordered w-full ${fieldErrors.name ? 'input-error' : ''}"
              />
              ${
                fieldErrors.name
                  ? `<span class="text-error text-xs mt-1">${escapeHtml(fieldErrors.name)}</span>`
                  : ''
              }
            </label>

            ${
              isDealerRole
                ? `
                  <label class="form-control w-full">
                    <span class="label-text font-medium mb-1">
                      Автосалон <span class="opacity-60 text-xs">(для нового дилера)</span>
                    </span>
                    <select
                      name="dealerId"
                      class="select select-bordered w-full ${fieldErrors.dealerId ? 'select-error' : ''}"
                    >
                      <option value="">Выберите автосалон...</option>
                      ${dealers
                        .map(
                          (dealer) => `
                            <option
                              value="${escapeHtml(dealer.id)}"
                              ${formValues.dealerId === dealer.id ? 'selected' : ''}
                            >
                              ${escapeHtml(dealer.name)} (${escapeHtml(dealer.city)})
                            </option>
                          `
                        )
                        .join('')}
                    </select>
                    ${
                      fieldErrors.dealerId
                        ? `<span class="text-error text-xs mt-1">${escapeHtml(fieldErrors.dealerId)}</span>`
                        : ''
                    }
                  </label>
                `
                : ''
            }

            ${
              submitError
                ? `
                  <div role="alert" class="alert alert-error text-sm">
                    <span>${escapeHtml(submitError)}</span>
                  </div>
                `
                : ''
            }

            <button
              type="submit"
              class="btn btn-primary w-full"
              ${isSubmitting ? 'disabled' : ''}
            >
              ${escapeHtml(isSubmitting ? 'Выполняется вход...' : 'Войти')}
            </button>
          </form>
        </div>
      </div>
    </section>
  `;
}

/**
 * Страница входа и выбора роли (Клиент или Автосалон).
 * @param {HTMLElement} outlet
 */
export async function renderAuthPage(outlet) {
  const { redirect, reason } = getAuthQueryParams();

  let users = [];
  let dealers = [];
  let loadError = '';

  try {
    const [loadedUsers, loadedDealers] = await Promise.all([
      authService.getUsers(),
      dealersService.getAll(),
    ]);
    users = Array.isArray(loadedUsers) ? loadedUsers : [];
    dealers = Array.isArray(loadedDealers) ? loadedDealers : [];
  } catch {
    loadError = 'Не удалось загрузить пользователей (запустите json-server: npm run server).';
  }

  const state = {
    selectedRole: reason ? USER_ROLES.DEALER : USER_ROLES.CLIENT,
    formValues: {
      email: '',
      name: '',
      dealerId: '',
    },
    fieldErrors: {},
    submitError: '',
    isSubmitting: false,
  };

  let isUnmounted = false;

  const navigateAfterLogin = (user) => {
    if (redirect) {
      window.location.hash = `#${redirect}`;
      return;
    }
    window.location.hash = user.role === USER_ROLES.DEALER ? '#/dealer' : '#/';
  };

  const render = () => {
    if (isUnmounted) return;
    const currentUser = authService.getCurrentUser();
    const html = currentUser
      ? renderSignedInView(currentUser, dealers)
      : renderAuthFormView({
          users,
          dealers,
          loadError,
          reason,
          ...state,
        });

    renderToContainer(outlet, html);
  };

  const syncFormInputs = () => {
    const form = outlet.querySelector('#auth-form');
    if (!form) return;
    const emailInput = form.querySelector('input[name="email"]');
    const nameInput = form.querySelector('input[name="name"]');
    const dealerSelect = form.querySelector('select[name="dealerId"]');
    state.formValues.email = emailInput ? emailInput.value : '';
    state.formValues.name = nameInput ? nameInput.value : '';
    state.formValues.dealerId = dealerSelect ? dealerSelect.value : '';
  };

  const handleClick = async (event) => {
    const logoutBtn = event.target.closest('[data-auth-logout]');
    if (logoutBtn) {
      authService.logout();
      state.submitError = '';
      state.fieldErrors = {};
      render();
      return;
    }

    const demoBtn = event.target.closest('[data-demo-user-id]');
    if (!demoBtn || state.isSubmitting) return;

    const userId = demoBtn.getAttribute('data-demo-user-id');
    const selectedUser = users.find((u) => u.id === userId);
    if (!selectedUser) return;

    try {
      const signedIn = await authService.loginAsUser(selectedUser);
      navigateAfterLogin(signedIn);
    } catch (error) {
      state.submitError = error.message || 'Ошибка входа';
      render();
    }
  };

  const handleChange = (event) => {
    if (event.target.name !== 'role') return;
    syncFormInputs();
    state.selectedRole =
      event.target.value === USER_ROLES.DEALER ? USER_ROLES.DEALER : USER_ROLES.CLIENT;
    state.fieldErrors = {};
    state.submitError = '';
    render();
  };

  const handleSubmit = async (event) => {
    if (event.target.id !== 'auth-form' || state.isSubmitting) return;
    event.preventDefault();
    syncFormInputs();

    const cleanEmail = state.formValues.email.trim().toLowerCase();
    const cleanName = state.formValues.name.trim();
    const existingUser = users.find(
      (u) => String(u.email || '').trim().toLowerCase() === cleanEmail
    );

    const fieldErrors = {};
    const emailCheck = validateEmail(cleanEmail);
    if (!emailCheck.valid) {
      fieldErrors.email = emailCheck.error;
    }

    if (!existingUser) {
      const nameCheck = validateLength(cleanName, {
        fieldName: 'Имя или название',
        min: 2,
        max: 80,
      });
      if (!nameCheck.valid) {
        fieldErrors.name = nameCheck.error;
      }

      if (state.selectedRole === USER_ROLES.DEALER) {
        const dealerCheck = validateRequired(state.formValues.dealerId, 'Автосалон');
        if (!dealerCheck.valid) {
          fieldErrors.dealerId = dealerCheck.error;
        }
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      state.fieldErrors = fieldErrors;
      state.submitError = '';
      render();
      return;
    }

    state.fieldErrors = {};
    state.submitError = '';
    state.isSubmitting = true;
    render();

    try {
      const signedIn = await authService.login({
        email: cleanEmail,
        name: cleanName,
        role: state.selectedRole,
        dealerId: state.formValues.dealerId || null,
      });
      navigateAfterLogin(signedIn);
    } catch (error) {
      state.submitError = error.message || 'Не удалось выполнить вход';
      state.isSubmitting = false;
      render();
    }
  };

  outlet.addEventListener('click', handleClick);
  outlet.addEventListener('change', handleChange);
  outlet.addEventListener('submit', handleSubmit);

  render();

  return () => {
    isUnmounted = true;
    outlet.removeEventListener('click', handleClick);
    outlet.removeEventListener('change', handleChange);
    outlet.removeEventListener('submit', handleSubmit);
  };
}
