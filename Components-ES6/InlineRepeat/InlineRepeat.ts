import { ItemsObserver } from "../mixins/ItemsObserver.js";
import { TemplateRenderer } from "../mixins/TemplateRenderer.js";
import { IInlineRepeat } from "./IInlineRepeat";
import { IProxy } from "../mixins/IProxy";

/** Repeats immediate template for each item in items as alias attribute */
export class InlineRepeat extends ItemsObserver.extends(TemplateRenderer.extends(HTMLElement)) implements IInlineRepeat {
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
    json: boolean;
    text: boolean;

    constructor() {
        super();
    }

    connectedCallback() {
        this.sourceDocument = this.sourceDocument || document;

        if (this.hasAttribute('alias')) {
            this.aliasName = this.getAttribute('alias').valueOf();
        }
        if (this.hasAttribute('pass-value')) {
            this.passName = this.getAttribute('pass-value').valueOf();
        }
        let style = getComputedStyle(this);
        if (this.hasAttribute('in-line') || style.getPropertyValue('--force-inline')) {
            this.inLine = true;
        }
        if (this.hasAttribute('append') || style.getPropertyValue('--force-append')) {
            this.inLine = false;
        }

        if (this.hasAttribute('text')) {
            this.text = true;
        }
        if (this.hasAttribute('json')) {
            this.json = true;
        }

        this.renderedItems = [];
        this.renderToElement = this.parentElement;
        this.setAttribute('disabled', '');

        super.connectedCallback();

        if (this.hasAttribute('initial')) {
            if (this.defaultTargetKey) {
                let ptr = ItemsObserver.GetParentTargetReference(this.defaultTargetKey);
                ptr.parent[ptr.targetName] = this.parseValues(this.getAttribute('initial').valueOf());
            }
            else {
                this.repeatItems = this.parseValues(this.getAttribute('initial').valueOf());
                this.updateCollection();
            }
        }

    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    update(updated: any, key: string, value: any & IProxy<any>) {
        if (value && (ItemsObserver.KeysMatch((<IProxy<any>>value).__proxyName, this.defaultTargetKey) || (key === this.defaultTargetProperty)) && Array.isArray(value)) {
            // Written/removed entire items array
            this.resetRenderedItems();
            // Get unique array
            this.repeatItems =  ItemsObserver.DeepCopy(value);
            this.updateCollection();
        }
        if (updated && ItemsObserver.KeysMatch((<IProxy<any>>updated).__proxyName, this.defaultTargetKey) && Array.isArray(updated) && parseInt(key) !== NaN) {
            // Updated a single numeric index

            if (!value && value !== 0 && value !== '') {
                this.repeatItems[key] = undefined;
            }
            else {
                this.repeatItems[key] = ItemsObserver.DeepCopy(value);
            }

            this.renderItem(parseInt(key));

        }
    }

    parseValues(initialValues: string) {
        try {
            return JSON.parse(initialValues.replace(/'/g, '"'));
        }
        catch (e) {
            return initialValues ? initialValues.split(',') : [];
        }
    }

    resetRenderedItems() {
        if (this.renderedItems) {
            for (let eachRenderedItemIndex = 0; eachRenderedItemIndex < this.renderedItems.length; eachRenderedItemIndex++) {
                this.removeRenderedItem(eachRenderedItemIndex);
            }
        }
        this.renderedItems = [];
    }

    removeRenderedItem(renderedItemIndex: number) {
        if (this.renderedItems[renderedItemIndex] && this.renderedItems[renderedItemIndex].elementCollection) {
            this.removeElementCollection(this.renderedItems[renderedItemIndex].elementCollection, this.renderToElement);
        }
        this.renderedItems[renderedItemIndex] = undefined;
    }

    renderItem(itemToRenderIndex: number) {
        if (!this.repeatItems[itemToRenderIndex]) {
            return;
        }

        this.auditHeader(true);

        this.renderedItems[itemToRenderIndex] = {
            elementCollection: this.importBoundTemplate({
                [this.aliasName]: `${this.literalTargetKey}[${itemToRenderIndex}]`,
                '_index': `${itemToRenderIndex}`,
                '_passed': `${this.passName}`,
                'text': this.text ? this.repeatItems[itemToRenderIndex].toString() : null,
                'json': this.json ? JSON.stringify(this.repeatItems[itemToRenderIndex]).replace(/"/g, `'`) : null
            }, 'item-template') as Element[],
            itemsIndex: itemToRenderIndex,
            item: this.repeatItems[itemToRenderIndex]
        };

        let renderBeforeElement: Element = this.inLine ? this : null;
        if (itemToRenderIndex < this.renderedItems.length - 1) {
            for (let offset = 1; offset < this.renderedItems.length - itemToRenderIndex + 1; offset++) {
                if (this.renderedItems[itemToRenderIndex + offset]) {
                    renderBeforeElement = this.renderedItems[itemToRenderIndex + offset].elementCollection[0];
                    break;
                }
            }
        }

        this.renderElementCollection(
            this.renderedItems[itemToRenderIndex].elementCollection,
            this.renderToElement,
            // If item to render is less than the length, return the first element of the next item so it will insert there, otherwise null will make it append
            renderBeforeElement
        );
    }

    auditHeader(shouldShow = false) {
        if (!shouldShow) {
            this.resetRenderedItems();

            if (this.headingItemElementCollection) {
                this.removeElementCollection(this.headingItemElementCollection, this.renderToElement);
                this.headingItemElementCollection = null;
            }

            if (!this.emptyItemElementCollection) {
                this.emptyItemElementCollection = this.importBoundTemplate({
                    '_passed': `${this.passName}`
                }, 'empty-template') as Element[];
                if (this.emptyItemElementCollection) {
                    this.renderElementCollection(this.emptyItemElementCollection, this.renderToElement);
                }
            }
            return;
        }
        else {
            if (this.emptyItemElementCollection) {
                this.removeElementCollection(this.emptyItemElementCollection, this.renderToElement);
                this.emptyItemElementCollection = null;
            }
            if (!this.headingItemElementCollection) {
                this.headingItemElementCollection = this.importBoundTemplate({
                    '_passed': `${this.passName}`
                }, 'heading-template') as Element[];
                if (this.headingItemElementCollection) {
                    this.renderElementCollection(this.headingItemElementCollection, this.renderToElement);
                }
            }
        }
    }

    auditFooter(shouldShow = false) {
        if (!shouldShow) {
            if (this.footerItemElementCollection) {
                this.removeElementCollection(this.footerItemElementCollection, this.renderToElement);
                this.footerItemElementCollection = null;
            }
            return;
        }
        else {
            if (!this.footerItemElementCollection) {
                this.footerItemElementCollection = this.importBoundTemplate({
                    '_passed': `${this.passName}`
                }, 'footer-template') as Element[];
                if (this.footerItemElementCollection) {
                    this.renderElementCollection(this.footerItemElementCollection, this.renderToElement);
                }
            }
        }
    }

    updateCollection() {
        let itemsLength: number = (<any>this.repeatItems).length;
        itemsLength = itemsLength < this.renderedItems.length ? this.renderedItems.length : itemsLength;
        this.auditHeader(itemsLength ? true : false);
        for (let eachItemIndex = 0; eachItemIndex < itemsLength; eachItemIndex++) {
            if (this.renderedItems[eachItemIndex]) {
                if (this.renderedItems[eachItemIndex].item !== this.repeatItems[eachItemIndex]) {
                    this.removeRenderedItem(eachItemIndex);
                }
            }
            this.renderItem(eachItemIndex);
        }
        this.auditFooter(itemsLength ? true : false);
        return;
    }
}
