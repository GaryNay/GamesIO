import { IItemsObserver } from "../mixins/IItemsObserver";

export interface IItemTextInput extends IItemsObserver, HTMLElement {
    sourceDocument: HTMLDocument;
    ownUpdated: boolean;
    placeHolder?: string;
    placeHolderDiv?: HTMLDivElement;
    multiLine: boolean;
    numeric: boolean;
    min?: number;
    max?: number;
    autoHeight: boolean;
    containerSpan: HTMLSpanElement;
    input?: HTMLInputElement | HTMLTextAreaElement;
    visibilityObserver?: IntersectionObserver;
    valueProperty: string;
    debounce: number;
    maxLength: number;
    value: string | number;

    changed: () => void;
    validate(): void;
}
