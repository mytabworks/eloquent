declare module 'eloquents';

export type RelationshipTypes = HasManyInstanceType<any, any> | HasOneInstanceType<any, any> | BelongsToInstanceType<any, any>;

export type ClassPropTypes = string | boolean | number | any[] | object;

export type PickProps<I, U> = { [P in keyof I as I[P] extends U ? P : never]: I[P] };

export type PickEntityInstance<I extends typeof Model> = PickProps<InstanceType<I['entity']>, ClassPropTypes>;

export type PickCustomMethods<I extends typeof Model> = Pick<InstanceType<I>, Exclude<keyof InstanceType<I>, keyof InstanceType<typeof Model>>>;

export type MethodReturnType<R> = { [P in keyof R]: R[P] extends () => infer U ? U : any };

export type PersistentRelative<D, R> = {[name: string]: ($where: QueryInstanceType<D, R>) => void}

export type PickPersistentCollectionType<R> = { 
    [P in keyof R as `$${P & string}`]?: R[P] extends HasManyInstanceType<any, any> ? (
        ReturnType<R[P]["get"]> extends PromiseLike<infer U> ? U : ReturnType<R[P]["get"]> 
    ) : (
        R[P] extends HasOneInstanceType<any, any> | BelongsToInstanceType<any, any> ? (
            ReturnType<R[P]["first"]> extends PromiseLike<infer U> ? U : ReturnType<R[P]["first"]> 
        ) : (
            never
        )
    )
}

export type PickPersistentRelationCollectionType<R> = PickPersistentCollectionType<PickProps<MethodReturnType<R>, RelationshipTypes>>

type PickToJSON<R> = { 
    [P in keyof R]?: R[P] extends HasManyInstanceType<any, any> ? (
        ReturnType<InstanceType<ReturnType<R[P]["with"]>>["toJSON"]>[] 
    ) : (
        R[P] extends HasOneInstanceType<any, any> | BelongsToInstanceType<any, any>? (
            ReturnType<InstanceType<ReturnType<R[P]["with"]>>["toJSON"]>
        ) : (
            never
        )
    )
}

type PickRelationshipToJSON<R> = PickToJSON<PickProps<MethodReturnType<R>, RelationshipTypes>>;

type ModelIteratorReturn = { key: string, value: any }

interface ModelInstance<D, R> {
    [Symbol.iterator]?(): {
        next(): { value: ModelIteratorReturn };
    };
    getPrimaryKeyId(): string | number;
    getPrimaryKey(): string;
    save(attributes?: Partial<D>): Promise<string | boolean>;
    delete(): Promise<boolean>;
    toString(): string;
    toJSON(): Readonly<D & PickRelationshipToJSON<R>>;
}

interface ModelIComplete extends ModelInstance<any, any>{
    __get(): string;
    __set(): void;
    __isset(): boolean;
    __unset(): void;
    __iterator(): object;
}

export type ModelInstanceType<D, R> = ModelInstance<D, R> & Partial<D> & R & PickPersistentRelationCollectionType<R>;

export interface ModelType<D = any, R = any> extends BuilderInstanceType<D, R> {
    new (): ModelInstanceType<D, R>;
    destroy(ids: string[]): Promise<number>;
    find(id: string | number, columns?: string[], relatives?: string | string[] | PersistentRelative<D, R>): Promise<ModelInstanceType<D, R> & CollectionInstanceType<D, R>>;
    findOrNew(): Promise<ModelInstanceType<D, R>>;
}

export interface BuilderInstanceType<D, R> extends QueryInstanceType<D, R> {
    with(relatives: string | string[] | PersistentRelative<D, R>): ModelType<D, R>;
    find(id: string, columns?: string[], relatives?: string | string[] | PersistentRelative<D, R>): Promise<ModelInstanceType<D, R> & CollectionInstanceType<D, R>>;
    first(): Promise<ModelInstanceType<D, R> & CollectionInstanceType<D, R>>;
    get(): Promise<CollectionInstanceType<D, R, 'array'>>;
    paginate(page: number, size: number): Promise<CollectionInstanceType<D, R, 'array'>>;
    delete(): Promise<{ itemsDeleted: any[], relativeDeleted: { [relative: string]: any[] } }>;
}

export interface QueryInstanceType<D, R> {
    select<N = 'null'>(...args: string[]): ModelType<N extends 'null' ? D : N, R>;
    whereNotIn(field: string, comparisons: any[]): ModelType<D, R>;
    orWhereNotIn(field: string, comparisons: any[]): ModelType<D, R>;
    whereIn(field: string, comparisons: any[]): ModelType<D, R>;
    orWhereIn(field: string, comparisons: any[]): ModelType<D, R>;
    whereNotBetween(field: string, comparisons: any[]): ModelType<D, R>;
    orWhereNotBetween(field: string, comparisons: any[]): ModelType<D, R>;
    whereBetween(field: string, comparisons: any[]): ModelType<D, R>;
    orWhereBetween(field: string, comparisons: any[]): ModelType<D, R>;
    where(field: string, condition: any, value?: any): ModelType<D, R>;
    orWhere(field: string, condition: any, value?: any): ModelType<D, R>;
    orderBy(orderBy: string, order?: "ASC" | "DESC"): ModelType<D, R>;
    limit(value: number): ModelType<D, R>;
    skip(value: number): ModelType<D, R>;
    take(value: number): ModelType<D, R>;
    offset(value: number): ModelType<D, R>;
}

export interface CollectionInstanceType<D, R, A = any> {
    hasItem: boolean;
    splice(offset: number, pick: number): ModelInstanceType<D, R>[]
    itemCount(): number | void;
    totalCount(): number;
    first(): ModelInstanceType<D, R>;
    valueOf(): string;
    toString(): string;
    toJSON(): A extends 'array' ? ReturnType<ModelInstance<D, R>["toJSON"]>[] : ReturnType<ModelInstance<D, R>["toJSON"]>;
    reduce(callback:(result: any, currentValue: A extends 'array' ? ModelInstanceType<D, R> : ModelIteratorReturn, index: number, array: any[]) => any, defaultValue?: any): any;
    map(callback:(value: A extends 'array' ? ModelInstanceType<D, R> : ModelIteratorReturn, index: number, array: any[]) => any): any;
    filter(callback:(value: A extends 'array' ? ModelInstanceType<D, R> : ModelIteratorReturn, index: number, array: any[]) => boolean): (A extends 'array' ? ModelInstanceType<D, R> : ModelIteratorReturn)[];
    [Symbol.iterator](): {
        next(): { value: A extends 'array' ? ModelInstanceType<D, R> : ModelIteratorReturn };
    };
}

export interface HasManyInstanceType<D, R> extends BuilderInstanceType<D, R> {
    create(attributes?: Partial<D>): ModelInstanceType<D, R>;
}

export interface HasOneInstanceType<D, R> extends BuilderInstanceType<D, R> {
    findOrNew(attributes?: Partial<D>): ModelInstanceType<D, R>;
}

export interface BelongsToInstanceType<D, R> extends BuilderInstanceType<D, R> {
    
}

export interface BuilderType {
    new (...args: any): BuilderInstanceType<any, any>;
}

export interface QueryType {
    new (...args: any): QueryInstanceType<any, any>;
}

export interface CollectionType {
    new (...args: any): CollectionInstanceType<any, any>;
}

export interface HasManyType {
    new (...args: any): HasManyInstanceType<any, any>;
}

export interface HasOneType {
    new (...args: any): HasOneInstanceType<any, any>;
}

export interface BelongsToType {
    new (...args: any): BelongsToInstanceType<any, any>;
}

export declare const Eloquent: <I extends typeof Model>(model: I) => ModelType<PickEntityInstance<I>, PickCustomMethods<I>>

export declare class Model {

    public static entity: any

    public static table: string

    protected relatives: any

    protected originals: any

    protected attributes: any

    protected primaryKey: string 

    protected guarded: string[]

    protected fillable: string[]

    protected updatable: string[]

    protected updatedAtColumn: string

    protected createdAtColumn: string

    protected timestamp: boolean

    protected exists: boolean

    constructor (props: any)

    protected isFillable(key: string): boolean

    protected isGuarded(key: string): boolean

    protected syncAttrAndOrig(): void

    protected getAttributes(): any

    protected getAttribute(key: string): any

    protected setAttribute(key: string, value: string): void

    protected setAttributeRaw(key: string, value: string): void

    protected getAttributeChanges(): any

    protected setTimestamps(timestamp: any): void

    protected setPrimaryKeyForSave(query: InstanceType<QueryType>): InstanceType<QueryType>

    public getPrimaryKeyId(): any

    public getPrimaryKey(): string

    protected queryInsert(query: InstanceType<QueryType>): Promise<any>

    protected queryUpdate(query: InstanceType<QueryType>): Promise<boolean | void>

    protected queryDelete(query: InstanceType<QueryType>): Promise<boolean> 

    protected createBuilder(): InstanceType<BuilderType>

    protected createQuery(): InstanceType<QueryType>

    protected setRelative(key: string, value: any): void

    protected getForeignKey(): string

    protected belongsTo<D, R>(parent: ModelType<D, R>, foreignkey?: string, ownerkey?: string): BelongsToInstanceType<D, R> 

    protected hasOneOrMany(relationType: any, relative: any, foreignkey?: string, localkey?: string): any

    protected hasOne<D, R>(relative: ModelType<D, R>, foreignkey?: string, localkey?: string): HasOneInstanceType<D, R> 

    protected hasMany<D, R>(relative: ModelType<D, R>, foreignkey?: string, localkey?: string): HasManyInstanceType<D, R> 

    public save(attribute?: any): Promise<string | boolean>

    public delete(): Promise<boolean>

    protected static createModel(): Model

    protected static createBuilderStatic(): InstanceType<BuilderType>

    public static destroy(ids: string[]): Promise<number>

    public static find(id: string, columns: string[], relatives?: string | string[] | {[name: string]: ($where: QueryInstanceType<any, any>) => void}): Promise<ModelInstanceType<any, any> & CollectionInstanceType<any, any>>

    public static findOrNew(id: string, columns: string[]): Promise<(ModelInstanceType<any, any> & CollectionInstanceType<any, any>) | ModelInstanceType<any, any> >
     
    public __iterator(): object

    public __get(key: string): string

    public __set(key: string, value: any): void

    public __isset(key: string): boolean

    public __unset(key: string): void

    static __callStatic(method: string): any

    public toString(): string

    public toJSON(): object
}