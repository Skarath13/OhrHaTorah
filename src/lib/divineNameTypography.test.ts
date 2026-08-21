import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const readSource = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

const homeSource = readSource('../pages/index.astro');
const homeStyles = readSource('../../public/styles/home.css');
const voiceSource = readSource('../../CONTENT_VOICE.md');
const agentGuidance = readSource('../../AGENTS.md');

test('the homepage divine-name substitute preserves readable text and cap hierarchy', () => {
    assert.match(
        homeSource,
        /<span class="divine-name"><span class="divine-name__initial">H<\/span><span class="divine-name__small-caps">ashem<\/span>,<\/span>/,
    );
    assert.doesNotMatch(homeSource, />HaShem<|>HASHEM</);
});

test('divine-name CSS prefers real small caps and retains a visibly smaller fallback', () => {
    assert.match(
        homeStyles,
        /\.home-torah-quote \.divine-name__small-caps \{[\s\S]*?font-size: 0\.76em;[\s\S]*?text-transform: uppercase;[\s\S]*?\}/,
    );
    assert.match(
        homeStyles,
        /@supports \(font-variant-caps: small-caps\) \{[\s\S]*?\.home-torah-quote \.divine-name__small-caps \{[\s\S]*?font-variant-caps: small-caps;[\s\S]*?font-feature-settings: 'smcp' 1;[\s\S]*?\}/,
    );
    assert.doesNotMatch(homeStyles, /\.divine-name[^\{]*\{[^}]*font-variant-caps:\s*all-small-caps/);
});

test('durable copy guidance limits the respectful convention to YHVH substitutions', () => {
    for (const source of [voiceSource, agentGuidance]) {
        assert.match(source, /Hashem/);
        assert.match(source, /Adonai/);
        assert.match(source, /full-height/);
        assert.match(source, /YHVH/);
    }

    assert.match(voiceSource, /https:\/\/jps\.org\/wp-content\/uploads\/2023\/05\/RJPS_Preface\.html/);
    assert.match(voiceSource, /avoiding its direct pronunciation/);
});
