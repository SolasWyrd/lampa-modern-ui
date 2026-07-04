/* Lampa Modern UI — early Shots guard. */
(function () {
    'use strict';

    var KEY = 'lmui_disable_shots';
    var FLAG = '__lmui_shots_guard_v2__';
    var attempts = 0;
    var timer = 0;

    function boolValue(value, fallback) {
        if (value === undefined || value === null || value === '') return fallback;
        if (value === false || value === 0 || value === '0' || value === 'false') return false;
        if (value === true || value === 1 || value === '1' || value === 'true') return true;
        return fallback;
    }

    function disabled() {
        try {
            if (window.Lampa && Lampa.Storage && typeof Lampa.Storage.get === 'function') return boolValue(Lampa.Storage.get(KEY, true), true);
        } catch (error) {}
        try {
            var raw = window.localStorage && window.localStorage.getItem(KEY);
            if (raw === null || raw === undefined) return true;
            try { raw = JSON.parse(raw); } catch (error) {}
            return boolValue(raw, true);
        } catch (error) {
            return true;
        }
    }

    function isShotsUrl(url) {
        return /\/plugin\/shots(?:[?#]|$)/i.test(String(url || ''));
    }

    function wrap(name) {
        var original = Lampa.Utils[name];
        if (typeof original !== 'function' || original.__lmuiShotsWrapped) return;

        var wrapped = function (items, complete, error, success, showLogs) {
            var list = Array.isArray(items) ? items.slice() : [];
            if (disabled()) list = list.filter(function (url) { return !isShotsUrl(url); });
            if (!list.length) {
                if (typeof complete === 'function') setTimeout(complete, 0);
                return;
            }
            return original.call(this, list, complete, error, success, showLogs);
        };

        wrapped.__lmuiShotsWrapped = true;
        wrapped.__lmuiShotsOriginal = original;
        Lampa.Utils[name] = wrapped;
    }

    function install() {
        if (window[FLAG] && window[FLAG].installed) return;
        if (!window.Lampa || !Lampa.Utils) {
            attempts += 1;
            if (attempts < 200) {
                clearTimeout(timer);
                timer = setTimeout(install, 25);
            }
            return;
        }

        wrap('putScript');
        wrap('putScriptAsync');
        if (disabled()) window.plugin_shots_ready = true;
        window[FLAG] = { installed: true, disabled: disabled, isShotsUrl: isShotsUrl };
    }

    install();
})();

/* Lampa Modern UI 0.7.0
 * Единая визуальная система без изменения core-настроек Lampa.
 */
(function () {
    'use strict';

    var PLUGIN_ID = 'lampa_modern_ui';
    var STYLE_ID = 'lampa-modern-ui-style';
    var READY_FLAG = '__lampa_modern_ui_v070_ready__';
    var VERSION = '0.7.0';
    var START_ATTEMPTS = 120;
    var startAttempts = 0;
    var startTimer = 0;

    var KEYS = {
        enabled: 'lmui_enabled',
        density: 'lmui_density',
        motion: 'lmui_motion',
        performance: 'lmui_performance',
        disableShots: 'lmui_disable_shots'
    };

    var CSS = String.raw`
body.lampa-modern-ui {
    --lmui-bg: #080b12;
    --lmui-bg-deep: #05070c;
    --lmui-surface: #111722;
    --lmui-surface-raised: #182131;
    --lmui-surface-hover: #202b3d;
    --lmui-text: #f5f7fb;
    --lmui-muted: #a9b3c2;
    --lmui-faint: #778295;
    --lmui-accent: #6da8ff;
    --lmui-accent-strong: #8bb9ff;
    --lmui-accent-soft: rgba(109, 168, 255, 0.16);
    --lmui-border: rgba(255, 255, 255, 0.10);
    --lmui-border-strong: rgba(255, 255, 255, 0.22);
    --lmui-radius-sm: 0.68em;
    --lmui-radius-md: 1em;
    --lmui-radius-lg: 1.4em;
    --lmui-space: clamp(1em, 2vw, 2.4em);
    --lmui-fast: 115ms;
    --lmui-normal: 175ms;
    --lmui-slow: 240ms;
    --lmui-ease: cubic-bezier(0.22, 0.72, 0.2, 1);
    --lmui-focus-ring: 0 0 0 0.11em var(--lmui-accent), 0 0 0 0.24em rgba(109, 168, 255, 0.26);
    --lmui-shadow-card: 0 1.15em 2.8em rgba(0, 0, 0, 0.42);
    --lmui-shadow-panel: 0 1.5em 4.5em rgba(0, 0, 0, 0.52);
    --lmui-title-display: clamp(2.25em, 4.2vw, 4.8em);
    --lmui-title-section: clamp(1.15em, 1.4vw, 1.5em);
    --lmui-text-body: clamp(0.98em, 1.05vw, 1.15em);

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
        radial-gradient(72% 55% at 18% -12%, rgba(65, 111, 180, 0.26), transparent 70%),
        radial-gradient(48% 42% at 98% 8%, rgba(42, 70, 115, 0.14), transparent 74%),
        linear-gradient(145deg, #0d121d 0%, var(--lmui-bg) 52%, var(--lmui-bg-deep) 100%);
}

body.lampa-modern-ui .background {
    opacity: 0.55;
}

body.lampa-modern-ui.lmui-performance-lite .background {
    display: none !important;
}

body.lampa-modern-ui.lmui-motion-minimal {
    --lmui-fast: 1ms;
    --lmui-normal: 1ms;
    --lmui-slow: 1ms;
}

/* Header */
body.lampa-modern-ui .head {
    background: linear-gradient(180deg, rgba(8, 11, 18, 0.96) 0%, rgba(8, 11, 18, 0.72) 72%, transparent 100%);
}

body.lampa-modern-ui .head__body {
    padding-top: 0.7em;
    padding-bottom: 0.75em;
}

body.lampa-modern-ui .head__title {
    color: var(--lmui-text);
    font-size: var(--lmui-title-section);
    font-weight: 680;
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
    transform: translateY(-0.04em);
}

/* Navigation */
body.lampa-modern-ui .wrap__left {
    background: linear-gradient(90deg, rgba(7, 10, 16, 0.985), rgba(8, 12, 20, 0.94) 82%, transparent);
}

body.lampa-modern-ui .menu__list {
    padding: 0.55em 0.7em 1em;
}

body.lampa-modern-ui .menu__split {
    width: auto;
    margin: 0.7em 1em;
    border-color: var(--lmui-border);
}

body.lampa-modern-ui .menu__item {
    position: relative;
    min-height: 3.1em;
    padding: 0.72em 0.92em;
    border: 0.075em solid transparent;
    border-radius: 0.88em;
    color: var(--lmui-muted);
    transition: transform var(--lmui-fast) var(--lmui-ease), background-color var(--lmui-fast) var(--lmui-ease), border-color var(--lmui-fast) var(--lmui-ease), color var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .menu__item + li {
    margin-top: 0.14em;
}

body.lampa-modern-ui .menu__ico {
    width: 1.46em;
    height: 1.46em;
    margin-right: 0.9em;
    opacity: 0.78;
    transition: opacity var(--lmui-fast) ease, transform var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .menu__text {
    font-weight: 590;
    letter-spacing: -0.012em;
}

body.lampa-modern-ui .menu__item.focus,
body.lampa-modern-ui .menu__item.hover,
body.lampa-modern-ui .menu__item.traverse {
    color: #fff;
    border-color: rgba(109, 168, 255, 0.32);
    background: linear-gradient(90deg, rgba(109, 168, 255, 0.18), rgba(109, 168, 255, 0.07));
}

body.lampa-modern-ui .menu__item.focus::before,
body.lampa-modern-ui .menu__item.hover::before {
    content: "";
    position: absolute;
    left: 0.25em;
    top: 24%;
    bottom: 24%;
    width: 0.18em;
    border-radius: 99em;
    background: var(--lmui-accent);
}

body.lampa-modern-ui .menu__item.focus .menu__ico,
body.lampa-modern-ui .menu__item.hover .menu__ico {
    opacity: 1;
    transform: scale(1.06);
}

/* Content rows */
body.lampa-modern-ui .items-line {
    margin-bottom: 0.8em;
}

body.lampa-modern-ui .items-line__head {
    min-height: 2.9em;
    margin-bottom: 0.28em;
}

body.lampa-modern-ui .items-line__head::before {
    display: none;
}

body.lampa-modern-ui .items-line__title {
    color: var(--lmui-text);
    font-size: var(--lmui-title-section);
    font-weight: 700;
    letter-spacing: -0.025em;
    line-height: 1.18;
}

body.lampa-modern-ui .items-line__more {
    padding: 0.48em 0.75em;
    border: 0.075em solid transparent;
    border-radius: 0.68em;
    color: var(--lmui-muted);
    opacity: 0.76;
    transition: color var(--lmui-fast) var(--lmui-ease), background-color var(--lmui-fast) var(--lmui-ease), border-color var(--lmui-fast) var(--lmui-ease), opacity var(--lmui-fast) ease;
}

body.lampa-modern-ui .items-line__more.focus,
body.lampa-modern-ui .items-line__more.hover {
    color: #fff;
    opacity: 1;
    border-color: rgba(109, 168, 255, 0.36);
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
    margin-bottom: 0.66em;
    border: 0.075em solid rgba(255, 255, 255, 0.075);
    border-radius: var(--lmui-radius-md);
    background: var(--lmui-surface);
    box-shadow: 0 0.35em 1.1em rgba(0, 0, 0, 0.20);
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
    font-weight: 620;
    line-height: 1.28;
    letter-spacing: -0.016em;
}

body.lampa-modern-ui .card__age {
    color: var(--lmui-faint);
}

body.lampa-modern-ui .card__textbox {
    background: linear-gradient(to bottom, transparent 34%, rgba(4, 7, 12, 0.46) 62%, rgba(4, 7, 12, 0.96) 100%);
}

body.lampa-modern-ui .card__vote,
body.lampa-modern-ui .card__quality,
body.lampa-modern-ui .card__type,
body.lampa-modern-ui .card__marker,
body.lampa-modern-ui .card__icons-inner {
    border: 0;
    border-radius: 0.5em;
    background: rgba(6, 9, 15, 0.88);
    color: rgba(255, 255, 255, 0.94);
    box-shadow: 0 0.3em 0.8em rgba(0, 0, 0, 0.28);
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
}

body.lampa-modern-ui .card__quality {
    left: 0.5em;
    bottom: 0.5em;
    padding: 0.28em 0.48em;
    font-weight: 700;
    letter-spacing: 0.025em;
}

body.lampa-modern-ui .time-line {
    height: 0.28em;
    overflow: hidden;
    border-radius: 99em;
    background: rgba(255, 255, 255, 0.18);
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
    transform: translateY(-0.12em) scale(1.035);
}

body.lampa-modern-ui .card.focus .card__view,
body.lampa-modern-ui .card.hover .card__view {
    border-color: var(--lmui-accent-strong);
    background: var(--lmui-surface-raised);
    box-shadow: var(--lmui-focus-ring), var(--lmui-shadow-card);
}

body.lampa-modern-ui .card.focus .card__img,
body.lampa-modern-ui .card.hover .card__img {
    transform: scale(1.025);
}

body.lampa-modern-ui .card.focus .card__view::after,
body.lampa-modern-ui .card.hover .card__view::after {
    display: none !important;
}

body.lampa-modern-ui.lmui-density-compact .card:not(.card--wide):not(.card--collection):not(.card--category) {
    width: 11.15em;
}

body.lampa-modern-ui.lmui-density-compact .items-line {
    margin-bottom: 0.35em;
}

/* Controls */
body.lampa-modern-ui .simple-button,
body.lampa-modern-ui .full-start__button {
    min-height: 2.8em;
    padding-inline: 1em;
    border: 0.075em solid var(--lmui-border);
    border-radius: 0.82em;
    background: rgba(255, 255, 255, 0.06);
    color: var(--lmui-text);
    font-weight: 640;
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

body.lampa-modern-ui .full-start-new__buttons .full-start__button:first-child {
    border-color: transparent;
    background: var(--lmui-accent);
    color: #07101c;
    font-weight: 760;
}

body.lampa-modern-ui .full-start-new__buttons .full-start__button:first-child.focus,
body.lampa-modern-ui .full-start-new__buttons .full-start__button:first-child.hover {
    border-color: #fff;
    background: var(--lmui-accent-strong);
    color: #050b13;
    box-shadow: 0 0 0 0.11em #fff, 0 0 0 0.24em rgba(109, 168, 255, 0.32), 0 0.9em 2.2em rgba(0, 0, 0, 0.34);
}

/* Detail screen */
body.lampa-modern-ui .full-start__background {
    opacity: 0.66;
    filter: saturate(0.9) contrast(1.05);
}

body.lampa-modern-ui .full-start-new {
    min-height: calc(100vh - 6.5em);
    padding-bottom: 4em;
}

body.lampa-modern-ui .full-start-new__left {
    margin-right: clamp(1.5em, 3vw, 3.4em);
}

body.lampa-modern-ui .full-start-new__poster,
body.lampa-modern-ui .full-start-new__img {
    border-radius: var(--lmui-radius-lg);
}

body.lampa-modern-ui .full-start-new__poster {
    overflow: hidden;
    border: 0.075em solid rgba(255, 255, 255, 0.13);
    background: var(--lmui-surface);
    box-shadow: 0 1.6em 4em rgba(0, 0, 0, 0.46);
}

body.lampa-modern-ui .full-start-new__right {
    max-width: 70em;
}

body.lampa-modern-ui .full-start-new__title {
    max-width: 16ch;
    color: #fff;
    font-size: var(--lmui-title-display);
    font-weight: 760;
    letter-spacing: -0.045em;
    line-height: 1.02;
    text-wrap: balance;
    text-shadow: 0 0.12em 0.65em rgba(0, 0, 0, 0.52);
}

body.lampa-modern-ui .full-start-new__head,
body.lampa-modern-ui .full-start-new__tagline,
body.lampa-modern-ui .full-start-new__description {
    color: var(--lmui-muted);
}

body.lampa-modern-ui .full-start-new__description {
    width: min(100%, 58em);
    max-width: 64ch;
    font-size: var(--lmui-text-body);
    line-height: 1.58;
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
    color: rgba(235, 240, 248, 0.80);
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

/* Tags, episodes, people */
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
    transition: transform var(--lmui-fast) var(--lmui-ease), background-color var(--lmui-fast) var(--lmui-ease), border-color var(--lmui-fast) var(--lmui-ease), box-shadow var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .season-episode.focus,
body.lampa-modern-ui .full-episode.focus,
body.lampa-modern-ui .card-episode.focus .full-episode,
body.lampa-modern-ui .torrent-item.focus,
body.lampa-modern-ui .explorer-card__head-img.focus {
    border-color: var(--lmui-accent);
    background: var(--lmui-accent-soft);
    box-shadow: var(--lmui-focus-ring);
    transform: translateY(-0.04em);
}

body.lampa-modern-ui .season-episode.focus::after,
body.lampa-modern-ui .full-episode.focus::after,
body.lampa-modern-ui .card-episode.focus .full-episode::after {
    display: none !important;
}

body.lampa-modern-ui .full-person__name,
body.lampa-modern-ui .season-episode__title,
body.lampa-modern-ui .full-episode__name,
body.lampa-modern-ui .explorer-card__title,
body.lampa-modern-ui .torrent-item__title {
    color: var(--lmui-text);
    font-weight: 650;
}

body.lampa-modern-ui .full-person__role,
body.lampa-modern-ui .season-episode__time,
body.lampa-modern-ui .season-episode__info,
body.lampa-modern-ui .full-episode__date,
body.lampa-modern-ui .full-episode__num,
body.lampa-modern-ui .explorer-card__descr,
body.lampa-modern-ui .explorer-card__genres,
body.lampa-modern-ui .torrent-item__details {
    color: var(--lmui-muted);
}

body.lampa-modern-ui .full-person.focus .full-person__photo,
body.lampa-modern-ui .full-person.hover .full-person__photo {
    box-shadow: var(--lmui-focus-ring), var(--lmui-shadow-card);
}

/* Search */
body.lampa-modern-ui .search-box {
    max-width: 92em;
    margin-inline: auto;
    padding: clamp(0.8em, 1.5vw, 1.35em);
    border: 0;
    border-radius: var(--lmui-radius-lg);
    background: transparent;
    box-shadow: none;
}

body.lampa-modern-ui .search-box .search__input,
body.lampa-modern-ui .simple-keyboard-input {
    min-height: 3.25em;
    padding: 0.7em 1em;
    border: 0.075em solid var(--lmui-border-strong);
    border-radius: 0.95em;
    background: var(--lmui-surface);
    color: var(--lmui-text);
    font-size: var(--lmui-text-body);
    box-shadow: 0 0.5em 1.5em rgba(0, 0, 0, 0.22);
}

body.lampa-modern-ui .search-box--focus .search__input,
body.lampa-modern-ui .search-box--focus .simple-keyboard-input {
    border-color: var(--lmui-accent);
    box-shadow: var(--lmui-focus-ring), 0 0.7em 1.8em rgba(0, 0, 0, 0.28);
}

body.lampa-modern-ui .search-source,
body.lampa-modern-ui .search-history-key {
    padding: 0.5em 0.75em;
    border: 0.075em solid transparent;
    border-radius: 0.66em;
    background: transparent;
    color: var(--lmui-muted);
    transition: color var(--lmui-fast) var(--lmui-ease), background-color var(--lmui-fast) var(--lmui-ease), border-color var(--lmui-fast) var(--lmui-ease), box-shadow var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .search-source.active {
    color: #fff;
    border-color: rgba(109, 168, 255, 0.32);
    background: var(--lmui-accent-soft);
}

body.lampa-modern-ui .search-source.focus,
body.lampa-modern-ui .search-history-key.focus {
    color: #fff;
    border-color: var(--lmui-accent);
    background: var(--lmui-accent-soft);
    box-shadow: var(--lmui-focus-ring);
}

/* Panels and settings */
body.lampa-modern-ui .settings__content,
body.lampa-modern-ui .selectbox__content,
body.lampa-modern-ui .modal__content,
body.lampa-modern-ui .settings-input__content,
body.lampa-modern-ui .navigation-bar__body,
body.lampa-modern-ui .simple-keyboard {
    color: var(--lmui-text);
    border: 0.075em solid var(--lmui-border);
    background: rgba(17, 23, 34, 0.985) !important;
    box-shadow: var(--lmui-shadow-panel);
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
}

body.lampa-modern-ui .settings__content,
body.lampa-modern-ui .selectbox__content,
body.lampa-modern-ui .modal__content,
body.lampa-modern-ui .simple-keyboard {
    border-radius: var(--lmui-radius-lg);
}

body.lampa-modern-ui .settings__title,
body.lampa-modern-ui .selectbox__title,
body.lampa-modern-ui .modal__title {
    color: var(--lmui-text);
    font-weight: 730;
    letter-spacing: -0.028em;
}

body.lampa-modern-ui .settings-folder,
body.lampa-modern-ui .settings-param,
body.lampa-modern-ui .selectbox-item {
    border: 0.075em solid transparent;
    border-radius: 0.76em;
    transition: color var(--lmui-fast) var(--lmui-ease), background-color var(--lmui-fast) var(--lmui-ease), border-color var(--lmui-fast) var(--lmui-ease), box-shadow var(--lmui-fast) var(--lmui-ease);
}

body.lampa-modern-ui .settings-folder.focus,
body.lampa-modern-ui .settings-param.focus,
body.lampa-modern-ui .selectbox-item.focus {
    color: #fff;
    border-color: rgba(109, 168, 255, 0.36);
    background: var(--lmui-accent-soft) !important;
    box-shadow: var(--lmui-focus-ring);
}

body.lampa-modern-ui .settings-param__descr,
body.lampa-modern-ui .settings-param-title > span,
body.lampa-modern-ui .search-looking__text,
body.lampa-modern-ui .search-history-empty {
    color: var(--lmui-muted);
    opacity: 1;
}

body.lampa-modern-ui .settings-param__value {
    color: var(--lmui-accent-strong);
    font-weight: 680;
}

body.lampa-modern-ui .selectbox-item.selected:not(.nomark),
body.lampa-modern-ui .selectbox-item.picked {
    color: #fff;
    background: rgba(109, 168, 255, 0.10);
}

/* Empty, error, loading, notices */
body.lampa-modern-ui .empty,
body.lampa-modern-ui .error,
body.lampa-modern-ui .loading-layer__box,
body.lampa-modern-ui .empty-filter,
body.lampa-modern-ui .activity-wait-refresh,
body.lampa-modern-ui .notice,
body.lampa-modern-ui .bell__item {
    color: var(--lmui-text);
    border: 0.075em solid var(--lmui-border);
    border-radius: var(--lmui-radius-lg);
    background: var(--lmui-surface) !important;
    box-shadow: 0 0.9em 2.6em rgba(0, 0, 0, 0.30);
}

body.lampa-modern-ui .empty,
body.lampa-modern-ui .empty-filter {
    width: min(42em, calc(100% - 2 * var(--lmui-space)));
    min-height: 15em;
    margin: 2em auto;
    padding: clamp(1.4em, 3vw, 2.8em);
}

body.lampa-modern-ui .empty__title,
body.lampa-modern-ui .error__title,
body.lampa-modern-ui .empty-filter__title {
    color: var(--lmui-text);
    font-weight: 720;
    letter-spacing: -0.028em;
}

body.lampa-modern-ui .empty__descr,
body.lampa-modern-ui .error__text,
body.lampa-modern-ui .empty-filter__subtitle,
body.lampa-modern-ui .loading-layer__text,
body.lampa-modern-ui .notice__descr,
body.lampa-modern-ui .notice__time {
    color: var(--lmui-muted);
    line-height: 1.5;
}

body.lampa-modern-ui .notice.focus {
    border-color: var(--lmui-accent);
    background: var(--lmui-surface-raised) !important;
    box-shadow: var(--lmui-focus-ring), var(--lmui-shadow-card);
}

/* Keyboard and mobile navigation */
body.lampa-modern-ui .simple-keyboard .hg-button,
body.lampa-modern-ui .simple-keyboard-buttons__enter,
body.lampa-modern-ui .simple-keyboard-buttons__cancel {
    color: var(--lmui-text);
    border: 0.075em solid var(--lmui-border);
    border-radius: 0.65em;
    background: rgba(255, 255, 255, 0.055);
    box-shadow: none;
}

body.lampa-modern-ui .simple-keyboard .hg-button.hg-activeButton,
body.lampa-modern-ui .simple-keyboard .hg-button.focus,
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
    min-height: 3em;
    min-width: 4em;
    padding: 0.45em 0.58em;
    border-radius: 0.75em;
    color: var(--lmui-muted);
}

body.lampa-modern-ui .navigation-bar__item.focus,
body.lampa-modern-ui .navigation-bar__item.active {
    color: #fff;
    background: var(--lmui-accent-soft);
}

/* TV input */
body.lampa-modern-ui.lmui-device-tv .card.focus {
    transform: translateY(-0.15em) scale(1.05);
}

body.lampa-modern-ui.lmui-device-tv .card.focus .card__view {
    box-shadow: 0 0 0 0.14em var(--lmui-accent), 0 0 0 0.3em rgba(109, 168, 255, 0.25), 0 1.3em 3.1em rgba(0, 0, 0, 0.48);
}

body.lampa-modern-ui.lmui-device-tv .menu__item,
body.lampa-modern-ui.lmui-device-tv .settings-folder,
body.lampa-modern-ui.lmui-device-tv .settings-param,
body.lampa-modern-ui.lmui-device-tv .selectbox-item {
    min-height: 3.2em;
}

/* Narrow layout */
@media screen and (max-width: 720px) {
    body.lampa-modern-ui {
        --lmui-radius-md: 0.86em;
        --lmui-radius-lg: 1.15em;
        --lmui-space: max(0.75em, env(safe-area-inset-left));
        --lmui-title-display: clamp(2em, 9.5vw, 3.1em);
        --lmui-title-section: clamp(1.12em, 4.8vw, 1.4em);
        --lmui-text-body: clamp(0.96em, 3.9vw, 1.08em);
    }

    body.lampa-modern-ui::before {
        background: linear-gradient(160deg, #0d1320 0%, #080b12 58%, #05070c 100%);
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

    body.lampa-modern-ui .card--wide {
        width: min(78vw, 25em);
    }

    body.lampa-modern-ui .card.focus,
    body.lampa-modern-ui .card.hover {
        transform: none;
    }

    body.lampa-modern-ui .card.focus .card__view,
    body.lampa-modern-ui .card.hover .card__view {
        box-shadow: var(--lmui-focus-ring), 0 0.75em 1.8em rgba(0, 0, 0, 0.34);
    }

    body.lampa-modern-ui .full-start-new {
        padding-bottom: 2em;
    }

    body.lampa-modern-ui .full-start-new__right {
        width: 100%;
        padding-top: 1.25em;
        background: linear-gradient(180deg, transparent, rgba(8, 11, 18, 0.94) 14%);
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

    body.lampa-modern-ui .full-start-new__buttons .full-start__button:first-child {
        grid-column: 1 / -1;
    }

    body.lampa-modern-ui .search-box {
        width: 100%;
        padding: 0.5em 0;
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

@media (hover: hover) and (pointer: fine) {
    body.lampa-modern-ui .card.hover:not(.focus) {
        transform: translateY(-0.06em) scale(1.018);
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

@supports (padding-bottom: env(safe-area-inset-bottom)) {
    body.lampa-modern-ui.true--mobile .navigation-bar {
        padding-bottom: calc(0.55em + env(safe-area-inset-bottom));
    }
}
`;

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

    function notify(message) {
        try {
            if (window.Lampa && Lampa.Noty && typeof Lampa.Noty.show === 'function') return Lampa.Noty.show(message);
        } catch (error) {}
        console.info('[Lampa Modern UI] ' + message);
    }

    function detectDeviceMode() {
        var width = Math.max(window.innerWidth || 0, document.documentElement ? document.documentElement.clientWidth : 0);
        var height = Math.max(window.innerHeight || 0, document.documentElement ? document.documentElement.clientHeight : 0);
        var coarse = false;
        var noHover = false;
        var touch = Number((window.navigator && window.navigator.maxTouchPoints) || 0);

        try {
            coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
            noHover = !!(window.matchMedia && window.matchMedia('(hover: none)').matches);
        } catch (error) {}

        if ((touch > 0 || coarse) && Math.min(width, height) <= 620) return 'phone';
        if ((touch > 0 || coarse) && Math.min(width, height) <= 980) return 'tablet';
        if (noHover && coarse && width >= 900) return 'tv';
        return 'desktop';
    }

    function sanitizeComponentName(value) {
        return String(value || 'unknown').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown';
    }

    function currentComponent() {
        try {
            if (window.Lampa && Lampa.Activity && typeof Lampa.Activity.active === 'function') {
                var active = Lampa.Activity.active();
                if (active && active.component) return active.component;
            }
        } catch (error) {}
        try {
            return new URLSearchParams(window.location.search).get('component') || 'main';
        } catch (error) {
            return 'main';
        }
    }

    function removeThemeClasses(body) {
        Array.prototype.slice.call(body.classList).forEach(function (name) {
            if (name === 'lampa-modern-ui' || name.indexOf('lmui-') === 0) body.classList.remove(name);
        });
    }

    function applyActivityClass(component) {
        var body = document.body;
        if (!body) return;
        Array.prototype.slice.call(body.classList).forEach(function (name) {
            if (name.indexOf('lmui-component-') === 0) body.classList.remove(name);
        });
        body.classList.add('lmui-component-' + sanitizeComponentName(component || currentComponent()));
    }

    function applyTheme() {
        var body = document.body;
        if (!body) return;

        removeThemeClasses(body);
        if (!boolValue(storageGet(KEYS.enabled, true), true)) return;

        var density = String(storageGet(KEYS.density, 'comfortable') || 'comfortable');
        var motion = String(storageGet(KEYS.motion, 'calm') || 'calm');
        var performance = String(storageGet(KEYS.performance, 'standard') || 'standard');

        if (['comfortable', 'compact'].indexOf(density) < 0) density = 'comfortable';
        if (['calm', 'minimal'].indexOf(motion) < 0) motion = 'calm';
        if (['standard', 'lite'].indexOf(performance) < 0) performance = 'standard';

        body.classList.add(
            'lampa-modern-ui',
            'lmui-density-' + density,
            'lmui-motion-' + motion,
            'lmui-performance-' + performance,
            'lmui-device-' + detectDeviceMode()
        );
        applyActivityClass(currentComponent());
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

    function removeShotsDom() {
        try {
            Array.prototype.slice.call(document.querySelectorAll('script[src*="/plugin/shots"], [class*="shots-"], #sprite-shots')).forEach(function (element) {
                if (element && element.parentNode) element.parentNode.removeChild(element);
            });
            Array.prototype.slice.call(document.querySelectorAll('.menu__item, .settings-folder')).forEach(function (element) {
                var text = String(element.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
                if (text === 'shots') element.remove();
            });
        } catch (error) {
            console.warn('[Lampa Modern UI] Shots cleanup failed:', error);
        }
    }

    function applyShotsPolicy() {
        if (!boolValue(storageGet(KEYS.disableShots, true), true)) return;
        window.plugin_shots_ready = true;
        storageSet('shots_in_player', false);
        storageSet('shots_in_card', false);
        storageSet('content_rows_shots_main', false);
        try {
            if (window.Lampa && Lampa.SettingsApi && typeof Lampa.SettingsApi.removeComponent === 'function') Lampa.SettingsApi.removeComponent('shots');
        } catch (error) {}
        removeShotsDom();
    }

    function addSettings() {
        var icon = '<svg viewBox="0 0 32 32" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="5" width="24" height="22" rx="7" stroke="currentColor" stroke-width="2"/><path d="M9 19.5 13.2 15l3.3 3.1L23 11.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="23" cy="11.5" r="2" fill="currentColor"/></svg>';

        Lampa.SettingsApi.addComponent({ component: PLUGIN_ID, name: 'Интерфейс', icon: icon });
        Lampa.SettingsApi.addParam({
            component: PLUGIN_ID,
            param: { name: KEYS.enabled, type: 'trigger', default: true },
            field: { name: 'Новый интерфейс', description: 'Единая тема для главной, карточек, поиска и настроек.' },
            onChange: applyTheme
        });
        Lampa.SettingsApi.addParam({
            component: PLUGIN_ID,
            param: { name: KEYS.density, type: 'select', values: { comfortable: 'Комфортно', compact: 'Компактно' }, default: 'comfortable' },
            field: { name: 'Размер карточек', description: 'Компактный режим показывает больше контента в строке.' },
            onChange: applyTheme
        });
        Lampa.SettingsApi.addParam({
            component: PLUGIN_ID,
            param: { name: KEYS.motion, type: 'select', values: { calm: 'Плавно', minimal: 'Без анимаций' }, default: 'calm' },
            field: { name: 'Движение', description: 'Отключение анимаций сохраняет все состояния фокуса.' },
            onChange: applyTheme
        });
        Lampa.SettingsApi.addParam({
            component: PLUGIN_ID,
            param: { name: KEYS.performance, type: 'select', values: { standard: 'Обычный', lite: 'Экономный' }, default: 'standard' },
            field: { name: 'Фон', description: 'Экономный режим скрывает штатный динамический фон Lampa.' },
            onChange: applyTheme
        });
        Lampa.SettingsApi.addParam({
            component: PLUGIN_ID,
            param: { name: KEYS.disableShots, type: 'trigger', default: true },
            field: { name: 'Отключить Shots', description: 'Изменение полностью применяется после перезапуска Lampa.' },
            onChange: function () {
                applyShotsPolicy();
                notify('Перезапустите Lampa для полного применения настройки Shots');
            }
        });
    }

    function readyToStart() {
        return !!(
            document.head &&
            document.body &&
            window.Lampa &&
            Lampa.Storage &&
            Lampa.SettingsApi
        );
    }

    function start() {
        if (window[READY_FLAG]) return;
        if (!readyToStart()) {
            startAttempts += 1;
            if (startAttempts < START_ATTEMPTS) {
                clearTimeout(startTimer);
                startTimer = setTimeout(start, 100);
            } else {
                console.warn('[Lampa Modern UI] Required Lampa API unavailable');
            }
            return;
        }

        window[READY_FLAG] = true;
        injectStyle();
        addSettings();
        applyTheme();
        applyShotsPolicy();

        if (Lampa.Listener && typeof Lampa.Listener.follow === 'function') {
            Lampa.Listener.follow('activity', function (event) {
                if (event && (event.type === 'start' || event.type === 'create' || event.type === 'archive')) {
                    applyActivityClass(event.component);
                    applyShotsPolicy();
                }
            });
            Lampa.Listener.follow('resize_end', applyTheme);
        }

        window.addEventListener('orientationchange', applyTheme, { passive: true });
        console.info('[Lampa Modern UI] v' + VERSION + ' loaded');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();

    if (window.Lampa && Lampa.Listener && typeof Lampa.Listener.follow === 'function') {
        Lampa.Listener.follow('app', function (event) {
            if (event && event.type === 'ready') start();
        });
    }
})();

/* Lampa Personal Core 1.1.0
 * Локальная персональная главная, единая идентификация и объяснимые рекомендации.
 * Профиль один, хранится локально. Облачная синхронизация не используется.
 */
(function () {
    'use strict';

    var VERSION = '1.1.0';
    var READY_FLAG = '__lampa_personal_core_v110_ready__';
    var PROFILE_KEY = 'lpersonal_profile_v1';
    var STYLE_ID = 'lampa-personal-style';
    var COMPONENT_ID = 'lampa_personal';
    var SCHEMA_VERSION = 1;
    var MAX_RECENT = 80;
    var MAX_CONTENT = 320;
    var MAX_CANDIDATES = 420;
    var MAX_RECOMMENDATIONS = 60;
    var MAX_EPISODE_HISTORY = 600;
    var HOME_IDS = ['continue', 'new_episodes', 'recommendations', 'watchlist'];
    var HOME_TITLES = {
        continue: 'Продолжить',
        new_episodes: 'Новые серии',
        recommendations: 'Для вас',
        watchlist: 'Мой список'
    };
    var SETTINGS = {
        enabled: 'lpersonal_enabled',
        cardPanel: 'lpersonal_card_panel',
        hideComments: 'lpersonal_hide_comments',
        homeMode: 'lpersonal_home_mode',
        recommendationLimit: 'lpersonal_recommendation_limit'
    };

    var profile = null;
    var bus = null;
    var homeRows = {};
    var ratingProviders = [];
    var currentCanonical = '';
    var refreshTimer = 0;
    var recomputeTimer = 0;
    var timelineSaveTimer = 0;
    var timelineTargetCache = {};
    var enrichmentRunning = false;
    var saveLocked = false;
    var lastStorageErrorAt = 0;
    var startAttempts = 0;
    var startTimer = 0;
    var homeDiagnosticsState = {
        registeredAt: 0,
        calls: 0,
        lastCallAt: 0,
        lastScreen: '',
        lastParams: {},
        lastCounts: {},
        lastCallbacks: [],
        coldStartRequests: 0,
        coldStartResults: 0,
        coldStartError: '',
        refreshRequests: 0,
        lastRefreshAt: 0,
        lastRefreshReason: '',
        lastError: ''
    };

    var CSS = String.raw`
.lpersonal-insight {
    max-width: 58em;
    margin-top: 1em;
    padding-top: 0.95em;
    border-top: 0.075em solid var(--lmui-border, rgba(255,255,255,.10));
    color: var(--lmui-text, #fff);
}

.lpersonal-insight__facts {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.3em 0.75em;
    color: var(--lmui-muted, rgba(230,236,246,.72));
    font-size: 0.92em;
    line-height: 1.35;
}

.lpersonal-insight__fact {
    display: inline-flex;
    align-items: baseline;
    gap: 0.32em;
}

.lpersonal-insight__fact + .lpersonal-insight__fact::before {
    content: "·";
    margin-right: 0.42em;
    color: var(--lmui-faint, rgba(220,228,242,.42));
}

.lpersonal-insight__fact strong {
    color: var(--lmui-text, #fff);
    font-weight: 720;
}

.lpersonal-insight__reason {
    display: flex;
    align-items: flex-start;
    gap: 0.55em;
    margin-top: 0.72em;
    color: var(--lmui-muted, rgba(230,236,246,.72));
    font-size: 0.94em;
    line-height: 1.45;
}

.lpersonal-insight__reason::before {
    content: "";
    flex: 0 0 auto;
    width: 0.48em;
    height: 0.48em;
    margin-top: 0.42em;
    border-radius: 50%;
    background: var(--lmui-accent, #6da8ff);
    box-shadow: 0 0 0 0.22em rgba(109,168,255,.14);
}

.lpersonal-insight__actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5em;
    margin-top: 0.85em;
}

.lpersonal-insight__button {
    min-height: 2.55em;
    padding: 0.52em 0.78em;
    border: 0.075em solid var(--lmui-border, rgba(255,255,255,.10));
    border-radius: 0.72em;
    background: rgba(255,255,255,.045);
    color: var(--lmui-muted, rgba(230,236,246,.72));
    font-weight: 620;
    transition: color 115ms ease, background-color 115ms ease, border-color 115ms ease, box-shadow 115ms ease;
}

.lpersonal-insight__button.focus,
.lpersonal-insight__button.hover,
.lpersonal-insight__button:focus {
    outline: none;
    color: #fff;
    border-color: var(--lmui-accent, #6da8ff);
    background: rgba(109,168,255,.16);
    box-shadow: var(--lmui-focus-ring, 0 0 0 .11em #6da8ff);
}

.lpersonal-row-reason {
    margin-top: 0.3em;
    color: var(--lmui-muted, rgba(225,232,245,.65));
    font-size: 0.8em;
    line-height: 1.3;
}

body.lmui-device-phone .lpersonal-insight,
body.lmui-device-tablet .lpersonal-insight {
    max-width: 100%;
}

body.lmui-device-phone .lpersonal-insight__actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

body.lmui-device-phone .lpersonal-insight__button {
    width: 100%;
    min-height: 3em;
    justify-content: center;
}
`;
    function now() {
        return Date.now ? Date.now() : new Date().getTime();
    }

    function clone(value) {
        if (value === undefined) return undefined;
        try { return JSON.parse(JSON.stringify(value)); } catch (error) { return value; }
    }

    function isObject(value) {
        return !!value && typeof value === 'object' && !Array.isArray(value);
    }

    function asArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function unique(values) {
        var result = [];
        asArray(values).forEach(function (value) {
            if (value !== undefined && value !== null && value !== '' && result.indexOf(value) < 0) result.push(value);
        });
        return result;
    }

    function removeFromArray(values, item) {
        var index = values.indexOf(item);
        while (index >= 0) {
            values.splice(index, 1);
            index = values.indexOf(item);
        }
    }

    function moveToFront(values, item, limit) {
        removeFromArray(values, item);
        values.unshift(item);
        if (limit && values.length > limit) values.splice(limit);
    }

    function numberValue(value, fallback) {
        var parsed = parseFloat(value);
        return isFinite(parsed) ? parsed : fallback;
    }

    function boolValue(value, fallback) {
        if (value === undefined || value === null || value === '') return fallback;
        return value === true || value === 1 || value === '1' || value === 'true';
    }

    function normalizeText(value) {
        return String(value || '').replace(/\s+/g, ' ').trim();
    }

    function escapeHtml(value) {
        return String(value === undefined || value === null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function hashText(value) {
        var text = String(value || '');
        var hash = 2166136261;
        var i;
        for (i = 0; i < text.length; i += 1) {
            hash ^= text.charCodeAt(i);
            hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
        }
        return (hash >>> 0).toString(36);
    }

    function storageGet(name, fallback) {
        try {
            if (window.Lampa && Lampa.Storage && typeof Lampa.Storage.get === 'function') {
                return Lampa.Storage.get(name, fallback);
            }
        } catch (error) {
            console.warn('[Lampa Personal] Storage.get failed:', name, error);
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
            console.warn('[Lampa Personal] Storage.set failed:', name, error);
        }
        return false;
    }

    function storageField(name, fallback) {
        try {
            if (window.Lampa && Lampa.Storage && typeof Lampa.Storage.field === 'function') {
                var value = Lampa.Storage.field(name);
                return value === undefined || value === null || value === '' ? fallback : value;
            }
        } catch (error) {}
        return storageGet(name, fallback);
    }

    function notify(message) {
        try {
            if (window.Lampa && Lampa.Noty && typeof Lampa.Noty.show === 'function') {
                Lampa.Noty.show(message);
                return;
            }
        } catch (error) {}
        console.info('[Lampa Personal] ' + message);
    }

    function createBus() {
        try {
            if (window.Lampa && typeof Lampa.Subscribe === 'function') return Lampa.Subscribe();
        } catch (error) {}
        return {
            _listeners: {},
            follow: function (name, callback) {
                this._listeners[name] = this._listeners[name] || [];
                this._listeners[name].push(callback);
                return this;
            },
            send: function (name, event) {
                asArray(this._listeners[name]).slice().forEach(function (callback) {
                    try { callback(event || {}); } catch (error) { console.error(error); }
                });
                return this;
            }
        };
    }

    function defaultProfile() {
        var enabled = {};
        HOME_IDS.forEach(function (id) { enabled[id] = true; });
        return {
            schemaVersion: SCHEMA_VERSION,
            updatedAt: now(),
            aliases: {},
            identities: {},
            cards: {},
            metadata: {},
            recent: [],
            history: {},
            episodeHistory: {},
            ratings: {},
            collections: { watchlist: [], custom: {} },
            exclusions: {
                content: {},
                disliked: {},
                actors: {},
                directors: {},
                countries: {},
                genreWeights: {},
                ignoredInfluence: {}
            },
            candidates: {},
            recommendations: { items: [], updatedAt: 0 },
            home: { order: HOME_IDS.slice(), enabled: enabled, coldStart: [] },
            interface: {}
        };
    }

    function normalizeProfile(raw) {
        var base = defaultProfile();
        if (!isObject(raw)) return base;

        Object.keys(base).forEach(function (key) {
            if (raw[key] !== undefined) base[key] = raw[key];
        });

        if (!isObject(base.aliases)) base.aliases = {};
        if (!isObject(base.identities)) base.identities = {};
        if (!isObject(base.cards)) base.cards = {};
        if (!isObject(base.metadata)) base.metadata = {};
        if (!Array.isArray(base.recent)) base.recent = [];
        if (!isObject(base.history)) base.history = {};
        if (!isObject(base.episodeHistory)) base.episodeHistory = {};
        if (!isObject(base.ratings)) base.ratings = {};
        if (!isObject(base.collections)) base.collections = { watchlist: [], custom: {} };
        if (!Array.isArray(base.collections.watchlist)) base.collections.watchlist = [];
        if (!isObject(base.collections.custom)) base.collections.custom = {};
        if (!isObject(base.exclusions)) base.exclusions = defaultProfile().exclusions;
        ['content', 'disliked', 'actors', 'directors', 'countries', 'genreWeights', 'ignoredInfluence'].forEach(function (name) {
            if (!isObject(base.exclusions[name])) base.exclusions[name] = {};
        });
        if (!isObject(base.candidates)) base.candidates = {};
        if (!isObject(base.recommendations)) base.recommendations = { items: [], updatedAt: 0 };
        if (!Array.isArray(base.recommendations.items)) base.recommendations.items = [];
        if (!isObject(base.home)) base.home = defaultProfile().home;
        if (!Array.isArray(base.home.order)) base.home.order = HOME_IDS.slice();
        base.home.order = normalizeHomeOrder(base.home.order);
        if (!isObject(base.home.enabled)) base.home.enabled = defaultProfile().home.enabled;
        HOME_IDS.forEach(function (id) {
            if (base.home.enabled[id] === undefined) base.home.enabled[id] = true;
        });
        if (!Array.isArray(base.home.coldStart)) base.home.coldStart = [];
        if (!isObject(base.interface)) base.interface = {};
        base.schemaVersion = SCHEMA_VERSION;
        return base;
    }

    function loadProfile() {
        profile = normalizeProfile(storageGet(PROFILE_KEY, ''));
        syncHomeSettingsToProfile(false);
        return profile;
    }

    function trimMap(map, score, max) {
        var keys = Object.keys(map || {});
        if (keys.length <= max) return;
        keys.sort(function (a, b) { return score(b, map[b]) - score(a, map[a]); });
        keys.slice(max).forEach(function (key) { delete map[key]; });
    }

    function trimProfile() {
        profile.recent = unique(profile.recent).slice(0, MAX_RECENT);
        profile.collections.watchlist = unique(profile.collections.watchlist).slice(0, 220);
        profile.recommendations.items = asArray(profile.recommendations.items).slice(0, MAX_RECOMMENDATIONS);
        profile.home.coldStart = unique(asArray(profile.home.coldStart)).slice(0, 30);

        trimMap(profile.candidates, function (key, value) {
            return numberValue(value && value.updatedAt, 0);
        }, MAX_CANDIDATES);

        trimMap(profile.history, function (key, value) {
            return Math.max(numberValue(value && value.lastOpenedAt, 0), numberValue(value && value.updatedAt, 0));
        }, MAX_CONTENT);

        trimMap(profile.episodeHistory, function (key, value) {
            return numberValue(value && value.updatedAt, 0);
        }, MAX_EPISODE_HISTORY);

        var keep = {};
        profile.recent.forEach(function (id) { keep[id] = true; });
        profile.collections.watchlist.forEach(function (id) { keep[id] = true; });
        Object.keys(profile.history).forEach(function (id) { keep[id] = true; });
        profile.recommendations.items.forEach(function (item) { if (item && item.id) keep[item.id] = true; });
        profile.home.coldStart.forEach(function (id) { keep[id] = true; });

        var cardKeys = Object.keys(profile.cards);
        if (cardKeys.length > MAX_CONTENT) {
            cardKeys.sort(function (a, b) {
                var ah = profile.history[a] || {};
                var bh = profile.history[b] || {};
                return numberValue(bh.lastOpenedAt, 0) - numberValue(ah.lastOpenedAt, 0);
            });
            cardKeys.slice(MAX_CONTENT).forEach(function (id) {
                if (!keep[id]) {
                    delete profile.cards[id];
                    delete profile.metadata[id];
                    delete profile.identities[id];
                }
            });
        }
    }

    function captureInterfaceSettings() {
        var keys = ['lmui_enabled', 'lmui_motion', 'lmui_density', 'lmui_performance'];
        var result = {};
        keys.forEach(function (key) {
            var value = storageField(key, undefined);
            if (value !== undefined) result[key] = value;
        });
        profile.interface = result;
    }

    function saveProfile(reason, quiet) {
        if (saveLocked || !profile) return false;
        var saved = false;
        saveLocked = true;
        try {
            profile.updatedAt = now();
            captureInterfaceSettings();
            trimProfile();
            saved = storageSet(PROFILE_KEY, profile);
        } finally {
            saveLocked = false;
        }
        if (!saved) {
            if (now() - lastStorageErrorAt > 30000) {
                lastStorageErrorAt = now();
                notify('Не удалось сохранить персональные данные');
            }
            return false;
        }
        if (!quiet && bus) bus.send('change', { reason: reason || 'update', profile: profile });
        return true;
    }

    function normalizeHomeOrder(value) {
        var order = Array.isArray(value) ? value.slice() : [];
        order = order.map(function (item) { return normalizeText(item).toLowerCase(); }).filter(function (item) {
            return HOME_IDS.indexOf(item) >= 0;
        });
        HOME_IDS.forEach(function (id) { if (order.indexOf(id) < 0) order.push(id); });
        return unique(order);
    }

    function syncHomeSettingsToProfile(save) {
        if (!profile) return;
        var mode = String(storageField(SETTINGS.homeMode, 'focused') || 'focused');
        if (mode !== 'minimal') mode = 'focused';

        profile.home.order = HOME_IDS.slice();
        profile.home.enabled.continue = true;
        profile.home.enabled.recommendations = true;
        profile.home.enabled.new_episodes = mode === 'focused';
        profile.home.enabled.watchlist = mode === 'focused';

        var personalEnabled = boolValue(storageField(SETTINGS.enabled, true), true);
        storageSet('content_rows_lpersonal_home', personalEnabled);
        if (save !== false) saveProfile('home-settings');
        updateHomeRowIndexes();
    }

    function mediaTypeOf(card) {
        if (!card) return 'movie';
        var explicit = String(card.media_type || card.mediaType || card.method || '').toLowerCase();
        if (explicit === 'tv' || explicit === 'series' || explicit === 'show') return 'tv';
        if (explicit === 'movie') return 'movie';
        return card.name || card.original_name || card.first_air_date || card.number_of_seasons || card.seasons ? 'tv' : 'movie';
    }

    function normalizeId(value) {
        if (value === undefined || value === null || value === '') return '';
        return String(value).trim();
    }

    function firstValue(objects, names) {
        var i;
        var j;
        var obj;
        for (i = 0; i < objects.length; i += 1) {
            obj = objects[i];
            if (!obj) continue;
            for (j = 0; j < names.length; j += 1) {
                if (obj[names[j]] !== undefined && obj[names[j]] !== null && obj[names[j]] !== '') return obj[names[j]];
            }
        }
        return '';
    }

    function extractIds(card, detail) {
        card = card || {};
        detail = detail || {};
        var external = detail.external_ids || card.external_ids || {};
        var type = mediaTypeOf(detail && Object.keys(detail).length ? detail : card);
        var source = normalizeText(card.source || detail.source || 'local').toLowerCase();
        var id = normalizeId(firstValue([detail, card], ['tmdb_id', 'tmdbId']));

        if (!id && (source === 'tmdb' || source === 'cub') && firstValue([detail, card], ['id']) !== '') {
            id = normalizeId(firstValue([detail, card], ['id']));
        }

        return {
            type: type,
            tmdb: id,
            imdb: normalizeId(firstValue([external, detail, card], ['imdb_id', 'imdbId', 'imdb'])),
            kinopoisk: normalizeId(firstValue([external, detail, card], ['kinopoisk_id', 'kinopoiskId', 'kp_id', 'kpId', 'kinopoisk'])),
            local: firstValue([detail, card], ['id']) !== '' ? source + ':' + normalizeId(firstValue([detail, card], ['id'])) : '',
            source: source
        };
    }

    function aliasesForIds(ids) {
        var result = [];
        if (ids.tmdb) result.push(ids.type + ':tmdb:' + ids.tmdb);
        if (ids.imdb) result.push(ids.type + ':imdb:' + ids.imdb.toLowerCase());
        if (ids.kinopoisk) result.push(ids.type + ':kinopoisk:' + ids.kinopoisk);
        if (ids.local) result.push(ids.type + ':local:' + ids.local.toLowerCase());
        return unique(result);
    }

    function preferredCanonical(ids, aliases, card) {
        var i;
        for (i = 0; i < aliases.length; i += 1) {
            if (profile.aliases[aliases[i]]) return profile.aliases[aliases[i]];
        }
        if (ids.tmdb) return ids.type + ':tmdb:' + ids.tmdb;
        if (ids.imdb) return ids.type + ':imdb:' + ids.imdb.toLowerCase();
        if (ids.kinopoisk) return ids.type + ':kinopoisk:' + ids.kinopoisk;
        if (ids.local) return ids.type + ':local:' + ids.local.toLowerCase();

        var title = normalizeText(card && (card.title || card.name || card.original_title || card.original_name));
        var year = String((card && (card.release_date || card.first_air_date)) || '').slice(0, 4);
        return ids.type + ':generated:' + hashText(title.toLowerCase() + '|' + year);
    }

    function mergeObjects(primary, secondary) {
        primary = isObject(primary) ? primary : {};
        secondary = isObject(secondary) ? secondary : {};
        Object.keys(secondary).forEach(function (key) {
            if (primary[key] === undefined || primary[key] === null || primary[key] === '' || (Array.isArray(primary[key]) && !primary[key].length)) {
                primary[key] = clone(secondary[key]);
            } else if (isObject(primary[key]) && isObject(secondary[key])) {
                primary[key] = mergeObjects(primary[key], secondary[key]);
            } else if (Array.isArray(primary[key]) && Array.isArray(secondary[key])) {
                primary[key] = unique(primary[key].concat(secondary[key]));
            }
        });
        return primary;
    }

    function episodeHistoryKey(canonical, season, episode) {
        return canonical + ':episode:' + String(season) + ':' + String(episode);
    }

    function migrateEpisodeHistory(oldId, newId) {
        Object.keys(profile.episodeHistory || {}).forEach(function (key) {
            var item = profile.episodeHistory[key];
            if (!item || item.showCanonical !== oldId) return;
            var nextKey = episodeHistoryKey(newId, item.season, item.episode);
            item.showCanonical = newId;
            profile.episodeHistory[nextKey] = mergeObjects(profile.episodeHistory[nextKey], item);
            if (nextKey !== key) delete profile.episodeHistory[key];
        });
    }

    function replaceCanonicalInProfile(oldId, newId) {
        if (!oldId || !newId || oldId === newId) return;
        profile.recent = unique(profile.recent.map(function (id) { return id === oldId ? newId : id; }));
        profile.collections.watchlist = unique(profile.collections.watchlist.map(function (id) { return id === oldId ? newId : id; }));
        Object.keys(profile.collections.custom).forEach(function (name) {
            profile.collections.custom[name] = unique(asArray(profile.collections.custom[name]).map(function (id) { return id === oldId ? newId : id; }));
        });
        profile.recommendations.items.forEach(function (item) { if (item && item.id === oldId) item.id = newId; });
        migrateEpisodeHistory(oldId, newId);
        Object.keys(profile.candidates).forEach(function (id) {
            var candidate = profile.candidates[id];
            if (candidate && candidate.seedIds) candidate.seedIds = unique(candidate.seedIds.map(function (seedId) { return seedId === oldId ? newId : seedId; }));
        });
        Object.keys(profile.metadata).forEach(function (id) {
            var relations = profile.metadata[id] && profile.metadata[id].relations;
            if (!relations) return;
            ['similar', 'related', 'franchise'].forEach(function (kind) {
                relations[kind] = unique(asArray(relations[kind]).map(function (item) { return item === oldId ? newId : item; }));
            });
        });
    }

    function mergeCanonical(primaryId, secondaryId) {
        if (!primaryId || !secondaryId || primaryId === secondaryId) return primaryId;
        profile.identities[primaryId] = mergeObjects(profile.identities[primaryId], profile.identities[secondaryId]);
        profile.cards[primaryId] = mergeObjects(profile.cards[primaryId], profile.cards[secondaryId]);
        profile.metadata[primaryId] = mergeObjects(profile.metadata[primaryId], profile.metadata[secondaryId]);

        var pHistory = profile.history[primaryId] || {};
        var sHistory = profile.history[secondaryId] || {};
        pHistory.openCount = numberValue(pHistory.openCount, 0) + numberValue(sHistory.openCount, 0);
        pHistory.firstOpenedAt = Math.min(numberValue(pHistory.firstOpenedAt, Number.MAX_SAFE_INTEGER || 9007199254740991), numberValue(sHistory.firstOpenedAt, Number.MAX_SAFE_INTEGER || 9007199254740991));
        if (!isFinite(pHistory.firstOpenedAt) || pHistory.firstOpenedAt > now()) pHistory.firstOpenedAt = numberValue(sHistory.firstOpenedAt, numberValue(pHistory.firstOpenedAt, now()));
        pHistory.lastOpenedAt = Math.max(numberValue(pHistory.lastOpenedAt, 0), numberValue(sHistory.lastOpenedAt, 0));
        pHistory.updatedAt = Math.max(numberValue(pHistory.updatedAt, 0), numberValue(sHistory.updatedAt, 0));
        pHistory.finished = !!(pHistory.finished || sHistory.finished);
        pHistory.liked = !!(pHistory.liked || sHistory.liked);
        pHistory.influence = pHistory.influence !== false && sHistory.influence !== false;
        pHistory = mergeObjects(pHistory, sHistory);
        if (Object.keys(pHistory).length) profile.history[primaryId] = pHistory;

        var pRating = profile.ratings[primaryId];
        var sRating = profile.ratings[secondaryId];
        if (!pRating || (sRating && numberValue(sRating.updatedAt, 0) > numberValue(pRating.updatedAt, 0))) profile.ratings[primaryId] = clone(sRating || pRating);

        profile.candidates[primaryId] = mergeObjects(profile.candidates[primaryId], profile.candidates[secondaryId]);
        profile.exclusions.content[primaryId] = profile.exclusions.content[primaryId] || profile.exclusions.content[secondaryId];
        profile.exclusions.disliked[primaryId] = profile.exclusions.disliked[primaryId] || profile.exclusions.disliked[secondaryId];
        profile.exclusions.ignoredInfluence[primaryId] = profile.exclusions.ignoredInfluence[primaryId] || profile.exclusions.ignoredInfluence[secondaryId];

        Object.keys(profile.aliases).forEach(function (alias) {
            if (profile.aliases[alias] === secondaryId) profile.aliases[alias] = primaryId;
        });
        replaceCanonicalInProfile(secondaryId, primaryId);

        ['identities', 'cards', 'metadata', 'history', 'ratings', 'candidates'].forEach(function (name) { delete profile[name][secondaryId]; });
        ['content', 'disliked', 'ignoredInfluence'].forEach(function (name) { delete profile.exclusions[name][secondaryId]; });
        return primaryId;
    }

    function cardSnapshot(card) {
        card = card || {};
        var fields = [
            'id', 'source', 'title', 'name', 'original_title', 'original_name', 'overview',
            'poster_path', 'backdrop_path', 'img', 'background_image', 'release_date', 'first_air_date',
            'vote_average', 'vote_count', 'genre_ids', 'genres', 'number_of_seasons', 'seasons',
            'original_language', 'media_type', 'adult', 'runtime', 'episode_run_time', 'status',
            'imdb_id', 'kinopoisk_id', 'kp_id'
        ];
        var result = {};
        fields.forEach(function (field) {
            if (card[field] !== undefined && card[field] !== null) result[field] = clone(card[field]);
        });
        result.source = result.source || 'tmdb';
        return result;
    }

    function observeIdentity(card, detail) {
        card = card || detail || {};
        detail = detail || card || {};
        var ids = extractIds(card, detail);
        var aliases = aliasesForIds(ids);
        var canonical = preferredCanonical(ids, aliases, detail);
        var existing = unique(aliases.map(function (alias) { return profile.aliases[alias]; }).filter(Boolean));

        if (existing.length) canonical = existing[0];
        existing.slice(1).forEach(function (other) { canonical = mergeCanonical(canonical, other); });

        aliases.forEach(function (alias) {
            var mapped = profile.aliases[alias];
            if (mapped && mapped !== canonical) canonical = mergeCanonical(canonical, mapped);
            profile.aliases[alias] = canonical;
        });

        var record = profile.identities[canonical] || { canonicalId: canonical, mediaType: ids.type, ids: {}, aliases: [], updatedAt: 0 };
        record.mediaType = ids.type;
        record.ids.tmdb = ids.tmdb || record.ids.tmdb || '';
        record.ids.imdb = ids.imdb || record.ids.imdb || '';
        record.ids.kinopoisk = ids.kinopoisk || record.ids.kinopoisk || '';
        record.ids.local = unique(asArray(record.ids.local).concat(ids.local ? [ids.local] : []));
        record.aliases = unique(asArray(record.aliases).concat(aliases));
        record.updatedAt = now();
        profile.identities[canonical] = record;
        profile.cards[canonical] = mergeObjects(cardSnapshot(detail), cardSnapshot(card));
        return canonical;
    }

    function normalizeGenres(value) {
        var result = [];
        asArray(value).forEach(function (genre) {
            if (isObject(genre)) {
                var id = normalizeId(genre.id || genre.name);
                if (id) result.push({ id: id, name: normalizeText(genre.name || genre.title || id) });
            } else if (genre !== undefined && genre !== null && genre !== '') {
                result.push({ id: normalizeId(genre), name: normalizeId(genre) });
            }
        });
        return result;
    }

    function normalizePersons(value, job) {
        var result = [];
        asArray(value).forEach(function (person) {
            if (!person) return;
            if (job && normalizeText(person.job).toLowerCase() !== job.toLowerCase()) return;
            var id = normalizeId(person.id || person.name);
            if (!id) return;
            result.push({ id: id, name: normalizeText(person.name || id) });
        });
        return result;
    }

    function readNested(object, path) {
        var value = object;
        var i;
        for (i = 0; i < path.length; i += 1) {
            if (!value || value[path[i]] === undefined) return undefined;
            value = value[path[i]];
        }
        return value;
    }

    function extractRating(objects, paths) {
        var i;
        var j;
        var value;
        for (i = 0; i < objects.length; i += 1) {
            for (j = 0; j < paths.length; j += 1) {
                value = readNested(objects[i], paths[j]);
                value = numberValue(value, NaN);
                if (isFinite(value) && value > 0) return Math.round(value * 10) / 10;
            }
        }
        return null;
    }

    function metadataFromFull(card, data) {
        data = data || {};
        var movie = data.movie || card || {};
        var persons = data.persons || {};
        var metadata = {
            mediaType: mediaTypeOf(movie),
            title: normalizeText(movie.title || movie.name || card.title || card.name),
            originalTitle: normalizeText(movie.original_title || movie.original_name || card.original_title || card.original_name),
            year: String(movie.release_date || movie.first_air_date || card.release_date || card.first_air_date || '').slice(0, 4),
            genres: normalizeGenres(movie.genres || movie.genre_ids || card.genres || card.genre_ids),
            cast: normalizePersons(persons.cast || movie.cast).slice(0, 30),
            directors: normalizePersons(persons.crew || movie.crew, 'Director').slice(0, 12),
            countries: unique(asArray(movie.production_countries).map(function (country) { return normalizeText(country.iso_3166_1 || country.name); }).filter(Boolean)),
            runtimeMinutes: numberValue(movie.runtime, 0) || numberValue(asArray(movie.episode_run_time)[0], 0) || numberValue(card.runtime, 0),
            ratings: {
                tmdb: extractRating([movie, card], [["vote_average"], ["ratings", "tmdb"], ["rating_tmdb"]]),
                imdb: extractRating([movie, card], [["imdb_rating"], ["rating_imdb"], ["ratings", "imdb"], ["imdb", "rating"]]),
                kinopoisk: extractRating([movie, card], [["kinopoisk_rating"], ["kp_rating"], ["rating_kp"], ["ratings", "kinopoisk"], ["ratings", "kp"]])
            },
            status: normalizeText(movie.status || ''),
            nextEpisode: movie.next_episode_to_air ? clone(movie.next_episode_to_air) : null,
            knownEpisodes: [],
            relations: { similar: [], related: [], franchise: [] },
            updatedAt: now()
        };

        if (!metadata.countries.length && movie.origin_country) metadata.countries = unique(asArray(movie.origin_country));

        if (data.episodes) {
            var episodeList = asArray(data.episodes.episodes_original || data.episodes.episodes);
            metadata.knownEpisodes = episodeList.slice(0, 250).map(function (episode) {
                return {
                    season_number: episode.season_number,
                    episode_number: episode.episode_number,
                    name: normalizeText(episode.name || ''),
                    air_date: episode.air_date || ''
                };
            }).filter(function (episode) {
                return episode.season_number !== undefined && episode.episode_number !== undefined;
            });
        }

        if (!metadata.nextEpisode && metadata.knownEpisodes.length) {
            var episodeList = metadata.knownEpisodes;
            var today = new Date();
            today.setHours(0, 0, 0, 0);
            episodeList.filter(function (episode) {
                if (!episode || !episode.air_date) return false;
                var time = new Date(episode.air_date + 'T00:00:00').getTime();
                return isFinite(time) && time >= today.getTime();
            }).sort(function (a, b) {
                return new Date(a.air_date + 'T00:00:00').getTime() - new Date(b.air_date + 'T00:00:00').getTime();
            }).slice(0, 1).forEach(function (episode) { metadata.nextEpisode = clone(episode); });
        }
        return metadata;
    }

    function registerRelations(seedCanonical, items, kind) {
        var result = [];
        asArray(items).forEach(function (item) {
            if (!item || !item.id) return;
            var canonical = observeIdentity(item, item);
            if (canonical === seedCanonical) return;
            result.push(canonical);
            var candidate = profile.candidates[canonical] || { id: canonical, seedIds: [], sourceKinds: [], updatedAt: 0 };
            candidate.id = canonical;
            candidate.seedIds = unique(asArray(candidate.seedIds).concat([seedCanonical]));
            candidate.sourceKinds = unique(asArray(candidate.sourceKinds).concat([kind]));
            candidate.updatedAt = now();
            profile.candidates[canonical] = candidate;
        });
        return unique(result);
    }

    function dedupeFullRelations(seedCanonical, data) {
        if (!data) return;
        var seen = {};
        seen[seedCanonical] = true;
        [
            { key: 'collection', kind: 'franchise' },
            { key: 'recomend', kind: 'related' },
            { key: 'simular', kind: 'similar' }
        ].forEach(function (group) {
            var section = data[group.key];
            if (!section || !Array.isArray(section.results)) return;
            section.results = section.results.filter(function (item) {
                if (!item || !item.id) return false;
                var canonical = observeIdentity(item, item);
                if (seen[canonical]) return false;
                seen[canonical] = true;
                return true;
            });
        });
    }

    function updateMetadataFromFull(canonical, card, data) {
        var metadata = metadataFromFull(card, data);
        var movie = (data && data.movie) || card || {};
        var identity = profile.identities[canonical] || {};
        var external = movie.external_ids || {};
        if (external.imdb_id || movie.imdb_id || movie.kinopoisk_id || movie.kp_id) {
            canonical = observeIdentity(card, movie);
            identity = profile.identities[canonical] || identity;
        }

        metadata.ids = clone(identity.ids || {});
        metadata.relations.similar = registerRelations(canonical, data && data.simular && data.simular.results, 'similar');
        metadata.relations.related = registerRelations(canonical, data && data.recomend && data.recomend.results, 'recommendation');
        metadata.relations.franchise = registerRelations(canonical, data && data.collection && data.collection.results, 'franchise');
        profile.metadata[canonical] = mergeObjects(metadata, profile.metadata[canonical]);
        profile.cards[canonical] = mergeObjects(cardSnapshot(movie), profile.cards[canonical]);

        ratingProviders.forEach(function (provider) {
            try {
                provider.resolve({ canonicalId: canonical, card: card, data: data, metadata: profile.metadata[canonical] }, function (ratings) {
                    if (!ratings || !profile.metadata[canonical]) return;
                    profile.metadata[canonical].ratings = mergeObjects(profile.metadata[canonical].ratings || {}, ratings);
                    profile.metadata[canonical].updatedAt = now();
                    saveProfile('rating-provider');
                    renderFullPanel(canonical, data && data.body);
                });
            } catch (error) {
                console.warn('[Lampa Personal] rating provider failed:', provider.name, error);
            }
        });
        return canonical;
    }

    function timeBucket(timestamp) {
        var hour = new Date(timestamp || now()).getHours();
        if (hour >= 5 && hour < 11) return 'morning';
        if (hour >= 11 && hour < 17) return 'day';
        if (hour >= 17 && hour < 23) return 'evening';
        return 'night';
    }

    function recordOpened(canonical, source) {
        var timestamp = now();
        var history = profile.history[canonical] || {
            firstOpenedAt: timestamp,
            lastOpenedAt: 0,
            openCount: 0,
            finished: false,
            influence: true,
            timeBuckets: {}
        };
        if (!history.lastOpenedAt || timestamp - history.lastOpenedAt > 30000) history.openCount = numberValue(history.openCount, 0) + 1;
        history.lastOpenedAt = timestamp;
        history.updatedAt = timestamp;
        history.source = source || history.source || 'full';
        history.timeBuckets = isObject(history.timeBuckets) ? history.timeBuckets : {};
        var bucket = timeBucket(timestamp);
        history.timeBuckets[bucket] = numberValue(history.timeBuckets[bucket], 0) + 1;
        if (history.influence === undefined) history.influence = true;
        profile.history[canonical] = history;
        moveToFront(profile.recent, canonical, MAX_RECENT);
        currentCanonical = canonical;
        saveProfile('opened');
        scheduleRecompute();
        scheduleHomeRefresh();
    }

    function setFinished(canonical, finished) {
        var history = profile.history[canonical] || { firstOpenedAt: now(), openCount: 0, influence: true, timeBuckets: {} };
        history.finished = !!finished;
        history.updatedAt = now();
        profile.history[canonical] = history;
        saveProfile('finished');
        scheduleRecompute();
        scheduleHomeRefresh();
    }

    function setRating(canonical, value) {
        value = Math.max(1, Math.min(10, Math.round(numberValue(value, 0))));
        if (!value) return;
        profile.ratings[canonical] = { value: value, updatedAt: now() };
        if (profile.history[canonical]) profile.history[canonical].liked = value >= 7;
        saveProfile('rating');
        scheduleRecompute();
        scheduleHomeRefresh();
    }

    function toggleWatchlist(canonical) {
        var list = profile.collections.watchlist;
        if (list.indexOf(canonical) >= 0) {
            removeFromArray(list, canonical);
            notify('Удалено из списка ожидания');
        } else {
            moveToFront(list, canonical, 220);
            notify('Добавлено в список ожидания');
        }
        saveProfile('watchlist');
        scheduleHomeRefresh();
    }

    function setContentExcluded(canonical, value) {
        if (value) profile.exclusions.content[canonical] = true;
        else delete profile.exclusions.content[canonical];
        saveProfile('exclude-content');
        scheduleRecompute();
        scheduleHomeRefresh();
    }

    function setDisliked(canonical, value) {
        if (value) profile.exclusions.disliked[canonical] = true;
        else delete profile.exclusions.disliked[canonical];
        saveProfile('disliked');
        scheduleRecompute();
        scheduleHomeRefresh();
    }

    function setInfluence(canonical, value) {
        var history = profile.history[canonical] || { firstOpenedAt: now(), openCount: 0, timeBuckets: {} };
        history.influence = !!value;
        history.updatedAt = now();
        profile.history[canonical] = history;
        if (value) delete profile.exclusions.ignoredInfluence[canonical];
        else profile.exclusions.ignoredInfluence[canonical] = true;
        saveProfile('influence');
        scheduleRecompute();
    }

    function addHardExclusion(kind, value, label) {
        if (!value || !profile.exclusions[kind]) return;
        profile.exclusions[kind][String(value)] = label || String(value);
        saveProfile('exclude-' + kind);
        scheduleRecompute();
        scheduleHomeRefresh();
    }

    function reduceGenre(genre) {
        if (!genre) return;
        var id = String(genre.id || genre);
        var current = numberValue(profile.exclusions.genreWeights[id], 0);
        profile.exclusions.genreWeights[id] = Math.max(-3, current - 1);
        saveProfile('genre-weight');
        scheduleRecompute();
    }

    function canonicalCards(ids) {
        return unique(ids).map(function (id) {
            var card = clone(profile.cards[id]);
            if (!card || !card.id || profile.exclusions.content[id]) return null;
            card.lpersonal_canonical_id = id;
            var recommendation = findRecommendation(id);
            if (recommendation) {
                card.lpersonal_reason = recommendation.explanation;
                card.lpersonal_score = recommendation.score;
            }
            return card;
        }).filter(Boolean);
    }

    function dedupeCards(cards) {
        var seen = {};
        var result = [];
        asArray(cards).forEach(function (card) {
            if (!card || !card.id) return;
            var canonical = observeIdentity(card, card);
            if (seen[canonical] || profile.exclusions.content[canonical]) return;
            seen[canonical] = true;
            profile.cards[canonical] = mergeObjects(cardSnapshot(card), profile.cards[canonical]);
            result.push(clone(profile.cards[canonical]));
        });
        return result;
    }

    function favoriteGet(type) {
        try {
            if (window.Lampa && Lampa.Favorite && typeof Lampa.Favorite.get === 'function') return asArray(Lampa.Favorite.get({ type: type }));
        } catch (error) {}
        return [];
    }

    function continueCards() {
        var result = [];
        try {
            if (window.Lampa && Lampa.Favorite && typeof Lampa.Favorite.continues === 'function') {
                result = asArray(Lampa.Favorite.continues('movie')).concat(asArray(Lampa.Favorite.continues('tv')));
            }
        } catch (error) {}
        if (!result.length) result = unfinishedCards();
        return sortCardsByHistory(dedupeCards(result));
    }

    function recentCards() {
        return canonicalCards(profile.recent);
    }

    function newEpisodeCards() {
        var results = [];
        try {
            if (window.Lampa && Lampa.TimeTable && typeof Lampa.TimeTable.recently === 'function') {
                results = asArray(Lampa.TimeTable.recently()).map(function (item) {
                    var card = clone(item.card || {});
                    var episode = item.episode || {};
                    if (episode.season_number !== undefined && episode.episode_number !== undefined) {
                        card.lpersonal_episode_label = 'S' + episode.season_number + ' · E' + episode.episode_number + (episode.name ? ' · ' + episode.name : '');
                    }
                    return card;
                });
            }
        } catch (error) {}
        return dedupeCards(results);
    }

    function watchlistCards() {
        var ids = profile.collections.watchlist.slice();
        favoriteGet('book').forEach(function (card) {
            var canonical = observeIdentity(card, card);
            if (ids.indexOf(canonical) < 0) ids.push(canonical);
        });
        return canonicalCards(ids);
    }

    function unfinishedCards() {
        var historyCards = favoriteGet('history');
        var viewed = {};
        var thrown = {};
        favoriteGet('viewed').forEach(function (card) { viewed[observeIdentity(card, card)] = true; });
        favoriteGet('thrown').forEach(function (card) { thrown[observeIdentity(card, card)] = true; });
        var result = [];

        historyCards.forEach(function (card) {
            var canonical = observeIdentity(card, card);
            if (!viewed[canonical] && !thrown[canonical] && !profile.exclusions.content[canonical]) result.push(card);
        });

        Object.keys(profile.history).forEach(function (canonical) {
            var item = profile.history[canonical];
            if (!item.finished && item.status !== 'thrown' && profile.cards[canonical]) result.push(profile.cards[canonical]);
        });

        var latestEpisode = {};
        Object.keys(profile.episodeHistory || {}).forEach(function (key) {
            var episode = profile.episodeHistory[key];
            if (!episode || episode.finished || numberValue(episode.percent, 0) <= 0 || !profile.cards[episode.showCanonical]) return;
            var previous = latestEpisode[episode.showCanonical];
            if (!previous || numberValue(episode.updatedAt, 0) > numberValue(previous.updatedAt, 0)) latestEpisode[episode.showCanonical] = episode;
        });
        Object.keys(latestEpisode).forEach(function (canonical) {
            var card = clone(profile.cards[canonical]);
            var episode = latestEpisode[canonical];
            card.lpersonal_episode_label = 'S' + episode.season + ' · E' + episode.episode + (episode.name ? ' · ' + episode.name : '');
            result.push(card);
        });
        return sortCardsByHistory(dedupeCards(result));
    }

    function sortCardsByHistory(cards) {
        return cards.sort(function (a, b) {
            var ca = observeIdentity(a, a);
            var cb = observeIdentity(b, b);
            return numberValue(profile.history[cb] && profile.history[cb].lastOpenedAt, 0) - numberValue(profile.history[ca] && profile.history[ca].lastOpenedAt, 0);
        });
    }

    function recommendationCards() {
        return canonicalCards(asArray(profile.recommendations.items).map(function (item) { return item.id; }));
    }

    function rowResults(id) {
        if (id === 'continue') return continueCards().slice(0, 20);
        if (id === 'recent') return recentCards().slice(0, 20);
        if (id === 'new_episodes') return newEpisodeCards().slice(0, 20);
        if (id === 'watchlist') return watchlistCards().slice(0, 20);
        if (id === 'unfinished') return unfinishedCards().slice(0, 20);
        if (id === 'recommendations') return recommendationCards().slice(0, numberValue(storageField(SETTINGS.recommendationLimit, 20), 20));
        return [];
    }

    function hasPersonalSignals() {
        return !!(
            profile.recent.length ||
            profile.collections.watchlist.length ||
            Object.keys(profile.history).length ||
            Object.keys(profile.ratings).length
        );
    }

    function coldStartCards() {
        var personalized = hasPersonalSignals();
        return canonicalCards(asArray(profile.home.coldStart)).filter(function (card) {
            var canonical = observeIdentity(card, card);
            if (profile.exclusions.content[canonical]) return false;
            if (personalized && profile.history[canonical]) return false;
            return true;
        });
    }

    function rememberColdStart(results) {
        var ids = [];
        asArray(results).forEach(function (card) {
            if (!card || !card.id) return;
            card.source = card.source || 'tmdb';
            card.media_type = card.media_type || 'movie';
            var canonical = observeIdentity(card, card);
            if (ids.indexOf(canonical) < 0) ids.push(canonical);
            var candidate = profile.candidates[canonical] || { id: canonical, seedIds: [], sourceKinds: [], updatedAt: 0 };
            candidate.id = canonical;
            candidate.sourceKinds = unique(asArray(candidate.sourceKinds).concat(['cold_start']));
            candidate.updatedAt = now();
            profile.candidates[canonical] = candidate;
        });
        if (ids.length) {
            profile.home.coldStart = ids.slice(0, 30);
            saveProfile('cold-start');
        }
        return canonicalCards(ids);
    }

    function coldStartCallback(params) {
        return function (call) {
            homeDiagnosticsState.coldStartRequests += 1;
            homeDiagnosticsState.coldStartError = '';
            var cached = coldStartCards();
            if (cached.length) {
                homeDiagnosticsState.coldStartResults = cached.length;
                call({ results: cached.slice(0, numberValue(storageField(SETTINGS.recommendationLimit, 20), 20)), title: hasPersonalSignals() ? 'Возможно, вам понравится' : 'Подборка для начала' });
                return;
            }
            try {
                var source = Lampa.Api && Lampa.Api.sources && Lampa.Api.sources.tmdb;
                if (!source || typeof source.get !== 'function') return call();
                source.get('trending/movie/week', params || {}, function (json) {
                    var results = rememberColdStart(json && json.results);
                    homeDiagnosticsState.coldStartResults = results.length;
                    call({
                        results: results.slice(0, numberValue(storageField(SETTINGS.recommendationLimit, 20), 20)),
                        title: hasPersonalSignals() ? 'Возможно, вам понравится' : 'Подборка для начала'
                    });
                }, function (error) {
                    homeDiagnosticsState.coldStartError = error && (error.message || error.status || String(error)) || 'TMDB request failed';
                    call();
                }, { life: 1000 * 60 * 60 * 6 });
            } catch (error) {
                homeDiagnosticsState.coldStartError = error && (error.message || String(error)) || 'unknown error';
                console.warn('[Lampa Personal] cold-start row failed:', error);
                call();
            }
        };
    }

    function rowCallback(id, results) {
        return function (call) {
            call({ results: results, title: HOME_TITLES[id] });
        };
    }

    function updateHomeRowIndexes() {
        if (homeRows.aggregate) homeRows.aggregate.index = 0;
    }

    function registerHomeRows() {
        if (!window.Lampa || !Lampa.ContentRows || typeof Lampa.ContentRows.add !== 'function') {
            homeDiagnosticsState.lastError = 'Lampa.ContentRows.add unavailable';
            return;
        }
        if (homeRows.aggregate) return;

        var row = {
            name: 'lpersonal_home',
            title: 'Персональная главная',
            index: 0,
            screen: ['main'],
            call: function (params, screen) {
                homeDiagnosticsState.calls += 1;
                homeDiagnosticsState.lastCallAt = now();
                homeDiagnosticsState.lastScreen = screen || '';
                homeDiagnosticsState.lastParams = clone(params || {});
                homeDiagnosticsState.lastCounts = {};
                homeDiagnosticsState.lastCallbacks = [];
                homeDiagnosticsState.lastError = '';

                if (!boolValue(storageField(SETTINGS.enabled, true), true)) {
                    homeDiagnosticsState.lastError = 'Personal functions disabled';
                    return;
                }

                syncHomeSettingsToProfile(false);
                var callbacks = [];
                profile.home.order.forEach(function (id) {
                    if (!profile.home.enabled[id]) {
                        homeDiagnosticsState.lastCounts[id] = 'disabled';
                        return;
                    }
                    var results = rowResults(id);
                    homeDiagnosticsState.lastCounts[id] = results.length;
                    if (results.length) {
                        callbacks.push(rowCallback(id, results));
                        homeDiagnosticsState.lastCallbacks.push(id);
                    } else if (id === 'recommendations') {
                        callbacks.push(coldStartCallback(params));
                        homeDiagnosticsState.lastCallbacks.push('recommendations:cold-start');
                    }
                });
                return callbacks.length ? callbacks : undefined;
            }
        };

        homeRows.aggregate = row;
        Lampa.ContentRows.add(row);
        homeDiagnosticsState.registeredAt = now();
        storageSet('content_rows_lpersonal_home', boolValue(storageField(SETTINGS.enabled, true), true));
        scheduleHomeRefresh('initial-registration');
    }

    function activeComponentName() {
        try {
            var active = Lampa.Activity && typeof Lampa.Activity.active === 'function' ? Lampa.Activity.active() : null;
            return active && active.component || '';
        } catch (error) {
            return '';
        }
    }

    function renderedHomeTitles() {
        try {
            return Array.prototype.slice.call(document.querySelectorAll('.activity--active .items-line__title, .items-line__title')).map(function (element) {
                return normalizeText(element.textContent);
            }).filter(Boolean);
        } catch (error) {
            return [];
        }
    }

    function collectHomeDiagnostics() {
        var counts = {};
        HOME_IDS.forEach(function (id) {
            try { counts[id] = rowResults(id).length; }
            catch (error) { counts[id] = 'error: ' + (error.message || String(error)); }
        });

        var report = {
            pluginVersion: VERSION,
            timestamp: new Date().toISOString(),
            activeComponent: activeComponentName(),
            personalEnabled: boolValue(storageField(SETTINGS.enabled, true), true),
            contentRowEnabled: boolValue(storageGet('content_rows_lpersonal_home', true), true),
            rowRegistered: !!homeRows.aggregate,
            homeOrder: profile.home.order.slice(),
            enabledBlocks: clone(profile.home.enabled),
            rowCounts: counts,
            profileCounts: {
                recent: profile.recent.length,
                history: Object.keys(profile.history).length,
                episodeHistory: Object.keys(profile.episodeHistory).length,
                ratings: Object.keys(profile.ratings).length,
                watchlist: profile.collections.watchlist.length,
                candidates: Object.keys(profile.candidates).length,
                recommendations: asArray(profile.recommendations.items).length,
                coldStart: asArray(profile.home.coldStart).length
            },
            lampaCounts: {
                history: favoriteGet('history').length,
                viewed: favoriteGet('viewed').length,
                thrown: favoriteGet('thrown').length,
                book: favoriteGet('book').length,
                continuesMovie: (function () {
                    try { return Lampa.Favorite && typeof Lampa.Favorite.continues === 'function' ? asArray(Lampa.Favorite.continues('movie')).length : -1; }
                    catch (error) { return -1; }
                })(),
                continuesTv: (function () {
                    try { return Lampa.Favorite && typeof Lampa.Favorite.continues === 'function' ? asArray(Lampa.Favorite.continues('tv')).length : -1; }
                    catch (error) { return -1; }
                })(),
                timetableRecently: (function () {
                    try { return Lampa.TimeTable && typeof Lampa.TimeTable.recently === 'function' ? asArray(Lampa.TimeTable.recently()).length : -1; }
                    catch (error) { return -1; }
                })()
            },
            capabilities: {
                contentRows: !!(Lampa.ContentRows && typeof Lampa.ContentRows.add === 'function'),
                activityRefresh: !!(Lampa.Activity && typeof Lampa.Activity.refresh === 'function'),
                tmdbGet: !!(Lampa.Api && Lampa.Api.sources && Lampa.Api.sources.tmdb && typeof Lampa.Api.sources.tmdb.get === 'function')
            },
            runtime: clone(homeDiagnosticsState),
            renderedTitles: renderedHomeTitles(),
            likelyReasons: []
        };

        if (!report.personalEnabled) report.likelyReasons.push('Персональные функции выключены.');
        if (!report.contentRowEnabled) report.likelyReasons.push('Канал content_rows_lpersonal_home выключен.');
        if (!report.rowRegistered) report.likelyReasons.push('Строка не зарегистрирована в Lampa.ContentRows.');
        if (report.activeComponent === 'main' && report.runtime.calls === 0) report.likelyReasons.push('Главная была построена до регистрации строки; требуется обновление активности.');
        if (report.runtime.calls > 0 && !report.runtime.lastCallbacks.length) report.likelyReasons.push('ContentRows вызвал плагин, но ни один блок не вернул карточки.');
        if (!report.capabilities.tmdbGet && report.rowCounts.recommendations === 0) report.likelyReasons.push('TMDB source.get недоступен, начальную подборку загрузить нельзя.');
        if (report.enabledBlocks.continue && report.rowCounts.continue === 0 && report.lampaCounts.continuesMovie <= 0 && report.lampaCounts.continuesTv <= 0) report.likelyReasons.push('Для «Продолжить просмотр» Lampa не вернула ни одного элемента continues.');
        if (report.enabledBlocks.recent && report.rowCounts.recent === 0 && report.profileCounts.recent === 0) report.likelyReasons.push('Для «Недавно открытые» локальная история открытий пока пуста.');
        if (report.enabledBlocks.new_episodes && report.rowCounts.new_episodes === 0 && report.lampaCounts.timetableRecently <= 0) report.likelyReasons.push('TimeTable не вернул новые серии.');
        if (report.enabledBlocks.watchlist && report.rowCounts.watchlist === 0 && report.profileCounts.watchlist === 0 && report.lampaCounts.book === 0) report.likelyReasons.push('Список ожидания и штатные закладки Lampa пусты.');
        if (report.runtime.coldStartError) report.likelyReasons.push('Ошибка начальной подборки: ' + report.runtime.coldStartError);
        if (report.runtime.calls > 0 && report.runtime.lastCallbacks.length && !report.renderedTitles.some(function (title) {
            return Object.keys(HOME_TITLES).some(function (id) { return title === HOME_TITLES[id]; }) || title === 'Подборка для начала' || title === 'Возможно, вам понравится';
        })) report.likelyReasons.push('Callback сформирован, но персональная строка отсутствует в DOM.');
        if (!report.likelyReasons.length) report.likelyReasons.push('Явная блокирующая причина не найдена; нужен этот отчёт после открытия главной.');
        return report;
    }

    function copyDiagnosticReport(report) {
        var text = JSON.stringify(report, null, 2);
        try {
            if (Lampa.Utils && typeof Lampa.Utils.copyTextToClipboard === 'function') {
                Lampa.Utils.copyTextToClipboard(text, function () { notify('Отчёт скопирован'); }, function () { notify('Не удалось скопировать отчёт'); });
                return;
            }
        } catch (error) {}
        console.log(text);
        notify('Отчёт выведен в консоль');
    }

    function runHomeDiagnostics(showUi) {
        var report = collectHomeDiagnostics();
        try {
            console.group('[Lampa Personal] Home diagnostics');
            console.log(report);
            if (console.table) console.table(report.rowCounts);
            console.groupEnd();
        } catch (error) {}

        if (showUi === false) return report;
        var controller = controllerName();
        var items = [
            { title: 'Скопировать полный отчёт', action: 'copy' },
            { title: 'Обновить главную сейчас', action: 'refresh' },
            { title: 'Компонент: ' + (report.activeComponent || 'не определён'), info: true },
            { title: 'Вызовов ContentRows: ' + report.runtime.calls, info: true },
            { title: 'Сформировано блоков: ' + report.runtime.lastCallbacks.join(', '), info: true },
            { title: 'Причина: ' + report.likelyReasons.join(' '), info: true }
        ];
        selectShow({
            title: 'Диагностика персональной главной',
            items: items,
            onSelect: function (item) {
                if (item.action === 'copy') copyDiagnosticReport(report);
                if (item.action === 'refresh') scheduleHomeRefresh('manual-diagnostics');
                restoreController(controller);
            },
            onBack: function () { restoreController(controller); }
        });
        return report;
    }

    function scheduleHomeRefresh(reason) {
        clearTimeout(refreshTimer);
        homeDiagnosticsState.refreshRequests += 1;
        homeDiagnosticsState.lastRefreshAt = now();
        homeDiagnosticsState.lastRefreshReason = reason || 'update';
        refreshTimer = setTimeout(function () {
            try {
                if (!window.Lampa || !Lampa.Activity || typeof Lampa.Activity.active !== 'function') return;
                var active = Lampa.Activity.active();
                if (active && active.component === 'main' && typeof Lampa.Activity.refresh === 'function') Lampa.Activity.refresh(false);
            } catch (error) {
                homeDiagnosticsState.lastError = error && (error.message || String(error)) || 'refresh failed';
                console.warn('[Lampa Personal] home refresh failed:', error);
            }
        }, 350);
    }

    function featureWeights() {
        return { genres: {}, actors: {}, directors: {}, countries: {}, runtimes: [], timeGenres: {} };
    }

    function addWeight(map, key, value) {
        if (!key) return;
        map[String(key)] = numberValue(map[String(key)], 0) + value;
    }

    function buildPreferenceModel() {
        var model = featureWeights();
        Object.keys(profile.history).forEach(function (canonical) {
            var history = profile.history[canonical];
            if (!history || history.influence === false || profile.exclusions.ignoredInfluence[canonical]) return;
            var metadata = profile.metadata[canonical] || {};
            var rating = numberValue(profile.ratings[canonical] && profile.ratings[canonical].value, 0);
            var positive = rating ? Math.max(-2, (rating - 5.5) / 2) : history.liked ? 1.2 : history.finished ? 0.8 : 0.35;
            if (profile.exclusions.disliked[canonical]) positive -= 2;
            if (!positive) return;

            asArray(metadata.genres).forEach(function (genre) { addWeight(model.genres, genre.id, positive); });
            asArray(metadata.cast).slice(0, 8).forEach(function (person) { addWeight(model.actors, person.id, positive * 0.52); });
            asArray(metadata.directors).forEach(function (person) { addWeight(model.directors, person.id, positive * 0.78); });
            asArray(metadata.countries).forEach(function (country) { addWeight(model.countries, country, positive * 0.38); });
            if (metadata.runtimeMinutes) model.runtimes.push({ value: metadata.runtimeMinutes, weight: Math.max(0.1, positive) });

            Object.keys(history.timeBuckets || {}).forEach(function (bucket) {
                model.timeGenres[bucket] = model.timeGenres[bucket] || {};
                asArray(metadata.genres).forEach(function (genre) {
                    addWeight(model.timeGenres[bucket], genre.id, positive * numberValue(history.timeBuckets[bucket], 1) * 0.12);
                });
            });
        });
        return model;
    }

    function weightedRuntime(model) {
        var total = 0;
        var weights = 0;
        model.runtimes.forEach(function (item) {
            total += item.value * item.weight;
            weights += item.weight;
        });
        return weights ? total / weights : 0;
    }

    function excludedByMetadata(canonical, metadata) {
        if (profile.exclusions.content[canonical]) return true;
        if (profile.exclusions.disliked[canonical]) return false;
        var blocked = false;
        asArray(metadata.cast).forEach(function (person) { if (profile.exclusions.actors[String(person.id)]) blocked = true; });
        asArray(metadata.directors).forEach(function (person) { if (profile.exclusions.directors[String(person.id)]) blocked = true; });
        asArray(metadata.countries).forEach(function (country) { if (profile.exclusions.countries[String(country)]) blocked = true; });
        return blocked;
    }

    function reasonTitle(canonical) {
        var card = profile.cards[canonical] || {};
        return normalizeText(card.title || card.name || card.original_title || card.original_name || 'этот фильм');
    }

    function scoreCandidate(canonical, model) {
        var card = profile.cards[canonical];
        var metadata = profile.metadata[canonical] || {};
        if (!card || !card.id || excludedByMetadata(canonical, metadata)) return null;
        if (profile.history[canonical] && (profile.history[canonical].finished || numberValue(profile.history[canonical].openCount, 0) > 0)) return null;
        if (profile.collections.watchlist.indexOf(canonical) >= 0) return null;

        var score = 0;
        var factors = [];
        var seedTitles = [];
        var candidate = profile.candidates[canonical] || {};
        asArray(candidate.seedIds).forEach(function (seedId) {
            var rating = numberValue(profile.ratings[seedId] && profile.ratings[seedId].value, 0);
            var history = profile.history[seedId] || {};
            if (rating >= 7 || history.finished || history.liked) seedTitles.push(reasonTitle(seedId));
        });
        seedTitles = unique(seedTitles).slice(0, 3);
        if (seedTitles.length) {
            score += 3.4 + seedTitles.length * 0.45;
            factors.push({ type: 'similar_to', weight: 3.4, values: seedTitles });
        }

        var genreNames = [];
        asArray(asArray(metadata.genres).length ? metadata.genres : normalizeGenres(card.genre_ids)).forEach(function (genre) {
            var weight = numberValue(model.genres[String(genre.id)], 0) + numberValue(profile.exclusions.genreWeights[String(genre.id)], 0);
            if (weight > 0) {
                score += Math.min(2.4, weight * 0.42);
                genreNames.push(genre.name || genre.id);
            } else if (weight < 0) score += Math.max(-2.2, weight * 0.48);
        });
        if (genreNames.length) factors.push({ type: 'genre', weight: 2.2, values: unique(genreNames).slice(0, 2) });

        var actorNames = [];
        asArray(metadata.cast).slice(0, 8).forEach(function (person) {
            var weight = numberValue(model.actors[String(person.id)], 0);
            if (weight > 0) {
                score += Math.min(1.6, weight * 0.34);
                actorNames.push(person.name);
            }
        });
        if (actorNames.length) factors.push({ type: 'actor', weight: 1.55, values: unique(actorNames).slice(0, 2) });

        var directorNames = [];
        asArray(metadata.directors).forEach(function (person) {
            var weight = numberValue(model.directors[String(person.id)], 0);
            if (weight > 0) {
                score += Math.min(2, weight * 0.48);
                directorNames.push(person.name);
            }
        });
        if (directorNames.length) factors.push({ type: 'director', weight: 1.9, values: unique(directorNames).slice(0, 2) });

        var countryNames = [];
        asArray(metadata.countries).forEach(function (country) {
            var weight = numberValue(model.countries[String(country)], 0);
            if (weight > 0) {
                score += Math.min(1.15, weight * 0.28);
                countryNames.push(country);
            }
        });
        if (countryNames.length) factors.push({ type: 'country', weight: 1.05, values: unique(countryNames).slice(0, 2) });

        var preferredRuntime = weightedRuntime(model);
        if (preferredRuntime && metadata.runtimeMinutes) {
            var difference = Math.abs(preferredRuntime - metadata.runtimeMinutes);
            var runtimeScore = Math.max(0, 1.3 - difference / 55);
            score += runtimeScore;
            if (runtimeScore > 0.65) factors.push({ type: 'runtime', weight: runtimeScore, values: [Math.round(metadata.runtimeMinutes) + ' мин'] });
        }

        var bucket = timeBucket(now());
        var bucketGenres = model.timeGenres[bucket] || {};
        var timeScore = 0;
        asArray(metadata.genres).forEach(function (genre) { timeScore += Math.max(0, numberValue(bucketGenres[String(genre.id)], 0)); });
        if (timeScore > 0) {
            score += Math.min(1.2, timeScore * 0.22);
            factors.push({ type: 'time', weight: Math.min(1.2, timeScore * 0.22), values: [bucket] });
        }

        var tmdbRating = numberValue(metadata.ratings && metadata.ratings.tmdb, numberValue(card.vote_average, 0));
        var votes = numberValue(card.vote_count, 0);
        if (tmdbRating) score += Math.max(0, (tmdbRating - 5.5) * 0.26);
        if (votes) score += Math.min(0.8, Math.log(votes + 1) / 12);
        if (profile.exclusions.disliked[canonical]) score -= 4;

        factors.sort(function (a, b) { return b.weight - a.weight; });
        return { id: canonical, score: Math.round(score * 100) / 100, factors: factors, explanation: explainFactors(factors) };
    }

    function explainFactors(factors) {
        if (!factors || !factors.length) return 'Подобрано с учётом вашей активности и популярности.';
        var first = factors[0];
        if (first.type === 'similar_to') return 'Рекомендуем, потому что вам понравились «' + first.values.join('», «') + '».';
        if (first.type === 'director') return 'Рекомендуем из-за режиссёра: ' + first.values.join(', ') + '.';
        if (first.type === 'actor') return 'Рекомендуем из-за актёрского состава: ' + first.values.join(', ') + '.';
        if (first.type === 'genre') return 'Рекомендуем по вашим предпочтениям в жанрах: ' + first.values.join(', ') + '.';
        if (first.type === 'country') return 'Подобрано по предпочитаемым странам: ' + first.values.join(', ') + '.';
        if (first.type === 'runtime') return 'Подходит по привычной для вас продолжительности.';
        return 'Подобрано с учётом вашей активности и популярности.';
    }

    function collectBuiltInCandidates() {
        try {
            if (!window.Lampa || !Lampa.Recomends || typeof Lampa.Recomends.get !== 'function') return;
            asArray(Lampa.Recomends.get('movie')).concat(asArray(Lampa.Recomends.get('tv'))).forEach(function (card) {
                if (!card || !card.id) return;
                var canonical = observeIdentity(card, card);
                var candidate = profile.candidates[canonical] || { id: canonical, seedIds: [], sourceKinds: [], updatedAt: 0 };
                candidate.sourceKinds = unique(asArray(candidate.sourceKinds).concat(['lampa']));
                candidate.updatedAt = now();
                profile.candidates[canonical] = candidate;
            });
        } catch (error) {}
    }

    function recomputeRecommendations(quiet) {
        collectBuiltInCandidates();
        if (!hasPersonalSignals()) {
            profile.recommendations = { items: [], updatedAt: now() };
            saveProfile('recommendations-cold-start', !!quiet);
            scheduleHomeRefresh();
            return [];
        }
        var model = buildPreferenceModel();
        var items = [];
        Object.keys(profile.candidates).forEach(function (canonical) {
            var scored = scoreCandidate(canonical, model);
            if (scored && scored.score > 0.45) items.push(scored);
        });
        items.sort(function (a, b) { return b.score - a.score; });
        profile.recommendations = { items: items.slice(0, MAX_RECOMMENDATIONS), updatedAt: now() };
        saveProfile('recommendations', !!quiet);
        scheduleHomeRefresh();
        return profile.recommendations.items;
    }

    function scheduleRecompute() {
        clearTimeout(recomputeTimer);
        recomputeTimer = setTimeout(function () { recomputeRecommendations(true); }, 320);
    }

    function findRecommendation(canonical) {
        var items = asArray(profile.recommendations.items);
        var i;
        for (i = 0; i < items.length; i += 1) if (items[i] && items[i].id === canonical) return items[i];
        return null;
    }

    function enrichRecommendationCandidates(limit, done) {
        if (enrichmentRunning) {
            if (done) done(false);
            return;
        }
        if (!window.Lampa || !Lampa.Api || typeof Lampa.Api.full !== 'function') {
            if (done) done();
            return;
        }
        enrichmentRunning = true;
        var ids = Object.keys(profile.candidates).filter(function (canonical) {
            var metadata = profile.metadata[canonical] || {};
            return profile.cards[canonical] && (!metadata.genres || !metadata.genres.length || !metadata.updatedAt || now() - metadata.updatedAt > 1000 * 60 * 60 * 24 * 30);
        }).slice(0, limit || 8);
        var index = 0;

        function next() {
            if (index >= ids.length) {
                enrichmentRunning = false;
                recomputeRecommendations(false);
                if (done) done();
                return;
            }
            var canonical = ids[index++];
            var card = profile.cards[canonical];
            if (!card || !card.id) return next();
            try {
                Lampa.Api.full({ id: card.id, source: card.source || 'tmdb', method: mediaTypeOf(card), card: card }, function (data) {
                    try {
                        var updated = observeIdentity(card, data && data.movie);
                        updateMetadataFromFull(updated, card, data || {});
                    } catch (error) {
                        console.warn('[Lampa Personal] candidate enrichment parse failed:', error);
                    }
                    next();
                }, next);
            } catch (error) {
                next();
            }
        }
        next();
    }

    function ratingLabel(value) {
        return value === null || value === undefined || !isFinite(value) ? '' : String(Math.round(value * 10) / 10);
    }

    function formatRuntime(minutes) {
        minutes = Math.round(numberValue(minutes, 0));
        if (!minutes) return '';
        var hours = Math.floor(minutes / 60);
        var rest = minutes % 60;
        return hours ? hours + ' ч ' + (rest ? rest + ' мин' : '') : rest + ' мин';
    }

    function formatNextEpisode(nextEpisode) {
        if (!nextEpisode || !nextEpisode.air_date) return '';
        var parts = [];
        if (nextEpisode.season_number !== undefined) parts.push('S' + nextEpisode.season_number);
        if (nextEpisode.episode_number !== undefined) parts.push('E' + nextEpisode.episode_number);
        parts.push(nextEpisode.air_date);
        return parts.join(' · ');
    }

    function panelTarget(body) {
        var root = body && body.jquery ? body : body ? window.$ && $(body) : null;
        if (!root || !root.find) return null;
        var afterSelectors = ['.full-start-new__description', '.full-start__description'];
        var appendSelectors = ['.full-start-new__right', '.full-start__right', '.full-start-new__body', '.full-start__body', '.full-start-new'];
        var i;
        for (i = 0; i < afterSelectors.length; i += 1) {
            var after = root.find(afterSelectors[i]).first();
            if (after && after.length) return { root: root, element: after, mode: 'after' };
        }
        for (i = 0; i < appendSelectors.length; i += 1) {
            var append = root.find(appendSelectors[i]).first();
            if (append && append.length) return { root: root, element: append, mode: 'append' };
        }
        return { root: root, element: root, mode: 'append' };
    }

    function renderFullPanel(canonical, body) {
        if (!window.$ || !canonical) return;
        var target = panelTarget(body || (Lampa.Activity && Lampa.Activity.active && Lampa.Activity.active().activity && Lampa.Activity.active().activity.render && Lampa.Activity.active().activity.render()));
        if (!target || !target.element || !target.element.length) return;
        target.root.find('.lpersonal-insight').remove();
        if (!boolValue(storageField(SETTINGS.cardPanel, true), true)) return;

        var metadata = profile.metadata[canonical] || {};
        var ratings = metadata.ratings || {};
        var recommendation = findRecommendation(canonical);
        var userRating = profile.ratings[canonical] && profile.ratings[canonical].value;
        var facts = [];
        var tmdb = ratingLabel(ratings.tmdb);
        var imdb = ratingLabel(ratings.imdb);
        var kp = ratingLabel(ratings.kinopoisk);

        if (tmdb) facts.push('<span class="lpersonal-insight__fact">TMDB <strong>' + escapeHtml(tmdb) + '</strong></span>');
        if (imdb) facts.push('<span class="lpersonal-insight__fact">IMDb <strong>' + escapeHtml(imdb) + '</strong></span>');
        if (kp) facts.push('<span class="lpersonal-insight__fact">КП <strong>' + escapeHtml(kp) + '</strong></span>');
        if (metadata.runtimeMinutes) facts.push('<span class="lpersonal-insight__fact">' + escapeHtml(formatRuntime(metadata.runtimeMinutes)) + '</span>');
        if (metadata.nextEpisode) facts.push('<span class="lpersonal-insight__fact">Следующая: <strong>' + escapeHtml(formatNextEpisode(metadata.nextEpisode)) + '</strong></span>');
        if (userRating) facts.push('<span class="lpersonal-insight__fact">Ваша оценка <strong>' + escapeHtml(userRating) + '/10</strong></span>');

        var html = $('<div class="lpersonal-insight"></div>');
        if (facts.length) html.append('<div class="lpersonal-insight__facts">' + facts.join('') + '</div>');
        if (recommendation && recommendation.explanation) html.append('<div class="lpersonal-insight__reason">' + escapeHtml(recommendation.explanation) + '</div>');

        var actions = $('<div class="lpersonal-insight__actions"></div>');
        var rate = $('<div class="lpersonal-insight__button selector">' + (userRating ? 'Изменить оценку' : 'Оценить') + '</div>');
        rate.on('click hover:enter', function () { openRatingSelect(canonical, body); });
        actions.append(rate);

        var personal = $('<div class="lpersonal-insight__button selector">Настроить рекомендации</div>');
        personal.on('click hover:enter', function () { openPersonalActions(canonical, body); });
        actions.append(personal);
        html.append(actions);

        if (target.mode === 'after') target.element.after(html);
        else target.element.append(html);
    }

    function selectShow(options) {
        try {
            if (window.Lampa && Lampa.Select && typeof Lampa.Select.show === 'function') {
                Lampa.Select.show(options);
                return true;
            }
        } catch (error) { console.error(error); }
        return false;
    }

    function restoreController(name) {
        try { if (name && Lampa.Controller && typeof Lampa.Controller.toggle === 'function') Lampa.Controller.toggle(name); } catch (error) {}
    }

    function controllerName() {
        try {
            var enabled = Lampa.Controller && Lampa.Controller.enabled && Lampa.Controller.enabled();
            return enabled && enabled.name;
        } catch (error) { return ''; }
    }

    function openRatingSelect(canonical, body) {
        var controller = controllerName();
        var items = [];
        var i;
        for (i = 10; i >= 1; i -= 1) items.push({ title: i + ' / 10', value: i });
        selectShow({
            title: 'Ваша оценка',
            items: items,
            onSelect: function (item) {
                setRating(canonical, item.value);
                restoreController(controller);
                renderFullPanel(canonical, body);
            },
            onBack: function () { restoreController(controller); }
        });
    }

    function openExclusionSelect(canonical, body) {
        var metadata = profile.metadata[canonical] || {};
        var items = [];
        asArray(metadata.genres).slice(0, 8).forEach(function (genre) { items.push({ title: 'Меньше жанра: ' + genre.name, kind: 'genre', value: genre }); });
        asArray(metadata.cast).slice(0, 8).forEach(function (person) { items.push({ title: 'Исключить актёра: ' + person.name, kind: 'actors', value: person }); });
        asArray(metadata.directors).slice(0, 5).forEach(function (person) { items.push({ title: 'Исключить режиссёра: ' + person.name, kind: 'directors', value: person }); });
        asArray(metadata.countries).slice(0, 6).forEach(function (country) { items.push({ title: 'Исключить страну: ' + country, kind: 'countries', value: { id: country, name: country } }); });
        if (!items.length) return notify('Нет данных для точечного исключения');
        var controller = controllerName();
        selectShow({
            title: 'Настроить рекомендации',
            items: items,
            onSelect: function (item) {
                if (item.kind === 'genre') reduceGenre(item.value);
                else addHardExclusion(item.kind, item.value.id, item.value.name);
                restoreController(controller);
                renderFullPanel(canonical, body);
                notify('Настройка рекомендаций сохранена');
            },
            onBack: function () { restoreController(controller); }
        });
    }

    function openPersonalActions(canonical, body) {
        var history = profile.history[canonical] || {};
        var controller = controllerName();
        var items = [
            { title: 'Поставить оценку', action: 'rate' },
            { title: profile.exclusions.disliked[canonical] ? 'Вернуть в рекомендации' : 'Рекомендация не нравится', action: 'dislike' },
            { title: profile.exclusions.content[canonical] ? 'Показывать этот фильм' : 'Скрыть этот фильм', action: 'hide' },
            { title: history.influence === false ? 'Учитывать в рекомендациях' : 'Не учитывать этот фильм', action: 'influence' },
            { title: 'Исключить жанр, актёра, режиссёра или страну', action: 'exclude' },
            { title: 'Почему это рекомендовано', action: 'why' }
        ];
        selectShow({
            title: reasonTitle(canonical),
            items: items,
            onSelect: function (item) {
                if (item.action === 'rate') return openRatingSelect(canonical, body);
                if (item.action === 'dislike') setDisliked(canonical, !profile.exclusions.disliked[canonical]);
                if (item.action === 'hide') setContentExcluded(canonical, !profile.exclusions.content[canonical]);
                if (item.action === 'influence') setInfluence(canonical, history.influence === false);
                if (item.action === 'exclude') return openExclusionSelect(canonical, body);
                if (item.action === 'why') {
                    var recommendation = findRecommendation(canonical);
                    notify(recommendation ? recommendation.explanation : 'Карточка не входит в текущий список рекомендаций');
                }
                restoreController(controller);
                renderFullPanel(canonical, body);
            },
            onBack: function () { restoreController(controller); }
        });
    }

    function exclusionItems() {
        var items = [];
        Object.keys(profile.exclusions.content).forEach(function (id) {
            items.push({ title: 'Фильм: ' + reasonTitle(id), kind: 'content', value: id });
        });
        Object.keys(profile.exclusions.actors).forEach(function (id) {
            items.push({ title: 'Актёр: ' + profile.exclusions.actors[id], kind: 'actors', value: id });
        });
        Object.keys(profile.exclusions.directors).forEach(function (id) {
            items.push({ title: 'Режиссёр: ' + profile.exclusions.directors[id], kind: 'directors', value: id });
        });
        Object.keys(profile.exclusions.countries).forEach(function (id) {
            items.push({ title: 'Страна: ' + profile.exclusions.countries[id], kind: 'countries', value: id });
        });
        Object.keys(profile.exclusions.genreWeights).forEach(function (id) {
            if (numberValue(profile.exclusions.genreWeights[id], 0) < 0) items.push({ title: 'Понижен вес жанра: ' + id, kind: 'genreWeights', value: id });
        });
        Object.keys(profile.exclusions.ignoredInfluence).forEach(function (id) {
            items.push({ title: 'Не влияет: ' + reasonTitle(id), kind: 'ignoredInfluence', value: id });
        });
        return items;
    }

    function openExclusionsManager() {
        var items = exclusionItems();
        if (!items.length) return notify('Список исключений пуст');
        var controller = controllerName();
        selectShow({
            title: 'Удалить исключение',
            items: items,
            onSelect: function (item) {
                if (item.kind === 'content') delete profile.exclusions.content[item.value];
                else if (item.kind === 'ignoredInfluence') {
                    delete profile.exclusions.ignoredInfluence[item.value];
                    if (profile.history[item.value]) profile.history[item.value].influence = true;
                } else if (profile.exclusions[item.kind]) delete profile.exclusions[item.kind][item.value];
                saveProfile('remove-exclusion');
                recomputeRecommendations(true);
                scheduleHomeRefresh();
                notify('Исключение удалено');
                restoreController(controller);
            },
            onBack: function () { restoreController(controller); }
        });
    }

    function syncFavoriteState() {
        var types = ['history', 'book', 'viewed', 'thrown', 'like', 'wath', 'continued'];
        types.forEach(function (type) {
            favoriteGet(type).forEach(function (card) {
                var canonical = observeIdentity(card, card);
                if (type === 'book') {
                    if (profile.collections.watchlist.indexOf(canonical) < 0) profile.collections.watchlist.push(canonical);
                }
                var history = profile.history[canonical] || { firstOpenedAt: now(), openCount: 0, influence: true, timeBuckets: {} };
                if (type === 'history') history.lastOpenedAt = history.lastOpenedAt || now();
                if (type === 'viewed') history.finished = true;
                if (type === 'thrown') { history.status = 'thrown'; history.influence = false; }
                if (type === 'like') history.liked = true;
                if (type === 'continued') history.finished = false;
                history.updatedAt = now();
                profile.history[canonical] = history;
            });
        });
        saveProfile('favorite-sync', true);
    }

    function onFavoriteChanged(event) {
        if (!event || event.target !== 'favorite' || !event.card) return;
        var canonical = observeIdentity(event.card, event.card);
        var method = event.method;
        var type = event.type;
        var added = method === 'add' || method === 'added';
        if (type === 'book') {
            if (added) moveToFront(profile.collections.watchlist, canonical, 220);
            else removeFromArray(profile.collections.watchlist, canonical);
        }
        if (type === 'history' && added) recordOpened(canonical, 'favorite-history');
        if (type === 'viewed') setFinished(canonical, added);
        if (type === 'thrown' && added) {
            var history = profile.history[canonical] || { firstOpenedAt: now(), openCount: 0, timeBuckets: {} };
            history.status = 'thrown';
            history.influence = false;
            profile.history[canonical] = history;
        }
        if (type === 'like') {
            var liked = profile.history[canonical] || { firstOpenedAt: now(), openCount: 0, influence: true, timeBuckets: {} };
            liked.liked = added;
            profile.history[canonical] = liked;
        }
        saveProfile('favorite-change');
        scheduleRecompute();
        scheduleHomeRefresh();
    }

    function timelineHash(value) {
        try {
            if (window.Lampa && Lampa.Utils && typeof Lampa.Utils.hash === 'function') return String(Lampa.Utils.hash(String(value || '')));
        } catch (error) {}
        return '';
    }

    function timelineEpisodes(canonical, card) {
        var metadata = profile.metadata[canonical] || {};
        var episodes = asArray(metadata.knownEpisodes).slice();
        try {
            if (window.Lampa && Lampa.TimeTable && typeof Lampa.TimeTable.get === 'function') {
                episodes = episodes.concat(asArray(Lampa.TimeTable.get(card)));
            }
        } catch (error) {}
        var seen = {};
        return episodes.filter(function (episode) {
            if (!episode || episode.season_number === undefined || episode.episode_number === undefined) return false;
            var key = episode.season_number + ':' + episode.episode_number;
            if (seen[key]) return false;
            seen[key] = true;
            return true;
        });
    }

    function resolveTimelineTarget(hash) {
        hash = String(hash === undefined || hash === null ? '' : hash);
        if (!hash) return null;
        if (timelineTargetCache[hash]) return timelineTargetCache[hash];

        var order = [];
        if (currentCanonical) order.push(currentCanonical);
        Object.keys(profile.cards).forEach(function (id) { if (order.indexOf(id) < 0) order.push(id); });
        var i;
        for (i = 0; i < order.length; i += 1) {
            var canonical = order[i];
            var card = profile.cards[canonical] || {};
            var original = card.original_title || card.title;
            if (original && timelineHash(original) === hash) {
                timelineTargetCache[hash] = { canonical: canonical, type: 'movie' };
                return timelineTargetCache[hash];
            }
            var showName = card.original_name || card.name;
            if (!showName) continue;
            var episodes = timelineEpisodes(canonical, card);
            var j;
            for (j = 0; j < episodes.length; j += 1) {
                var episode = episodes[j];
                var signature = [episode.season_number, episode.season_number > 10 ? ':' : '', episode.episode_number, showName].join('');
                if (timelineHash(signature) === hash) {
                    timelineTargetCache[hash] = {
                        canonical: canonical,
                        type: 'episode',
                        season: episode.season_number,
                        episode: episode.episode_number,
                        name: normalizeText(episode.name || '')
                    };
                    return timelineTargetCache[hash];
                }
            }
        }
        return null;
    }

    function flushTimelineSave() {
        if (!timelineSaveTimer) return;
        clearTimeout(timelineSaveTimer);
        timelineSaveTimer = 0;
        if (saveProfile('timeline', true)) scheduleHomeRefresh('timeline');
    }

    function scheduleTimelineSave() {
        clearTimeout(timelineSaveTimer);
        timelineSaveTimer = setTimeout(flushTimelineSave, 12000);
    }

    function onTimelineUpdate(event) {
        if (!event) return;
        var payload = event.data && event.data.road ? event.data : event;
        var road = payload.road || payload;
        var target = resolveTimelineTarget(payload.hash !== undefined ? payload.hash : event.hash);
        if (!target) return;
        var position = numberValue(road.time !== undefined ? road.time : road.position, NaN);
        var duration = numberValue(road.duration, NaN);
        var percent = numberValue(road.percent !== undefined ? road.percent : road.procent, NaN);
        if (!isFinite(percent) && isFinite(position) && isFinite(duration) && duration > 0) percent = position / duration * 100;

        if (target.type === 'episode') {
            var key = episodeHistoryKey(target.canonical, target.season, target.episode);
            var episodeItem = profile.episodeHistory[key] || {
                showCanonical: target.canonical,
                season: target.season,
                episode: target.episode,
                name: target.name || ''
            };
            if (isFinite(position) && position >= 0) episodeItem.position = position;
            if (isFinite(duration) && duration > 0) episodeItem.duration = duration;
            if (isFinite(percent)) {
                episodeItem.percent = Math.max(0, Math.min(100, percent));
                episodeItem.finished = episodeItem.percent >= 92;
            }
            episodeItem.updatedAt = now();
            profile.episodeHistory[key] = episodeItem;
            var showHistory = profile.history[target.canonical] || { firstOpenedAt: now(), openCount: 0, influence: true, timeBuckets: {} };
            showHistory.lastOpenedAt = now();
            showHistory.updatedAt = now();
            showHistory.lastEpisode = { season: target.season, episode: target.episode, name: target.name || '' };
            showHistory.finished = false;
            profile.history[target.canonical] = showHistory;
        } else {
            var history = profile.history[target.canonical] || { firstOpenedAt: now(), openCount: 0, influence: true, timeBuckets: {} };
            if (isFinite(position) && position >= 0) history.position = position;
            if (isFinite(duration) && duration > 0) history.duration = duration;
            if (isFinite(percent)) {
                history.percent = Math.max(0, Math.min(100, percent));
                if (history.percent >= 92) history.finished = true;
            }
            history.updatedAt = now();
            profile.history[target.canonical] = history;
        }
        scheduleTimelineSave();
    }

    function commentsHidden() {
        return boolValue(storageField(SETTINGS.hideComments, true), true);
    }

    function removeBuiltDiscuss(event) {
        if (!event || event.name !== 'discuss' || !commentsHidden()) return;
        try {
            var rendered = event.item && typeof event.item.render === 'function' ? event.item.render(true) : event.item && event.item.html;
            if (rendered && rendered.remove) rendered.remove();
            else if (rendered && rendered.parentNode) rendered.parentNode.removeChild(rendered);
        } catch (error) {
            console.warn('[Lampa Personal] discuss fallback removal failed:', error);
        }
    }

    function onFullEvent(event) {
        if (!event) return;
        if (event.type === 'build') removeBuiltDiscuss(event);
        if (!event.data) return;

        // Lampa 3.2.x добавляет раздел обсуждений после события full/start.
        // Обнуляем payload до сборки rows, чтобы раздел не создавался и не попадал в D-pad навигацию.
        if (event.type === 'start' && commentsHidden() && event.data.discuss) event.data.discuss = null;

        var movie = event.data.movie || event.object && event.object.card;
        if (!movie) return;
        var canonical = observeIdentity(event.object && event.object.card || movie, movie);
        currentCanonical = canonical;

        if (event.type === 'start') {
            dedupeFullRelations(canonical, event.data);
            recordOpened(canonical, 'full');
        }
        if (event.type === 'complite') {
            canonical = updateMetadataFromFull(canonical, event.object && event.object.card || movie, event.data);
            recordOpened(canonical, 'full-complete');
            renderFullPanel(canonical, event.body);
            saveProfile('full-metadata');
            recomputeRecommendations(true);
        }
    }

    function confirmAction(title, action, actionTitle) {
        var controller = controllerName();
        selectShow({
            title: title,
            items: [
                { title: 'Отмена', confirm: false },
                { title: actionTitle || 'Удалить', confirm: true }
            ],
            onSelect: function (item) {
                if (item.confirm) action();
                restoreController(controller);
            },
            onBack: function () { restoreController(controller); }
        });
    }

    function clearHistory() {
        timelineTargetCache = {};
        profile.history = {};
        profile.episodeHistory = {};
        profile.recent = [];
        profile.recommendations = { items: [], updatedAt: 0 };
        saveProfile('clear-history');
        scheduleHomeRefresh();
        notify('Локальная история очищена');
    }

    function clearRecommendations() {
        profile.candidates = {};
        profile.recommendations = { items: [], updatedAt: 0 };
        profile.exclusions.disliked = {};
        saveProfile('clear-recommendations');
        scheduleHomeRefresh();
        notify('Рекомендации очищены');
    }

    function clearAllPersonalData() {
        timelineTargetCache = {};
        var interfaceSettings = clone(profile.interface || {});
        profile = defaultProfile();
        profile.interface = interfaceSettings;
        saveProfile('clear-all');
        scheduleHomeRefresh();
        notify('Все локальные данные Lampa Personal удалены');
    }

    function injectStyle() {
        var old = document.getElementById(STYLE_ID);
        if (old) old.remove();
        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    function addSettings() {
        if (!window.Lampa || !Lampa.SettingsApi) return;
        var icon = '<svg viewBox="0 0 32 32" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 5.5c4.8 0 8.7 3.9 8.7 8.7 0 6.5-8.7 12.3-8.7 12.3S7.3 20.7 7.3 14.2C7.3 9.4 11.2 5.5 16 5.5Z" stroke="currentColor" stroke-width="2"/><path d="M12 14.5l2.6 2.6L20.5 11" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        try {
            Lampa.SettingsApi.addComponent({ component: COMPONENT_ID, name: 'Для вас', icon: icon });
            Lampa.SettingsApi.addParam({
                component: COMPONENT_ID,
                param: { name: SETTINGS.enabled, type: 'trigger', default: true },
                field: { name: 'Персональная главная', description: 'Продолжение просмотра, новые серии, рекомендации и ваш список.' },
                onChange: function () { syncHomeSettingsToProfile(); scheduleHomeRefresh('personal-enabled'); }
            });
            Lampa.SettingsApi.addParam({
                component: COMPONENT_ID,
                param: { name: SETTINGS.homeMode, type: 'select', values: { focused: 'Основная', minimal: 'Минимальная' }, default: 'focused' },
                field: { name: 'Набор блоков', description: 'Минимальный режим оставляет только «Продолжить» и «Для вас».' },
                onChange: function () { syncHomeSettingsToProfile(); scheduleHomeRefresh('home-mode'); }
            });
            Lampa.SettingsApi.addParam({
                component: COMPONENT_ID,
                param: { name: SETTINGS.cardPanel, type: 'trigger', default: true },
                field: { name: 'Данные в карточке', description: 'Рейтинги, следующая серия, ваша оценка и причина рекомендации.' },
                onChange: function () {
                    try {
                        var active = Lampa.Activity && Lampa.Activity.active && Lampa.Activity.active();
                        if (active && active.component === 'full') renderFullPanel(currentCanonical, active.activity && active.activity.render && active.activity.render());
                    } catch (error) {}
                }
            });
            Lampa.SettingsApi.addParam({
                component: COMPONENT_ID,
                param: { name: SETTINGS.hideComments, type: 'trigger', default: true },
                field: { name: 'Скрывать комментарии', description: 'Убирает раздел обсуждений из карточки фильма или сериала.' }
            });
            Lampa.SettingsApi.addParam({
                component: COMPONENT_ID,
                param: { name: SETTINGS.recommendationLimit, type: 'select', values: { 12: '12', 20: '20' }, default: 12 },
                field: { name: 'Карточек «Для вас»', description: 'Количество рекомендаций в строке.' },
                onChange: function () { scheduleHomeRefresh('recommendation-limit'); }
            });
            Lampa.SettingsApi.addParam({
                component: COMPONENT_ID,
                param: { name: 'lpersonal_refresh', type: 'button' },
                field: { name: 'Обновить рекомендации', description: 'Пересчитать подборку по текущей истории и оценкам.' },
                onChange: function () {
                    notify('Обновляем рекомендации…');
                    enrichRecommendationCandidates(8, function (started) {
                        notify(started === false ? 'Обновление уже выполняется' : 'Рекомендации обновлены');
                    });
                }
            });
            Lampa.SettingsApi.addParam({
                component: COMPONENT_ID,
                param: { name: 'lpersonal_manage_exclusions', type: 'button' },
                field: { name: 'Исключения', description: 'Вернуть скрытые фильмы, жанры, актёров, режиссёров или страны.' },
                onChange: openExclusionsManager
            });
            Lampa.SettingsApi.addParam({
                component: COMPONENT_ID,
                param: { name: 'lpersonal_clear_history', type: 'button' },
                field: { name: 'Очистить историю', description: 'Удаляет локальную историю просмотра. Закладки Lampa сохраняются.' },
                onChange: function () { confirmAction('Очистить локальную историю?', clearHistory, 'Очистить историю'); }
            });
            Lampa.SettingsApi.addParam({
                component: COMPONENT_ID,
                param: { name: 'lpersonal_clear_recommendations', type: 'button' },
                field: { name: 'Сбросить рекомендации', description: 'Удаляет рассчитанную подборку, но сохраняет историю.' },
                onChange: function () { confirmAction('Сбросить рекомендации?', clearRecommendations, 'Сбросить рекомендации'); }
            });
            Lampa.SettingsApi.addParam({
                component: COMPONENT_ID,
                param: { name: 'lpersonal_clear_all', type: 'button' },
                field: { name: 'Удалить персональные данные', description: 'Удаляет историю, оценки, подборку и исключения.' },
                onChange: function () { confirmAction('Удалить все персональные данные?', clearAllPersonalData, 'Удалить данные'); }
            });
        } catch (error) {
            console.error('[Lampa Personal] settings registration failed:', error);
        }
    }

    function registerRatingProvider(name, resolver) {
        if (!name || typeof resolver !== 'function') return false;
        if (ratingProviders.some(function (provider) { return provider.name === name; })) return false;
        ratingProviders.push({ name: name, resolve: resolver });
        return true;
    }

    function apiObserve(card, detail) {
        var canonical = observeIdentity(card, detail || card);
        saveProfile('api-observe');
        return canonical;
    }

    function apiGetProfile() {
        return clone(profile);
    }

    function apiGetCanonical(card, detail) {
        return observeIdentity(card, detail || card);
    }

    function apiRecommendationReason(cardOrId) {
        var canonical = typeof cardOrId === 'string' ? cardOrId : observeIdentity(cardOrId, cardOrId);
        var recommendation = findRecommendation(canonical);
        return recommendation ? clone(recommendation) : null;
    }

    function readyToStart() {
        return !!(
            document.head &&
            window.Lampa &&
            Lampa.Storage &&
            Lampa.SettingsApi &&
            Lampa.ContentRows
        );
    }

    function start() {
        if (window[READY_FLAG]) return;
        if (!readyToStart()) {
            startAttempts += 1;
            if (startAttempts < 120) {
                clearTimeout(startTimer);
                startTimer = setTimeout(start, 100);
            } else {
                console.warn('[Lampa Personal] Required Lampa API unavailable');
            }
            return;
        }

        window[READY_FLAG] = true;
        bus = createBus();
        loadProfile();
        storageSet(PROFILE_KEY + '_before_import', '');
        injectStyle();
        addSettings();
        registerHomeRows();
        syncFavoriteState();
        recomputeRecommendations(true);

        if (Lampa.Listener && typeof Lampa.Listener.follow === 'function') {
            Lampa.Listener.follow('full', onFullEvent);
            Lampa.Listener.follow('state:changed', onFavoriteChanged);
            Lampa.Listener.follow('state:changed', function (event) {
                if (event && event.target === 'timetable') scheduleHomeRefresh('timetable');
            });
        }
        try {
            if (Lampa.Timeline && Lampa.Timeline.listener && typeof Lampa.Timeline.listener.follow === 'function') Lampa.Timeline.listener.follow('update', onTimelineUpdate);
        } catch (error) {}

        window.addEventListener('beforeunload', flushTimelineSave);
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'hidden') flushTimelineSave();
        });

        window.LampaPersonal = {
            version: VERSION,
            listener: bus,
            profile: apiGetProfile,
            observe: apiObserve,
            canonical: apiGetCanonical,
            setRating: setRating,
            toggleWatchlist: toggleWatchlist,
            excludeContent: setContentExcluded,
            dislike: setDisliked,
            setInfluence: setInfluence,
            recompute: recomputeRecommendations,
            enrich: enrichRecommendationCandidates,
            reason: apiRecommendationReason,
            registerRatingProvider: registerRatingProvider,
            clearHistory: clearHistory,
            clearRecommendations: clearRecommendations,
            diagnoseHome: function () { return runHomeDiagnostics(false); }
        };

        console.info('[Lampa Personal] v' + VERSION + ' loaded');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();

    if (window.Lampa && Lampa.Listener && typeof Lampa.Listener.follow === 'function') {
        Lampa.Listener.follow('app', function (event) {
            if (event && event.type === 'ready') start();
        });
    }
})();
