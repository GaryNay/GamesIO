import { IActivationSelector } from "./IActivationSelector";

export class ActivationSelector {

    static connectedCallback() {
        let self: IActivationSelector & HTMLElement = <any>this;
        self.sourceDocument = self.sourceDocument || document;
        if (self.hasAttribute('inactive-element')) {
            self.inactiveElementId = self.getAttribute('inactive-element').valueOf();
        }
        if (self.hasAttribute('active-element')) {
            self.activeElementId = self.getAttribute('active-element').valueOf();
        }

        if (self.hasAttribute('use-attribute')) {
            self.useAttribute = self.getAttribute('use-attribute').valueOf();
        }
        else {
            self.useAttribute = 'disabled';
        }

        if (self.hasAttribute('active')) {
            self.active = true;
        }
        else {
            self.active = false;
        }
    }

    static disconnectedCallback() {
        let self: IActivationSelector & HTMLElement = <any>this;
    }

    static extends = (superclass) => class extends superclass implements IActivationSelector {

        sourceDocument: HTMLDocument;

        get active() {
            let self: IActivationSelector & HTMLElement = <any>this;
            return self.hasAttribute('active');
        }

        set active(value) {
            let self: IActivationSelector & HTMLElement = <any>this;
            if (self.inactiveElementId && !self.inactiveElement) {
                self.inactiveElement = self.sourceDocument.getElementById(self.inactiveElementId);
            }
            if (self.activeElementId && !self.activeElement) {
                self.activeElement = self.sourceDocument.getElementById(self.activeElementId);
            }
            if (!value) {
                if (self.inactiveElement && self.inactiveElement.hasAttribute(self.useAttribute)) {
                    self.inactiveElement.removeAttribute(self.useAttribute);
                }
                if (self.activeElement) {
                    self.activeElement.setAttribute(self.useAttribute, self.useAttributeValue || '');
                }
                if (self.hasAttribute('active')) {
                    self.removeAttribute('active');
                    self.deactivate();
                }
                return;
            }
            if (value) {
                if (self.inactiveElement) {
                    self.inactiveElement.setAttribute(self.useAttribute, self.useAttributeValue || '');
                }
                if (self.activeElement && self.activeElement.hasAttribute(self.useAttribute)) {
                    self.activeElement.removeAttribute(self.useAttribute);
                }
                if (!self.hasAttribute('active')) {
                    self.setAttribute('active', '');
                    self.activate();
                }
            }
        }

        activate() {
        }

        deactivate() {
        }
    }
}
