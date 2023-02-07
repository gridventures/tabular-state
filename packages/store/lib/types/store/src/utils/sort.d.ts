export type Sort<TItemSchema> = {
    [k in keyof TItemSchema]?: 1 | -1;
};
export declare function siftSort<T extends Record<string, any>>(sortParams: Sort<T>): (a: T, b: T) => number;
