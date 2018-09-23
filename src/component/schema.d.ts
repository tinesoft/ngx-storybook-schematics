import { Schema as AngularComponentOptions } from '@schematics/angular/component/schema';

export interface ComponentOptions extends AngularComponentOptions{

    /**
     * Specifies whether or not to use the component name (instead of template) in the story.
     */
    useComponent?: boolean;
    /**
     * Skips generating the stories along with the component.
     */
    skipStories?: boolean;
}
