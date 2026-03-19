# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@0.12.8 create --template minimal --types ts --no-install .
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Deployment

### Docker

```sh
docker compose up -d
```

The app runs on port `3000` by default. To use a different port:

```sh
PORT=8080 docker compose up -d
```

To set a custom public origin (e.g. a domain):

```sh
PORT=8080 ORIGIN=https://oracula.example.com docker compose up -d
```

Or set these in a `.env` file alongside `docker-compose.yml`:

```
PORT=8080
ORIGIN=https://oracula.example.com
```

### Seeding the database

With the stack running, exec into the app container and run the seed script:

```sh
docker compose exec app npx tsx scripts/seed.ts
```

This works because the image includes `node_modules` (including `tsx`), and the container already has `DATABASE_URL` set to point at the `db` service.
