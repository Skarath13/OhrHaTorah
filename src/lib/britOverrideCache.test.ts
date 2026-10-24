import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const component = readFileSync(new URL('../components/islands/ParashahCard.astro', import.meta.url), 'utf8');
const start = component.indexOf('// Check for override - first try API, fall back to localStorage');
const end = component.indexOf('const britEl =', start);
assert.ok(start >= 0 && end > start);
const script = stripTypeScriptTypes(`(async () => {
  ${component.slice(start, end)}
  return britOverride;
})()`);

async function resolveOverride(options: { response?: unknown; offline?: boolean; blocked?: boolean }) {
    const cache = new Map([['override', 'Old approved reading']]);
    const reading = await vm.runInNewContext(script, {
        britKey: 'brit-chadashah:2026-10-17', britOverrideStorageKey: 'override', encodeURIComponent,
        localStorage: {
            getItem(key: string) { if (options.blocked) throw new Error('Blocked'); return cache.get(key) ?? null; },
            setItem(key: string, value: string) { if (options.blocked) throw new Error('Blocked'); cache.set(key, value); },
            removeItem(key: string) { if (options.blocked) throw new Error('Blocked'); cache.delete(key); },
        },
        fetchJson: async () => {
            if (options.offline) throw new Error('Offline');
            return options.response;
        },
    });
    return { reading, cache };
}

test('a confirmed deleted override clears the old browser copy', async () => {
    const { reading, cache } = await resolveOverride({ response: { success: true, data: null } });
    assert.equal(reading, null);
    assert.equal(cache.has('override'), false);
});

test('an unavailable API preserves the cached date-specific override', async () => {
    const { reading } = await resolveOverride({ offline: true });
    assert.equal(reading, 'Old approved reading');
});

test('a confirmed replacement updates the browser copy', async () => {
    const { reading, cache } = await resolveOverride({ response: { success: true, data: { value: 'New approved reading' } } });
    assert.equal(reading, 'New approved reading');
    assert.equal(cache.get('override'), 'New approved reading');
});

test('the server reading remains authoritative when storage is blocked', async () => {
    const { reading } = await resolveOverride({ blocked: true, response: { success: true, data: { value: 'New approved reading' } } });
    assert.equal(reading, 'New approved reading');
});
