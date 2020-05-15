import { ItemsObserver } from "../Mixins/ItemsObserver";
import { TemplateRenderer } from "../mixins/TemplateRenderer";
import { IInlineRepeat } from "./IInlineRepeat";
import { IProxy } from "../Mixins/IProxy";

/** Repeats immediate template for each item in items as alias attribute */
export class InlineRepeat extends ItemsObserver.extends(TemplateRenderer.extends(HTMLElement)) {

    constructor() {
        super();
    }

    connectedCallback() {
        let self: IInlineRepeat = <any>this;

        self.sourceDocument = self.sourceDocument || document;

        if (self.hasAttribute('alias')) {
            self.aliasName = self.getAttribute('alias').valueOf();
        }
        if (self.hasAttribute('pass-value')) {
            self.passName = self.getAttribute('pass-value').valueOf();
        }
        let style = getComputedStyle(self);
        if (self.hasAttribute('in-line') || style.getPropertyValue('--force-inline')) {
            self.inLine = true;
        }
        if (self.hasAttribute('append') || style.getPropertyValue('--force-append')) {
            self.inLine = false;
        }

        self.renderedItems = [];
        self.renderToElement = self.parentElement;
        self.setAttribute('disabled', '');

        self.renderedItems = [];

        TemplateRenderer.connectedCallback.apply(self);
        ItemsObserver.connectedCallback.apply(self);
    }

    disconnectedCallback() {
        let self: IInlineRepeat = <any>this;
        ItemsObserver.disconnectedCallback.apply(self);
        TemplateRenderer.disconnectedCallback.apply(self);
    }

    update(updated: any, key: string, value: any & IProxy<any>) {
        let self: IInlineRepeat = <any>this;
        if (value && (ItemsObserver.keysMatch((<IProxy<any>>value).__proxyName, self.defaultTargetKey) || (key === self.defaultTargetProperty)) && Array.isArray(value)) {
            // Written/removed entire items array
            self.resetRenderedItems();
            // Get unique array
            self.repeatItems =  self.deepCopy(value);
            self.updateCollection();
        }
        if (updated && ItemsObserver.keysMatch((<IProxy<any>>updated).__proxyName, self.defaultTargetKey) && Array.isArray(updated) && parseInt(key) !== NaN) {
            // Updated a single numeric index

            if (!value && value !== 0 && value !== '') {
                self.repeatItems[key] = undefined;
            }
            else {
                self.repeatItems[key] = self.deepCopy(value);
            }

            self.renderItem(parseInt(key));

        }
    }

    resetRenderedItems() {
        let self: IInlineRepeat = <any>this;
        if (self.renderedItems) {
            for (let eachRenderedItemIndex = 0; eachRenderedItemIndex < self.renderedItems.length; eachRenderedItemIndex++) {
                self.removeRenderedItem(eachRenderedItemIndex);
            }
        }
        self.renderedItems = [];
    }

    removeRenderedItem(renderedItemIndex: number) {
        let self: IInlineRepeat = <any>this;
        if (self.renderedItems[renderedItemIndex] && self.renderedItems[renderedItemIndex].elementCollection) {
            self.removeElementCollection(self.renderedItems[renderedItemIndex].elementCollection, self.renderToElement);
        }
        self.renderedItems[renderedItemIndex] = undefined;
    }

    renderItem(itemToRenderIndex: number) {
        let self: IInlineRepeat = <any>this;

        if (!self.repeatItems[itemToRenderIndex]) {
            return;
        }

        self.auditHeader(true);

        self.renderedItems[itemToRenderIndex] = {
            elementCollection: self.importBoundTemplate({
                [self.aliasName]: `${self.literalTargetKey}[${itemToRenderIndex}]`,
                '_index': `${itemToRenderIndex}`,
                '_passed': `${self.passName}`
            }, 'item-template') as Element[],
            itemsIndex: itemToRenderIndex,
            item: self.repeatItems[itemToRenderIndex]
        };

        let renderBeforeElement: Element = self.inLine ? self : null;
        if (itemToRenderIndex < self.renderedItems.length - 1) {
            for (let offset = 1; offset < self.renderedItems.length - itemToRenderIndex + 1; offset++) {
                if (self.renderedItems[itemToRenderIndex + offset]) {
                    renderBeforeElement = self.renderedItems[itemToRenderIndex + offset].elementCollection[0];
                    break;
                }
            }
        }

        self.renderElementCollection(
            self.renderedItems[itemToRenderIndex].elementCollection,
            self.renderToElement,
            // If item to render is less than the length, return the first element of the next item so it will insert there, otherwise null will make it append
            renderBeforeElement
        );
    }

    auditHeader(shouldShow = false) {
        let self: IInlineRepeat = <any>this;
        if (!shouldShow) {
            self.resetRenderedItems();

            if (self.headingItemElementCollection) {
                self.removeElementCollection(self.headingItemElementCollection, self.renderToElement);
                self.headingItemElementCollection = null;
            }

            if (!self.emptyItemElementCollection) {
                self.emptyItemElementCollection = self.importBoundTemplate({
                    '_passed': `${self.passName}`
                }, 'empty-template') as Element[];
                if (self.emptyItemElementCollection) {
                    self.renderElementCollection(self.emptyItemElementCollection, self.renderToElement);
                }
            }
            return;
        }
        else {
            if (self.emptyItemElementCollection) {
                self.removeElementCollection(self.emptyItemElementCollection, self.renderToElement);
                self.emptyItemElementCollection = null;
            }
            if (!self.headingItemElementCollection) {
                self.headingItemElementCollection = self.importBoundTemplate({
                    '_passed': `${self.passName}`
                }, 'heading-template') as Element[];
                if (self.headingItemElementCollection) {
                    self.renderElementCollection(self.headingItemElementCollection, self.renderToElement);
                }
            }
        }
    }

    auditFooter(shouldShow = false) {
        let self: IInlineRepeat = <any>this;
        if (!shouldShow) {
            if (self.footerItemElementCollection) {
                self.removeElementCollection(self.footerItemElementCollection, self.renderToElement);
                self.footerItemElementCollection = null;
            }
            return;
        }
        else {
            if (!self.footerItemElementCollection) {
                self.footerItemElementCollection = self.importBoundTemplate({
                    '_passed': `${self.passName}`
                }, 'footer-template') as Element[];
                if (self.footerItemElementCollection) {
                    self.renderElementCollection(self.footerItemElementCollection, self.renderToElement);
                }
            }
        }
    }

    updateCollection() {
        let self: IInlineRepeat = <any>this;
        let itemsLength: number = (<any>self.repeatItems).length;
        itemsLength = itemsLength < self.renderedItems.length ? self.renderedItems.length : itemsLength;
        self.auditHeader(itemsLength ? true : false);
        for (let eachItemIndex = 0; eachItemIndex < itemsLength; eachItemIndex++) {
            if (self.renderedItems[eachItemIndex]) {
                if (self.renderedItems[eachItemIndex].item !== self.repeatItems[eachItemIndex]) {
                    self.removeRenderedItem(eachItemIndex);
                }
            }
            self.renderItem(eachItemIndex);
        }
        self.auditFooter(itemsLength ? true : false);
        return;
    }
}
