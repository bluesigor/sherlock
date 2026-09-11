import Link from "next/link";
export function Footer() {
    return <footer className="w-full mt-auto py-4 flex justify-center gap-4 text-sm text-muted-foreground">
        <Link href="/about">About Sherlock</Link><Link href="/about#help">Help</Link><Link href="/about#privacy">Your deployment</Link>
    </footer>;
}
