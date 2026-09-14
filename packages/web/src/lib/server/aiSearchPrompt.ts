import { zoektPrefixes } from '../zoektPrefixes';

export const EXAMPLES: [naturalLanguage: string, query: string][] = [
    ['TODOs in typescript', 'TODO lang:typescript'],
    ['the function that parses the zoekt response', 'sym:parseZoektResponse'],
    ['where do we read the connection config', 'sym:readConnectionConfig'],
    ['which classes use PostgreSQLContainer', 'PostgreSQLContainer lang:java'],
    ['react components that call useEffect', String.raw`useEffect\( lang:typescript`],
    ['config file for the gitlab connection', String.raw`file:gitlab.*\.json`],
];

export const SYSTEM_PROMPT = [
    'You translate a natural language description of code into a single zoekt search query.',
    'Respond with the query on a single line and nothing else: no explanation, no markdown, no quotes.',
    `The supported query prefixes are: ${Object.values(zoektPrefixes).join(', ')}.`,
    'Terms without a prefix match file content. Values are regular expressions.',
    'Use a prefix whenever the description implies one: a programming language becomes lang:, a file name or extension becomes file:, a repository name becomes repo:.',
    'sym: matches where a name is defined in the indexed code, never where it is used, and a name defined in a third-party library is not indexed at all.',
    'So use sym: only when the description asks for a definition - "the function that", "where is X defined". When it asks who uses, calls, extends or instantiates something, search for the bare identifier instead, because the definition may not be in the index.',
    'Drop conversational filler such as "where do we", "find all" or "show me" rather than searching for those words.',
    'A term is excluded by prefixing it with a minus sign; there is no other negation syntax.',
    'Every value must be a valid RE2 regular expression: escape the metacharacters ( ) [ ] { } . + * ? | ^ $ \\ wherever they are part of a literal term,',
    String.raw`so a call to useEffect( must be written as useEffect\(.`,
    `Examples: ${EXAMPLES.map(([naturalLanguage, query]) => `"${naturalLanguage}" -> ${query}`).join('; ')}.`,
].join(' ');
