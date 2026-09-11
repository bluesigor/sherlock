import googleLogo from "@/public/google.svg";
import entraLogo from "@/public/entra.svg";
import { getCodeHostIcon } from "@/lib/utils";

export interface OauthProviderDisplay {
    id: string;
    name: string;
    logo: { src: string, className?: string };
    captureEventName: string;
}

const providerDisplays: Record<string, Omit<OauthProviderDisplay, "id">> = {
    github: {
        name: "GitHub",
        logo: getCodeHostIcon("github")!,
        captureEventName: "wa_login_with_github",
    },
    google: {
        name: "Google",
        logo: { src: googleLogo },
        captureEventName: "wa_login_with_google",
    },
    "microsoft-entra-id": {
        name: "Microsoft",
        logo: { src: entraLogo },
        captureEventName: "wa_login_with_entra",
    },
};

export const isOauthProvider = (id: string) => id in providerDisplays;

export const getOauthProviderDisplay = (id: string): OauthProviderDisplay | undefined => {
    const display = providerDisplays[id];
    return display ? { id, ...display } : undefined;
};
