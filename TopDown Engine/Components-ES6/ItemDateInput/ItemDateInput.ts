import { ItemsObserver } from "../Mixins/ItemsObserver";
import { IItemDateInput } from "./IItemDateInput";

export class ItemDateInput extends ItemsObserver.extends(HTMLElement) {

    get value() {
        let self: IItemDateInput = <any>this;
        return self.input.value;
    }

    set value(value: string) {
        let self: IItemDateInput = <any>this;
        self.input.valueAsDate = new Date(value);
    }

    constructor() {
        super();
    }

    connectedCallback() {
        let self: IItemDateInput = <any>this;

        if (self.hasAttribute('value-property')) {
            self.valueProperty = self.getAttribute('value-property').valueOf();
            self.semanticTargetKey = `${self.valueProperty}`;
        }

        self.sourceDocument = self.sourceDocument || document;

        self.containerSpan = self.sourceDocument.createElement('span');
        self.appendChild(self.containerSpan);
        self.input = self.sourceDocument.createElement('input');
        self.input.type = 'date';
        self.containerSpan.appendChild(self.input);

        if (self.hasAttribute('value')) {
            self.input.valueAsDate = new Date(`${self.getAttribute('value').valueOf()}`);
        }
        else {
            self.input.value = '';
        }

        if (self.hasAttribute('on-change')) {
            let onchangeAttribute = self.getAttribute('on-change').valueOf();
            if (onchangeAttribute) {
                let passThisValue = self.hasAttribute('pass-on-change') ? self.getAttribute('pass-on-change').valueOf() : null;
                self.changed = () => {
                    let parentTargetReference = ItemsObserver.getParentTargetReference(onchangeAttribute);
                    if (typeof parentTargetReference.target === 'function') {
                        parentTargetReference.target.apply(parentTargetReference.parent, [passThisValue || self.input.valueAsDate]);
                    }
                };
            }
        }

        self.input.addEventListener('change', () => {
            let textValue = self.input.value;
            let ptr = ItemsObserver.getParentTargetReference(self.observedTargetKey);
            self.ownUpdated = true;
            ptr.parent[ptr.targetName] = textValue;

            if (self.changed) {
                self.changed();
            }
        });

        ItemsObserver.connectedCallback.apply(self);
    }

    disconnectedCallback() {
        let self: IItemDateInput = <any>this;
        ItemsObserver.disconnectedCallback.apply(self);
    }

    update(updated: any, key: string, value: any) {
        let self: IItemDateInput = <any>this;
        if (!self.ownUpdated) {
            if (value) {
                self.input.valueAsDate = new Date(value);
            }
            else {
                self.input.value = null;
            }
            if (self.changed) {
                self.changed();
            }
        }
        self.ownUpdated = false;
    }
}
