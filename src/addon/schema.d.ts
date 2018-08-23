export interface AddonOptions {
    /**
     * The name of the project.
     */
    project?: string;
    /**
     * The name of the addon package to add. For 'core' addons (i.e --core=true), you can omit the '@storybook/addons-' prefix.
     */
    packageName: string;
    /**
     * Specifies whether or not it is a core addon.
     */
    core?: boolean;
    /**
     * Skip automatic installation of Addon dependency packages.
     */
    skipInstall?: boolean;
}
