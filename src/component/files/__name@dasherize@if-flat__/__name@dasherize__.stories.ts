import { storiesOf } from '@storybook/angular';<% if (useComponent) { %>
import { <%= classify(name) %>Component } from '<%= relativePath %>';<% } %>

storiesOf('<%= classify(name) %>Component', module)
  .add('default', () => ({
    <% if (useComponent) { %>component: <%= classify(name) %>Component<% } else { %>template: `<<%= selector %>></<%= selector %>>`<% } %>
  }));
