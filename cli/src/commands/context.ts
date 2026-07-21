import type { Command } from 'commander';
import { stub } from '../lib/stub.js';

// Group E — Contexts (multiple Gateways)
export function registerContext(program: Command): void {
  const context = program
    .command('context')
    .description('Point the CLI at a Gateway; manage named contexts (stub)');

  context
    .command('list')
    .description('List configured contexts (stub)')
    .action(() => stub('context list'));

  context
    .command('current')
    .description('Show the active context (stub)')
    .action(() => stub('context current'));

  context
    .command('use <name>')
    .description('Switch the active context (stub)')
    .action((name: string) => stub(`context use ${name}`));

  context
    .command('set <name>')
    .description('Add or update a context (stub)')
    .requiredOption('--gateway <url>', 'Gateway endpoint URL')
    .action((name: string) => stub(`context set ${name}`));

  context
    .command('remove <name>')
    .description('Remove a context (stub)')
    .action((name: string) => stub(`context remove ${name}`));
}
