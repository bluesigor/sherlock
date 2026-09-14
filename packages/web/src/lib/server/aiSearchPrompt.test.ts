import { describe, expect, test } from 'vitest';
import { EXAMPLES, SYSTEM_PROMPT } from './aiSearchPrompt';

describe('SYSTEM_PROMPT', () => {
    // sym: matches definitions in the indexed code only. Asking "what uses X"
    // with sym:X returns nothing whenever X is defined in a third-party
    // library - which is most of what a question about usage is about.
    test('tells the model that sym: finds definitions, not usages', () => {
        expect(SYSTEM_PROMPT).toMatch(/sym:[^.]*\bdefin/i);
    });

    test('steers a question about usage away from sym:', () => {
        expect(SYSTEM_PROMPT).toMatch(/\buse[sd]?\b|\busage\b/i);
    });

    test('still explains the other prefixes', () => {
        for (const prefix of ['lang:', 'file:', 'repo:']) {
            expect(SYSTEM_PROMPT).toContain(prefix);
        }
    });

    test('demands a bare single-line query', () => {
        expect(SYSTEM_PROMPT).toContain('single line');
    });
});

describe('EXAMPLES', () => {
    test('carries an example where a usage question does not use sym:', () => {
        const usage = EXAMPLES.filter(([naturalLanguage]) => /\buse[sd]?\b|\busage\b/i.test(naturalLanguage));

        expect(usage.length).toBeGreaterThan(0);
        for (const [, query] of usage) {
            expect(query).not.toContain('sym:');
        }
    });

    test('keeps a definition example on sym:', () => {
        expect(EXAMPLES.some(([, query]) => query.includes('sym:'))).toBe(true);
    });

    test('every example query is non-empty and single-line', () => {
        for (const [, query] of EXAMPLES) {
            expect(query.trim().length).toBeGreaterThan(0);
            expect(query).not.toContain('\n');
        }
    });
});
