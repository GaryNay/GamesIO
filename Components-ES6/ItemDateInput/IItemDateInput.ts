import { IItemsObserver } from "../mixins/IItemsObserver";

export interface IItemDateInput extends IItemsObserver, HTMLElement {
    sourceDocument: HTMLDocument;
    containerSpan: HTMLSpanElement;
    input: HTMLInputElement;
    valueProperty: string;
    debounce: number;
    ownUpdated: boolean;
    placeholder?: string;

    changed: () => void;
}
