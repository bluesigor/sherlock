import Link from "next/link";
export default function SecurityCard() {
    return <section className="mt-12 max-w-md mx-auto rounded-lg border p-6 text-center space-y-3">
        <h3 className="text-xl font-semibold">Your code, your deployment</h3>
        <p className="text-muted-foreground">Your instance administrator manages access, hosting, and data protection.</p>
        <Link href="/about#privacy" className="underline">About this deployment</Link>
    </section>;
}
