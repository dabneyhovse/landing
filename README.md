# dabney.house

This is an Astro project. To run locally, run `pnpm install`, and then `pnpm dev`. After pushing your changes, GitHub Actions will rebuild the container. Pressing the update button in `landing` on [containers.dabney.house](https://containers.dabney.house) will pull this new container and the changes will be reflected on [dabney.house](https://dabney.house).

## Project Structure

The project layout is:

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [the guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## Commands

All commands are run from the root of the project, from a terminal:

| Command                | Action                                           |
| :--------------------- | :----------------------------------------------- |
| `pnpm install`         | Installs dependencies                            |
| `pnpm dev`             | Starts local dev server at `localhost:4321`      |
| `pnpm build`           | Build your production site to `./dist/`          |
| `pnpm preview`         | Preview your build locally, before deploying     |
| `pnpm astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `pnpm astro -- --help` | Get help using the Astro CLI                     |

Feel free to check [Astro documentation](https://docs.astro.build).
