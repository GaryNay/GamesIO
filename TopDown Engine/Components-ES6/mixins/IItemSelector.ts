export interface IItemSelector {

    checked: boolean;
    sourceDocument: HTMLDocument;
    containerSpan: HTMLSpanElement;
    img: HTMLImageElement;

    changed(forceCheckedTo?: boolean);
}
