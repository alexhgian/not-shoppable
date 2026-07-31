# elfyou Twitch Extension

Twitch extension for the [**elfyou**](https://www.twitch.tv/elfyou) channel, letting
stream viewers browse e.l.f. products and click through to
[elfcosmetics.com](https://www.elfcosmetics.com).

Products are grouped into **Makeup**, **Skincare** and **Haircare**. Moderators can
push a specific product card on screen with a chat command.

Forked from [`alveusgg/extension`](https://github.com/alveusgg/extension) — see
[LICENSE.md](LICENSE.md).

## Surfaces

The same catalogue is rendered in three places, all built from `src/pages/`:

| Surface     | Entry                | What it is                                                                                                                  |
| ----------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Overlay** | `video_overlay.html` | Buttons down the left of the video. Each opens a scrollable product list; picking one shows its card. Auto-hides when idle. |
| **Panel**   | `panel.html`         | Below-stream panel. Category tabs and a product grid; tapping a product opens its card in a dialog.                         |
| **Mobile**  | `mobile.html`        | Same build as the panel.                                                                                                    |

## Local Set Up

1. Install Node.js (see `engines` in `package.json` for the required versions), or
   use `fnm`/`nvm` to install the correct version, and run `corepack enable` to use
   PNPM.
2. Install dependencies with `pnpm install --frozen-lockfile`
3. Head to https://dev.twitch.tv/console/extensions/create and create a new
   extension. You will need to create a new version: select `Panel`, `Mobile` and
   `Video - Fullscreen` for the extension type. Leave all other settings as they are.
4. Copy `.env.sample` to `.env`
5. Copy `.env.development.sample` to `.env.development`. To test chat commands, set
   a channel to listen to and a user allowed to trigger them — e.g.
   `REACT_APP_TEST_CHANNEL_NAMES=testuser` and
   `REACT_APP_CHAT_COMMANDS_PRIVILEGED_USERS=testuser`
6. Start the development server with `pnpm dev`

If you're using VSCode, add `"typescript.tsdk": "node_modules/typescript/lib"` to
`.vscode/settings.json` to ensure you're using the correct TypeScript version.

> `REACT_APP_API_BASE_URL` appears in the env samples but is vestigial — it pointed
> at the upstream ambassador API, which was removed. It survives only as a
> `preconnect` hint in `src/template.html`.

There are two ways to run the extension. You can either add it to a channel on
Twitch, or access the web pages for the panel/overlay directly.

### Running via Twitch

If you're using Chrome, enable `allow invalid certificates for resources loaded from localhost`: [`chrome://flags/#allow-insecure-localhost`](chrome://flags/#allow-insecure-localhost).
If using Firefox, once you have started the development server, you will want to navigate to [`https://localhost:8080`](https://localhost:8080), click advanced and select accept the risk.

To test the overlay directly on Twitch, you will need to be live on Twitch with the extension installed.
The panel for the extension can be tested on Twitch while offline, as this is displayed on the channel page.

Under the `Status` tab of the extension version, scroll to the bottom and click on `View on Twitch and Install`. Install the extension on your channel and activate it.

If you are wanting to test the overlay, activate it for your overlay slot. Once activated, started broadcasting and the extension should be visible.
If you are testing the panel, make sure to activate the extension for a panel slot. You should then be able to see in on the channel about page.

If you want to use an alternate account, add the account to `Testing Account Allowlist` under the `Access` tab of the extension version and install the extension on that account.

Need a quick script to broadcast a test livestream? `curl` + `ffmpeg` have you covered:

```bash
#!/bin/bash

KEY="your_stream_key_here"

URL=$(curl -sS "https://ingest.twitch.tv/ingests" \
  | jq .ingests\[0].url_template -r \
  | sed "s/{stream_key}/$KEY/")

# Thanks to https://github.com/BarryCarlyon/twitch_misc/blob/main/extensions/test_stream/generic.sh
ffmpeg -re \
  -f lavfi -i testsrc2=size=960x540 \
  -f lavfi -i aevalsrc="sin(0*2*PI*t)" \
  -vcodec libx264 \
  -r 30 -g 30 \
  -preset fast -vb 1000k -pix_fmt rgb24 \
  -pix_fmt yuv420p \
  -f flv \
  $URL
```

### Running without Twitch

If you just want to test out the overlay, or the panel, locally without Twitch, you can do so by directly opening the pages in a browser. After all, Twitch overlays and panels are just embedded web apps.

The panel is available at [localhost:8080/panel.html](https://localhost:8080/panel.html) and the overlay is available at [localhost:8080/video_overlay.html](https://localhost:8080/video_overlay.html) while the development server is running.

Chat commands still work in this mode — the extension connects to the channels in
`REACT_APP_DEFAULT_CHANNEL_NAMES` and `REACT_APP_TEST_CHANNEL_NAMES`. What won't
work is anything needing Twitch to identify the channel, since that comes from the
Twitch helper.

## Chatbot Commands

Only mods, the broadcaster, and `REACT_APP_CHAT_COMMANDS_PRIVILEGED_USERS` can
trigger these. Each opens the product's card for 10 seconds.

`![product]`: displays the card for that product. Every product answers to

- its id — `!13`
- its name with spaces removed — `!neverthirstymoisturizingshampoo`
- any alias in its `commands` array — `!shampoo`

`!welcome`: displays the introduction card

Viewers can disable command-triggered pop-ups via **Prevent mod-triggered card
pop-ups** in the extension's settings panel.

## Adding Products

`public/products.json` is the catalogue. Rather than hand-editing it, paste the
list into a file and run:

```sh
node scripts/add-products.mjs --category Haircare products.txt   # dry run
node scripts/add-products.mjs --category Haircare --write products.txt
```

One product per line, tab- or pipe-separated. The alias and its `!` are both
optional, and lines without a URL are ignored, so a pasted block with a
heading works as-is:

```
HAIR
Never Thirsty Moisturizing Shampoo	!shampoo	https://go.elfcosmetics.com/shampoo
Gloss Mode Treatment Oil	glossmode	https://go.elfcosmetics.com/glossmode
```

Price and image are read from each product page's JSON-LD. **Don't replace this
with markup scraping** — e.l.f. product pages carry cross-sell carousels, so
"the first product image on the page" returns the same packshot for every
product, and a naive price grep can pick up a carousel item. The script guards
against this by rejecting a batch whose images share a SKU.

It also refuses to write if any product is already present, an alias is already
claimed, or an image or buy URL doesn't return 200 — and nothing is appended
unless the whole batch is clean, so a partial failure can't leave half a batch
in the catalogue.

Run `pnpm lint` afterwards; Prettier formats `products.json`.

### Adding a category

`src/utils/categories.ts` is the single source of truth. Add an entry there and the
overlay gains a button and the panel a tab. You also need an icon in
`categoryIcons` in `src/pages/overlay/components/overlay/Overlay.tsx` — omitting one
fails `pnpm types` rather than rendering a blank button.

## Brand Tokens

Colour lives in two layers in `src/styles/tailwind.css`:

- **Palette** — raw brand values (`--color-elfyou-magenta`). Not referenced by
  components.
- **Semantic roles** — what components actually use (`--color-surface`,
  `--color-accent`, `--color-highlight`).

**Components must reference roles, never palette values or raw hex.** That's what
makes the extension rethemeable, and hardcoding is how a non-brand pink shipped for
months before anyone noticed.

`brand/tokens.json` records each value, where it was measured, and any deliberate
divergence. `pnpm lint:tokens` (part of `pnpm lint`) fails if the stylesheet and
that record disagree, including when a colour is added without provenance.

## Scripts

| Command       | What it does                                                |
| ------------- | ----------------------------------------------------------- |
| `pnpm dev`    | Development server on port 8080 (HTTPS)                     |
| `pnpm build`  | Production build into `build/`, plus `build.zip` for Twitch |
| `pnpm types`  | `tsc --noEmit`                                              |
| `pnpm lint`   | ESLint, Prettier and the brand-token check                  |
| `pnpm format` | Fix what `lint` can fix automatically                       |

Releasing to Twitch is covered in [RELEASE.md](RELEASE.md).

## Contribute

Contributions are always welcome! If you have any ideas, suggestions or fixes, feel
free to contribute. Discuss what you plan to work on as an issue first.

1. Create a branch: `git checkout -b yourusername/your-feature`
2. Make some changes
3. Test your changes — `pnpm lint`, `pnpm types` and `pnpm build` should all pass
4. Push your branch and open a Pull Request

<b>\*Note:</b> All contributions must work on all displays (Overlay & Panel) and be
responsive to their different sizes, including mobile.

## User Data

The extension makes an anonymous connection to the current Twitch channel's chat,
plus the channels listed in `REACT_APP_DEFAULT_CHANNEL_NAMES` and
`REACT_APP_EXTRA_CHANNEL_NAMES`. This is so it can listen for the commands
moderators use to trigger product cards in the overlay. It does not store any
messages from chat.

The extension creates a local storage entry in your browser recording the last
section of the overlay you opened and any preferences you set, such as disabling
mod-triggered pop-ups. This is so your preferences persist between sessions. It is
not shared with anyone and contains no personal information.

The extension does **not** request identity sharing, and never sees your Twitch
username or account details. Whether someone may trigger a product card is decided
from the moderator and broadcaster badges attached to their chat messages, not from
any account lookup.
