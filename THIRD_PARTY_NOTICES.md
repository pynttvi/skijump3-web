# Ski Jump International 3 — source-based Canvas adaptation

Original game © Ville Könönen, 1994 onward. Additional programming and graphics
by Lasse Makkonen. See CREDITS.TXT for the complete original credits.

Source: https://github.com/suomipelit/skijump3
Pinned revision: ba1d5035af483a2c575bb38af64de61322d7e2a5
The original source and assets are supplied under GPL-3.0; preserve COPYING.

The browser simulation translates the original hyppy(), animation tables, wind,
landing risk and scoring formulas. Hill profiles are calculated with LaskeLinjat's
algorithm and checked against all twenty original profile checksums. PCX and
ANIM.SKI graphics are decoded from the pinned repository without AI replacement.

The Canvas shell comes from this repository's GPL-3.0 UI template. This browser
adaptation also uses GPL-3.0. Fixed-step scheduling, browser keyboard handling,
xorshift random numbers, synthesized sound and the simplified outrun/crash
presentation are compatibility changes. No binary/runtime parity is claimed.
Original DOS records and official competition results are not compatible.

Original GPL source, PCX graphics, ANIM.SKI and HILLBASE.SKI inputs are preserved
in source/upstream/. Their SHA-256 hashes and pinned commit are recorded in
source/upstream-provenance.json. The site includes skijump3-source.tar.gz with
the editable browser code, original inputs, build scripts, tests/verification,
and license/credits. Run npm run build with Node 22+ to reproduce the site.
This modified Canvas adaptation was prepared in 2026 and is not an official
release by the original authors.
