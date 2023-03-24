import { InstructionSet } from "./InstructionSet";
import {
    AdditionalDebsDefinition,
    AdditionalPackagesDefinition,
    DiscordDefinition,
    DockerDefinition,
    InstructionSetName,
    JBToolboxDefinition,
    OnePasswordDefinition,
    PHPDefinition,
    SignalDefinition,
    SpotifyDefinition,
    SteamDefinition,
    TelegramDefinition,
    VSCDefinition,
} from "./types";

export class Installer {
    private set: InstructionSet;

    public static CustomSets: Record<InstructionSetName, InstructionSet<InstructionSetName>> = {};

    public static DependentPackages: string[] = [
        "software-properties-common",
        "apt-transport-https",
        "wget",
        "gdebi-core",
        "gnupg",
        "ca-certificates",
        "lsb-release",
        "ca-certificates",   
    ]

    constructor(
        private silent: boolean = true,
        private debugTree: boolean = false,
    ) {
        this.set = new InstructionSet("base");
    }

    docker(docker: DockerDefinition = true): Installer {
        return (docker ? this._set : this._unset).bind(this)(
            new InstructionSet("docker")
                .keychain("docker.gpg", "https://download.docker.com/linux/ubuntu/gpg")
                .sourceList("docker.list", [
                    "deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable",
                ])
                .package(
                    docker === "desktop"
                        ? "gnome-terminal docker-desktop"
                        : "docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin"
                )
        );
    }

    php(php: PHPDefinition = true): Installer {
        if (!php) return this._unset.bind(this)("php");

        const set = new InstructionSet("php").ppa("ondrej/php");

        if (php === true) {
            php = {
                versions: [],
                extensions: [],
                composer: true,
                apacheMod: false,
            };
        }

        if ((php.versions = php.versions ?? [])) {
            if (php.versions.length < 1) {
                this.log("php versions not specified, using default package `php` for default version");
                php.versions.push("");
            }

            php.extensions = php.extensions ?? [];

            for (const version of php.versions) {
                const pkg = `php${version}`;

                set.package([
                    pkg,
                    ...(php.apacheMod ? [`libapache2-mod-${pkg}`] : []),
                    ...php.extensions.map((ext) => `${pkg}-${ext}`),
                ])
                    // Enable php extensions
                    .cmd(php.extensions.map((ext) => `phpenmod -v ${version} ${ext}`));
            }

            if (php.composer) {
                set.cmd([
                    "curl -sS https://getcomposer.org/installer -o /tmp/composer-setup.php",
                    "php /tmp/composer-setup.php --install-dir=/usr/local/bin --filename=composer",
                ]);
            }
        }

        return this._set.bind(this)(set);
    }

    vsc(vsc: VSCDefinition = true): Installer {
        return (vsc ? this._set : this._unset).bind(this)(
            new InstructionSet("vsc")
                .keychain("packages.microsoft.gpg", "https://packages.microsoft.com/keys/microsoft.asc")
                .sourceList("vscode.list", [
                    "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/keyrings/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main",
                ])
                .package(typeof vsc === "string" ? `code-${vsc}` : `code`)
        );
    }

    jbToolbox(jbToolbox: JBToolboxDefinition = true): Installer {
        this.log("Toolbox will pop out once installed, you can use/close it.");

        const tar =
            "https://download.jetbrains.com/" +
            (typeof jbToolbox === "string"
                ? `/toolbox/jetbrains-toolbox-${jbToolbox}.tar.gz`
                : `/product?code=PS&latest&distribution=linux`);

        return (jbToolbox ? this._set : this._unset).bind(this)(
            new InstructionSet("jbToolbox").cmd([
                "mkdir /temp/liliana--toolbox",
                `wget -O /tmp/liliana--toolbox/jetbrains-toolbox.tar.gz ${tar}`,
                "tar -xzvf /tmp/liliana--toolbox/jetbrains-toolbox.tar.gz -C /tmp/liliana--toolbox --strip-components=1",
                "chmod +x /tmp/liliana--toolbox/jetbrains-toolbox",
                "bash /tmp/liliana--toolbox/jetbrains-toolbox",
            ])
        );
    }

    spotify(spotify: SpotifyDefinition = true): Installer {
        return (spotify ? this._set : this._unset).bind(this)(
            new InstructionSet("spotify")
                .keychain("spotify.gpg", "https://download.spotify.com/debian/pubkey_7A3A762FAFD4A51F.gpg")
                .sourceList("spotify.list", ["deb http://repository.spotify.com[signed-by=/etc/apt/keyrings/spotify.gpg] stable non-free"])
                .package("spotify-client")
        );
    }

    steam(steam: SteamDefinition = true): Installer {
        return (steam ? this._set : this._unset).bind(this)(
            new InstructionSet("steam")
                .keychain("steam.gpg", "https://repo.steampowered.com/steam/archive/stable/steam.gpg")
                .sourceList("steam-stable.list", [
                    "deb [arch=amd64,i386 signed-by=/etc/apt/keyrings/steam.gpg] https://repo.steampowered.com/steam/ stable steam",
                    "deb-src [arch=amd64,i386 signed-by=/etc/apt/keyrings/steam.gpg] https://repo.steampowered.com/steam/ stable steam",
                ])
                .arch("i386")
                .package([
                    "libgl1-mesa-dri:amd64",
                    "libgl1-mesa-dri:i386",
                    "libgl1-mesa-glx:amd64",
                    "libgl1-mesa-glx:i386",
                    "steam-launcher",
                ])
        );
    }

    discord(discord: DiscordDefinition = true): Installer {
        return (discord ? this._set : this._unset).bind(this)(
            new InstructionSet("discord").deb("https://discordapp.com/api/download?platform=linux&format=deb")
        );
    }

    telegram(telegram: TelegramDefinition = true): Installer {
        // FIXME: couldn't find any official telegram repository
        // though I don't want to depend on standard distro repos
        return (telegram ? this._set : this._unset).bind(this)(new InstructionSet("telegram").package("telegram-desktop"));
    }

    signal(signal: SignalDefinition = true): Installer {
        return (signal ? this._set : this._unset).bind(this)(
            new InstructionSet("signal")
                .keychain("signal-desktop-keyring.gpg", "https://updates.signal.org/desktop/apt/keys.asc")
                .sourceList("signal-desktop-archive.list", [
                    "deb [arch=amd64 signed-by=/etc/apt/keyrings/signal-desktop-keyring.gpg] https://updates.signal.org/desktop/apt xenial main",
                ])
                .package("signal-desktop")
        );
    }

    onePassword(onePassword: OnePasswordDefinition = true): Installer {
        return (onePassword ? this._set : this._unset).bind(this)(
            new InstructionSet("onePassword")
                .keychain("1password-archive-keyring.gpg", "https://downloads.1password.com/linux/keys/1password.asc")
                .sourceList("1password.list", [
                    "deb [arch=amd64 signed-by=/etc/apt/keyrings/1password-archive-keyring.gpg] https://downloads.1password.com/linux/debian/amd64 stable main",
                ])
                .package("1password")
        );
    }

    package(pkg: AdditionalPackagesDefinition): Installer {
        this.set.package(pkg);
        return this;
    }

    deb(deb: AdditionalDebsDefinition): Installer {
        this.set.deb(deb);
        return this;
    }

    log(...data: any[]): Installer {
        if (!this.silent) console.log(...data);
        return this;
    }

    _set(set: InstructionSet): Installer {
        this.set.removeChildSet(set);
        this.set.addChildSet(set);
        return this;
    }

    private _unset(set: InstructionSet | InstructionSetName): Installer {
        this.set.removeChildSet(set);
        return this;
    }

    customSet(name: InstructionSetName): Installer {
        let set: InstructionSet;

        if ((set = Installer.CustomSets[name]) && set instanceof InstructionSet) {
            return this._set.bind(this)(set);
        }

        throw new Error(`Set with name ${name} is not registered or not an instance of InstructionSet`);
    }

    build(): string {
        // Script cleanup commands
        this.set.addChildSet(new InstructionSet("cleanup").cmd("rm -rf /tmp/liliana--*"));
        
        let output = new InstructionSet("requirements").package(Installer.DependentPackages).buildToString();
        output += this.set.buildToString();

        if (this.debugTree && !this.silent) {
            console.dir(this.set._debugTree(), { depth: null });
        }
        
        return output;
    }
}
