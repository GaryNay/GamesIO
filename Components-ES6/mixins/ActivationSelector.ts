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
            if (!value) {
                if (this.inactiveElement && this.inactiveElement.hasAttribute(this.useAttribute)) {
                    this.inactiveElement.removeAttribute(this.useAttribute);
                }
                if (this.activeElement) {
                    this.activeElement.setAttribute(this.useAttribute, this.useAttributeValue || '');
                }
                if (this.hasAttribute('active')) {
                    this.removeAttribute('active');
                    this.deactivate();
                }
                return;
            }
            if (value) {
                if (this.inactiveElement) {
                    this.inactiveElement.setAttribute(this.useAttribute, this.useAttributeValue || '');
                }
                if (this.activeElement && this.activeElement.hasAttribute(this.useAttribute)) {
                    this.activeElement.removeAttribute(this.useAttribute);
                }
                if (!this.hasAttribute('active')) {
                    this.setAttribute('active', '');
                    this.activate();
                }
            }
        }

        activate = () => {
            this.active = true;
        }

        deactivate = () => {
            this.active = false;
        }

        connectedCallback() {
            super.connectedCallback && super.connectedCallback();

            this.sourceDocument = this.sourceDocument || document;
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
                this.deactivate();
            }
            super.disconnectedCallback && super.disconnectedCallback();
        }
    })
}
