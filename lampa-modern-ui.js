/* Lampa Modern UI 0.13.0 — permanent Shots guard. */
(function () {
    'use strict';

    var FLAG = '__lmui_shots_guard_v110__';
    var state = window.__LMUI_SHOTS_STATE__ || { blockedScripts: 0, blockedRequests: 0, removedNodes: 0, policyRuns: 0 };
    if (typeof state.blockedRequests !== 'number') state.blockedRequests = 0;
    window.__LMUI_SHOTS_STATE__ = state;
    if (window[FLAG]) return;
    window[FLAG] = true;

    function isShotsUrl(value) {
        return /(?:\/plugin\/shots(?:[?#/]|$)|\/api\/shots\/)/i.test(String(value || ''));
    }

    function log(event, value) {
        try { console.info('[LMUI Shots] ' + event, value || ''); } catch (error) {}
    }

    function completeBlocked(args) {
        var complete = args && args[1];
        if (typeof complete === 'function') setTimeout(function () { complete(); }, 0);
    }

    function wrapLoader(name) {
        if (!window.Lampa || !Lampa.Utils) return false;
        var original = Lampa.Utils[name];
        if (typeof original !== 'function' || original.__lmuiShotsGuard) return true;
        var wrapped = function () {
            var args = Array.prototype.slice.call(arguments);
            var input = args[0];
            if (Array.isArray(input)) {
                var filtered = input.filter(function (url) { return !isShotsUrl(url); });
                if (filtered.length !== input.length) {
                    state.blockedScripts += input.length - filtered.length;
                    log('blocked loader item', input.filter(isShotsUrl));
                }
                if (!filtered.length) {
                    completeBlocked(args);
                    return;
                }
                args[0] = filtered;
            } else if (isShotsUrl(input)) {
                state.blockedScripts += 1;
                log('blocked loader url', input);
                completeBlocked(args);
                return;
            }
            return original.apply(this, args);
        };
        wrapped.__lmuiShotsGuard = true;
        wrapped.__lmuiShotsOriginal = original;
        Lampa.Utils[name] = wrapped;
        return true;
    }

    function scriptSource(node) {
        if (!node || String(node.tagName || '').toLowerCase() !== 'script') return '';
        try { return node.src || node.getAttribute('src') || ''; }
        catch (error) { return ''; }
    }

    function blockScriptNode(node) {
        var src = scriptSource(node);
        if (!isShotsUrl(src)) return false;
        state.blockedScripts += 1;
        try { node.type = 'application/lmui-blocked'; } catch (error) {}
        try { node.removeAttribute('src'); } catch (error) {}
        try { node.setAttribute('data-lmui-blocked-src', src); } catch (error) {}
        setTimeout(function () {
            try { if (typeof node.onload === 'function') node.onload(); } catch (error) {}
        }, 0);
        log('blocked script node', src);
        return true;
    }

    function wrapInsertion(name) {
        var proto = window.Element && Element.prototype;
        if (!proto || typeof proto[name] !== 'function' || proto[name].__lmuiShotsGuard) return;
        var original = proto[name];
        var wrapped = function (node) {
            if (blockScriptNode(node)) return node;
            return original.apply(this, arguments);
        };
        wrapped.__lmuiShotsGuard = true;
        wrapped.__lmuiShotsOriginal = original;
        proto[name] = wrapped;
    }

    function wrapScriptAttributes() {
        var proto = window.HTMLScriptElement && HTMLScriptElement.prototype;
        if (!proto || proto.__lmuiShotsAttributesWrapped) return;
        proto.__lmuiShotsAttributesWrapped = true;
        var descriptor;
        try { descriptor = Object.getOwnPropertyDescriptor(proto, 'src'); } catch (error) {}
        if (descriptor && typeof descriptor.set === 'function' && typeof descriptor.get === 'function') {
            try {
                Object.defineProperty(proto, 'src', {
                    configurable: descriptor.configurable,
                    enumerable: descriptor.enumerable,
                    get: descriptor.get,
                    set: function (value) {
                        if (isShotsUrl(value)) {
                            state.blockedScripts += 1;
                            try { this.setAttribute('data-lmui-blocked-src', String(value)); } catch (error) {}
                            log('blocked script src', value);
                            return;
                        }
                        return descriptor.set.call(this, value);
                    }
                });
            } catch (error) {}
        }
        var originalSetAttribute = proto.setAttribute;
        if (typeof originalSetAttribute === 'function' && !originalSetAttribute.__lmuiShotsGuard) {
            var wrappedSetAttribute = function (name, value) {
                if (String(name || '').toLowerCase() === 'src' && isShotsUrl(value)) {
                    state.blockedScripts += 1;
                    try { return Element.prototype.setAttribute.call(this, 'data-lmui-blocked-src', String(value)); }
                    catch (error) { return; }
                }
                return originalSetAttribute.apply(this, arguments);
            };
            wrappedSetAttribute.__lmuiShotsGuard = true;
            proto.setAttribute = wrappedSetAttribute;
        }
    }

    function wrapNetwork() {
        if (typeof window.fetch === 'function' && !window.fetch.__lmuiShotsGuard) {
            var originalFetch = window.fetch;
            var wrappedFetch = function (input) {
                var url = typeof input === 'string' ? input : input && input.url || '';
                if (!isShotsUrl(url)) return originalFetch.apply(this, arguments);
                state.blockedRequests += 1;
                log('blocked fetch', url);
                if (typeof window.Response === 'function') return Promise.resolve(new Response('', { status: 204, statusText: 'No Content' }));
                return Promise.resolve({ ok: true, status: 204, text: function () { return Promise.resolve(''); }, json: function () { return Promise.resolve({}); } });
            };
            wrappedFetch.__lmuiShotsGuard = true;
            wrappedFetch.__lmuiShotsOriginal = originalFetch;
            window.fetch = wrappedFetch;
        }

        var xhrProto = window.XMLHttpRequest && XMLHttpRequest.prototype;
        if (xhrProto && typeof xhrProto.open === 'function' && !xhrProto.open.__lmuiShotsGuard) {
            var originalOpen = xhrProto.open;
            var wrappedOpen = function (method, url) {
                if (!isShotsUrl(url)) return originalOpen.apply(this, arguments);
                state.blockedRequests += 1;
                this.__lmuiShotsBlocked = true;
                this.__lmuiShotsBlockedUrl = String(url || '');
                log('blocked xhr', url);
                var args = Array.prototype.slice.call(arguments);
                args[0] = 'GET';
                args[1] = 'data:application/json,%7B%7D';
                return originalOpen.apply(this, args);
            };
            wrappedOpen.__lmuiShotsGuard = true;
            wrappedOpen.__lmuiShotsOriginal = originalOpen;
            xhrProto.open = wrappedOpen;
        }
    }

    function removeShotsNodes(root) {
        var scope = root && root.querySelectorAll ? root : document;
        var selectors = [
            'script[src*="/plugin/shots"]',
            '[data-action="shots"]',
            '[data-component="shots"]',
            '#sprite-shots',
            '.shots-lenta',
            '.shots-player-button',
            '.shots-player-recorder',
            '.shots-slides',
            '.shots-video-present'
        ];
        try {
            Array.prototype.slice.call(scope.querySelectorAll(selectors.join(','))).forEach(function (node) {
                if (!node || !node.parentNode) return;
                if (typeof node.remove === 'function') node.remove();
                else if (node.parentNode && typeof node.parentNode.removeChild === 'function') node.parentNode.removeChild(node);
                state.removedNodes += 1;
            });
        } catch (error) {}
    }

    function setStorage(name, value) {
        try {
            if (window.Lampa && Lampa.Storage && typeof Lampa.Storage.set === 'function') Lampa.Storage.set(name, value);
            else if (window.localStorage) localStorage.setItem(name, JSON.stringify(value));
        } catch (error) {}
    }

    function enforce() {
        state.policyRuns += 1;
        window.plugin_shots_ready = true;
        setStorage('shots_in_player', false);
        setStorage('shots_in_card', false);
        setStorage('content_rows_shots_main', false);
        setStorage('shots_enabled', false);
        wrapLoader('putScript');
        wrapLoader('putScriptAsync');
        wrapNetwork();
        try {
            if (window.Lampa && Lampa.SettingsApi && typeof Lampa.SettingsApi.removeComponent === 'function') {
                Lampa.SettingsApi.removeComponent('shots');
            }
        } catch (error) {}
        removeShotsNodes(document);
    }

    wrapInsertion('appendChild');
    wrapInsertion('insertBefore');
    wrapScriptAttributes();
    enforce();

    var attempts = 0;
    var timer = setInterval(function () {
        attempts += 1;
        enforce();
        if (attempts >= 80) clearInterval(timer);
    }, 250);

    if (window.MutationObserver && document.documentElement) {
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                Array.prototype.slice.call(mutation.addedNodes || []).forEach(function (node) {
                    if (blockScriptNode(node)) {
                        if (typeof node.remove === 'function') node.remove();
                        else if (node.parentNode && typeof node.parentNode.removeChild === 'function') node.parentNode.removeChild(node);
                        return;
                    }
                    removeShotsNodes(node);
                });
            });
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }
})();

/* Lampa Modern UI 0.13.0
 * Единый UI-слой поверх штатной навигации Lampa.
 * Главная не подменяется: добавляется только нативный ряд продолжения просмотра.
 */
(function () {
    'use strict';

    var VERSION = '0.13.0';
    var PLUGIN_ID = 'lampa_modern_ui';
    var STYLE_ID = 'lampa-modern-ui-style';
    var READY_FLAG = '__lampa_modern_ui_v0130_ready__';
    var CLEANUP_KEY = 'lmui_v090_cleanup';
    var START_ATTEMPTS = 160;
    var startAttempts = 0;
    var startTimer = 0;
    var refreshTimer = 0;
    var decorateTimer = 0;
    var activeObserver = null;
    var observedRoot = null;
    var lastMainRefreshAt = 0;
    var searchTimer = 0;
    var settingsCleanupTimer = 0;
    var pendingDecorateRoots = [];
    var inputListenersInstalled = false;
    var lastInputMode = '';
    var detailNeedsInitialFocus = false;
    var detailUserInteracted = false;
    var detailGeneration = 0;
    var activeDetailData = null;
    var activeDetailCard = null;
    var activeDetailKey = '';
    var episodeFocusObserver = null;
    var episodeFocusObserverTimer = 0;
    var episodeRestorePending = false;
    var DETAIL_MEMORY_KEY = 'lmui_detail_episode_v1';
    var settingsObserver = null;
    var settingsGuardInstalled = false;
    var searchObserver = null;
    var searchSourcesBridge = null;
    var searchSourcesTimer = 0;
    var lastSearchState = '';
    var controllerDiagnosticsInstalled = false;
    var diagnosticsEnabled = true;
    var diagnosticsVerbose = false;
    var diagnosticBuffer = [];
    var diagnosticSequence = 0;
    var lastControllerLogKey = '';
    var lastControllerLogAt = 0;
    var lastSettingsCleanupSignature = '';
    var searchScheduledValue = '';
    var searchRequestGeneration = 0;
    var searchResultSignatures = {};
    var lastLayoutSignature = '';
    var continueRow = null;
    var routerGuardInstalled = false;
    var CONTINUE_ROW_TIMEOUT = 1800;

    var KEYS = {
        enabled: 'lmui_enabled',
        density: 'lmui_density',
        motion: 'lmui_motion',
        performance: 'lmui_performance'
    };

    var HIDDEN_COMPONENT_IDS = [
        'sync',
        'account_sync',
        'parental_control',
        'parental',
        'remote_configuration',
        'remote_config'
    ];


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

/* Native continue row. Navigation and scrolling remain owned by Lampa. */
body.lampa-modern-ui .items-line[data-lmui-row="continue"] {
    margin-bottom: 0.9em;
}

body.lampa-modern-ui .items-line[data-lmui-row="continue"] .items-line__title {
    font-size: clamp(1.22em, 1.5vw, 1.58em);
}

body.lampa-modern-ui .items-line[data-lmui-row="continue"] .card {
    width: clamp(13.2em, 18vw, 16.8em);
}

body.lampa-modern-ui .lmui-continue-badge {
    position: absolute;
    left: 0.5em;
    right: 0.5em;
    bottom: 0.5em;
    z-index: 4;
    overflow: hidden;
    padding: 0.3em 0.52em;
    border-radius: 0.5em;
    background: rgba(5, 8, 14, 0.9);
    color: #fff;
    font-size: 0.75em;
    font-weight: 720;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
}

body.lampa-modern-ui .lmui-continue-card--torrent .lmui-continue-badge {
    background: rgba(35, 91, 164, 0.94);
}

body.lampa-modern-ui .lmui-continue-card--shortcut .card__view {
    background: linear-gradient(145deg, #172a46, #0c1422);
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

/* Series detail workflow */
body.lampa-modern-ui .lmui-series-summary {
    width: min(100%, 58em);
    margin: 0.9em 0 0.3em;
    padding: 0.2em 0 0.2em 1em;
    border-left: 0.22em solid var(--lmui-accent);
}

body.lampa-modern-ui .lmui-series-summary__eyebrow {
    color: var(--lmui-accent-strong);
    font-size: 0.78em;
    font-weight: 760;
    letter-spacing: 0.085em;
    text-transform: uppercase;
}

body.lampa-modern-ui .lmui-series-summary__title {
    overflow: hidden;
    display: -webkit-box;
    margin-top: 0.2em;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    color: var(--lmui-text);
    font-size: 1.15em;
    font-weight: 740;
    line-height: 1.3;
}

body.lampa-modern-ui .lmui-series-summary__meta,
body.lampa-modern-ui .lmui-series-summary__next {
    margin-top: 0.28em;
    color: var(--lmui-muted);
    line-height: 1.38;
}

body.lampa-modern-ui .lmui-series-summary__next strong {
    color: var(--lmui-text);
    font-weight: 680;
}

body.lampa-modern-ui .lmui-series-progress {
    width: min(24em, 100%);
    height: 0.34em;
    overflow: hidden;
    margin-top: 0.58em;
    border-radius: 99em;
    background: rgba(255, 255, 255, 0.15);
}

body.lampa-modern-ui .lmui-series-progress > i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--lmui-accent);
}

body.lampa-modern-ui .activity--active.lmui-detail-series .full-start-new__buttons .lmui-source-action {
    display: none !important;
}

body.lampa-modern-ui .full-start-new__buttons .lmui-series-primary {
    order: -20;
    border-color: transparent;
    background: var(--lmui-accent);
    color: #07101c;
    font-weight: 780;
}

body.lampa-modern-ui .full-start-new__buttons .lmui-series-primary.focus,
body.lampa-modern-ui .full-start-new__buttons .lmui-series-primary.hover {
    border-color: #fff;
    background: var(--lmui-accent-strong);
    color: #050b13;
    box-shadow: 0 0 0 0.11em #fff, 0 0 0 0.25em rgba(105, 167, 255, 0.32), 0 0.9em 2.2em rgba(0, 0, 0, 0.35);
}

body.lampa-modern-ui .full-start-new__buttons .lmui-all-episodes {
    order: -10;
}

body.lampa-modern-ui .lmui-episode-remembered::after {
    content: "Последний выбор";
    position: absolute;
    right: 0.55em;
    bottom: 0.55em;
    z-index: 4;
    padding: 0.25em 0.42em;
    border-radius: 0.45em;
    background: rgba(5, 8, 14, 0.9);
    color: var(--lmui-accent-strong);
    font-size: 0.72em;
    font-weight: 700;
}

body.lampa-modern-ui .activity--active.lmui-detail-no-backdrop .full-start-new__right {
    position: relative;
}

body.lampa-modern-ui .activity--active.lmui-detail-no-backdrop .full-start-new__right::before {
    content: "";
    position: absolute;
    inset: -1.2em -1.4em;
    z-index: -1;
    border-radius: var(--lmui-radius-lg);
    background: linear-gradient(135deg, rgba(24, 36, 56, 0.62), rgba(7, 10, 16, 0.18));
}

body.lampa-modern-ui .activity--active.lmui-detail-title-long .full-start-new__title {
    max-width: 22ch;
    font-size: clamp(2.05em, 3.5vw, 3.9em);
    line-height: 1.08;
}

body.lampa-modern-ui.lmui-layout-tablet .lmui-series-summary {
    width: 100%;
    margin-top: 0.75em;
}

body.lampa-modern-ui.lmui-layout-phone .lmui-series-summary {
    width: 100%;
    margin-top: 0.75em;
    padding-left: 0.78em;
}

body.lampa-modern-ui.lmui-layout-phone .lmui-series-summary__title {
    font-size: 1.05em;
}

body.lampa-modern-ui.lmui-layout-phone .full-start-new__buttons .lmui-series-primary,
body.lampa-modern-ui.lmui-layout-phone .full-start-new__buttons .lmui-all-episodes {
    grid-column: 1 / -1;
}

/* Search: one input, compact sources, results. */
body.lampa-modern-ui.search--open {
    --lmui-search-max: min(76em, calc(100vw - 3em));
}

body.lampa-modern-ui .main-search {
    background: linear-gradient(160deg, rgba(8, 12, 20, 0.99), rgba(5, 8, 13, 0.99));
}

body.lampa-modern-ui .main-search > .search,
body.lampa-modern-ui .main-search .scroll.search {
    width: var(--lmui-search-max);
    max-width: var(--lmui-search-max);
    margin-inline: auto;
}

body.lampa-modern-ui .main-search .search > .scroll__content > .scroll__body,
body.lampa-modern-ui .main-search .search__body {
    padding: 0.45em 0 4em;
}

body.lampa-modern-ui .main-search .head-backward {
    margin-bottom: 0.3em;
}

body.lampa-modern-ui .search__keypad {
    margin: 0 0 0.55em;
}

body.lampa-modern-ui .simple-keyboard {
    width: 100%;
    padding: 0.55em;
    border: 0.075em solid var(--lmui-border);
    border-radius: 1em;
    background: rgba(13, 19, 29, 0.98);
    box-shadow: 0 0.8em 2.2em rgba(0, 0, 0, 0.25);
}

body.lampa-modern-ui .simple-keyboard-input,
body.lampa-modern-ui .search-box .search__input {
    box-sizing: border-box;
    width: 100%;
    min-height: 3.25em;
    padding: 0.7em 0.9em;
    border: 0.085em solid rgba(255, 255, 255, 0.13);
    border-radius: 0.82em;
    background: var(--lmui-surface);
    color: var(--lmui-text);
    font-size: clamp(1em, 1.15vw, 1.16em);
    font-weight: 620;
    outline: 0;
}

body.lampa-modern-ui .simple-keyboard-input.focus,
body.lampa-modern-ui .simple-keyboard-input:focus,
body.lampa-modern-ui .search-box--focus .search__input {
    border-color: var(--lmui-accent);
    background: var(--lmui-surface-raised);
    box-shadow: var(--lmui-focus-ring);
}

body.lampa-modern-ui .simple-keyboard-mic {
    width: 3em;
    min-width: 3em;
    height: 3em;
    margin-right: 0.45em;
    border-radius: 0.72em;
}

body.lampa-modern-ui .simple-keyboard .hg-row {
    gap: 0.25em;
    margin-bottom: 0.25em;
}

body.lampa-modern-ui .simple-keyboard .hg-button {
    min-height: 2.55em;
    margin: 0 !important;
    border-radius: 0.55em;
    font-size: 0.94em;
}

body.lampa-modern-ui .simple-keyboard-buttons {
    display: flex;
    gap: 0.4em;
    margin-top: 0.42em;
}

body.lampa-modern-ui .simple-keyboard-buttons__enter,
body.lampa-modern-ui .simple-keyboard-buttons__cancel {
    min-height: 2.65em;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5em 0.85em;
    border-radius: 0.65em;
}

body.lampa-modern-ui .lmui-search-summary,
body.lampa-modern-ui .lmui-search-help,
body.lampa-modern-ui .search__history.lmui-search-history-empty {
    display: none !important;
}

body.lampa-modern-ui .search__history,
body.lampa-modern-ui .search__sources {
    margin: 0.45em 0 0.65em;
    padding: 0;
}

body.lampa-modern-ui .search__history::before,
body.lampa-modern-ui .search__sources::before,
body.lampa-modern-ui .search__results::before {
    content: none !important;
}

body.lampa-modern-ui .search-source,
body.lampa-modern-ui .search-history-key {
    min-height: 2.55em;
    display: inline-flex;
    align-items: center;
    padding: 0.46em 0.72em;
    border: 0.075em solid var(--lmui-border);
    border-radius: 0.68em;
    background: rgba(255, 255, 255, 0.04);
    color: var(--lmui-muted);
    font-weight: 630;
}

body.lampa-modern-ui .search-source__count {
    min-width: 1.45em;
    margin-left: 0.42em;
    padding: 0.1em 0.32em;
    border-radius: 99em;
    background: rgba(255, 255, 255, 0.08);
    color: var(--lmui-muted);
    text-align: center;
}

body.lampa-modern-ui .search-source.active {
    color: #fff;
    border-color: rgba(105, 167, 255, 0.46);
    background: rgba(105, 167, 255, 0.15);
}

body.lampa-modern-ui .search-source.focus,
body.lampa-modern-ui .search-history-key.focus {
    color: #fff;
    border-color: var(--lmui-accent);
    background: var(--lmui-accent-soft);
    box-shadow: var(--lmui-focus-ring);
}

body.lampa-modern-ui .search-source--loading::after {
    content: "";
    width: 0.68em;
    height: 0.68em;
    margin-left: 0.42em;
    border: 0.11em solid rgba(255, 255, 255, 0.24);
    border-top-color: var(--lmui-accent-strong);
    border-radius: 50%;
    animation: lmui-search-spin 0.75s linear infinite;
}

@keyframes lmui-search-spin {
    to { transform: rotate(360deg); }
}

body.lampa-modern-ui .search__results {
    margin-top: 0.45em;
    padding-top: 0;
}

body.lampa-modern-ui .search__results .items-line {
    margin-bottom: 0.65em;
}

body.lampa-modern-ui .search__results .items-line__head {
    min-height: 2.65em;
}

body.lampa-modern-ui .lmui-search-screen[data-lmui-search-state="landing"] .search__results,
body.lampa-modern-ui .lmui-search-screen[data-lmui-search-state="typing"] .search__results {
    display: none;
}

body.lampa-modern-ui.lmui-layout-tablet.search--open {
    --lmui-search-max: calc(100vw - 2em);
}

body.lampa-modern-ui.lmui-layout-tablet .simple-keyboard .hg-button {
    min-height: 2.45em;
    font-size: 0.9em;
}

body.lampa-modern-ui.lmui-layout-phone.search--open {
    --lmui-search-max: 100%;
}

body.lampa-modern-ui.lmui-layout-phone .main-search .search > .scroll__content > .scroll__body,
body.lampa-modern-ui.lmui-layout-phone .main-search .search__body {
    padding-inline: max(0.65em, env(safe-area-inset-left));
}

body.lampa-modern-ui.lmui-layout-phone .simple-keyboard {
    padding: 0.38em;
    border-right: 0;
    border-left: 0;
    border-radius: 0.85em;
}

body.lampa-modern-ui.lmui-layout-phone .simple-keyboard .hg-row {
    gap: 0.16em;
    margin-bottom: 0.16em;
}

body.lampa-modern-ui.lmui-layout-phone .simple-keyboard .hg-button {
    min-height: 2.4em;
    padding-inline: 0.25em;
    font-size: 0.82em;
}

body.lampa-modern-ui.lmui-layout-phone .search-source,
body.lampa-modern-ui.lmui-layout-phone .search-history-key {
    min-height: 2.8em;
}

/* Permanent feature removals. DOM selectors are a fallback for static Settings templates. */
body.lampa-modern-ui [data-action="shots"],
body.lampa-modern-ui [data-component="shots"],
body.lampa-modern-ui #sprite-shots,
body.lampa-modern-ui .shots-lenta,
body.lampa-modern-ui .shots-player-button,
body.lampa-modern-ui .shots-player-recorder,
body.lampa-modern-ui .shots-slides,
body.lampa-modern-ui .shots-video-present,
body.lampa-modern-ui [data-component="parental_control"],
body.lampa-modern-ui [data-component="remote_configuration"],
body.lampa-modern-ui [data-component="remote_config"],
body.lampa-modern-ui [data-component="sync"],
body.lampa-modern-ui [data-component="account_sync"],
body.lampa-modern-ui [data-name="account_sync"],
body.lampa-modern-ui [data-name="sync"],
body.lampa-modern-ui [data-param="account_sync"],
body.lampa-modern-ui [data-param="sync"] {
    display: none !important;
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

    function diagnosticTime() {
        try { return new Date().toISOString(); }
        catch (error) { return String(Date.now ? Date.now() : 0); }
    }

    function diagnosticController() {
        try {
            var enabled = window.Lampa && Lampa.Controller && typeof Lampa.Controller.enabled === 'function' ? Lampa.Controller.enabled() : null;
            return enabled ? {
                name: enabled.name || '',
                hasController: !!enabled.controller,
                linkedModernMain: false
            } : { name: '', hasController: false, linkedModernMain: false };
        } catch (error) {
            return { name: 'error', hasController: false, linkedModernMain: false };
        }
    }

    function diagnostic(event, data, level) {
        var entry = {
            seq: ++diagnosticSequence,
            time: diagnosticTime(),
            event: String(event || ''),
            data: data === undefined ? null : data
        };
        diagnosticBuffer.push(entry);
        if (diagnosticBuffer.length > 240) diagnosticBuffer.shift();
        if (!diagnosticsEnabled) return entry;
        var method = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'info';
        try { console[method]('[LMUI ' + VERSION + '] ' + entry.event, entry.data || ''); }
        catch (error) {}
        return entry;
    }

    function diagnosticSnapshot() {
        var active = activeActivity();
        var search = searchRoot();
        var focused = document.querySelector('.selector.focus');
        var focusedData = focused ? cardData(focused) : null;
        var settingsIds = [];
        try {
            settingsIds = Array.prototype.slice.call(document.querySelectorAll('.settings [data-component], .settings__body [data-component]')).map(function (node) {
                return node.getAttribute('data-component') || '';
            }).filter(Boolean);
        } catch (error) {}
        return {
            version: VERSION,
            verboseLogs: diagnosticsVerbose,
            activeComponent: active && active.component || '',
            controller: diagnosticController(),
            inputMode: lastInputMode || '',
            bodyClasses: document.body ? document.body.className : '',
            continueRowRegistered: !!continueRow,
            focused: focused ? {
                className: focused.className,
                contentId: focusedData && (focusedData.lmui_content_id || contentId(focusedData)) || focused.getAttribute('data-lmui-content') || ''
            } : null,
            searchOpen: !!search,
            searchState: lastSearchState,
            detail: activeDetailCard ? {
                key: activeDetailKey,
                mediaType: mediaType(activeDetailCard),
                generation: detailGeneration,
                memory: readEpisodeMemory(activeDetailCard)
            } : null,
            settingsComponentsInDom: settingsIds,
            shots: clone(window.__LMUI_SHOTS_STATE__ || {})
        };
    }

    function exposeDiagnostics() {
        window.LMUI = {
            version: VERSION,
            enableLogs: function () { diagnosticsEnabled = true; diagnostic('diagnostics.enabled'); },
            disableLogs: function () { diagnostic('diagnostics.disabled'); diagnosticsEnabled = false; },
            enableVerboseLogs: function () { diagnosticsVerbose = true; diagnostic('diagnostics.verbose_enabled'); },
            disableVerboseLogs: function () { diagnostic('diagnostics.verbose_disabled'); diagnosticsVerbose = false; },
            logs: function () { return diagnosticBuffer.slice(); },
            clearLogs: function () { diagnosticBuffer = []; diagnosticSequence = 0; },
            snapshot: diagnosticSnapshot,
            recoverSearch: function () { return recoverSearchFocus('console'); },
            restoreEpisodeFocus: function () { return restoreEpisodeFocus(activeActivityRoot(), activeDetailCard, 'console', true); },
            enforceShotsOff: function () { enforceShotsOff('console'); return clone(window.__LMUI_SHOTS_STATE__ || {}); },
            cleanupSettings: function () { installSettingsGuard(); removeHiddenSettingsComponents(); scheduleSettingsCleanupBurst(); return diagnosticSnapshot().settingsComponentsInDom; },
            dump: function () {
                var payload = { snapshot: diagnosticSnapshot(), logs: diagnosticBuffer.slice() };
                try { console.info('[LMUI ' + VERSION + '] dump', payload); } catch (error) {}
                return payload;
            }
        };
    }

    function controllerToggleImportant(name, before, after) {
        if (diagnosticsVerbose) return true;
        var important = [
            'search', 'keybord', 'search_history', 'search_sources', 'search_results',
            'settings', 'settings_component', 'select',
            'player', 'player-loading', 'player_skip', 'player_panel',
            'episodes', 'full'
        ];
        if (important.indexOf(String(name || '')) >= 0) return true;
        if (before && after && before.name !== after.name && after.name !== String(name || '') && name !== 'content') return true;
        return false;
    }

    function installControllerDiagnostics() {
        if (controllerDiagnosticsInstalled || !window.Lampa || !Lampa.Controller || typeof Lampa.Controller.toggle !== 'function') return;
        controllerDiagnosticsInstalled = true;
        var original = Lampa.Controller.toggle;
        if (original.__lmuiDiagnosticWrapped) return;
        var wrapped = function (name) {
            var before = diagnosticController();
            var result;
            try {
                result = original.apply(this, arguments);
            } finally {
                var after = diagnosticController();
                var changed = before.name !== after.name;
                var searchFamily = ['search', 'keybord', 'search_history', 'search_sources', 'search_results'];
                var requestedName = String(name || '');
                var sameSearchFamily = searchFamily.indexOf(requestedName) >= 0 && searchFamily.indexOf(after.name) >= 0;
                var mismatch = changed && after.name && after.name !== requestedName && requestedName !== 'content' && !sameSearchFamily;
                if ((changed || diagnosticsVerbose) && controllerToggleImportant(name, before, after)) {
                    var key = [name || '', before.name || '', after.name || '', activeComponent() || ''].join('|');
                    var stamp = Date.now ? Date.now() : 0;
                    if (key !== lastControllerLogKey || stamp - lastControllerLogAt > 180 || mismatch) {
                        lastControllerLogKey = key;
                        lastControllerLogAt = stamp;
                        diagnostic(mismatch ? 'controller.toggle_mismatch' : 'controller.toggle', {
                            requested: name,
                            before: before,
                            after: after,
                            component: activeComponent()
                        }, mismatch ? 'warn' : undefined);
                    }
                }
            }
            return result;
        };
        wrapped.__lmuiDiagnosticWrapped = true;
        wrapped.__lmuiDiagnosticOriginal = original;
        Lampa.Controller.toggle = wrapped;
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

    function favoriteGet(type) {
        try {
            if (!Lampa.Favorite || typeof Lampa.Favorite.get !== 'function') return [];
            var value = Lampa.Favorite.get({ type: type });
            return asArray(value && value.results ? value.results : value);
        } catch (error) {
            return [];
        }
    }

    function favoriteContinues(type) {
        try {
            if (!Lampa.Favorite || typeof Lampa.Favorite.continues !== 'function') return [];
            var value = Lampa.Favorite.continues(type);
            return asArray(value && value.results ? value.results : value).map(function (item) {
                return clone(item && item.card ? item.card : item);
            }).filter(Boolean);
        } catch (error) {
            diagnostic('continue.favorite_error', { type: type, message: String(error && error.message || error) }, 'warn');
            return [];
        }
    }

    function decodeTorrentData(value) {
        if (!value) return {};
        if (typeof value === 'object') return value;
        var text = String(value || '');
        var attempts = [text];
        try { attempts.push(decodeURIComponent(text)); } catch (error) {}
        for (var i = 0; i < attempts.length; i++) {
            try { return JSON.parse(attempts[i]); } catch (error) {}
        }
        return {};
    }

    function torrentMovie(data) {
        if (!data || typeof data !== 'object') return null;
        if (data.movie && typeof data.movie === 'object') return data.movie;
        if (data.lampa && data.lampa.movie && typeof data.lampa.movie === 'object') return data.lampa.movie;
        return null;
    }

    function torrentCard(item) {
        if (!item || !item.hash) return null;
        var decoded = decodeTorrentData(item.data);
        var movie = torrentMovie(decoded);
        var card = clone(movie || {});
        var title = String(item.title || card.title || card.name || 'Торрент').replace(/^\[LAMPA\]\s*/i, '').trim();
        card.title = card.title || card.name || title;
        if (!card.name && mediaType(card) === 'tv') card.name = card.title;
        card.poster = card.poster || item.poster || movie && movie.poster || '';
        card.poster_path = card.poster_path || movie && movie.poster_path || '';
        card.release_date = card.release_date || item.release_date || movie && movie.release_date || '';
        card.first_air_date = card.first_air_date || item.first_air_date || movie && movie.first_air_date || '';
        card.source = card.source || 'tmdb';
        card.lmui_continue_source = 'torrent';
        card.lmui_continue_label = 'Мои торренты';
        card.lmui_torrent_hash = String(item.hash);
        card.lmui_torrent_movie = movie ? clone(movie) : null;
        card.lmui_content_id = 'torrent:' + String(item.hash);
        return card;
    }

    function myTorrentsShortcut() {
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#214f88"/><stop offset="1" stop-color="#09111e"/></linearGradient></defs><rect width="600" height="900" rx="48" fill="url(#g)"/><path d="M300 160v330m0 0 120-120m-120 120L180 370M145 620h310" fill="none" stroke="#b9d7ff" stroke-width="42" stroke-linecap="round" stroke-linejoin="round"/><text x="300" y="745" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="54" font-weight="700">Мои торренты</text></svg>';
        return {
            id: 'lmui-mytorrents',
            title: 'Мои торренты',
            source: 'tmdb',
            poster: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
            lmui_continue_source: 'shortcut',
            lmui_continue_label: 'Открыть список',
            lmui_open_mytorrents: true,
            lmui_content_id: 'shortcut:mytorrents'
        };
    }

    function nativeContinueCards(torrentItems) {
        var result = [];
        var seen = {};
        favoriteContinues('movie').concat(favoriteContinues('tv')).forEach(function (card) {
            if (!card) return;
            var key = contentId(card);
            if (!key || seen[key]) return;
            seen[key] = true;
            card.lmui_continue_source = 'favorite';
            card.lmui_continue_label = mediaType(card) === 'tv' ? 'Продолжить сериал' : 'Продолжить фильм';
            card.lmui_content_id = key;
            result.push(card);
        });
        asArray(torrentItems).slice(0, 12).forEach(function (item) {
            var card = torrentCard(item);
            if (!card || seen[card.lmui_content_id]) return;
            seen[card.lmui_content_id] = true;
            result.push(card);
        });
        result.push(myTorrentsShortcut());
        return result.slice(0, 20);
    }

    function continueRowCallback(call) {
        var completed = false;
        var timer = 0;
        function finish(torrents, reason) {
            if (completed) return;
            completed = true;
            clearTimeout(timer);
            var results = nativeContinueCards(torrents);
            diagnostic('continue.row', { reason: reason || '', favorites: results.filter(function (item) { return item.lmui_continue_source === 'favorite'; }).length, torrents: results.filter(function (item) { return item.lmui_continue_source === 'torrent'; }).length });
            call({ title: 'Продолжить', results: results });
        }
        if (!Lampa.Torserver || typeof Lampa.Torserver.my !== 'function') {
            finish([], 'torserver-unavailable');
            return;
        }
        timer = setTimeout(function () { finish([], 'torserver-timeout'); }, CONTINUE_ROW_TIMEOUT);
        try {
            Lampa.Torserver.my(function (items) { finish(items, 'ready'); }, function () { finish([], 'torserver-error'); });
        } catch (error) {
            diagnostic('continue.torserver_error', { message: String(error && error.message || error) }, 'warn');
            finish([], 'torserver-exception');
        }
    }

    function installContinueRouterGuard() {
        if (routerGuardInstalled || !Lampa.Router || typeof Lampa.Router.call !== 'function') return false;
        var original = Lampa.Router.call;
        if (original.__lmuiContinueGuard) {
            routerGuardInstalled = true;
            return true;
        }
        var wrapped = function (route, data) {
            if (route === 'full' && data && data.lmui_open_mytorrents) {
                diagnostic('continue.open_mytorrents');
                return original.call(this, 'mytorrents', {});
            }
            if (route === 'full' && data && data.lmui_torrent_hash) {
                diagnostic('continue.open_torrent', { hasMovie: !!data.lmui_torrent_movie });
                if (Lampa.Torrent && typeof Lampa.Torrent.open === 'function') {
                    return Lampa.Torrent.open(data.lmui_torrent_hash, data.lmui_torrent_movie || false);
                }
                return original.call(this, 'mytorrents', {});
            }
            return original.apply(this, arguments);
        };
        wrapped.__lmuiContinueGuard = true;
        wrapped.__lmuiContinueOriginal = original;
        Lampa.Router.call = wrapped;
        routerGuardInstalled = true;
        return true;
    }

    function registerContinueRow() {
        if (continueRow || !window.Lampa || !Lampa.ContentRows || typeof Lampa.ContentRows.add !== 'function') return false;
        continueRow = {
            name: 'lmui_continue',
            title: 'Продолжить',
            index: 0,
            screen: ['main'],
            call: function () {
                if (!boolValue(storageGet(KEYS.enabled, true), true)) return;
                return continueRowCallback;
            }
        };
        Lampa.ContentRows.add(continueRow);
        storageSet('content_rows_lmui_continue', true);
        installContinueRouterGuard();
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
                if (elapsed < 650) {
                    scheduleHomeRefresh(reason || 'throttled-update', 680 - elapsed);
                    return;
                }
                lastMainRefreshAt = timestamp;
                diagnostic('continue.refresh', { reason: reason || 'update' });
                if (Lampa.Activity && typeof Lampa.Activity.refresh === 'function') Lampa.Activity.refresh(false);
            } catch (error) {
                diagnostic('continue.refresh_error', { reason: reason || 'update', message: String(error && error.message || error) }, 'warn');
            }
        }, typeof delay === 'number' ? delay : 180);
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
        var value = String(id || '').toLowerCase().trim();
        if (!value) return false;
        if (HIDDEN_COMPONENT_IDS.indexOf(value) >= 0) return true;
        return /(^|[_-])(sync|synchronization|parental|remote[_-]?config(?:uration)?)([_-]|$)/.test(value);
    }

    function hiddenSettingsText(text) {
        var value = String(text || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (!value) return false;
        return /(?:^|\s)(?:синхронизац(?:ия|ии|ию)|sync(?:hronization)?|родительск(?:ий|ого|ому)\s+контрол|parental\s+control|удал[её]нн(?:ая|ой|ую)\s+конфигурац|remote\s+configuration)(?:\s|$)/i.test(value);
    }

    function settingsNodeIdentifier(node) {
        if (!node || !node.getAttribute) return '';
        return node.getAttribute('data-component') ||
            node.getAttribute('data-name') ||
            node.getAttribute('data-param') ||
            node.getAttribute('data-id') || '';
    }

    function removeHiddenSettingsDom(root) {
        var scope = root && root.querySelectorAll ? root : document;
        var removed = [];
        var nodes = [];
        try {
            nodes = Array.prototype.slice.call(scope.querySelectorAll([
                '.settings-folder',
                '.settings-param',
                '.settings__body [data-component]',
                '.settings__body [data-name]',
                '.settings__body [data-param]'
            ].join(',')));
            if (scope.matches && scope.matches('.settings-folder, .settings-param, [data-component], [data-name], [data-param]')) nodes.unshift(scope);
        } catch (error) {
            diagnostic('settings.dom.scan_error', { message: String(error && error.message || error) }, 'warn');
            return 0;
        }
        nodes.forEach(function (node) {
            if (!node || !node.parentNode) return;
            var id = settingsNodeIdentifier(node);
            var text = String(node.textContent || '');
            if (!hiddenSettingsId(id) && !hiddenSettingsText(text)) return;
            removed.push({ id: id || '', text: text.replace(/\s+/g, ' ').trim().slice(0, 80) });
            if (typeof node.remove === 'function') node.remove();
            else if (node.parentNode && typeof node.parentNode.removeChild === 'function') node.parentNode.removeChild(node);
        });
        if (removed.length) diagnostic('settings.dom.removed', { count: removed.length, items: removed });
        return removed.length;
    }

    function installSettingsGuard() {
        if (settingsGuardInstalled || !window.Lampa || !Lampa.SettingsApi) return false;
        settingsGuardInstalled = true;
        ['addComponent', 'addParam'].forEach(function (method) {
            var original = Lampa.SettingsApi[method];
            if (typeof original !== 'function' || original.__lmuiSettingsGuard) return;
            var wrapped = function (payload) {
                var componentId = payload && (payload.component || payload.param && payload.param.component) || '';
                var displayName = payload && (payload.name || payload.field && payload.field.name) || '';
                if (hiddenSettingsId(componentId) || hiddenSettingsText(displayName)) {
                    diagnostic('settings.registration.blocked', { method: method, component: componentId, name: displayName });
                    return;
                }
                return original.apply(this, arguments);
            };
            wrapped.__lmuiSettingsGuard = true;
            wrapped.__lmuiSettingsOriginal = original;
            Lampa.SettingsApi[method] = wrapped;
        });
        diagnostic('settings.guard.installed');
        return true;
    }

    function removeHiddenSettingsComponents(reason) {
        if (!window.Lampa || !Lampa.SettingsApi || typeof Lampa.SettingsApi.removeComponent !== 'function') {
            var domOnly = removeHiddenSettingsDom(document);
            if (domOnly || diagnosticsVerbose) diagnostic('settings.cleanup', { reason: reason || '', apiRemoved: [], apiRemaining: [], domRemoved: domOnly });
            return { apiRemoved: [], apiRemaining: [], domRemoved: domOnly };
        }
        var ids = HIDDEN_COMPONENT_IDS.slice();
        var before = [];
        try {
            if (typeof Lampa.SettingsApi.allComponents === 'function') {
                var all = Lampa.SettingsApi.allComponents() || {};
                before = Object.keys(all);
                before.forEach(function (id) {
                    var component = all[id] || {};
                    if ((hiddenSettingsId(id) || hiddenSettingsText(component.name)) && ids.indexOf(id) < 0) ids.push(id);
                });
            }
        } catch (error) {
            diagnostic('settings.components.discovery_error', { message: String(error && error.message || error) }, 'warn');
        }
        ids.forEach(function (id) {
            try { Lampa.SettingsApi.removeComponent(id); }
            catch (error) { diagnostic('settings.components.remove_error', { id: id, message: String(error && error.message || error) }, 'warn'); }
        });
        var after = [];
        try { after = typeof Lampa.SettingsApi.allComponents === 'function' ? Object.keys(Lampa.SettingsApi.allComponents() || {}) : []; }
        catch (error) {}
        var removedApi = before.filter(function (id) { return after.indexOf(id) < 0 && (hiddenSettingsId(id) || ids.indexOf(id) >= 0); });
        var remaining = after.filter(hiddenSettingsId);
        var removedDom = removeHiddenSettingsDom(document);
        var signature = [removedApi.join(','), remaining.join(','), removedDom].join('|');
        if (removedApi.length || remaining.length || removedDom || (diagnosticsVerbose && signature !== lastSettingsCleanupSignature)) {
            diagnostic('settings.cleanup', { reason: reason || '', apiRemoved: removedApi, apiRemaining: remaining, domRemoved: removedDom });
        }
        lastSettingsCleanupSignature = signature;
        return { apiRemoved: removedApi, apiRemaining: remaining, domRemoved: removedDom };
    }

    function settingsMutationTouchesUi(node) {
        if (!node || node.nodeType !== 1) return false;
        try {
            if (node.matches && node.matches('.settings, .settings__body, .settings-folder, .settings-param')) return true;
            if (node.closest && node.closest('.settings, .settings__body')) return true;
            return !!(node.querySelector && node.querySelector('.settings, .settings__body, .settings-folder, .settings-param'));
        } catch (error) {
            return false;
        }
    }

    function observeSettingsDom() {
        if (!window.MutationObserver || settingsObserver || !document.body) return;
        settingsObserver = new MutationObserver(function (mutations) {
            if (!document.body.classList.contains('settings--open') && !document.querySelector('.settings__body')) return;
            var shouldCleanup = false;
            mutations.forEach(function (mutation) {
                if (shouldCleanup) return;
                Array.prototype.slice.call(mutation.addedNodes || []).forEach(function (node) {
                    if (!shouldCleanup && settingsMutationTouchesUi(node)) shouldCleanup = true;
                });
            });
            if (shouldCleanup) scheduleSettingsCleanup(0, 'mutation');
        });
        settingsObserver.observe(document.body, { childList: true, subtree: true });
    }

    function scheduleSettingsCleanup(delay, reason) {
        clearTimeout(settingsCleanupTimer);
        settingsCleanupTimer = setTimeout(function () {
            removeHiddenSettingsComponents(reason || 'scheduled');
        }, typeof delay === 'number' ? delay : 0);
    }

    function scheduleSettingsCleanupBurst(reason) {
        [0, 120, 500, 1400].forEach(function (delay) {
            setTimeout(function () {
                removeHiddenSettingsComponents((reason || 'burst') + '-' + delay);
            }, delay);
        });
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

    function numberValue(value, fallback) {
        var parsed = Number(value);
        return isFinite(parsed) ? parsed : (fallback || 0);
    }

    function activeActivityRoot() {
        var active = document.querySelector('.activity--active');
        if (active) return active;
        var activity = activeActivity();
        if (activity && activity.activity && activity.activity.render) {
            try {
                var rendered = activity.activity.render(true);
                if (rendered && rendered.nodeType === 1) return rendered;
            } catch (error) {}
        }
        return null;
    }

    function detailMemoryStore() {
        try {
            var raw = window.sessionStorage && window.sessionStorage.getItem(DETAIL_MEMORY_KEY);
            var parsed = raw ? JSON.parse(raw) : {};
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (error) {
            return {};
        }
    }

    function writeDetailMemory(store) {
        try {
            if (window.sessionStorage) window.sessionStorage.setItem(DETAIL_MEMORY_KEY, JSON.stringify(store || {}));
        } catch (error) {
            diagnostic('detail.memory.write_error', { message: String(error && error.message || error) }, 'warn');
        }
    }

    function detailKey(card) {
        return card ? contentId(card) : '';
    }

    function readEpisodeMemory(card) {
        var key = detailKey(card);
        if (!key) return null;
        var value = detailMemoryStore()[key];
        return value && typeof value === 'object' ? value : null;
    }

    function episodeCoordinates(episode) {
        if (!episode || typeof episode !== 'object') return null;
        var season = episode.season_number !== undefined ? episode.season_number : episode.season;
        var number = episode.episode_number !== undefined ? episode.episode_number : episode.episode;
        season = Number(season);
        number = Number(number);
        if (!isFinite(season) || !isFinite(number) || season < 0 || number < 1) return null;
        return { season: season, episode: number };
    }

    function rememberEpisodeSelection(card, episode, reason) {
        var coordinates = episodeCoordinates(episode);
        var key = detailKey(card);
        if (!key || !coordinates) return false;
        var store = detailMemoryStore();
        store[key] = {
            season: coordinates.season,
            episode: coordinates.episode,
            updatedAt: Date.now ? Date.now() : new Date().getTime()
        };
        var keys = Object.keys(store);
        if (keys.length > 80) {
            keys.sort(function (left, right) {
                return numberValue(store[left] && store[left].updatedAt, 0) - numberValue(store[right] && store[right].updatedAt, 0);
            });
            keys.slice(0, keys.length - 80).forEach(function (oldKey) { delete store[oldKey]; });
        }
        writeDetailMemory(store);
        diagnostic('detail.episode.remember', {
            key: key,
            season: coordinates.season,
            episode: coordinates.episode,
            reason: reason || ''
        });
        return true;
    }

    function collectEpisodes(value, result, depth) {
        if (depth > 5 || value === null || value === undefined) return;
        if (Array.isArray(value)) {
            value.forEach(function (item) { collectEpisodes(item, result, depth + 1); });
            return;
        }
        if (typeof value !== 'object') return;
        if (episodeCoordinates(value)) {
            result.push(value);
            return;
        }
        ['episodes_original', 'episodes', 'results', 'items'].forEach(function (key) {
            if (value[key] !== undefined) collectEpisodes(value[key], result, depth + 1);
        });
    }

    function seriesEpisodesFromData(data) {
        var collected = [];
        collectEpisodes(data && data.episodes, collected, 0);
        var unique = {};
        return collected.filter(function (episode) {
            var coordinates = episodeCoordinates(episode);
            if (!coordinates) return false;
            var key = coordinates.season + ':' + coordinates.episode;
            if (unique[key]) return false;
            unique[key] = true;
            return true;
        }).sort(function (left, right) {
            var a = episodeCoordinates(left);
            var b = episodeCoordinates(right);
            return a.season === b.season ? a.episode - b.episode : a.season - b.season;
        });
    }

    function episodeAirTimestamp(episode) {
        if (!episode || !episode.air_date) return 0;
        var parsed = new Date(String(episode.air_date).replace(/-/g, '/')).getTime();
        return isFinite(parsed) ? parsed : 0;
    }

    function episodeIsAvailable(episode) {
        if (!episode || episode.comeing) return false;
        var timestamp = episodeAirTimestamp(episode);
        return !timestamp || timestamp <= (Date.now ? Date.now() : new Date().getTime());
    }

    function episodeTimeline(card, episode) {
        var coordinates = episodeCoordinates(episode);
        var road = { percent: 0, time: 0, duration: 0 };
        if (!coordinates) return road;
        try {
            if (window.Lampa && Lampa.Timeline && typeof Lampa.Timeline.watchedEpisode === 'function') {
                var current = Lampa.Timeline.watchedEpisode(card, coordinates.season, coordinates.episode, true);
                if (current && typeof current === 'object') {
                    road.percent = numberValue(current.percent, 0);
                    road.time = numberValue(current.time, 0);
                    road.duration = numberValue(current.duration, 0);
                    return road;
                }
            }
        } catch (error) {
            diagnostic('detail.timeline.error', { message: String(error && error.message || error) }, 'warn');
        }
        var embedded = episode.timeline || episode.view || null;
        if (embedded && typeof embedded === 'object') {
            road.percent = numberValue(embedded.percent, 0);
            road.time = numberValue(embedded.time, 0);
            road.duration = numberValue(embedded.duration, 0);
        }
        return road;
    }

    function episodeHint(card) {
        if (!card) return null;
        return episodeCoordinates(card.episode && typeof card.episode === 'object' ? card.episode : card);
    }

    function resolveSeriesPlayback(data) {
        var card = data && data.movie ? data.movie : activeDetailCard;
        var episodes = seriesEpisodesFromData(data);
        var available = episodes.filter(episodeIsAvailable);
        var upcoming = episodes.filter(function (episode) { return !episodeIsAvailable(episode); });
        var entries = available.map(function (episode) {
            return { episode: episode, timeline: episodeTimeline(card, episode) };
        });
        var current = null;
        var hint = episodeHint(card);
        if (hint) {
            current = entries.find(function (entry) {
                var coordinates = episodeCoordinates(entry.episode);
                return coordinates.season === hint.season && coordinates.episode === hint.episode && entry.timeline.percent < 60;
            }) || null;
        }
        if (!current) {
            var partial = entries.filter(function (entry) { return entry.timeline.percent > 0 && entry.timeline.percent < 60; });
            if (partial.length) current = partial[partial.length - 1];
        }
        if (!current) {
            var lastWatchedIndex = -1;
            entries.forEach(function (entry, index) {
                if (entry.timeline.percent >= 60) lastWatchedIndex = index;
            });
            current = entries.find(function (entry, index) { return index > lastWatchedIndex && entry.timeline.percent < 60; }) || null;
        }
        var allWatched = !!entries.length && entries.every(function (entry) { return entry.timeline.percent >= 60; });
        if (!current && entries.length) current = entries[allWatched ? entries.length - 1 : 0];
        var currentIndex = current ? entries.indexOf(current) : -1;
        var next = currentIndex >= 0 ? entries.slice(currentIndex + 1).find(function (entry) { return entry.timeline.percent < 60; }) || null : null;
        return {
            card: card,
            episodes: episodes,
            available: entries,
            current: current,
            next: next,
            upcoming: upcoming.length ? upcoming[0] : null,
            allWatched: allWatched,
            status: !episodes.length ? 'empty' : !entries.length ? 'upcoming' : allWatched ? 'complete' : 'ready'
        };
    }

    function padEpisodeNumber(value) {
        var text = String(value);
        return text.length < 2 ? '0' + text : text;
    }

    function formatEpisodeTitle(episode) {
        var coordinates = episodeCoordinates(episode);
        if (!coordinates) return '';
        var label = 'S' + padEpisodeNumber(coordinates.season) + ' E' + padEpisodeNumber(coordinates.episode);
        var name = episode && episode.name ? String(episode.name) : '';
        return name ? label + ' · ' + name : label;
    }

    function formatRemainingTime(timeline) {
        if (!timeline || !timeline.duration || timeline.duration <= timeline.time) return '';
        var seconds = Math.max(0, timeline.duration - timeline.time);
        var minutes = Math.max(1, Math.round(seconds / 60));
        if (minutes < 60) return 'осталось ' + minutes + ' мин';
        var hours = Math.floor(minutes / 60);
        var rest = minutes % 60;
        return 'осталось ' + hours + ' ч' + (rest ? ' ' + rest + ' мин' : '');
    }

    function latestPlaybackButton(root) {
        if (!root || !root.querySelector) return null;
        return root.querySelector('.full-start-new__buttons .button--priority:not(.hide):not(.lmui-series-primary)') ||
            root.querySelector('.full-start-new__buttons .button--play:not(.hide):not(.lmui-series-primary)');
    }

    function bindDetailAction(node, handler) {
        var lastRunAt = 0;
        function run(event) {
            var timestamp = Date.now ? Date.now() : new Date().getTime();
            if (timestamp - lastRunAt < 260) return;
            lastRunAt = timestamp;
            if (event && event.preventDefault) event.preventDefault();
            if (event && event.stopImmediatePropagation) event.stopImmediatePropagation();
            handler(event);
        }
        if (window.$) $(node).on('hover:enter.lmui', run);
        node.addEventListener('click', run);
    }

    function makeDetailButton(className, label) {
        var button = document.createElement('div');
        button.className = 'full-start__button selector ' + className;
        button.setAttribute('role', 'button');
        button.setAttribute('tabindex', '0');
        button.setAttribute('aria-label', label);
        var text = document.createElement('span');
        text.className = 'lmui-detail-action__label';
        text.textContent = label;
        button.appendChild(text);
        return button;
    }

    function openEpisodesScreen(card) {
        if (!card) return false;
        var memory = readEpisodeMemory(card);
        var payload = {
            component: 'episodes',
            title: window.Lampa && Lampa.Lang && typeof Lampa.Lang.translate === 'function' ? Lampa.Lang.translate('title_episodes') : 'Эпизоды',
            card: card,
            source: card.source || storageGet('source', 'tmdb'),
            page: 1
        };
        if (memory && memory.season) payload.season = memory.season;
        try {
            if (window.Lampa && Lampa.Activity && typeof Lampa.Activity.push === 'function') {
                Lampa.Activity.push(payload);
                diagnostic('detail.episodes.open', { key: detailKey(card), season: payload.season || 0, method: 'activity' });
                return true;
            }
            if (window.Lampa && Lampa.Router && typeof Lampa.Router.call === 'function') {
                Lampa.Router.call('episodes', card);
                diagnostic('detail.episodes.open', { key: detailKey(card), season: payload.season || 0, method: 'router' });
                return true;
            }
        } catch (error) {
            diagnostic('detail.episodes.open_error', { message: String(error && error.message || error) }, 'error');
        }
        return false;
    }

    function seriesStateSignature(state, source) {
        function coordinates(entry) {
            var value = entry && entry.episode ? episodeCoordinates(entry.episode) : episodeCoordinates(entry);
            return value ? value.season + ':' + value.episode : '-';
        }
        var sourceType = source && source.classList && source.classList.contains('button--priority') ? 'priority' : source ? 'play' : 'none';
        return [
            state.status,
            state.episodes.length,
            coordinates(state.current),
            state.current ? Math.round(numberValue(state.current.timeline.percent, 0)) : 0,
            state.current ? Math.round(numberValue(state.current.timeline.time, 0)) : 0,
            coordinates(state.next),
            coordinates(state.upcoming),
            sourceType
        ].join('|');
    }

    function renderSeriesSummary(root, data) {
        if (!root || !root.querySelector) return null;
        var card = data && data.movie ? data.movie : activeDetailCard;
        if (mediaType(card) !== 'tv') return null;
        var start = root.querySelector('.full-start-new');
        var buttons = root.querySelector('.full-start-new__buttons');
        if (!start || !buttons) return null;
        var right = root.querySelector('.full-start-new__right') || buttons.parentNode;
        if (!right) return null;

        var state = resolveSeriesPlayback(data || activeDetailData || { movie: card });
        var source = latestPlaybackButton(root);
        var signature = seriesStateSignature(state, source);
        var existingSummary = root.querySelector('.lmui-series-summary');
        var expectedPrimary = !!(source && state.current && state.status !== 'upcoming' && state.status !== 'empty');
        var existingPrimary = !!root.querySelector('.lmui-series-primary');
        if (existingSummary && existingSummary.getAttribute('data-lmui-series-signature') === signature && existingPrimary === expectedPrimary) return state;

        var restoreAction = root.querySelector('.lmui-series-primary.focus') ? 'primary' : root.querySelector('.lmui-all-episodes.focus') ? 'episodes' : '';
        Array.prototype.slice.call(root.querySelectorAll('.lmui-series-summary, .lmui-series-primary, .lmui-all-episodes')).forEach(function (node) {
            if (node && node.parentNode) node.parentNode.removeChild(node);
        });
        Array.prototype.slice.call(root.querySelectorAll('.lmui-source-action')).forEach(function (node) { node.classList.remove('lmui-source-action'); });
        source = latestPlaybackButton(root);

        var summary = document.createElement('section');
        summary.setAttribute('data-lmui-series-signature', signature);
        summary.className = 'lmui-series-summary';
        summary.setAttribute('aria-label', 'Продолжение сериала');
        var eyebrow = document.createElement('div');
        eyebrow.className = 'lmui-series-summary__eyebrow';
        eyebrow.textContent = state.status === 'complete' ? 'Просмотрено' : state.status === 'upcoming' ? 'Ожидается' : 'Сейчас смотрите';
        var title = document.createElement('div');
        title.className = 'lmui-series-summary__title';
        var meta = document.createElement('div');
        meta.className = 'lmui-series-summary__meta';
        var next = document.createElement('div');
        next.className = 'lmui-series-summary__next';

        if (state.status === 'empty') {
            title.textContent = 'Эпизоды пока недоступны';
            meta.textContent = 'Откройте полный список позже или выберите источник просмотра.';
        } else if (state.status === 'upcoming') {
            title.textContent = state.upcoming ? formatEpisodeTitle(state.upcoming) : 'Новые серии ещё не вышли';
            meta.textContent = state.upcoming && state.upcoming.air_date ? 'Дата выхода: ' + state.upcoming.air_date : 'Дата выхода пока не указана.';
        } else if (state.status === 'complete') {
            title.textContent = 'Все доступные серии просмотрены';
            meta.textContent = state.current ? 'Последняя: ' + formatEpisodeTitle(state.current.episode) : '';
        } else if (state.current) {
            title.textContent = formatEpisodeTitle(state.current.episode);
            var progressCopy = [];
            if (state.current.timeline.percent > 0) progressCopy.push(Math.round(state.current.timeline.percent) + '%');
            var remaining = formatRemainingTime(state.current.timeline);
            if (remaining) progressCopy.push(remaining);
            meta.textContent = progressCopy.length ? progressCopy.join(' · ') : 'Готово к просмотру';
            if (state.current.timeline.percent > 0) {
                var progress = document.createElement('div');
                progress.className = 'lmui-series-progress';
                var bar = document.createElement('i');
                bar.style.width = Math.max(0, Math.min(100, state.current.timeline.percent)) + '%';
                progress.appendChild(bar);
                summary.appendChild(progress);
            }
        }

        if (state.next) {
            next.textContent = 'Далее: ' + formatEpisodeTitle(state.next.episode);
        } else if (state.upcoming) {
            next.textContent = 'Следующая серия: ' + formatEpisodeTitle(state.upcoming) + (state.upcoming.air_date ? ' · ' + state.upcoming.air_date : '');
        } else if (state.status === 'complete') {
            next.textContent = 'Новая серия появится здесь после выхода.';
        }

        summary.insertBefore(eyebrow, summary.firstChild);
        summary.insertBefore(title, summary.children[1] || null);
        summary.insertBefore(meta, summary.children[2] || null);
        if (next.textContent) summary.appendChild(next);
        var summaryHost = buttons.parentNode || right;
        summaryHost.insertBefore(summary, buttons);

        if (source && state.current && state.status !== 'upcoming' && state.status !== 'empty') {
            var coordinates = episodeCoordinates(state.current.episode);
            var primaryLabel = state.status === 'complete'
                ? 'Смотреть сериал'
                : (state.current.timeline.percent > 0 ? 'Продолжить ' : 'Смотреть ') +
                    'S' + padEpisodeNumber(coordinates.season) + ' E' + padEpisodeNumber(coordinates.episode);
            var primary = makeDetailButton('lmui-series-primary lmui-primary-action', primaryLabel);
            primary.setAttribute('data-season', coordinates.season);
            primary.setAttribute('data-episode', coordinates.episode);
            source.classList.add('lmui-source-action');
            bindDetailAction(primary, function () {
                rememberEpisodeSelection(card, state.current.episode, 'primary');
                var latest = latestPlaybackButton(root);
                diagnostic('detail.series.play', {
                    key: detailKey(card),
                    season: coordinates.season,
                    episode: coordinates.episode,
                    sourceFound: !!latest
                });
                if (!latest) return;
                try {
                    if (window.$) $(latest).trigger('hover:enter');
                    else latest.click();
                } catch (error) {
                    diagnostic('detail.series.play_error', { message: String(error && error.message || error) }, 'error');
                }
            });
            buttons.insertBefore(primary, buttons.firstChild);
        }

        var allEpisodes = makeDetailButton('lmui-all-episodes', 'Все эпизоды');
        bindDetailAction(allEpisodes, function () { openEpisodesScreen(card); });
        var primaryNode = buttons.querySelector('.lmui-series-primary');
        if (primaryNode) {
            if (primaryNode.nextSibling) buttons.insertBefore(allEpisodes, primaryNode.nextSibling);
            else buttons.appendChild(allEpisodes);
        } else buttons.insertBefore(allEpisodes, buttons.firstChild);

        if (restoreAction && window.$ && Lampa.Controller && typeof Lampa.Controller.collectionFocus === 'function') {
            var restoreNode = restoreAction === 'primary' ? buttons.querySelector('.lmui-series-primary') : allEpisodes;
            if (restoreNode) {
                try { Lampa.Controller.collectionFocus($(restoreNode), $(root), true); }
                catch (error) { diagnostic('detail.series.focus_restore_error', { message: String(error && error.message || error) }, 'warn'); }
            }
        }

        diagnostic('detail.series.render', {
            key: detailKey(card),
            status: state.status,
            episodes: state.episodes.length,
            available: state.available.length,
            current: state.current ? episodeCoordinates(state.current.episode) : null,
            next: state.next ? episodeCoordinates(state.next.episode) : null,
            sourceFound: !!source
        });
        return state;
    }

    function episodeNodeData(node) {
        if (!node) return null;
        var data = cardData(node);
        if (data) return data;
        try {
            if (window.$) {
                data = $(node).data('json') || $(node).data('item') || $(node).data('card');
                if (data && typeof data === 'object') return data;
            }
        } catch (error) {}
        return null;
    }

    function findEpisodeNode(root, memory) {
        if (!root || !memory || !root.querySelectorAll) return null;
        var candidates = root.querySelectorAll('.full-episode, .season-episode, .card-episode, .selector');
        for (var index = 0; index < candidates.length; index += 1) {
            var data = episodeNodeData(candidates[index]);
            var coordinates = episodeCoordinates(data);
            if (coordinates && coordinates.season === Number(memory.season) && coordinates.episode === Number(memory.episode)) return candidates[index];
        }
        return null;
    }

    function restoreEpisodeFocus(root, card, reason, forceFocus) {
        var memory = readEpisodeMemory(card);
        if (!root || !memory) return false;
        var node = findEpisodeNode(root, memory);
        if (!node) return false;
        Array.prototype.slice.call(root.querySelectorAll('.lmui-episode-remembered')).forEach(function (item) { item.classList.remove('lmui-episode-remembered'); });
        node.classList.add('lmui-episode-remembered');
        var focused = root.querySelector('.selector.focus');
        var shouldFocus = forceFocus || episodeRestorePending || !focused;
        if (shouldFocus && window.$ && Lampa.Controller && typeof Lampa.Controller.collectionFocus === 'function') {
            try {
                Lampa.Controller.collectionFocus($(node), $(root), true);
                episodeRestorePending = false;
            }
            catch (error) { diagnostic('detail.episode.restore_error', { message: String(error && error.message || error) }, 'warn'); }
        }
        diagnostic('detail.episode.restore', {
            key: detailKey(card),
            season: memory.season,
            episode: memory.episode,
            reason: reason || '',
            focused: shouldFocus
        });
        return true;
    }

    function stopEpisodeFocusObserver() {
        if (episodeFocusObserver) {
            try { episodeFocusObserver.disconnect(); } catch (error) {}
            episodeFocusObserver = null;
        }
        clearTimeout(episodeFocusObserverTimer);
        episodeFocusObserverTimer = 0;
    }

    function observeEpisodeFocus(root, card, reason) {
        stopEpisodeFocusObserver();
        if (!root || !card || !window.MutationObserver) return restoreEpisodeFocus(root, card, reason, false);
        if (restoreEpisodeFocus(root, card, reason, false)) return true;
        episodeFocusObserver = new MutationObserver(function () {
            if (restoreEpisodeFocus(root, card, reason + '-mutation', false)) stopEpisodeFocusObserver();
        });
        episodeFocusObserver.observe(root, { childList: true, subtree: true });
        episodeFocusObserverTimer = setTimeout(function () {
            diagnostic('detail.episode.restore_timeout', { key: detailKey(card), reason: reason || '' }, 'warn');
            stopEpisodeFocusObserver();
        }, 1600);
        return false;
    }

    function decorateEpisodeComponent(event) {
        if (!event || event.name !== 'episodes' || !event.item) return;
        var root = null;
        try { root = event.item.render(true); } catch (error) {}
        if (!root || !root.querySelectorAll) return;
        var card = event.data && event.data.movie ? event.data.movie : activeDetailCard;
        var memory = readEpisodeMemory(card);
        var node = findEpisodeNode(root, memory);
        if (node) {
            node.classList.add('lmui-episode-remembered');
            try { event.item.last = node; } catch (error) {}
        }
        diagnostic('detail.episodes.row', { key: detailKey(card), remembered: !!node, count: root.querySelectorAll('.selector').length });
    }

    function decorateDetailFromFullEvent(event) {
        if (!event) return;
        var root = event.body && event.body[0] ? event.body[0] : activeActivityRoot();
        if (event.type === 'start') {
            detailGeneration += 1;
            activeDetailData = event.data || null;
            activeDetailCard = event.data && event.data.movie ? event.data.movie : event.object && (event.object.card || event.object) || null;
            activeDetailKey = detailKey(activeDetailCard);
            diagnostic('detail.start', { key: activeDetailKey, generation: detailGeneration, mediaType: mediaType(activeDetailCard) });
        }
        if (event.type === 'complite') {
            activeDetailData = event.data || activeDetailData;
            activeDetailCard = event.data && event.data.movie ? event.data.movie : activeDetailCard;
            activeDetailKey = detailKey(activeDetailCard);
            decorateDetail(root, activeDetailData, true);
        }
        if (event.type === 'build') decorateEpisodeComponent(event);
    }

    function decoratePrimaryAction(root) {
        var scope = root || document;
        Array.prototype.slice.call(scope.querySelectorAll('.lmui-primary-action')).forEach(function (button) {
            if (!button.classList.contains('lmui-series-primary')) button.classList.remove('lmui-primary-action');
        });
        var activity = scope.matches && scope.matches('.activity--active') ? scope : scope.querySelector && scope.querySelector('.activity--active');
        var searchScope = activity || scope;
        var custom = searchScope.querySelector('.full-start-new__buttons .lmui-series-primary');
        var priority = searchScope.querySelector('.full-start-new__buttons .button--priority:not(.hide):not(.lmui-source-action)');
        var play = searchScope.querySelector('.full-start-new__buttons .button--play:not(.hide):not(.lmui-source-action)');
        var button = custom || priority || play;
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

    function decorateDetail(root, data, force) {
        var scope = root || document;
        var detailContent = scope.matches && scope.matches('.full-start-new') ? scope : scope.querySelector && scope.querySelector('.full-start-new');
        if (!detailContent) return;
        var activity = detailContent.closest ? detailContent.closest('.activity') : null;
        if (!activity) activity = scope.matches && scope.matches('.activity') ? scope : activeActivityRoot();
        if (!activity) activity = scope;
        if (!force && activeComponent() !== 'full') return;
        activity.classList.add('lmui-detail-screen');
        activity.classList.remove('lmui-detail-series', 'lmui-detail-no-backdrop', 'lmui-detail-title-long');
        var active = activeActivity();
        var card = data && data.movie ? data.movie : activeDetailCard || active && (active.card || active.object && active.object.card || active.object);
        if (card) {
            activeDetailCard = card;
            activeDetailKey = detailKey(card);
        }
        var title = detailContent.querySelector('.full-start-new__title');
        if (title && String(title.textContent || '').trim().length > 32) activity.classList.add('lmui-detail-title-long');
        if (!scope.querySelector('.full-start__background, .full-start-new__background')) activity.classList.add('lmui-detail-no-backdrop');
        if (mediaType(card) === 'tv') {
            activity.classList.add('lmui-detail-series');
            renderSeriesSummary(scope, data || activeDetailData || { movie: card });
        } else {
            Array.prototype.slice.call(scope.querySelectorAll('.lmui-series-summary, .lmui-series-primary, .lmui-all-episodes')).forEach(function (node) {
                if (node && node.parentNode) node.parentNode.removeChild(node);
            });
            Array.prototype.slice.call(scope.querySelectorAll('.lmui-source-action')).forEach(function (node) { node.classList.remove('lmui-source-action'); });
        }
        decoratePrimaryAction(scope);
        tryFocusPrimaryAction(activity);
    }

    function searchScreen() {
        var main = document.querySelector('.main-search');
        if (main) return main;
        var opened = document.querySelector('body.search--open .search');
        if (opened) return opened.parentElement || opened;
        return document.querySelector('.activity--active .search');
    }

    function searchRoot() {
        var screen = searchScreen();
        if (!screen) return null;
        if (screen.matches && screen.matches('.search')) return screen;
        return screen.querySelector('.search') || screen.querySelector('.search-box') || screen;
    }

    function readSearchQuery(root) {
        if (!root) return '';
        var input = root.querySelector('input.simple-keyboard-input, input.search__input, input[type="search"], input[type="text"]');
        var value = input && input.value !== undefined ? input.value : '';
        value = String(value || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
        if (/^(поиск|search|введите текст)(\.\.\.)?$/i.test(value)) return '';
        if (value) return value;
        var display = root.querySelector('.search__input:not(input)');
        if (!display || display.style && display.style.display === 'none' || !display.classList.contains('filled')) return '';
        value = String(display.textContent || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
        return /^(поиск|search|введите текст)(\.\.\.)?$/i.test(value) ? '' : value;
    }

    function activeSearchSource(screen) {
        return screen && screen.querySelector('.search-source.active') || null;
    }

    function searchResultCount(screen) {
        if (!screen) return 0;
        var activeSource = activeSearchSource(screen);
        var countNode = activeSource && activeSource.querySelector('.search-source__count');
        var parsed = countNode ? parseInt(String(countNode.textContent || '').replace(/\D+/g, ''), 10) : NaN;
        if (isFinite(parsed)) return parsed;
        var resultsRoot = screen.querySelector('.search__results');
        return resultsRoot ? resultsRoot.querySelectorAll('.card, .search-item, .explorer-card').length : 0;
    }

    function removeLegacySearchChrome(screen) {
        Array.prototype.slice.call(screen.querySelectorAll('.lmui-search-summary, .lmui-search-help')).forEach(function (node) {
            if (node && node.parentNode) node.parentNode.removeChild(node);
        });
    }

    function decorateSearch() {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
            var root = searchRoot();
            var screen = searchScreen();
            if (!root || !screen) return;
            var startedAt = window.performance && typeof performance.now === 'function' ? performance.now() : Date.now();
            screen.classList.add('lmui-search-screen');
            removeLegacySearchChrome(screen);
            var query = readSearchQuery(root);
            var rawCount = searchResultCount(screen);
            var count = query.length >= 3 ? rawCount : 0;
            var loading = query.length >= 3 && !!screen.querySelector('.search-source--loading, .search-looking, .content-loading, .loading-layer');
            var state = !query ? 'landing' : query.length < 3 ? 'typing' : loading ? 'loading' : count ? 'results' : 'empty';
            screen.setAttribute('data-lmui-search-state', state);
            screen.setAttribute('data-lmui-search-query-length', String(query.length));
            screen.setAttribute('data-lmui-search-count', String(count));
            var history = screen.querySelector('.search__history');
            if (history) {
                var hasHistory = !!history.querySelector('.search-history-key, .selector:not(.search-history-empty)');
                history.classList.toggle('lmui-search-history-empty', !hasHistory);
            }
            var source = activeSearchSource(screen);
            var sourceName = source ? String(source.querySelector('.search-source__tab') && source.querySelector('.search-source__tab').textContent || '').replace(/\s+/g, ' ').trim() : '';
            var signature = state + ':' + query.length + ':' + count + ':' + sourceName;
            if (lastSearchState !== signature) {
                lastSearchState = signature;
                diagnostic('search.state', {
                    state: state,
                    queryLength: query.length,
                    count: count,
                    source: sourceName,
                    durationMs: Math.round(((window.performance && typeof performance.now === 'function' ? performance.now() : Date.now()) - startedAt) * 10) / 10
                });
            }
        }, 55);
    }

    function observeSearchDom() {
        if (!window.MutationObserver) return;
        var screen = searchScreen();
        if (!screen) return;
        if (searchObserver) searchObserver.disconnect();
        searchObserver = new MutationObserver(function () { decorateSearch(); });
        searchObserver.observe(screen, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
        decorateSearch();
    }

    function closeSearchObserver() {
        if (searchObserver) searchObserver.disconnect();
        searchObserver = null;
        clearTimeout(searchSourcesTimer);
        searchSourcesTimer = 0;
        searchSourcesBridge = null;
        searchScheduledValue = '';
        searchResultSignatures = {};
        lastSearchState = '';
    }

    function optimizeSearchSources(sources) {
        if (!sources || typeof sources.search !== 'function' || sources.__lmuiOptimizedSearch) return;
        sources.__lmuiOptimizedSearch = true;
        searchSourcesBridge = sources;
        var originalSearch = sources.search;
        var originalCancel = typeof sources.cancel === 'function' ? sources.cancel : null;
        sources.search = function (query, immediately) {
            var context = this;
            var value = String(query || '');
            searchRequestGeneration++;
            if (value.length < 3 && !immediately) {
                clearTimeout(searchSourcesTimer);
                searchSourcesTimer = 0;
                searchScheduledValue = '';
                diagnostic('search.request.clear', { queryLength: value.length });
                return originalSearch.call(context, value, true);
            }
            if (immediately) {
                clearTimeout(searchSourcesTimer);
                searchSourcesTimer = 0;
                searchScheduledValue = '';
                diagnostic('search.request.immediate', { queryLength: value.length, explicit: true });
                return originalSearch.call(context, value, true);
            }
            if (searchSourcesTimer && searchScheduledValue === value) {
                if (diagnosticsVerbose) diagnostic('search.request.coalesced', { queryLength: value.length });
                return;
            }
            clearTimeout(searchSourcesTimer);
            searchScheduledValue = value;
            diagnostic('search.request.scheduled', { queryLength: value.length, delayMs: 420 });
            searchSourcesTimer = setTimeout(function () {
                searchSourcesTimer = 0;
                searchScheduledValue = '';
                diagnostic('search.request.start', { queryLength: value.length });
                originalSearch.call(context, value, true);
                decorateSearch();
            }, 420);
        };
        if (originalCancel) {
            sources.cancel = function () {
                clearTimeout(searchSourcesTimer);
                searchSourcesTimer = 0;
                searchScheduledValue = '';
                return originalCancel.apply(this, arguments);
            };
        }
        if (sources.listener && typeof sources.listener.follow === 'function') {
            sources.listener.follow('finded', function (event) {
                var root = searchRoot();
                var currentLength = root ? readSearchQuery(root).length : 0;
                var sourceName = event && event.source && event.source.title || '';
                var count = event && Number(event.count) || 0;
                var signature = [searchRequestGeneration, count].join(':');
                if (currentLength >= 3 && searchResultSignatures[sourceName] !== signature) {
                    searchResultSignatures[sourceName] = signature;
                    diagnostic('search.results', { source: sourceName, count: count, queryLength: currentLength, generation: searchRequestGeneration });
                } else if (diagnosticsVerbose && currentLength < 3) {
                    diagnostic('search.results.hidden_cache', { source: sourceName, count: count, queryLength: currentLength });
                }
                decorateSearch();
            });
            sources.listener.follow('toggle', decorateSearch);
            sources.listener.follow('create', decorateSearch);
        }
        diagnostic('search.sources.optimized', { debounceMs: 420, minimumQueryLength: 3 });
    }

    function searchControllerHealthy() {
        var enabled = diagnosticController();
        var expected = ['search', 'keybord', 'search_history', 'search_sources', 'search_results', 'content'];
        var screen = searchScreen();
        var focused = screen && screen.querySelector('.selector.focus, input:focus, textarea:focus');
        return !!(screen && focused && expected.indexOf(enabled.name) >= 0);
    }

    function recoverSearchFocus(reason) {
        var screen = searchScreen();
        if (!screen || !window.Lampa || !Lampa.Controller || typeof Lampa.Controller.toggle !== 'function') return false;
        if (searchControllerHealthy()) return true;
        diagnostic('search.controller.recover', { reason: reason || '', before: diagnosticController() }, 'warn');
        try {
            Lampa.Controller.toggle('search');
            setTimeout(function () {
                diagnostic('search.controller.recovered', { reason: reason || '', healthy: searchControllerHealthy(), after: diagnosticController() });
            }, 30);
            return true;
        } catch (error) {
            diagnostic('search.controller.recover_error', { reason: reason || '', message: String(error && error.message || error) }, 'error');
            return false;
        }
    }

    function installSearchHooks() {
        if (!window.Lampa || !Lampa.Search || !Lampa.Search.listener || typeof Lampa.Search.listener.follow !== 'function') {
            diagnostic('search.hooks.unavailable', null, 'warn');
            return false;
        }
        if (Lampa.Search.__lmuiHooksInstalled) return true;
        Lampa.Search.__lmuiHooksInstalled = true;
        Lampa.Search.listener.follow('open', function () {
            diagnostic('search.open', { controller: diagnosticController() });
            setTimeout(observeSearchDom, 0);
            setTimeout(decorateSearch, 80);
        });
        Lampa.Search.listener.follow('close', function () {
            diagnostic('search.close', { controller: diagnosticController() });
            closeSearchObserver();
        });
        Lampa.Search.listener.follow('sources', function (event) {
            optimizeSearchSources(event && event.sources);
            setTimeout(observeSearchDom, 0);
        });
        return true;
    }

    function decorateContinueCards(root) {
        var scope = root && root.querySelectorAll ? root : document;
        var cards = [];
        if (root && root.classList && root.classList.contains('card')) cards.push(root);
        try { cards = cards.concat(Array.prototype.slice.call(scope.querySelectorAll('.card'))); } catch (error) {}
        cards.forEach(function (card) {
            var data = cardData(card);
            if (!data || !data.lmui_continue_source) return;
            card.classList.add('lmui-continue-card', 'lmui-continue-card--' + data.lmui_continue_source);
            var line = card.closest && card.closest('.items-line');
            if (line) line.setAttribute('data-lmui-row', 'continue');
            var view = card.querySelector('.card__view');
            if (!view || view.querySelector('.lmui-continue-badge')) return;
            var badge = document.createElement('div');
            badge.className = 'lmui-continue-badge';
            badge.textContent = data.lmui_continue_label || 'Продолжить';
            view.appendChild(badge);
        });
    }

    function decorateNode(root) {
        if (!root || root.nodeType !== 1) return;
        var component = activeComponent();
        if (component === 'main') decorateContinueCards(root.closest && root.closest('.activity--active') || root);
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
        var component = activeComponent();
        if (component === 'episodes') episodeRestorePending = false;
        if (component !== 'full') return;
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
            $(document).on('input.lmui change.lmui keyup.lmui', '.search__input, .simple-keyboard-input, .search-box input', decorateSearch);
            $(document).on('hover:focus.lmui hover:enter.lmui click.lmui', '.full-episode, .season-episode, .card-episode', function (event) {
                var episode = episodeNodeData(this);
                var active = activeActivity();
                var card = activeDetailCard || active && (active.card || active.object && active.object.card || active.object);
                rememberEpisodeSelection(card, episode, event && event.type || 'interaction');
            });
        } catch (error) {
            console.warn('[Lampa Modern UI] interaction handlers failed:', error);
        }
    }

    function addSettings() {
        var icon = '<svg viewBox="0 0 32 32" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="5" width="24" height="22" rx="7" stroke="currentColor" stroke-width="2"/><path d="M9 19.5 13.2 15l3.3 3.1L23 11.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="23" cy="11.5" r="2" fill="currentColor"/></svg>';
        Lampa.SettingsApi.addComponent({ component: PLUGIN_ID, name: 'Интерфейс', icon: icon });
        Lampa.SettingsApi.addParam({ component: PLUGIN_ID, param: { name: KEYS.enabled, type: 'trigger', default: true }, field: { name: 'Новый интерфейс', description: 'Единое оформление карточек, поиска, фильма и настроек. Штатная главная не заменяется.' }, onChange: function () { applyTheme(); scheduleDecorate(); scheduleHomeRefresh('ui-enabled', 20); } });
        Lampa.SettingsApi.addParam({ component: PLUGIN_ID, param: { name: KEYS.density, type: 'select', values: { comfortable: 'Комфортно', compact: 'Компактно' }, default: 'comfortable' }, field: { name: 'Размер карточек', description: 'Компактный режим показывает больше контента в строке.' }, onChange: applyTheme });
        Lampa.SettingsApi.addParam({ component: PLUGIN_ID, param: { name: KEYS.motion, type: 'select', values: { calm: 'Плавно', minimal: 'Без анимаций' }, default: 'calm' }, field: { name: 'Движение', description: 'Отключает декоративные переходы, сохраняя состояния фокуса.' }, onChange: applyTheme });
        Lampa.SettingsApi.addParam({ component: PLUGIN_ID, param: { name: KEYS.performance, type: 'select', values: { standard: 'Обычный', lite: 'Экономный' }, default: 'standard' }, field: { name: 'Производительность', description: 'Экономный режим отключает динамический фон и тяжёлые тени.' }, onChange: applyTheme });
    }

    function enforceShotsOff(reason) {
        window.plugin_shots_ready = true;
        storageSet('shots_in_player', false);
        storageSet('shots_in_card', false);
        storageSet('content_rows_shots_main', false);
        storageSet('shots_enabled', false);
        try {
            if (Lampa.SettingsApi && typeof Lampa.SettingsApi.removeComponent === 'function') Lampa.SettingsApi.removeComponent('shots');
        } catch (error) {
            diagnostic('shots.settings_remove_error', { message: String(error && error.message || error) }, 'warn');
        }
        var removed = 0;
        try {
            Array.prototype.slice.call(document.querySelectorAll([
                '[data-action="shots"]',
                '[data-component="shots"]',
                '#sprite-shots',
                '.shots-lenta',
                '.shots-player-button',
                '.shots-player-recorder',
                '.shots-slides',
                '.shots-video-present'
            ].join(','))).forEach(function (node) {
                if (!node || !node.parentNode) return;
                if (typeof node.remove === 'function') node.remove();
                else if (node.parentNode && typeof node.parentNode.removeChild === 'function') node.parentNode.removeChild(node);
                removed += 1;
            });
        } catch (error) {}
        diagnostic('shots.enforce', {
            reason: reason || '',
            removedNodes: removed,
            guard: clone(window.__LMUI_SHOTS_STATE__ || {})
        });
    }

    function destructiveCleanup() {
        if (boolValue(storageGet(CLEANUP_KEY, false), false)) return;
        storageSet('lpersonal_profile_v1', '');
        storageSet('content_rows_lpersonal_home', false);
        storageSet('content_rows_lmui_home', false);
        storageSet('content_rows_lmui_continue', true);
        storageSet('lpersonal_enabled', false);
        storageSet('lpersonal_card_panel', false);
        storageSet(CLEANUP_KEY, true);
    }

    function readyToStart() {
        return !!(document.head && document.body && window.Lampa && Lampa.Storage && Lampa.SettingsApi && Lampa.ContentRows && Lampa.Controller && Lampa.Router);
    }

    function followEvents() {
        if (!Lampa.Listener || typeof Lampa.Listener.follow !== 'function') return;
        Lampa.Listener.follow('activity', function (event) {
            if (!event) return;
            diagnostic('activity.event', { type: event.type, component: event.component || '', controller: diagnosticController() });
            if (event.type === 'start' || event.type === 'create') {
                setTimeout(function () {
                    observeActiveActivity();
                    scheduleDecorate();
                    if (event.component === 'main') decorateContinueCards(activeActivityRoot() || document);
                    if (event.component === 'settings') scheduleSettingsCleanupBurst();
                    if (event.component === 'episodes') {
                        episodeRestorePending = true;
                        var episodeActivity = activeActivity();
                        var episodeCard = episodeActivity && (episodeActivity.card || episodeActivity.object && episodeActivity.object.card || activeDetailCard);
                        observeEpisodeFocus(activeActivityRoot(), episodeCard, 'activity-' + event.type);
                    } else stopEpisodeFocusObserver();
                    enforceShotsOff('activity-' + (event.component || 'unknown'));
                }, 60);
            }
            if (event.type === 'archive') scheduleDecorate();
        });
        Lampa.Listener.follow('resize_end', function () {
            applyTheme();
            scheduleDecorate();
            var viewport = layoutViewport();
            var signature = [detectLayoutMode(), detectHeightMode(), viewport.width, viewport.height].join(':');
            if (signature !== lastLayoutSignature) {
                lastLayoutSignature = signature;
                diagnostic('layout.resize', { layout: detectLayoutMode(), height: detectHeightMode(), viewport: viewport });
            }
        });
        Lampa.Listener.follow('full', function (event) {
            if (!event) return;
            if (event.type === 'start') {
                detailNeedsInitialFocus = true;
                detailUserInteracted = false;
            }
            decorateDetailFromFullEvent(event);
            if (event.type === 'start' || event.type === 'complite' || event.type === 'build') scheduleDecorate(event.body && event.body[0]);
        });
        Lampa.Listener.follow('favorite', function () { scheduleHomeRefresh('favorite'); });
        Lampa.Listener.follow('state:changed', function (event) {
            if (!event || ['favorite', 'timetable', 'timeline'].indexOf(event.target) < 0) return;
            scheduleHomeRefresh('state-' + event.target, 80);
        });
        Lampa.Listener.follow('timeline', function () {
            scheduleHomeRefresh('timeline', 120);
            if (activeComponent() === 'full' && activeDetailData) {
                var root = activeActivityRoot();
                if (root) decorateDetail(root, activeDetailData, false);
            }
        });
        Lampa.Listener.follow('app', function (event) {
            if (event && event.type === 'ready') {
                diagnostic('app.ready', diagnosticSnapshot());
                enforceShotsOff('app-ready');
                installSettingsGuard();
                scheduleSettingsCleanupBurst();
                installSearchHooks();
            }
        });
        if (Lampa.Settings && Lampa.Settings.listener && typeof Lampa.Settings.listener.follow === 'function') {
            Lampa.Settings.listener.follow('open', function (event) {
                diagnostic('settings.open', { name: event && event.name || '', controller: diagnosticController() });
                if (event && event.body && event.body[0]) removeHiddenSettingsDom(event.body[0]);
                scheduleSettingsCleanupBurst();
            });
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
        exposeDiagnostics();
        diagnostic('start.begin', {
            userAgent: window.navigator && window.navigator.userAgent || '',
            viewport: layoutViewport(),
            platformTv: !!(Lampa.Platform && typeof Lampa.Platform.screen === 'function' && Lampa.Platform.screen('tv')),
            mouseClass: !!(document.body && document.body.classList.contains('mouse--controll'))
        });
        destructiveCleanup();
        injectStyle();
        enforceShotsOff('start');
        installSettingsGuard();
        removeHiddenSettingsComponents();
        try { if (Lampa.SettingsApi && typeof Lampa.SettingsApi.removeComponent === 'function') Lampa.SettingsApi.removeComponent('lampa_personal'); } catch (error) {}
        addSettings();
        removeHiddenSettingsComponents();
        registerContinueRow();
        applyTheme();
        installControllerDiagnostics();
        installInteractionHandlers();
        installInputModeListeners();
        installSearchHooks();
        observeSettingsDom();
        followEvents();
        observeActiveActivity();
        scheduleSettingsCleanupBurst();
        scheduleDecorate();
        scheduleHomeRefresh('continue-row-register', 120);
        if (window.__LMUI_TEST_MODE__) {
            window.__LMUI_TEST_API__ = {
                nativeContinueCards: nativeContinueCards,
                continueRowCallback: continueRowCallback,
                registerContinueRow: registerContinueRow,
                installContinueRouterGuard: installContinueRouterGuard,
                readSearchQuery: readSearchQuery,
                decorateSearch: decorateSearch,
                removeHiddenSettingsDom: removeHiddenSettingsDom,
                removeHiddenSettingsComponents: removeHiddenSettingsComponents,
                optimizeSearchSources: optimizeSearchSources,
                diagnosticSnapshot: diagnosticSnapshot,
                enforceShotsOff: enforceShotsOff,
                seriesEpisodesFromData: seriesEpisodesFromData,
                resolveSeriesPlayback: resolveSeriesPlayback,
                episodeCoordinates: episodeCoordinates,
                formatEpisodeTitle: formatEpisodeTitle
            };
        }
        window.addEventListener('orientationchange', function () { applyTheme(); scheduleDecorate(); }, { passive: true });
        diagnostic('start.ready', diagnosticSnapshot());
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();

    if (window.Lampa && Lampa.Listener && typeof Lampa.Listener.follow === 'function') {
        Lampa.Listener.follow('app', function (event) { if (event && event.type === 'ready') start(); });
    }
})();
