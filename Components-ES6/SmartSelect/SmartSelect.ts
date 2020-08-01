import { ItemsObserver } from "../mixins/ItemsObserver.js";
import { ISmartSelect } from "./ISmartSelect";

/** Only behaves as standard select when more than 1 option is available */
export class SmartSelect extends ItemsObserver.extends(HTMLElement) implements ISmartSelect {
    sourceDocument: HTMLDocument;
    containerSpan: HTMLSpanElement;
    span: HTMLSpanElement;
    select: HTMLSelectElement;

    displayProperty: string;
    valueProperty: string;
    bindToKey: string;
    bindToProperty: string;
    updateBinding: boolean;

    optionItems: any[];
    selected: () => void;

    get value() {
        let itemIndex = 0;
        if (this.optionItems.length > 1) {
            itemIndex = parseInt(this.select.selectedOptions[0].value) || 0;
        }
        if (this.valueProperty) {
            return this.optionItems[itemIndex][this.valueProperty];
        }
        return this.optionItems[itemIndex];
    }

    get option() {
        let itemIndex = 0;
        if (!this.optionItems || !this.optionItems.length) {
            return null;
        }
        if (this.optionItems.length > 1) {
            itemIndex = parseInt(this.select.selectedOptions[0].value) || 0;
        }
        return this.optionItems[itemIndex];
    }

    constructor() {
        super();
    }

    clicked() {
        if (this.bindToKey && this.updateBinding) {
            let ptr = ItemsObserver.GetParentTargetReference(this.bindToKey);
            if (ptr.target && this.bindToProperty) {
                ptr.target[this.bindToProperty] = this.value;
            }
            else {
                ptr.parent[ptr.targetName] = this.value;
            }
            this.updateBinding = false;
        }
        if (this.selected) {
            this.selected();
        }
    }

    connectedCallback() {
        this.sourceDocument = this.sourceDocument || document;
        this.containerSpan = this.sourceDocument.createElement('span');
        this.appendChild(this.containerSpan);
        this.select = this.sourceDocument.createElement('select');
        this.select.setAttribute('disabled', '');
        this.containerSpan.appendChild(this.select);
        this.span = this.sourceDocument.createElement('span');
        this.span.setAttribute('disabled', '');
        this.containerSpan.appendChild(this.span);

        if (this.hasAttribute('on-select')) {
            let onselectattribute = this.getAttribute('on-select').valueOf();
            if (onselectattribute) {
                let passThisValue = this.hasAttribute('pass-on-select') ? this.getAttribute('pass-on-select').valueOf() : null;
                this.selected = () => {
                    let parentTargetReference = ItemsObserver.GetParentTargetReference(onselectattribute);
                    if (typeof parentTargetReference.target === 'function') {
                        if ((<any>this.optionItems).length > 1) {
                            let selectedIndex = this.select.selectedIndex;
                            if (selectedIndex >= 0) {
                                parentTargetReference.target.apply(parentTargetReference.parent, [ passThisValue || this.optionItems[selectedIndex] ]);
                            }
                        }
                        else {
                            parentTargetReference.target.apply(parentTargetReference.parent, [ passThisValue || this.optionItems[0] ]);
                        }
                    }
                };
            }
        }

        if (!this.hasAttribute('allow-bubbling')) {
            this.select.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        this.select.addEventListener('change', (e) => {
            this.updateBinding = true;
            this.clicked();
        });

        if (this.hasAttribute('display-property')) {
            this.displayProperty = this.getAttribute('display-property').valueOf();
        }

        if (this.hasAttribute('value-property')) {
            this.valueProperty = this.getAttribute('value-property').valueOf();
        }

        super.connectedCallback();

        if (this.hasAttribute('bind-to')) {
            this.bindToKey = this.getAttribute('bind-to').valueOf();
            if (this.hasAttribute('bind-to-property')) {
                this.bindToProperty = this.getAttribute('bind-to-property');
            }
            let boundKey = `${this.bindToKey}${this.bindToProperty ? `.${this.bindToProperty}` : ''}`.replace('[', '.').replace(']', '');
            let boundProperty = this.addObservedKey(boundKey);
            if (!this.bindToProperty)
                this.bindToProperty = boundProperty;
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    update(updated: any, key: string, value: any) {
        if (key === this.bindToProperty) {
            this.updateBinding = false;
            this.selectOptionByValue(value);
            return;
        }

        if (!value || Array.isArray(value)) {
            // Either removed or written entire items array
            this.updateOptions();
            return;
        }

    }

    selectOptionByValue(optionValue: any, suppressClick?: boolean) {
        if (this.select.options && this.select.options.length) {
            for (let eachOptionIndex = 0; eachOptionIndex < this.select.options.length; eachOptionIndex++) {
                if (this.optionItems[this.select.options[eachOptionIndex].value][this.valueProperty] === optionValue) {
                    return this.selectOption(eachOptionIndex, suppressClick);
                }
            }
            // optionValue does not exist in the valid options
            this.updateBinding = true;
            return this.selectOption(0, suppressClick);
        }
        else {
            if (this.optionItems && this.optionItems.length === 1) {
                if (this.valueProperty) {
                    if (this.optionItems[0][this.valueProperty] === optionValue) {
                        return this.selectOption(0, suppressClick);
                    }
                }
                else {
                    if (this.optionItems[0] === optionValue) {
                        return this.selectOption(0, suppressClick);
                    }
                }
                this.updateBinding = true;
                return this.selectOption(0, suppressClick);
            }
        }
    }

    selectOption(optionIndex, suppressClick?: boolean) {
        if (this.optionItems && (<any>this.optionItems).length) {
            if ((<any>this.optionItems).length > 1) {
                this.select.options.selectedIndex = optionIndex;
            }
            if (!suppressClick) {
                this.clicked();
            }
        }
        this.updateBinding = false;
    }

    updateOptions() {
        this.optionItems = ItemsObserver.GetParentTargetReference(this.observedTargetKey).target;
        if (this.optionItems && (<any>this.optionItems).length) {
            if ((<any>this.optionItems).length > 1) {
                // Disable span and use select with multiple options
                this.setAttribute('selectable', '');
                this.span.setAttribute('disabled', '');
                this.select.removeAttribute('disabled');
                this.select.innerHTML = '';
                for (let eachOptionDataIndex = 0; eachOptionDataIndex < this.optionItems.length; eachOptionDataIndex++) {
                    let eachOptionData = this.optionItems[eachOptionDataIndex];
                    let option: HTMLOptionElement = this.sourceDocument.createElement('option');
                    option.text = this.displayProperty ? eachOptionData[this.displayProperty] : eachOptionData.toString();
                    option.value = `${eachOptionDataIndex}`;
                    this.select.appendChild(option);
                }
            }
            else {
                // Disable select and use span for one option text
                this.removeAttribute('selectable');
                this.select.setAttribute('disabled', '');
                this.span.removeAttribute('disabled');
                this.span.innerHTML = this.displayProperty ? this.optionItems[0][this.displayProperty] : this.optionItems[0].toString();
                this.select.innerHTML = '';
            }
            if (this.bindToKey) {
                let ptr = ItemsObserver.GetParentTargetReference(this.bindToKey);
                if (ptr.target) {
                    if (this.bindToProperty) {
                        if (ptr.target[this.bindToProperty]) {
                            this.selectOptionByValue(ptr.target[this.bindToProperty]);
                        }
                        else {
                            // bound value has not been set, update it
                            this.updateBinding = true;
                            this.selectOption(0);
                        }
                    }
                    else {
                        this.selectOptionByValue(ptr.target);
                    }
                }
                else {
                    if (!this.bindToProperty) {
                        // bound value has not been set, update it
                        this.updateBinding = true;
                        this.selectOption(0);
                    }
                }
            }
            else {
                this.selectOption(0);
            }
        }
        else {
            this.removeAttribute('selectable');
            this.span.setAttribute('disabled', '');
            this.select.setAttribute('disabled', '');
        }
    }
}
