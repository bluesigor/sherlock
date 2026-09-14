// List of supported query prefixes in zoekt.
// @see : https://github.com/sourcebot-dev/zoekt/blob/main/query/parse.go#L417
export enum zoektPrefixes {
    archived = "archived:",
    branchShort = "b:",
    branch =  "branch:",
    caseShort =  "c:",
    case =  "case:",
    content =  "content:",
    fileShort =  "f:",
    file =  "file:",
    fork =  "fork:",
    public =  "public:",
    repoShort =  "r:",
    repo =  "repo:",
    regex =  "regex:",
    lang =  "lang:",
    sym =  "sym:",
    typeShort =  "t:",
    type =  "type:",
}
