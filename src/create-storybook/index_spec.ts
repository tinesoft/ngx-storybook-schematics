import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { CreateStorybookOptions } from './schema';
import { Constants } from '../utility/utils';


const collectionPath = path.join(__dirname, '../collection.json');

describe('create-storybook-schematics', () => {
  const runner = new SchematicTestRunner('ngx-storybook-schematics', collectionPath);

  let appTree: UnitTestTree;

  // tslint:disable-next-line:no-any
  const workspaceOptions: any = {
    name: 'workspace',
    newProjectRoot: 'projects',
    version: '6.0.0',
    skipGit: true,
    skipInstall: true
  };

  // tslint:disable-next-line:no-any
  const appOptions: any = {
    name: 'demo',
    inlineStyle: false,
    inlineTemplate: false,
    routing: false,
    style: 'css',
    skipTests: false,
  };

  const defaultOptions: CreateStorybookOptions = {
    project: 'demo'
  };

  beforeEach(() => {
    appTree = runner.runExternalSchematic('@schematics/angular', 'workspace', workspaceOptions);
    appTree = runner.runExternalSchematic('@schematics/angular', 'application', appOptions, appTree);
  });

  it('should fail if no target application project is provided', async () => {
    let error;
    try {
      await runner.runSchematicAsync('create-storybook', defaultOptions, Tree.empty()).toPromise();
    }
    catch (err) {
      error = err;
    }
    expect(error).not.toBeNull();
    expect(error.message).toEqual('Could not read package.json.');

  }, 45000);

  it('should create storybook files', async () => {
    const tree = await runner.runSchematicAsync('create-storybook', defaultOptions, appTree).toPromise();
    const files = tree.files;
    expect(files.indexOf('/projects/demo/.storybook/config.js')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/projects/demo/src/stories/index.ts')).toBeGreaterThanOrEqual(0);
  }, 45000);

  it('should add storybook dependencies and script to package.json', async () => {
    const tree = await runner.runSchematicAsync('create-storybook', defaultOptions, appTree).toPromise();
    const pkg = JSON.parse(tree.readContent('./package.json'));

    Constants.devDependencies.map(dep => expect(pkg.devDependencies[dep]).toBeDefined());
    for(let s in  Constants.pkgJsonScripts)
      expect(pkg.scripts[s]).toEqual(Constants.pkgJsonScripts[s]);
  }, 45000);

  it('should exclude storybook files from tsconfig.app.json if option is set', async () => {
    const options = {...defaultOptions, excludeStoriesFromAppCompilation: true};
    const tree = await runner.runSchematicAsync('create-storybook', options, appTree).toPromise();
    const tsconfig = JSON.parse(tree.readContent('/projects/demo/tsconfig.app.json'));

    Constants.tsConfigExclusions.map(e => expect(tsconfig.exclusions).toContain(e));
  }, 45000);
});
