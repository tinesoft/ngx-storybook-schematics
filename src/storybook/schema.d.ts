export interface StorybookOptions {
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
    /**
     * Specifies whether or not a custom tsconfig.json file should be used.
     */
    tsconfig?: boolean
}
