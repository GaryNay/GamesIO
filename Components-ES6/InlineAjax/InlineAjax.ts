import { ItemsObserver } from "../mixins/ItemsObserver.js";
import { ClientProviders } from "../../ClientProviders/ClientProviders.js";
import { IInlineAjax } from "./IInlineAjax";

export class InlineAjax extends ItemsObserver.extends(HTMLElement) implements IInlineAjax {
    sourceDocument: Document;
    xhrProvider: ClientProviders.XhrProvider;
    visibilityObserver: IntersectionObserver;
    href: string;

    constructor() {
        super();
    }

    connectedCallback() {
        this.sourceDocument = this.sourceDocument || document;
        super.connectedCallback();

        this.xhrProvider = new ClientProviders.XhrProvider('./');

        if (this.hasAttribute('get-when-visible') && this.hasAttribute('href')) {
            this.href = this.getAttribute('href').valueOf();
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
                { root: null, rootMargin: '0px', threshold: .1 }
            );
            this.visibilityObserver.observe(this);
        }
    }

    async refresh() {
        return this.defaultTargetKey && new Promise(async (resolve, reject) => {
            let response = (await this.xhrProvider.getAsync(this.href)).firstOrDefault();
            let ptr = ItemsObserver.GetParentTargetReference(this.defaultTargetKey);
            ptr.parent[ ptr.targetName ] = response;
            return resolve();
        });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    update(updated?: any, key?: string | number, value?: any) {
    }
}
