import { IActivationSelector, ActivationSelectorElement } from "./IActivationSelector";
import { CustomHTMLElement } from "../CustomHTMLElement";

interface Constructor<T> {
    new (): T;
}

export class ActivationSelector {
    static extends: <Inherited>(sClass: Constructor<Inherited>) => Constructor<Inherited & ActivationSelectorElement> = <any>((superclass: Constructor<CustomHTMLElement>) => class extends superclass implements ActivationSelectorElement {
        sourceDocument: HTMLDocument;
        inactiveElement: HTMLElement;
        inactiveElementId: string;
        activeElement: HTMLElement;
        activeElementId: string;
        useAttribute: string;
        useAttributeValue: any;

        get active() {
            return this.hasAttribute('active');
        }

        set active(value) {
            if (this.inactiveElementId && !this.inactiveElement) {
                this.inactiveElement = this.sourceDocument.getElementById(this.inactiveElementId);
            }
            if (this.activeElementId && !this.activeElement) {
                this.activeElement = this.sourceDocument.getElementById(this.activeElementId);
            }

            let toggleto = value ? true : false;
            if (this.useAttribute === 'disabled') {
                toggleto = toggleto ? false : true;
            }

            if (this.hasAttribute('active')) {
                if (!value) {
                    this.removeAttribute('active');
                    this.deactivate();
                }
            }
            else {
                if (value) {
                    this.setAttribute('active', '');
                    this.activate();
                }
            }

            if (toggleto) {
                if (this.inactiveElement && this.inactiveElement.hasAttribute(this.useAttribute)) {
                    this.inactiveElement.removeAttribute(this.useAttribute);
                }
                if (this.activeElement) {
                    this.activeElement.setAttribute(this.useAttribute, this.useAttributeValue || '');
                }
            }
            else {
                if (this.inactiveElement) {
                    this.inactiveElement.setAttribute(this.useAttribute, this.useAttributeValue || '');
                }
                if (this.activeElement && this.activeElement.hasAttribute(this.useAttribute)) {
                    this.activeElement.removeAttribute(this.useAttribute);
                }
            }
        }

        activate = () => {
        }

        deactivate = () => {
        }

        connectedCallback() {
            this.sourceDocument = this.sourceDocument || document;

            super.connectedCallback && super.connectedCallback();

            if (this.hasAttribute('inactive-element')) {
                this.inactiveElementId = this.getAttribute('inactive-element').valueOf();
            }
            if (this.hasAttribute('active-element')) {
                this.activeElementId = this.getAttribute('active-element').valueOf();
            }
    
            if (this.hasAttribute('use-attribute')) {
                this.useAttribute = this.getAttribute('use-attribute').valueOf();
            }
            else {
                this.useAttribute = 'disabled';
            }
    
            if (this.hasAttribute('active')) {
                this.active = true;
            }
            else {
                this.active = false;
            }
        }

        disconnectedCallback() {
            if (this.hasAttribute('active')) {
                this.active = false;
            }
            super.disconnectedCallback && super.disconnectedCallback();
        }
    })
}
