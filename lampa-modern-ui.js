/* Lampa Modern UI 0.10.0
 * Единый UI-слой и простая главная на штатных данных Lampa.
 * Собственный профиль, рекомендации, импорт/экспорт и timeline mirror удалены.
 */
(function () {
    'use strict';

    var VERSION = '0.10.0';
    var PLUGIN_ID = 'lampa_modern_ui';
    var STYLE_ID = 'lampa-modern-ui-style';
    var READY_FLAG = '__lampa_modern_ui_v0100_ready__';
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
    var dataProbeStartedAt = 0;
    var recommendationProbeDone = false;
    var focusState = null;
    var originalMainComponent = null;
    var mainComponentRegistered = false;
    var activeModernMain = null;
    var mainViewState = { rowId: '', contentId: '', fallbackIndex: 0, verticalPosition: 0, rowPositions: {} };
    var searchTimer = 0;
    var settingsCleanupTimer = 0;
    var pendingDecorateRoots = [];
    var inputListenersInstalled = false;
    var lastInputMode = '';
    var detailNeedsInitialFocus = false;
    var detailUserInteracted = false;

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
        watching_series: 'Сейчас смотрю',
        continue_movies: 'Продолжить фильмы',
        watchlist: 'Мой список',
        recommendations: 'Для вас'
    };

    var HOME_ORDER = ['watching_series', 'continue_movies', 'watchlist', 'recommendations'];

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

/* Owned main component. Every row has a stable ID and its own native Lampa scroll. */
body.lampa-modern-ui .lmui-main-scroll > .scroll__content > .scroll__body {
    padding-top: 0.35em;
    padding-bottom: 4em;
}

body.lampa-modern-ui .lmui-main {
    min-height: 100%;
}

body.lampa-modern-ui .lmui-owned-row {
    margin-bottom: 0.95em;
}

body.lampa-modern-ui .lmui-owned-row .items-line__body > .scroll {
    overflow: visible;
}

body.lampa-modern-ui .lmui-owned-row .mapping--line {
    display: flex;
    align-items: flex-start;
    gap: 0.62em;
    padding-top: 0.35em;
    padding-bottom: 1.05em;
}

body.lampa-modern-ui .lmui-row-watching_series,
body.lampa-modern-ui .lmui-row-continue_movies {
    margin-bottom: 1.05em;
}

body.lampa-modern-ui .lmui-row-watching_series .items-line__title,
body.lampa-modern-ui .lmui-row-continue_movies .items-line__title {
    font-size: clamp(1.24em, 1.55vw, 1.62em);
}

body.lampa-modern-ui .lmui-row-watching_series .card,
body.lampa-modern-ui .lmui-row-continue_movies .card {
    width: clamp(16.5em, 23vw, 21.5em) !important;
    min-width: 16.5em;
}

body.lampa-modern-ui .lmui-row-watching_series .card__view,
body.lampa-modern-ui .lmui-row-continue_movies .card__view {
    aspect-ratio: 16 / 9;
    min-height: 0;
}

body.lampa-modern-ui .lmui-row-watching_series .card__img,
body.lampa-modern-ui .lmui-row-watching_series .card__filter,
body.lampa-modern-ui .lmui-row-watching_series .card__textbox,
body.lampa-modern-ui .lmui-row-continue_movies .card__img,
body.lampa-modern-ui .lmui-row-continue_movies .card__filter,
body.lampa-modern-ui .lmui-row-continue_movies .card__textbox {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

body.lampa-modern-ui .lmui-row-watching_series .card__title,
body.lampa-modern-ui .lmui-row-continue_movies .card__title {
    font-size: 1.02em;
    font-weight: 700;
}

body.lampa-modern-ui .lmui-row-watching_series .time-line,
body.lampa-modern-ui .lmui-row-continue_movies .time-line {
    height: 0.38em;
}

body.lampa-modern-ui .lmui-owned-card .card__view {
    position: relative;
}

body.lampa-modern-ui .lmui-card-context {
    position: absolute;
    left: 0.55em;
    right: 0.55em;
    bottom: 0.55em;
    z-index: 4;
    overflow: hidden;
    padding: 0.34em 0.58em;
    border-radius: 0.52em;
    background: rgba(5, 8, 14, 0.9);
    color: #fff;
    font-size: 0.8em;
    font-weight: 720;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
}

body.lampa-modern-ui .lmui-card-context--new {
    background: rgba(28, 86, 157, 0.94);
}

body.lampa-modern-ui .lmui-main-empty {
    min-height: 16em;
    display: grid;
    place-items: center;
    padding: 2em;
    color: var(--lmui-muted);
    text-align: center;
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

/* Input mode is independent from viewport layout. */
body.lampa-modern-ui.lmui-input-pointer .card.hover:not(.focus) {
    transform: translateY(-0.05em) scale(1.012);
}

body.lampa-modern-ui.lmui-input-keyboard .card.focus {
    transform: translateY(-0.09em) scale(1.026);
}

body.lampa-modern-ui.lmui-input-keyboard .card.focus .card__view {
    box-shadow: 0 0 0 0.11em var(--lmui-accent), 0 0 0 0.24em rgba(105, 167, 255, 0.22), 0 0.9em 2.2em rgba(0, 0, 0, 0.4);
}

body.lampa-modern-ui.lmui-input-remote .card.focus {
    transform: translateY(-0.16em) scale(1.05);
}

body.lampa-modern-ui.lmui-input-remote .card.focus .card__view {
    box-shadow: 0 0 0 0.14em var(--lmui-accent), 0 0 0 0.3em rgba(105, 167, 255, 0.26), 0 1.3em 3.1em rgba(0, 0, 0, 0.5);
}

body.lampa-modern-ui.lmui-input-remote .menu__item,
body.lampa-modern-ui.lmui-input-remote .settings-folder,
body.lampa-modern-ui.lmui-input-remote .settings-param,
body.lampa-modern-ui.lmui-input-remote .selectbox-item {
    min-height: 3.2em;
}

body.lampa-modern-ui.lmui-height-compact {
    --lmui-display: clamp(2.05em, 3.8vw, 3.8em);
}

body.lampa-modern-ui.lmui-height-compact .full-start-new {
    min-height: calc(100vh - 5.4em);
    padding-bottom: 2.4em;
}

/* Tablet: based on the real Lampa content width, not browser window width. */
body.lampa-modern-ui.lmui-layout-tablet {
    --lmui-gutter: clamp(0.95em, 2.6vw, 1.7em);
    --lmui-display: clamp(2.15em, 5.2vw, 3.55em);
}

body.lampa-modern-ui.lmui-layout-tablet .full-start-new__left {
    width: min(31vw, 17em);
    margin-right: clamp(1.2em, 2.5vw, 2em);
}

body.lampa-modern-ui.lmui-layout-tablet .full-start-new__right {
    max-width: calc(100vw - 21em);
}

body.lampa-modern-ui.lmui-layout-tablet .full-start-new__title {
    max-width: 18ch;
}

body.lampa-modern-ui.lmui-layout-tablet .full-start-new__description {
    max-width: 54ch;
    -webkit-line-clamp: 6;
    line-clamp: 6;
}

body.lampa-modern-ui.lmui-layout-tablet .full-start-new__buttons {
    flex-wrap: wrap;
}

body.lampa-modern-ui.lmui-layout-tablet .settings__content,
body.lampa-modern-ui.lmui-layout-tablet .selectbox__content,
body.lampa-modern-ui.lmui-layout-tablet .modal__content {
    width: min(88vw, 52em);
    max-height: 86vh;
}

body.lampa-modern-ui.lmui-layout-tablet .lmui-row-watching_series .card,
body.lampa-modern-ui.lmui-layout-tablet .lmui-row-continue_movies .card {
    width: min(39vw, 20em) !important;
    min-width: 15em;
}

/* Phone: the class is derived from the actual Lampa content width. */
body.lampa-modern-ui.lmui-layout-phone {
    --lmui-radius-md: 0.86em;
    --lmui-radius-lg: 1.15em;
    --lmui-gutter: max(0.75em, env(safe-area-inset-left));
    --lmui-display: clamp(2em, 9.5vw, 3.1em);
    --lmui-heading: clamp(1.45em, 6vw, 2em);
    --lmui-section: clamp(1.12em, 4.8vw, 1.4em);
    --lmui-body: clamp(0.96em, 3.9vw, 1.08em);
}

body.lampa-modern-ui.lmui-layout-phone::before {
    background: linear-gradient(160deg, #0d1320, #070a10 58%, #04060a);
}

body.lampa-modern-ui.lmui-layout-phone .wrap__content,
body.lampa-modern-ui.lmui-layout-phone .activity__body {
    padding-left: max(0.72em, env(safe-area-inset-left));
    padding-right: max(0.72em, env(safe-area-inset-right));
}

body.lampa-modern-ui.lmui-layout-phone .head__body {
    padding-top: 0.42em;
    padding-bottom: 0.48em;
}

body.lampa-modern-ui.lmui-layout-phone .head__title {
    font-size: 1.35em;
}

body.lampa-modern-ui.lmui-layout-phone .head__action {
    width: 2.7em;
    height: 2.7em;
}

body.lampa-modern-ui.lmui-layout-phone .items-line__head {
    min-height: 2.55em;
    margin-bottom: 0.1em;
}

body.lampa-modern-ui.lmui-layout-phone .card:not(.card--wide):not(.card--collection):not(.card--category) {
    width: min(42vw, 11.2em);
    min-width: 8.5em;
}

body.lampa-modern-ui.lmui-layout-phone.lmui-density-compact .card:not(.card--wide):not(.card--collection):not(.card--category) {
    width: min(37vw, 9.8em);
    min-width: 7.7em;
}

body.lampa-modern-ui.lmui-layout-phone .lmui-row-watching_series .card,
body.lampa-modern-ui.lmui-layout-phone .lmui-row-continue_movies .card {
    width: min(76vw, 20em) !important;
    min-width: 14.5em;
}

body.lampa-modern-ui.lmui-layout-phone .card.focus,
body.lampa-modern-ui.lmui-layout-phone .card.hover {
    transform: none;
}

body.lampa-modern-ui.lmui-layout-phone .card.focus .card__view,
body.lampa-modern-ui.lmui-layout-phone .card.hover .card__view {
    box-shadow: var(--lmui-focus-ring), 0 0.75em 1.8em rgba(0, 0, 0, 0.35);
}

body.lampa-modern-ui.lmui-layout-phone .full-start-new {
    padding-bottom: 2em;
}

body.lampa-modern-ui.lmui-layout-phone .full-start-new__right {
    width: 100%;
    padding-top: 1.25em;
    background: linear-gradient(180deg, transparent, rgba(7, 10, 16, 0.96) 14%);
}

body.lampa-modern-ui.lmui-layout-phone .full-start-new__title {
    max-width: 100%;
    -webkit-line-clamp: 3;
    line-clamp: 3;
}

body.lampa-modern-ui.lmui-layout-phone .full-start-new__description {
    max-width: 100%;
    -webkit-line-clamp: 5;
    line-clamp: 5;
}

body.lampa-modern-ui.lmui-layout-phone .full-start-new__buttons {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5em;
    overflow: visible;
}

body.lampa-modern-ui.lmui-layout-phone .full-start-new__buttons .full-start__button {
    width: 100%;
    min-height: 3.15em;
    margin: 0;
    justify-content: center;
}

body.lampa-modern-ui.lmui-layout-phone .full-start-new__buttons .full-start__button.lmui-primary-action {
    grid-column: 1 / -1;
}

body.lampa-modern-ui.lmui-layout-phone .search-box {
    width: 100%;
}

body.lampa-modern-ui.lmui-layout-phone .settings,
body.lampa-modern-ui.lmui-layout-phone .selectbox,
body.lampa-modern-ui.lmui-layout-phone .modal {
    align-items: flex-end;
}

body.lampa-modern-ui.lmui-layout-phone .settings__content,
body.lampa-modern-ui.lmui-layout-phone .selectbox__content,
body.lampa-modern-ui.lmui-layout-phone .modal__content {
    width: 100%;
    max-height: min(88vh, 54em);
    margin: 0;
    border-right: 0;
    border-bottom: 0;
    border-left: 0;
    border-radius: 1.2em 1.2em 0 0;
}

body.lampa-modern-ui.lmui-layout-phone .simple-keyboard {
    border-right: 0;
    border-bottom: 0;
    border-left: 0;
    border-radius: 1.15em 1.15em 0 0;
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

    function favoriteGet(type) {
        try {
            if (window.Lampa && Lampa.Favorite && typeof Lampa.Favorite.get === 'function') return asArray(Lampa.Favorite.get({ type: type }));
        } catch (error) {
            console.warn('[Lampa Modern UI] Favorite.get failed:', type, error);
        }
        return [];
    }

    function favoriteContinues(type) {
        if (!window.Lampa || !Lampa.Favorite || typeof Lampa.Favorite.continues !== 'function') {
            return { available: false, items: [] };
        }
        try {
            return { available: true, items: asArray(Lampa.Favorite.continues(type)) };
        } catch (error) {
            return { available: true, items: [], error: error };
        }
    }

    function continueMovieCards() {
        var source = favoriteContinues('movie');
        if (!source.available || source.error) return { status: 'error', results: [], error: source.error || new Error('Favorite.continues unavailable') };
        var cards = dedupeCards(source.items).slice(0, 14);
        cards.forEach(function (card) { card.lmui_context_label = 'Продолжить просмотр'; });
        return { status: cards.length ? 'ready' : 'empty', results: tagCards(cards, 'continue_movies') };
    }

    function recentEpisodeItems() {
        if (!window.Lampa || !Lampa.TimeTable || typeof Lampa.TimeTable.recently !== 'function') {
            return { available: false, items: [] };
        }
        try {
            return { available: true, items: asArray(Lampa.TimeTable.recently()) };
        } catch (error) {
            return { available: true, items: [], error: error };
        }
    }

    function episodeLabel(episode) {
        if (!episode) return '';
        var season = episode.season_number !== undefined ? episode.season_number : episode.season;
        var number = episode.episode_number !== undefined ? episode.episode_number : episode.episode;
        if (season === undefined || number === undefined) return '';
        return 'S' + season + ' · E' + number;
    }

    function watchingSeriesCards() {
        var continued = favoriteContinues('tv');
        var recent = recentEpisodeItems();
        if (!continued.available && !recent.available) {
            return { status: 'error', results: [], error: new Error('Series sources unavailable') };
        }

        var seen = {};
        var cards = [];
        var sourceError = continued.error || recent.error;

        (recent.error ? [] : recent.items).forEach(function (item) {
            var sourceCard = item && item.card ? item.card : item;
            if (!sourceCard) return;
            var card = clone(sourceCard);
            var key = contentId(card);
            if (!key || seen[key]) return;
            seen[key] = true;
            var label = episodeLabel(item && item.episode);
            card.lmui_episode_label = label;
            card.lmui_episode_name = item && item.episode && item.episode.name ? String(item.episode.name) : '';
            card.lmui_context_label = label ? 'Новая серия · ' + label : 'Новая серия';
            card.lmui_context_new = true;
            cards.push(card);
        });

        (continued.error ? [] : continued.items).forEach(function (item) {
            var card = clone(item && item.card ? item.card : item);
            if (!card) return;
            var key = contentId(card);
            if (!key || seen[key]) return;
            seen[key] = true;
            var label = episodeLabel(card);
            card.lmui_episode_label = label;
            card.lmui_context_label = label ? 'Продолжить · ' + label : 'Продолжить сериал';
            cards.push(card);
        });

        cards = cards.slice(0, 16);
        if (!cards.length && sourceError) return { status: 'error', results: [], error: sourceError };
        return { status: cards.length ? 'ready' : 'empty', results: tagCards(cards, 'watching_series') };
    }

    function recommendationCards() {
        try {
            if (!window.Lampa || !Lampa.Recomends || typeof Lampa.Recomends.get !== 'function') {
                return recommendationProbeDone
                    ? { status: 'error', results: [], error: new Error('Recomends API unavailable') }
                    : { status: 'loading', results: [] };
            }
            var cards = dedupeCards(asArray(Lampa.Recomends.get('movie')).concat(asArray(Lampa.Recomends.get('tv')))).slice(0, 20);
            if (cards.length) return { status: 'ready', results: tagCards(cards, 'recommendations') };
            return { status: recommendationProbeDone ? 'empty' : 'loading', results: [] };
        } catch (error) {
            return { status: 'error', results: [], error: error };
        }
    }

    function watchlistCards() {
        try {
            if (!window.Lampa || !Lampa.Favorite || typeof Lampa.Favorite.get !== 'function') {
                return { status: 'error', results: [], error: new Error('Favorite.get unavailable') };
            }
            var cards = dedupeCards(favoriteGet('book')).slice(0, 18);
            return { status: cards.length ? 'ready' : 'empty', results: tagCards(cards, 'watchlist') };
        } catch (error) {
            return { status: 'error', results: [], error: error };
        }
    }

    function readHomeData() {
        return {
            watching_series: watchingSeriesCards(),
            continue_movies: continueMovieCards(),
            watchlist: watchlistCards(),
            recommendations: recommendationCards()
        };
    }

    function visibleRowsForMode(mode) {
        return mode === 'minimal' ? ['watching_series', 'continue_movies', 'recommendations'] : HOME_ORDER.slice();
    }

    function rowStateCopy(rowId, status) {
        var copy = {
            watching_series: {
                empty: ['Пока нечего продолжать', 'Начните сериал или добавьте его в избранное. Новые непросмотренные серии появятся здесь.'],
                error: ['Не удалось прочитать сериалы', 'Повторите чтение локальной истории и расписания.']
            },
            continue_movies: {
                empty: ['Нет незавершённых фильмов', 'Начните фильм — он появится здесь с сохранённым прогрессом.'],
                error: ['Не удалось прочитать историю', 'Повторите чтение локального списка продолжения.']
            },
            watchlist: {
                empty: ['Мой список пока пуст', 'Добавляйте фильмы и сериалы в закладки, чтобы быстро возвращаться к ним.'],
                error: ['Не удалось открыть список', 'Повторите чтение избранного.']
            },
            recommendations: {
                loading: ['Подбираем рекомендации', 'Lampa ещё формирует подборку.'],
                empty: ['Пока нет рекомендаций', 'Откройте или добавьте несколько фильмов и сериалов — подборка появится позже.'],
                error: ['Не удалось загрузить рекомендации', 'Повторите чтение штатного модуля рекомендаций.']
            }
        };
        return copy[rowId] && copy[rowId][status] || ['Раздел недоступен', 'Повторите попытку.'];
    }

    function stateSignature(id, state) {
        var ids = asArray(state && state.results).slice(0, 8).map(function (card) {
            return card && (card.lmui_content_id || contentId(card));
        }).filter(Boolean);
        return id + ':' + state.status + ':' + asArray(state && state.results).length + ':' + ids.join(',');
    }

    function homeSignatureFromData(data) {
        return HOME_ORDER.map(function (id) { return stateSignature(id, data[id]); }).join('|');
    }

    function homeSignature() {
        return homeSignatureFromData(readHomeData());
    }

    function customHomeEnabled() {
        return boolValue(storageGet(KEYS.enabled, true), true) && boolValue(storageGet(KEYS.homeEnabled, true), true);
    }

    function restoreScrollObject(scroll, position) {
        if (!scroll || typeof position !== 'number' || !isFinite(position)) return;
        try {
            if (typeof scroll.position === 'function' && typeof scroll.shift === 'function') {
                var current = Number(scroll.position()) || 0;
                scroll.shift(current - position);
            }
        } catch (error) {
            console.warn('[Lampa Modern UI] owned scroll restore failed:', error);
        }
    }

    function openHomeCard(data, object) {
        if (!data || data.lmui_state) return;
        try {
            if (Lampa.Router && typeof Lampa.Router.call === 'function') {
                Lampa.Router.call('full', data);
                return;
            }
            if (Lampa.Activity && typeof Lampa.Activity.push === 'function') {
                Lampa.Activity.push({
                    url: '',
                    title: data.title || data.name || '',
                    component: 'full',
                    id: data.id,
                    method: mediaType(data),
                    card: data,
                    source: data.source || object && object.source || 'tmdb'
                });
            }
        } catch (error) {
            console.warn('[Lampa Modern UI] open card failed:', error);
        }
    }

    function updateHomeBackground(data) {
        try {
            if (Lampa.Background && typeof Lampa.Background.change === 'function' && Lampa.Utils && typeof Lampa.Utils.cardImgBackground === 'function') {
                Lampa.Background.change(Lampa.Utils.cardImgBackground(data));
            }
        } catch (error) {}
    }

    function ModernMainComponent(object) {
        var self = this;
        var verticalScroll = new Lampa.Scroll({ mask: true, over: true });
        var renderNode = verticalScroll.render(true);
        var bodyNode = verticalScroll.body(true);
        var rows = [];
        var builtSignature = '';
        var created = false;
        var destroyed = false;
        var restoring = false;
        var currentRowIndex = 0;
        var currentCardIndex = 0;

        renderNode.classList.add('lmui-main-scroll');
        bodyNode.classList.add('lmui-main');

        function stateNode(rowId, status) {
            var copy = rowStateCopy(rowId, status);
            var node = document.createElement('div');
            node.className = 'card selector lmui-state-card lmui-owned-card';
            node.card_data = {
                lmui_row_id: rowId,
                lmui_content_id: 'state:' + rowId + ':' + status,
                lmui_state: status,
                lmui_state_row: rowId,
                title: copy[0]
            };
            node.setAttribute('data-lmui-content', node.card_data.lmui_content_id);
            var view = document.createElement('div');
            view.className = 'card__view';
            var state = document.createElement('div');
            state.className = 'lmui-row-state';
            var title = document.createElement('div');
            title.className = 'lmui-row-state__title';
            title.textContent = copy[0];
            var text = document.createElement('div');
            text.className = 'lmui-row-state__text';
            text.textContent = copy[1];
            state.appendChild(title);
            state.appendChild(text);
            if (status === 'error') {
                var action = document.createElement('div');
                action.className = 'lmui-row-state__action';
                action.textContent = 'Повторить';
                state.appendChild(action);
            }
            view.appendChild(state);
            node.appendChild(view);
            var lastRetryAt = 0;
            function retry(event) {
                if (status !== 'error') return;
                var timestamp = Date.now ? Date.now() : new Date().getTime();
                if (timestamp - lastRetryAt < 350) return;
                lastRetryAt = timestamp;
                if (event && event.preventDefault) event.preventDefault();
                if (event && event.stopImmediatePropagation) event.stopImmediatePropagation();
                self.retry(rowId);
            }
            node.addEventListener('hover:enter', retry);
            node.addEventListener('click', retry);
            node.addEventListener('hover:focus', function () { self.onFocusNode(node); });
            return node;
        }

        function addContext(node, data) {
            if (!data || !data.lmui_context_label) return;
            var view = node.querySelector('.card__view');
            if (!view || view.querySelector('.lmui-card-context')) return;
            var context = document.createElement('div');
            context.className = 'lmui-card-context' + (data.lmui_context_new ? ' lmui-card-context--new' : '');
            context.textContent = data.lmui_context_label;
            view.appendChild(context);
        }

        function createCard(row, data) {
            var node;
            var instance;
            var lastEnterAt = 0;
            try {
                instance = new Lampa.Card(data, { card_wide: row.wide, object: object || {} });
                instance.onFocus = function (target) { self.onFocusNode(target); };
                instance.onHover = function () { updateHomeBackground(data); };
                instance.onTouch = function (target) { self.onFocusNode(target); };
                instance.onEnter = function () {
                    var timestamp = Date.now ? Date.now() : new Date().getTime();
                    if (timestamp - lastEnterAt < 300) return;
                    lastEnterAt = timestamp;
                    openHomeCard(data, object);
                };
                instance.create();
                node = instance.render(true);
            } catch (error) {
                console.warn('[Lampa Modern UI] card creation failed:', error);
                return null;
            }
            node.classList.add('lmui-owned-card');
            node.setAttribute('data-lmui-content', data.lmui_content_id || contentId(data));
            node.setAttribute('data-lmui-decorated', VERSION);
            node.addEventListener('click', function () {
                var timestamp = Date.now ? Date.now() : new Date().getTime();
                if (timestamp - lastEnterAt < 300) return;
                lastEnterAt = timestamp;
                openHomeCard(data, object);
            });
            addContext(node, data);
            return { node: node, instance: instance };
        }

        function buildRow(rowId, state) {
            var row = {
                id: rowId,
                state: state,
                wide: rowId === 'watching_series' || rowId === 'continue_movies',
                cards: [],
                nodes: []
            };
            var line = document.createElement('div');
            line.className = 'items-line lmui-owned-row lmui-home-row lmui-row-' + rowId;
            line.setAttribute('data-lmui-row', rowId);
            var head = document.createElement('div');
            head.className = 'items-line__head';
            var title = document.createElement('div');
            title.className = 'items-line__title';
            title.textContent = HOME_TITLES[rowId];
            head.appendChild(title);
            var lineBody = document.createElement('div');
            lineBody.className = 'items-line__body';
            var horizontal = new Lampa.Scroll({ horizontal: true, over: true, scroll_by_item: true });
            horizontal.body(true).classList.add('mapping--line');
            lineBody.appendChild(horizontal.render(true));
            line.appendChild(head);
            line.appendChild(lineBody);
            row.line = line;
            row.scroll = horizontal;

            if (state.status === 'ready' && state.results.length) {
                state.results.forEach(function (data) {
                    var createdCard = createCard(row, data);
                    if (!createdCard) return;
                    row.cards.push(createdCard.instance);
                    row.nodes.push(createdCard.node);
                    horizontal.append(createdCard.node);
                    try { if (typeof createdCard.instance.visible === 'function') createdCard.instance.visible(); } catch (error) {}
                });
            } else {
                var placeholder = stateNode(rowId, state.status);
                row.nodes.push(placeholder);
                horizontal.append(placeholder);
            }
            return row;
        }

        function saveViewState() {
            if (destroyed) return;
            mainViewState.verticalPosition = typeof verticalScroll.position === 'function' ? Number(verticalScroll.position()) || 0 : 0;
            rows.forEach(function (row) {
                mainViewState.rowPositions[row.id] = typeof row.scroll.position === 'function' ? Number(row.scroll.position()) || 0 : 0;
            });
            var row = rows[currentRowIndex];
            var node = row && row.nodes[currentCardIndex];
            var data = node && cardData(node);
            if (row && node && data) {
                mainViewState.rowId = row.id;
                mainViewState.contentId = data.lmui_content_id || contentId(data);
                mainViewState.fallbackIndex = currentCardIndex;
            }
        }

        function clearRows() {
            rows.forEach(function (row) {
                row.cards.forEach(function (card) { try { if (card && typeof card.destroy === 'function') card.destroy(); } catch (error) {} });
                try { if (row.scroll && typeof row.scroll.destroy === 'function') row.scroll.destroy(); } catch (error) {}
            });
            rows = [];
            verticalScroll.clear();
        }

        function selectedNode() {
            var row = rows[currentRowIndex];
            return row && row.nodes[currentCardIndex] || null;
        }

        function focusNode(node, silent) {
            if (!node) return false;
            var rowIndex = -1;
            var cardIndex = -1;
            rows.some(function (row, ri) {
                var ci = row.nodes.indexOf(node);
                if (ci < 0) return false;
                rowIndex = ri;
                cardIndex = ci;
                return true;
            });
            if (rowIndex < 0) return false;
            currentRowIndex = rowIndex;
            currentCardIndex = cardIndex;
            try {
                if (window.$ && Lampa.Controller && typeof Lampa.Controller.collectionFocus === 'function') {
                    Lampa.Controller.collectionFocus($(node), $(renderNode), true);
                } else if (window.$) $(node).trigger('hover:focus');
            } catch (error) {
                console.warn('[Lampa Modern UI] main focus failed:', error);
            }
            if (!silent) self.onFocusNode(node);
            return true;
        }

        function restoreViewState() {
            if (!rows.length) return false;
            restoring = true;
            rows.forEach(function (row) { restoreScrollObject(row.scroll, Number(mainViewState.rowPositions[row.id]) || 0); });
            restoreScrollObject(verticalScroll, Number(mainViewState.verticalPosition) || 0);
            var rowIndex = rows.map(function (row) { return row.id; }).indexOf(mainViewState.rowId);
            if (rowIndex < 0) rowIndex = 0;
            var row = rows[rowIndex];
            var cardIndex = row.nodes.map(function (node) {
                var data = cardData(node);
                return data && (data.lmui_content_id || contentId(data));
            }).indexOf(mainViewState.contentId);
            if (cardIndex < 0) cardIndex = Math.min(Number(mainViewState.fallbackIndex) || 0, Math.max(0, row.nodes.length - 1));
            var target = row.nodes[cardIndex] || rows[0].nodes[0];
            var focused = focusNode(target, true);
            restoring = false;
            if (focused) {
                var hscroll = row.scroll.render(true);
                if (!cardVisibleInScroll(target, hscroll)) {
                    try { row.scroll.immediate(target, true); } catch (error) {}
                }
            }
            return focused;
        }

        function build(force) {
            if (destroyed) return;
            var data = readHomeData();
            var signature = homeSignatureFromData(data);
            if (!force && created && signature === builtSignature) return;
            saveViewState();
            clearRows();
            var mode = String(storageGet(KEYS.homeMode, 'focused') || 'focused');
            if (mode !== 'focused' && mode !== 'minimal') mode = 'focused';
            visibleRowsForMode(mode).forEach(function (rowId) {
                var row = buildRow(rowId, data[rowId]);
                rows.push(row);
                verticalScroll.append(row.line);
            });
            if (!rows.length) {
                var empty = document.createElement('div');
                empty.className = 'lmui-main-empty';
                empty.textContent = 'Главная пока пуста.';
                verticalScroll.append(empty);
            }
            builtSignature = signature;
            created = true;
            if (activeModernMain === self) {
                try { Lampa.Controller.collectionSet($(renderNode)); } catch (error) {}
                restoreViewState();
            }
        }

        function moveHorizontal(step) {
            var row = rows[currentRowIndex];
            if (!row) return;
            var next = currentCardIndex + step;
            if (next < 0) {
                if (Lampa.Controller && typeof Lampa.Controller.toggle === 'function') Lampa.Controller.toggle('menu');
                return;
            }
            if (next >= row.nodes.length) return;
            focusNode(row.nodes[next]);
        }

        function moveVertical(step) {
            var nextRow = currentRowIndex + step;
            if (nextRow < 0) {
                if (Lampa.Controller && typeof Lampa.Controller.toggle === 'function') Lampa.Controller.toggle('head');
                return;
            }
            if (nextRow >= rows.length) return;
            var row = rows[nextRow];
            focusNode(row.nodes[Math.min(currentCardIndex, Math.max(0, row.nodes.length - 1))]);
        }

        function installController() {
            if (!Lampa.Controller || typeof Lampa.Controller.add !== 'function') return;
            Lampa.Controller.add('content', {
                toggle: function () {
                    try { Lampa.Controller.collectionSet($(renderNode)); } catch (error) {}
                    if (!restoreViewState()) focusNode(rows[0] && rows[0].nodes[0]);
                },
                left: function () { moveHorizontal(-1); },
                right: function () { moveHorizontal(1); },
                up: function () { moveVertical(-1); },
                down: function () { moveVertical(1); },
                enter: function () {
                    var node = selectedNode();
                    if (node && window.$) $(node).trigger('hover:enter');
                },
                back: function () {
                    saveViewState();
                    if (Lampa.Activity && typeof Lampa.Activity.backward === 'function') Lampa.Activity.backward();
                }
            });
            if (typeof Lampa.Controller.toggle === 'function') Lampa.Controller.toggle('content');
        }

        self.onFocusNode = function (node) {
            if (!node || restoring) return;
            var rowIndex = -1;
            var cardIndex = -1;
            rows.some(function (row, ri) {
                var ci = row.nodes.indexOf(node);
                if (ci < 0) return false;
                rowIndex = ri;
                cardIndex = ci;
                return true;
            });
            if (rowIndex < 0) return;
            currentRowIndex = rowIndex;
            currentCardIndex = cardIndex;
            var row = rows[rowIndex];
            try { row.scroll.update(node); } catch (error) {}
            try { verticalScroll.update(row.line); } catch (error) {}
            var data = cardData(node);
            if (data && !data.lmui_state) updateHomeBackground(data);
            saveViewState();
            focusState = {
                rowId: row.id,
                contentId: data && (data.lmui_content_id || contentId(data)) || '',
                fallbackIndex: cardIndex,
                scrollPosition: typeof row.scroll.position === 'function' ? Number(row.scroll.position()) || 0 : 0,
                verticalPosition: typeof verticalScroll.position === 'function' ? Number(verticalScroll.position()) || 0 : 0
            };
        };

        self.retry = function (rowId) {
            if (rowId === 'recommendations') resetRecommendationProbe();
            build(true);
            probeHomeData();
        };

        self.refresh = function (reason, force) {
            if (destroyed) return;
            build(!!force || reason === 'home-mode');
        };

        self.restoreFocus = restoreViewState;
        self.saveState = saveViewState;
        self.create = function () { build(true); return self.render(); };
        self.start = function () {
            activeModernMain = self;
            build(false);
            installController();
        };
        self.pause = saveViewState;
        self.stop = saveViewState;
        self.render = function () { return window.$ ? $(renderNode) : renderNode; };
        self.destroy = function () {
            saveViewState();
            destroyed = true;
            if (activeModernMain === self) activeModernMain = null;
            clearRows();
            try { verticalScroll.destroy(); } catch (error) {}
        };
    }

    function MainComponentProxy(object) {
        if (!customHomeEnabled() || !originalMainComponent) return new originalMainComponent(object);
        try {
            return new ModernMainComponent(object);
        } catch (error) {
            console.warn('[Lampa Modern UI] custom main fallback:', error);
            return new originalMainComponent(object);
        }
    }

    function registerMainComponent() {
        if (mainComponentRegistered || !window.Lampa || !Lampa.Component || typeof Lampa.Component.get !== 'function' || typeof Lampa.Component.add !== 'function') return false;
        originalMainComponent = Lampa.Component.get('main');
        if (!originalMainComponent) return false;
        Lampa.Component.add('main', MainComponentProxy);
        mainComponentRegistered = true;
        storageSet('content_rows_lmui_home', false);
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
                if (!active || active.component !== 'main') return;
                var timestamp = Date.now ? Date.now() : new Date().getTime();
                var elapsed = timestamp - lastMainRefreshAt;
                if (elapsed < 500) {
                    scheduleHomeRefresh(reason || 'throttled-update', 520 - elapsed);
                    return;
                }
                lastMainRefreshAt = timestamp;
                if (activeModernMain && customHomeEnabled()) {
                    activeModernMain.refresh(reason || 'update');
                    return;
                }
                if (Lampa.Activity && typeof Lampa.Activity.refresh === 'function') Lampa.Activity.refresh(false);
            } catch (error) {
                console.warn('[Lampa Modern UI] home refresh failed:', reason || 'update', error);
            }
        }, typeof delay === 'number' ? delay : 140);
    }

    function resetRecommendationProbe() {
        clearTimeout(dataProbeTimer);
        dataProbeAttempts = 0;
        dataProbeStartedAt = Date.now ? Date.now() : new Date().getTime();
        recommendationProbeDone = false;
    }

    function probeHomeData() {
        clearTimeout(dataProbeTimer);
        if (!dataProbeStartedAt) dataProbeStartedAt = Date.now ? Date.now() : new Date().getTime();
        var signature = homeSignature();
        var recommendationsLoading = signature.indexOf('recommendations:loading') >= 0;
        var timestamp = Date.now ? Date.now() : new Date().getTime();
        var timedOut = timestamp - dataProbeStartedAt >= 10000;

        if (recommendationsLoading && (dataProbeAttempts >= 11 || timedOut)) {
            recommendationProbeDone = true;
            signature = homeSignature();
            recommendationsLoading = false;
        }

        if (lastHomeSignature && signature !== lastHomeSignature) scheduleHomeRefresh('home-data-ready', 50);
        lastHomeSignature = signature;
        dataProbeAttempts += 1;

        if (recommendationsLoading) {
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
        if (viewport.width <= 720) return 'phone';
        if (viewport.width <= 1100) return 'tablet';
        return 'desktop';
    }

    function detectHeightMode() {
        var viewport = layoutViewport();
        return viewport.height > 0 && viewport.height <= 760 ? 'compact' : 'normal';
    }

    function pointerEnvironment() {
        var body = document.body;
        var hover = false;
        var fine = false;
        try {
            hover = !!(window.matchMedia && window.matchMedia('(hover: hover)').matches);
            fine = !!(window.matchMedia && window.matchMedia('(pointer: fine)').matches);
        } catch (error) {}
        return !!(body && (body.classList.contains('mouse--controll') || body.classList.contains('mouse--control'))) || (hover && fine);
    }

    function remoteEnvironment() {
        var body = document.body;
        if (!body) return false;
        if (body.classList.contains('platform--browser')) return false;
        if (body.classList.contains('platform--tv') || body.classList.contains('platform--tizen') || body.classList.contains('platform--webos')) return true;
        if (body.classList.contains('platform--android') && Number(window.navigator && window.navigator.maxTouchPoints || 0) === 0) return true;
        return false;
    }

    function detectInputMode() {
        var body = document.body;
        var touch = Number(window.navigator && window.navigator.maxTouchPoints || 0);
        var coarse = false;
        try { coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); }
        catch (error) {}

        if (body && (body.classList.contains('touch--controll') || body.classList.contains('touch--control'))) return 'touch';
        if (pointerEnvironment()) return 'pointer';
        if (touch > 0 || coarse) return 'touch';
        if (remoteEnvironment()) return 'remote';
        return 'keyboard';
    }

    function removeThemeClasses(body) {
        Array.prototype.slice.call(body.classList).forEach(function (name) {
            if (name === 'lampa-modern-ui' || name.indexOf('lmui-density-') === 0 || name.indexOf('lmui-motion-') === 0 || name.indexOf('lmui-performance-') === 0 || name.indexOf('lmui-device-') === 0 || name.indexOf('lmui-layout-') === 0 || name.indexOf('lmui-input-') === 0 || name.indexOf('lmui-height-') === 0) body.classList.remove(name);
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
        var heightMode = detectHeightMode();
        var input = lastInputMode || detectInputMode();
        lastInputMode = input;
        body.classList.add('lampa-modern-ui', 'lmui-density-' + density, 'lmui-motion-' + motion, 'lmui-performance-' + performance, 'lmui-layout-' + layout, 'lmui-height-' + heightMode, 'lmui-input-' + input, 'lmui-device-' + layout);
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

    function hiddenSettingsId(id) {
        var value = String(id || '').toLowerCase();
        if (HIDDEN_COMPONENT_IDS.indexOf(value) >= 0) return true;
        return /(^|_)(sync|synchronization|parental|remote_config|remote_configuration)(_|$)/.test(value);
    }

    function removeHiddenSettingsComponents() {
        if (!Lampa.SettingsApi || typeof Lampa.SettingsApi.removeComponent !== 'function') return;
        var ids = HIDDEN_COMPONENT_IDS.slice();
        try {
            if (typeof Lampa.SettingsApi.allComponents === 'function') {
                Object.keys(Lampa.SettingsApi.allComponents() || {}).forEach(function (id) {
                    if (hiddenSettingsId(id) && ids.indexOf(id) < 0) ids.push(id);
                });
            }
        } catch (error) {
            console.warn('[Lampa Modern UI] settings component discovery failed:', error);
        }
        ids.forEach(function (id) {
            try { Lampa.SettingsApi.removeComponent(id); }
            catch (error) { console.warn('[Lampa Modern UI] settings component removal failed:', id, error); }
        });
    }

    function scheduleSettingsCleanup(delay) {
        clearTimeout(settingsCleanupTimer);
        settingsCleanupTimer = setTimeout(removeHiddenSettingsComponents, typeof delay === 'number' ? delay : 0);
    }

    function cardData(card) {
        return card && card.card_data && typeof card.card_data === 'object' ? card.card_data : null;
    }

    function rowIdFromLine(line) {
        if (!line) return '';
        if (line.getAttribute) {
            var owned = line.getAttribute('data-lmui-row');
            if (owned) return owned;
        }
        var card = line.querySelector ? line.querySelector('.card') : null;
        var data = cardData(card);
        return data && data.lmui_row_id || '';
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
        return button;
    }

    function tryFocusPrimaryAction(activity) {
        if (!detailNeedsInitialFocus || detailUserInteracted || activeComponent() !== 'full') return;
        var button = activity && activity.querySelector('.full-start-new__buttons .lmui-primary-action');
        if (!button || !window.$ || !Lampa.Controller || typeof Lampa.Controller.collectionFocus !== 'function') return;
        try {
            Lampa.Controller.collectionFocus($(button), $(activity), true);
            detailNeedsInitialFocus = false;
        } catch (error) {
            console.warn('[Lampa Modern UI] primary focus failed:', error);
        }
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
        tryFocusPrimaryAction(activity);
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
            var query = String(input && (input.value !== undefined ? input.value : input.textContent) || '').replace(/ /g, ' ').trim();
            var resultsRoot = root.querySelector('.search__results') || screen.querySelector('.search__results');
            var results = resultsRoot ? resultsRoot.querySelectorAll('.card, .search-item, .explorer-card').length : 0;
            var loading = !!screen.querySelector('.search-source--loading, .search-looking, .content-loading, .loading-layer');
            var state = query ? (loading ? 'active' : results ? 'results' : 'empty') : 'landing';
            screen.setAttribute('data-lmui-search-state', state);
            var hint = screen.querySelector('.lmui-search-hint');
            if (!hint) {
                hint = document.createElement('div');
                hint.className = 'lmui-search-hint';
                root.insertAdjacentElement('afterend', hint);
            }
            if (state === 'empty') hint.innerHTML = '<strong>Ничего не найдено</strong>Проверьте название или переключите источник.';
            else hint.innerHTML = '<strong>Поиск фильмов и сериалов</strong>Введите название. История и источники доступны рядом с полем.';
        }, 80);
    }

    function decorateNode(root) {
        if (!root || root.nodeType !== 1) return;
        var component = activeComponent();
        if (component === 'full') decorateDetail(root.closest && root.closest('.activity--active') || document.querySelector('.activity--active'));
        if (component === 'search' || root.closest && root.closest('.search, .search-box') || root.querySelector && root.querySelector('.search, .search-box')) decorateSearch();
        if (component === 'settings') scheduleSettingsCleanup();
    }

    function queueDecorateRoot(root) {
        if (!root || root.nodeType !== 1) return;
        if (pendingDecorateRoots.indexOf(root) < 0) pendingDecorateRoots.push(root);
    }

    function scheduleDecorate(root) {
        if (root) queueDecorateRoot(root);
        if (decorateTimer) return;
        var run = function () {
            decorateTimer = 0;
            var roots = pendingDecorateRoots.splice(0, pendingDecorateRoots.length);
            if (!roots.length) {
                var activity = document.querySelector('.activity--active');
                if (activity) roots.push(activity);
            }
            roots.forEach(decorateNode);
        };
        if (window.requestAnimationFrame) decorateTimer = window.requestAnimationFrame(run);
        else decorateTimer = setTimeout(run, 0);
    }

    function observeActiveActivity() {
        var root = document.querySelector('.activity--active');
        if (!root || !window.MutationObserver) return;
        if (activeComponent() === 'main' && activeModernMain) {
            if (activeObserver) activeObserver.disconnect();
            activeObserver = null;
            observedRoot = root;
            return;
        }
        if (root === observedRoot) return;
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

    function horizontalScroll(card) {
        return card && card.closest ? card.closest('.scroll--horizontal') : null;
    }

    function readScrollPosition(scroll) {
        if (!scroll) return 0;
        try {
            if (scroll.Scroll && typeof scroll.Scroll.position === 'function') return Number(scroll.Scroll.position()) || 0;
        } catch (error) {}
        return Number(scroll.scrollLeft) || 0;
    }

    function writeScrollPosition(scroll, position) {
        if (!scroll || typeof position !== 'number' || !isFinite(position)) return;
        try {
            if (scroll.Scroll && typeof scroll.Scroll.position === 'function' && typeof scroll.Scroll.shift === 'function') {
                var current = Number(scroll.Scroll.position()) || 0;
                scroll.Scroll.shift(current - position);
                return;
            }
        } catch (error) {
            console.warn('[Lampa Modern UI] scroll restore failed:', error);
        }
        scroll.scrollLeft = Math.max(0, position);
    }

    function cardVisibleInScroll(card, scroll) {
        if (!card || !scroll || !card.getBoundingClientRect || !scroll.getBoundingClientRect) return true;
        var cardRect = card.getBoundingClientRect();
        var scrollRect = scroll.getBoundingClientRect();
        return cardRect.right > scrollRect.left + 8 && cardRect.left < scrollRect.right - 8;
    }

    function ensureCardVisible(card, scroll) {
        if (!card || !scroll || cardVisibleInScroll(card, scroll)) return;
        try {
            if (scroll.Scroll && typeof scroll.Scroll.immediate === 'function') {
                scroll.Scroll.immediate(card, true);
                return;
            }
        } catch (error) {}
        var cardRect = card.getBoundingClientRect();
        var scrollRect = scroll.getBoundingClientRect();
        scroll.scrollLeft += cardRect.left - scrollRect.left - (scrollRect.width - cardRect.width) / 2;
    }

    function focusedCardState(card) {
        var line = card && card.closest ? card.closest('.items-line') : null;
        var data = cardData(card);
        if (!line || !data) return null;
        var cards = Array.prototype.slice.call(line.querySelectorAll('.card'));
        var scroll = horizontalScroll(card);
        return {
            rowId: data.lmui_row_id || rowIdFromLine(line),
            contentId: data.lmui_content_id || contentId(data),
            fallbackIndex: Math.max(0, cards.indexOf(card)),
            scrollPosition: readScrollPosition(scroll),
            verticalPosition: mainViewState.verticalPosition || 0
        };
    }

    function rememberFocus(card) {
        if (activeComponent() !== 'main') return;
        var state = focusedCardState(card);
        if (state) focusState = state;
    }

    function restoreFocus() {
        if (activeModernMain && activeComponent() === 'main' && typeof activeModernMain.restoreFocus === 'function') {
            activeModernMain.restoreFocus();
            return;
        }
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
        var scroll = horizontalScroll(card);
        writeScrollPosition(scroll, focusState.scrollPosition || 0);
        try {
            if (window.$ && Lampa.Controller && typeof Lampa.Controller.collectionFocus === 'function') Lampa.Controller.collectionFocus($(card), $(line), true);
            else if (window.$) $(card).trigger('hover:focus');
        } catch (error) {
            console.warn('[Lampa Modern UI] focus restore failed:', error);
        }
        var finalize = function () {
            if (cardVisibleInScroll(card, scroll)) writeScrollPosition(scroll, focusState.scrollPosition || 0);
            ensureCardVisible(card, scroll);
        };
        if (window.requestAnimationFrame) window.requestAnimationFrame(finalize);
        else setTimeout(finalize, 0);
    }

    function setInputModeClass(mode) {
        var body = document.body;
        if (!body || ['pointer', 'touch', 'keyboard', 'remote'].indexOf(mode) < 0) return;
        if (lastInputMode === mode && body.classList.contains('lmui-input-' + mode)) return;
        lastInputMode = mode;
        if (!body.classList.contains('lampa-modern-ui')) return;
        ['lmui-input-pointer', 'lmui-input-touch', 'lmui-input-keyboard', 'lmui-input-remote'].forEach(function (name) { body.classList.remove(name); });
        body.classList.add('lmui-input-' + mode);
    }

    function markDetailInteraction() {
        if (activeComponent() !== 'full') return;
        detailUserInteracted = true;
        detailNeedsInitialFocus = false;
    }

    function keyInputMode() {
        if (remoteEnvironment() && lastInputMode !== 'pointer' && lastInputMode !== 'touch' && lastInputMode !== 'keyboard') return 'remote';
        if (pointerEnvironment() || document.body && document.body.classList.contains('platform--browser')) return 'keyboard';
        return lastInputMode === 'remote' ? 'remote' : 'keyboard';
    }

    function installInputModeListeners() {
        if (inputListenersInstalled) return;
        inputListenersInstalled = true;
        window.addEventListener('pointerdown', function (event) {
            setInputModeClass(event && event.pointerType === 'touch' ? 'touch' : 'pointer');
            markDetailInteraction();
        }, { passive: true });
        window.addEventListener('mousemove', function () { setInputModeClass('pointer'); }, { passive: true });
        window.addEventListener('touchstart', function () {
            setInputModeClass('touch');
            markDetailInteraction();
        }, { passive: true });
        window.addEventListener('keydown', function () {
            setInputModeClass(keyInputMode());
            markDetailInteraction();
        }, { passive: true });
    }

    function installInteractionHandlers() {
        if (!window.$) return;
        try {
            $(document).off('.lmui');
            $(document).on('hover:focus.lmui', '.activity--active .card', function () { rememberFocus(this); });
            $(document).on('hover:enter.lmui', '.activity--active .lmui-state-card', function (event) {
                var data = cardData(this);
                if (!data || !data.lmui_state) return;
                if (event && event.stopImmediatePropagation) event.stopImmediatePropagation();
                if (event && event.preventDefault) event.preventDefault();
                if (data.lmui_state !== 'error') return;
                if (activeModernMain && typeof activeModernMain.retry === 'function') activeModernMain.retry(data.lmui_state_row || data.lmui_row_id);
                else {
                    resetRecommendationProbe();
                    probeHomeData();
                    scheduleHomeRefresh('state-retry', 50);
                }
            });
            $(document).on('input.lmui change.lmui keyup.lmui', '.search__input, .simple-keyboard-input, .search-box input', decorateSearch);
        } catch (error) {
            console.warn('[Lampa Modern UI] interaction handlers failed:', error);
        }
    }

    function addSettings() {
        var icon = '<svg viewBox="0 0 32 32" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="5" width="24" height="22" rx="7" stroke="currentColor" stroke-width="2"/><path d="M9 19.5 13.2 15l3.3 3.1L23 11.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="23" cy="11.5" r="2" fill="currentColor"/></svg>';
        Lampa.SettingsApi.addComponent({ component: PLUGIN_ID, name: 'Интерфейс', icon: icon });
        Lampa.SettingsApi.addParam({ component: PLUGIN_ID, param: { name: KEYS.enabled, type: 'trigger', default: true }, field: { name: 'Новый интерфейс', description: 'Единое оформление главной, карточек, поиска, фильма и настроек.' }, onChange: function () { applyTheme(); scheduleDecorate(); scheduleHomeRefresh('ui-enabled', 20); } });
        Lampa.SettingsApi.addParam({ component: PLUGIN_ID, param: { name: KEYS.density, type: 'select', values: { comfortable: 'Комфортно', compact: 'Компактно' }, default: 'comfortable' }, field: { name: 'Размер карточек', description: 'Компактный режим показывает больше контента в строке.' }, onChange: applyTheme });
        Lampa.SettingsApi.addParam({ component: PLUGIN_ID, param: { name: KEYS.motion, type: 'select', values: { calm: 'Плавно', minimal: 'Без анимаций' }, default: 'calm' }, field: { name: 'Движение', description: 'Отключает декоративные переходы, сохраняя состояния фокуса.' }, onChange: applyTheme });
        Lampa.SettingsApi.addParam({ component: PLUGIN_ID, param: { name: KEYS.performance, type: 'select', values: { standard: 'Обычный', lite: 'Экономный' }, default: 'standard' }, field: { name: 'Производительность', description: 'Экономный режим отключает динамический фон и тяжёлые тени.' }, onChange: applyTheme });
        Lampa.SettingsApi.addParam({ component: PLUGIN_ID, param: { name: KEYS.homeEnabled, type: 'trigger', default: true }, field: { name: 'Новая главная', description: 'Заменяет штатную главную на стабильные блоки просмотра, списка и рекомендаций.' }, onChange: function () { storageSet('content_rows_lmui_home', false); scheduleHomeRefresh('home-enabled', 20); } });
        Lampa.SettingsApi.addParam({ component: PLUGIN_ID, param: { name: KEYS.homeMode, type: 'select', values: { focused: 'Полная', minimal: 'Минимальная' }, default: 'focused' }, field: { name: 'Состав главной', description: 'Минимальная оставляет просмотр в процессе и рекомендации.' }, onChange: function () { scheduleHomeRefresh('home-mode'); } });
    }

    function destructiveCleanup() {
        if (boolValue(storageGet(CLEANUP_KEY, false), false)) return;
        storageSet('lpersonal_profile_v1', '');
        storageSet('content_rows_lpersonal_home', false);
        storageSet('content_rows_lmui_home', false);
        storageSet('lpersonal_enabled', false);
        storageSet('lpersonal_card_panel', false);
        storageSet(CLEANUP_KEY, true);
    }

    function readyToStart() {
        return !!(document.head && document.body && window.Lampa && Lampa.Storage && Lampa.SettingsApi && Lampa.Component && Lampa.Scroll && Lampa.Card && Lampa.Controller);
    }

    function followEvents() {
        if (!Lampa.Listener || typeof Lampa.Listener.follow !== 'function') return;
        Lampa.Listener.follow('activity', function (event) {
            if (!event) return;
            if (event.type === 'start' || event.type === 'create') {
                setTimeout(function () {
                    observeActiveActivity();
                    scheduleDecorate();
                    if (event.component === 'main') {
                        restoreFocus();
                        probeHomeData();
                    }
                    if (event.component === 'settings') scheduleSettingsCleanup();
                }, 60);
            }
            if (event.type === 'archive') scheduleDecorate();
        });
        Lampa.Listener.follow('resize_end', function () { applyTheme(); scheduleDecorate(); });
        Lampa.Listener.follow('full', function (event) {
            if (!event) return;
            if (event.type === 'start') {
                detailNeedsInitialFocus = true;
                detailUserInteracted = false;
            }
            if (event.type === 'start' || event.type === 'complite') scheduleDecorate(event.body && event.body[0]);
        });
        Lampa.Listener.follow('favorite', function () { scheduleHomeRefresh('favorite'); });
        Lampa.Listener.follow('state:changed', function (event) {
            if (!event || ['favorite', 'timetable', 'timeline'].indexOf(event.target) < 0) return;
            scheduleHomeRefresh('state-' + event.target, 80);
        });
        Lampa.Listener.follow('timeline', function () { scheduleHomeRefresh('timeline', 120); });
        Lampa.Listener.follow('app', function (event) {
            if (event && event.type === 'ready') scheduleSettingsCleanup(50);
        });
        if (Lampa.Settings && Lampa.Settings.listener && typeof Lampa.Settings.listener.follow === 'function') {
            Lampa.Settings.listener.follow('open', function () { scheduleSettingsCleanup(); });
        }
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
        registerMainComponent();
        applyTheme();
        installInteractionHandlers();
        installInputModeListeners();
        followEvents();
        observeActiveActivity();
        scheduleDecorate();
        resetRecommendationProbe();
        lastHomeSignature = homeSignature();
        probeHomeData();
        scheduleHomeRefresh('component-register', 120);
        if (window.__LMUI_TEST_MODE__) {
            window.__LMUI_TEST_API__ = {
                readHomeData: readHomeData,
                homeSignature: homeSignature,
                visibleRowsForMode: visibleRowsForMode,
                customHomeEnabled: customHomeEnabled,
                componentRegistered: function () { return mainComponentRegistered; }
            };
        }
        window.addEventListener('orientationchange', function () { applyTheme(); scheduleDecorate(); }, { passive: true });
        console.info('[Lampa Modern UI] v' + VERSION + ' loaded');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();

    if (window.Lampa && Lampa.Listener && typeof Lampa.Listener.follow === 'function') {
        Lampa.Listener.follow('app', function (event) { if (event && event.type === 'ready') start(); });
    }
})();
