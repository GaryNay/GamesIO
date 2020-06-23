import { IItemsObserver } from "../mixins/IItemsObserver";

export interface IClickDiv extends IItemsObserver {
    sourceDocument: HTMLDocument;

    displayProperty: string;
    altDisplayProperty: string;
    formatType: 'currency' | 'date' | 'phone';
    formatRegex: string;
    formatReplace: string;
    formatCallback: (toFormat: any) => string;

    clicked: () => void;
}
