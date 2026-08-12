import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
    congregationName,
    officialIdentityStatement,
    officialIdentityStatementRemainder,
} from '../data/congregationIdentity.ts';

const footerSource = readFileSync(
    new URL('../components/layout/Footer.astro', import.meta.url),
    'utf8'
);

test('shared footer renders the full congregation name with semantic emphasis', () => {
    assert.equal(congregationName, 'Kehilat Ohr HaTorah');
    assert.match(
        footerSource,
        /<h4><i[^>]*aria-hidden="true"[^>]*><\/i><strong>\{congregationName\}<\/strong><\/h4>/
    );
    assert.doesNotMatch(footerSource, /<h4><i[^>]*><\/i>\s*Ohr HaTorah<\/h4>/);
});

test('shared footer uses the exact canonical identity statement without copying it', () => {
    assert.match(
        footerSource,
        /officialIdentityStatementRemainder,[\s\S]*from '\.\.\/\.\.\/data\/congregationIdentity';/
    );
    assert.match(
        footerSource,
        /<p><strong>\{congregationName\}<\/strong>\{officialIdentityStatementRemainder\}<\/p>/
    );
    assert.equal(
        `${congregationName}${officialIdentityStatementRemainder}`,
        officialIdentityStatement
    );
    assert.doesNotMatch(
        footerSource,
        /A Messianic Jewish congregation in Orange County, rooted in Torah, Jewish life, and faith in Yeshua\./
    );
    assert.equal(footerSource.includes(officialIdentityStatement), false);
});
