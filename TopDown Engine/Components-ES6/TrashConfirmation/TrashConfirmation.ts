import { ActivationSelector } from "../Mixins/ActivationSelector";
import { ItemsObserver } from "../Mixins/ItemsObserver";
import { TemplateRenderer } from "../mixins/TemplateRenderer";
import { ITrashConfirmation } from "./ITrashConfirmation";

/** Observes an array of objects populated by <trash-selector> elements and triggers a callback with trash array as parameter upon confirmation */
export class TrashConfirmation extends ActivationSelector.extends(ItemsObserver.extends(TemplateRenderer.extends(HTMLElement))) {

    singularText: string = 'item';
    pluralText: string = 'items';
    confirm = () => { };

    get modalActive() {
        let self: ITrashConfirmation = <any>this;
        return self.hasAttribute('modal-active');
    }

    set modalActive(value) {
        let self: ITrashConfirmation = <any>this;
        if (!value && self.hasAttribute('modal-active')) {
            self.removeAttribute('modal-active');
            self.removeElementCollection(self.modalElements, self);
            return;
        }
        if (value && !self.hasAttribute('modal-active')) {
            self.modalElements = self.importBoundTemplate({
                ['trash']: `${self.observedTargetKey}`,
                ['text']: `${self.observedTargetKey}.text`,
                ['open']: `${self.observedTargetKey}.open()`,
                ['confirm']: `${self.observedTargetKey}.confirm()`,
                ['cancel']: `${self.observedTargetKey}.cancel()`
            }, 'trash-confirm') as Element[];
            self.renderElementCollection(self.modalElements, self);
            self.setAttribute('modal-active', '');
        }
    }

    constructor() {
        super();

    }

    connectedCallback() {
        let self: ITrashConfirmation = <any>this;
        self.collectionAttribute = 'trash';
        self.sourceDocument = self.sourceDocument || document;
        if (self.hasAttribute('on-confirm')) {
            let onconfirmattribute = self.getAttribute('on-confirm').valueOf();
            let parentTargetReference = ItemsObserver.getParentTargetReference(onconfirmattribute);
            if (typeof parentTargetReference.target === 'function') {
                self.confirm = () => {
                    parentTargetReference.parent[parentTargetReference.targetName]((<any[]>self.trashItems).map((eachTrashItem) => {
                        return eachTrashItem.trashItem;
                    }));
                };
            }
        }

        if (self.hasAttribute('singular-text')) {
            self.singularText = self.getAttribute('singular-text').valueOf();
        }

        if (self.hasAttribute('plural-text')) {
            self.pluralText = self.getAttribute('plural-text').valueOf();
        }

        TemplateRenderer.connectedCallback.apply(self);
        ItemsObserver.connectedCallback.apply(self);
        ActivationSelector.connectedCallback.apply(self);
    }

    disconnectedCallback() {
        ActivationSelector.disconnectedCallback.apply(this);
        ItemsObserver.disconnectedCallback.apply(this);
        TemplateRenderer.disconnectedCallback.apply(this);
    }

    activate() {
        let self: ITrashConfirmation = <any>this;
        self.displayElements = self.importBoundTemplate({
            ['trash']: `${self.observedTargetKey}`,
            ['text']: `${self.observedTargetKey}.text`,
            ['open']: `${self.observedTargetKey}.open()`,
            ['confirm']: `${self.observedTargetKey}.confirm()`,
            ['cancel']: `${self.observedTargetKey}.cancel()`
        }, 'trash-display') as Element[];
        self.renderElementCollection(self.displayElements, self);
    }

    deactivate() {
        let self: ITrashConfirmation = <any>this;
        if (self.displayElements && self.displayElements.length) {
            self.removeElementCollection(self.displayElements, self);
        }
    }

    update(updated: any[], key: string, value: any) {
        let self: ITrashConfirmation = <any>this;
        if (value && Array.isArray(value)) {
            self.trashItems = value;
            let ptr = ItemsObserver.getParentTargetReference(self.observedTargetKey);

            let length: number = ptr.target.length;

            ptr.target.text = `${length} ${length === 1 ? self.singularText : self.pluralText}`;
            ptr.target.open = () => {
                self.modalActive = true;
            };
            ptr.target.confirm = () => {
                self.confirm();
                self.modalActive = false;
            };
            ptr.target.cancel = () => {
                self.modalActive = false;
            };
            self.active = length > 0;

            return;
        }
    }
}
