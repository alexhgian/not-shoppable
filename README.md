# The Alveus Twitch Extension

Twitch extension for [Alveus Sanctuary](https://www.alveussanctuary.org), allowing stream viewers to learn more about the ambassadors at the sanctuary.

## Demo

### Overlay

https://user-images.githubusercontent.com/49528805/229294979-1cf91fc2-420a-43ec-95c4-78c06d4ec99d.mp4

### Panel

https://user-images.githubusercontent.com/49528805/229295136-675313d2-54e4-4758-a42c-76961c4d2e66.mp4

### Mobile

https://user-images.githubusercontent.com/49528805/229295376-6490d0a5-5f01-456b-8509-6e551ce82f1c.mp4

## Local Set Up

1. Install Node.js (see `engines` in `package.json` for the required versions), or use `fnm`/`nvm` to install the correct version of Node.js, and use `corepack enable` to use PNPM.
2. Authenticate with the GitHub Package Registry: `npm login --auth-type=legacy --registry=https://npm.pkg.github.com`
   1. Use your GitHub username (lowercase) as the username when prompted
   2. Create a [GitHub personal access token (classic)](https://github.com/settings/tokens/new) with the `read:packages` scope and use it as the password when prompted
3. Install dependencies for the project with `pnpm install --frozen-lockfile`
4. Head up to https://dev.twitch.tv/console/extensions/create and create a new extension.
   You will need to create a new version: Select `Panel`, `Mobile` and `Video - Fullscreen` for the extension type. Leave all other settings as they are.
5. Copy the `.env.sample` file to `.env` (which sets `REACT_APP_CHAT_COMMANDS_PRIVILEGED_USERS` and `REACT_APP_DEFAULT_CHANNEL_NAMES`)
6. Copy the `.env.development.sample` file to `.env.development`. You may add a channel and user to test chat commands here (e.g. `REACT_APP_CHAT_COMMANDS_TEST_CHANNEL=testuser` and `REACT_APP_CHAT_COMMANDS_PRIVILEGED_USERS=testuser`)
7. Start the development server with `pnpm dev`

If you're using VSCode, add `"typescript.tsdk": "node_modules/typescript/lib"` to `.vscode/settings.json` to ensure you're using the correct TypeScript version.

There are two ways to run the extension. You can either add it to a channel on Twitch, or access the web pages for the panel/overlay directly.

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

## Contribute

Contributions are always welcome! If you have any ideas, suggestions, fixes, feel free to contribute. Make sure to discuss what you plan to work on either as an issue or in the discussion page. You can also throw in any ideas at all in the discussion page. You can contribute to the codebase by going through the following steps:

1. Fork this repo
2. Create a branch: `git checkout -b youruserame/your-feature`
3. Make some changes
4. Test your changes
5. Push your branch and open a Pull Request

<b>\*Note:</b> All contributions must be possible for all displays (Overlay & Panel) and responsive to their different sizes (including mobile).

## User Data

When using the extension, the extension will create an anonymous connection to the current Twitch channel's chat, as well as a few other Alveus-related Twitch channels. This is to allow the extension to listen for commands run by moderators to trigger popups in the overlay. The extension does not store any messages from chat.

When using the extension, it will create a local storage entry in your browser to store the last section of the overlay that you accessed, and any preferences you set (such as disabling the mod-triggered popups). This is to allow the extension to remember your preferences between sessions. The data stored in local storage is not shared with anyone and does not include any personal information.

As a moderator, you can grant the extension access to your identity. This gives the extension information about your Twitch account, including your role in the current Twitch channel chat. This is used to determine if you are a moderator or broadcaster, and if so, shows you the chat commands in the extension to trigger the popups. The extension does not store any information about your Twitch account.
