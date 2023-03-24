/**
 * Docker
 */
export type DockerDefinition = boolean | "desktop";

/**
 * PHP
 */
export type PHPDefinition = boolean | PHPOptions;

export type PHPOptions = {
    versions?: string[];
    extensions?: string[];
    composer?: boolean;
    apacheMod?: boolean;
};

/**
 * VSCode
 */
export type VSCDefinition = boolean | "insiders";

/**
 * JetBrains Toolbox
 */
export type JBToolboxDefinition = boolean | string;

/**
 * Spotify
 */
export type SpotifyDefinition = boolean;

/**
 * Steam
 * TODO: proton
 */
export type SteamDefinition = boolean;

/**
 * Discord
 */
export type DiscordDefinition = boolean;

/**
 * Telegram
 */
export type TelegramDefinition = boolean;

/**
 * Signal
 */
export type SignalDefinition = boolean;

/**
 * 1Password
 */
export type OnePasswordDefinition = boolean;

/**
 * Additional packages
 */
export type AdditionalPackagesDefinition = string[];

/**
 * Additional .deb files
 */
export type AdditionalDebsDefinition = string[];

///

export type InstructionSetName =
    | "docker"
    | "php"
    | "vsc"
    | "jbToolbox"
    | "spotify"
    | "steam"
    | "discord"
    | "telegram"
    | "signal"
    | "onePassword"
    | "additionalPackages"
    | "additionalDebs"
    | string;

export interface Definitions {
    docker?: DockerDefinition;
    php?: PHPDefinition;
    vsc?: VSCDefinition;
    jbToolbox?: JBToolboxDefinition;
    spotify?: SpotifyDefinition;
    steam?: SteamDefinition;
    discord?: DiscordDefinition
    telegram?: TelegramDefinition;
    signal?: SignalDefinition;
    onePassword?: OnePasswordDefinition;
    additionalPackages: AdditionalPackagesDefinition;
    additionalDebs: AdditionalDebsDefinition;
}

export type DebugTree = boolean;

export type Silent = boolean;
