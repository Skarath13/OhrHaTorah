import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const readSource = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

const homeSource = readSource('../pages/index.astro');
const homeStyles = readSource('../../public/styles/home.css');
const legacyStyles = readSource('../../public/styles/style.css');
const liveClockSource = readSource('../components/islands/LiveClock.astro');
const candleLightingSource = readSource('../components/islands/CandleLighting.astro');
const navigationSource = readSource('../components/layout/Navigation.astro');
const mobileNavigationSource = readSource('../components/layout/MobileNavigation.astro');
const archiveSource = readSource('../../docs/ARCHIVED_FEATURES.md');
const voiceSource = readSource('../../CONTENT_VOICE.md');

test('computed prayer times are retired from the homepage without dormant runtime', () => {
    assert.doesNotMatch(homeSource, /Prayer Times|home-prayer|zmanim\?|fetchPrayerTimes/);
    assert.doesNotMatch(homeStyles, /\.home-prayer/);
    assert.doesNotMatch(legacyStyles, /\.prayer-(?:times|row|name|time|last-updated)|\.mobile-prayer-section/);
    assert.match(archiveSource, /Computed prayer-times panel/i);
    assert.match(archiveSource, /06a750cf192ef3126b7f430e2af5fc58a45b5e95/);
});

test('Shabbat at a glance keeps candle lighting and presents the next Shabbat dates', () => {
    assert.match(homeSource, /<CandleLighting \/>/);
    assert.match(homeSource, /<LiveClock \/>/);
    assert.match(homeStyles, /\.home-dashboard-grid \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
    assert.match(liveClockSource, />Next Shabbat</);
    assert.match(liveClockSource, />Hebrew Date</);
    assert.match(liveClockSource, />Gregorian Date</);
    assert.match(liveClockSource, />Mincha Service</);
    assert.match(liveClockSource, /datetime="14:30"[^>]*>2:30 p\.m\.<\/time>/);
    assert.match(homeStyles, /\.clock-service-time[^)]*\.clock-time\) \{\s*color: #fff !important;/);
    assert.match(homeStyles, /\.clock-panel-service/);
    assert.doesNotMatch(liveClockSource, /Pacific Time|sidebar-pacific-time|updatePacificTime/);
    assert.match(liveClockSource, /strictlyFollowing: true/);
    assert.match(candleLightingSource, /formatCongregationDate/);
    assert.match(candleLightingSource, /formatCongregationTime/);
});

test('Shabbat gathering uses the approved afternoon schedule', () => {
    assert.match(homeSource, /An afternoon of Messianic Music, Dance, Prayers, Torah, and food/);
    assert.match(homeSource, /<time datetime="14:30">2:30 p\.m\.<\/time>[\s\S]*?<strong>Messianic Jewish Music and Dance<\/strong>/);
    assert.match(homeSource, /<time datetime="15:00">3:00 p\.m\.<\/time>[\s\S]*?<strong>Traditional Prayers and Torah Service<\/strong>/);
    assert.match(homeSource, /<time datetime="16:30">4:30 p\.m\.<\/time>[\s\S]*?<strong>Kiddush, food, and discussion<\/strong>/);
    assert.doesNotMatch(homeSource, /home-timeline-row-friday|Shabbat begins at home|Festive Shabbat meals in the home/);
});

test('homepage identity preview uses canonical approved copy and links to the full page', () => {
    assert.match(homeSource, /congregationName, homepageIdentityPreview, officialIdentityStatement/);
    assert.match(homeSource, /<h2 id="home-purpose-title">Our Identity<\/h2>/);
    assert.match(homeSource, /officialIdentityStatement\.slice\(congregationName\.length\)/);
    assert.match(homeSource, /<strong>\{congregationName\}<\/strong>\{officialIdentityStatementRemainder\}/);
    assert.match(homeSource, /href="\/mission"/);
    assert.match(homeSource, /Explore Our Vision, Commitments &amp; Values/);
    assert.match(homeSource, /Read our complete Vision and Purpose, Core Commitments and Affirmations, and Core Values\./);
    assert.doesNotMatch(homeSource, /thirteen Core Commitments|twenty-two Core Values|home-identity-number/);
    assert.match(homeSource, /<ul class="home-commitment-list">/);
    assert.doesNotMatch(homeSource, /Faith, Heritage, and Community|home-values-details/);
    assert.match(navigationSource, /href="\/mission"[^\n]*Our identity/);
    assert.match(mobileNavigationSource, /href="\/mission"[^\n]*Our identity/);
});

test('approved public voice is durable project guidance', () => {
    assert.match(voiceSource, /precise, covenantal, communal, and declarative/);
    assert.match(voiceSource, /Torah Covenant faithfulness/);
    assert.match(voiceSource, /Jewish community life and tradition/);
    assert.match(voiceSource, /atoning death and resurrection of Yeshua/);
    assert.match(voiceSource, /emphasize the full congregation name with `<strong>`/);
    assert.match(voiceSource, /payment instructions must use the congregation's verified full name/);
    assert.match(voiceSource, /Do not publish internal bylaws material/);
});
