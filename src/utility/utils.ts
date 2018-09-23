import {
  JsonParseMode,
  join,
  Path,
  JsonAstObject,
  parseJsonAst,
  JsonValue,
} from '@angular-devkit/core';

import {
  SchematicsException,
  Tree,
  SchematicContext,
} from '@angular-devkit/schematics';

import {
  findPropertyInAstObject,
  appendPropertyInAstObject,
  insertPropertyInAstObjectInOrder,
  appendValueInAstArray,
} from './json-utils';

import * as ts from 'typescript';

import { get } from 'http';
import { getWorkspace } from './config';

export interface NodePackage {
  name: string;
  version: string;
}

interface PackageJsonScripts{  
  [key:string]: string
}
interface SchematicsConstants  {
  devDependencies: string[],
  addonDependencies: string[],
  tsConfigExclusions: string[],
  pkgJsonScripts: PackageJsonScripts
  jsonIndentLevel : number,
  coreAddonPrefix : string
}

export const Constants:SchematicsConstants = {
  "devDependencies": ['@storybook/angular', 'babel-core'],
  "addonDependencies": ['@storybook/addons'],
  "tsConfigExclusions": ['stories', '**/*.stories.ts'],
  "pkgJsonScripts": {
    'storybook': 'start-storybook -p 9001 -c .storybook'
  },
  "jsonIndentLevel" : 4,
  "coreAddonPrefix" : '@storybook/addon-'
}

export function addPropertyToPackageJson(
  tree: Tree,
  context: SchematicContext,
  propertyName: string,
  propertyValue: { [key: string]: string }
) {
  addPropertyToJsonAst(tree,context, '/package.json',propertyName, propertyValue);
}


export function addPropertyToJsonAst(
  tree: Tree,
  context: SchematicContext,
  jsonPath: string,
  propertyName: string,
  propertyValue: { [key: string]: string } | JsonValue,
  appendInArray = false
) {
  const jsonAst = getJsonFile(tree, jsonPath);
  const jsonNode = findPropertyInAstObject(jsonAst, propertyName);
  const recorder = tree.beginUpdate(jsonPath);

  if (!jsonNode) {
    // outer node missing, add key/value
    appendPropertyInAstObject(
      recorder,
      jsonAst,
      propertyName,
      propertyValue,
      Constants.jsonIndentLevel
    );
  } else if (jsonNode.kind === 'object') {
    // property exists, update values
    for (let [key, value] of Object.entries(propertyValue as { [key: string]: string })) {
      const innerNode = findPropertyInAstObject(jsonNode, key);

      if (!innerNode) {
        // 'propertyName' not found, add it
        context.logger.debug(`creating ${key} with ${value}`);

        insertPropertyInAstObjectInOrder(
          recorder,
          jsonNode,
          key,
          value,
          Constants.jsonIndentLevel
        );
      } else {
        // 'propertyName' found, overwrite value
        context.logger.debug(`overwriting ${key} with ${value}`);

        const { end, start } = innerNode;

        recorder.remove(start.offset, end.offset - start.offset);
        recorder.insertRight(start.offset, JSON.stringify(value));
      }
    }
  }
  else if(jsonNode.kind === 'array' && appendInArray){
    appendValueInAstArray(recorder, jsonNode, propertyValue);
  }

  tree.commitUpdate(recorder);
}

/**
 * Attempt to retrieve the latest package version from NPM
 * Return an optional "latest" version in case of error
 * @param packageName
 */
export function getLatestNodeVersion(packageName: string): Promise<NodePackage> {
  const DEFAULT_VERSION = 'latest';

  return new Promise((resolve) => {
    return get(`http://registry.npmjs.org/${packageName}`, (res) => {
      let rawData = '';
      res.on('data', (chunk) => (rawData += chunk));
      res.on('end', () => {
        try {
          const response = JSON.parse(rawData);
          const version = response && response['dist-tags'] || {};

          resolve(buildPackage(packageName, version.latest));
        } catch (e) {
          resolve(buildPackage(packageName));
        }
      });
    }).on('error', () => resolve(buildPackage(packageName)));
  });

  function buildPackage(name: string, version: string = DEFAULT_VERSION): NodePackage {
    return { name, version };
  }
}


export function getProjectPath(tree: Tree, options: any, ...subPaths: string[]): string {
  const workspace = getWorkspace(tree);

  if (!options.project) {
    throw new SchematicsException('Option "project" is required.');
  }

  const project = workspace.projects[options.project];

  if (project.projectType !== 'application') {
    throw new SchematicsException(
      `Storybook Schematics require a project type of "application".`
    );
  }

  const projectPath = join(project.root as Path, ...subPaths);

  return projectPath;
}

export function getJsonFile(tree: Tree, path: string): JsonAstObject {
  const buffer = tree.read(path);
  if (buffer === null) {
    throw new SchematicsException(`Could not read JSON file (${path}).`);
  }
  const content = buffer.toString();

  const packageJson = parseJsonAst(content, JsonParseMode.Strict);
  if (packageJson.kind != 'object') {
    throw new SchematicsException(
      'Invalid JSON file. Was expecting an object'
    );
  }

  return packageJson;
}

export function getTsSourceFile(host: Tree, path: string): ts.SourceFile {
  const buffer = host.read(path);
  if (!buffer) {
    throw new SchematicsException(`Could not read TS file (${path}).`);
  }
  const content = buffer.toString();
  const source = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true);

  return source;
}