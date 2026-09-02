import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { rabbi } from '../data/rabbi.ts';

const readSource = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

const homeSource = readSource('../pages/index.astro');
const aboutSource = readSource('../pages/about.astro');
const expectSource = readSource('../pages/expect.astro');
const servicesSource = readSource('../pages/services.astro');
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

test('Shabbat at a glance keeps candle lighting and presents the upcoming Shabbat details', () => {
    assert.match(homeSource, /<CandleLighting \/>/);
    assert.match(homeSource, /<LiveClock \/>/);
    assert.match(homeStyles, /\.home-dashboard-grid \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
    assert.match(liveClockSource, />Upcoming Shabbat</);
    assert.match(liveClockSource, />Hebrew Date</);
    assert.match(liveClockSource, />Gregorian Date</);
    assert.match(liveClockSource, />Mincha Prayer and Torah Service</);
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
    for (const source of [servicesSource, expectSource]) {
        assert.match(source, /<div class="time-badge green">4:30 PM<\/div>[\s\S]*?<strong>Kiddush, food, and discussion<\/strong>/);
        assert.doesNotMatch(source, /Interactive Scripture Discussion/);
    }
    assert.doesNotMatch(homeSource, /home-timeline-row-friday|Shabbat begins at home|Festive Shabbat meals in the home/);
});

test('the leadership-approved welcome, About Us, and rabbi copy remains exact', () => {
    assert.match(
        homeSource,
        /<strong>Kehilat Ohr HaTorah<\/strong> is a Messianic Jewish synagogue in Orange County, California\. We warmly welcome both Jewish and non-Jewish individuals, interfaith couples, and families\./,
    );
    assert.match(
        homeSource,
        /<strong>Kehilat Ohr HaTorah:<\/strong> where Torah, tradition, Jewish life, and faith in Yeshua unite as one\./,
    );
    assert.match(homeSource, /is a newly formed Messianic Jewish synagogue in Orange County, California\./);
    assert.match(homeSource, /Join with us in exploring the unmeasurable riches of Messiah Yeshua\./);
    assert.match(homeSource, /Our Shabbat services – prayers, Torah readings, and music – utilize both Hebrew and English\./);
    assert.match(homeSource, /Translations are always provided for spoken and written Hebrew\. Teachings and homilies are mostly in English\./);
    assert.match(homeSource, /data-editable="rabbi-bio">\{rabbi\.bio\}<\/p>/);
    assert.match(homeSource, /data-editable="rabbi-bio-extended">\{rabbi\.bioExtended\}<\/p>/);

    assert.equal(
        rabbi.bio,
        'Rabbi Ott has served in Rabbinic and congregational leadership for over 35 years. His extensive graduate work includes classical Jewish literature and commentary, Messianic Jewish and Christian theology, apologetics, music, and public education. He offers a warm, deep understanding of sacred Scripture and expansive Jewish thought with meaningful application to our lives today.',
    );
    assert.equal(
        rabbi.bioExtended,
        'Rabbi Ott loves welcoming new friends—please feel free to introduce yourself at an upcoming service or reach out to connect directly.',
    );

    assert.match(aboutSource, /growing Messianic Jewish synagogue in Orange County, California\./);
    assert.match(aboutSource, /Jewish and non-Jewish individuals, interfaith couples, and families are welcome\./);
});

test('Shabbat timeline times scale legibly without squeezing service titles', () => {
    assert.match(
        homeStyles,
        /\.home-timeline-row time,\s*\.home-timeline-time \{[^}]*font-size: clamp\(0\.9rem, calc\(0\.825rem \+ 0\.35vw\), 1rem\);[^}]*white-space: nowrap;/s
    );
    assert.match(homeStyles, /grid-template-columns: 5rem minmax\(0, 1fr\)/);
    assert.match(homeStyles, /grid-template-columns: 4\.5rem minmax\(0, 1fr\)/);
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
