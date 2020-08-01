import { ActivationSelector } from "../mixins/ActivationSelector.js";
import { ItemsObserver } from "../mixins/ItemsObserver.js";
import { TemplateRenderer } from "../mixins/TemplateRenderer.js";
import { ITrashConfirmation } from "./ITrashConfirmation";

/** Observes an array of objects populated by <trash-selector> elements and triggers a callback with trash array as parameter upon confirmation */
export class TrashConfirmation extends ActivationSelector.extends(ItemsObserver.extends(TemplateRenderer.extends(HTMLElement))) implements ITrashConfirmation {
    active: boolean;

    displayElements: Element[];
    modalElements: Element[];
    inactiveElementId: string;
    inactiveElement: HTMLElement;

    trashItems: any[];

    singularText: string = 'item';
    pluralText: string = 'items';
    confirm = () => { };

    get modalActive() {
        return this.hasAttribute('modal-active');
    }

    set modalActive(value) {
        if (!value && this.hasAttribute('modal-active')) {
            this.removeAttribute('modal-active');
            this.removeElementCollection(this.modalElements, this);
            return;
        }
        if (value && !this.hasAttribute('modal-active')) {
            this.modalElements = this.importBoundTemplate({
                ['trash']: `${this.observedTargetKey}`,
                ['text']: `${this.observedTargetKey}.text`,
                ['open']: `${this.observedTargetKey}.open()`,
                ['confirm']: `${this.observedTargetKey}.confirm()`,
                ['cancel']: `${this.observedTargetKey}.cancel()`
            }, 'trash-confirm') as Element[];
            this.renderElementCollection(this.modalElements, this);
            this.setAttribute('modal-active', '');
        }
    }

    constructor() {
        super();

    }

    connectedCallback() {
        this.collectionAttribute = 'trash';
        this.sourceDocument = this.sourceDocument || document;
        if (this.hasAttribute('on-confirm')) {
            let onconfirmattribute = this.getAttribute('on-confirm').valueOf();
            let parentTargetReference = ItemsObserver.GetParentTargetReference(onconfirmattribute);
            if (typeof parentTargetReference.target === 'function') {
                this.confirm = () => {
                    parentTargetReference.parent[parentTargetReference.targetName]((<any[]>this.trashItems).map((eachTrashItem) => {
                        return eachTrashItem.trashItem;
                    }));
                };
            }
        }

        if (this.hasAttribute('singular-text')) {
            this.singularText = this.getAttribute('singular-text').valueOf();
        }

        if (this.hasAttribute('plural-text')) {
            this.pluralText = this.getAttribute('plural-text').valueOf();
        }

        super.connectedCallback();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    activate = () => {
        this.displayElements = this.importBoundTemplate({
            ['trash']: `${this.observedTargetKey}`,
            ['text']: `${this.observedTargetKey}.text`,
            ['open']: `${this.observedTargetKey}.open()`,
            ['confirm']: `${this.observedTargetKey}.confirm()`,
            ['cancel']: `${this.observedTargetKey}.cancel()`
        }, 'trash-display') as Element[];
        this.renderElementCollection(this.displayElements, this);
    }

    deactivate = () => {
        if (this.displayElements && this.displayElements.length) {
            this.removeElementCollection(this.displayElements, this);
        }
    }

    update(updated: any[], key: string, value: any) {
        if (value && Array.isArray(value)) {
            this.trashItems = value;
            let ptr = ItemsObserver.GetParentTargetReference(this.observedTargetKey);

            let length: number = ptr.target.length;

            ptr.target.text = `${length} ${length === 1 ? this.singularText : this.pluralText}`;
            ptr.target.open = () => {
                this.modalActive = true;
            };
            ptr.target.confirm = () => {
                this.confirm();
                this.modalActive = false;
            };
            ptr.target.cancel = () => {
                this.modalActive = false;
            };
            this.active = length > 0;

            return;
        }
    }
}
