import { IItemsObserver } from "../Mixins/IItemsObserver";

export interface ISmartSelect extends IItemsObserver, HTMLElement {
    sourceDocument: HTMLDocument;
    containerSpan: HTMLSpanElement;
    span: HTMLSpanElement;
    select: HTMLSelectElement;

    displayProperty: string;
    valueProperty: string;
    bindToKey: string;
    bindToProperty: string;
    updateBinding: boolean;

    value: any;
    option: any;
    optionItems: any[];
    selectOptionByValue: (optionValue?, suppressClick?: boolean) => void;
    selectOption: (optionIndex?, suppressClick?: boolean) => void;
    updateOptions: () => void;
    clicked();
    selected: () => void;
}
