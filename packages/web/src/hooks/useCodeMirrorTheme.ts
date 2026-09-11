'use client';

import { useTailwind } from "./useTailwind";
import { useMemo } from "react";
import { useThemeNormalized } from "./useThemeNormalized";
import createTheme from "@uiw/codemirror-themes";
import { tags as t } from '@lezer/highlight';

// Violet cyberpunk palette. Hues track the app's --neon (266) / --neon-alt (189)
// accents so the code viewer reads as part of the same surface, while keeping
// one-dark's contrast relationships between token classes.
const amber = "#e8c06a",
    rose = "#ff7b9c",
    cyan = "#5fd9e8",
    invalid = "#ffffff",
    ivory = "#d8d2e8",
    stone = "#7e7593",
    periwinkle = "#8ba6ff",
    mint = "#7fdfa8",
    peach = "#e0a373",
    violet = "#b98cff",
    highlightBackground = "#2a1f3daa",
    background = "#120d1b",
    selection = "#31264a",
    cursor = "#b98cff";

// Light counterpart. Same token roles, re-weighted as ink on paper: hues stay in
// the violet/cyan family so the editor belongs to the same surface as the page.
const lAmber = "#8a5300",
    lRose = "#b3216b",
    lCyan = "#0e7490",
    lInvalid = "#b3216b",
    lInk = "#2a2135",
    lStone = "#7b7490",
    lPeriwinkle = "#3f4ed6",
    lMint = "#0f7a57",
    lPeach = "#9a4d12",
    lViolet = "#6d28d9",
    lHighlightBackground = "#efe9f8aa",
    lSelection = "#ded3f5",
    lCursor = "#6d28d9";


export const useCodeMirrorTheme = () => {
    const tailwind = useTailwind();
    const { theme } = useThemeNormalized();

    const darkTheme = useMemo(() => {
        return createTheme({
            theme: 'dark',
            settings: {
                background: tailwind.theme.colors.background,
                foreground: ivory,
                caret: cursor,
                selection: selection,
                selectionMatch: "#b98cff26", // for matching selections
                gutterBackground: background,
                gutterForeground: stone,
                gutterBorder: 'none',
                gutterActiveForeground: ivory,
                lineHighlight: highlightBackground,
            },
            styles: [
                { tag: t.comment, color: stone },
                { tag: t.keyword, color: violet },
                { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: rose },
                { tag: [t.function(t.variableName), t.labelName], color: periwinkle },
                { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: peach },
                { tag: [t.definition(t.name), t.separator], color: ivory },
                { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: amber },
                { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: cyan },
                { tag: [t.meta], color: stone },
                { tag: t.strong, fontWeight: 'bold' },
                { tag: t.emphasis, fontStyle: 'italic' },
                { tag: t.strikethrough, textDecoration: 'line-through' },
                { tag: t.link, color: stone, textDecoration: 'underline' },
                { tag: t.heading, fontWeight: 'bold', color: rose },
                { tag: [t.atom, t.bool, t.special(t.variableName)], color: peach },
                { tag: [t.processingInstruction, t.string, t.inserted], color: mint },
                { tag: t.invalid, color: invalid }
            ]
        });
    }, [tailwind.theme.colors.background]);

    const lightTheme = useMemo(() => {
        return createTheme({
            theme: 'light',
            settings: {
                background: tailwind.theme.colors.background,
                foreground: lInk,
                caret: lCursor,
                selection: lSelection,
                selectionMatch: "#6d28d926", // for matching selections
                gutterBackground: tailwind.theme.colors.background,
                gutterForeground: lStone,
                gutterBorder: 'none',
                gutterActiveForeground: lInk,
                lineHighlight: lHighlightBackground,
            },
            styles: [
                { tag: t.comment, color: lStone },
                { tag: t.keyword, color: lViolet },
                { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: lRose },
                { tag: [t.function(t.variableName), t.labelName], color: lPeriwinkle },
                { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: lPeach },
                { tag: [t.definition(t.name), t.separator], color: lInk },
                { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: lAmber },
                { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: lCyan },
                { tag: [t.meta], color: lStone },
                { tag: t.strong, fontWeight: 'bold' },
                { tag: t.emphasis, fontStyle: 'italic' },
                { tag: t.strikethrough, textDecoration: 'line-through' },
                { tag: t.link, color: lStone, textDecoration: 'underline' },
                { tag: t.heading, fontWeight: 'bold', color: lRose },
                { tag: [t.atom, t.bool, t.special(t.variableName)], color: lPeach },
                { tag: [t.processingInstruction, t.string, t.inserted], color: lMint },
                { tag: t.invalid, color: lInvalid }
            ]
        });
    }, [tailwind.theme.colors.background]);

    const cmTheme = useMemo(() => {
        return theme === 'dark' ? darkTheme : lightTheme;
    }, [theme, darkTheme, lightTheme]);

    return cmTheme;
}