import { SherlockLogo } from "@/app/components/sherlockLogo";
import Link from "next/link";
import { SearchBar } from "./searchBar";
import { SettingsDropdown } from "./settingsDropdown";

interface TopBarProps {
    defaultSearchQuery?: string;
    defaultAiSearchQuery?: string;
    domain: string;
}

export const TopBar = ({
    defaultSearchQuery,
    defaultAiSearchQuery,
    domain,
}: TopBarProps) => {
    return (
        <div className="flex flex-row justify-between items-center py-1.5 px-3 gap-4 bg-background">
            <div className="grow flex flex-row gap-4 items-center">
                <Link
                    href={`/${domain}`}
                    className="shrink-0 cursor-pointer"
                >
                    <SherlockLogo className="h-11" />
                </Link>
                <SearchBar
                    size="sm"
                    defaultQuery={defaultSearchQuery}
                    defaultAiQuery={defaultAiSearchQuery}
                    className="w-full"
                />
            </div>
            <SettingsDropdown
                menuButtonClassName="w-8 h-8"
                displaySettingsOption={false}
            />
        </div>
    )
}
