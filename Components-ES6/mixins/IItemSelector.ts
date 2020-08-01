import { ItemSelector } from "./ItemSelector";
import { CustomHTMLElement } from "../CustomHTMLElement";

export interface IItemSelector extends ItemSelector {

    checked: boolean;
    sourceDocument: HTMLDocument;
    containerSpan: HTMLSpanElement;
    img: HTMLImageElement;

    changed(forceCheckedTo?: boolean);
}

export interface ItemSelectorElement extends IItemSelector, CustomHTMLElement {}