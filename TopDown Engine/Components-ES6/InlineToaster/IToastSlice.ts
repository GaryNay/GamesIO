export interface IToastSlice {
    toast: string;
    template?: string;
    callback?: (...params: any[]) => any;
}