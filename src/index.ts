import { Installer } from "./Installer"

const run = () => {
  // TODO
  console.log(new Installer(false, true)
    .docker()
    .php({
      versions: ["7.4", "8.0", "8.1", "8.2"],
      extensions: ["common", "cli", "gd", "mysql", "mbstring", "bcmath", "xml", "fpm", "curl", "zip"],
      composer: true,
      apacheMod: true
    })
    .vsc()
    .jbToolbox()
    .discord()
    .spotify()
    .telegram()
    .signal()
    .onePassword()
   // .steam()
    .deb(["https://global.synologydownload.com/download/Utility/ChatClient/1.2.1-0207/Ubuntu/x86_64/Synology%20Chat%20Client-1.2.1-0207.deb"])   
    .build())
}

run()