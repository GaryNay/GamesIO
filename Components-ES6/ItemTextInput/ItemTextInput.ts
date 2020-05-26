import { ItemsObserver } from "../mixins/ItemsObserver";
import { IItemTextInput } from "./IItemTextInput";

export class ItemTextInput extends ItemsObserver.extends(HTMLElement) {

    get value() {
        let self: IItemTextInput = <any>this;
        return self.input.value;
    }

    set value(value: string) {
        let self: IItemTextInput = <any>this;
        let setValue;
        if (!self.numeric && value && value.length > self.maxLength) {
            setValue = value.substr(0, self.maxLength);
        }
        if (self.numeric && parseFloat(value) < self.min) {
            setValue = self.min;
        }
        if (self.numeric && parseFloat(value) > self.max) {
            setValue = self.max;
        }
        self.input.value = `${setValue || value || ''}`;
    }

    validate() {
        // Pipe the value through the setter, Since validation happens there
        this.value = this.value;
    }

    constructor() {
        super();
    }

    connectedCallback() {
        let self: IItemTextInput = <any>this;

        if (self.hasAttribute('value-property')) {
            self.valueProperty = self.getAttribute('value-property').valueOf();
            self.semanticTargetKey = `${self.valueProperty}`;
        }

        self.sourceDocument = self.sourceDocument || document;
        self.containerSpan = self.sourceDocument.createElement('span');
        self.appendChild(self.containerSpan);
        if (self.hasAttribute('multi-line')) {
            self.multiLine = true;
            self.input = self.sourceDocument.createElement('textarea');

            if (self.hasAttribute('auto-height')) {
                self.autoHeight = true;

                // Create an IntersectionObserver to initialize height once when made visible
                self.visibilityObserver = new IntersectionObserver((intersections) => {
                    for (let eachIntersect of intersections) {
                        if (eachIntersect.isIntersecting) {
                            self.ownUpdated = true;
                            self.update(null, null, null);
                            self.visibilityObserver.disconnect();
                            self.visibilityObserver = null;
                        }
                    }
                },
                    // Observe on document, notify when remotely shown (.1)
                    { root: null, rootMargin: '0px', threshold: .1 }
                );
                self.visibilityObserver.observe(self.input);
            }
        }
        else {
            self.input = self.sourceDocument.createElement('input');

            if (self.hasAttribute('numeric')) {
                self.numeric = true;
                self.input.type = 'number';
                if (!self.hasAttribute('float')) {
                    self.input.step = self.hasAttribute('step') ? self.getAttribute('step').valueOf() : '1';
                }
                if (self.hasAttribute('min')) {
                    self.min = parseFloat(self.getAttribute('min').valueOf());
                    self.input.min = `${self.min}`;
                }
                if (self.hasAttribute('max')) {
                    self.max = parseFloat(self.getAttribute('max').valueOf());
                    self.input.max = `${self.max}`;
                }
            }
            else {
                self.input.type = 'text';
            }
        }

        if (!self.numeric) {
            if (self.hasAttribute('maxlength')) {
                self.maxLength = parseInt(self.getAttribute('maxlength').valueOf()) || self.maxLength;
            }
            // A multiline input defaults to 1000 characters, single lines to 100
            self.maxLength = self.maxLength || (self.multiLine ? 1000 : 100);
            self.input.maxLength = self.maxLength;

            if (self.hasAttribute('placeholder')) {
                self.placeHolder =  self.getAttribute('placeholder').valueOf();
                self.placeHolderDiv = self.sourceDocument.createElement('div');
                self.placeHolderDiv.innerHTML = self.placeHolder;
                self.placeHolderDiv.setAttribute('placeholder', ''); // Expose an attribute that CSS can select for styling
                self.placeHolderDiv.setAttribute('disabled', '');
                self.placeHolderDiv.addEventListener('click', (e) => {
                    e.preventDefault();
                    self.placeHolderDiv.setAttribute('disabled', '');
                    self.input.removeAttribute('disabled');
                    self.input.focus();
                });
                self.input.addEventListener('blur', () => {
                    if (!self.value && self.value !== 0) {
                        self.placeHolderDiv.removeAttribute('disabled');
                        self.input.setAttribute('disabled', '');
                    }
                });
                self.containerSpan.appendChild(self.placeHolderDiv);
            }
        }

        self.debounce = self.debounce || 25;
        if (self.hasAttribute('debounce')) {
            self.debounce = parseInt(self.getAttribute('debounce').valueOf()) || self.debounce;
        }

        self.containerSpan.appendChild(self.input);

        if (self.hasAttribute('value')) {
            self.input.value = `${self.getAttribute('value').valueOf()}`;
        }
        else {
            self.input.value = '';
        }

        if (self.hasAttribute('on-change')) {
            let onchangeAttribute = self.getAttribute('on-change').valueOf();
            if (onchangeAttribute) {
                let passThisValue = self.hasAttribute('pass-on-change') ? self.getAttribute('pass-on-change').valueOf() : null;
                self.changed = () => {
                    let parentTargetReference = ItemsObserver.getParentTargetReference(onchangeAttribute);
                    if (typeof parentTargetReference.target === 'function') {
                        parentTargetReference.target.apply(parentTargetReference.parent, [ passThisValue || self.input.value ]);
                    }
                };
            }
        }

        if (self.hasAttribute('on-blur')) {
            let onblurAttribute = self.getAttribute('on-blur').valueOf();
            if (onblurAttribute) {
                let passThisValue = self.hasAttribute('pass-on-blur') ? self.getAttribute('pass-on-blur').valueOf() : null;
                self.input.addEventListener('blur', () => {
                    let parentTargetReference = ItemsObserver.getParentTargetReference(onblurAttribute);
                    if (typeof parentTargetReference.target === 'function') {
                        parentTargetReference.target.apply(parentTargetReference.parent, [ passThisValue || self.input.value ]);
                    }
                });
            }
        }

        let oldInputValue: string | number, lastKeyPressed: number = 0;

        self.input.addEventListener('input', () => {
            let thisKeyPressed = performance.now();
            lastKeyPressed = thisKeyPressed;
            setTimeout(() => {
                if (thisKeyPressed === lastKeyPressed) {
                    if (oldInputValue !== self.value) {
                        self.validate();
                        oldInputValue = self.value;
                        // Trim textValue to maxLength
                        self.ownUpdated = true;
                        let ptr = ItemsObserver.getParentTargetReference(self.observedTargetKey);
                        ptr.parent[ptr.targetName] = self.value;
                        if (self.changed) {
                            self.changed();
                        }
                    }
                }
            }, self.debounce);
        });

        ItemsObserver.connectedCallback.apply(self);
    }

    disconnectedCallback() {
        let self: IItemTextInput = <any>this;
        ItemsObserver.disconnectedCallback.apply(self);
    }

    update(updated: any, key: string, value: any) {
        let self: IItemTextInput = <any>this;
        if (!self.ownUpdated) {
            if (self.placeHolderDiv && (!value && value !== 0)) {
                self.placeHolderDiv.removeAttribute('disabled');
                self.input.setAttribute('disabled', '');
            }
            self.value = value ? value : '';
            if (self.changed) {
                self.changed();
            }
        }
        self.ownUpdated = false;
        if (self.autoHeight) {
            if (self.input.clientHeight < self.input.scrollHeight) {
                self.input.style.height = `${self.input.scrollHeight}px`;
            }
        }
    }
}
