# `@tetherto/mdk-cli`

The `mdk` command-line tool. This package is a **scaffold**: the entire command
surface from the CLI HLD (`../docs/hld-mdk-cli.md`) is wired up with Commander.js
and `@clack/prompts`. **`mdk onboard` is fully implemented** — a colorful, guided
wizard that detects the environment, asks the setup questions (with pre-filled
defaults), writes `mdk.yaml`, and prints the commands to run the stack. **Every
other command is a no-op stub**, ready for another developer to plug in the real
functionality command by command.

## Stack

- **Runtime:** Node.js >= 20, TypeScript, ESM.
- **Framework:** [Commander.js](https://github.com/tj/commander.js) for the
  command tree, parsing, and help; [`@clack/prompts`](https://github.com/bombshell-dev/clack)
  for interactive wizard steps.
- The `mdk` binary is exposed via the package.json `bin` field pointing at
  `dist/index.js` (which carries a `#!/usr/bin/env node` shebang).

## Develop

```bash
npm install
npm run dev -- --help        # run from source via tsx
npm run build                # compile to dist/
node dist/index.js --help    # run the built CLI
```

Link it as a global `mdk` for local testing:

```bash
npm run build && npm link
mdk --help
```

## Command surface

`mdk onboard` runs the real interactive wizard; `mdk version` prints the package
version. Every other command is a stub that prints a "not implemented" notice to
stderr and exits 0.

| Group | Commands |
| ----- | -------- |
| Onboarding | `mdk onboard` |
| Scaffold | `mdk create worker <name>`, `mdk create plugin <name>` |
| Run & manage | `mdk run [target] [name]`, `mdk get <resource>`, `mdk describe <resource> <name>`, `mdk logs <target>`, `mdk status`, `mdk apply -f <file>`, `mdk diff -f <file>` |
| Discover | `mdk discover` |
| Contexts | `mdk context list|current|use|set|remove` |
| Agent enablement | `mdk skill add`, `mdk mcp register` |
| Meta | `mdk manifest` (alias `json-help`), `mdk version` |

Global flags: `-o, --output <fmt>`, `-v, --verbose`, `--debug`, `--version`, `-h, --help`.

## Implementing a command

Each command lives under `src/commands/`. To add behavior, replace the
`stub(...)` call in the command's `.action(...)` with the real implementation.
The command wiring (name, arguments, options, help) does not need to change.
