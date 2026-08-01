# Releasing a new version on Twitch

First and foremost, we need to establish the new version number. Compare `main` to the most recent tagged version in the repository and decide if the release is a minor (new features) or patch (bug fixes) release. The commit being submitted to Twitch should be tagged via git with `git tag v<version>` if you're currently at the commit being used, or `git tag v<version> <commit>` if not. Once the tag is created, push it with `git push origin v<version>`.

## Local test

All new versions start in local test where the base URI is `https://localhost:8080/`, allowing a locally run version to be tested.

The "panel viewer path" should be `panel.html`, the "mobile viewer path" as `mobile.html`, and "video - fullscreen viewer path" as `video_overlay.html`.

### Allowlists

Get these right or the extension silently breaks under Twitch's CSP.

| Allowlist     | Value                                                                                                                                      | Why                                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Image domains | `https://cdn.shopify.com`                                                                                                                  | **Product images.** Every `image_url` in `public/products.json` is a Shopify CDN URL — this is _not_ `elfcosmetics.com`, and getting it wrong blocks every product image. |
| URL fetching  | `wss://irc-ws.chat.twitch.tv:443`<br>`ws://irc-ws.chat.twitch.tv:80`<br>`irc://irc.chat.twitch.tv:6667`<br>`irc://irc.chat.twitch.tv:6697` | Connecting to chat, for the moderator commands.                                                                                                                           |

Verify the image host against the data rather than trusting this table — it changes if
products are sourced differently:

```sh
node -e 'console.log([...new Set(require("./public/products.json").map(p=>new URL(p.image_url).host))])'
```

> No media/font domain is required. `src/template.html` has `preconnect` hints for
> Google Fonts, but nothing actually loads a font — the `--font-sans` stack asks for
> "Futura Now Text" and falls back to system sans if it isn't installed locally. If
> webfonts are added later, that allowlist entry becomes necessary.

## Hosted test

Once local testing is complete, a build can be created with `pnpm build`. The resulting [`build/build.zip`](build/build.zip) (an archive of all files within the `build` directory) can be uploaded to Twitch for hosted testing.

With the assets hosted on Twitch, install the extension version on a test channel and verify that everything is working as expected when running from Twitch.

## Before you submit

The console reports missing Version Details one error at a time, so it is quicker to walk this list than to find the gaps one upload at a time.

### Version Details

| Field                           | Value                               |
| ------------------------------- | ----------------------------------- |
| Panel viewer path               | `panel.html`                        |
| Mobile viewer path              | `mobile.html`                       |
| Video - fullscreen path         | `video_overlay.html`                |
| Privacy Notice                  | A public URL — required, see below  |
| EULA or Terms of Service        | A public URL — see below            |
| Image / URL fetching allowlists | See [Allowlists](#allowlists) above |

Both legal URLs point at pages e.l.f. owns and must approve. Neither is something this repository can satisfy on its own.

**The Privacy Notice is not optional for this extension.** Twitch demands one from every mobile-enabled extension and blocks submission without it:

> Mobile-enabled Extensions must include a Privacy Notice before they can be submitted for review. Please set this under Version Details, or disable your Extension's mobile view if it is not necessary.

The console offers disabling the mobile view as the way out. Don't take it — `mobile.html` is a first-class surface here and a large share of Twitch viewing is mobile. Supply the URL instead.

What the notice needs to cover is already written up under "User Data" in [README.md](README.md): an anonymous chat connection used only to hear moderator commands, a local storage entry holding viewer preferences, no identity sharing, and no stored messages. Hosting that and getting it approved is e.l.f.'s call rather than this repo's — the corporate privacy policy is the fastest option, though it won't describe the chat connection or local storage specifically.

**The EULA / Terms of Service URL** is described in the console as a "Reference URL for your EULA (End User License Agreement) or TOS (Terms of Service) of your Extension".

Here e.l.f.'s existing store terms are arguably the correct answer rather than merely the convenient one. This extension does not transact, hold accounts, take payment, or accept user-generated content — it is a browsing surface, and every purchase completes on elfcosmetics.com under those terms already. A bespoke agreement would mostly restate them.

Do not point this field at [LICENSE.md](LICENSE.md). That is the upstream Apache 2.0 licence, and it governs redistribution of this source code — it is not an agreement between viewers and e.l.f. A reviewer who follows the link will read the wrong document and can reasonably reject the version for it.

### Image assets

All four are uploaded under Version Details. Each must be a PNG at exactly the stated size; the console rejects anything else.

| Asset        | Size       | Where it shows                     | Notes                                                                                                                                        |
| ------------ | ---------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Logo         | 100 × 100  | Extension listing                  | The elfyou roundel from [`src/assets/logo.png`](src/assets/logo.png), scaled down. Keep the transparency — Twitch renders it on dark chrome. |
| Taskbar icon | 24 × 24    | Video player taskbar               | Video extensions only. The wordmark is unreadable below ~48px, so this reads as a coloured mark rather than a legible logo.                  |
| Discovery    | 300 × 200  | Discovery tab of Extension Manager | The magenta-on-indigo lockup.                                                                                                                |
| Screenshot   | 1024 × 768 | Extension Detail page              | Shows the overlay in use. Best retaken from the live channel once the hosted-test version is installed.                                      |

These come from the elfyou brand assets, not from anything in this repository — `pnpm build` does not produce them. Keep the uploaded copies with the brand files so the next version can reuse them.

## Submit for review

With the extension installed on a test channel, submit the extension for review, providing the URL for the channel to use for testing.

Include the walkthrough guide for the extension, with an updated changelog of what changed for users of the extension since the last version submitted and a link to compare the versions on GitHub.

Two things to decide before submitting, as they depend on how the extension is being distributed:

- **Distribution.** Whether this is released globally or restricted to an allowlist of channels. The reviewer will ask why, so state the actual reason.
- **External links.** The list below is generated from the code; re-check it if the Welcome card or product set has changed.

<details>
<summary>Walkthrough guide and changelog template</summary>

```text
This extension displays e.l.f. Cosmetics products within the Panel and Overlay views.
It is designed for the elfyou Twitch channel.
It allows viewers to browse products by category (Makeup, Skincare, Haircare) at any time, and click through to the product page to buy.
It allows the broadcaster/moderators to run chat commands to display a specific product to everyone, as it is featured on stream.

This extension is made with React, and is bundled with Webpack.

Changelog:

    - <insert changes here>

Source code diff:

    https://github.com/egen-co/not-shoppable/compare/v<previous version here>...v<new version here>

External links:

    Product links open the e.l.f. Cosmetics store. Social links and the credit link are in the overlay welcome card.

    - go.elfcosmetics.com (product pages, and the store homepage from the welcome card)
    - instagram.com/elfcosmetics
    - tiktok.com/@elfyeah
    - x.com/elfcosmetics
    - facebook.com/elfcosmetics
    - alveussanctuary.org (credit for the open-source extension this is built on)

Allowlist explanations:

    - `https://cdn.shopify.com` Shopify CDN, where the e.l.f. product images are hosted
    - `wss://irc-ws.chat.twitch.tv:443`, `ws://irc-ws.chat.twitch.tv:80`, `irc://irc.chat.twitch.tv:6667`, `irc://irc.chat.twitch.tv:6697` Twitch chat URLs, for the chatbot to connect to

Testing the Extension:

    - For overlay, mobile + panel: Click the category buttons to browse products, then a product to see its card
    - For overlay: As a moderator or broadcaster, type `!welcome` in chat to trigger the welcome card, or `!shampoo` to trigger a product card
```

</details>

## Release

The review process usually takes 1-2 weeks, and once approved, the extension can be released in the extension manager.
