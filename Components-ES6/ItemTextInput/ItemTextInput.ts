import { ItemsObserver } from "../mixins/ItemsObserver.js";
import { IItemTextInput } from "./IItemTextInput";

export class ItemTextInput extends ItemsObserver.extends(HTMLElement) implements IItemTextInput {
    sourceDocument: HTMLDocument;
    ownUpdated: boolean;
    placeHolder?: string;
    placeHolderDiv?: HTMLDivElement;
    multiLine: boolean;
    numeric: boolean;
    min?: number;
    max?: number;
    autoHeight: boolean;
    containerSpan: HTMLSpanElement;
    input?: HTMLInputElement | HTMLTextAreaElement;
    visibilityObserver?: IntersectionObserver;
    valueProperty: string;
    debounce: number;
    maxLength: number;
    changed: () => void;

    get value() {
        return this.input.value;
    }

    set value(value: any) {
        let setValue: number | string;
        if (!this.numeric && value && value.length > this.maxLength) {
            setValue = value.substr(0, this.maxLength);
        }
        if (this.numeric && parseFloat(value) < this.min) {
            setValue = this.min;
        }
        if (this.numeric && parseFloat(value) > this.max) {
            setValue = this.max;
        }
        this.input.value = `${setValue || value || ''}`;
    }

    validate() {
        // Pipe the value through the setter, Since validation happens there
        this.value = this.value;
    }

    constructor() {
        super();
    }

    connectedCallback() {

        if (this.hasAttribute('value-property')) {
            this.valueProperty = this.getAttribute('value-property').valueOf();
            this.semanticTargetKey = `${this.valueProperty}`;
        }

        this.sourceDocument = this.sourceDocument || document;
        this.containerSpan = this.sourceDocument.createElement('span');
        this.appendChild(this.containerSpan);
        if (this.hasAttribute('multi-line')) {
            this.multiLine = true;
            this.input = this.sourceDocument.createElement('textarea');

            if (this.hasAttribute('auto-height')) {
                this.autoHeight = true;

                // Create an IntersectionObserver to initialize height once when made visible
                this.visibilityObserver = new IntersectionObserver((intersections) => {
                    for (let eachIntersect of intersections) {
                        if (eachIntersect.isIntersecting) {
                            this.ownUpdated = true;
                            this.update(null, null, null);
                            this.visibilityObserver.disconnect();
                            this.visibilityObserver = null;
                        }
                    }
                },
                    // Observe on document, notify when remotely shown (.1)
                    { root: null, rootMargin: '0px', threshold: .1 }
                );
                this.visibilityObserver.observe(this.input);
            }
        }
        else {
            this.input = this.sourceDocument.createElement('input');

            if (this.hasAttribute('numeric')) {
                this.numeric = true;
                this.input.type = 'number';
                if (!this.hasAttribute('float')) {
                    this.input.step = this.hasAttribute('step') ? this.getAttribute('step').valueOf() : '1';
                }
                if (this.hasAttribute('min')) {
                    this.min = parseFloat(this.getAttribute('min').valueOf());
                    this.input.min = `${this.min}`;
                }
                if (this.hasAttribute('max')) {
                    this.max = parseFloat(this.getAttribute('max').valueOf());
                    this.input.max = `${this.max}`;
                }
            }
            else {
                this.input.type = 'text';
            }
        }

        if (!this.numeric) {
            if (this.hasAttribute('maxlength')) {
                this.maxLength = parseInt(this.getAttribute('maxlength').valueOf()) || this.maxLength;
            }
            // A multiline input defaults to 1000 characters, single lines to 100
            this.maxLength = this.maxLength || (this.multiLine ? 1000 : 100);
            this.input.maxLength = this.maxLength;

            if (this.hasAttribute('placeholder')) {
                this.placeHolder =  this.getAttribute('placeholder').valueOf();
                this.placeHolderDiv = this.sourceDocument.createElement('div');
                this.placeHolderDiv.innerHTML = this.placeHolder;
                this.placeHolderDiv.setAttribute('placeholder', ''); // Expose an attribute that CSS can select for styling
                this.placeHolderDiv.setAttribute('disabled', '');
                this.placeHolderDiv.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.placeHolderDiv.setAttribute('disabled', '');
                    this.input.removeAttribute('disabled');
                    this.input.focus();
                });
                this.input.addEventListener('blur', () => {
                    if (!this.value && this.value !== 0) {
                        this.placeHolderDiv.removeAttribute('disabled');
                        this.input.setAttribute('disabled', '');
                    }
                });
                this.containerSpan.appendChild(this.placeHolderDiv);
            }
        }

        this.debounce = this.debounce || 25;
        if (this.hasAttribute('debounce')) {
            this.debounce = parseInt(this.getAttribute('debounce').valueOf()) || this.debounce;
        }

        this.containerSpan.appendChild(this.input);

        if (this.hasAttribute('value')) {
            this.input.value = `${this.getAttribute('value').valueOf()}`;
        }
        else {
            this.input.value = '';
        }

        if (this.hasAttribute('on-change')) {
            let onchangeAttribute = this.getAttribute('on-change').valueOf();
            if (onchangeAttribute) {
                let passThisValue = this.hasAttribute('pass-on-change') ? this.getAttribute('pass-on-change').valueOf() : null;
                this.changed = () => {
                    let parentTargetReference = ItemsObserver.GetParentTargetReference(onchangeAttribute);
                    if (typeof parentTargetReference.target === 'function') {
                        parentTargetReference.target.apply(parentTargetReference.parent, [ passThisValue || this.input.value ]);
                    }
                };
            }
        }

        if (this.hasAttribute('on-blur')) {
            let onblurAttribute = this.getAttribute('on-blur').valueOf();
            if (onblurAttribute) {
                let passThisValue = this.hasAttribute('pass-on-blur') ? this.getAttribute('pass-on-blur').valueOf() : null;
                this.input.addEventListener('blur', () => {
                    let parentTargetReference = ItemsObserver.GetParentTargetReference(onblurAttribute);
                    if (typeof parentTargetReference.target === 'function') {
                        parentTargetReference.target.apply(parentTargetReference.parent, [ passThisValue || this.input.value ]);
                    }
                });
            }
        }

        let oldInputValue: string | number, lastKeyPressed: number = 0;

        this.input.addEventListener('input', () => {
            let thisKeyPressed = performance.now();
            lastKeyPressed = thisKeyPressed;
            setTimeout(() => {
                if (thisKeyPressed === lastKeyPressed) {
                    if (oldInputValue !== this.value) {
                        this.validate();
                        oldInputValue = this.value;
                        // Trim textValue to maxLength
                        this.ownUpdated = true;
                        let ptr = ItemsObserver.GetParentTargetReference(this.observedTargetKey);
                        ptr.parent[ptr.targetName] = this.value;
                        if (this.changed) {
                            this.changed();
                        }
                    }
                }
            }, this.debounce);
        });

        super.connectedCallback();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    update(updated: any, key: string, value: any) {
        if (!this.ownUpdated) {
            if (this.placeHolderDiv && (!value && value !== 0)) {
                this.placeHolderDiv.removeAttribute('disabled');
                this.input.setAttribute('disabled', '');
            }
            this.value = value ? value : '';
            if (this.changed) {
                this.changed();
            }
        }
        this.ownUpdated = false;
        if (this.autoHeight) {
            if (this.input.clientHeight < this.input.scrollHeight) {
                this.input.style.height = `${this.input.scrollHeight}px`;
            }
        }
    }
}
