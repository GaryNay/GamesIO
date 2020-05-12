import { ItemsObserver } from "../Mixins/ItemsObserver";
import { ActivationSelector } from "../Mixins/ActivationSelector";
import { IAutoSelector } from "./IAutoSelector";

export class AutoSelector extends ItemsObserver.extends(ActivationSelector.extends(HTMLElement)) {

    constructor() {
        super();
    }

    connectedCallback() {
        let self: IAutoSelector = <any>this;
        ActivationSelector.connectedCallback.apply(self);
        if (self.hasAttribute('attribute-element')) {
            self.attributeElementId = self.getAttribute('attribute-element').valueOf();
        }
        if (self.hasAttribute('value')) {
            self.value = self.getAttribute('value');
            self.operator = '==';
            if (self.hasAttribute('operator')) {
                self.operator = self.getAttribute('operator').valueOf();
            }
            self.expressionFn = new Function(`return arguments[0] ${self.operator} ${self.value};`) as (evaluationValue: any) => boolean;
        }
        else {
            self.expressionFn = new Function(`return arguments[0] ? true : false;`) as (evaluationValue: any) => boolean;
        }

        if (self.hasAttribute('attribute-value-item')) {
            self.attributeValueKey = self.getAttribute('attribute-value-item').valueOf();
            self.attributeValueProperty = ItemsObserver.getKeyProperty(self.attributeValueKey);
        }

        ItemsObserver.connectedCallback.apply(self);

        if (self.attributeValueKey) {
            self.addObservedKey(self.attributeValueKey);
        }
    }

    disconnectedCallback() {
        ActivationSelector.disconnectedCallback.apply(this);
        ItemsObserver.disconnectedCallback.apply(this);
    }

    /** unused parent & property supplied by update() from ItemsObserver */
    update(parent, property, value) {
        let self: IAutoSelector = <any>this;

        if (self.attributeElementId && !self.activeElement) {
            self.attributeElement = self.sourceDocument.getElementById(self.attributeElementId);
        }

        if (self.attributeElement) {
            if (property === self.attributeValueProperty) {
                self.useAttributeValue = `${value || ''}`;
            }
            else {
                self.active = self.expressionFn ? self.expressionFn(value) : self.active;
            }
            if (self.active) {
                self.attributeElement.setAttribute(self.useAttribute, self.useAttributeValue || '');
            }
            else {
                self.attributeElement.removeAttribute(self.useAttribute);
            }
        }
        else {
            self.active = self.expressionFn ? self.expressionFn(value) : self.active;
        }
    }
}
