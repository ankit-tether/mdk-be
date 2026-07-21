import type { Command } from 'commander';
import {
  intro,
  outro,
  text,
  select,
  multiselect,
  confirm,
  spinner,
  note,
  log,
  isCancel,
  cancel,
} from '@clack/prompts';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { stringify as toYaml } from 'yaml';
import { detectEnvironment } from '../lib/detect.js';
import { buildStackSpec } from '../lib/spec.js';
import { theme, badge, banner, kvBlock, cmdBlock, tick } from '../lib/theme.js';
import { pkg } from '../lib/pkg.js';

const WORKER_PLUGINS = [
  { value: '@tetherto/mdk-worker-miner', label: 'mdk-worker-miner', hint: 'ASIC miners' },
  { value: '@tetherto/mdk-worker-powermeter', label: 'mdk-worker-powermeter', hint: 'power meters' },
  { value: '@org/mdk-worker-modbus', label: 'mdk-worker-modbus', hint: 'generic Modbus devices' },
];

const GATEWAY_PLUGINS = [
  { value: '@tetherto/mdk-plugin-summary', label: 'mdk-plugin-summary', hint: 'fleet summary' },
  { value: '@tetherto/mdk-plugin-alerts', label: 'mdk-plugin-alerts', hint: 'alerting' },
];

const AGENT_CLIENTS = [
  { value: 'cursor', label: 'Cursor' },
  { value: 'claude', label: 'Claude Code' },
  { value: 'codex', label: 'Codex' },
  { value: 'cline', label: 'Cline' },
];

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function bail(): never {
  cancel('Onboarding cancelled — no files were changed.');
  process.exit(0);
}

/** Lightweight section divider so related prompts read as a group. */
function section(title: string): void {
  log.step(theme.brand(title));
}

function shortLabel(pkgName: string): string {
  return pkgName.split('/').pop() ?? pkgName;
}

// Group A — Onboarding & project lifecycle
export function registerOnboard(program: Command): void {
  program
    .command('onboard')
    .description('Guided setup wizard: detect, configure, write mdk.yaml, print run commands')
    .action(runOnboard);
}

async function runOnboard(): Promise<void> {
  if (!process.stdin.isTTY) {
    process.stderr.write('mdk onboard needs an interactive terminal (TTY).\n');
    process.exit(1);
  }

  console.log(banner());
  intro(`${badge('MDK')}  ${theme.brand('developer onboarding')}  ${theme.muted(`v${pkg.version}`)}`);
  log.message(
    theme.muted('A few quick questions — each has a sensible default. Press Enter to accept.'),
  );

  // 1. Detect environment ---------------------------------------------------
  const s = spinner();
  s.start('Detecting environment');
  await delay(500);
  const env = detectEnvironment();
  s.stop(`${tick} Environment detected`);

  note(
    kvBlock([
      [
        'Node',
        env.nodeOk ? theme.ok(env.nodeVersion) : theme.warn(`${env.nodeVersion} (need >= 20)`),
      ],
      ['Package manager', theme.value(env.packageManager)],
      ['Git repo', env.git ? theme.ok('yes') : theme.muted('no')],
      ['Existing spec', env.existingSpec ? theme.warn('mdk.yaml present') : theme.muted('none')],
      ['Agent client', env.agentClient === 'none' ? theme.muted('none') : theme.ok(env.agentClient)],
    ]),
    theme.accent('environment'),
  );

  // 2. Project --------------------------------------------------------------
  section('Project');

  const projectDir = await text({
    message: 'Project directory',
    placeholder: '.',
    defaultValue: '.',
    initialValue: '.',
  });
  if (isCancel(projectDir)) bail();

  const stackName = await text({
    message: 'Stack name',
    placeholder: 'my-stack',
    defaultValue: 'my-stack',
    initialValue: 'my-stack',
  });
  if (isCancel(stackName)) bail();

  // 3. Runtime --------------------------------------------------------------
  section('Runtime');

  const mode = await select({
    message: 'Process mode',
    options: [
      {
        value: 'single-process',
        label: 'single-process',
        hint: 'everything in one process (recommended for first run)',
      },
      { value: 'multi-process', label: 'multi-process', hint: 'each component in its own process' },
    ],
    initialValue: 'single-process',
  });
  if (isCancel(mode)) bail();

  const useDefaultPorts = await confirm({
    message: 'Use default ports (Gateway 3847, Kernel 3848, workers 3850+)?',
    initialValue: true,
  });
  if (isCancel(useDefaultPorts)) bail();

  let gatewayPort = 3847;
  let kernelPort = 3848;
  let workerBasePort = 3850;
  if (!useDefaultPorts) {
    const gp = await text({ message: 'Gateway port', defaultValue: '3847', initialValue: '3847' });
    if (isCancel(gp)) bail();
    const kp = await text({ message: 'Kernel port', defaultValue: '3848', initialValue: '3848' });
    if (isCancel(kp)) bail();
    const wp = await text({
      message: 'Worker base port',
      defaultValue: '3850',
      initialValue: '3850',
    });
    if (isCancel(wp)) bail();
    gatewayPort = Number(gp) || 3847;
    kernelPort = Number(kp) || 3848;
    workerBasePort = Number(wp) || 3850;
  }

  // 4. Plugins --------------------------------------------------------------
  section('Plugins');

  const workerPackages = await multiselect({
    message: 'Worker plugins to install',
    options: WORKER_PLUGINS,
    required: false,
  });
  if (isCancel(workerPackages)) bail();

  const gatewayPackages = await multiselect({
    message: 'Gateway plugins to install',
    options: GATEWAY_PLUGINS,
    required: false,
  });
  if (isCancel(gatewayPackages)) bail();

  // 5. Developer experience -------------------------------------------------
  section('Developer experience');

  const addUi = await confirm({
    message: 'Add the UI dashboard (MDK Next.js starter)?',
    initialValue: true,
  });
  if (isCancel(addUi)) bail();

  const installSkill = await confirm({
    message: 'Install the MDK Developer Skill (makes your coding agent MDK-aware)?',
    initialValue: true,
  });
  if (isCancel(installSkill)) bail();

  let client: string = env.agentClient === 'none' ? 'cursor' : env.agentClient;
  if (installSkill) {
    const picked = await select({
      message: 'Coding-agent client',
      options: AGENT_CLIENTS,
      initialValue: client,
    });
    if (isCancel(picked)) bail();
    client = picked as string;
  }

  // 6. Build spec + review --------------------------------------------------
  const spec = buildStackSpec({
    stackName: stackName as string,
    mode: mode as string,
    gatewayPort,
    kernelPort,
    workerBasePort,
    workerPackages: workerPackages as string[],
    gatewayPackages: gatewayPackages as string[],
  });
  const workers = spec.spec.workers;

  const targetDir = resolve(projectDir as string);
  const specPath = resolve(targetDir, 'mdk.yaml');
  const specExists = existsSync(specPath);

  const workerSummary = workers.length
    ? workers.map((wk) => shortLabel(wk.package)).join(', ')
    : theme.muted('none');
  const gatewaySummary = (gatewayPackages as string[]).length
    ? (gatewayPackages as string[]).map(shortLabel).join(', ')
    : theme.muted('none');

  note(
    kvBlock([
      ['Stack', theme.value(stackName as string)],
      ['Mode', theme.value(mode as string)],
      ['Ports', theme.value(`gateway ${gatewayPort} · kernel ${kernelPort} · workers ${workerBasePort}+`)],
      ['Workers', workerSummary],
      ['Gateway plugins', gatewaySummary],
      ['UI dashboard', addUi ? theme.ok('yes') : theme.muted('no')],
      ['Developer Skill', installSkill ? theme.ok(`yes (${client})`) : theme.muted('no')],
      ['Spec file', specExists ? theme.warn(`${specPath} (overwrite)`) : theme.value(specPath)],
    ]),
    theme.accent('review'),
  );

  const proceed = await confirm({
    message: specExists
      ? 'Overwrite mdk.yaml with these settings?'
      : 'Write mdk.yaml with these settings?',
    initialValue: true,
  });
  if (isCancel(proceed) || !proceed) bail();

  // 7. Write mdk.yaml -------------------------------------------------------
  const w = spinner();
  w.start('Writing mdk.yaml');
  await delay(400);
  try {
    mkdirSync(targetDir, { recursive: true });
    writeFileSync(specPath, toYaml(spec), 'utf8');
    w.stop(`${tick} Wrote ${theme.value(specPath)}`);
  } catch (error) {
    w.stop(theme.warn('Could not write mdk.yaml'));
    log.error(error instanceof Error ? error.message : String(error));
    bail();
  }

  // 8. Side-effects (stubbed) ----------------------------------------------
  if (installSkill) {
    const sk = spinner();
    sk.start(`Installing MDK Developer Skill for ${client}`);
    await delay(500);
    sk.stop(`${tick} Developer Skill installed ${theme.muted('(stub)')}`);
    log.message(
      theme.muted('would run: npx skills add @tetherto/mdk-skill · register Gateway MCP · write AGENTS.md'),
    );
  } else {
    log.message(theme.muted('Skipped skill install. Later: mdk skill add'));
  }

  if (addUi) {
    const ui = spinner();
    ui.start('Scaffolding UI dashboard (Next.js starter)');
    await delay(500);
    ui.stop(`${tick} UI dashboard scaffolded ${theme.muted('(stub)')}`);
    log.message(theme.muted('would scaffold the MDK Next.js starter into ./dashboard'));
  }

  // 9. Next steps -----------------------------------------------------------
  const runRows: Array<[string, string?]> =
    (mode as string) === 'single-process'
      ? [['mdk run', 'boots Kernel + Gateway + workers in one process']]
      : [
          ['mdk run kernel'],
          ['mdk run gateway'],
          ...workers.map((wk) => [`mdk run worker ${wk.name}`] as [string]),
        ];

  const parts = [
    theme.label('1. Review your spec'),
    cmdBlock([['mdk.yaml', 'add devices & plugin config, then save']]),
    '',
    theme.label('2. Start the stack'),
    cmdBlock(runRows),
    '',
    theme.label('3. Manage it'),
    cmdBlock([
      ['mdk status', 'check the stack'],
      ['mdk create worker', 'scaffold a new worker plugin'],
    ]),
  ];
  if (addUi) {
    parts.push('', `${theme.label('Dashboard')}   ${theme.value('http://localhost:3000')}`);
  }

  note(parts.join('\n'), theme.accent('next steps'));

  outro(`${tick} ${theme.brand('MDK is ready.')} ${theme.muted('Happy building.')}`);
}
