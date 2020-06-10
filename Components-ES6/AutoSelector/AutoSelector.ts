import { ItemsObserver } from "../mixins/ItemsObserver.js";
import { ActivationSelector } from "../mixins/ActivationSelector.js";
import { IAutoSelector } from "./IAutoSelector";

export class AutoSelector extends ItemsObserver.extends(ActivationSelector.extends(HTMLElement)) implements IAutoSelector {

    attributeElementId?: string;
    attributeElement?: HTMLElement;
    attributeValueProperty: string;
    attributeValueKey: string;
    operator: string;
    value: any;
    expressionFn: (value: any) => boolean;

    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();

        if (this.hasAttribute('attribute-element')) {
            this.attributeElementId = this.getAttribute('attribute-element').valueOf();
        }
        if (this.hasAttribute('value')) {
            this.value = this.getAttribute('value');
            this.operator = '==';
            if (this.hasAttribute('operator')) {
                this.operator = this.getAttribute('operator').valueOf();
            }
            this.expressionFn = new Function(`return arguments[0] ${this.operator} ${this.value};`) as (evaluationValue: any) => boolean;
        }
        else {
            this.expressionFn = new Function(`return arguments[0] ? true : false;`) as (evaluationValue: any) => boolean;
        }

        if (this.hasAttribute('attribute-value-item')) {
            this.attributeValueKey = this.getAttribute('attribute-value-item').valueOf();
            this.attributeValueProperty = ItemsObserver.GetKeyProperty(this.attributeValueKey);
        }

        if (this.attributeValueKey) {
            this.addObservedKey(this.attributeValueKey);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    /** unused parent & property supplied by update() from ItemsObserver */
    update = (parent: any, property: any, value: any) => {
        if (this.attributeElementId && !this.activeElement) {
            this.attributeElement = this.sourceDocument.getElementById(this.attributeElementId);
        }

        if (this.attributeElement) {
            if (property === this.attributeValueProperty) {
                this.useAttributeValue = `${value || ''}`;
            }
            else {
                this.active = this.expressionFn ? this.expressionFn(value) : this.active;
            }
            if (this.active) {
                this.attributeElement.setAttribute(this.useAttribute, this.useAttributeValue || '');
            }
            else {
                this.attributeElement.removeAttribute(this.useAttribute);
            }
        }
        else {
            this.active = this.expressionFn ? this.expressionFn(value) : this.active;
        }
    }
}
