import { ItemsObserver } from "../mixins/ItemsObserver.js";
import { TemplateRenderer } from "../mixins/TemplateRenderer.js"
import { TriggerHandler } from "../mixins/TriggerHandler.js";
import { ClientProviders } from "../../ClientProviders/ClientProviders.js";
import { IInlineAjax } from "./IInlineAjax";
import { IProxyHandler } from "../mixins/IProxyHandler.js";
import { IProxy } from "../mixins/IProxy.js";
import { Attributes } from "../mixins/Attributes.js";

export class InlineAjax extends TriggerHandler.extends(ItemsObserver.extends(TemplateRenderer.extends(Attributes.TemplateStrings(HTMLElement)))) implements IInlineAjax {
    static SerializeForm(form: HTMLFormElement): { name: string, value: any }[] {
        let results = [];
        for (let index = 0; index < form.elements.length; index++) {
            let item = <HTMLInputElement>form.elements.item(index);
            if (item.name) {
                results.push({ name: item.name, value: item.value });
                // results[ item.name ] = item.value;
            }
        }
        return results;
    }

    static FormData(form: HTMLFormElement): FormData {
        let formData = new FormData();
        for (let eachPair of InlineAjax.SerializeForm(form)) {
            formData.append(eachPair.name, eachPair.value);
        }
        return formData;
    }

    static FormQuery(form: HTMLFormElement): string {
        return InlineAjax.SerializeForm(form).map((eachPair) => {
            return `${ eachPair.name }=${ eachPair.value.toString() }`;
        }).join('&');
    }

    sourceDocument: Document;
    xhrProvider: ClientProviders.XhrProvider;
    href: string;
    formMethod: string;
    successElementId: string;
    lastRefresh = 0;
    debounce = 200;
    getOnce: boolean;
    getCounter: 0;

    progressElementCollection: Node[] | NodeList;
    errorElementCollection: Node[] | NodeList;
    inProgress = false;

    constructor() {
        super();
    }

    connectedCallback() {

        this.triggered = () => {
            this.refresh();
        }
        this.executeAttributeTemplatesOnConnect = false;
        super.connectedCallback();

        this.getCounter = 0;

        if (this.hasAttribute('debounce')) {
            this.debounce = parseInt(this.getAttribute('debounce').valueOf()) || 200;
        }

        if (this.hasAttribute('href')) {
            this.href = this.getAttribute('href').valueOf();

            if (this.hasAttribute('get-once')) {
                this.getOnce = true;
                setTimeout(() => {
                    return this.refresh();
                }, this.debounce);
            }
            else {
                this.getOnce = false;
            }
        }

        if (this.hasAttribute('from-form')) {
            // Use a form element to submit with ajax instead

            let targetFormId = this.getAttribute('from-form').valueOf();
            let parentForm = <HTMLFormElement>(targetFormId && this.sourceDocument.getElementById(targetFormId)) || <HTMLFormElement>this.parentElement;

            if (parentForm.hasAttribute('action')) {
                this.href = parentForm.getAttribute('action').valueOf();
            }
            if (parentForm.hasAttribute('method')) {
                this.formMethod = parentForm.getAttribute('method').valueOf();
            }
            parentForm.addEventListener('submit', (event) => { return this.submitHandler(event, parentForm); });

        }

        if (this.hasAttribute('success-click-element')) {
            this.successElementId = this.getAttribute('success-click-element').valueOf();
        }

        this.xhrProvider = new ClientProviders.XhrProvider('./', true, '', (req) => {
        });

    }

    async submitHandler (event, parentForm: HTMLFormElement) {
        event.preventDefault(); // Used to prevent navigation
        this.startProgress();
        let response;
        try {
            let href = this.returnExecutedString(this.href);
            if (this.formMethod === 'get') {
                if (href.indexOf('?') === -1) {
                    href += '?';
                }
                else {
                    href += '&';
                }
                
                href += InlineAjax.FormQuery(parentForm);

                response = (await this.xhrProvider.getAsync(href)).firstOrDefault();
            }
            else if (this.formMethod === 'patch') {

            }
            else {
                response = await this.xhrProvider.postAsync(href, InlineAjax.FormData(parentForm), false);
            }
            this.endProgress();
            if (this.successElementId) {
                this.sourceDocument.getElementById(this.successElementId).click();
            }
            if (this.defaultTargetKey) {
                let targetPtr = ItemsObserver.GetParentTargetReference(this.defaultTargetKey);
                targetPtr.parent[ targetPtr.targetName ] = response;
            }
        }
        catch (e) {
            this.errorHandler(JSON.parse(e));
        }
    }

    async refresh() {
        return this.lastRefresh + this.debounce < performance.now() &&
            new Promise(async (resolve, reject) => {
                if (this.inProgress || (this.getOnce && this.getCounter > 0)) {
                    return resolve();
                };
                this.startProgress();
                try {
                    let response = (await this.xhrProvider.getAsync(this.returnExecutedString(this.href))).firstOrDefault();
                    if (this.defaultTargetKey) {
                        let ptr = ItemsObserver.GetParentTargetReference(this.defaultTargetKey);
                        ptr.parent[ ptr.targetName ] = response;
                    }
                    this.lastRefresh = performance.now();
                    this.endProgress();
                    this.getCounter++;
                    return resolve();
                }
                catch (e) {
                    this.errorHandler(JSON.parse(e));
                }
            });
    }

    startProgress() {
        if (this.errorElementCollection) {
            this.removeElementCollection(<Node[]>this.errorElementCollection, this);
            this.errorElementCollection = null;
        }
        this.progressElementCollection = this.importBoundTemplate({}, 'progress');
        if (this.progressElementCollection) {
            this.renderElementCollection(<Node[]>this.progressElementCollection, this);
        }
        this.inProgress = true;
    }

    endProgress() {
        if (this.progressElementCollection) {
            this.removeElementCollection(<Node[]>this.progressElementCollection, this);
            this.progressElementCollection = null;
        }
        this.inProgress = false;
    }

    errorHandler(e) {
        this.endProgress();
        this.errorElementCollection = this.importBoundTemplate({
            ['status']: `${ e.status || 500 }`,
            ['statusText']: `${ e.statusText || `Internal Server Error` }`,
            ['errorText']: `${ e.response.message || `Something went wrong` }`
        }, 'error');
        if (this.errorElementCollection) {
            this.renderElementCollection(<Node[]>this.errorElementCollection, this);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    update(updated?: any, key?: string | number, value?: any) {
        if (key === 'opacity') {
            debugger;
        }
        // Trigger the ajax action based on this update (most often to patch)
    }

    observationHandler: IProxyHandler = {
        set: (parent: IProxy<any>, property: string, value: any) => {
            parent[property] = value;
            return true;
        }
    };
}
