import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';

const projectRoot = new URL('../../', import.meta.url).pathname;
const publicAstroRoots = [
    join(projectRoot, 'src/components'),
    join(projectRoot, 'src/layouts'),
    join(projectRoot, 'src/pages'),
];

function collectAstroFiles(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) return collectAstroFiles(path);
        return entry.name.endsWith('.astro') ? [path] : [];
    });
}

test('public Astro copy uses the congregation full name without visible short-name exceptions', () => {
    const unexpected: string[] = [];

    for (const filePath of publicAstroRoots.flatMap(collectAstroFiles)) {
        const projectPath = relative(projectRoot, filePath);
        const lines = readFileSync(filePath, 'utf8').split('\n');

        lines.forEach((line, index) => {
            const withoutFullName = line.replace(/Kehilat Ohr HaTorah/gi, '');
            if (!/\bOhr HaTorah\b/i.test(withoutFullName)) return;

            unexpected.push(`${projectPath}:${index + 1}: ${line.trim()}`);
        });
    }

    assert.deepEqual(
        unexpected,
        [],
        `Standalone congregation short name found in public Astro copy:\n${unexpected.join('\n')}`
    );
});

test('visible prose emphasizes the full congregation name in the corrected identity copy', () => {
    const homeSource = readFileSync(join(projectRoot, 'src/pages/index.astro'), 'utf8');
    const aboutSource = readFileSync(join(projectRoot, 'src/pages/about.astro'), 'utf8');
    const umjcSource = readFileSync(join(projectRoot, 'src/pages/umjc.astro'), 'utf8');

    assert.match(homeSource, /<strong>Kehilat Ohr HaTorah<\/strong> is a home/);
    assert.match(homeSource, /<strong>Kehilat Ohr HaTorah<\/strong> is a member of the/);
    assert.match(homeSource, /<strong>\{congregationName\}<\/strong>\{officialIdentityStatementRemainder\}/);
    assert.match(aboutSource, /<strong>Kehilat Ohr HaTorah<\/strong> is a growing Messianic Jewish synagogue/);
    assert.match(aboutSource, /Our full name, <strong>Kehilat Ohr HaTorah<\/strong>, can be translated as/);
    assert.match(umjcSource, /<strong>Kehilat Ohr HaTorah<\/strong> is a member of the/);
    assert.match(
        readFileSync(join(projectRoot, 'src/pages/donate.astro'), 'utf8'),
        /<dd><strong>\{congregationName\}<\/strong><\/dd>/
    );
    assert.match(
        readFileSync(join(projectRoot, 'src/pages/mission.astro'), 'utf8'),
        /<strong>\{congregationName\}<\/strong>\{officialIdentityStatementRemainder\}/
    );
});
