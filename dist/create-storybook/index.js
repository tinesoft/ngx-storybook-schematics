"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const tasks_1 = require("@angular-devkit/schematics/tasks");
const utils_1 = require("../utility/utils");
const dependencies_1 = require("../utility/dependencies");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
function default_1(options) {
    return (tree, context) => {
        return schematics_1.chain([
            updateDependencies(options),
            addStorybookFiles(options),
            addStorybookScriptToPackageJson(),
            options.excludeStoriesFromAppCompilation ? addStorybookExclusionsToAppTsConfigJson(options) : schematics_1.noop()
        ])(tree, context);
    };
}
exports.default = default_1;
function updateDependencies(options) {
    return (tree, context) => {
        if (!options.skipInstall) {
            context.logger.debug('Updating dependencies...');
            context.addTask(new tasks_1.NodePackageInstallTask());
        }
        else {
            context.logger.warn('You choose to skip automatic dependencies installation. Don\'t forget to do it later.');
        }
        const addDependencies = rxjs_1.of(...utils_1.Constants.devDependencies).pipe(operators_1.concatMap((packageName) => utils_1.getLatestNodeVersion(packageName)), operators_1.map((packageFromRegistry) => {
            const { name, version } = packageFromRegistry;
            context.logger.debug(`Adding ${name}:${version} to ${dependencies_1.NodeDependencyType.Dev}`);
            dependencies_1.addPackageJsonDependency(tree, {
                type: dependencies_1.NodeDependencyType.Dev,
                name,
                version,
            });
            return tree;
        }));
        return addDependencies;
    };
}
function addStorybookFiles(options) {
    return (tree, context) => {
        context.logger.debug('adding Storybook files to host dir');
        const projectRoot = utils_1.getProjectPath(tree, options);
        const templateSource = schematics_1.apply(schematics_1.url('./files'), [
            schematics_1.template(Object.assign({}, options)),
            schematics_1.move(projectRoot),
        ]);
        return schematics_1.mergeWith(templateSource)(tree, context);
    };
}
function addStorybookScriptToPackageJson() {
    return (tree, context) => {
        utils_1.addPropertyToPackageJson(tree, context, 'scripts', utils_1.Constants.pkgJsonScripts);
        return tree;
    };
}
function addStorybookExclusionsToAppTsConfigJson(options) {
    return (tree, context) => {
        const appTsConfigPath = utils_1.getProjectPath(tree, options, 'tsconfig.app.json');
        utils_1.addPropertyToJsonAst(tree, context, appTsConfigPath, 'exclusions', utils_1.Constants.tsConfigExclusions, true);
        return tree;
    };
}
//# sourceMappingURL=index.js.map