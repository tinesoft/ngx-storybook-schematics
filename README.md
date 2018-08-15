
<p align="center">
  <img height="256px" width="256px" style="text-align: center;" src="demo/src/assets/logo.svg">
</p>

# Schematics to easily add [Storybook](https://storybook.js.org/) support to your Angular projects

[![npm version](https://badge.fury.io/js/ngx-storybook-schematics.svg)](https://badge.fury.io/js/ngx-storybook-schematics)
[![Build Status](https://travis-ci.org/tinesoft/ngx-storybook-schematics.svg?branch=master)](https://travis-ci.org/tinesoft/ngx-storybook-schematics)
[![Coverage Status](https://coveralls.io/repos/github/tinesoft/ngx-storybook-schematics/badge.svg?branch=master)](https://coveralls.io/github/tinesoft/ngx-storybook-schematics?branch=master)
[![dependency Status](https://david-dm.org/tinesoft/ngx-storybook-schematics/status.svg)](https://david-dm.org/tinesoft/ngx-storybook-schematics)
[![devDependency Status](https://david-dm.org/tinesoft/ngx-storybook-schematics/dev-status.svg?branch=master)](https://david-dm.org/tinesoft/ngx-storybook-schematics?type=dev)

## Requirements

* Project built with [Angular CLI v6+](https://cli.angular.io) (tested with CLI v6.1.3, Angular v6.1.2)

## Installation

Install globally

```shell
npm install -g ngx-storybook-schematics
```

Optionally run as one command in an Angular CLI app directory. Note this will add the schematic as a dependency to your project.

```shell
ng add ngx-storybook-schematics
```

## Usage

In an Angular CLI project run

```shell
ng g ngx-storybook-schematics:create-storybook
```

This schematic will:

* install Storybook, its dependencies, and scripts
* add necessary files for Storybook to work with Angular

![ngx-create-storybook](demo/src/assets/ngx-create-storybook.svg)

You can now launch the Storybook by:

```shell
npm run storybook
```

Now hit `http://localhost:9001/` in your browser, to see your components in action.

---

You can also provide the given options when running the schematic:

option | description
--- | ---
skipInstall (_boolean, default: false_) | Skip automatic installation of Storybook dependency packages
excludeStoriesFromAppCompilation (_boolean, default: false_) | [Troobleshooting](https://storybook.js.org/basics/guide-angular/#trouble-shooting)) Exclude your stories from being compiled when running your angular dev environment

## Roadmap

These feature schematics are coming (very) soon into the collection:

* add a schematic to automatically scan and add app component(s) to the Storybook
* add a schematic to support [addons](https://storybook.js.org/addons/using-addons/)
* add a schematic to remove support for Storybook at any time

## License

Copyright (c) 2018 Tine Kondo. Licensed under the MIT License (MIT)