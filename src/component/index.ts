import {
    Rule,
    SchematicContext,
    Tree,
    chain,
    noop,
    externalSchematic,
    apply,
    url,
    template,
    move,
    mergeWith,
    SchematicsException,
} from '@angular-devkit/schematics';

import { ComponentOptions } from './schema';
import { strings } from '@angular-devkit/core';
import { parseName } from '@schematics/angular/utility/parse-name';
import { buildDefaultPath, getProject } from '@schematics/angular/utility/project';
import { buildRelativePath } from '@schematics/angular/utility/find-module';


export default function (options: ComponentOptions): Rule {

    return (tree: Tree, context: SchematicContext) => {
        return chain([
            externalSchematic('@schematics/angular', 'component', options),
            options.skipStories ? noop() : createStoriesFile(options),
        ])(tree, context);
    };
}

function buildSelector(options: ComponentOptions, projectPrefix: string) {
    let selector = strings.dasherize(options.name);
    if (options.prefix) {
        selector = `${options.prefix}-${selector}`;
    } else if (options.prefix === undefined && projectPrefix) {
        selector = `${projectPrefix}-${selector}`;
    }

    return selector;
}

function createStoriesFile(options: ComponentOptions): Rule {
    return (tree: Tree, context: SchematicContext) => {
        context.logger.debug(`creating the *.stories.ts for the component ${options.name}`);

        if (!options.project) {
            throw new SchematicsException('Option (project) is required.');
        }

        const project = getProject(tree, options.project);
        if (options.path === undefined) {
            options.path = buildDefaultPath(project);
        }

        const parsedPath = parseName(options.path, options.name);
        options.name = parsedPath.name;
        options.path = parsedPath.path;
        options.selector = options.selector || buildSelector(options, project.prefix);

        const dasherizedName = strings.dasherize(options.name);
        const component = `/${options.path}/`
            + (options.flat ? '' : dasherizedName + '/')
            + dasherizedName;

        const storiesPath = `${component}.stories`;
        const componentPath = `${component}.component`;
        const relativePath = buildRelativePath(storiesPath, componentPath);

        const templateSource = apply(url('./files'), [
            template({
                ...options,
                ...strings,
                'if-flat': (s: string) => options.flat ? '' : s,
                relativePath
            }),
            move(options.path as string),
        ]);

        return mergeWith(templateSource)(tree, context);
    };
}
