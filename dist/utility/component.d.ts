export interface Component {
    name: string;
    importPath: string;
    moduleMetadata?: ModuleMetadata;
}
export interface ModuleMetadata {
    imports?: string[];
    schemas?: string[];
    declarations?: string[];
    providers?: string[];
}
