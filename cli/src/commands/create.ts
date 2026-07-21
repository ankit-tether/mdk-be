import type { Command } from 'commander';
import { stub } from '../lib/stub.js';

// Group B — Scaffold (backend only)
export function registerCreate(program: Command): void {
  const create = program
    .command('create')
    .description('Scaffold backend components (stub)');

  create
    .command('worker <name>')
    .description('Scaffold a Worker Plugin package (stub)')
    .option('--org <scope>', 'npm scope/org for the generated package')
    .option('--dir <path>', 'Target directory')
    .option('--force', 'Overwrite the target if it already exists', false)
    .action((name: string) => stub(`create worker ${name}`));

  create
    .command('plugin <name>')
    .description('Scaffold a Gateway Plugin package (stub)')
    .option('--org <scope>', 'npm scope/org for the generated package')
    .option('--dir <path>', 'Target directory')
    .option('--force', 'Overwrite the target if it already exists', false)
    .action((name: string) => stub(`create plugin ${name}`));
}
