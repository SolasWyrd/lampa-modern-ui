(function () {
    'use strict';

    var PLUGIN_ID = 'lampa_modern_ui';
    var STYLE_ID = 'lampa-modern-ui-style';
    var READY_FLAG = '__lampa_modern_ui_v040_ready__';
    var VERSION = '0.4.0';
    var BACKUP_KEY = 'lmui_core_backup_v2';
    var LEGACY_BACKUP_KEY = 'lmui_core_backup_v1';

    var KEYS = {
        enabled: 'lmui_enabled',
        accent: 'lmui_accent',
        motion: 'lmui_motion',
        density: 'lmui_density',
        performance: 'lmui_performance',
        focus: 'lmui_focus'
    };

    /* Значения по умолчанию подтверждены HAR lampa.mx от 2026-07-04. */
    var CORE_DEFAULTS = {
        animation: true,
        background: true,
        background_type: 'simple',
        glass_style: false,
        hide_outside_the_screen: true,
        cache_images: false,
        scroll_type: 'css',
        card_views_type: 'preload',
        poster_size: 'w300',
        interface_sound_play: false
    };

    var CSS = String.raw`
/* Lampa Modern UI 0.4.0
 * Единый визуальный слой без изменения DOM, навигации, поиска и воспроизведения.
 * Акцент приглушён; стандартные рывковые keyframe-анимации Lampa заменены лёгкими переходами.
 * Дорогие blur/backdrop-filter не используются.
 */

body.lampa-modern-ui {
    --lmui-accent: #72a7ff;
    --lmui-accent-rgb: 114, 167, 255;
    --lmui-accent-2: #8d78ff;
    --lmui-bg: #070910;
    --lmui-bg-elevated: #10141f;
    --lmui-surface: rgba(17, 21, 31, 0.97);
    --lmui-surface-soft: rgba(255, 255, 255, 0.065);
    --lmui-surface-hover: rgba(255, 255, 255, 0.105);
    --lmui-border: rgba(255, 255, 255, 0.105);
    --lmui-border-strong: rgba(255, 255, 255, 0.22);
    --lmui-text: #f7f9fd;
    --lmui-muted: rgba(230, 235, 245, 0.68);
    --lmui-faint: rgba(230, 235, 245, 0.46);
    --lmui-radius-sm: 0.72em;
    --lmui-radius-md: 1.02em;
    --lmui-radius-lg: 1.45em;
    --lmui-fast: 105ms;
    --lmui-normal: 155ms;
    --lmui-slow: 190ms;
    --lmui-page: 145ms;
    --lmui-ease: cubic-bezier(0.2, 0.72, 0.2, 1);
    --lmui-focus-bg: rgba(255, 255, 255, 0.095);
    --lmui-focus-border: rgba(255, 255, 255, 0.42);
    --lmui-focus-ring: 0 0 0 0.09em rgba(255, 255, 255, 0.66), 0 0 0 0.17em rgba(var(--lmui-accent-rgb), 0.18);
    --lmui-focus-shadow: 0 0.72em 1.85em rgba(0, 0, 0, 0.34);
    --lmui-text-display: clamp(2.2em, 4.2vw, 4.45em);
    --lmui-text-heading: clamp(1.58em, 2.3vw, 2.45em);
    --lmui-text-section: clamp(1.18em, 1.45vw, 1.52em);
    --lmui-text-body: clamp(1em, 1.05vw, 1.16em);
    --lmui-text-caption: clamp(0.82em, 0.82vw, 0.94em);

    color: var(--lmui-text);
    background: var(--lmui-bg) !important;
    font-family: "SegoeUI", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
}

body.lampa-modern-ui.lmui-accent-azure {
    --lmui-accent: #72a7ff;
    --lmui-accent-rgb: 114, 167, 255;
    --lmui-accent-2: #8d78ff;
}

body.lampa-modern-ui.lmui-accent-violet {
    --lmui-accent: #a28bff;
    --lmui-accent-rgb: 162, 139, 255;
    --lmui-accent-2: #6f8dff;
}

body.lampa-modern-ui.lmui-accent-emerald {
    --lmui-accent: #5bd7ae;
    --lmui-accent-rgb: 91, 215, 174;
    --lmui-accent-2: #5da8ff;
}

body.lampa-modern-ui.lmui-accent-coral {
    --lmui-accent: #ff8d7a;
    --lmui-accent-rgb: 255, 141, 122;
    --lmui-accent-2: #ffbd69;
}

body.lampa-modern-ui.lmui-motion-cinematic {
    --lmui-fast: 130ms;
    --lmui-normal: 190ms;
    --lmui-slow: 235ms;
    --lmui-page: 180ms;
}

body.lampa-modern-ui.lmui-motion-minimal {
    --lmui-fast: 70ms;
    --lmui-normal: 90ms;
    --lmui-slow: 110ms;
    --lmui-page: 95ms;
}

/* Дешёвый статический фон: без canvas, blur и постоянной анимации. */
body.lampa-modern-ui::before {
    content: "";
    position: fixed;
    inset: 0;
    z-index: -2;
    pointer-events: none;
    background:
        radial-gradient(75% 55% at 9% -8%, rgba(var(--lmui-accent-rgb), 0.18), transparent 68%),
        linear-gradient(145deg, #111624 0%, #090c14 46%, #05070c 100%);
}

body.lampa-modern-ui::after {
    content: "";
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    opacity: 0.45;
    background-image: linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
    background-size: 4.5em 4.5em;
    -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.38), transparent 62%);
    mask-image: linear-gradient(to bottom, rgba(0,0,0,0.38), transparent 62%);
}

/* Встроенный canvas-фон скрывается. Профиль производительности также выключает его через Storage. */
body.lampa-modern-ui .background {
    display: none !important;
}

/* Убираем наиболее дорогой эффект стандартной темы. */
body.lampa-modern-ui .selectbox__content,
body.lampa-modern-ui .settings__content,
body.lampa-modern-ui .settings-input__content,
body.lampa-modern-ui .modal__content,
body.lampa-modern-ui .navigation-bar__body,
body.lampa-modern-ui .normalization,
body.lampa-modern-ui .bell__item {
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
}

/* Шапка */
body.lampa-modern-ui .head {
    background: linear-gradient(180deg, rgba(7, 9, 16, 0.97) 0%, rgba(7, 9, 16, 0.78) 68%, transparent 100%);
}

body.lampa-modern-ui .head__body {
    padding-top: 0.65em;
    padding-bottom: 0.8em;
}

body.lampa-modern-ui .head__title {
    color: var(--lmui-text);
    font-size: var(--lmui-text-section);
    font-weight: 650;
    letter-spacing: -0.026em;
    line-height: 1.18;
}

body.lampa-modern-ui .head__time-date,
body.lampa-modern-ui .head__time-week {
    color: var(--lmui-muted);
}

body.lampa-modern-ui .head__action {
    margin-left: 0.8em;
    border: 0.08em solid var(--lmui-border);
    border-radius: 0.92em;
    background: var(--lmui-surface-soft);
    transition: transform var(--lmui-fast) var(--lmui-ease), background-color var(--lmui-fast) var(--lmui-ease), border-color var(--lmui-fast) var(--lmui-ease), color var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .head__action.focus,
body.lampa-modern-ui .head__action.hover {
    color: #fff;
    border-color: var(--lmui-focus-border);
    background: var(--lmui-focus-bg);
    transform: none;
    box-shadow: var(--lmui-focus-ring);
}

/* Боковое меню */
body.lampa-modern-ui .wrap__left {
    background: linear-gradient(90deg, rgba(7,9,16,0.98), rgba(7,9,16,0.88) 78%, transparent);
}

body.lampa-modern-ui .menu__list {
    padding-left: 0.72em;
    padding-right: 0.72em;
}

body.lampa-modern-ui .menu__split {
    width: auto;
    margin: 0.8em 1.25em;
    border-color: var(--lmui-border);
}

body.lampa-modern-ui .menu__item {
    min-height: 3.05em;
    padding: 0.78em 1.1em;
    border: 0.08em solid transparent;
    border-radius: var(--lmui-radius-md);
    color: var(--lmui-muted);
    transition: transform var(--lmui-fast) var(--lmui-ease), background-color var(--lmui-fast) var(--lmui-ease), border-color var(--lmui-fast) var(--lmui-ease), color var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .menu__ico {
    width: 1.42em;
    height: 1.42em;
    margin-right: 1.05em;
}

body.lampa-modern-ui .menu__text {
    font-weight: 580;
    letter-spacing: -0.012em;
}

body.lampa-modern-ui .menu__item.focus,
body.lampa-modern-ui .menu__item.traverse,
body.lampa-modern-ui .menu__item.hover {
    color: #fff;
    border-color: rgba(255,255,255,0.24);
    background: rgba(255,255,255,0.075);
    transform: none;
}

body.lampa-modern-ui .menu__item.focus::before,
body.lampa-modern-ui .menu__item.hover::before {
    content: "";
    position: absolute;
    left: 0.34em;
    top: 23%;
    bottom: 23%;
    width: 0.17em;
    border-radius: 999em;
    background: rgba(var(--lmui-accent-rgb), 0.72);
}

body.lampa-modern-ui .menu__item.focus .menu__ico [stroke],
body.lampa-modern-ui .menu__item.traverse .menu__ico [stroke],
body.lampa-modern-ui .menu__item.hover .menu__ico [stroke] { stroke: #fff; }
body.lampa-modern-ui .menu__item.focus .menu__ico path[fill],
body.lampa-modern-ui .menu__item.focus .menu__ico rect[fill],
body.lampa-modern-ui .menu__item.focus .menu__ico circle[fill],
body.lampa-modern-ui .menu__item.traverse .menu__ico path[fill],
body.lampa-modern-ui .menu__item.traverse .menu__ico rect[fill],
body.lampa-modern-ui .menu__item.traverse .menu__ico circle[fill],
body.lampa-modern-ui .menu__item.hover .menu__ico path[fill],
body.lampa-modern-ui .menu__item.hover .menu__ico rect[fill],
body.lampa-modern-ui .menu__item.hover .menu__ico circle[fill] { fill: #fff; }

/* Заголовки рядов */
body.lampa-modern-ui .items-line {
    margin-bottom: 0.45em;
}

body.lampa-modern-ui .items-line__head {
    min-height: 3.15em;
    margin-bottom: 0.3em;
    position: relative;
}

body.lampa-modern-ui .items-line__head::before {
    content: "";
    width: 0.2em;
    height: 1.35em;
    margin-right: 0.62em;
    border-radius: 999em;
    background: rgba(var(--lmui-accent-rgb), 0.72);
    box-shadow: none;
}

body.lampa-modern-ui .items-line__title {
    color: var(--lmui-text);
    font-size: var(--lmui-text-section);
    font-weight: 680;
    letter-spacing: -0.025em;
    line-height: 1.18;
}

body.lampa-modern-ui .items-line__more {
    color: var(--lmui-muted);
    border: 0.08em solid transparent;
    border-radius: 999em;
    padding: 0.55em 0.9em;
    transition: transform var(--lmui-fast) var(--lmui-ease), background-color var(--lmui-fast) var(--lmui-ease), border-color var(--lmui-fast) var(--lmui-ease), color var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .items-line__more.focus,
body.lampa-modern-ui .items-line__more.hover {
    color: #fff;
    border-color: rgba(255,255,255,0.28);
    background: rgba(255,255,255,0.075);
    transform: none;
}

/* Карточки: тени только на фокусе, чтобы не перегружать paint. */
body.lampa-modern-ui .card {
    transform-origin: center 54%;
    transition: transform var(--lmui-normal) var(--lmui-ease), opacity var(--lmui-fast) linear;
}

body.lampa-modern-ui .card__view {
    margin-bottom: 0.72em;
    overflow: visible;
    border-radius: var(--lmui-radius-md);
    background: var(--lmui-bg-elevated);
    transition: box-shadow var(--lmui-normal) var(--lmui-ease), background-color var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .card__view::after {
    transition: border-color var(--lmui-fast) var(--lmui-ease), box-shadow var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .card__img,
body.lampa-modern-ui .card__filter,
body.lampa-modern-ui .card__textbox,
body.lampa-modern-ui .card__view::before {
    border-radius: var(--lmui-radius-md);
}

body.lampa-modern-ui .card__img {
    transition: opacity var(--lmui-normal) linear, transform var(--lmui-normal) var(--lmui-ease);
}

body.lampa-modern-ui .card__title {
    color: var(--lmui-text);
    font-weight: 610;
    letter-spacing: -0.018em;
    line-height: 1.26;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
}

body.lampa-modern-ui .card__age {
    color: var(--lmui-faint);
}

body.lampa-modern-ui .card__vote,
body.lampa-modern-ui .card__marker,
body.lampa-modern-ui .card__icons-inner,
body.lampa-modern-ui .card-watched,
body.lampa-modern-ui .card__type {
    border: 0.08em solid rgba(255,255,255,0.13);
    background: rgba(7,9,16,0.88);
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
}

body.lampa-modern-ui .card.focus,
body.lampa-modern-ui .card.hover {
    z-index: 4;
    transform: none;
}

body.lampa-modern-ui .card.focus .card__img,
body.lampa-modern-ui .card.hover .card__img {
    transform: scale(1.004);
}

body.lampa-modern-ui .card.focus .card__view,
body.lampa-modern-ui .card.hover .card__view {
    box-shadow: var(--lmui-focus-shadow);
}

body.lampa-modern-ui .card.focus .card__view::after,
body.lampa-modern-ui .card.hover .card__view::after {
    top: -0.14em;
    right: -0.14em;
    bottom: -0.14em;
    left: -0.14em;
    z-index: 2;
    border: 0.11em solid rgba(255,255,255,0.78);
    border-radius: calc(var(--lmui-radius-md) + 0.11em);
    box-shadow: 0 0 0 0.08em rgba(var(--lmui-accent-rgb),0.18);
}

body.lampa-modern-ui .card.hover .card__view::after {
    border-color: rgba(255,255,255,0.52);
}

body.lampa-modern-ui.lmui-density-compact .card:not(.card--wide):not(.card--collection) {
    width: 11.2em;
}

body.lampa-modern-ui.lmui-density-compact .card__view {
    margin-bottom: 0.55em;
}

body.lampa-modern-ui.lmui-density-compact .card__title {
    font-size: 1.13em;
}

/* Кнопки */
body.lampa-modern-ui .simple-button,
body.lampa-modern-ui .full-start__button {
    border: 0.08em solid var(--lmui-border);
    border-radius: 999em;
    background: var(--lmui-surface-soft);
    color: var(--lmui-text);
    transition: transform var(--lmui-fast) var(--lmui-ease), background-color var(--lmui-fast) var(--lmui-ease), border-color var(--lmui-fast) var(--lmui-ease), color var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .simple-button.focus,
body.lampa-modern-ui .simple-button.hover,
body.lampa-modern-ui .full-start__button.focus,
body.lampa-modern-ui .full-start__button.hover {
    color: #fff;
    border-color: var(--lmui-focus-border);
    background: var(--lmui-focus-bg);
    transform: none;
    box-shadow: var(--lmui-focus-ring);
}

body.lampa-modern-ui .full-descr__tag,
body.lampa-modern-ui .tag-count,
body.lampa-modern-ui .full-review,
body.lampa-modern-ui .full-review-add {
    border-color: var(--lmui-border);
    border-radius: var(--lmui-radius-sm);
    background: rgba(255,255,255,0.05);
    transition: background-color var(--lmui-fast) var(--lmui-ease), border-color var(--lmui-fast) var(--lmui-ease), color var(--lmui-fast) var(--lmui-ease), box-shadow var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .full-descr__tag.focus,
body.lampa-modern-ui .full-descr__tag.hover,
body.lampa-modern-ui .tag-count.focus,
body.lampa-modern-ui .tag-count.hover,
body.lampa-modern-ui .full-review.focus,
body.lampa-modern-ui .full-review.hover,
body.lampa-modern-ui .full-review-add.focus,
body.lampa-modern-ui .full-review-add.hover {
    color: #fff;
    border-color: var(--lmui-focus-border);
    background: var(--lmui-focus-bg);
    box-shadow: var(--lmui-focus-ring);
}

/* Карточка фильма */
body.lampa-modern-ui .full-start-new {
    padding-bottom: 4.5em;
}

body.lampa-modern-ui .full-start-new__left {
    margin-right: 2.55em;
}

body.lampa-modern-ui .full-start-new__poster,
body.lampa-modern-ui .full-start-new__img {
    border-radius: var(--lmui-radius-lg);
}

body.lampa-modern-ui .full-start-new__poster {
    overflow: hidden;
    border: 0.08em solid var(--lmui-border);
    background: var(--lmui-bg-elevated);
    box-shadow: 0 1.25em 3.2em rgba(0,0,0,0.42);
}

body.lampa-modern-ui .full-start-new__title {
    color: var(--lmui-text);
    font-size: var(--lmui-text-display);
    font-weight: 730;
    letter-spacing: -0.042em;
    line-height: 1.04;
    text-wrap: balance;
}

body.lampa-modern-ui .full-start-new__head,
body.lampa-modern-ui .full-start-new__tagline,
body.lampa-modern-ui .full-start-new__description {
    color: var(--lmui-muted);
}

body.lampa-modern-ui .full-start-new__description {
    width: min(72%, 58em);
    font-size: var(--lmui-text-body);
    line-height: 1.58;
    text-wrap: pretty;
}

body.lampa-modern-ui .full-start-new__details {
    gap: 0.3em;
    margin-left: 0;
}

body.lampa-modern-ui .full-start-new__details > * {
    margin: 0.15em 0.25em 0.15em 0;
    padding: 0.42em 0.72em;
    border: 0.08em solid var(--lmui-border);
    border-radius: 999em;
    background: rgba(255,255,255,0.055);
}

body.lampa-modern-ui .full-start-new__buttons {
    gap: 0.4em;
}

/* Настройки, selectbox, modal */
body.lampa-modern-ui .settings__content,
body.lampa-modern-ui .selectbox__content,
body.lampa-modern-ui .modal__content,
body.lampa-modern-ui .settings-input__content,
body.lampa-modern-ui .navigation-bar__body {
    color: var(--lmui-text);
    border: 0.08em solid var(--lmui-border);
    background: var(--lmui-surface) !important;
    box-shadow: 0 1.4em 4.2em rgba(0,0,0,0.48);
}

body.lampa-modern-ui .settings__content,
body.lampa-modern-ui .selectbox__content,
body.lampa-modern-ui .modal__content {
    border-radius: var(--lmui-radius-lg);
}

body.lampa-modern-ui .settings__title,
body.lampa-modern-ui .selectbox__title,
body.lampa-modern-ui .modal__title {
    font-weight: 720;
    letter-spacing: -0.028em;
}

body.lampa-modern-ui .settings-folder,
body.lampa-modern-ui .settings-param,
body.lampa-modern-ui .selectbox-item {
    border: 0.08em solid transparent;
    border-radius: var(--lmui-radius-sm);
    transition: transform var(--lmui-fast) var(--lmui-ease), background-color var(--lmui-fast) var(--lmui-ease), border-color var(--lmui-fast) var(--lmui-ease), color var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .settings-folder.focus,
body.lampa-modern-ui .settings-param.focus,
body.lampa-modern-ui .selectbox-item.focus {
    color: #fff;
    border-color: rgba(255,255,255,0.28);
    background: rgba(255,255,255,0.075) !important;
    transform: none;
}

body.lampa-modern-ui .settings-param__descr,
body.lampa-modern-ui .settings-param-title > span {
    color: var(--lmui-muted);
    opacity: 1;
}

body.lampa-modern-ui .settings-param__value {
    color: rgba(255,255,255,0.86);
    font-weight: 650;
}

body.lampa-modern-ui .selectbox-item.selected:not(.nomark),
body.lampa-modern-ui .selectbox-item.picked {
    color: var(--lmui-text);
    background: rgba(255,255,255,0.045);
}

body.lampa-modern-ui .selectbox-item.selected:not(.nomark)::after,
body.lampa-modern-ui .selectbox-item.picked::after {
    border-color: rgba(var(--lmui-accent-rgb),0.68);
    opacity: 0.84;
}

/* Мобильная навигация */
body.lampa-modern-ui .navigation-bar {
    padding: 0 0.75em 0.75em;
}

body.lampa-modern-ui .navigation-bar__body {
    padding: 0.68em 0.55em;
    border-radius: 1.42em;
}

body.lampa-modern-ui .navigation-bar__item {
    min-width: 4.2em;
    padding: 0.48em 0.62em;
    border-radius: 1em;
    color: var(--lmui-muted);
    transition: transform var(--lmui-fast) var(--lmui-ease), background-color var(--lmui-fast) var(--lmui-ease), color var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .navigation-bar__item.focus,
body.lampa-modern-ui .navigation-bar__item.active {
    color: #fff;
    background: rgba(255,255,255,0.085);
    transform: none;
}

/* Стабилизация анимаций: отключаем конфликтующие keyframes ядра и оставляем короткие переходы темы. */
body.lampa-modern-ui.advanced--animation:not(.no--animation) .card.focus .card__view,
body.lampa-modern-ui.advanced--animation:not(.no--animation) .card.hover .card__view,
body.lampa-modern-ui.advanced--animation:not(.no--animation) .card-episode.focus .full-episode,
body.lampa-modern-ui.advanced--animation:not(.no--animation) .card-episode.hover .full-episode,
body.lampa-modern-ui.advanced--animation:not(.no--animation) .explorer-card__head-img.focus,
body.lampa-modern-ui.advanced--animation:not(.no--animation) .explorer-card__head-img.hover,
body.lampa-modern-ui.advanced--animation:not(.no--animation) .torrent-item.focus,
body.lampa-modern-ui.advanced--animation:not(.no--animation) .torrent-item.hover,
body.lampa-modern-ui.advanced--animation:not(.no--animation) .head__action.focus,
body.lampa-modern-ui.advanced--animation:not(.no--animation) .menu__item.focus,
body.lampa-modern-ui.advanced--animation:not(.no--animation) .simple-button.focus,
body.lampa-modern-ui.advanced--animation:not(.no--animation) .full-start__button.focus,
body.lampa-modern-ui.advanced--animation:not(.no--animation) .full-person.focus .full-person__photo,
body.lampa-modern-ui.advanced--animation:not(.no--animation) .settings-folder.focus .settings-folder__icon,
body.lampa-modern-ui.advanced--animation:not(.no--animation) .animate-trigger-enter {
    animation: none !important;
}

@keyframes lmui-page-in {
    from { opacity: 0.88; }
    to { opacity: 1; }
}

@keyframes lmui-sheet-in {
    from { opacity: 0.9; transform: translate3d(0, 0.35em, 0) scale(0.992); }
    to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
}

body.lampa-modern-ui.advanced--animation:not(.no--animation) .activity:not(.activity--load) .activity__body,
body.lampa-modern-ui.advanced--animation:not(.no--animation) .animate-opacity,
body.lampa-modern-ui.advanced--animation:not(.no--animation) .animate-up-content {
    animation: lmui-page-in var(--lmui-page) ease-out both !important;
}

body.lampa-modern-ui.advanced--animation:not(.no--animation) .modal.animate .modal__content,
body.lampa-modern-ui.advanced--animation:not(.no--animation) .selectbox.animate .selectbox__content,
body.lampa-modern-ui.advanced--animation:not(.no--animation) .settings.animate .settings__content {
    animation: lmui-sheet-in var(--lmui-page) var(--lmui-ease) both !important;
}

body.lampa-modern-ui .card,
body.lampa-modern-ui .card__img,
body.lampa-modern-ui .head__action,
body.lampa-modern-ui .menu__item,
body.lampa-modern-ui .simple-button,
body.lampa-modern-ui .full-start__button,
body.lampa-modern-ui .settings-folder,
body.lampa-modern-ui .settings-param,
body.lampa-modern-ui .selectbox-item,
body.lampa-modern-ui .search-source,
body.lampa-modern-ui .search-history-key,
body.lampa-modern-ui .season-episode,
body.lampa-modern-ui .full-episode,
body.lampa-modern-ui .full-person,
body.lampa-modern-ui .notice,
body.lampa-modern-ui .simple-keyboard .hg-button,
body.lampa-modern-ui .torrent-item {
    animation: none !important;
}

/* Три спокойных варианта фокуса. Акцент используется как вторичный сигнал, а не заливка. */
body.lampa-modern-ui.lmui-focus-outline .card.focus,
body.lampa-modern-ui.lmui-focus-outline .card.hover,
body.lampa-modern-ui.lmui-focus-outline .head__action.focus,
body.lampa-modern-ui.lmui-focus-outline .head__action.hover,
body.lampa-modern-ui.lmui-focus-outline .simple-button.focus,
body.lampa-modern-ui.lmui-focus-outline .simple-button.hover,
body.lampa-modern-ui.lmui-focus-outline .full-start__button.focus,
body.lampa-modern-ui.lmui-focus-outline .full-start__button.hover {
    transform: none;
}

body.lampa-modern-ui.lmui-focus-soft .card.focus,
body.lampa-modern-ui.lmui-focus-soft .card.hover {
    transform: translate3d(0, -0.06em, 0) scale(1.008);
}

body.lampa-modern-ui.lmui-focus-soft .menu__item.focus,
body.lampa-modern-ui.lmui-focus-soft .menu__item.hover,
body.lampa-modern-ui.lmui-focus-soft .settings-folder.focus,
body.lampa-modern-ui.lmui-focus-soft .settings-param.focus,
body.lampa-modern-ui.lmui-focus-soft .selectbox-item.focus,
body.lampa-modern-ui.lmui-focus-soft .search-source.focus,
body.lampa-modern-ui.lmui-focus-soft .search-history-key.focus {
    background: rgba(var(--lmui-accent-rgb), 0.075) !important;
    border-color: rgba(var(--lmui-accent-rgb), 0.22);
}

body.lampa-modern-ui.lmui-focus-lift .card.focus,
body.lampa-modern-ui.lmui-focus-lift .card.hover {
    transform: translate3d(0, -0.12em, 0) scale(1.018);
}

body.lampa-modern-ui.lmui-focus-lift .head__action.focus,
body.lampa-modern-ui.lmui-focus-lift .head__action.hover,
body.lampa-modern-ui.lmui-focus-lift .simple-button.focus,
body.lampa-modern-ui.lmui-focus-lift .simple-button.hover,
body.lampa-modern-ui.lmui-focus-lift .full-start__button.focus,
body.lampa-modern-ui.lmui-focus-lift .full-start__button.hover {
    transform: translate3d(0, -0.06em, 0) scale(1.012);
}

/* Поиск */
body.lampa-modern-ui .search-box {
    padding: 0.62em;
    border: 0.08em solid var(--lmui-border);
    border-radius: var(--lmui-radius-lg);
    background: rgba(255,255,255,0.052);
    box-shadow: none;
    transition: background-color var(--lmui-fast) var(--lmui-ease), border-color var(--lmui-fast) var(--lmui-ease), box-shadow var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .search-box--focus {
    border-color: var(--lmui-focus-border);
    background: rgba(255,255,255,0.075);
    box-shadow: var(--lmui-focus-ring);
}

body.lampa-modern-ui .search-box .search__input,
body.lampa-modern-ui .simple-keyboard-input {
    color: var(--lmui-text);
    font-size: var(--lmui-text-body);
    line-height: 1.35;
}

body.lampa-modern-ui .search-looking__text,
body.lampa-modern-ui .search-history-empty {
    color: var(--lmui-muted);
}

body.lampa-modern-ui .search-source,
body.lampa-modern-ui .search-history-key {
    border: 0.08em solid transparent;
    border-radius: 999em;
    background: rgba(255,255,255,0.052);
    color: var(--lmui-muted);
    transition: background-color var(--lmui-fast) var(--lmui-ease), border-color var(--lmui-fast) var(--lmui-ease), color var(--lmui-fast) var(--lmui-ease), transform var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .search-source.active {
    color: var(--lmui-text);
    border-color: rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.085);
}

body.lampa-modern-ui .search-source.focus,
body.lampa-modern-ui .search-history-key.focus {
    color: #fff;
    border-color: var(--lmui-focus-border);
    background: var(--lmui-focus-bg);
    box-shadow: var(--lmui-focus-ring);
}

/* Экран персоны */
body.lampa-modern-ui .person-start__poster,
body.lampa-modern-ui .person-start__img {
    border-radius: var(--lmui-radius-lg);
}

body.lampa-modern-ui .person-start__poster {
    overflow: hidden;
    border: 0.08em solid var(--lmui-border);
    background: var(--lmui-bg-elevated);
    box-shadow: 0 1em 2.6em rgba(0,0,0,0.34);
}

body.lampa-modern-ui .person-start__name {
    color: var(--lmui-text);
    font-size: var(--lmui-text-heading);
    font-weight: 720;
    line-height: 1.08;
    letter-spacing: -0.035em;
    text-wrap: balance;
}

body.lampa-modern-ui .person-start__place,
body.lampa-modern-ui .person-start__descr,
body.lampa-modern-ui .person-start__descr-mobile {
    color: var(--lmui-muted);
    font-size: var(--lmui-text-body);
    line-height: 1.55;
}

body.lampa-modern-ui .person-start__tag,
body.lampa-modern-ui .person-start__icons > div {
    border: 0.08em solid var(--lmui-border);
    border-radius: 999em;
    background: rgba(255,255,255,0.052);
}

/* Сезоны и эпизоды */
body.lampa-modern-ui .season-episode,
body.lampa-modern-ui .full-episode {
    overflow: hidden;
    border: 0.08em solid var(--lmui-border);
    border-radius: var(--lmui-radius-md);
    background: rgba(255,255,255,0.048);
    transition: background-color var(--lmui-fast) var(--lmui-ease), border-color var(--lmui-fast) var(--lmui-ease), transform var(--lmui-fast) var(--lmui-ease), box-shadow var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .season-episode__img,
body.lampa-modern-ui .season-episode__img > img,
body.lampa-modern-ui .full-episode__img,
body.lampa-modern-ui .full-episode__img img {
    border-radius: calc(var(--lmui-radius-md) - 0.08em);
}

body.lampa-modern-ui .season-episode__title,
body.lampa-modern-ui .full-episode__name {
    color: var(--lmui-text);
    font-weight: 640;
    line-height: 1.28;
    letter-spacing: -0.016em;
}

body.lampa-modern-ui .season-episode__time,
body.lampa-modern-ui .season-episode__info,
body.lampa-modern-ui .full-episode__date,
body.lampa-modern-ui .full-episode__num {
    color: var(--lmui-muted);
    font-size: var(--lmui-text-caption);
}

body.lampa-modern-ui .season-episode.focus,
body.lampa-modern-ui .full-episode.focus,
body.lampa-modern-ui .card-episode.focus .full-episode {
    border-color: var(--lmui-focus-border);
    background: rgba(255,255,255,0.082);
    box-shadow: var(--lmui-focus-ring);
}

body.lampa-modern-ui .season-episode.focus::after,
body.lampa-modern-ui .full-episode.focus::after,
body.lampa-modern-ui .card-episode.focus .full-episode::after {
    display: none !important;
}

/* Люди, широкие карточки и коллекции */
body.lampa-modern-ui .full-person__photo,
body.lampa-modern-ui .card--wide .card__view,
body.lampa-modern-ui .card--collection .card__view {
    border-radius: var(--lmui-radius-md);
}

body.lampa-modern-ui .full-person__name {
    color: var(--lmui-text);
    font-weight: 620;
    line-height: 1.25;
}

body.lampa-modern-ui .full-person__role {
    color: var(--lmui-muted);
    font-size: var(--lmui-text-caption);
}

body.lampa-modern-ui .full-person.focus .full-person__photo,
body.lampa-modern-ui .full-person.hover .full-person__photo {
    box-shadow: var(--lmui-focus-ring), var(--lmui-focus-shadow);
}

/* Уведомления */
body.lampa-modern-ui .bell__item,
body.lampa-modern-ui .notice {
    border: 0.08em solid var(--lmui-border);
    border-radius: var(--lmui-radius-md);
    background: var(--lmui-surface) !important;
    box-shadow: 0 0.9em 2.2em rgba(0,0,0,0.32);
}

body.lampa-modern-ui .notice__title,
body.lampa-modern-ui .bell__item-text {
    color: var(--lmui-text);
    font-weight: 640;
}

body.lampa-modern-ui .notice__descr,
body.lampa-modern-ui .notice__time {
    color: var(--lmui-muted);
    line-height: 1.45;
}

body.lampa-modern-ui .notice.focus {
    border-color: var(--lmui-focus-border);
    background: rgba(255,255,255,0.075) !important;
    box-shadow: var(--lmui-focus-ring), var(--lmui-focus-shadow);
}

/* Пустые состояния, ошибки и загрузка */
body.lampa-modern-ui .empty,
body.lampa-modern-ui .error,
body.lampa-modern-ui .loading-layer__box,
body.lampa-modern-ui .empty-filter {
    color: var(--lmui-text);
    border: 0.08em solid var(--lmui-border);
    border-radius: var(--lmui-radius-lg);
    background: rgba(255,255,255,0.045);
}

body.lampa-modern-ui .empty__title,
body.lampa-modern-ui .error__title,
body.lampa-modern-ui .empty-filter__title {
    color: var(--lmui-text);
    font-size: var(--lmui-text-heading);
    font-weight: 700;
    letter-spacing: -0.03em;
}

body.lampa-modern-ui .empty__descr,
body.lampa-modern-ui .error__text,
body.lampa-modern-ui .empty-filter__subtitle,
body.lampa-modern-ui .loading-layer__text {
    color: var(--lmui-muted);
    font-size: var(--lmui-text-body);
    line-height: 1.5;
}

body.lampa-modern-ui .empty-template {
    border: 0.08em solid var(--lmui-border);
    border-radius: var(--lmui-radius-md);
    background: rgba(255,255,255,0.045);
}

/* Экранная клавиатура */
body.lampa-modern-ui .simple-keyboard {
    border: 0.08em solid var(--lmui-border);
    border-radius: var(--lmui-radius-lg);
    background: rgba(10,13,20,0.98);
}

body.lampa-modern-ui .simple-keyboard .hg-button,
body.lampa-modern-ui .simple-keyboard-buttons__enter,
body.lampa-modern-ui .simple-keyboard-buttons__cancel {
    color: var(--lmui-text);
    border: 0.08em solid var(--lmui-border);
    border-radius: 0.72em;
    background: rgba(255,255,255,0.055);
    box-shadow: none;
    transition: background-color var(--lmui-fast) var(--lmui-ease), border-color var(--lmui-fast) var(--lmui-ease), color var(--lmui-fast) var(--lmui-ease), transform var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .simple-keyboard .hg-button.hg-activeButton,
body.lampa-modern-ui .simple-keyboard .hg-button.focus,
body.lampa-modern-ui .simple-keyboard .hg-button:hover,
body.lampa-modern-ui .simple-keyboard-buttons__enter.focus,
body.lampa-modern-ui .simple-keyboard-buttons__cancel.focus {
    color: #fff;
    border-color: var(--lmui-focus-border);
    background: var(--lmui-focus-bg);
    box-shadow: var(--lmui-focus-ring);
    transform: none;
}

/* Explorer, списки источников и файлов */
body.lampa-modern-ui .explorer-card,
body.lampa-modern-ui .explorer-list,
body.lampa-modern-ui .torrent-item {
    border-color: var(--lmui-border);
    background: rgba(255,255,255,0.045);
}

body.lampa-modern-ui .explorer-card__head-img,
body.lampa-modern-ui .explorer-card__head-img > img {
    border-radius: var(--lmui-radius-md);
}

body.lampa-modern-ui .explorer-card__title,
body.lampa-modern-ui .torrent-item__title {
    color: var(--lmui-text);
    font-weight: 650;
    letter-spacing: -0.018em;
}

body.lampa-modern-ui .explorer-card__descr,
body.lampa-modern-ui .explorer-card__genres,
body.lampa-modern-ui .torrent-item__details {
    color: var(--lmui-muted);
    line-height: 1.45;
}

body.lampa-modern-ui .torrent-item.focus,
body.lampa-modern-ui .explorer-card__head-img.focus {
    border-color: var(--lmui-focus-border);
    background: rgba(255,255,255,0.078);
    box-shadow: var(--lmui-focus-ring);
}

/* TV */
@media screen and (min-width: 1000px), screen and (min-width: 768px) and (pointer: coarse) {
    body.lampa-modern-ui .head__action {
        width: 3em;
        height: 3em;
    }

    body.lampa-modern-ui .menu__item {
        min-height: 3.15em;
    }

    body.lampa-modern-ui .card.focus,
    body.lampa-modern-ui .card.hover {
        transform: none;
    }
}

/* Телефон */
@media screen and (max-width: 600px) {
    body.lampa-modern-ui {
        --lmui-radius-md: 0.9em;
        --lmui-radius-lg: 1.22em;
    }

    body.lampa-modern-ui::after {
        display: none;
    }

    body.lampa-modern-ui .head__body {
        padding-top: 0.45em;
        padding-bottom: 0.55em;
    }

    body.lampa-modern-ui .head__title {
        font-size: 1.42em;
    }

    body.lampa-modern-ui .card:not(.card--wide):not(.card--collection) {
        width: 42vw;
        min-width: 8.7em;
        max-width: 11.1em;
    }

    body.lampa-modern-ui.lmui-density-compact .card:not(.card--wide):not(.card--collection) {
        width: 38vw;
        min-width: 8.1em;
        max-width: 10em;
    }

    body.lampa-modern-ui .card--wide {
        width: 79vw;
        max-width: 26em;
    }

    body.lampa-modern-ui .card.focus,
    body.lampa-modern-ui .card.hover {
        transform: none;
    }

    body.lampa-modern-ui .full-start-new__right {
        border-top-left-radius: var(--lmui-radius-lg);
        border-top-right-radius: var(--lmui-radius-lg);
        background: linear-gradient(180deg, rgba(7,9,16,0.94), rgba(7,9,16,0.36) 76%, transparent);
    }

    body.lampa-modern-ui .full-start-new__title {
        font-size: 2.3em;
        -webkit-line-clamp: 3;
        line-clamp: 3;
    }

    body.lampa-modern-ui .full-start-new__description {
        width: 100%;
        font-size: 1.04em;
        -webkit-line-clamp: 5;
        line-clamp: 5;
    }

    body.lampa-modern-ui .full-start-new__details > * {
        padding: 0.35em 0.6em;
    }

    body.lampa-modern-ui .settings__content,
    body.lampa-modern-ui .selectbox__content,
    body.lampa-modern-ui .modal__content {
        border-right: 0;
        border-bottom: 0;
        border-left: 0;
        border-bottom-right-radius: 0;
        border-bottom-left-radius: 0;
    }
}

/* Телефон: самостоятельная компоновка, а не уменьшенная TV-версия. */
@media screen and (max-width: 600px) {
    body.lampa-modern-ui {
        --lmui-text-display: clamp(2.05em, 10vw, 3.05em);
        --lmui-text-heading: clamp(1.5em, 6.6vw, 2.05em);
        --lmui-text-section: clamp(1.18em, 5vw, 1.42em);
        --lmui-text-body: clamp(0.98em, 4vw, 1.1em);
        --lmui-text-caption: clamp(0.8em, 3.25vw, 0.92em);
    }

    body.lampa-modern-ui .wrap__content,
    body.lampa-modern-ui .activity__body {
        padding-left: max(0.72em, env(safe-area-inset-left));
        padding-right: max(0.72em, env(safe-area-inset-right));
    }

    body.lampa-modern-ui .items-line__head {
        min-height: 2.65em;
        margin-bottom: 0.16em;
    }

    body.lampa-modern-ui .items-line__head::before {
        width: 0.14em;
        height: 1.08em;
        margin-right: 0.48em;
        opacity: 0.72;
    }

    body.lampa-modern-ui .items-line__more {
        padding: 0.42em 0.68em;
    }

    body.lampa-modern-ui .search-box {
        padding: 0.5em;
        border-radius: 1.15em;
    }

    body.lampa-modern-ui .search-source {
        padding-top: 0.5em;
        padding-bottom: 0.5em;
    }

    body.lampa-modern-ui .simple-keyboard {
        border-right: 0;
        border-bottom: 0;
        border-left: 0;
        border-radius: 1.25em 1.25em 0 0;
    }

    body.lampa-modern-ui .simple-keyboard .hg-button {
        min-height: 2.65em;
        border-radius: 0.68em;
    }

    body.lampa-modern-ui .person-start__body {
        display: block;
    }

    body.lampa-modern-ui .person-start__left {
        width: min(48vw, 12.5em);
        margin: 0 auto 1.2em;
    }

    body.lampa-modern-ui .person-start__right {
        width: 100%;
    }

    body.lampa-modern-ui .person-start__name,
    body.lampa-modern-ui .person-start__place {
        text-align: center;
    }

    body.lampa-modern-ui .person-start__tags,
    body.lampa-modern-ui .person-start__icons {
        justify-content: center;
    }

    body.lampa-modern-ui .full-start-new__buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.55em;
    }

    body.lampa-modern-ui .full-start-new__buttons .full-start__button {
        justify-content: center;
        min-height: 3.15em;
        margin: 0;
    }

    body.lampa-modern-ui .full-start-new__buttons .full-start__button:first-child {
        grid-column: 1 / -1;
    }

    body.lampa-modern-ui .season-episode,
    body.lampa-modern-ui .full-episode {
        border-radius: 1em;
    }

    body.lampa-modern-ui .season-episode__body,
    body.lampa-modern-ui .full-episode__body {
        min-height: 4.3em;
    }

    body.lampa-modern-ui .modal,
    body.lampa-modern-ui .selectbox,
    body.lampa-modern-ui .settings {
        align-items: flex-end;
    }

    body.lampa-modern-ui .modal__content,
    body.lampa-modern-ui .selectbox__content,
    body.lampa-modern-ui .settings__content {
        width: 100%;
        max-height: min(86vh, 52em);
        margin: 0;
        border-radius: 1.35em 1.35em 0 0;
    }

    body.lampa-modern-ui .modal.animate .modal__content,
    body.lampa-modern-ui .selectbox.animate .selectbox__content,
    body.lampa-modern-ui .settings.animate .settings__content {
        animation-name: lmui-sheet-in !important;
    }

    body.lampa-modern-ui .navigation-bar__body {
        box-shadow: 0 0.75em 2em rgba(0,0,0,0.34);
    }

    body.lampa-modern-ui .navigation-bar__item {
        min-height: 3.1em;
    }
}

/* Сенсорный экран: hover не должен раздувать карточки. */
@media (hover: none) and (pointer: coarse) and (max-width: 900px) {
    body.lampa-modern-ui .card.hover:not(.focus) {
        transform: none;
    }
}

/* Экономный профиль: меньше теней и декоративной сетки. */
body.lampa-modern-ui.lmui-performance-lite::after {
    display: none;
}

body.lampa-modern-ui.lmui-performance-lite .card.focus .card__view,
body.lampa-modern-ui.lmui-performance-lite .card.hover .card__view {
    box-shadow: 0 0.75em 1.8em rgba(0,0,0,0.34);
}

body.lampa-modern-ui.lmui-performance-lite .full-start-new__poster,
body.lampa-modern-ui.lmui-performance-lite .settings__content,
body.lampa-modern-ui.lmui-performance-lite .selectbox__content,
body.lampa-modern-ui.lmui-performance-lite .modal__content {
    box-shadow: 0 0.9em 2.4em rgba(0,0,0,0.38);
}

@supports (padding-bottom: env(safe-area-inset-bottom)) {
    body.lampa-modern-ui.true--mobile .navigation-bar {
        padding-bottom: calc(0.65em + env(safe-area-inset-bottom));
    }
}

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

    function storageGet(name, fallback) {
        try {
            if (window.Lampa && Lampa.Storage && typeof Lampa.Storage.get === 'function') {
                return Lampa.Storage.get(name, fallback);
            }
        } catch (error) {
            console.warn('[Lampa Modern UI] Storage.get failed:', name, error);
        }
        return fallback;
    }

    function storageField(name) {
        try {
            if (window.Lampa && Lampa.Storage && typeof Lampa.Storage.field === 'function') {
                return Lampa.Storage.field(name);
            }
        } catch (error) {
            console.warn('[Lampa Modern UI] Storage.field failed:', name, error);
        }
        return CORE_DEFAULTS[name];
    }

    function storageSet(name, value) {
        try {
            if (window.Lampa && Lampa.Storage && typeof Lampa.Storage.set === 'function') {
                Lampa.Storage.set(name, value);
                return true;
            }
        } catch (error) {
            console.warn('[Lampa Modern UI] Storage.set failed:', name, error);
        }
        return false;
    }

    function notify(message) {
        try {
            if (window.Lampa && Lampa.Noty && typeof Lampa.Noty.show === 'function') {
                Lampa.Noty.show(message);
                return;
            }
        } catch (error) {}
        console.info('[Lampa Modern UI] ' + message);
    }

    function normalizeBackupState(raw) {
        if (!raw || typeof raw !== 'object') return { version: 2, fields: {} };
        if (raw.version === 2 && raw.fields && typeof raw.fields === 'object') return raw;

        var migrated = { version: 2, fields: {} };
        Object.keys(raw).forEach(function (name) {
            migrated.fields[name] = { original: raw[name], applied: null };
        });
        return migrated;
    }

    function loadBackupState() {
        var current = storageGet(BACKUP_KEY, '');
        if (current && typeof current === 'object') return normalizeBackupState(current);

        var legacy = storageGet(LEGACY_BACKUP_KEY, '');
        if (legacy && typeof legacy === 'object' && Object.keys(legacy).length) {
            var migrated = normalizeBackupState(legacy);
            storageSet(BACKUP_KEY, migrated);
            storageSet(LEGACY_BACKUP_KEY, '');
            return migrated;
        }
        return { version: 2, fields: {} };
    }

    function saveBackupState(state) {
        storageSet(BACKUP_KEY, state);
    }

    function applyCoreValues(values, force) {
        var state = loadBackupState();

        Object.keys(values).forEach(function (name) {
            var current = storageField(name);
            if (current === undefined) current = CORE_DEFAULTS[name];

            var record = state.fields[name];
            if (!record || typeof record !== 'object') {
                record = { original: current, applied: null };
                state.fields[name] = record;
            }

            var wasChangedAfterPlugin = record.applied !== null && current !== record.applied;
            if (wasChangedAfterPlugin && !force) return;

            if (wasChangedAfterPlugin && force) record.original = current;

            if (current !== values[name]) storageSet(name, values[name]);
            record.applied = values[name];
        });

        saveBackupState(state);
    }

    function restoreCoreSettings(silent) {
        var state = loadBackupState();
        var names = Object.keys(state.fields || {});
        if (!names.length) {
            if (!silent) notify('Сохранённые настройки Lampa не найдены');
            return false;
        }

        var restored = 0;
        var preserved = 0;
        names.forEach(function (name) {
            var record = state.fields[name];
            if (!record || typeof record !== 'object') return;

            var current = storageField(name);
            if (record.applied === null || current === record.applied) {
                if (current !== record.original) storageSet(name, record.original);
                restored += 1;
            } else {
                preserved += 1;
            }
        });

        storageSet(BACKUP_KEY, '');
        storageSet(LEGACY_BACKUP_KEY, '');
        if (!silent) {
            notify(preserved ? 'Настройки восстановлены; ручные изменения сохранены (' + preserved + ')' : 'Исходные настройки Lampa восстановлены');
        }
        return restored > 0 || preserved > 0;
    }

    function applyPerformanceProfile(profile, force) {
        if (profile === 'visual') {
            restoreCoreSettings(true);
            return;
        }

        var values = {
            animation: true,
            background: false,
            background_type: 'simple',
            glass_style: false,
            hide_outside_the_screen: true,
            cache_images: false,
            scroll_type: 'css',
            card_views_type: 'preload',
            poster_size: profile === 'lite' ? 'w200' : 'w300',
            interface_sound_play: false
        };

        applyCoreValues(values, !!force);
    }

    function removeThemeClasses(body) {
        Array.prototype.slice.call(body.classList).forEach(function (name) {
            if (name === 'lampa-modern-ui' || name.indexOf('lmui-') === 0) body.classList.remove(name);
        });
    }

    function applyTheme() {
        var body = document.body;
        if (!body) return;

        removeThemeClasses(body);

        var enabled = normalizeBoolean(storageGet(KEYS.enabled, true), true);
        if (!enabled) return;

        var accent = String(storageGet(KEYS.accent, 'azure') || 'azure');
        var motion = String(storageGet(KEYS.motion, 'balanced') || 'balanced');
        var density = String(storageGet(KEYS.density, 'comfortable') || 'comfortable');
        var performance = String(storageGet(KEYS.performance, 'balanced') || 'balanced');
        var focus = String(storageGet(KEYS.focus, 'outline') || 'outline');

        if (['azure', 'violet', 'emerald', 'coral'].indexOf(accent) < 0) accent = 'azure';
        if (['balanced', 'cinematic', 'minimal'].indexOf(motion) < 0) motion = 'balanced';
        if (['comfortable', 'compact'].indexOf(density) < 0) density = 'comfortable';
        if (['visual', 'balanced', 'lite'].indexOf(performance) < 0) performance = 'balanced';
        if (['outline', 'soft', 'lift'].indexOf(focus) < 0) focus = 'outline';

        body.classList.add(
            'lampa-modern-ui',
            'lmui-accent-' + accent,
            'lmui-motion-' + motion,
            'lmui-density-' + density,
            'lmui-performance-' + performance,
            'lmui-focus-' + focus
        );
    }

    function applyAll(forceProfile) {
        var enabled = normalizeBoolean(storageGet(KEYS.enabled, true), true);
        if (!enabled) {
            restoreCoreSettings(true);
            applyTheme();
            return;
        }

        var performance = String(storageGet(KEYS.performance, 'balanced') || 'balanced');
        if (['visual', 'balanced', 'lite'].indexOf(performance) < 0) performance = 'balanced';
        applyPerformanceProfile(performance, !!forceProfile);
        applyTheme();
    }

    function injectStyle() {
        var old = document.getElementById(STYLE_ID);
        if (old) old.remove();

        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.type = 'text/css';
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    function addSettings() {
        if (!window.Lampa || !Lampa.SettingsApi) {
            console.warn('[Lampa Modern UI] SettingsApi unavailable');
            return;
        }

        var icon = '<svg viewBox="0 0 32 32" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<rect x="4" y="4" width="24" height="24" rx="7" stroke="currentColor" stroke-width="2"/>' +
            '<path d="M9 21L13.2 16.8L16.3 19.9L23 13.2" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
            '<circle cx="22.8" cy="13.1" r="2.1" fill="currentColor"/>' +
            '</svg>';

        try {
            Lampa.SettingsApi.addComponent({ component: PLUGIN_ID, name: 'Modern UI', icon: icon });

            Lampa.SettingsApi.addParam({
                component: PLUGIN_ID,
                param: { name: KEYS.enabled, type: 'trigger', default: true },
                field: { name: 'Включить Modern UI', description: 'Меняет только оформление и параметры производительности.' },
                onChange: function () { applyAll(true); }
            });

            Lampa.SettingsApi.addParam({
                component: PLUGIN_ID,
                param: {
                    name: KEYS.accent,
                    type: 'select',
                    values: { azure: 'Лазурный', violet: 'Фиолетовый', emerald: 'Изумрудный', coral: 'Коралловый' },
                    default: 'azure'
                },
                field: { name: 'Акцент', description: 'Цвет фокуса, активных кнопок и маркеров.' },
                onChange: applyTheme
            });

            Lampa.SettingsApi.addParam({
                component: PLUGIN_ID,
                param: {
                    name: KEYS.focus,
                    type: 'select',
                    values: { outline: 'Спокойный контур', soft: 'Мягкая подсветка', lift: 'Лёгкий подъём' },
                    default: 'outline'
                },
                field: { name: 'Стиль фокуса', description: 'Контрастный, но без яркой акцентной заливки. Для слабого TV рекомендован спокойный контур.' },
                onChange: applyTheme
            });

            Lampa.SettingsApi.addParam({
                component: PLUGIN_ID,
                param: {
                    name: KEYS.motion,
                    type: 'select',
                    values: { balanced: 'Сбалансированные', cinematic: 'Кинематографичные', minimal: 'Минимальные' },
                    default: 'balanced'
                },
                field: { name: 'Микроанимации', description: 'Для Android TV рекомендован сбалансированный режим.' },
                onChange: applyTheme
            });

            Lampa.SettingsApi.addParam({
                component: PLUGIN_ID,
                param: {
                    name: KEYS.density,
                    type: 'select',
                    values: { comfortable: 'Комфортная', compact: 'Компактная' },
                    default: 'comfortable'
                },
                field: { name: 'Плотность', description: 'Компактный режим показывает больше карточек.' },
                onChange: applyTheme
            });

            Lampa.SettingsApi.addParam({
                component: PLUGIN_ID,
                param: {
                    name: KEYS.performance,
                    type: 'select',
                    values: {
                        visual: 'Только оформление',
                        balanced: 'Оптимизированный',
                        lite: 'Экономный'
                    },
                    default: 'balanced'
                },
                field: {
                    name: 'Профиль производительности',
                    description: 'Оптимизированный отключает canvas-фон и blur. Экономный дополнительно снижает качество постеров до w200.'
                },
                onChange: function () { applyAll(true); }
            });

            Lampa.SettingsApi.addParam({
                component: PLUGIN_ID,
                param: { name: 'lmui_restore_core', type: 'button' },
                field: {
                    name: 'Восстановить настройки Lampa',
                    description: 'Возвращает значения, сохранённые до первого применения профиля производительности.'
                },
                onChange: function () {
                    restoreCoreSettings(false);
                    storageSet(KEYS.performance, 'visual');
                    applyTheme();
                }
            });
        } catch (error) {
            console.error('[Lampa Modern UI] Settings registration failed:', error);
        }
    }

    function start() {
        if (window[READY_FLAG]) return;
        window[READY_FLAG] = true;

        injectStyle();
        addSettings();
        applyAll();

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
