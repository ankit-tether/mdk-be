import type { Command } from 'commander';
import { stub } from '../lib/stub.js';

// Group C — Run & manage (read-only inspection commands)
export function registerGet(program: Command): void {
  program
    .command('get <resource>')
    .description('List live resources: workers | devices | plugins | contexts (stub)')
    .action((resource: string) => stub(`get ${resource}`));
}

export function registerDescribe(program: Command): void {
  program
    .command('describe <resource> <name>')
    .description('Detailed view of a single resource (stub)')
    .action((resource: string, name: string) => stub(`describe ${resource} ${name}`));
}

export function registerLogs(program: Command): void {
  program
    .command('logs <target>')
    .description('Stream logs for a service or worker (stub)')
    .option('-f, --follow', 'Follow log output', false)
    .option('--since <time>', 'Show logs since a timestamp or duration')
    .option('--tail <n>', 'Number of lines to show from the end')
    .action((target: string) => stub(`logs ${target}`));
}

export function registerStatus(program: Command): void {
  program
    .command('status')
    .description('One-shot check of the environment and every component (stub)')
    .action(() => stub('status'));
}
