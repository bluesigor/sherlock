import Link from "next/link";
export default function RegistrationCard() {
    return <section className="max-w-md mx-auto rounded-lg border p-6 space-y-3"><h3 className="text-xl font-semibold">Explore your code with Sherlock</h3>
        <p>Search across your repositories from your own instance.</p><Link className="underline" href="/about#help">Getting help</Link></section>;
}
