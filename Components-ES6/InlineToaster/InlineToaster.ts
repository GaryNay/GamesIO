import { TemplateRenderer } from "../mixins/TemplateRenderer.js";
import { IInlineToaster } from "./IInlineToaster";
import { ItemsObserver } from "../mixins/ItemsObserver.js";
import { IToastSlice } from "./IToastSlice";

//** Provides a toasting interface to users */
export class InlineToaster extends TemplateRenderer.extends(ItemsObserver.extends(HTMLElement)) implements IInlineToaster {

    toastKey: string;
    activeToastNumber = 0;
    parser: (input: any) => string;

    get active() {
        return this.hasAttribute('active');
    }

    set active(value: boolean) {
        if (!value && this.hasAttribute('active')) {
            this.removeAttribute('active');
        }
        if (value && !this.hasAttribute('active')) {
            this.setAttribute('active', '');
        }
    }

    get duration(): number {
        if (this.hasAttribute('duration')) {
            return parseInt(this.getAttribute('duration').valueOf());
        }
    }

    set duration(value: number) {
        if (value) {
            this.setAttribute('duration', `${value}`);
        }
        if (!value && this.hasAttribute('duration')) {
            this.removeAttribute('duration');
        }
    }

    constructor() {
        super();

    }

    connectedCallback() {

        if (!this.hasAttribute('duration')) {
            this.duration = 1000;
        }
        if (this.hasAttribute('toasts')) {
            this.toastKey = this.getAttribute('toasts').valueOf();
        }
        if (this.hasAttribute('loaf')) {
            this.collectionAttribute = 'loaf';
        }
        if (this.hasAttribute('parser')) {
            let parserPath = this.getAttribute('parser');
            if (parserPath) {
                this.parser = Function(`return ${parserPath};`)();
            }
        }
        else {
            this.parser = (input) => { return input.toString(); };
        }

        super.connectedCallback();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    update(updated: any[], key: string, value: any) {
        if (value && Array.isArray(value) && value.length) {
            let nextToast: IToastSlice = Function(`return ${this.collectionAttribute}.pop();`)();
            this.toast(nextToast.toast, nextToast.template, nextToast.callback);
        }
    }

    toast(textObject: any, templateName?: string, externalCallbackFn?: (confirmed: boolean) => void) {
        this.active = true;

        let toasts = Function(`return ${this.toastKey};`)();
        if (!toasts || parseInt(toasts.length) === NaN) {
            toasts = Function(`return ${this.toastKey} = [];`)();
        }
        let thisToastIndex = toasts.length;
        let closeToastCallback = (confirmed: boolean) => {
            if (externalCallbackFn) {
                externalCallbackFn(confirmed);
            }
            toasts = Function(`return ${this.toastKey};`)();
            this.removeElementCollection(toasts[thisToastIndex].toastElements, this);
            Function(`${this.toastKey}[${thisToastIndex}] = null;`)();
            this.activeToastNumber--;
            if (!this.activeToastNumber) {
                Function(`${this.toastKey} = [];`)();
                this.active = false;
            }
        };

        let thisToast = {
            text: this.parser(textObject),
            confirm: () => {
                closeToastCallback(true);
            },
            cancel: () => {
                closeToastCallback(false);
            },
            toastElements: this.importBoundTemplate({
                text: `${this.toastKey}[${thisToastIndex}].text`,
                confirm: `${this.toastKey}[${thisToastIndex}].confirm()`,
                cancel: `${this.toastKey}[${thisToastIndex}].cancel()`
            }, templateName) as Element[]
        };

        Function(`${this.toastKey}[${thisToastIndex}] = arguments[0];`)( thisToast );

        this.renderElementCollection(thisToast.toastElements, this);
        this.activeToastNumber++;

        setTimeout(() => {
            toasts = Function(`return ${this.toastKey};`)();
            if (toasts && toasts[thisToastIndex]) {
                closeToastCallback(false);
            }
        }, this.duration);
    }
}
