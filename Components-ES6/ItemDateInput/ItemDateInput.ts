import { ItemsObserver } from "../mixins/ItemsObserver.js";
import { IItemDateInput } from "./IItemDateInput";

export class ItemDateInput extends ItemsObserver.extends(HTMLElement) implements IItemDateInput {
    sourceDocument: HTMLDocument;
    containerSpan: HTMLSpanElement;
    input: HTMLInputElement;
    valueProperty: string;
    debounce: number;
    ownUpdated: boolean;
    placeholder?: string;

    changed: () => void;

    get value() {
        return this.input.value;
    }

    set value(value: string) {
        this.input.valueAsDate = new Date(value);
    }

    constructor() {
        super();
    }

    connectedCallback() {
        if (this.hasAttribute('value-property')) {
            this.valueProperty = this.getAttribute('value-property').valueOf();
            this.semanticTargetKey = `${this.valueProperty}`;
        }

        this.sourceDocument = this.sourceDocument || document;

        this.containerSpan = this.sourceDocument.createElement('span');
        this.appendChild(this.containerSpan);
        this.input = this.sourceDocument.createElement('input');
        this.input.type = 'date';
        this.containerSpan.appendChild(this.input);

        if (this.hasAttribute('value')) {
            this.input.valueAsDate = new Date(`${this.getAttribute('value').valueOf()}`);
        }
        else {
            this.input.value = '';
        }

        if (this.hasAttribute('on-change')) {
            let onchangeAttribute = this.getAttribute('on-change').valueOf();
            if (onchangeAttribute) {
                let passThisValue = this.hasAttribute('pass-on-change') ? this.getAttribute('pass-on-change').valueOf() : null;
                this.changed = () => {
                    let parentTargetReference = ItemsObserver.GetParentTargetReference(onchangeAttribute);
                    if (typeof parentTargetReference.target === 'function') {
                        parentTargetReference.target.apply(parentTargetReference.parent, [passThisValue || this.input.valueAsDate]);
                    }
                };
            }
        }

        this.input.addEventListener('change', () => {
            let textValue = this.input.value;
            let ptr = ItemsObserver.GetParentTargetReference(this.observedTargetKey);
            this.ownUpdated = true;
            ptr.parent[ptr.targetName] = textValue;

            if (this.changed) {
                this.changed();
            }
        });

        super.connectedCallback();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    update(updated: any, key: string, value: any) {
        if (!this.ownUpdated) {
            if (value) {
                this.input.valueAsDate = new Date(value);
            }
            else {
                this.input.value = null;
            }
            if (this.changed) {
                this.changed();
            }
        }
        this.ownUpdated = false;
    }
}
