import { IItemsObserver } from "../Mixins/IItemsObserver";

export interface IProgressCanvas extends IItemsObserver, HTMLElement {
    sourceDocument: HTMLDocument;

    containerSpan: HTMLSpanElement;
    labelElement?: HTMLSpanElement;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;

    label: string;
    labelValue: string;
    labelProperty?: string;
    guageMaxProperty?: string;
    guageMax: number;
    guageValue: number;
    guageTicks: number;
    resolution: number;

    complete: boolean;
    completed(): void;
    oncompleted(callbackFn: (self?: IProgressCanvas) => any): Promise<any>;
    completedCallback?: (self?: IProgressCanvas) => any;
    resolveCompleted?: () => void;

    clicked?: () => void;
    readjust(): void;
}
