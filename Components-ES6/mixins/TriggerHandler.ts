import { CustomHTMLElement } from "../CustomHTMLElement";
import { TriggerHandlerElement, ITriggerHandler } from "./ITriggerHandler";

interface Constructor<T> {
    new (): T;
}

export class TriggerHandler {

    static extends: <Inherited>(sClass: Constructor<Inherited>) => Constructor<Inherited & TriggerHandlerElement> = <any>((superclass: Constructor<CustomHTMLElement>) => class extends superclass implements ITriggerHandler {
        triggerElement: HTMLElement;
        triggerAttribute: string;
        triggerStatement: Function;
        triggered: () => void;
        reset: () => void;

        attributeObserver: MutationObserver;

        visibilityObserver: IntersectionObserver;
        isVisible: boolean;
    
        sourceDocument: Document;
        triggerCallbackKey: string;
        blurTriggerElement: HTMLElement;
        blurHandler: () => void;


        connectedCallback() {
            super.connectedCallback && super.connectedCallback(); 

            this.sourceDocument = this.sourceDocument || document;

            if (!this.triggered) {
                this.triggered = () => { return; };
            }

            if (this.hasAttribute('on-trigger-statement')) {
                try {
                    this.triggerStatement = new Function(this.getAttribute('on-trigger-statement').valueOf());
                }
                catch (e) {
                    this.triggerStatement = null;
                }
            }

            if (this.hasAttribute('on-trigger')) {
                this.triggerCallbackKey = this.getAttribute('on-trigger').valueOf();
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
                                if (eachMutation.attributeName === this.triggerAttribute) {

                                    if ((<HTMLElement>eachMutation.target).hasAttribute( this.triggerAttribute )) {
                                        return this.trigger();
                                    }
                                    else {
                                        // return this.resetTrigger();
                                    }
                                }
                            }
                        }
                    });

                    this.attributeObserver.observe(this.triggerElement, { attributes: true, attributeFilter: [ this.triggerAttribute ]});

                    if (this.triggerElement.hasAttribute( this.triggerAttribute )) {
                        setTimeout(() => {
                            return this.trigger();
                        });
                    }
                }
            }

            if (this.hasAttribute('trigger-when-visible')) {
                // Create an IntersectionObserver to trigger refresh whenever object becomes visible
                this.isVisible = false;
                this.visibilityObserver = new IntersectionObserver((intersections) => {
                    this.isVisible = false;
                    for (let eachIntersect of intersections) {
                        if (eachIntersect.isIntersecting) {
                            this.isVisible = true;
                        }
                    }
                    if (this.isVisible) {
                        this.setAttribute('is-visible', '');

                        return this.trigger();
                    }
                    else {
                        this.removeAttribute('is-visible');
                    }
                },
                    // Observe on document, notify when remotely shown (.1)
                    { root: this, rootMargin: '0px', threshold: .1 }
                );
                this.visibilityObserver.observe(this);
            }

            if (this.hasAttribute('blur-trigger')) {
                let blurTriggerElementId = this.getAttribute('blur-trigger').valueOf();
                if (blurTriggerElementId) {
                    this.blurTriggerElement = this.sourceDocument.getElementById(blurTriggerElementId);
                }
                else {
                    this.blurTriggerElement = this;
                }

                this.blurHandler = () => {
                    this.trigger();
                };
                this.blurTriggerElement.addEventListener('blur', this.blurHandler);
            }

        }
    
        disconnectedCallback() {
            super.disconnectedCallback && super.disconnectedCallback();
            if (this.visibilityObserver) {
                this.visibilityObserver.disconnect();
            }
            if (this.attributeObserver) {
                this.attributeObserver.disconnect();
            }

            if (this.blurTriggerElement) {
                this.blurTriggerElement.removeEventListener('blur', this.blurHandler);
            }
        }

        trigger() {
            this.triggerStatement && this.triggerStatement();
            this.triggered && this.triggered();
        }

        resetTrigger() {
            this.reset && this.reset();
        }
    })
}
