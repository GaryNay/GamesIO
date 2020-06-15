import { ItemsObserver } from "../mixins/ItemsObserver.js";
import { ClientProviders } from "../../ClientProviders/ClientProviders.js";
import { IInlineAjax } from "./IInlineAjax";
import { IProxyHandler } from "../mixins/IProxyHandler.js";
import { IProxy } from "../mixins/IProxy.js";

export class InlineAjax extends ItemsObserver.extends(HTMLElement) implements IInlineAjax {
    sourceDocument: Document;
    xhrProvider: ClientProviders.XhrProvider;
    visibilityObserver: IntersectionObserver;
    href: string;
    lastRefresh = 0;
    debounce = 200;

    triggerElement: HTMLElement;
    triggerAttribute: string;
    attributeObserver: MutationObserver;

    constructor() {
        super();
    }

    connectedCallback() {
        this.sourceDocument = this.sourceDocument || document;
        super.connectedCallback();

        this.xhrProvider = new ClientProviders.XhrProvider('./');

        if (this.hasAttribute('href')) {
            this.href = this.getAttribute('href').valueOf();

            if (this.hasAttribute('get-when-visible')) {
                // Create an IntersectionObserver to trigger refresh whenever object becomes visible
                this.visibilityObserver = new IntersectionObserver((intersections) => {
                    for (let eachIntersect of intersections) {
                        if (eachIntersect.isIntersecting) {
                            // Trigger an ajax call
                            return this.refresh();
                        }
                    }
                },
                    // Observe on document, notify when remotely shown (.1)
                    { root: this.parentElement, rootMargin: '0px', threshold: .1 }
                );
                this.visibilityObserver.observe(this);
            }

            if (this.hasAttribute('trigger-attribute')) {
                this.triggerAttribute = this.getAttribute('trigger-attribute').valueOf();
                if (this.hasAttribute('parent-trigger')) {
                    this.triggerElement = this.parentElement;
                }
                else if (!this.hasAttribute('trigger-element')) {
                    this.triggerElement = this;
                }
                else {
                    this.triggerElement = this.sourceDocument.getElementById(this.getAttribute('trigger-element').valueOf());
                }

                if (this.triggerElement) {
                    this.attributeObserver = new MutationObserver((mutationList) => {
                        for (let eachMutation of mutationList) {
                            if (eachMutation.type === 'attributes') {
                                if (eachMutation.attributeName === this.triggerAttribute && this.triggerElement.hasAttribute( this.triggerAttribute )) {
                                    return this.refresh();
                                }
                            }
                        }
                    });

                    this.attributeObserver.observe(this.triggerElement, { attributes: true, attributeFilter: [ this.triggerAttribute ]});
                }
            }
        }

        if (this.hasAttribute('debounce')) {
            this.debounce = parseInt(this.getAttribute('debounce').valueOf()) || 200;
        }
    }

    async refresh() {
        return this.defaultTargetKey && this.lastRefresh + this.debounce < performance.now() &&
            new Promise(async (resolve, reject) => {
                let response = (await this.xhrProvider.getAsync(this.href)).firstOrDefault();
                let ptr = ItemsObserver.GetParentTargetReference(this.defaultTargetKey);
                ptr.parent[ ptr.targetName ] = response;
                this.lastRefresh = performance.now();
                return resolve();
            });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    update(updated?: any, key?: string | number, value?: any) {
        if (key === 'opacity') {
            debugger;
        }
    }

    observationHandler: IProxyHandler = {
        set: (parent: IProxy<any>, property: string, value: any) => {
            parent[property] = value;
            return true;
        }
    };
}
