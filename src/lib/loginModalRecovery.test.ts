import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../components/admin/LoginModal.astro', import.meta.url), 'utf8');
const script = source.match(/<script is:inline>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'the actual login component script is available');

function loginUI(fetch: (...args: any[]) => Promise<unknown>) {
    const document: any = { activeElement: null, body: { style: {} }, cookie: '', addEventListener() {} };
    function control() {
        const classes = new Set<string>();
        return {
            value: '', disabled: false, open: false, textContent: '', style: {},
            attributes: new Map<string, string>(), listeners: new Map<string, Function>(),
            classList: {
                add: (...names: string[]) => names.forEach(name => classes.add(name)),
                remove: (...names: string[]) => names.forEach(name => classes.delete(name)),
                contains: (name: string) => classes.has(name),
            },
            addEventListener(name: string, listener: Function) { this.listeners.set(name, listener); },
            setAttribute(name: string, value: string) { this.attributes.set(name, value); },
            removeAttribute(name: string) { this.attributes.delete(name); },
            focus() { if (!this.disabled) document.activeElement = this; },
            select() {}, showModal() { this.open = true; }, close() { this.open = false; },
        };
    }
    const inputs = Array.from({ length: 6 }, control);
    const controls = Object.fromEntries([
        'loginModal', 'loginModalClose', 'loginModalForm', 'loginSubmitBtn', 'loginPinValue', 'loginErrorMessage', 'adminEditFab',
    ].map(id => [id, control()]));
    const modal = controls.loginModal as any;
    modal.querySelector = () => control();
    modal.querySelectorAll = () => inputs;
    document.getElementById = (id: string) => controls[id] ?? null;
    document.querySelector = () => ({});
    let timerId = 0;
    const timers = new Map<number, Function>();
    const setTimeout = (callback: Function) => { timers.set(++timerId, callback); return timerId; };
    const clearTimeout = (id: number) => timers.delete(id);
    const events: unknown[] = [];
    let reloads = 0;
    const window: any = { setTimeout, clearTimeout, dispatchEvent: (event: unknown) => events.push(event),
        location: { reload: () => { reloads++; } } };
    vm.runInNewContext(script!, { document, window, fetch, setTimeout, clearTimeout, AbortController, CustomEvent });
    const input = (index: number, value: string) => {
        inputs[index].value = value;
        inputs[index].listeners.get('input')!({ target: inputs[index] });
    };
    return {
        ...controls, inputs, document, window, events, timers,
        input,
        fill: (pin: string) => [...pin].forEach((digit, index) => input(index, digit)),
        submit: () => controls.loginModalForm.listeners.get('submit')!({ preventDefault() {} }),
        reloads: () => reloads,
    };
}

const rejection = { ok: false, json: async () => ({ success: false, error: 'Synthetic invalid PIN' }) };

test('invalid PIN input clears the submitted value and disables Sign In immediately', () => {
    const ui = loginUI(async () => rejection);
    ui.window.showLoginModal();
    ui.fill('135790');
    ui.input(5, 'x');
    assert.equal(ui.inputs[5].value, '');
    assert.equal(ui.loginPinValue.value, '13579');
    assert.equal(ui.loginSubmitBtn.disabled, true);
    assert.equal(ui.inputs[5].classList.contains('filled'), false);
});

test('login submits the visible six digits rather than a stale hidden value', async () => {
    let postedPin = '';
    const ui = loginUI(async (_url, options) => { postedPin = JSON.parse(options.body).pin; return rejection; });
    ui.window.showLoginModal();
    ui.fill('135790');
    ui.loginPinValue.value = '246801';
    await ui.submit();
    assert.equal(postedPin, '135790');
});

test('a pending login blocks duplicate submissions and restores editable input after failure', async () => {
    let finish!: (response: unknown) => void;
    let requests = 0;
    const ui = loginUI(() => { requests++; return new Promise(resolve => { finish = resolve; }); });
    ui.window.showLoginModal();
    ui.fill('135790');
    const pending = ui.submit();
    assert.equal(ui.inputs.every(input => input.disabled), true);
    assert.equal(ui.loginSubmitBtn.attributes.get('aria-label'), 'Signing in');
    assert.equal(ui.loginModalForm.attributes.get('aria-busy'), 'true');
    await ui.submit();
    assert.equal(requests, 1);
    finish(rejection);
    await pending;
    assert.equal(ui.inputs.some(input => input.disabled), false);
    assert.equal(ui.document.activeElement, ui.inputs[0]);
    assert.equal(ui.loginSubmitBtn.disabled, true);
    assert.equal(ui.loginModalForm.attributes.get('aria-busy'), 'false');
});

test('closing a pending login aborts the request and its late error cannot erase a new PIN', async () => {
    let finish!: (response: unknown) => void;
    let signal: AbortSignal | undefined;
    const ui = loginUI((_url, options) => { signal = options.signal; return new Promise(resolve => { finish = resolve; }); });
    ui.window.showLoginModal();
    ui.fill('135790');
    const pending = ui.submit();
    ui.window.hideLoginModal();
    assert.equal(signal?.aborted, true);
    ui.window.showLoginModal();
    ui.fill('246801');
    const focus = ui.document.activeElement;
    finish(rejection);
    await pending;
    assert.equal(ui.loginPinValue.value, '246801');
    assert.equal(ui.loginErrorMessage.classList.contains('show'), false);
    assert.equal(ui.document.activeElement, focus);
});

test('an obsolete successful response cannot close a new attempt or announce a login', async () => {
    const finish: Array<(response: unknown) => void> = [];
    const ui = loginUI(() => new Promise(resolve => { finish.push(resolve); }));
    ui.window.showLoginModal();
    ui.fill('135790');
    const first = ui.submit();
    ui.window.hideLoginModal();
    ui.window.showLoginModal();
    ui.fill('246801');
    const second = ui.submit();
    finish[0]({ ok: true, json: async () => ({ success: true, user: { id: 999 } }) });
    await first;
    assert.equal(ui.loginModal.open, true);
    assert.equal(ui.loginPinValue.value, '246801');
    assert.equal(ui.loginSubmitBtn.classList.contains('loading'), true);
    assert.equal(ui.events.length, 0);
    assert.equal(ui.reloads(), 0);
    finish[1](rejection);
    await second;
});

test('closing the login dialog removes error timers from its previous attempt', async () => {
    const ui = loginUI(async () => rejection);
    ui.window.showLoginModal();
    ui.fill('135790');
    await ui.submit();
    assert.equal(ui.timers.size, 1);
    ui.window.hideLoginModal();
    assert.equal(ui.timers.size, 0);
});
