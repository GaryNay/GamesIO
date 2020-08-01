import { IItemsObserver } from "../mixins/IItemsObserver";
import { ProgressCanvas } from "./ProgressCanvas";

export interface IProgressCanvas extends IItemsObserver {
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
    oncompleted(callbackFn: (self?: ProgressCanvas) => any): Promise<any>;
    completedCallback?: (self?: ProgressCanvas) => any;
    resolveCompleted?: () => void;

    clicked?: () => void;
    readjust(): void;
}
