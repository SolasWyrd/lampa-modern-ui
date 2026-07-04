(function () {
    'use strict';

    var PLUGIN_ID = 'lampa_modern_ui';
    var STYLE_ID = 'lampa-modern-ui-style';
    var READY_FLAG = 'lampa_modern_ui_ready';
    var VERSION = '0.1.0';

    var KEYS = {
        enabled: 'lmui_enabled',
        accent: 'lmui_accent',
        motion: 'lmui_motion',
        density: 'lmui_density',
        background: 'lmui_background'
    };

    var CSS = String.raw`
/* Lampa Modern UI 0.1.0
 * Визуальная тема без изменения логики приложения.
 * Все правила ограничены классом body.lampa-modern-ui.
 */

body.lampa-modern-ui {
    --lmui-accent: #8b7cff;
    --lmui-accent-rgb: 139, 124, 255;
    --lmui-accent-2: #5f8cff;
    --lmui-bg: #090b11;
    --lmui-panel: rgba(18, 21, 30, 0.96);
    --lmui-panel-soft: rgba(24, 28, 39, 0.92);
    --lmui-panel-hover: rgba(255, 255, 255, 0.09);
    --lmui-border: rgba(255, 255, 255, 0.10);
    --lmui-border-strong: rgba(255, 255, 255, 0.18);
    --lmui-text: #f7f8fb;
    --lmui-text-muted: rgba(247, 248, 251, 0.66);
    --lmui-shadow: 0 1em 2.6em rgba(0, 0, 0, 0.34);
    --lmui-shadow-focus: 0 1.2em 3em rgba(var(--lmui-accent-rgb), 0.24), 0 0 0 0.18em rgba(255,255,255,0.92);
    --lmui-radius-sm: 0.75em;
    --lmui-radius-md: 1.05em;
    --lmui-radius-lg: 1.45em;
    --lmui-fast: 150ms;
    --lmui-normal: 220ms;
    --lmui-slow: 320ms;
    --lmui-ease: cubic-bezier(0.2, 0.8, 0.2, 1);

    color: var(--lmui-text);
    background-color: var(--lmui-bg);
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
}

body.lampa-modern-ui.lmui-accent-blue {
    --lmui-accent: #63a7ff;
    --lmui-accent-rgb: 99, 167, 255;
    --lmui-accent-2: #4d7cff;
}

body.lampa-modern-ui.lmui-accent-violet {
    --lmui-accent: #8b7cff;
    --lmui-accent-rgb: 139, 124, 255;
    --lmui-accent-2: #5f8cff;
}

body.lampa-modern-ui.lmui-accent-emerald {
    --lmui-accent: #52d9a2;
    --lmui-accent-rgb: 82, 217, 162;
    --lmui-accent-2: #3aa8ff;
}

body.lampa-modern-ui.lmui-accent-amber {
    --lmui-accent: #ffb85c;
    --lmui-accent-rgb: 255, 184, 92;
    --lmui-accent-2: #ff7d70;
}

body.lampa-modern-ui.lmui-motion-smooth {
    --lmui-fast: 190ms;
    --lmui-normal: 280ms;
    --lmui-slow: 390ms;
}

body.lampa-modern-ui.lmui-motion-reduced {
    --lmui-fast: 1ms;
    --lmui-normal: 1ms;
    --lmui-slow: 1ms;
}

/* Недорогой статический фон. Он не использует blur/backdrop-filter. */
body.lampa-modern-ui::before {
    content: "";
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background:
        radial-gradient(70% 55% at 12% 0%, rgba(var(--lmui-accent-rgb), 0.15), transparent 72%),
        radial-gradient(58% 48% at 92% 18%, rgba(95, 140, 255, 0.10), transparent 75%),
        linear-gradient(180deg, #111521 0%, var(--lmui-bg) 52%, #07080c 100%);
}

body.lampa-modern-ui.lmui-background-minimal::before {
    background: linear-gradient(180deg, #10131b 0%, #080a0f 58%, #06070a 100%);
}

body.lampa-modern-ui.lmui-background-minimal .background {
    opacity: 0 !important;
}

body.lampa-modern-ui.lmui-background-soft .background {
    opacity: 0.24 !important;
    transition: opacity var(--lmui-slow) var(--lmui-ease) !important;
}

/* На слабом Android TV blur часто дороже, чем даёт визуальной пользы. */
body.lampa-modern-ui.glass--style .selectbox__content,
body.lampa-modern-ui.glass--style .settings__content,
body.lampa-modern-ui.glass--style .settings-input__content,
body.lampa-modern-ui.glass--style .modal__content,
body.lampa-modern-ui.glass--style .settings-input--free,
body.lampa-modern-ui.glass--style .navigation-bar__body,
body.lampa-modern-ui.glass--style .discuss-rules,
body.lampa-modern-ui.glass--style .bell__item {
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
}

/* Шапка */
body.lampa-modern-ui .head {
    background: linear-gradient(180deg, rgba(8, 10, 15, 0.92) 0%, rgba(8, 10, 15, 0.64) 68%, transparent 100%);
}

body.lampa-modern-ui .head__body {
    padding-top: 0.7em;
    padding-bottom: 0.85em;
}

body.lampa-modern-ui .head__title {
    font-weight: 600;
    letter-spacing: -0.025em;
}

body.lampa-modern-ui .head__action {
    border: 0.08em solid transparent;
    background: rgba(255, 255, 255, 0.055);
    transition:
        transform var(--lmui-fast) var(--lmui-ease),
        background-color var(--lmui-fast) var(--lmui-ease),
        border-color var(--lmui-fast) var(--lmui-ease),
        color var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .head__action.focus,
body.lampa-modern-ui .head__action.hover {
    color: #fff;
    background: linear-gradient(135deg, var(--lmui-accent), var(--lmui-accent-2));
    border-color: rgba(255, 255, 255, 0.72);
    transform: scale(1.08);
}

/* Боковое меню */
body.lampa-modern-ui .menu__list {
    padding-left: 0.8em;
    padding-right: 0.8em;
}

body.lampa-modern-ui .menu__item {
    margin-bottom: 0.15em;
    border: 0.08em solid transparent;
    border-radius: var(--lmui-radius-md);
    transition:
        transform var(--lmui-fast) var(--lmui-ease),
        background-color var(--lmui-fast) var(--lmui-ease),
        border-color var(--lmui-fast) var(--lmui-ease),
        color var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .menu__item.focus,
body.lampa-modern-ui .menu__item.traverse,
body.lampa-modern-ui .menu__item.hover {
    color: #fff;
    background: linear-gradient(100deg, rgba(var(--lmui-accent-rgb), 0.96), rgba(var(--lmui-accent-rgb), 0.56));
    border-color: rgba(255, 255, 255, 0.38);
    transform: translateX(0.22em);
}

body.lampa-modern-ui .menu__item.focus .menu__ico [stroke],
body.lampa-modern-ui .menu__item.traverse .menu__ico [stroke],
body.lampa-modern-ui .menu__item.hover .menu__ico [stroke] {
    stroke: #fff;
}

body.lampa-modern-ui .menu__item.focus .menu__ico path[fill],
body.lampa-modern-ui .menu__item.focus .menu__ico rect[fill],
body.lampa-modern-ui .menu__item.focus .menu__ico circle[fill],
body.lampa-modern-ui .menu__item.traverse .menu__ico path[fill],
body.lampa-modern-ui .menu__item.traverse .menu__ico rect[fill],
body.lampa-modern-ui .menu__item.traverse .menu__ico circle[fill],
body.lampa-modern-ui .menu__item.hover .menu__ico path[fill],
body.lampa-modern-ui .menu__item.hover .menu__ico rect[fill],
body.lampa-modern-ui .menu__item.hover .menu__ico circle[fill] {
    fill: #fff;
}

body.lampa-modern-ui .menu__text {
    font-weight: 520;
    letter-spacing: -0.01em;
}

/* Карточки */
body.lampa-modern-ui .card {
    transform-origin: center center;
    transition:
        transform var(--lmui-normal) var(--lmui-ease),
        opacity var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .card__view {
    margin-bottom: 0.85em;
    border-radius: var(--lmui-radius-md);
    background: rgba(255, 255, 255, 0.045);
    box-shadow: 0 0.6em 1.5em rgba(0, 0, 0, 0.18);
    overflow: visible;
    transition:
        box-shadow var(--lmui-normal) var(--lmui-ease),
        background-color var(--lmui-normal) var(--lmui-ease);
}

body.lampa-modern-ui .card__img,
body.lampa-modern-ui .card__filter,
body.lampa-modern-ui .card__textbox {
    border-radius: var(--lmui-radius-md);
}

body.lampa-modern-ui .card__promo {
    border-bottom-left-radius: var(--lmui-radius-md);
    border-bottom-right-radius: var(--lmui-radius-md);
}

body.lampa-modern-ui .card__title {
    font-weight: 590;
    letter-spacing: -0.018em;
    line-height: 1.25;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    max-height: 3.2em;
}

body.lampa-modern-ui .card__age {
    color: var(--lmui-text-muted);
}

body.lampa-modern-ui .card__vote,
body.lampa-modern-ui .card__marker,
body.lampa-modern-ui .card__icons-inner,
body.lampa-modern-ui .card-watched {
    background: rgba(8, 10, 15, 0.76);
    border: 0.08em solid rgba(255, 255, 255, 0.12);
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
}

body.lampa-modern-ui .card.focus,
body.lampa-modern-ui .card.hover {
    transform: translate3d(0, -0.28em, 0) scale(1.035);
    z-index: 3;
}

body.lampa-modern-ui .card.focus .card__view,
body.lampa-modern-ui .card.hover .card__view {
    box-shadow: var(--lmui-shadow-focus);
}

body.lampa-modern-ui .card.focus .card__view::after,
body.lampa-modern-ui .card.hover .card__view::after {
    top: -0.16em;
    left: -0.16em;
    right: -0.16em;
    bottom: -0.16em;
    border-width: 0.16em;
    border-color: rgba(255, 255, 255, 0.94);
    border-radius: calc(var(--lmui-radius-md) + 0.16em);
    box-shadow: 0 0 0 0.12em rgba(var(--lmui-accent-rgb), 0.72);
}

body.lampa-modern-ui .card.hover .card__view::after {
    border-color: rgba(255, 255, 255, 0.64);
}

/* Плотность каталога */
body.lampa-modern-ui.lmui-density-compact .card:not(.card--wide):not(.card--collection) {
    width: 11.35em;
}

body.lampa-modern-ui.lmui-density-compact .card__title {
    font-size: 1.18em;
}

body.lampa-modern-ui.lmui-density-compact .card__view {
    margin-bottom: 0.65em;
}

/* Кнопки и интерактивные элементы */
body.lampa-modern-ui .simple-button,
body.lampa-modern-ui .full-start__button {
    border: 0.08em solid var(--lmui-border);
    border-radius: 999em;
    background: rgba(255, 255, 255, 0.075);
    transition:
        transform var(--lmui-fast) var(--lmui-ease),
        background-color var(--lmui-fast) var(--lmui-ease),
        border-color var(--lmui-fast) var(--lmui-ease),
        color var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .simple-button.focus,
body.lampa-modern-ui .full-start__button.focus,
body.lampa-modern-ui .simple-button.hover,
body.lampa-modern-ui .full-start__button.hover {
    color: #fff;
    background: linear-gradient(135deg, var(--lmui-accent), var(--lmui-accent-2));
    border-color: rgba(255, 255, 255, 0.70);
    transform: translateY(-0.1em) scale(1.025);
}

/* Экран фильма */
body.lampa-modern-ui .full-start-new__poster,
body.lampa-modern-ui .full-start-new__img {
    border-radius: var(--lmui-radius-lg);
}

body.lampa-modern-ui .full-start-new__poster {
    box-shadow: var(--lmui-shadow);
    border: 0.08em solid var(--lmui-border);
    overflow: hidden;
}

body.lampa-modern-ui .full-start-new__title {
    font-weight: 720;
    letter-spacing: -0.038em;
    line-height: 1.08;
    text-wrap: balance;
}

body.lampa-modern-ui .full-start-new__head,
body.lampa-modern-ui .full-start-new__description {
    color: var(--lmui-text-muted);
}

body.lampa-modern-ui .full-start-new__description {
    line-height: 1.55;
}

body.lampa-modern-ui .full-start-new__details > * {
    border-radius: 999em;
}

/* Настройки, модальные окна и выбор */
body.lampa-modern-ui .settings__content,
body.lampa-modern-ui .selectbox__content,
body.lampa-modern-ui .modal__content,
body.lampa-modern-ui .settings-input__content,
body.lampa-modern-ui .navigation-bar__body {
    color: var(--lmui-text);
    background: var(--lmui-panel) !important;
    border: 0.08em solid var(--lmui-border);
    box-shadow: var(--lmui-shadow);
}

body.lampa-modern-ui .settings__content,
body.lampa-modern-ui .selectbox__content,
body.lampa-modern-ui .modal__content {
    border-radius: var(--lmui-radius-lg);
}

body.lampa-modern-ui .settings__title,
body.lampa-modern-ui .selectbox__title,
body.lampa-modern-ui .modal__title {
    font-weight: 700;
    letter-spacing: -0.025em;
}

body.lampa-modern-ui .settings-folder,
body.lampa-modern-ui .settings-param,
body.lampa-modern-ui .selectbox-item {
    border: 0.08em solid transparent;
    transition:
        transform var(--lmui-fast) var(--lmui-ease),
        background-color var(--lmui-fast) var(--lmui-ease),
        border-color var(--lmui-fast) var(--lmui-ease),
        color var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .settings-folder.focus,
body.lampa-modern-ui .settings-param.focus,
body.lampa-modern-ui .selectbox-item.focus {
    color: #fff;
    background: rgba(var(--lmui-accent-rgb), 0.26) !important;
    border-color: rgba(var(--lmui-accent-rgb), 0.58);
    transform: translateX(0.16em);
}

body.lampa-modern-ui .settings-param__descr,
body.lampa-modern-ui .settings-param-title > span {
    color: var(--lmui-text-muted);
    opacity: 1;
}

body.lampa-modern-ui .settings-param__value {
    color: var(--lmui-accent);
    font-weight: 620;
}

/* Нижняя навигация телефона */
body.lampa-modern-ui .navigation-bar {
    padding-left: 0.8em;
    padding-right: 0.8em;
    padding-bottom: 0.8em;
}

body.lampa-modern-ui .navigation-bar__body {
    border-radius: 1.6em;
    padding: 0.85em 0.7em;
}

body.lampa-modern-ui .navigation-bar__item {
    min-width: 4.1em;
    padding: 0.55em 0.65em;
    border-radius: 1.1em;
    transition:
        transform var(--lmui-fast) var(--lmui-ease),
        background-color var(--lmui-fast) var(--lmui-ease),
        color var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .navigation-bar__item.focus,
body.lampa-modern-ui .navigation-bar__item.active {
    color: #fff;
    background: rgba(var(--lmui-accent-rgb), 0.25);
    transform: translateY(-0.08em);
}

/* Скролл и разделители */
body.lampa-modern-ui .menu__split {
    border-color: var(--lmui-border);
}

body.lampa-modern-ui ::-webkit-scrollbar {
    width: 0.45em;
    height: 0.45em;
}

body.lampa-modern-ui ::-webkit-scrollbar-thumb {
    border-radius: 999em;
    background: rgba(var(--lmui-accent-rgb), 0.46);
}

body.lampa-modern-ui ::-webkit-scrollbar-track {
    background: transparent;
}

/* TV: крупный фокус и безопасные поля */
@media screen and (min-width: 768px) and (pointer: coarse),
       screen and (min-width: 1000px) {
    body.lampa-modern-ui .menu__item {
        min-height: 2.8em;
    }

    body.lampa-modern-ui .head__action {
        width: 3em;
        height: 3em;
    }

    body.lampa-modern-ui .card.focus,
    body.lampa-modern-ui .card.hover {
        transform: translate3d(0, -0.32em, 0) scale(1.045);
    }

    body.lampa-modern-ui .full-start-new__description {
        max-width: 54em;
    }
}

/* Телефон и узкое окно */
@media screen and (max-width: 580px) {
    body.lampa-modern-ui {
        --lmui-radius-md: 0.92em;
        --lmui-radius-lg: 1.25em;
    }

    body.lampa-modern-ui::before {
        background:
            radial-gradient(90% 44% at 50% 0%, rgba(var(--lmui-accent-rgb), 0.14), transparent 72%),
            linear-gradient(180deg, #10131d 0%, #080a0f 56%, #06070a 100%);
    }

    body.lampa-modern-ui .head__body {
        padding-top: 0.55em;
        padding-bottom: 0.65em;
    }

    body.lampa-modern-ui .head__title {
        font-size: 1.45em;
    }

    body.lampa-modern-ui .card:not(.card--wide):not(.card--collection) {
        width: 42vw;
        min-width: 8.9em;
        max-width: 11.4em;
    }

    body.lampa-modern-ui.lmui-density-compact .card:not(.card--wide):not(.card--collection) {
        width: 38vw;
        min-width: 8.2em;
        max-width: 10.2em;
    }

    body.lampa-modern-ui .card--wide {
        width: 78vw;
        max-width: 26em;
    }

    body.lampa-modern-ui .card__title {
        font-size: 1.08em;
        line-height: 1.24;
    }

    body.lampa-modern-ui .card.focus,
    body.lampa-modern-ui .card.hover {
        transform: translate3d(0, -0.12em, 0) scale(1.018);
    }

    body.lampa-modern-ui .full-start-new__right {
        border-top-left-radius: var(--lmui-radius-lg);
        border-top-right-radius: var(--lmui-radius-lg);
        background: linear-gradient(180deg, rgba(8, 10, 15, 0.88) 0%, rgba(8, 10, 15, 0.18) 78%, transparent 100%);
    }

    body.lampa-modern-ui .full-start-new__title {
        font-size: 2.35em;
        -webkit-line-clamp: 3;
        line-clamp: 3;
    }

    body.lampa-modern-ui .full-start-new__tagline {
        font-size: 1.28em;
    }

    body.lampa-modern-ui .full-start-new__description {
        width: 100%;
        font-size: 1.06em;
        -webkit-line-clamp: 5;
        line-clamp: 5;
    }

    body.lampa-modern-ui .settings__content,
    body.lampa-modern-ui .selectbox__content,
    body.lampa-modern-ui .modal__content {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        border-left: 0;
        border-right: 0;
        border-bottom: 0;
    }

    body.lampa-modern-ui .settings-folder,
    body.lampa-modern-ui .settings-param {
        padding-left: 1.35em;
        padding-right: 1.35em;
    }

    body.lampa-modern-ui .navigation-bar__label {
        font-size: 0.8em;
        margin-top: 0.55em;
    }
}

@supports (padding-bottom: env(safe-area-inset-bottom)) {
    body.lampa-modern-ui.true--mobile .navigation-bar {
        padding-bottom: calc(0.7em + env(safe-area-inset-bottom));
    }
}

/* Системная настройка уменьшения движения имеет приоритет. */
@media (prefers-reduced-motion: reduce) {
    body.lampa-modern-ui,
    body.lampa-modern-ui * {
        animation-duration: 1ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 1ms !important;
        scroll-behavior: auto !important;
    }
}
`;

    function normalizeBoolean(value, fallback) {
        if (value === undefined || value === null || value === '') return fallback;
        return value === true || value === 1 || value === '1' || value === 'true';
    }

    function getStorage(name, fallback) {
        try {
            if (window.Lampa && Lampa.Storage && typeof Lampa.Storage.get === 'function') {
                return Lampa.Storage.get(name, fallback);
            }
        } catch (error) {
            console.warn('[Lampa Modern UI] Storage.get failed:', error);
        }
        return fallback;
    }

    function removeThemeClasses(body) {
        var classes = Array.prototype.slice.call(body.classList);
        classes.forEach(function (name) {
            if (name === 'lampa-modern-ui' || name.indexOf('lmui-') === 0) {
                body.classList.remove(name);
            }
        });
    }

    function applyTheme() {
        var body = document.body;
        if (!body) return;

        removeThemeClasses(body);

        var enabled = normalizeBoolean(getStorage(KEYS.enabled, true), true);
        if (!enabled) return;

        var accent = String(getStorage(KEYS.accent, 'violet') || 'violet');
        var motion = String(getStorage(KEYS.motion, 'balanced') || 'balanced');
        var density = String(getStorage(KEYS.density, 'comfortable') || 'comfortable');
        var background = String(getStorage(KEYS.background, 'soft') || 'soft');

        var allowedAccent = ['violet', 'blue', 'emerald', 'amber'];
        var allowedMotion = ['balanced', 'smooth', 'reduced'];
        var allowedDensity = ['comfortable', 'compact'];
        var allowedBackground = ['soft', 'minimal'];

        if (allowedAccent.indexOf(accent) === -1) accent = 'violet';
        if (allowedMotion.indexOf(motion) === -1) motion = 'balanced';
        if (allowedDensity.indexOf(density) === -1) density = 'comfortable';
        if (allowedBackground.indexOf(background) === -1) background = 'soft';

        body.classList.add(
            'lampa-modern-ui',
            'lmui-accent-' + accent,
            'lmui-motion-' + motion,
            'lmui-density-' + density,
            'lmui-background-' + background
        );
    }

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;

        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.type = 'text/css';
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    function addSettings() {
        if (!window.Lampa || !Lampa.SettingsApi) {
            console.warn('[Lampa Modern UI] SettingsApi is unavailable. Theme will work without a settings page.');
            return;
        }

        var icon = '<svg viewBox="0 0 32 32" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<rect x="4" y="4" width="24" height="24" rx="7" stroke="currentColor" stroke-width="2"/>' +
            '<path d="M9 20.5L13.2 16.3L16.2 19.3L23 12.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
            '<circle cx="22.7" cy="12.3" r="2.1" fill="currentColor"/>' +
            '</svg>';

        try {
            Lampa.SettingsApi.addComponent({
                component: PLUGIN_ID,
                name: 'Modern UI',
                icon: icon
            });

            Lampa.SettingsApi.addParam({
                component: PLUGIN_ID,
                param: {
                    name: KEYS.enabled,
                    type: 'trigger',
                    default: true
                },
                field: {
                    name: 'Включить Modern UI',
                    description: 'Только оформление. Поиск, карточки, навигация и воспроизведение не изменяются.'
                },
                onChange: applyTheme
            });

            Lampa.SettingsApi.addParam({
                component: PLUGIN_ID,
                param: {
                    name: KEYS.accent,
                    type: 'select',
                    values: {
                        violet: 'Фиолетовый',
                        blue: 'Синий',
                        emerald: 'Изумрудный',
                        amber: 'Янтарный'
                    },
                    default: 'violet'
                },
                field: {
                    name: 'Акцентный цвет',
                    description: 'Цвет фокуса, активных кнопок и выделенных элементов.'
                },
                onChange: applyTheme
            });

            Lampa.SettingsApi.addParam({
                component: PLUGIN_ID,
                param: {
                    name: KEYS.motion,
                    type: 'select',
                    values: {
                        balanced: 'Сбалансированные',
                        smooth: 'Более плавные',
                        reduced: 'Минимальные'
                    },
                    default: 'balanced'
                },
                field: {
                    name: 'Микроанимации',
                    description: 'Сбалансированный режим рекомендован для Android TV.'
                },
                onChange: applyTheme
            });

            Lampa.SettingsApi.addParam({
                component: PLUGIN_ID,
                param: {
                    name: KEYS.density,
                    type: 'select',
                    values: {
                        comfortable: 'Комфортная',
                        compact: 'Компактная'
                    },
                    default: 'comfortable'
                },
                field: {
                    name: 'Плотность карточек',
                    description: 'Компактный режим показывает больше карточек без изменения содержимого.'
                },
                onChange: applyTheme
            });

            Lampa.SettingsApi.addParam({
                component: PLUGIN_ID,
                param: {
                    name: KEYS.background,
                    type: 'select',
                    values: {
                        soft: 'Мягкий',
                        minimal: 'Минимальный'
                    },
                    default: 'soft'
                },
                field: {
                    name: 'Фон',
                    description: 'Минимальный режим легче для слабых телевизоров.'
                },
                onChange: applyTheme
            });
        } catch (error) {
            console.error('[Lampa Modern UI] Failed to register settings:', error);
        }
    }

    function start() {
        if (window[READY_FLAG]) return;
        window[READY_FLAG] = true;

        injectStyle();
        addSettings();
        applyTheme();

        if (window.Lampa && Lampa.Manifest && Number(Lampa.Manifest.app_digital || 0) < 300) {
            console.warn('[Lampa Modern UI] This build targets Lampa 3.0+; current app_digital:', Lampa.Manifest.app_digital);
        }

        console.info('[Lampa Modern UI] v' + VERSION + ' loaded');
    }

    if (window.appready) {
        start();
    } else if (window.Lampa && Lampa.Listener && typeof Lampa.Listener.follow === 'function') {
        Lampa.Listener.follow('app', function (event) {
            if (event && event.type === 'ready') start();
        });
    } else {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    }
})();
