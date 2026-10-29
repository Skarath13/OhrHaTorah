import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const component = readFileSync(new URL('../components/islands/CongregationCalendar.astro', import.meta.url), 'utf8');
const loadStart = component.indexOf('const loadEvents = async () =>');
const loadEnd = component.indexOf("showMoreButton.addEventListener('click'", loadStart);
assert.ok(loadStart >= 0 && loadEnd > loadStart);

function control(document: { activeElement: unknown }, hidden = false) {
    return {
        hidden,
        textContent: '',
        attributes: new Map<string, string>(),
        listeners: new Map<string, (event?: unknown) => void>(),
        classList: { add() {}, remove() {} },
        setAttribute(key: string, value: string) { this.attributes.set(key, value); },
        addEventListener(key: string, listener: (event?: unknown) => void) { this.listeners.set(key, listener); },
        focus() { document.activeElement = this; },
    };
}

function calendar(fetch: (...args: any[]) => Promise<unknown>, initialGroups: unknown[] = []) {
    const document = { activeElement: null as unknown };
    const retryButton = control(document, true);
    const statusElement = control(document);
    const emptyElement = control(document);
    const eventButton = control(document);
    const calendarRoot = control(document);
    const scope = { document, retryButton, statusElement, emptyElement, calendarRoot,
        calendarElement: { querySelector: () => eventButton },
        URLSearchParams, AbortController, fetch, initialGroups,
        getBusinessDate: () => '2026-10-17', addDateDays: (start: string, days: number) => new Date(Date.parse(`${start}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10),
        maximumRequestDays: 90,
        groupEventsByDate: (events: unknown[]) => events,
    };
    const result = vm.runInNewContext(stripTypeScriptTypes(`(() => {
        let activeRequest = null;
        let hasCompleteResponse = false;
        let dateGroups = initialGroups;
        let defaultDateLimit = 3;
        let visibleDateLimit = 6;
        let renderCount = 0;
        const renderDateGroups = () => { renderCount++; emptyElement.hidden = dateGroups.length > 0; };
        ${component.slice(loadStart, loadEnd)}
        return { loadEvents, state: () => ({ dateGroups, visibleDateLimit, renderCount, activeRequest }) };
    })()`), scope);
    return { ...scope, ...result, eventButton };
}

const response = (events: unknown[], warning?: string) => ({
    ok: true,
    json: async () => ({ success: true, events, meta: { warning } }),
});

test('calendar failure offers a retry without claiming there are no events', async () => {
    const calendarUI = calendar(async () => { throw new TypeError('Failed to fetch'); });
    await calendarUI.loadEvents();
    assert.equal(calendarUI.retryButton.hidden, false);
    assert.equal(calendarUI.emptyElement.hidden, true);
    assert.match(calendarUI.statusElement.textContent, /could not be loaded/);
    assert.equal(calendarUI.calendarRoot.attributes.get('aria-busy'), 'false');
    assert.equal(calendarUI.retryButton.attributes.get('aria-disabled'), 'false');
});

test('a failed calendar refresh preserves the loaded dates and expanded list', async () => {
    const groups = [{ date: '2026-10-17' }, { date: '2026-10-24' }];
    const calendarUI = calendar(async () => { throw new TypeError('Offline'); }, groups);
    await calendarUI.loadEvents();
    assert.equal(calendarUI.state().dateGroups, groups);
    assert.equal(calendarUI.state().visibleDateLimit, 6);
    assert.equal(calendarUI.state().renderCount, 0);
    assert.match(calendarUI.statusElement.textContent, /Previously loaded dates are still shown/);
});

test('retry ignores duplicate activation and moves focus into recovered dates', async () => {
    let finish!: (value: unknown) => void;
    let requests = 0;
    const calendarUI = calendar(() => {
        requests++;
        return new Promise(resolve => { finish = resolve; });
    });
    calendarUI.retryButton.hidden = false;
    calendarUI.retryButton.focus();
    const retry = calendarUI.retryButton.listeners.get('click');
    assert.ok(retry, 'the rendered retry control has a handler');
    retry();
    retry();
    assert.equal(requests, 1);
    assert.equal(calendarUI.retryButton.attributes.get('aria-disabled'), 'true');
    assert.equal(calendarUI.document.activeElement, calendarUI.retryButton);
    finish(response([{ date: '2026-10-17' }]));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(calendarUI.retryButton.hidden, true);
    assert.equal(calendarUI.document.activeElement, calendarUI.eventButton);
    assert.equal(calendarUI.calendarRoot.attributes.get('aria-busy'), 'false');
});

test('a partial calendar response remains usable and can be retried', async () => {
    const calendarUI = calendar(async () => response([{ date: '2026-10-17' }], 'Congregation events are unavailable.'));
    await calendarUI.loadEvents();
    assert.equal(calendarUI.state().dateGroups.length, 1);
    assert.equal(calendarUI.retryButton.hidden, false);
    assert.equal(calendarUI.statusElement.textContent, 'Congregation events are unavailable.');
});

test('a superseded calendar response cannot overwrite the newer dates', async () => {
    let finishFirst!: (value: unknown) => void;
    let firstParsing!: () => void;
    const parsing = new Promise<void>(resolve => { firstParsing = resolve; });
    let requests = 0;
    const calendarUI = calendar(async () => ++requests === 1 ? {
        ok: true,
        json: () => new Promise(resolve => { finishFirst = resolve; firstParsing(); }),
    } : response([{ date: '2026-10-24' }]));
    const first = calendarUI.loadEvents();
    await parsing;
    await calendarUI.loadEvents();
    finishFirst({ success: true, events: [{ date: '2026-10-17' }] });
    await first;
    assert.equal(calendarUI.state().dateGroups[0].date, '2026-10-24');
    assert.equal(calendarUI.state().renderCount, 1);
});

function keyboardControls(reducedMotion: boolean) {
    const document = { activeElement: null as unknown };
    const showMoreButton = control(document);
    const showFewerButton = control(document);
    const detailsElement = control(document);
    const detailsClose = control(document);
    const scrolls: unknown[] = [];
    const closes: boolean[] = [];
    const start = component.indexOf("showFewerButton.addEventListener('click'");
    const end = component.indexOf('const handleCalendarLayoutChange', start);
    assert.ok(start >= 0 && end > start);
    vm.runInNewContext(stripTypeScriptTypes(component.slice(start, end)), {
        showMoreButton, showFewerButton, detailsElement, detailsClose,
        defaultDateLimit: 3, visibleDateLimit: 6, renderDateGroups() {},
        calendarElement: { scrollIntoView: (options: unknown) => scrolls.push(options) },
        window: { matchMedia: () => ({ matches: reducedMotion }) },
        closeDetails: (restoreFocus: boolean) => closes.push(restoreFocus),
    });
    return { document, showMoreButton, showFewerButton, detailsElement, scrolls, closes };
}

test('Escape dismisses event details and restores focus, while other keys are unchanged', () => {
    const ui = keyboardControls(false);
    let prevented = false;
    const keydown = ui.detailsElement.listeners.get('keydown');
    assert.ok(keydown);
    keydown({ key: 'Tab', preventDefault: () => { prevented = true; } });
    assert.equal(prevented, false);
    assert.deepEqual(ui.closes, []);
    keydown({ key: 'Escape', preventDefault: () => { prevented = true; } });
    assert.equal(prevented, true);
    assert.deepEqual(ui.closes, [true]);
});

test('collapsing dates respects reduced motion and retains keyboard focus', () => {
    for (const reducedMotion of [false, true]) {
        const ui = keyboardControls(reducedMotion);
        ui.showFewerButton.listeners.get('click')!();
        assert.equal((ui.scrolls[0] as { behavior: string }).behavior, reducedMotion ? 'auto' : 'smooth');
        assert.equal(ui.document.activeElement, ui.showMoreButton);
    }
});

test('public calendar requests stop 90 days after the business date', async () => {
    assert.match(component, /const maximumRequestDays = 90;/);
    const requests: string[] = [];
    const calendarUI = calendar(async (url: string) => { requests.push(url); return response([]); });
    await calendarUI.loadEvents();
    const query = new URL(requests[0] ?? '', 'https://example.test').searchParams;
    assert.equal(query.get('start'), '2026-10-17');
    assert.equal(query.get('end'), '2027-01-15');
});
