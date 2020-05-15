import { IItemsObserver } from "../Mixins/IItemsObserver";

export interface IItemDiv extends IItemsObserver, HTMLElement {
    sourceDocument: HTMLDocument;

    containerSpan: HTMLSpanElement;
    displayProperty: string;
    altDisplayProperty: string;
    formatType: 'currency' | 'date' | 'phone';
    formatRegex: string;
    formatReplace: string;
    formatCallback: (toFormat: any) => string;

    clicked: () => void;
}
