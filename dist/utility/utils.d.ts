import { JsonAstObject, JsonValue } from '@angular-devkit/core';
import { Tree, SchematicContext } from '@angular-devkit/schematics';
import * as ts from 'typescript';
export interface NodePackage {
    name: string;
    version: string;
}
export declare const Constants: {
    "devDependencies": string[];
    "tsConfigExclusions": string[];
    "pkgJsonScripts": {
        'storybook': string;
    };
    "jsonIndentLevel": number;
};
export declare function safeFileDelete(tree: Tree, path: string): boolean;
export declare function addPropertyToPackageJson(tree: Tree, context: SchematicContext, propertyName: string, propertyValue: {
    [key: string]: string;
}): void;
export declare function addPropertyToJsonAst(tree: Tree, context: SchematicContext, jsonPath: string, propertyName: string, propertyValue: {
    [key: string]: string;
} | JsonValue, appendInArray?: boolean): void;
/**
 * Attempt to retrieve the latest package version from NPM
 * Return an optional "latest" version in case of error
 * @param packageName
 */
export declare function getLatestNodeVersion(packageName: string): Promise<NodePackage>;
export declare function getProjectPath(tree: Tree, options: any, ...subPaths: string[]): string;
export declare function getJsonFile(tree: Tree, path: string): JsonAstObject;
export declare function getTsSourceFile(host: Tree, path: string): ts.SourceFile;
