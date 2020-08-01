import { CustomHTMLElement } from "../CustomHTMLElement";

export interface ITriggerHandler {
    triggerElement: HTMLElement;
    triggerAttribute: string;
    triggered: () => void;
    trigger();
    reset: () => void;
    resetTrigger();

    sourceDocument: Document;

    attributeObserver: MutationObserver;

    visibilityObserver: IntersectionObserver;
    isVisible: boolean;
    triggerCallbackKey: string;
}

export interface TriggerHandlerElement extends ITriggerHandler, CustomHTMLElement {}
