export declare class JsonStore<T extends {
    id: string;
}> {
    private entity;
    constructor(entity: string);
    private filePath;
    private listDir;
    findAll(): Promise<T[]>;
    findById(id: string): Promise<T | null>;
    findOne(predicate: (item: T) => boolean): Promise<T | null>;
    findMany(predicate: (item: T) => boolean): Promise<T[]>;
    create(data: T): Promise<T>;
    update(id: string, patch: Partial<T>): Promise<T | null>;
    delete(id: string): Promise<boolean>;
}
export declare function readJsonFile<T>(entity: string, filename: string): T | null;
export declare function writeJsonFile<T>(entity: string, filename: string, data: T): void;
//# sourceMappingURL=json-store.d.ts.map