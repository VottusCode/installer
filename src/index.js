const docker = true; // or false, "desktop"

const php = {
  versions: ["7.4", "8.0", "8.1", "8.2"],
  extensions: ["common", "cli", "gd", "mysql", "mbstring", "bcmath", "xml", "fpm", "curl", "zip"], // any phpX.X-prefix packages
  composer: true,
  apacheMod: true
}; // or false

const vscode = true; // or false, "insiders"

const jetbrainsToolbox = true // or false, specific version eg."1.27.3.14493"

const discord = "stable"; // or false, "ptb"

const spotify = true; // or false

const telegram = true;

const signal = true;

const onepassword = true;

const steam = true;

const additionalPackages = [];

const additionalDebs = [
  "https://global.synologydownload.com/download/Utility/ChatClient/1.2.1-0207/Ubuntu/x86_64/Synology%20Chat%20Client-1.2.1-0207.deb"
];

const debugTree = process.env.DEBUG_TREE === '1'; // debug tree disabled by default
const silent = process.env.SILENT !== '0'; // silent by default

// --------

/**
 * The following variables are internal, please prevent from using them and rather
 * use the configuration variables above.
 */

// The output from this script depends on these packages.
let dependentPackages = [
  "software-properties-common",
  "apt-transport-https",
  "wget",
  "gdebi-core",
  "gnupg",
  "ca-certificates",
  "lsb-release",
  "ca-certificates",
];

// Enables the following architectures
let architectures = ["amd64"];

// Commands executed before the apt packages are installed.
let beforePackagesCmds = [];

// Required GPG keys for apt packages
let aptKeys = {};

// *.list files, in format "name.list": ["deb ...", "deb-src ..."]
let aptLists = {};

// PPA repositories to be added, eg. ondrej/php (added when php is enabled)
let ppas = [];

// Apt packages to be installed
let packages = [];

// Commands to be executed after the apt packages are installed
let cmds = []

// URLs to .deb files to be installed
let debs = [].concat(additionalDebs);

// --------

/**
 * Processing configuration
 */

// Docker CE / Docker Desktop, using official repository
if (docker) {
  aptKeys["docker.gpg"] = "https://download.docker.com/linux/ubuntu/gpg";
  aptLists["docker.list"] = [
	"deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
  ];
}

// PHP, using official PPA, official installer script for Composer
if (php) {
  ppas.push("ondrej/php");

  if (php.composer) {
    cmds.push("curl -sS https://getcomposer.org/installer -o /tmp/composer-setup.php");
    cmds.push("php /tmp/composer-setup.php --install-dir=/usr/local/bin --filename=composer");
  }

  for (const version of php.versions) {
    packages = packages.concat(
      php.extensions.map(
        ext => `php${version}-${ext}`
      ),
      php.apacheMod ? [`libapache2-mod-php${version}`] : [])
    cmds = cmds.concat(php.extensions.map(
      ext => `phpenmod -v ${version} ${ext}`
    ))
  }
}

// VS Code, using official repository
// TODO: add support for Codium
if (vscode) {
  aptKeys["packages.microsoft.gpg"] = "https://packages.microsoft.com/keys/microsoft.asc";
  aptLists["vscode.list"] = ["deb [arch=amd64,arm64,armhf signed-by=/etc/apt/keyrings/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main"];
  packages.push(
    typeof vscode === "string" ? `code-${vscode}` : "code"
  );
}

// Signal Desktop, using official repository
if (signal) {
  aptKeys["signal-desktop-keyring.gpg"] = "https://updates.signal.org/desktop/apt/keys.asc";
  aptLists["signal-desktop-keyring.list"] = [
   "deb [arch=amd64 signed-by=/usr/share/keyrings/signal-desktop-keyring.gpg] https://updates.signal.org/desktop/apt xenial main"
  ];
  packages.push("signal-desktop");
}

// Signal Desktop, using distro repository
// TODO: find better way to ensure latest versions
if (telegram) {
  // FIXME: couldn't find any official telegram repository
  // though I don't want to depend on standard distro repos
  packages.push("telegram-desktop")
}

// Spotify, using official repository
if (spotify) {
  aptKeys["spotify.gpg"] = "https://download.spotify.com/debian/pubkey_7A3A762FAFD4A51F.gpg";
  aptLists["spotify.list"] = ["deb http://repository.spotify.com stable non-free"];
  packages.push("spotify-client");
}

// 1Password, using official repository
if (onepassword) {
  aptKeys["1password-archive-keyring.gpg"] = "https://downloads.1password.com/linux/keys/1password.asc";
  aptLists["1password.list"] = ["deb [arch=amd64 signed-by=/usr/share/keyrings/1password-archive-keyring.gpg] https://downloads.1password.com/linux/debian/amd64 stable main"];
  packages.push("1password");
}

// Stream, using official repository
if (steam) {
  aptLists["steam-stable.list"] = [
    "deb [arch=amd64,i386 signed-by=/usr/share/keyrings/steam.gpg] https://repo.steampowered.com/steam/ stable steam",
    "deb-src [arch=amd64,i386 signed-by=/usr/share/keyrings/steam.gpg] https://repo.steampowered.com/steam/ stable steam"
  ];

  if (!architectures.includes("i386")) {
    architectures.push("i386");
  }

  packages = packages.concat([
    "libgl1-mesa-dri:amd64",
    "libgl1-mesa-dri:i386",
    "libgl1-mesa-glx:amd64",
    "libgl1-mesa-glx:i386",
    "steam-launcher"
  ]);
}

// Discord, using official .deb
if (discord) {
  debs.push("https://discordapp.com/api/download?platform=linux&format=deb")
}

// JetBrains Toolbox, using official installer script
if (jetbrainsToolbox) {
  if (!silent) {
    console.log("Info: JetBrains Toolbox will pop out once installed, you can use/close it.");
  }

  let link = '';

  if (typeof jetbrainsToolbox !== "string") {
    apiUrl = 'https://data.services.jetbrains.com/products/releases?code=TBA&latest=true&type=release';
  } else {
    apiUrl = `https://download.jetbrains.com/toolbox/jetbrains-toolbox-${jetbrainsToolbox}.tar.gz`
  }

  cmds.push("mkdir /temp/liliana--toolbox");
  cmds.push("wget -O /tmp/liliana--toolbox/jetbrains-toolbox.tar.gz");
  cmds.push("tar -xzvf /tmp/liliana--toolbox/jetbrains-toolbox.tar.gz -C /tmp/liliana--toolbox --strip-components=1")
  cmds.push("chmod +x /tmp/liliana--toolbox/jetbrains-toolbox")
  cmds.push("bash /tmp/liliana--toolbox/jetbrains-toolbox")
}

// Cleanup
cmds.push("rm -rf /tmp/liliana--*");

// ---------

/**
 * Generating output
 */

if (debugTree) {
  console.log({ dependentPackages, aptLists, aptKeys, architectures, debs, beforePackagesCmds, aptKeys, ppas, packages, cmds })
}

let output = [].concat(
  ['apt update', `apt install ${dependentPackages.join(" ")} -y`],
  ...Object.keys(aptLists).map(k => [
    ...[aptLists[k].map(deb => `echo "${deb}" | tee /etc/apt/sources.list.d/${k}`)]
  ]),
  ...Object.keys(aptKeys).map(i => [
    `wget -qO- ${aptKeys[i]} | gpg --dearmor --yes > /tmp/liliana--${i}`,
    `install -D -o root -g root -m 644 /tmp/liliana--${i} /etc/apt/keyrings/${i}`
  ]),
  architectures.map(arch => `dpkg --add-architecture ${arch}`),
  ...debs.map((deb, i) => [
    `wget -O /tmp/liliana--deb-${i}.deb ${deb}`,
    'gdebi /tmp/liliana--deb-${i}.deb'
  ]),
  beforePackagesCmds,
  ppas.map(ppa => `add-apt-repository ppa:${ppa}`),
  [`apt update`, `apt install -y ${packages.join(" ")}`],
  cmds,
);

console.log(output.join("\n"));
