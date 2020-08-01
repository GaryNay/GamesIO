import { IItemsObserver } from "../mixins/IItemsObserver";
import { ITemplateRenderer } from "../mixins/ITemplateRenderer";

export interface IInlineRepeat extends IItemsObserver, ITemplateRenderer {
    inLine: boolean;
    json: boolean;

    sourceDocument: HTMLDocument;
    aliasName: string;
    passName: string;
    renderToElement: HTMLElement;
    renderedItems: { elementCollection: Element[], itemsIndex: number, item: any }[];
    headingItemElementCollection: Element[];
    footerItemElementCollection: Element[];
    emptyItemElementCollection: Element[];

    repeatItems: any[];
    removeRenderedItem(renderedItemIndex: number): void;
    resetRenderedItems(): void;
    renderItem(renderedItemIndex: number): void;
    updateCollection(): void;
    auditHeader(shouldShow: boolean): void;
    auditFooter(shouldShow: boolean): void;
}
