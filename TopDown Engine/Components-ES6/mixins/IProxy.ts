export interface IProxy<T> {
    // __proxyName: string;
    // __referencedToNames: string[];
    // __proxyValue: object;
    __proxyName: string;
    __referencedToNames: string[];
    __proxyValue: T & object;
    constructor(target: T & object, handler: any);
}