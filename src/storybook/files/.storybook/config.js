import { configure } from '@storybook/angular';

function loadStories() {
  // stories here are top of the list so they are the first one displayed
  require('../src/stories');

  // automatically import all story ts files that end with *.stories.ts
  const req = require.context('../src/stories', true, /\.stories\.ts$/);
  req.keys().forEach(filename => req(filename));
}

configure(loadStories, module);
