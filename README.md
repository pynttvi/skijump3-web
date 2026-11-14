# Ski Jump International 3 — Canvas port

[Play on GitHub Pages](https://pynttvi.github.io/skijump3-web/) · [Source repository](https://github.com/pynttvi/skijump3-web)

Requires Node 22+; no npm dependencies or installation step.

    npm start

Open the printed address, or http://localhost:8084. The server binds all interfaces
for LAN play. Choose a different bind/port with:

    npm start -- --host 127.0.0.1 --port 8085

Up / Space: take off shortly before the lip. Right / Left: rotate forward/back.
T: telemark landing. R: two-foot landing. Prepare the landing before touching down.
Touch buttons provide the same controls. Practice assist can demonstrate the
source-based computer jumper's timing. Complete two jumps per competition.
Replay shows your recorded browser run; it does not read DOS replay files.

Twenty original hills and 177 animation frames are decoded from the GPL-3.0 Pascal
release. Flight, takeoff, wind and scoring formulas are translated from source.
Timing, random number sequences, input handling, presentation and simplified
outrun differ from DOS; no runtime parity is claimed. Cups, network multiplayer,
injuries, original menu systems and official records are not implemented.

    npm test
    npm run build
    npm run verify

Checks deterministic simulations on every hill. Preserve COPYING, CREDITS.TXT
and THIRD_PARTY_NOTICES.md when redistributing the source and assets.

## GitHub Pages

Pushes to main run syntax checks, twenty-hill deterministic replays, asset-hash
checks, a static build and verification of dist/, then publish to GitHub Pages.
The workflow also supports manual runs. Pages uses GitHub Actions as its source.
All URLs and module imports are relative for the /skijump3-web/ project subpath.

Edit the root JS/HTML/CSS files and assets/; dist/ is generated and ignored.
The build includes a downloadable corresponding-source archive and preserved
public GPL originals under source/upstream/. No npm installation is required.
Browser sound/fullscreen and measured DOS runtime parity remain unverified.

Use **Upscaled graphics: off/on** in the game toolbar to switch between original
and 4x nearest-neighbor graphics without restarting the jump. The complete set
is in assets/upscaled/nearest-4x; AI test crops are not game-ready assets.
