import {
  Rule,
  SchematicContext,
  Tree,
  chain,
  url,
  apply,
  move,
  mergeWith,
  noop,
  template,
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

import {
  addPropertyToPackageJson,
  getLatestNodeVersion,
  NodePackage,
  getProjectPath,
  addPropertyToJsonAst,
  Constants,
} from '../utility/utils';

import {
  addPackageJsonDependency,
  NodeDependencyType,
} from '../utility/dependencies';

import { Observable, of } from 'rxjs';
import { map, concatMap } from 'rxjs/operators';
import { StorybookOptions } from './schema';


export default function(options: StorybookOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {

    return chain([
      updateDependencies(options),
      addStorybookFiles(options),
      addStorybookScriptToPackageJson(),
      options.excludeStoriesFromAppCompilation? addStorybookExclusionsToAppTsConfigJson(options): noop()
    ])(tree, context);
  };
}

function updateDependencies(options: StorybookOptions): Rule {
  return (tree: Tree, context: SchematicContext): Observable<Tree> => {
    if(!options.skipInstall){
      context.logger.debug('Updating dependencies...');
      context.addTask(new NodePackageInstallTask());
    }
    else{
      context.logger.warn('You choose to skip automatic dependencies installation. Don\'t forget to do it later.');
    }

    const addDependencies = of(...Constants.devDependencies).pipe(
      concatMap((packageName: string) => getLatestNodeVersion(packageName)),
      map((packageFromRegistry: NodePackage) => {
        const { name, version } = packageFromRegistry;
        context.logger.debug(
          `Adding ${name}:${version} to ${NodeDependencyType.Dev}`
        );

        addPackageJsonDependency(tree, {
          type: NodeDependencyType.Dev,
          name,
          version,
        });

        return tree;
      })
    );

    return addDependencies;
  };
}

function addStorybookFiles(options: StorybookOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.debug('adding Storybook files to host dir');

    const projectRoot = getProjectPath(tree, options);
    const templateSource = apply(url('./files'), [
      template({...options}),
      move(projectRoot),
    ]);

    return mergeWith(templateSource)(tree,context);
  };
}

function addStorybookScriptToPackageJson(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    
    addPropertyToPackageJson(tree, context, 'scripts', Constants.pkgJsonScripts);
    return tree;
  };
}

function addStorybookExclusionsToAppTsConfigJson(options: StorybookOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {

    const appTsConfigPath = getProjectPath(tree,options,'tsconfig.app.json');
    addPropertyToJsonAst(tree, context, appTsConfigPath, 'exclusions', Constants.tsConfigExclusions, true);
    return tree;
  };
}
