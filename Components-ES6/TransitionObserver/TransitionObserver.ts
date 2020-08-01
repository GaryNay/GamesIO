import { ITransitionObserver } from "./ITransitionObserver";

export class TransitionObserver extends HTMLElement implements ITransitionObserver {

    toTransition: HTMLElement[];
    debounce = 200;
    sourceDocument: Document;

    transitionAttribute: string;
    transitioningElements = 0;
    transitioningAttribute: string = 'transitioning';
    transitionOutAttribute: string = 'transition-out';
    transitionInAttribute: string = 'transition-in';
    endHandler: () => void;
    startHandler: () => void;
    cancelHandler: () => void;
    transitionClassName: string;
    endedPreviouslyTransitioningElements = 0;
    canceledPreviouslyTransitioningElements = 0  ;
    attributeObserver: MutationObserver;

    constructor() {
        super();
    }

    connectedCallback() {
        this.sourceDocument = this.sourceDocument || document;

        if (this.hasAttribute('transitioning-attribute')) {
            this.transitioningAttribute = this.getAttribute('transitioning-attribute').valueOf();
        }
        if (this.hasAttribute('transition-attribute')) {
            this.transitionAttribute = this.getAttribute('transition-attribute').valueOf() || 'transition';

            if (this.hasAttribute('out-attribute')) {
                this.transitionOutAttribute = this.getAttribute('out-attribute').valueOf();
            }
            if (this.hasAttribute('in-attribute')) {
                this.transitionInAttribute = this.getAttribute('in-attribute').valueOf();
            }
        }

        if (this.hasAttribute('debounce')) {
            this.debounce = parseInt(this.getAttribute('debounce').valueOf()) || 200;
        }

        setTimeout(() => {
            this.observeTransitions();
        }, 100);
    }

    observeTransitions() {
        if (this.hasAttribute('transition-element')) {
            this.toTransition = [ this.sourceDocument.getElementById(this.getAttribute('transition-element').valueOf()) ];
        }
        else if (this.hasAttribute('transition-class')) {
            this.toTransition = [];
            this.transitionClassName = this.getAttribute('transition-class').valueOf();
            for (let eachElement of this.sourceDocument.getElementsByClassName(this.transitionClassName)) {
                this.toTransition.push(eachElement as HTMLElement);
            }
        }

        if (this.transitionAttribute) {
            this.attributeObserver = new MutationObserver((mutationList) => {
                for (let eachMutation of mutationList) {
                    if (eachMutation.type === 'attributes') {
                        if (eachMutation.attributeName === this.transitionAttribute) {
                            let element = <HTMLElement>eachMutation.target;
                            let triggeredTransition = performance.now();
                            if (!(<any>element).transitionObserver_LastTriggeredTransition) {
                                (<any>element).transitionObserver_LastTriggeredTransition = triggeredTransition;
                            }
                            if (this.transitionAttribute && element.hasAttribute( this.transitionAttribute )) {
                                element.removeAttribute( this.transitionOutAttribute );
                            }
                    
                            setTimeout(() => {
                                if ((<any>element).transitionObserver_LastTriggeredTransition <= triggeredTransition) {
                                    console.log(`TransitionObserver: ${ element.tagName }.${ element.classList.toString() } MANUAL AUDIT, ${ this.transitionAttribute } = ${ element.hasAttribute(this.transitionAttribute) }`);
                                }
                                else {
                                    console.log(`TransitionObserver: ${ element.tagName }.${ element.classList.toString() } Transition success, ${ this.transitionAttribute } = ${ element.hasAttribute(this.transitionAttribute) }`);
                                }
                            }, this.debounce);
                        }
                    }
                }
            });
        }

        for (let eachElement of this.toTransition) {
            eachElement.addEventListener('transitionrun', (<any>eachElement).startHandler = (event) => { this.transitionStart(event, true); });
            eachElement.addEventListener('transitionstart', (<any>eachElement).startHandler = (event) => { this.transitionStart(event, false); });
            eachElement.addEventListener('transitioncancel', (<any>eachElement).cancelHandler = (event) => { this.transitionEnd(event, true); });
            eachElement.addEventListener('transitionend', (<any>eachElement).endHandler = (event) => { this.transitionEnd(event, false); });

            if (this.transitionAttribute) {
                // Assume it has finished
                if (eachElement.hasAttribute(this.transitionAttribute)) {
                    eachElement.setAttribute(this.transitionInAttribute, '');
                }
                else {
                    eachElement.setAttribute(this.transitionOutAttribute, '');
                }
                this.attributeObserver.observe(eachElement, { attributes: true, attributeFilter: [ this.transitionAttribute ]});
            }
        }
        console.log(`TransitionObserver: Subscribed to ${ this.toTransition.length } elements from class ${ this.transitionClassName }`);
    }

    auditTransitionAttributes(element: HTMLElement) {
        if (element.hasAttribute( this.transitionAttribute )) {
            element.setAttribute( this.transitionInAttribute, '');
            element.removeAttribute( this.transitionOutAttribute );
        }
        else {
            element.setAttribute( this.transitionOutAttribute, '');
            element.removeAttribute( this.transitionInAttribute );
        }
    }

    transitionStart(event: TransitionEvent, isRun = false) {
        let element = event.target as HTMLElement;
        (<any>element).transitionObserver_LastTriggeredTransition = performance.now();

        if (isRun) {
            console.log(`TransitionObserver: ${ element.tagName }.${ element.classList.toString() } RUNS, ${ this.transitionAttribute } = ${ element.hasAttribute(this.transitionAttribute) }`);

        }
        else {
            element.setAttribute(this.transitioningAttribute, '');
            this.transitioningElements++;
            
            if (!this.hasAttribute(this.transitioningAttribute)) {
                this.setAttribute(this.transitioningAttribute, '');
            }
    
            if (this.transitionAttribute) {
                this.auditTransitionAttributes(element);
            }
        
      
            this.setAttribute('transitioning-elements', `${ this.transitioningElements }`);

            console.log(`TransitionObserver: ${ element.tagName }.${ element.classList.toString() } STARTS, ${ this.transitionAttribute } = ${ element.hasAttribute(this.transitionAttribute) }`);
        }
    }
    
    transitionEnd(event: TransitionEvent, isCancel = false) {

        let element = event.target as HTMLElement;
        (<any>element).transitionObserver_LastTriggeredTransition = null;

        element.removeAttribute(this.transitioningAttribute);
        this.transitioningElements--;
        if (this.transitioningElements < 0) {
            this.transitioningElements = 0;

            if (isCancel) {
                this.canceledPreviouslyTransitioningElements++;
                this.setAttribute('p-cancel', `${ this.canceledPreviouslyTransitioningElements }`);
            }
            else {
                this.endedPreviouslyTransitioningElements++;
                this.setAttribute('p-end', `${ this.endedPreviouslyTransitioningElements }`);
            } 
        }

        if (!this.transitioningElements || this.transitioningElements < 1) {
            this.removeAttribute(this.transitioningAttribute);
        }

        if (this.transitionAttribute) {
            this.auditTransitionAttributes(element);
        }

        this.setAttribute('transitioning-elements', this.transitioningElements.toString());
        // console.log(`TransitionObserver: ${ element.tagName }.${ element.classList.toString() } ENDS, ${ this.transitionAttribute } = ${ element.hasAttribute(this.transitionAttribute) }`);
    }

    disconnectedCallback() {
        for (let eachElement of this.toTransition) {
            eachElement.removeEventListener('transitionstart', (<any>eachElement).startHandler);
            eachElement.removeEventListener('transitioncancel', (<any>eachElement).cancelHandler);
            eachElement.removeEventListener('transitionend', (<any>eachElement).endHandler);
        }
        if (this.attributeObserver) {
            this.attributeObserver.disconnect();
        }
    }

}
