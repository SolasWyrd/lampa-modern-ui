/* Lampa Modern UI 0.9.0
 * Единый UI-слой и простая главная на штатных данных Lampa.
 * Собственный профиль, рекомендации, импорт/экспорт и timeline mirror удалены.
 */
(function () {
    'use strict';

    var VERSION = '0.9.0';
    var PLUGIN_ID = 'lampa_modern_ui';
    var STYLE_ID = 'lampa-modern-ui-style';
    var READY_FLAG = '__lampa_modern_ui_v090_ready__';
    var CLEANUP_KEY = 'lmui_v090_cleanup';
    var START_ATTEMPTS = 160;
    var startAttempts = 0;
    var startTimer = 0;
    var refreshTimer = 0;
    var decorateTimer = 0;
    var dataProbeTimer = 0;
    var activeObserver = null;
    var observedRoot = null;
    var lastMainRefreshAt = 0;
    var lastHomeSignature = '';
    var dataProbeAttempts = 0;
    var focusState = null;
    var homeRow = null;
    var searchTimer = 0;
    var inputListenersInstalled = false;

    var KEYS = {
        enabled: 'lmui_enabled',
        density: 'lmui_density',
        motion: 'lmui_motion',
        performance: 'lmui_performance',
        homeEnabled: 'lmui_home_enabled',
        homeMode: 'lmui_home_mode'
    };

    var HIDDEN_COMPONENT_IDS = [
        'sync',
        'account_sync',
        'parental_control',
        'parental',
        'remote_configuration',
        'remote_config'
    ];

    var HOME_TITLES = {
        continue: 'Продолжить',
        episodes: 'Новые серии',
        watchlist: 'Мой список',
        recommendations: 'Для вас'
    };

    var HOME_ORDER = ['continue', 'episodes', 'watchlist', 'recommendations'];

    var CSS = String.raw`
body.lampa-modern-ui {
    --lmui-bg: #070a10;
    --lmui-bg-raised: #0c111b;
    --lmui-surface: #111925;
    --lmui-surface-raised: #182438;
    --lmui-surface-hover: #213149;
    --lmui-text: #f6f8fc;
    --lmui-muted: #aeb8c8;
    --lmui-faint: #748096;
    --lmui-accent: #69a7ff;
    --lmui-accent-strong: #91beff;
    --lmui-accent-soft: rgba(105, 167, 255, 0.16);
    --lmui-danger: #ff756f;
    --lmui-border: rgba(255, 255, 255, 0.10);
    --lmui-border-strong: rgba(255, 255, 255, 0.22);
    --lmui-radius-sm: 0.68em;
    --lmui-radius-md: 1em;
    --lmui-radius-lg: 1.45em;
    --lmui-gutter: clamp(1em, 2vw, 2.5em);
    --lmui-fast: 110ms;
    --lmui-normal: 175ms;
    --lmui-slow: 240ms;
    --lmui-ease: cubic-bezier(0.22, 0.72, 0.2, 1);
    --lmui-focus-ring: 0 0 0 0.11em var(--lmui-accent), 0 0 0 0.25em rgba(105, 167, 255, 0.25);
    --lmui-shadow-card: 0 1.2em 3em rgba(0, 0, 0, 0.46);
    --lmui-shadow-panel: 0 1.5em 4.5em rgba(0, 0, 0, 0.54);
    --lmui-display: clamp(2.3em, 4.4vw, 4.9em);
    --lmui-heading: clamp(1.55em, 2.2vw, 2.35em);
    --lmui-section: clamp(1.16em, 1.45vw, 1.52em);
    --lmui-body: clamp(0.98em, 1.05vw, 1.16em);

    color: var(--lmui-text);
    background: var(--lmui-bg) !important;
    font-family: "SegoeUI", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
}

body.lampa-modern-ui::before {
    content: "";
    position: fixed;
    inset: 0;
    z-index: -2;
    pointer-events: none;
    background:
        radial-gradient(72% 56% at 12% -12%, rgba(57, 103, 174, 0.27), transparent 69%),
        radial-gradient(52% 44% at 102% 4%, rgba(37, 75, 135, 0.14), transparent 73%),
        linear-gradient(145deg, #0d1420 0%, var(--lmui-bg) 54%, #04060a 100%);
}

body.lampa-modern-ui .background {
    opacity: 0.5;
}

body.lampa-modern-ui.lmui-performance-lite .background {
    display: none !important;
}

body.lampa-modern-ui.lmui-performance-lite::before {
    background: linear-gradient(145deg, #0c111a, #06080d 72%);
}

body.lampa-modern-ui.lmui-motion-minimal {
    --lmui-fast: 1ms;
    --lmui-normal: 1ms;
    --lmui-slow: 1ms;
}

/* Header */
body.lampa-modern-ui .head {
    background: linear-gradient(180deg, rgba(7, 10, 16, 0.97), rgba(7, 10, 16, 0.73) 74%, transparent);
}

body.lampa-modern-ui .head__body {
    padding-top: 0.68em;
    padding-bottom: 0.72em;
}

body.lampa-modern-ui .head__title {
    color: var(--lmui-text);
    font-size: var(--lmui-section);
    font-weight: 700;
    letter-spacing: -0.025em;
}

body.lampa-modern-ui .head__time-date,
body.lampa-modern-ui .head__time-week {
    color: var(--lmui-muted);
}

body.lampa-modern-ui .head__action {
    width: 2.9em;
    height: 2.9em;
    margin-left: 0.55em;
    border: 0.075em solid var(--lmui-border);
    border-radius: 0.9em;
    background: rgba(255, 255, 255, 0.045);
    transition: transform var(--lmui-fast) var(--lmui-ease), background-color var(--lmui-fast) var(--lmui-ease), border-color var(--lmui-fast) var(--lmui-ease), box-shadow var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .head__action.focus,
body.lampa-modern-ui .head__action.hover {
    color: #fff;
    border-color: var(--lmui-accent);
    background: var(--lmui-accent-soft);
    box-shadow: var(--lmui-focus-ring);
    transform: translateY(-0.05em);
}

/* Navigation */
body.lampa-modern-ui .wrap__left {
    background: linear-gradient(90deg, rgba(5, 8, 13, 0.99), rgba(8, 12, 20, 0.94) 82%, transparent);
}

body.lampa-modern-ui .menu__list {
    padding: 0.55em 0.72em 1em;
}

body.lampa-modern-ui .menu__split {
    width: auto;
    margin: 0.72em 1em;
    border-color: var(--lmui-border);
}

body.lampa-modern-ui .menu__item {
    position: relative;
    min-height: 3.12em;
    padding: 0.72em 0.94em;
    border: 0.075em solid transparent;
    border-radius: 0.88em;
    color: var(--lmui-muted);
    transition: transform var(--lmui-fast) var(--lmui-ease), color var(--lmui-fast) var(--lmui-ease), background-color var(--lmui-fast) var(--lmui-ease), border-color var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .menu__item + li {
    margin-top: 0.14em;
}

body.lampa-modern-ui .menu__ico {
    width: 1.45em;
    height: 1.45em;
    margin-right: 0.92em;
    opacity: 0.76;
    transition: opacity var(--lmui-fast) ease, transform var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .menu__text {
    font-weight: 610;
    letter-spacing: -0.014em;
}

body.lampa-modern-ui .menu__item.focus,
body.lampa-modern-ui .menu__item.hover,
body.lampa-modern-ui .menu__item.traverse {
    color: #fff;
    border-color: rgba(105, 167, 255, 0.35);
    background: var(--lmui-accent-soft);
    transform: translateX(0.06em);
}

body.lampa-modern-ui .menu__item.focus::before,
body.lampa-modern-ui .menu__item.hover::before {
    content: "";
    position: absolute;
    left: 0.25em;
    top: 25%;
    bottom: 25%;
    width: 0.17em;
    border-radius: 99em;
    background: var(--lmui-accent-strong);
}

body.lampa-modern-ui .menu__item.focus .menu__ico,
body.lampa-modern-ui .menu__item.hover .menu__ico {
    opacity: 1;
    transform: scale(1.045);
}

/* Rows */
body.lampa-modern-ui .items-line {
    margin-bottom: 0.58em;
}

body.lampa-modern-ui .items-line.lmui-home-duplicate {
    display: none !important;
}

body.lampa-modern-ui .items-line__head {
    min-height: 3em;
    margin-bottom: 0.18em;
}

body.lampa-modern-ui .items-line__title {
    color: var(--lmui-text);
    font-size: var(--lmui-section);
    font-weight: 720;
    letter-spacing: -0.027em;
    line-height: 1.18;
}

body.lampa-modern-ui .items-line__more {
    padding: 0.48em 0.76em;
    border: 0.075em solid transparent;
    border-radius: 0.68em;
    color: var(--lmui-muted);
    opacity: 0.74;
    transition: color var(--lmui-fast) var(--lmui-ease), background-color var(--lmui-fast) var(--lmui-ease), border-color var(--lmui-fast) var(--lmui-ease), opacity var(--lmui-fast) ease;
}

body.lampa-modern-ui .items-line__more.focus,
body.lampa-modern-ui .items-line__more.hover {
    color: #fff;
    opacity: 1;
    border-color: rgba(105, 167, 255, 0.4);
    background: var(--lmui-accent-soft);
}

/* Cards */
body.lampa-modern-ui .card {
    position: relative;
    transform-origin: center center;
    transition: transform var(--lmui-normal) var(--lmui-ease), opacity var(--lmui-fast) ease;
}

body.lampa-modern-ui .card__view {
    overflow: hidden;
    margin-bottom: 0.64em;
    border: 0.075em solid rgba(255, 255, 255, 0.07);
    border-radius: var(--lmui-radius-md);
    background: var(--lmui-surface);
    box-shadow: 0 0.32em 1em rgba(0, 0, 0, 0.2);
    transition: border-color var(--lmui-fast) var(--lmui-ease), box-shadow var(--lmui-normal) var(--lmui-ease), background-color var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .card__img,
body.lampa-modern-ui .card__filter,
body.lampa-modern-ui .card__textbox,
body.lampa-modern-ui .card__view::before {
    border-radius: calc(var(--lmui-radius-md) - 0.075em);
}

body.lampa-modern-ui .card__img {
    transform: scale(1.001);
    transition: transform var(--lmui-slow) var(--lmui-ease), opacity var(--lmui-normal) ease;
}

body.lampa-modern-ui .card__title {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    color: var(--lmui-text);
    font-weight: 630;
    line-height: 1.28;
    letter-spacing: -0.016em;
}

body.lampa-modern-ui .card__age {
    color: var(--lmui-faint);
}

body.lampa-modern-ui .card__textbox {
    background: linear-gradient(to bottom, transparent 33%, rgba(3, 6, 11, 0.42) 61%, rgba(3, 6, 11, 0.96) 100%);
}

body.lampa-modern-ui .card__vote,
body.lampa-modern-ui .card__quality,
body.lampa-modern-ui .card__type,
body.lampa-modern-ui .card__marker,
body.lampa-modern-ui .card__icons-inner {
    border: 0;
    border-radius: 0.5em;
    background: rgba(5, 8, 14, 0.9);
    color: rgba(255, 255, 255, 0.95);
    box-shadow: 0 0.3em 0.8em rgba(0, 0, 0, 0.3);
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
}

body.lampa-modern-ui .card__quality {
    left: 0.5em;
    bottom: 0.5em;
    padding: 0.28em 0.48em;
    font-weight: 720;
    letter-spacing: 0.025em;
}

body.lampa-modern-ui .time-line {
    height: 0.3em;
    overflow: hidden;
    border-radius: 99em;
    background: rgba(255, 255, 255, 0.17);
}

body.lampa-modern-ui .time-line > div {
    height: 100%;
    border-radius: inherit;
    background: var(--lmui-accent);
    box-shadow: none;
}

body.lampa-modern-ui .card.focus,
body.lampa-modern-ui .card.hover {
    z-index: 8;
}

body.lampa-modern-ui .card.focus {
    transform: translateY(-0.1em) scale(1.032);
}

body.lampa-modern-ui .card.focus .card__view,
body.lampa-modern-ui .card.hover .card__view {
    border-color: var(--lmui-accent-strong);
    background: var(--lmui-surface-raised);
    box-shadow: var(--lmui-focus-ring), var(--lmui-shadow-card);
}

body.lampa-modern-ui .card.focus .card__img,
body.lampa-modern-ui .card.hover .card__img {
    transform: scale(1.027);
}

body.lampa-modern-ui .card.focus .card__view::after,
body.lampa-modern-ui .card.hover .card__view::after {
    display: none !important;
}

body.lampa-modern-ui.lmui-density-compact .card:not(.card--wide):not(.card--collection):not(.card--category) {
    width: 11.1em;
}

body.lampa-modern-ui.lmui-density-compact .items-line {
    margin-bottom: 0.34em;
}

/* Continue: compact landscape cards, never a full-screen hero. */
body.lampa-modern-ui .lmui-row-continue {
    margin-bottom: 0.9em;
}

body.lampa-modern-ui .lmui-row-continue .items-line__title {
    font-size: clamp(1.24em, 1.55vw, 1.62em);
}

body.lampa-modern-ui .lmui-row-continue .card {
    width: clamp(16.5em, 23vw, 21.5em) !important;
    min-width: 16.5em;
}

body.lampa-modern-ui .lmui-row-continue .card__view {
    aspect-ratio: 16 / 9;
    min-height: 0;
}

body.lampa-modern-ui .lmui-row-continue .card__img,
body.lampa-modern-ui .lmui-row-continue .card__filter,
body.lampa-modern-ui .lmui-row-continue .card__textbox {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

body.lampa-modern-ui .lmui-row-continue .card__title {
    font-size: 1.02em;
    font-weight: 700;
}

body.lampa-modern-ui .lmui-row-continue .time-line {
    height: 0.38em;
}

body.lampa-modern-ui .lmui-episode-card .card__view {
    position: relative;
}

body.lampa-modern-ui .lmui-episode-badge {
    position: absolute;
    left: 0.55em;
    bottom: 0.55em;
    z-index: 3;
    padding: 0.3em 0.55em;
    border-radius: 0.48em;
    background: rgba(5, 8, 14, 0.92);
    color: #fff;
    font-size: 0.82em;
    font-weight: 720;
    letter-spacing: 0.02em;
}

/* Controls */
body.lampa-modern-ui .simple-button,
body.lampa-modern-ui .full-start__button {
    min-height: 2.85em;
    padding-inline: 1em;
    border: 0.075em solid var(--lmui-border);
    border-radius: 0.82em;
    background: rgba(255, 255, 255, 0.055);
    color: var(--lmui-text);
    font-weight: 650;
    transition: transform var(--lmui-fast) var(--lmui-ease), background-color var(--lmui-fast) var(--lmui-ease), border-color var(--lmui-fast) var(--lmui-ease), box-shadow var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .simple-button.focus,
body.lampa-modern-ui .simple-button.hover,
body.lampa-modern-ui .full-start__button.focus,
body.lampa-modern-ui .full-start__button.hover {
    color: #fff;
    border-color: var(--lmui-accent);
    background: var(--lmui-accent-soft);
    box-shadow: var(--lmui-focus-ring);
    transform: translateY(-0.05em);
}

body.lampa-modern-ui .full-start-new__buttons .full-start__button.lmui-primary-action {
    border-color: transparent;
    background: var(--lmui-accent);
    color: #07101c;
    font-weight: 780;
}

body.lampa-modern-ui .full-start-new__buttons .full-start__button.lmui-primary-action.focus,
body.lampa-modern-ui .full-start-new__buttons .full-start__button.lmui-primary-action.hover {
    border-color: #fff;
    background: var(--lmui-accent-strong);
    color: #050b13;
    box-shadow: 0 0 0 0.11em #fff, 0 0 0 0.25em rgba(105, 167, 255, 0.32), 0 0.9em 2.2em rgba(0, 0, 0, 0.35);
}

/* Detail screen */
body.lampa-modern-ui .full-start__background {
    opacity: 0.68;
    filter: saturate(0.9) contrast(1.06);
}

body.lampa-modern-ui .full-start-new {
    min-height: calc(100vh - 6.5em);
    padding-bottom: 4em;
}

body.lampa-modern-ui .full-start-new__left {
    margin-right: clamp(1.5em, 3vw, 3.5em);
}

body.lampa-modern-ui .full-start-new__poster,
body.lampa-modern-ui .full-start-new__img {
    border-radius: var(--lmui-radius-lg);
}

body.lampa-modern-ui .full-start-new__poster {
    overflow: hidden;
    border: 0.075em solid rgba(255, 255, 255, 0.13);
    background: var(--lmui-surface);
    box-shadow: 0 1.6em 4em rgba(0, 0, 0, 0.47);
}

body.lampa-modern-ui .full-start-new__right {
    max-width: 70em;
}

body.lampa-modern-ui .full-start-new__title {
    max-width: 16ch;
    color: #fff;
    font-size: var(--lmui-display);
    font-weight: 780;
    letter-spacing: -0.046em;
    line-height: 1.02;
    text-wrap: balance;
    text-shadow: 0 0.12em 0.65em rgba(0, 0, 0, 0.54);
}

body.lampa-modern-ui .full-start-new__head,
body.lampa-modern-ui .full-start-new__tagline,
body.lampa-modern-ui .full-start-new__description {
    color: var(--lmui-muted);
}

body.lampa-modern-ui .full-start-new__description {
    width: min(100%, 58em);
    max-width: 64ch;
    font-size: var(--lmui-body);
    line-height: 1.6;
    text-wrap: pretty;
}

body.lampa-modern-ui .full-start-new__details {
    gap: 0.2em;
    margin-left: 0;
}

body.lampa-modern-ui .full-start-new__details > * {
    margin: 0.12em 0.38em 0.12em 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: rgba(235, 240, 248, 0.82);
}

body.lampa-modern-ui .full-start-new__details > *:not(:last-child)::after {
    content: "·";
    margin-left: 0.38em;
    color: var(--lmui-faint);
}

body.lampa-modern-ui .full-start-new__buttons {
    gap: 0.55em;
    margin-top: 1.15em;
}

/* Tags, episodes, people and lists */
body.lampa-modern-ui .full-descr__tag,
body.lampa-modern-ui .tag-count,
body.lampa-modern-ui .full-review,
body.lampa-modern-ui .full-review-add,
body.lampa-modern-ui .person-start__tag,
body.lampa-modern-ui .person-start__icons > div {
    border: 0.075em solid var(--lmui-border);
    border-radius: 0.72em;
    background: rgba(255, 255, 255, 0.05);
    color: var(--lmui-muted);
}

body.lampa-modern-ui .full-descr__tag.focus,
body.lampa-modern-ui .tag-count.focus,
body.lampa-modern-ui .full-review.focus,
body.lampa-modern-ui .full-review-add.focus {
    color: #fff;
    border-color: var(--lmui-accent);
    background: var(--lmui-accent-soft);
    box-shadow: var(--lmui-focus-ring);
}

body.lampa-modern-ui .season-episode,
body.lampa-modern-ui .full-episode,
body.lampa-modern-ui .torrent-item,
body.lampa-modern-ui .explorer-card,
body.lampa-modern-ui .explorer-list {
    overflow: hidden;
    border: 0.075em solid var(--lmui-border);
    border-radius: var(--lmui-radius-md);
    background: rgba(255, 255, 255, 0.045);
}

body.lampa-modern-ui .season-episode.focus,
body.lampa-modern-ui .full-episode.focus,
body.lampa-modern-ui .card-episode.focus .full-episode,
body.lampa-modern-ui .torrent-item.focus,
body.lampa-modern-ui .explorer-card__head-img.focus {
    color: #fff;
    border-color: var(--lmui-accent);
    background: var(--lmui-accent-soft);
    box-shadow: var(--lmui-focus-ring);
}

/* Search */
body.lampa-modern-ui .search-box {
    width: min(100%, 88em);
    margin-inline: auto;
    padding: 0.55em 0;
    border: 0;
    background: transparent;
    box-shadow: none;
}

body.lampa-modern-ui .search-box .search__input,
body.lampa-modern-ui .simple-keyboard-input {
    min-height: 3.15em;
    padding: 0.65em 0.9em;
    border: 0.075em solid var(--lmui-border);
    border-radius: 0.92em;
    background: var(--lmui-surface);
    color: var(--lmui-text);
    font-size: var(--lmui-body);
}

body.lampa-modern-ui .search-box--focus .search__input,
body.lampa-modern-ui .search-box--focus .simple-keyboard-input {
    border-color: var(--lmui-accent);
    box-shadow: var(--lmui-focus-ring);
}

body.lampa-modern-ui .search__sources,
body.lampa-modern-ui .search__history {
    gap: 0.42em;
}

body.lampa-modern-ui .search-source,
body.lampa-modern-ui .search-history-key {
    padding: 0.48em 0.78em;
    border: 0.075em solid transparent;
    border-radius: 0.72em;
    background: rgba(255, 255, 255, 0.045);
    color: var(--lmui-muted);
}

body.lampa-modern-ui .search-source.active,
body.lampa-modern-ui .search-source.focus,
body.lampa-modern-ui .search-history-key.focus {
    color: #fff;
    border-color: rgba(105, 167, 255, 0.4);
    background: var(--lmui-accent-soft);
}

/* Settings, select and modal */
body.lampa-modern-ui .settings__content,
body.lampa-modern-ui .selectbox__content,
body.lampa-modern-ui .modal__content,
body.lampa-modern-ui .settings-input__content,
body.lampa-modern-ui .navigation-bar__body {
    color: var(--lmui-text);
    border: 0.075em solid var(--lmui-border);
    background: rgba(15, 22, 33, 0.98) !important;
    box-shadow: var(--lmui-shadow-panel);
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
}

body.lampa-modern-ui .settings__content,
body.lampa-modern-ui .selectbox__content,
body.lampa-modern-ui .modal__content {
    border-radius: var(--lmui-radius-lg);
}

body.lampa-modern-ui .settings__title,
body.lampa-modern-ui .selectbox__title,
body.lampa-modern-ui .modal__title {
    font-size: var(--lmui-heading);
    font-weight: 760;
    letter-spacing: -0.032em;
}

body.lampa-modern-ui .settings-folder,
body.lampa-modern-ui .settings-param,
body.lampa-modern-ui .selectbox-item {
    min-height: 3.05em;
    border: 0.075em solid transparent;
    border-radius: 0.78em;
    transition: color var(--lmui-fast) var(--lmui-ease), background-color var(--lmui-fast) var(--lmui-ease), border-color var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .settings-folder.focus,
body.lampa-modern-ui .settings-param.focus,
body.lampa-modern-ui .selectbox-item.focus {
    color: #fff;
    border-color: rgba(105, 167, 255, 0.4);
    background: var(--lmui-accent-soft) !important;
}

body.lampa-modern-ui .settings-param__descr,
body.lampa-modern-ui .settings-param-title > span {
    color: var(--lmui-muted);
    opacity: 1;
}

body.lampa-modern-ui .settings-param__value {
    color: var(--lmui-accent-strong);
    font-weight: 700;
}

body.lampa-modern-ui .selectbox-item.selected:not(.nomark),
body.lampa-modern-ui .selectbox-item.picked {
    background: rgba(255, 255, 255, 0.045);
}

/* Empty, error, loading and notices */
body.lampa-modern-ui .empty,
body.lampa-modern-ui .error,
body.lampa-modern-ui .empty-filter,
body.lampa-modern-ui .loading-layer__box,
body.lampa-modern-ui .activity-wait-refresh,
body.lampa-modern-ui .notice,
body.lampa-modern-ui .bell__item {
    border: 0.075em solid var(--lmui-border);
    border-radius: var(--lmui-radius-lg);
    background: var(--lmui-surface) !important;
    color: var(--lmui-text);
    box-shadow: 0 1em 2.8em rgba(0, 0, 0, 0.34);
}

body.lampa-modern-ui .empty__title,
body.lampa-modern-ui .error__title,
body.lampa-modern-ui .empty-filter__title {
    color: var(--lmui-text);
    font-size: var(--lmui-heading);
    font-weight: 750;
    letter-spacing: -0.03em;
}

body.lampa-modern-ui .empty__descr,
body.lampa-modern-ui .error__text,
body.lampa-modern-ui .empty-filter__subtitle,
body.lampa-modern-ui .loading-layer__text,
body.lampa-modern-ui .notice__descr,
body.lampa-modern-ui .notice__time {
    color: var(--lmui-muted);
    line-height: 1.52;
}

body.lampa-modern-ui .content-loading {
    min-height: 12em;
    margin: 1em var(--lmui-gutter);
    border: 0.075em solid rgba(255, 255, 255, 0.07);
    border-radius: var(--lmui-radius-lg);
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.015));
}

/* Keyboard and mobile navigation */
body.lampa-modern-ui .simple-keyboard {
    border: 0.075em solid var(--lmui-border);
    border-radius: var(--lmui-radius-lg);
    background: #0d131d;
}

body.lampa-modern-ui .simple-keyboard .hg-button,
body.lampa-modern-ui .simple-keyboard-buttons__enter,
body.lampa-modern-ui .simple-keyboard-buttons__cancel {
    border: 0.075em solid var(--lmui-border);
    border-radius: 0.68em;
    background: rgba(255, 255, 255, 0.05);
    color: var(--lmui-text);
    box-shadow: none;
}

body.lampa-modern-ui .simple-keyboard .hg-button.focus,
body.lampa-modern-ui .simple-keyboard .hg-button.hg-activeButton,
body.lampa-modern-ui .simple-keyboard-buttons__enter.focus,
body.lampa-modern-ui .simple-keyboard-buttons__cancel.focus {
    color: #fff;
    border-color: var(--lmui-accent);
    background: var(--lmui-accent-soft);
    box-shadow: var(--lmui-focus-ring);
}

body.lampa-modern-ui .navigation-bar {
    padding: 0 0.65em 0.65em;
}

body.lampa-modern-ui .navigation-bar__body {
    padding: 0.52em;
    border-radius: 1.15em;
}

body.lampa-modern-ui .navigation-bar__item {
    min-width: 4em;
    min-height: 3em;
    padding: 0.45em 0.58em;
    border-radius: 0.75em;
    color: var(--lmui-muted);
}

body.lampa-modern-ui .navigation-bar__item.focus,
body.lampa-modern-ui .navigation-bar__item.active {
    color: #fff;
    background: var(--lmui-accent-soft);
}


/* Row states */
body.lampa-modern-ui .card.lmui-state-card {
    width: min(34em, 72vw) !important;
}

body.lampa-modern-ui .card.lmui-state-card .card__view {
    min-height: 8.5em;
    aspect-ratio: auto;
    display: grid;
    place-items: center;
    padding: 1.3em;
    background: linear-gradient(135deg, rgba(255,255,255,0.055), rgba(255,255,255,0.018));
}

body.lampa-modern-ui .lmui-row-state {
    width: 100%;
    text-align: center;
}

body.lampa-modern-ui .lmui-row-state__title {
    color: var(--lmui-text);
    font-weight: 720;
    font-size: 1.08em;
}

body.lampa-modern-ui .lmui-row-state__text {
    margin-top: 0.35em;
    color: var(--lmui-muted);
    line-height: 1.45;
}

body.lampa-modern-ui .lmui-row-state__action {
    margin-top: 0.7em;
    color: var(--lmui-accent-strong);
    font-weight: 680;
}

/* Search states */
body.lampa-modern-ui .lmui-search-hint {
    width: min(100%, 88em);
    margin: 0.5em auto 1em;
    padding: 1.1em 1.2em;
    border: 0.075em solid var(--lmui-border);
    border-radius: var(--lmui-radius-md);
    background: rgba(255,255,255,0.035);
    color: var(--lmui-muted);
    line-height: 1.5;
}

body.lampa-modern-ui .lmui-search-hint strong {
    display: block;
    margin-bottom: 0.25em;
    color: var(--lmui-text);
    font-size: 1.08em;
}

body.lampa-modern-ui .lmui-search-screen[data-lmui-search-state="active"] .lmui-search-hint,
body.lampa-modern-ui .lmui-search-screen[data-lmui-search-state="results"] .lmui-search-hint {
    display: none;
}

/* Detail semantics */
body.lampa-modern-ui .activity--active.lmui-detail-screen .full-start-new__buttons {
    align-items: center;
}

body.lampa-modern-ui .activity--active.lmui-detail-screen .button--play,
body.lampa-modern-ui .activity--active.lmui-detail-screen .button--priority {
    order: -10;
}

body.lampa-modern-ui .activity--active.lmui-detail-series .full-episode,
body.lampa-modern-ui .activity--active.lmui-detail-series .season-episode {
    min-width: min(31em, 72vw);
}

/* Input is separate from viewport layout. */
body.lampa-modern-ui.lmui-input-pointer .card.hover:not(.focus) {
    transform: translateY(-0.05em) scale(1.012);
}

body.lampa-modern-ui.lmui-input-remote .card.focus {
    transform: translateY(-0.16em) scale(1.05);
}

body.lampa-modern-ui.lmui-input-remote .card.focus .card__view {
    box-shadow: 0 0 0 0.14em var(--lmui-accent), 0 0 0 0.3em rgba(105, 167, 255, 0.26), 0 1.3em 3.1em rgba(0, 0, 0, 0.5);
}

/* TV input (legacy class fallback) */
body.lampa-modern-ui.lmui-device-tv .card.focus {
    transform: translateY(-0.16em) scale(1.052);
}

body.lampa-modern-ui.lmui-device-tv .card.focus .card__view {
    box-shadow: 0 0 0 0.14em var(--lmui-accent), 0 0 0 0.3em rgba(105, 167, 255, 0.26), 0 1.3em 3.1em rgba(0, 0, 0, 0.5);
}

body.lampa-modern-ui.lmui-device-tv .menu__item,
body.lampa-modern-ui.lmui-device-tv .settings-folder,
body.lampa-modern-ui.lmui-device-tv .settings-param,
body.lampa-modern-ui.lmui-device-tv .selectbox-item {
    min-height: 3.2em;
}

/* Tablet: independent composition, not a squeezed desktop. */
@media screen and (min-width: 721px) and (max-width: 1100px) {
    body.lampa-modern-ui {
        --lmui-gutter: clamp(0.95em, 2.6vw, 1.7em);
        --lmui-display: clamp(2.15em, 5.2vw, 3.55em);
    }

    body.lampa-modern-ui .full-start-new__left {
        width: min(31vw, 17em);
        margin-right: clamp(1.2em, 2.5vw, 2em);
    }

    body.lampa-modern-ui .full-start-new__right {
        max-width: calc(100vw - 21em);
    }

    body.lampa-modern-ui .full-start-new__title {
        max-width: 18ch;
    }

    body.lampa-modern-ui .full-start-new__description {
        max-width: 54ch;
        -webkit-line-clamp: 6;
        line-clamp: 6;
    }

    body.lampa-modern-ui .full-start-new__buttons {
        flex-wrap: wrap;
    }

    body.lampa-modern-ui .settings__content,
    body.lampa-modern-ui .selectbox__content,
    body.lampa-modern-ui .modal__content {
        width: min(88vw, 52em);
        max-height: 86vh;
    }

    body.lampa-modern-ui .lmui-row-continue .card {
        width: min(39vw, 20em) !important;
        min-width: 15em;
    }
}

/* Phone */
@media screen and (max-width: 720px) {
    body.lampa-modern-ui {
        --lmui-radius-md: 0.86em;
        --lmui-radius-lg: 1.15em;
        --lmui-gutter: max(0.75em, env(safe-area-inset-left));
        --lmui-display: clamp(2em, 9.5vw, 3.1em);
        --lmui-heading: clamp(1.45em, 6vw, 2em);
        --lmui-section: clamp(1.12em, 4.8vw, 1.4em);
        --lmui-body: clamp(0.96em, 3.9vw, 1.08em);
    }

    body.lampa-modern-ui::before {
        background: linear-gradient(160deg, #0d1320, #070a10 58%, #04060a);
    }

    body.lampa-modern-ui .wrap__content,
    body.lampa-modern-ui .activity__body {
        padding-left: max(0.72em, env(safe-area-inset-left));
        padding-right: max(0.72em, env(safe-area-inset-right));
    }

    body.lampa-modern-ui .head__body {
        padding-top: 0.42em;
        padding-bottom: 0.48em;
    }

    body.lampa-modern-ui .head__title {
        font-size: 1.35em;
    }

    body.lampa-modern-ui .head__action {
        width: 2.7em;
        height: 2.7em;
    }

    body.lampa-modern-ui .items-line__head {
        min-height: 2.55em;
        margin-bottom: 0.1em;
    }

    body.lampa-modern-ui .card:not(.card--wide):not(.card--collection):not(.card--category) {
        width: min(42vw, 11.2em);
        min-width: 8.5em;
    }

    body.lampa-modern-ui.lmui-density-compact .card:not(.card--wide):not(.card--collection):not(.card--category) {
        width: min(37vw, 9.8em);
        min-width: 7.7em;
    }

    body.lampa-modern-ui .lmui-row-continue .card {
        width: min(76vw, 20em) !important;
        min-width: 14.5em;
    }

    body.lampa-modern-ui .card.focus,
    body.lampa-modern-ui .card.hover {
        transform: none;
    }

    body.lampa-modern-ui .card.focus .card__view,
    body.lampa-modern-ui .card.hover .card__view {
        box-shadow: var(--lmui-focus-ring), 0 0.75em 1.8em rgba(0, 0, 0, 0.35);
    }

    body.lampa-modern-ui .full-start-new {
        padding-bottom: 2em;
    }

    body.lampa-modern-ui .full-start-new__right {
        width: 100%;
        padding-top: 1.25em;
        background: linear-gradient(180deg, transparent, rgba(7, 10, 16, 0.96) 14%);
    }

    body.lampa-modern-ui .full-start-new__title {
        max-width: 100%;
        -webkit-line-clamp: 3;
        line-clamp: 3;
    }

    body.lampa-modern-ui .full-start-new__description {
        max-width: 100%;
        -webkit-line-clamp: 5;
        line-clamp: 5;
    }

    body.lampa-modern-ui .full-start-new__buttons {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.5em;
        overflow: visible;
    }

    body.lampa-modern-ui .full-start-new__buttons .full-start__button {
        width: 100%;
        min-height: 3.15em;
        margin: 0;
        justify-content: center;
    }

    body.lampa-modern-ui .full-start-new__buttons .full-start__button.lmui-primary-action {
        grid-column: 1 / -1;
    }

    body.lampa-modern-ui .search-box {
        width: 100%;
    }

    body.lampa-modern-ui .settings,
    body.lampa-modern-ui .selectbox,
    body.lampa-modern-ui .modal {
        align-items: flex-end;
    }

    body.lampa-modern-ui .settings__content,
    body.lampa-modern-ui .selectbox__content,
    body.lampa-modern-ui .modal__content {
        width: 100%;
        max-height: min(88vh, 54em);
        margin: 0;
        border-right: 0;
        border-bottom: 0;
        border-left: 0;
        border-radius: 1.2em 1.2em 0 0;
    }

    body.lampa-modern-ui .simple-keyboard {
        border-right: 0;
        border-bottom: 0;
        border-left: 0;
        border-radius: 1.15em 1.15em 0 0;
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

    function asArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function clone(value) {
        try { return JSON.parse(JSON.stringify(value)); }
        catch (error) { return value; }
    }

    function boolValue(value, fallback) {
        if (value === undefined || value === null || value === '') return fallback;
        if (value === false || value === 0 || value === '0' || value === 'false') return false;
        if (value === true || value === 1 || value === '1' || value === 'true') return true;
        return fallback;
    }

    function storageGet(name, fallback) {
        try {
            if (window.Lampa && Lampa.Storage && typeof Lampa.Storage.get === 'function') return Lampa.Storage.get(name, fallback);
        } catch (error) {
            console.warn('[Lampa Modern UI] Storage.get failed:', name, error);
        }
        return fallback;
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

    function mediaType(card) {
        if (!card) return 'movie';
        var type = String(card.media_type || card.mediaType || card.method || '').toLowerCase();
        if (type === 'tv' || type === 'series' || type === 'show') return 'tv';
        if (type === 'movie') return 'movie';
        return card.name || card.original_name || card.first_air_date || card.number_of_seasons ? 'tv' : 'movie';
    }

    function contentId(card) {
        if (!card) return '';
        var source = String(card.source || 'tmdb');
        var id = card.id !== undefined && card.id !== null ? String(card.id) : '';
        if (id) return mediaType(card) + ':' + source + ':' + id;
        return mediaType(card) + ':title:' + String(card.title || card.name || card.original_title || card.original_name || '').toLowerCase();
    }

    function dedupeCards(items) {
        var seen = {};
        var result = [];
        asArray(items).forEach(function (item) {
            var card = item && item.card ? item.card : item;
            if (!card) return;
            var key = contentId(card);
            if (!key || seen[key]) return;
            seen[key] = true;
            result.push(clone(card));
        });
        return result;
    }

    function tagCards(items, rowId) {
        return asArray(items).map(function (item) {
            var card = clone(item);
            card.lmui_row_id = rowId;
            card.lmui_content_id = contentId(card);
            return card;
        });
    }

    function stateCard(rowId, state, title, text) {
        return {
            id: 'lmui-state-' + rowId + '-' + state,
            source: 'lmui',
            title: title,
            name: title,
            lmui_row_id: rowId,
            lmui_content_id: 'state:' + rowId + ':' + state,
            lmui_state: state,
            lmui_state_text: text,
            poster: './img/img_broken.svg'
        };
    }

    function favoriteGet(type) {
        try {
            if (window.Lampa && Lampa.Favorite && typeof Lampa.Favorite.get === 'function') return asArray(Lampa.Favorite.get({ type: type }));
        } catch (error) {
            console.warn('[Lampa Modern UI] Favorite.get failed:', type, error);
        }
        return [];
    }

    function continueCards() {
        var cards = [];
        try {
            if (window.Lampa && Lampa.Favorite && typeof Lampa.Favorite.continues === 'function') {
                cards = asArray(Lampa.Favorite.continues('movie')).concat(asArray(Lampa.Favorite.continues('tv')));
            }
        } catch (error) {
            return { status: 'error', results: [], error: error };
        }
        cards = dedupeCards(cards).slice(0, 12);
        return { status: cards.length ? 'ready' : 'empty', results: tagCards(cards, 'continue') };
    }

    function episodeCards() {
        try {
            var items = window.Lampa && Lampa.TimeTable && typeof Lampa.TimeTable.recently === 'function' ? asArray(Lampa.TimeTable.recently()) : [];
            var seen = {};
            var cards = [];
            items.forEach(function (item) {
                var sourceCard = item && item.card ? item.card : item;
                if (!sourceCard) return;
                var card = clone(sourceCard);
                var key = contentId(card);
                if (!key || seen[key]) return;
                seen[key] = true;
                var episode = item && item.episode || {};
                if (episode.season_number !== undefined && episode.episode_number !== undefined) {
                    card.lmui_episode_label = 'S' + episode.season_number + ' · E' + episode.episode_number;
                    if (episode.name) card.lmui_episode_name = String(episode.name);
                }
                cards.push(card);
            });
            cards = cards.slice(0, 18);
            return { status: cards.length ? 'ready' : 'empty', results: tagCards(cards, 'episodes') };
        } catch (error) {
            return { status: 'error', results: [], error: error };
        }
    }

    function recommendationCards() {
        try {
            if (!window.Lampa || !Lampa.Recomends || typeof Lampa.Recomends.get !== 'function') {
                return { status: 'loading', results: [] };
            }
            var cards = dedupeCards(asArray(Lampa.Recomends.get('movie')).concat(asArray(Lampa.Recomends.get('tv')))).slice(0, 20);
            return { status: cards.length ? 'ready' : 'loading', results: tagCards(cards, 'recommendations') };
        } catch (error) {
            return { status: 'error', results: [], error: error };
        }
    }

    function watchlistCards() {
        try {
            var cards = dedupeCards(favoriteGet('book')).slice(0, 18);
            return { status: cards.length ? 'ready' : 'empty', results: tagCards(cards, 'watchlist') };
        } catch (error) {
            return { status: 'error', results: [], error: error };
        }
    }

    function readHomeData() {
        return {
            continue: continueCards(),
            episodes: episodeCards(),
            watchlist: watchlistCards(),
            recommendations: recommendationCards()
        };
    }

    function visibleRowsForMode(mode) {
        return mode === 'minimal' ? ['continue', 'recommendations'] : HOME_ORDER.slice();
    }

    function rowPayload(rowId, state) {
        if (state.status === 'ready') return state.results;
        if (state.status === 'loading' && rowId === 'recommendations') {
            return [stateCard(rowId, 'loading', 'Подбираем рекомендации', 'Строка появится автоматически, когда Lampa завершит расчёт.')];
        }
        if (state.status === 'error') {
            return [stateCard(rowId, 'error', 'Не удалось загрузить раздел', 'Нажмите, чтобы повторить.')];
        }
        return [];
    }

    function rowCallback(rowId, results) {
        return function (call) {
            call({ title: HOME_TITLES[rowId], results: results });
        };
    }

    function homeCallbacks() {
        var mode = String(storageGet(KEYS.homeMode, 'focused') || 'focused');
        if (mode !== 'focused' && mode !== 'minimal') mode = 'focused';
        var data = readHomeData();
        return visibleRowsForMode(mode).map(function (rowId) {
            return { id: rowId, results: rowPayload(rowId, data[rowId]) };
        }).filter(function (row) {
            return row.results.length > 0;
        }).map(function (row) {
            return rowCallback(row.id, row.results);
        });
    }

    function homeSignature() {
        var data = readHomeData();
        return HOME_ORDER.map(function (id) {
            return id + ':' + data[id].status + ':' + data[id].results.length;
        }).join('|');
    }

    function registerHomeRow() {
        if (homeRow || !window.Lampa || !Lampa.ContentRows || typeof Lampa.ContentRows.add !== 'function') return false;
        homeRow = {
            name: 'lmui_home',
            title: 'Главная Modern UI',
            index: 0,
            screen: ['main'],
            call: function () {
                if (!boolValue(storageGet(KEYS.enabled, true), true)) return;
                if (!boolValue(storageGet(KEYS.homeEnabled, true), true)) return;
                var callbacks = homeCallbacks();
                return callbacks.length ? callbacks : undefined;
            }
        };
        Lampa.ContentRows.add(homeRow);
        storageSet('content_rows_lmui_home', boolValue(storageGet(KEYS.homeEnabled, true), true));
        return true;
    }

    function activeActivity() {
        try {
            var active = Lampa.Activity && typeof Lampa.Activity.active === 'function' ? Lampa.Activity.active() : null;
            return active || null;
        } catch (error) {
            return null;
        }
    }

    function activeComponent() {
        var active = activeActivity();
        return active && active.component || '';
    }

    function scheduleHomeRefresh(reason, delay) {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(function () {
            try {
                var active = activeActivity();
                if (!active || active.component !== 'main' || !Lampa.Activity || typeof Lampa.Activity.refresh !== 'function') return;
                var timestamp = Date.now ? Date.now() : new Date().getTime();
                if (timestamp - lastMainRefreshAt < 700) return;
                lastMainRefreshAt = timestamp;
                Lampa.Activity.refresh(false);
            } catch (error) {
                console.warn('[Lampa Modern UI] home refresh failed:', reason || 'update', error);
            }
        }, typeof delay === 'number' ? delay : 180);
    }

    function probeHomeData() {
        clearTimeout(dataProbeTimer);
        var signature = homeSignature();
        if (lastHomeSignature && signature !== lastHomeSignature) scheduleHomeRefresh('home-data-ready', 50);
        lastHomeSignature = signature;
        dataProbeAttempts += 1;
        if (dataProbeAttempts < 12 && signature.indexOf('recommendations:loading') >= 0) {
            dataProbeTimer = setTimeout(probeHomeData, Math.min(1600, 250 + dataProbeAttempts * 120));
        }
    }

    function layoutViewport() {
        var content = document.querySelector('.wrap__content');
        var width = content && (content.clientWidth || content.getBoundingClientRect && content.getBoundingClientRect().width) || 0;
        var height = content && (content.clientHeight || content.getBoundingClientRect && content.getBoundingClientRect().height) || 0;
        return {
            width: Math.max(width || 0, width ? 0 : (window.innerWidth || 0), width ? 0 : (document.documentElement && document.documentElement.clientWidth || 0)),
            height: Math.max(height || 0, height ? 0 : (window.innerHeight || 0), height ? 0 : (document.documentElement && document.documentElement.clientHeight || 0))
        };
    }

    function detectLayoutMode() {
        var viewport = layoutViewport();
        var shortest = Math.min(viewport.width, viewport.height);
        if (shortest <= 600) return 'phone';
        if (viewport.width <= 1100 || shortest <= 900) return 'tablet';
        return 'desktop';
    }

    function detectInputMode() {
        var body = document.body;
        var touch = Number(window.navigator && window.navigator.maxTouchPoints || 0);
        var coarse = false;
        var hover = false;
        var fine = false;
        try {
            coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
            hover = !!(window.matchMedia && window.matchMedia('(hover: hover)').matches);
            fine = !!(window.matchMedia && window.matchMedia('(pointer: fine)').matches);
        } catch (error) {}

        /* Lampa может считать desktop-браузер TV. Явный текущий способ ввода
         * важнее платформенной эвристики: mouse--controll означает pointer. */
        if (body && (body.classList.contains('mouse--controll') || body.classList.contains('mouse--control'))) return 'pointer';
        if (body && (body.classList.contains('touch--controll') || body.classList.contains('touch--control'))) return 'touch';
        if (!touch && hover && fine) return 'pointer';
        if (touch > 0 || coarse) return 'touch';
        if (body && (body.classList.contains('platform--tv') || body.classList.contains('tv'))) return 'remote';
        try {
            if (window.Lampa && Lampa.Platform && typeof Lampa.Platform.screen === 'function' && Lampa.Platform.screen('tv')) return 'remote';
        } catch (error) {}
        return hover ? 'pointer' : 'remote';
    }

    function removeThemeClasses(body) {
        Array.prototype.slice.call(body.classList).forEach(function (name) {
            if (name === 'lampa-modern-ui' || name.indexOf('lmui-density-') === 0 || name.indexOf('lmui-motion-') === 0 || name.indexOf('lmui-performance-') === 0 || name.indexOf('lmui-device-') === 0 || name.indexOf('lmui-layout-') === 0 || name.indexOf('lmui-input-') === 0) body.classList.remove(name);
        });
    }

    function applyTheme() {
        var body = document.body;
        if (!body) return;
        removeThemeClasses(body);
        if (!boolValue(storageGet(KEYS.enabled, true), true)) return;
        var density = String(storageGet(KEYS.density, 'comfortable') || 'comfortable');
        var motion = String(storageGet(KEYS.motion, 'calm') || 'calm');
        var performance = String(storageGet(KEYS.performance, 'standard') || 'standard');
        if (density !== 'comfortable' && density !== 'compact') density = 'comfortable';
        if (motion !== 'calm' && motion !== 'minimal') motion = 'calm';
        if (performance !== 'standard' && performance !== 'lite') performance = 'standard';
        var layout = detectLayoutMode();
        var input = detectInputMode();
        body.classList.add('lampa-modern-ui', 'lmui-density-' + density, 'lmui-motion-' + motion, 'lmui-performance-' + performance, 'lmui-layout-' + layout, 'lmui-input-' + input, 'lmui-device-' + (input === 'remote' ? 'tv' : layout));
    }

    function injectStyle() {
        var old = document.getElementById(STYLE_ID);
        if (old && old.parentNode) old.parentNode.removeChild(old);
        var legacy = document.getElementById('lampa-personal-style');
        if (legacy && legacy.parentNode) legacy.parentNode.removeChild(legacy);
        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.type = 'text/css';
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    function removeHiddenSettingsComponents() {
        if (!Lampa.SettingsApi || typeof Lampa.SettingsApi.removeComponent !== 'function') return;
        HIDDEN_COMPONENT_IDS.forEach(function (id) {
            try { Lampa.SettingsApi.removeComponent(id); }
            catch (error) { console.warn('[Lampa Modern UI] settings component removal failed:', id, error); }
        });
    }

    function cardData(card) {
        return card && card.card_data && typeof card.card_data === 'object' ? card.card_data : null;
    }

    function rowIdFromLine(line) {
        var card = line && line.querySelector ? line.querySelector('.card') : null;
        var data = cardData(card);
        return data && data.lmui_row_id || '';
    }

    function decorateStateCard(card) {
        var data = cardData(card);
        if (!data || !data.lmui_state) return;
        card.classList.add('lmui-state-card');
        var view = card.querySelector('.card__view');
        if (!view || view.querySelector('.lmui-row-state')) return;
        view.innerHTML = '';
        var state = document.createElement('div');
        state.className = 'lmui-row-state';
        state.innerHTML = '<div class="lmui-row-state__title"></div><div class="lmui-row-state__text"></div>' + (data.lmui_state === 'error' ? '<div class="lmui-row-state__action">Повторить</div>' : '');
        state.querySelector('.lmui-row-state__title').textContent = data.title || '';
        state.querySelector('.lmui-row-state__text').textContent = data.lmui_state_text || '';
        view.appendChild(state);
        var title = card.querySelector('.card__title');
        var age = card.querySelector('.card__age');
        if (title) title.remove();
        if (age) age.remove();
    }

    function backdropUrl(data) {
        if (!data || !data.backdrop_path) return '';
        try {
            if (window.Lampa && Lampa.Api && typeof Lampa.Api.img === 'function') return Lampa.Api.img(data.backdrop_path, 'w500');
        } catch (error) {}
        return String(data.backdrop_path || '');
    }

    function decorateContinueCard(card) {
        var data = cardData(card);
        if (!data || data.lmui_row_id !== 'continue') return;
        card.classList.add('lmui-continue-card');
        var image = card.querySelector('.card__img');
        var backdrop = backdropUrl(data);
        if (image && backdrop && image.getAttribute('data-lmui-backdrop') !== backdrop) {
            image.setAttribute('data-lmui-backdrop', backdrop);
            image.src = backdrop;
        }
    }

    function decorateEpisodeCard(card) {
        var data = cardData(card);
        if (!data || data.lmui_row_id !== 'episodes' || !data.lmui_episode_label) return;
        card.classList.add('lmui-episode-card');
        var view = card.querySelector('.card__view');
        if (!view || view.querySelector('.lmui-episode-badge')) return;
        var badge = document.createElement('div');
        badge.className = 'lmui-episode-badge';
        badge.textContent = data.lmui_episode_label;
        view.appendChild(badge);
    }

    function overlapRatio(a, b) {
        if (!a.length || !b.length) return 0;
        var lookup = {};
        a.forEach(function (id) { lookup[id] = true; });
        var matches = b.filter(function (id) { return lookup[id]; }).length;
        return matches / Math.min(a.length, b.length);
    }

    function decorateHomeRows(root) {
        if (activeComponent() !== 'main') return;
        var customEnabled = boolValue(storageGet(KEYS.enabled, true), true) && boolValue(storageGet(KEYS.homeEnabled, true), true);
        var lines = Array.prototype.slice.call((root || document).querySelectorAll('.items-line'));
        var customSets = {};
        lines.forEach(function (line) {
            line.classList.remove('lmui-row-continue', 'lmui-row-episodes', 'lmui-row-recommendations', 'lmui-row-watchlist', 'lmui-home-row', 'lmui-home-duplicate', 'lmui-home-hidden');
            var rowId = rowIdFromLine(line);
            if (!rowId) return;
            line.dataset.lmuiRow = rowId;
            line.classList.add('lmui-home-row', 'lmui-row-' + rowId);
            var ids = [];
            Array.prototype.slice.call(line.querySelectorAll('.card')).forEach(function (card) {
                card.classList.remove('lmui-hero-card');
                decorateStateCard(card);
                if (rowId === 'continue') decorateContinueCard(card);
                if (rowId === 'episodes') decorateEpisodeCard(card);
                var data = cardData(card);
                if (data && data.lmui_content_id && !data.lmui_state) ids.push(data.lmui_content_id);
            });
            customSets[rowId] = ids;
        });
        if (!customEnabled) return;
        lines.forEach(function (line) {
            if (rowIdFromLine(line)) return;
            var ids = Array.prototype.slice.call(line.querySelectorAll('.card')).map(function (card) {
                return contentId(cardData(card));
            }).filter(Boolean).slice(0, 8);
            if (ids.length < 3) return;
            var duplicate = Object.keys(customSets).some(function (rowId) {
                return customSets[rowId].length >= 3 && overlapRatio(customSets[rowId].slice(0, 8), ids) >= 0.6;
            });
            if (duplicate) line.classList.add('lmui-home-duplicate');
        });
    }

    function decoratePrimaryAction(root) {
        var scope = root || document;
        Array.prototype.slice.call(scope.querySelectorAll('.lmui-primary-action')).forEach(function (button) { button.classList.remove('lmui-primary-action'); });
        var activity = scope.matches && scope.matches('.activity--active') ? scope : scope.querySelector && scope.querySelector('.activity--active');
        var searchScope = activity || scope;
        var priority = searchScope.querySelector('.full-start-new__buttons .button--priority:not(.hide)');
        var play = searchScope.querySelector('.full-start-new__buttons .button--play:not(.hide)');
        var button = priority || play;
        if (button) button.classList.add('lmui-primary-action');
    }

    function decorateDetail(root) {
        var scope = root || document;
        var activity = scope.matches && scope.matches('.activity--active') ? scope : scope.querySelector && scope.querySelector('.activity--active');
        if (!activity || activeComponent() !== 'full') return;
        activity.classList.add('lmui-detail-screen');
        activity.classList.remove('lmui-detail-series');
        var active = activeActivity();
        var card = active && (active.card || active.object && active.object.card || active.object);
        if (mediaType(card) === 'tv') activity.classList.add('lmui-detail-series');
        decoratePrimaryAction(activity);
    }

    function searchRoot() {
        return document.querySelector('.activity--active .search, .activity--active .search-box') || document.querySelector('.search--open .search, .search--open .search-box');
    }

    function decorateSearch() {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
            var root = searchRoot();
            if (!root) return;
            var screen = root.closest('.activity--active') || root.parentElement;
            if (!screen) return;
            screen.classList.add('lmui-search-screen');
            var input = root.querySelector('input, .search__input, .simple-keyboard-input');
            var query = String(input && (input.value !== undefined ? input.value : input.textContent) || '').trim();
            var results = screen.querySelectorAll('.card, .search-item, .explorer-card').length;
            var loading = !!screen.querySelector('.search-looking, .content-loading, .loading-layer');
            var state = query ? (loading ? 'active' : results ? 'results' : 'empty') : 'landing';
            screen.setAttribute('data-lmui-search-state', state);
            var hint = screen.querySelector('.lmui-search-hint');
            if (!hint) {
                hint = document.createElement('div');
                hint.className = 'lmui-search-hint';
                root.insertAdjacentElement('afterend', hint);
            }
            if (state === 'empty') hint.innerHTML = '<strong>Ничего не найдено</strong>Проверьте название или переключите источник.';
            else hint.innerHTML = '<strong>Поиск фильмов и сериалов</strong>Введите название. Недавние запросы и источники останутся рядом с полем.';
        }, 120);
    }

    function decorateNode(root) {
        if (!root || root.nodeType !== 1) return;
        if (activeComponent() === 'main') decorateHomeRows(root.closest && root.closest('.activity--active') || root);
        if (activeComponent() === 'full') decorateDetail(root.closest && root.closest('.activity--active') || root);
        if (activeComponent() === 'search' || root.closest && root.closest('.search, .search-box')) decorateSearch();
    }

    function scheduleDecorate(root) {
        if (decorateTimer) return;
        decorateTimer = setTimeout(function () {
            decorateTimer = 0;
            var activity = document.querySelector('.activity--active');
            decorateNode(root || activity || document.body);
        }, 0);
    }

    function observeActiveActivity() {
        var root = document.querySelector('.activity--active');
        if (!root || root === observedRoot || !window.MutationObserver) return;
        if (activeObserver) activeObserver.disconnect();
        observedRoot = root;
        activeObserver = new MutationObserver(function (records) {
            records.forEach(function (record) {
                Array.prototype.slice.call(record.addedNodes || []).forEach(function (node) {
                    if (node && node.nodeType === 1) scheduleDecorate(node);
                });
            });
        });
        activeObserver.observe(root, { childList: true, subtree: true });
        scheduleDecorate(root);
    }

    function focusedCardState(card) {
        var line = card && card.closest ? card.closest('.items-line') : null;
        var data = cardData(card);
        if (!line || !data) return null;
        var cards = Array.prototype.slice.call(line.querySelectorAll('.card'));
        var scrollBody = card.parentElement;
        return {
            rowId: data.lmui_row_id || rowIdFromLine(line),
            contentId: data.lmui_content_id || contentId(data),
            fallbackIndex: Math.max(0, cards.indexOf(card)),
            scrollLeft: scrollBody && typeof scrollBody.scrollLeft === 'number' ? scrollBody.scrollLeft : 0
        };
    }

    function rememberFocus(card) {
        if (activeComponent() !== 'main') return;
        var state = focusedCardState(card);
        if (state) focusState = state;
    }

    function restoreFocus() {
        if (!focusState || activeComponent() !== 'main') return;
        var lines = Array.prototype.slice.call(document.querySelectorAll('.activity--active .items-line'));
        var line = lines.filter(function (candidate) { return rowIdFromLine(candidate) === focusState.rowId; })[0];
        if (!line) return;
        var cards = Array.prototype.slice.call(line.querySelectorAll('.card'));
        var card = cards.filter(function (candidate) {
            var data = cardData(candidate);
            return data && (data.lmui_content_id || contentId(data)) === focusState.contentId;
        })[0] || cards[Math.min(focusState.fallbackIndex || 0, Math.max(0, cards.length - 1))];
        if (!card) return;
        if (card.parentElement && typeof card.parentElement.scrollLeft === 'number') card.parentElement.scrollLeft = focusState.scrollLeft || 0;
        try {
            if (window.$ && Lampa.Controller && typeof Lampa.Controller.collectionFocus === 'function') Lampa.Controller.collectionFocus($(card), $(line), true);
            else if (window.$) $(card).trigger('hover:focus');
        } catch (error) {
            console.warn('[Lampa Modern UI] focus restore failed:', error);
        }
    }

    function focusPrimaryAction() {
        var button = document.querySelector('.activity--active .full-start-new__buttons .lmui-primary-action');
        var activity = document.querySelector('.activity--active');
        if (!button || !activity || !window.$ || !Lampa.Controller || typeof Lampa.Controller.collectionFocus !== 'function') return;
        try { Lampa.Controller.collectionFocus($(button), $(activity), true); }
        catch (error) { console.warn('[Lampa Modern UI] primary focus failed:', error); }
    }

    function setInputModeClass(mode) {
        var body = document.body;
        if (!body || ['pointer', 'touch', 'remote'].indexOf(mode) < 0) return;
        ['lmui-input-pointer', 'lmui-input-touch', 'lmui-input-remote'].forEach(function (name) { body.classList.remove(name); });
        body.classList.add('lmui-input-' + mode);
        ['lmui-device-tv', 'lmui-device-desktop', 'lmui-device-tablet', 'lmui-device-phone'].forEach(function (name) { body.classList.remove(name); });
        body.classList.add('lmui-device-' + (mode === 'remote' ? 'tv' : detectLayoutMode()));
    }

    function installInputModeListeners() {
        if (inputListenersInstalled) return;
        inputListenersInstalled = true;
        window.addEventListener('pointerdown', function (event) {
            setInputModeClass(event && event.pointerType === 'touch' ? 'touch' : 'pointer');
        }, { passive: true });
        window.addEventListener('mousemove', function () { setInputModeClass('pointer'); }, { passive: true });
        window.addEventListener('touchstart', function () { setInputModeClass('touch'); }, { passive: true });
        window.addEventListener('keydown', function (event) {
            var key = event && event.key || '';
            if (key.indexOf('Arrow') === 0 || key === 'Enter' || key === 'Escape') setInputModeClass('remote');
        }, { passive: true });
    }

    function installInteractionHandlers() {
        if (!window.$) return;
        try {
            $(document).off('.lmui');
            $(document).on('hover:focus.lmui', '.activity--active .card', function () { rememberFocus(this); });
            $(document).on('hover:enter.lmui', '.activity--active .lmui-state-card', function (event) {
                var data = cardData(this);
                if (!data || data.lmui_state !== 'error') return;
                if (event && event.stopImmediatePropagation) event.stopImmediatePropagation();
                dataProbeAttempts = 0;
                probeHomeData();
                scheduleHomeRefresh('state-retry', 50);
            });
            $(document).on('input.lmui change.lmui keyup.lmui', '.search__input, .simple-keyboard-input, .search-box input', decorateSearch);
        } catch (error) {
            console.warn('[Lampa Modern UI] interaction handlers failed:', error);
        }
    }

    function addSettings() {
        var icon = '<svg viewBox="0 0 32 32" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="5" width="24" height="22" rx="7" stroke="currentColor" stroke-width="2"/><path d="M9 19.5 13.2 15l3.3 3.1L23 11.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="23" cy="11.5" r="2" fill="currentColor"/></svg>';
        Lampa.SettingsApi.addComponent({ component: PLUGIN_ID, name: 'Интерфейс', icon: icon });
        Lampa.SettingsApi.addParam({ component: PLUGIN_ID, param: { name: KEYS.enabled, type: 'trigger', default: true }, field: { name: 'Новый интерфейс', description: 'Единое оформление главной, карточек, поиска, фильма и настроек.' }, onChange: function () { applyTheme(); scheduleDecorate(); } });
        Lampa.SettingsApi.addParam({ component: PLUGIN_ID, param: { name: KEYS.density, type: 'select', values: { comfortable: 'Комфортно', compact: 'Компактно' }, default: 'comfortable' }, field: { name: 'Размер карточек', description: 'Компактный режим показывает больше контента в строке.' }, onChange: applyTheme });
        Lampa.SettingsApi.addParam({ component: PLUGIN_ID, param: { name: KEYS.motion, type: 'select', values: { calm: 'Плавно', minimal: 'Без анимаций' }, default: 'calm' }, field: { name: 'Движение', description: 'Отключает декоративные переходы, сохраняя состояния фокуса.' }, onChange: applyTheme });
        Lampa.SettingsApi.addParam({ component: PLUGIN_ID, param: { name: KEYS.performance, type: 'select', values: { standard: 'Обычный', lite: 'Экономный' }, default: 'standard' }, field: { name: 'Производительность', description: 'Экономный режим отключает динамический фон и тяжёлые тени.' }, onChange: applyTheme });
        Lampa.SettingsApi.addParam({ component: PLUGIN_ID, param: { name: KEYS.homeEnabled, type: 'trigger', default: true }, field: { name: 'Новая главная', description: 'Добавляет продолжение, новые серии, мой список и штатные рекомендации.' }, onChange: function () { storageSet('content_rows_lmui_home', boolValue(storageGet(KEYS.homeEnabled, true), true)); scheduleHomeRefresh('home-enabled'); } });
        Lampa.SettingsApi.addParam({ component: PLUGIN_ID, param: { name: KEYS.homeMode, type: 'select', values: { focused: 'Полная', minimal: 'Минимальная' }, default: 'focused' }, field: { name: 'Состав главной', description: 'Минимальная оставляет только «Продолжить» и «Для вас».' }, onChange: function () { scheduleHomeRefresh('home-mode'); } });
    }

    function destructiveCleanup() {
        if (boolValue(storageGet(CLEANUP_KEY, false), false)) return;
        storageSet('lpersonal_profile_v1', '');
        storageSet('content_rows_lpersonal_home', false);
        storageSet('lpersonal_enabled', false);
        storageSet('lpersonal_card_panel', false);
        storageSet(CLEANUP_KEY, true);
    }

    function readyToStart() {
        return !!(document.head && document.body && window.Lampa && Lampa.Storage && Lampa.SettingsApi && Lampa.ContentRows);
    }

    function followEvents() {
        if (!Lampa.Listener || typeof Lampa.Listener.follow !== 'function') return;
        Lampa.Listener.follow('activity', function (event) {
            if (!event) return;
            if (event.type === 'start' || event.type === 'create') {
                setTimeout(function () {
                    observeActiveActivity();
                    scheduleDecorate();
                    if (event.component === 'main') restoreFocus();
                }, 60);
            }
            if (event.type === 'archive') scheduleDecorate();
        });
        Lampa.Listener.follow('resize_end', function () { applyTheme(); scheduleDecorate(); });
        Lampa.Listener.follow('full', function (event) {
            if (!event) return;
            if (event.type === 'start' || event.type === 'complite') {
                scheduleDecorate(event.body && event.body[0]);
                if (event.type === 'complite') setTimeout(focusPrimaryAction, 80);
            }
        });
        Lampa.Listener.follow('favorite', function () { scheduleHomeRefresh('favorite'); });
    }

    function start() {
        if (window[READY_FLAG]) return;
        if (!readyToStart()) {
            startAttempts += 1;
            if (startAttempts < START_ATTEMPTS) {
                clearTimeout(startTimer);
                startTimer = setTimeout(start, 100);
            } else console.warn('[Lampa Modern UI] Required Lampa API unavailable');
            return;
        }
        window[READY_FLAG] = true;
        destructiveCleanup();
        injectStyle();
        removeHiddenSettingsComponents();
        try { if (Lampa.SettingsApi && typeof Lampa.SettingsApi.removeComponent === 'function') Lampa.SettingsApi.removeComponent('lampa_personal'); } catch (error) {}
        addSettings();
        registerHomeRow();
        applyTheme();
        installInteractionHandlers();
        installInputModeListeners();
        followEvents();
        observeActiveActivity();
        scheduleDecorate();
        dataProbeAttempts = 0;
        lastHomeSignature = homeSignature();
        probeHomeData();
        window.addEventListener('orientationchange', function () { applyTheme(); scheduleDecorate(); }, { passive: true });
        console.info('[Lampa Modern UI] v' + VERSION + ' loaded');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();

    if (window.Lampa && Lampa.Listener && typeof Lampa.Listener.follow === 'function') {
        Lampa.Listener.follow('app', function (event) { if (event && event.type === 'ready') start(); });
    }
})();
