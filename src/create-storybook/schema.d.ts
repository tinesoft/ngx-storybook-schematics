export interface CreateStorybookOptions {
    /**
     * The name of the project.
     */
    project?: string;
    /**
     * Skip automatic installation of Storybook dependency packages.
     */
    skipInstall?: boolean;
    /**
     * Exclude your stories from being compiled when running your angular dev environment.
     */
    excludeStoriesFromAppCompilation?: boolean
}
