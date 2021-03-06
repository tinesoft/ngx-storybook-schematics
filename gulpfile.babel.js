import gulp from 'gulp';
import pump from 'pump';
import fs from 'fs';
import del from 'del';
import yargs from 'yargs';
import jestCli from 'jest-cli';
import gulpFile from 'gulp-file';
import gulpCoveralls from 'zyan-gulp-coveralls';
import { execCmd, execExternalCmd } from './utility/helpers';

const config = {
  srcDir: 'src',
  buildDir: 'dist',
  demoDir: 'demo',
  coverageDir: 'coverage',
  indentSpaces: 2
};

const argv = yargs
  .option('schematic', {
    alias: 's',
    describe: 'Enter the schematic to run',
    type: "string"
  })
  .argv;

// Cleaning tasks
export const cleanBuild = (cb) => del([config.buildDir]);
cleanBuild.description = `Clean the build directory '${config.buildDir}/'`;

export const cleanCoverage = () => del([config.coverageDir]);
cleanCoverage.description = `Clean the coverage directory '${config.coverageDir}/'`;

export const clean = gulp.parallel(cleanBuild, cleanCoverage);
clean.description = `Clean all directories: '${config.buildDir}/', '${config.coverageDir}/'`;

// Packaging tasks
const _packageJson = (done) => {
  let pkgJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  let targetPkgJson = {};
  let fieldsToCopy = ['name', 'version', 'description', 'keywords', 'author', 'license', 'bugs', 'homepage', 'dependencies', 'publishConfig', 'repository'];
  //only copy needed properties from project's package json
  fieldsToCopy.forEach((field) => { targetPkgJson[field] = pkgJson[field]; });

  targetPkgJson['schematics'] = './collection.json';

  pump([
    gulpFile('package.json', JSON.stringify(targetPkgJson, null, 2), { src: true }),
    gulp.dest(config.buildDir)
  ], done);
};

const _copyAssets = (done) => {
  pump([
    gulp.src(['README.md', 'CHANGELOG.md', 'LICENSE']),
    gulp.dest(config.buildDir)
  ], () => {
    pump([
      gulp.src([
        `${config.srcDir}/collection.json`,
        `${config.srcDir}/**/schema.json`,
        `${config.srcDir}/**/files/**/*`], { dot: true, base: `./${config.srcDir}` }),
      gulp.dest(config.buildDir)
    ], done);
  });
};
export const assemble = gulp.parallel(_packageJson, _copyAssets);
assemble.description = `Prepare the package.json and copy assets to build dir '${config.coverageDir}'`;

// Compiling tasks
export const compile = () => execExternalCmd('npm', 'run build');
compile.description = `Compile *.ts  files in '${config.srcDir}/'`;


// Testing tasks
export const test = () => {
  let isTravis = !!process.env.TRAVIS;
  return jestCli.runCLI({ config: require('./package.json').jest, coverage: true, runInBand: isTravis, ci: isTravis }, ".")
    .then(({ results }) => {
      if (!results.success) throw new Error('There are test failures!');
    });
}
test.description = `Run *_spec.ts test files located in '${config.srcDir}/' using Jest`;

export const coveralls = (done) => {
  if (!process.env.CI) {
    done();
  }

  pump(
    [
      gulp.src(`${config.coverageDir}/lcov.info`),
      gulpCoveralls()
    ], done);
}
coveralls.description = `Upload coverage report on coveralls.io, when run on Travis CI`;

//Releasing tasks
export const release = () => execExternalCmd('npm', 'run semantic-release');
release.description = `Semantically release project at '${config.buildDir}/'`;

export const build = gulp.series(clean, compile, test, assemble);
build.description = `Builds the project into '${config.buildDir}/'`;

// Linking tasks
export const doLink = () => execExternalCmd('npm', 'link', { cwd: `${config.buildDir}` });
doLink.description = `Just link to the project into '${config.buildDir}/'`;

export const link = gulp.series(build, doLink);
link.description = `Builds the project into '${config.buildDir}/' and link to it`;

export const unlink = () => execExternalCmd('npm', 'unlink', { cwd: `${config.buildDir}` });
unlink.description = `Unlink from project into '${config.buildDir}/'`;

// Demo tasks
export const runDemo = () => {

  const options = {...argv};
  // only keep schematic's own options
  delete options.schematic; 
  delete options.s;
  delete options._;
  delete options.$0;

  let schematicOptions = '';
  for (let k in options){
    schematicOptions += ` --${k}=${options[k]}`;
  }
  return execCmd('ng', `g ngx-storybook-schematics:${argv['schematic'] || 'storybook'}${schematicOptions}`, { cwd: config.demoDir }, `${config.demoDir}`);
}
runDemo.description = `Run the provided schematic '${argv['schematic'] || 'storybook'}' against the demo app`;

export const resetDemo = async () => {
  await execExternalCmd('git', `checkout HEAD -- ${config.demoDir}/`);
  return execExternalCmd('git', `clean -f -d ${config.demoDir}/`);
};
resetDemo.description = `Reset the demo application to its initial state (before running any schematic)`;

export default build; //default task
