import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { AddonOptions } from './schema';
import { Constants } from '../utility/utils';


const collectionPath = path.join(__dirname, '../collection.json');

describe('addon-schematics', () => {
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

  const defaultOptions: AddonOptions = {
    project: 'demo',
    packageName: 'actions',
    core: true
  };

  beforeEach(() => {
    appTree = runner.runExternalSchematic('@schematics/angular', 'workspace', workspaceOptions);
    appTree = runner.runExternalSchematic('@schematics/angular', 'application', appOptions, appTree);
  });

  it('should fail if no target application project is provided', async () => {
    let error;
    try {
      await runner.runSchematicAsync('addon', defaultOptions, Tree.empty()).toPromise();
    }
    catch (err) {
      error = err;
    }
    expect(error).not.toBeNull();
    expect(error.message).toEqual('Could not find (undefined)');
  }, 45000);

  it('should fail if no addon packageName is provided', async () => {
    let error;
    const options = { ...defaultOptions};
    delete options.packageName;
    try {
      await runner.runSchematicAsync('addon', options, appTree).toPromise();
    }
    catch (err) {
      error = err;
    }
    expect(error).not.toBeNull();
    expect(error.message).toEqual('Option "packageName" is required.');
  }, 45000);

  it('should create addons.js with addon import when none exists before', async () => {
    const tree = await runner.runSchematicAsync('addon', defaultOptions, appTree).toPromise();
    const files = tree.files;
    expect(files.indexOf('/projects/demo/.storybook/addons.js')).toBeGreaterThanOrEqual(0);

    const addonJsContent = tree.readContent('/projects/demo/.storybook/addons.js');
    expect(addonJsContent).toContain(`import '${Constants.coreAddonPrefix}${defaultOptions.packageName}/register';`);
  }, 45000);

  it('should update existing addons.js by inserting addon import if none existed already', async () => {
    appTree.create('/projects/demo/.storybook/addons.js', `
    import '@storybook-addon-links/register';
    import '@storybook-addon-knobs/register';
    `);
    const tree = await runner.runSchematicAsync('addon', defaultOptions, appTree).toPromise();
    const files = tree.files;
    expect(files.indexOf('/projects/demo/.storybook/addons.js')).toBeGreaterThanOrEqual(0);

    const addonJsContent = tree.readContent('/projects/demo/.storybook/addons.js');
    expect(addonJsContent).toContain(`import '@storybook-addon-links/register';`);
    expect(addonJsContent).toContain(`import '@storybook-addon-knobs/register';`);
    expect(addonJsContent).toContain(`import '${Constants.coreAddonPrefix}${defaultOptions.packageName}/register';`);
  }, 45000);

  it('should not update existing addons.js if addon is alreaded imported', async () => {
    appTree.create('/projects/demo/.storybook/addons.js', `
    import '@storybook-addon-links/register';
    import '${Constants.coreAddonPrefix}${defaultOptions.packageName}/register';
    import '@storybook-addon-knobs/register';
    `);
    const tree = await runner.runSchematicAsync('addon', defaultOptions, appTree).toPromise();
    const files = tree.files;
    expect(files.indexOf('/projects/demo/.storybook/addons.js')).toBeGreaterThanOrEqual(0);

    const addonJsContent = tree.readContent('/projects/demo/.storybook/addons.js');
    expect(addonJsContent).toContain(`import '@storybook-addon-links/register';`);
    expect(addonJsContent).toContain(`import '${Constants.coreAddonPrefix}${defaultOptions.packageName}/register';`);
    expect(addonJsContent).toContain(`import '@storybook-addon-knobs/register';`);
  }, 45000);

  it('should add approriate dependencies to package.json for core addon', async () => {
    const options = { ...defaultOptions, core:true};
    const tree = await runner.runSchematicAsync('addon', options, appTree).toPromise();
    const pkg = JSON.parse(tree.readContent('./package.json'));

    const coreAddonDependencies = [...Constants.addonDependencies, `${Constants.coreAddonPrefix}${defaultOptions.packageName}`];
    coreAddonDependencies.map(dep => expect(pkg.devDependencies[dep]).toBeDefined());
  }, 45000);

  it('should add approriate dependencies to package.json for community addon', async () => {
    const options = { ...defaultOptions, packageName:'storybook-chrome-screenshot', core:false};
    const tree = await runner.runSchematicAsync('addon', options, appTree).toPromise();
    const pkg = JSON.parse(tree.readContent('./package.json'));

    const coreAddonDependencies = [...Constants.addonDependencies, options.packageName];
    coreAddonDependencies.map(dep => expect(pkg.devDependencies[dep]).toBeDefined());
  }, 45000);


});
