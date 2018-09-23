import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { ComponentOptions } from './schema';

const collectionPath = path.join(__dirname, '../collection.json');

describe('component-schematics', () => {
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

  const defaultOptions: ComponentOptions = {
    project: 'demo',
    name: 'MyComponent',
    useComponent: true
  };

  beforeEach(() => {
    appTree = runner.runExternalSchematic('@schematics/angular', 'workspace', workspaceOptions);
    appTree = runner.runExternalSchematic('@schematics/angular', 'application', appOptions, appTree);
  });

  it('should fail if no target application project is provided', async () => {
    let error;
    try {
      await runner.runSchematicAsync('component', defaultOptions, Tree.empty()).toPromise();
    }
    catch (err) {
      error = err;
    }
    expect(error).not.toBeNull();
    expect(error.message).toEqual('Could not find (undefined)');
  }, 45000);

  it('should create component files', async () => {
    const tree = await runner.runSchematicAsync('component', defaultOptions, appTree).toPromise();
    const files = tree.files;
    expect(files.indexOf('/projects/demo/src/app/my-component/my-component.component.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/projects/demo/src/app/my-component/my-component.component.html')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/projects/demo/src/app/my-component/my-component.component.css')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/projects/demo/src/app/my-component/my-component.component.spec.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/projects/demo/src/app/my-component/my-component.stories.ts')).toBeGreaterThanOrEqual(0);
  }, 45000);
});