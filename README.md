# Phrases Bot

A Reddit app that automatically replies to comments and posts when it finds
one of the configured phrases. It is designed so subreddit moderators can
adapt the bot to each community without changing the code.

## Moderator guide

### Configure phrases from Reddit

Configuration is done from the subreddit moderation menu, just like any other
app:

1. Go to the subreddit where the app is installed.
2. Open the subreddit moderation menu.
3. Find **Config Phrases Bot**.
4. In **Words and phrases that triggers the bot**, enter the phrases that
   should activate the bot, one per line.
5. In **Phrases that will comment the bot**, enter the possible responses,
   also one per line.
6. Save the changes by clicking **Save**.

The configuration is saved separately for each subreddit. Changes made in one
subreddit do not affect any other subreddit.

You do not need to write regular expressions or use any special syntax: enter
the phrases exactly as you want the bot to recognize them. Matching is
case-insensitive and allows multiple spaces between words.

For example, if you add `good evening!`, the bot can detect:

- `Good evening!`
- `GOOD    EVENING!`

Each response must be entered on a separate line. When the bot detects a
matching phrase, it randomly selects one response from the list. Responses are
posted exactly as written.

At least one trigger phrase and one response phrase must be provided. If either
field is empty, the app will not save the configuration and will display a
warning.

### What content the bot checks

- **Comments:** the comment text.
- **Posts:** the post title and content.

When it finds a match, the bot replies to that comment or post only once. If it
does not find any configured phrase, it does not post a reply.

### Default configuration

If you have not customized the bot yet, it uses these trigger phrases:

- `el laucha`
- `lautaro acosta`
- `laucha acosta`
- `al laucha`

The default responses are:

1. `es todo lo que yo no soy`
2. `Madurar es alcanzar un equilibrio, y en ese camino estoy, aprendiendo, escuchando a los que saben`
3. `Los jugadores de fútbol vivimos dentro de una burbuja`
4. `Mi ídolo no es ni Maradona, ni Messi... ¿Sabés quién es mi ídolo? Batistuta`
5. `No unifican criterios`
6. `Es un referí complicado. Depende quién lo necesite, dirige Hernán`
7. `No hay que confundirse y creer que todos somos millonarios`
8. `La gambeta me salvó la vida, y hacer terapia, la carrera`

When you save a custom configuration, the new phrases replace the defaults for
that subreddit.

## Installation and development

This section is for the person responsible for installing or updating the app.
Moderators who only need to customize phrases do not need to run these
commands.

### Requirements

- Node.js `24` or newer.
- A Reddit account with access to Devvit.
- A development subreddit for testing the app.

From the [`laucha-bot`](.) directory:

```bash
npm install
npm run login
```

To configure the development subreddit, set its name in `devvit.json`:

```json
{
  "dev": {
    "subreddit": "subreddit_name"
  }
}
```

Then start the playtest:

```bash
npm run dev
```

With the playtest active, publish a comment or post containing one of the
configured phrases and check the response on Reddit.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Starts the Devvit playtest. |
| `npm run build` | Builds the app. |
| `npm run test:types` | Runs the TypeScript type check. |
| `npm run test:unit` | Runs the existing unit tests. |
| `npm run lint` | Runs ESLint on the source code. |
| `npm run deploy` | Validates and uploads the app to Devvit. |
| `npm run launch` | Deploys and publishes the app for review. |
| `npm run login` | Signs in to the Devvit CLI. |

Before deploying, it is recommended to run:

```bash
npm run test:types
npm run lint
npm run build
```

## How it works

The app receives events for new comments and posts, checks the phrases
configured for the subreddit, and posts a reply when appropriate. It records
each item that has already received a reply to prevent duplicate responses if
Reddit sends the same event more than once.

The app requires the `reddit` and `redis` permissions declared in
`devvit.json`. If the subreddit or Devvit configuration changes, the app must
be deployed again.
