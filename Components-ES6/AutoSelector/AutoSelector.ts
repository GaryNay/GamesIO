import { ItemsObserver } from "../mixins/ItemsObserver.js";
import { ActivationSelector } from "../mixins/ActivationSelector.js";
import { IAutoSelector } from "./IAutoSelector";
import { TriggerHandler } from "../mixins/TriggerHandler.js";
import { Attributes } from "../mixins/Attributes.js";
import * as e from "express";

export class AutoSelector extends TriggerHandler.extends(ActivationSelector.extends(ItemsObserver.extends(Attributes.TemplateStrings(HTMLElement)))) implements IAutoSelector {

    attributeElementId?: string;
    attributeElement?: HTMLElement;
    attributeValueProperty: string;
    attributeValueKey: string;
    operator: string;
    value: any;
    expressionFn: (value: any) => boolean;
    valueKey: string;
    valueProperty: string;
    itemValue: any;

    constructor() {
        super();
    }

    activate = () => {
        if (this.hasAttribute('activated-click')) {
            this.sourceDocument.getElementById(this.getAttribute('activated-click').valueOf()).click();
        }

        if (this.attributeElementId && !this.attributeElement) {
            this.attributeElement = this.sourceDocument.getElementById(this.attributeElementId);
        }

        if (this.attributeElement) {
            this.attributeElement.setAttribute(this.useAttribute, this.useAttributeValue || '');
        }

        return super.activate && super.activate();
    }

    deactivate = () => {

        if (this.attributeElementId && !this.attributeElement) {
            this.attributeElement = this.sourceDocument.getElementById(this.attributeElementId);
        }

        if (this.attributeElement) {
            this.attributeElement.removeAttribute(this.useAttribute);
        }

        return super.deactivate && super.deactivate();
    }

    connectedCallback() {
        this.triggered = () => {
            return this.active = true;
        }
        this.reset = () => {
            return this.active = false;
        }

        if (this.hasAttribute('attribute-element')) {
            this.attributeElementId = this.getAttribute('attribute-element').valueOf();
        }

        if (this.hasAttribute('attribute-value-item')) {
            this.attributeValueKey = this.getAttribute('attribute-value-item').valueOf();
            this.attributeValueProperty = ItemsObserver.GetKeyProperty(this.attributeValueKey);
        }

        if (this.hasAttribute('value')) {
            this.value = this.getAttribute('value').valueOf();
        }

        if (this.hasAttribute('value-item')) {
            this.valueKey = this.getAttribute('value-item').valueOf();
            this.valueProperty = ItemsObserver.GetKeyProperty(this.valueKey);
        }

        if (this.value || this.valueKey) {

            this.operator = '==';
            if (this.hasAttribute('operator')) {
                this.operator = this.getAttribute('operator').valueOf();
            }
            this.expressionFn = (check) => {
                let comp = ((typeof check) === 'string') ? `'${ check }'` : check;
                let value = ((typeof this.value) === 'string') ? `'${ this.value }'` : this.value;
                let fString = `return ${ comp || '""' } ${ this.operator } ${ value || '""' };`;
                return (new Function(fString))();
            };// as (evaluationValue: any) => boolean;
        }
        else {
            this.expressionFn = new Function(`return arguments[0] ? true : false;`) as (evaluationValue: any) => boolean;
        }

        super.connectedCallback();

        if (this.attributeValueKey) {
            this.addObservedKey(this.attributeValueKey);
        }

        if (this.valueKey) {
            this.addObservedKey(this.valueKey);
        }

        if (this.defaultTargetKey && !this.valueKey) {
            let targetPtr = ItemsObserver.GetParentTargetReference(this.defaultTargetKey);
            if (targetPtr.target) {
                this.active = true;
            }
            else {
                this.active = false;
            }
        }
    }

    disconnectedCallback() {
        if (this.active) {
            this.active = false;
        }
        super.disconnectedCallback();
    }

    update = (parent: any, property: any, value: any) => {
        if (this.valueProperty && property === this.valueProperty) {
            this.value = value;
        }
        else if (this.attributeValueProperty && property === this.attributeValueProperty) {
            this.useAttributeValue = `${ value || '' }`;
        }
        else {
            this.itemValue = value;
        }

        if (this.expressionFn) {
            this.active = this.expressionFn(this.itemValue);
        }
        else {
            this.active = this.itemValue || this.value ? true : false;
        }
    }
}
