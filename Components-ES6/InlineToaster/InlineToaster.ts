import { TemplateRenderer } from "../mixins/TemplateRenderer";
import { IInlineToaster } from "./IInlineToaster";
import { ItemsObserver } from "../mixins/ItemsObserver";
import { IToastSlice } from "./IToastSlice";

//** Provides a toasting interface to users */
export class InlineToaster extends TemplateRenderer.extends(ItemsObserver.extends(HTMLElement)) {

    activeToastNumber = 0;

    get active() {
        let self: IInlineToaster = <any>this;
        return self.hasAttribute('active');
    }

    set active(value: boolean) {
        let self: IInlineToaster = <any>this;
        if (!value && self.hasAttribute('active')) {
            self.removeAttribute('active');
        }
        if (value && !self.hasAttribute('active')) {
            self.setAttribute('active', '');
        }
    }

    get duration(): number {
        let self: IInlineToaster = <any>this;
        if (self.hasAttribute('duration')) {
            return parseInt(self.getAttribute('duration').valueOf());
        }
    }

    set duration(value: number) {
        let self: IInlineToaster = <any>this;
        if (value) {
            self.setAttribute('duration', `${value}`);
        }
        if (!value && self.hasAttribute('duration')) {
            self.removeAttribute('duration');
        }
    }

    constructor() {
        super();

    }

    connectedCallback() {
        let self: IInlineToaster = <any>this;
        TemplateRenderer.connectedCallback.apply(self);

        if (!self.hasAttribute('duration')) {
            self.duration = 1000;
        }
        if (self.hasAttribute('toasts')) {
            self.toastKey = self.getAttribute('toasts').valueOf();
        }
        if (self.hasAttribute('loaf')) {
            self.collectionAttribute = 'loaf';
            ItemsObserver.connectedCallback.apply(self);
        }
        if (self.hasAttribute('parser')) {
            let parserPath = self.getAttribute('parser');
            if (parserPath) {
                self.parser = Function(`return ${parserPath};`)();
            }
        }
        else {
            self.parser = (input) => { return input.toString(); };
        }

    }

    disconnectedCallback() {
        TemplateRenderer.disconnectedCallback.apply(this);
        this.collectionAttribute ? ItemsObserver.disconnectedCallback.apply(this) : null;
    }

    update(updated: any[], key: string, value: any) {
        let self: IInlineToaster = <any>this;
        if (value && Array.isArray(value) && value.length) {
            let nextToast: IToastSlice = Function(`return ${self.collectionAttribute}.pop();`)();
            self.toast(nextToast.toast, nextToast.template, nextToast.callback);
        }
    }

    toast(textObject: any, templateName?: string, externalCallbackFn?: (confirmed: boolean) => void) {
        let self: IInlineToaster = <any>this;
        self.active = true;

        let toasts = Function(`return ${self.toastKey};`)();
        if (!toasts || parseInt(toasts.length) === NaN) {
            toasts = Function(`return ${self.toastKey} = [];`)();
        }
        let thisToastIndex = toasts.length;
        let closeToastCallback = (confirmed: boolean) => {
            if (externalCallbackFn) {
                externalCallbackFn(confirmed);
            }
            toasts = Function(`return ${self.toastKey};`)();
            self.removeElementCollection(toasts[thisToastIndex].toastElements, self);
            Function(`${self.toastKey}[${thisToastIndex}] = null;`)();
            self.activeToastNumber--;
            if (!self.activeToastNumber) {
                Function(`${self.toastKey} = [];`)();
                self.active = false;
            }
        };

        let thisToast = {
            text: self.parser(textObject),
            confirm: () => {
                closeToastCallback(true);
            },
            cancel: () => {
                closeToastCallback(false);
            },
            toastElements: self.importBoundTemplate({
                text: `${self.toastKey}[${thisToastIndex}].text`,
                confirm: `${self.toastKey}[${thisToastIndex}].confirm()`,
                cancel: `${self.toastKey}[${thisToastIndex}].cancel()`
            }, templateName) as Element[]
        };

        Function(`${self.toastKey}[${thisToastIndex}] = arguments[0];`)( thisToast );

        self.renderElementCollection(thisToast.toastElements, self);
        self.activeToastNumber++;

        setTimeout(() => {
            toasts = Function(`return ${self.toastKey};`)();
            if (toasts && toasts[thisToastIndex]) {
                closeToastCallback(false);
            }
        }, self.duration);
    }
}
