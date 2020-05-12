import { IItemsObserver } from "../Mixins/IItemsObserver";
import { ITemplateRenderer } from "../mixins/ITemplateRenderer";

export interface IInlineRepeat extends IItemsObserver, ITemplateRenderer, HTMLElement {
    inLine: boolean;

    sourceDocument: HTMLDocument;
    aliasName: string;
    passName: string;
    renderToElement: HTMLElement;
    renderedItems: { elementCollection: Element[], itemsIndex: number, item: any }[];
    headingItemElementCollection: Element[];
    footerItemElementCollection: Element[];
    emptyItemElementCollection: Element[];

    repeatItems: any[];
    removeRenderedItem(renderedItemIndex: number);
    resetRenderedItems();
    renderItem(renderedItemIndex: number);
    updateCollection();
    auditHeader(shouldShow: boolean);
    auditFooter(shouldShow: boolean);
    deepCopy<T>(value: T[]): T[];
}
