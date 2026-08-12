import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
    coreCommitments,
    coreValueGroups,
    homepageIdentityPreview,
    officialIdentityStatement,
    visionAndPurposeParagraphs,
} from '../data/congregationIdentity.ts';

const missionSource = readFileSync(new URL('../pages/mission.astro', import.meta.url), 'utf8');
const missionStyles = readFileSync(new URL('../../public/styles/mission.css', import.meta.url), 'utf8');
const allCommitments = coreCommitments.map(({ text }) => text).join('\n');
const allValues = coreValueGroups.flatMap(({ values }) => values).join('\n');

test('the canonical identity layer preserves the complete public document structure', () => {
    assert.equal(visionAndPurposeParagraphs.length, 3);
    assert.equal(coreCommitments.length, 13);
    assert.deepEqual(
        coreValueGroups.map(({ heading, values }) => [heading, values.length]),
        [
            ['For Individual, Family, and Community Strength', 9],
            ['Leadership Development', 6],
            ['Community Building and Maasei Tovim (good works)', 7],
        ]
    );
    assert.equal(coreValueGroups.reduce((total, group) => total + group.values.length, 0), 22);
});

test('leadership-selected identity language and theological vocabulary remain exact', () => {
    assert.equal(
        officialIdentityStatement,
        'Kehilat Ohr HaTorah is a Messianic Jewish congregation (UMJC member) committed to Torah Covenant faithfulness, to Jewish community life and tradition, to the unity of Jewish and non-Jewish members, and to faith in the atoning death and resurrection of Yeshua, our coming Messiah and restorer of Israel.'
    );
    assert.match(visionAndPurposeParagraphs[0], /living lives worthy of our calling in the full Besorah \(good news\) of Messiah Yeshua/);
    assert.match(visionAndPurposeParagraphs[1], /unified and loving bilateral community/);
    assert.match(visionAndPurposeParagraphs[2], /restored, redeemed, and regathered Jewish people in the land of Israel/);
    assert.match(allCommitments, /authoritative teachings of the Tanakh \(Torah, Prophets, and Writings\) and the Brit Chadashah/);
    assert.match(allCommitments, /We affirm the bilateral, variegated, nature of adat haMashiach/);
    assert.match(allCommitments, /residual theological supersessionism/);
    assert.match(allCommitments, /shlichim \(שליחים apostles, emissaries\)/);
    assert.match(allValues, /ahavat chinam \(אהבת חינם\), unconditional love/);
    assert.match(allValues, /Tikkun Olam, the repairing \(or at least improving\) of the world/);
});

test('statement openings, citations, and the approved UMJC update are protected', () => {
    for (const commitment of coreCommitments) {
        assert.match(commitment.text, /^We (?:are committed|embrace|affirm|remain committed)/);
    }
    for (const value of coreValueGroups.flatMap(({ values }) => values)) {
        assert.match(value, /^We value/);
    }

    assert.match(allCommitments, /\(Jeremiah 31:33, Matthew 26:28\)/);
    assert.match(allCommitments, /\(Deuteronomy 30:1-4, Luke 1:67-75, Acts 1:6, Acts 3:19-21\)/);
    assert.match(allValues, /\(Babylonian Talmud, Tractate Yoma 9b and Yerushalmi, Yoma 1:1\)/);
    assert.match(allValues, /privileged to be a member of the Union of Messianic Jewish Congregations \(UMJC\)/);
    assert.doesNotMatch(allValues, /expect to be a full member|by June of 2026|have connected with the Union/);
});

test('editorial notes and bylaws governance stay out of the public identity copy', () => {
    const publicIdentityCopy = [
        officialIdentityStatement,
        ...visionAndPurposeParagraphs,
        allCommitments,
        allValues,
    ].join('\n');

    assert.doesNotMatch(publicIdentityCopy, /\bNIV\b|\bTLV\b|Note that both/);
    assert.doesNotMatch(publicIdentityCopy, /Membership shall consist|Administrative Board of Directors|Congregational Ordination/);
});

test('the homepage preview has stable, compact consumer shapes', () => {
    assert.equal(homepageIdentityPreview.commitments.length, 3);
    assert.equal(homepageIdentityPreview.values.length, 4);

    for (const item of [...homepageIdentityPreview.commitments, ...homepageIdentityPreview.values]) {
        assert.deepEqual(Object.keys(item), ['title', 'description']);
        assert.ok(item.title.length > 0);
        assert.ok(item.description.startsWith('We '));
    }
});

test('the identity page publishes canonical arrays with accessible, responsive structure', () => {
    assert.match(missionSource, /title="Our Vision, Commitments & Values - Ohr HaTorah"/);
    assert.match(missionSource, /pageTitle="Our Identity"/);
    assert.match(missionSource, /stylesheets=\{\['\/styles\/mission\.css'\]\}/);
    assert.match(missionSource, /<nav class="identity-navigation" aria-label="On this page">/);
    assert.match(missionSource, /<h2 id="vision-and-purpose-title">Vision and Purpose<\/h2>/);
    assert.match(missionSource, /<h2 id="core-commitments-title">Core Commitments and Affirmations<\/h2>/);
    assert.match(missionSource, /<h2 id="core-values-title">Core Values<\/h2>/);
    assert.match(missionSource, /<h3 id=\{`\$\{group\.id\}-title`\}>\{group\.heading\}<\/h3>/);
    assert.match(missionSource, /visionAndPurposeParagraphs\.map/);
    assert.match(missionSource, /coreCommitments\.map/);
    assert.match(missionSource, /coreValueGroups\.map/);
    assert.match(missionSource, /בָּרוּךְ הַבָּא בְּשֵׁם ה׳/);
    assert.doesNotMatch(missionSource, /יהוה/);
    assert.doesNotMatch(missionSource, /<details|data-editable/);

    assert.match(missionStyles, /min-width: 0/);
    assert.match(missionStyles, /overflow-wrap: anywhere/);
    assert.match(missionStyles, /@media \(max-width: 600px\)/);
    assert.doesNotMatch(missionStyles, /cursor:\s*pointer/);
});
