"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const json_utils_1 = require("./json-utils");
const ts = require("typescript");
const http_1 = require("http");
const config_1 = require("./config");
exports.Constants = {
    "devDependencies": ['@storybook/angular', 'babel-core'],
    "tsConfigExclusions": ['stories', '**/*.stories.ts'],
    "pkgJsonScripts": {
        'storybook': 'start-storybook -p 9001 -c .storybook'
    },
    "jsonIndentLevel": 4,
};
function safeFileDelete(tree, path) {
    if (tree.exists(path)) {
        tree.delete(path);
        return true;
    }
    else {
        return false;
    }
}
exports.safeFileDelete = safeFileDelete;
function addPropertyToPackageJson(tree, context, propertyName, propertyValue) {
    addPropertyToJsonAst(tree, context, '/package.json', propertyName, propertyValue);
}
exports.addPropertyToPackageJson = addPropertyToPackageJson;
function addPropertyToJsonAst(tree, context, jsonPath, propertyName, propertyValue, appendInArray = false) {
    const jsonAst = getJsonFile(tree, jsonPath);
    const jsonNode = json_utils_1.findPropertyInAstObject(jsonAst, propertyName);
    const recorder = tree.beginUpdate(jsonPath);
    if (!jsonNode) {
        // outer node missing, add key/value
        json_utils_1.appendPropertyInAstObject(recorder, jsonAst, propertyName, propertyValue, exports.Constants.jsonIndentLevel);
    }
    else if (jsonNode.kind === 'object') {
        // property exists, update values
        for (let [key, value] of Object.entries(propertyValue)) {
            const innerNode = json_utils_1.findPropertyInAstObject(jsonNode, key);
            if (!innerNode) {
                // 'propertyName' not found, add it
                context.logger.debug(`creating ${key} with ${value}`);
                json_utils_1.insertPropertyInAstObjectInOrder(recorder, jsonNode, key, value, exports.Constants.jsonIndentLevel);
            }
            else {
                // 'propertyName' found, overwrite value
                context.logger.debug(`overwriting ${key} with ${value}`);
                const { end, start } = innerNode;
                recorder.remove(start.offset, end.offset - start.offset);
                recorder.insertRight(start.offset, JSON.stringify(value));
            }
        }
    }
    else if (jsonNode.kind === 'array' && appendInArray) {
        json_utils_1.appendValueInAstArray(recorder, jsonNode, propertyValue);
    }
    tree.commitUpdate(recorder);
}
exports.addPropertyToJsonAst = addPropertyToJsonAst;
/**
 * Attempt to retrieve the latest package version from NPM
 * Return an optional "latest" version in case of error
 * @param packageName
 */
function getLatestNodeVersion(packageName) {
    const DEFAULT_VERSION = 'latest';
    return new Promise((resolve) => {
        return http_1.get(`http://registry.npmjs.org/${packageName}`, (res) => {
            let rawData = '';
            res.on('data', (chunk) => (rawData += chunk));
            res.on('end', () => {
                try {
                    const response = JSON.parse(rawData);
                    const version = response && response['dist-tags'] || {};
                    resolve(buildPackage(packageName, version.latest));
                }
                catch (e) {
                    resolve(buildPackage(packageName));
                }
            });
        }).on('error', () => resolve(buildPackage(packageName)));
    });
    function buildPackage(name, version = DEFAULT_VERSION) {
        return { name, version };
    }
}
exports.getLatestNodeVersion = getLatestNodeVersion;
function getProjectPath(tree, options, ...subPaths) {
    const workspace = config_1.getWorkspace(tree);
    if (!options.project) {
        throw new schematics_1.SchematicsException('Option "project" is required.');
    }
    const project = workspace.projects[options.project];
    if (project.projectType !== 'application') {
        throw new schematics_1.SchematicsException(`Storybook Schematics require a project type of "application".`);
    }
    const projectPath = core_1.join(project.root, ...subPaths);
    return projectPath;
}
exports.getProjectPath = getProjectPath;
function getJsonFile(tree, path) {
    const buffer = tree.read(path);
    if (buffer === null) {
        throw new schematics_1.SchematicsException(`Could not read JSON file (${path}).`);
    }
    const content = buffer.toString();
    const packageJson = core_1.parseJsonAst(content, core_1.JsonParseMode.Strict);
    if (packageJson.kind != 'object') {
        throw new schematics_1.SchematicsException('Invalid JSON file. Was expecting an object');
    }
    return packageJson;
}
exports.getJsonFile = getJsonFile;
function getTsSourceFile(host, path) {
    const buffer = host.read(path);
    if (!buffer) {
        throw new schematics_1.SchematicsException(`Could not read TS file (${path}).`);
    }
    const content = buffer.toString();
    const source = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true);
    return source;
}
exports.getTsSourceFile = getTsSourceFile;
//# sourceMappingURL=utils.js.map