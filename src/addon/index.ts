import {
    Rule,
    SchematicContext,
    Tree,
    chain,
    SchematicsException,
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

import * as ts from 'typescript';

import {
    getLatestNodeVersion,
    NodePackage,
    getProjectPath,
    Constants,
} from '../utility/utils';

import {
    addPackageJsonDependency,
    NodeDependencyType,
} from '../utility/dependencies';

import { Observable, of } from 'rxjs';
import { map, concatMap } from 'rxjs/operators';
import { AddonOptions } from './schema';
import { findNodes, insertAfterLastOccurrence } from '../utility/ast-utils';
import { InsertChange, NoopChange, Change } from '../utility/change';


export default function (options: AddonOptions): Rule {
    return (tree: Tree, context: SchematicContext) => {

        if (!options.packageName) {
            throw new SchematicsException('Option "packageName" is required.');
        }

        return chain([
            addAddonsJsfile(options),
            updateDependencies(options),
        ])(tree, context);
    };
}

function updateDependencies(options: AddonOptions): Rule {
    return (tree: Tree, context: SchematicContext): Observable<Tree> => {

        const addDependencies = of(...Constants.addonDependencies, getAddonPackageName(options)).pipe(
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

        if (!options.skipInstall) {
            context.logger.debug('Updating dependencies...');
            context.addTask(new NodePackageInstallTask());
        }

        return addDependencies;
    };
}

function addAddonsJsfile(options: AddonOptions): Rule {
    return (tree: Tree, context: SchematicContext) => {

        const addonsJsPath = getProjectPath(tree, options, '.storybook', 'addons.js');

        const buffer = tree.read(addonsJsPath);

        if (!buffer) {
            context.logger.debug(`Adding addons.js file (${addonsJsPath})`);
            const addonImport = `import '${getAddonPackageName(options)}/register';\n`;
            tree.create(addonsJsPath, addonImport);
            return tree
        } else {
            context.logger.debug(`Updating addons.js file (${addonsJsPath})`);
            const content = buffer.toString();
            const source = ts.createSourceFile(addonsJsPath, content, ts.ScriptTarget.Latest, true);

            const recorder = tree.beginUpdate(addonsJsPath);
            const importChange = addImportInAddonJsFile(options, addonsJsPath, source);
            if (importChange instanceof InsertChange) {
                recorder.insertLeft(importChange.pos, importChange.toAdd);
            }
            tree.commitUpdate(recorder);
        }
        return tree;
    };
}

function getAddonPackageName(options: AddonOptions) {
    let addonPackage = options.packageName;
    if (options.core && addonPackage.indexOf(Constants.coreAddonPrefix) === -1) {
        addonPackage = `${Constants.coreAddonPrefix}${addonPackage}`;
    }
    return addonPackage;
}

function addImportInAddonJsFile(options: AddonOptions, addonsJsPath: string, source: ts.SourceFile): Change {

    const rootNode = source;
    const fileName = `${getAddonPackageName(options)}/register`;
    const allImports = findNodes(rootNode, ts.SyntaxKind.ImportDeclaration);
    const relevantImports = allImports.filter(node => {
        // StringLiteral of the ImportDeclaration is the import file (fileName in this case).
        const importFiles = node.getChildren()
            .filter(child => child.kind === ts.SyntaxKind.StringLiteral)
            .map(n => (n as ts.StringLiteral).text);

        return importFiles.filter(file => file === fileName).length === 1;
    });

    if (relevantImports.length > 0) {
        // addon already imported in addons.js, nothing to do
        return new NoopChange();
    }

    // no such import declaration exists
    const useStrict = findNodes(rootNode, ts.SyntaxKind.StringLiteral)
        .filter((n: ts.StringLiteral) => n.text === 'use strict');
    let fallbackPos = 0;
    if (useStrict.length > 0) {
        fallbackPos = useStrict[0].end;
    }

    // if there are no imports or 'use strict' statement, insert import at beginning of file
    const insertAtBeginning = allImports.length === 0 && useStrict.length === 0;
    const separator = insertAtBeginning ? '' : ';\n';
    const toInsert = `${separator}import '${fileName}'${insertAtBeginning ? ';\n' : ''}`;

    return insertAfterLastOccurrence(
        allImports,
        toInsert,
        addonsJsPath,
        fallbackPos,
        ts.SyntaxKind.StringLiteral,
    );
}
