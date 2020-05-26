import { ItemsObserver } from "../mixins/ItemsObserver";
import { ISmartSelect } from "./ISmartSelect";

/** Only behaves as standard select when more than 1 option is available */
export class SmartSelect extends ItemsObserver.extends(HTMLElement) {

    get value() {
        let self: ISmartSelect = <any>this;
        let itemIndex = 0;
        if (self.optionItems.length > 1) {
            itemIndex = parseInt(self.select.selectedOptions[0].value) || 0;
        }
        if (self.valueProperty) {
            return self.optionItems[itemIndex][self.valueProperty];
        }
        return self.optionItems[itemIndex];
    }

    get option() {
        let self: ISmartSelect = <any>this;
        let itemIndex = 0;
        if (!self.optionItems || !self.optionItems.length) {
            return null;
        }
        if (self.optionItems.length > 1) {
            itemIndex = parseInt(self.select.selectedOptions[0].value) || 0;
        }
        return self.optionItems[itemIndex];
    }

    constructor() {
        super();
    }

    clicked() {
        let self: ISmartSelect = <any>this;
        if (self.bindToKey && self.updateBinding) {
            let ptr = ItemsObserver.getParentTargetReference(self.bindToKey);
            if (ptr.target && self.bindToProperty) {
                ptr.target[self.bindToProperty] = self.value;
            }
            else {
                ptr.parent[ptr.targetName] = self.value;
            }
            self.updateBinding = false;
        }
        if (self.selected) {
            self.selected();
        }
    }

    connectedCallback() {
        let self: ISmartSelect = <any>this;
        self.sourceDocument = self.sourceDocument || document;
        self.containerSpan = self.sourceDocument.createElement('span');
        self.appendChild(self.containerSpan);
        self.select = self.sourceDocument.createElement('select');
        self.select.setAttribute('disabled', '');
        self.containerSpan.appendChild(self.select);
        self.span = self.sourceDocument.createElement('span');
        self.span.setAttribute('disabled', '');
        self.containerSpan.appendChild(self.span);

        if (self.hasAttribute('on-select')) {
            let onselectattribute = self.getAttribute('on-select').valueOf();
            if (onselectattribute) {
                let passThisValue = self.hasAttribute('pass-on-select') ? self.getAttribute('pass-on-select').valueOf() : null;
                self.selected = () => {
                    let parentTargetReference = ItemsObserver.getParentTargetReference(onselectattribute);
                    if (typeof parentTargetReference.target === 'function') {
                        if ((<any>self.optionItems).length > 1) {
                            let selectedIndex = self.select.selectedIndex;
                            if (selectedIndex >= 0) {
                                parentTargetReference.target.apply(parentTargetReference.parent, [ passThisValue || self.optionItems[selectedIndex] ]);
                            }
                        }
                        else {
                            parentTargetReference.target.apply(parentTargetReference.parent, [ passThisValue || self.optionItems[0] ]);
                        }
                    }
                };
            }
        }

        if (!self.hasAttribute('allow-bubbling')) {
            self.select.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        self.select.addEventListener('change', (e) => {
            self.updateBinding = true;
            self.clicked();
        });

        if (self.hasAttribute('display-property')) {
            self.displayProperty = self.getAttribute('display-property').valueOf();
        }

        if (self.hasAttribute('value-property')) {
            self.valueProperty = self.getAttribute('value-property').valueOf();
        }

        ItemsObserver.connectedCallback.apply(self);

        if (self.hasAttribute('bind-to')) {
            self.bindToKey = self.getAttribute('bind-to').valueOf();
            if (self.hasAttribute('bind-to-property')) {
                self.bindToProperty = self.getAttribute('bind-to-property');
            }
            let boundKey = `${self.bindToKey}${self.bindToProperty ? `.${self.bindToProperty}` : ''}`.replace('[', '.').replace(']', '');
            let boundProperty = self.addObservedKey(boundKey);
            if (!self.bindToProperty)
                self.bindToProperty = boundProperty;
        }
    }

    disconnectedCallback() {
        let self: ISmartSelect = <any>this;
        ItemsObserver.disconnectedCallback.apply(self);
    }

    update(updated: any, key: string, value: any) {
        let self: ISmartSelect = <any>this;

        if (key === self.bindToProperty) {
            self.updateBinding = false;
            self.selectOptionByValue(value);
            return;
        }

        if (!value || Array.isArray(value)) {
            // Either removed or written entire items array
            self.updateOptions();
            return;
        }

    }

    selectOptionByValue(optionValue: any, suppressClick?: boolean) {
        let self: ISmartSelect = <any>this;
        if (self.select.options && self.select.options.length) {
            for (let eachOptionIndex = 0; eachOptionIndex < self.select.options.length; eachOptionIndex++) {
                if (self.optionItems[self.select.options[eachOptionIndex].value][self.valueProperty] === optionValue) {
                    return self.selectOption(eachOptionIndex, suppressClick);
                }
            }
            // optionValue does not exist in the valid options
            self.updateBinding = true;
            return self.selectOption(0, suppressClick);
        }
        else {
            if (self.optionItems && self.optionItems.length === 1) {
                if (self.valueProperty) {
                    if (self.optionItems[0][self.valueProperty] === optionValue) {
                        return self.selectOption(0, suppressClick);
                    }
                }
                else {
                    if (self.optionItems[0] === optionValue) {
                        return self.selectOption(0, suppressClick);
                    }
                }
                self.updateBinding = true;
                return self.selectOption(0, suppressClick);
            }
        }
    }

    selectOption(optionIndex, suppressClick?: boolean) {
        let self: ISmartSelect = <any>this;
        if (self.optionItems && (<any>self.optionItems).length) {
            if ((<any>self.optionItems).length > 1) {
                self.select.options.selectedIndex = optionIndex;
            }
            if (!suppressClick) {
                self.clicked();
            }
        }
        self.updateBinding = false;
    }

    updateOptions() {
        let self: ISmartSelect = <any>this;
        self.optionItems = ItemsObserver.getParentTargetReference(self.observedTargetKey).target;
        if (self.optionItems && (<any>self.optionItems).length) {
            if ((<any>self.optionItems).length > 1) {
                // Disable span and use select with multiple options
                self.setAttribute('selectable', '');
                self.span.setAttribute('disabled', '');
                self.select.removeAttribute('disabled');
                self.select.innerHTML = '';
                for (let eachOptionDataIndex = 0; eachOptionDataIndex < self.optionItems.length; eachOptionDataIndex++) {
                    let eachOptionData = self.optionItems[eachOptionDataIndex];
                    let option: HTMLOptionElement = self.sourceDocument.createElement('option');
                    option.text = self.displayProperty ? eachOptionData[self.displayProperty] : eachOptionData.toString();
                    option.value = `${eachOptionDataIndex}`;
                    self.select.appendChild(option);
                }
            }
            else {
                // Disable select and use span for one option text
                self.removeAttribute('selectable');
                self.select.setAttribute('disabled', '');
                self.span.removeAttribute('disabled');
                self.span.innerHTML = self.displayProperty ? self.optionItems[0][self.displayProperty] : self.optionItems[0].toString();
                self.select.innerHTML = '';
            }
            if (self.bindToKey) {
                let ptr = ItemsObserver.getParentTargetReference(self.bindToKey);
                if (ptr.target) {
                    if (self.bindToProperty) {
                        if (ptr.target[self.bindToProperty]) {
                            self.selectOptionByValue(ptr.target[self.bindToProperty]);
                        }
                        else {
                            // bound value has not been set, update it
                            self.updateBinding = true;
                            self.selectOption(0);
                        }
                    }
                    else {
                        self.selectOptionByValue(ptr.target);
                    }
                }
                else {
                    if (!self.bindToProperty) {
                        // bound value has not been set, update it
                        self.updateBinding = true;
                        self.selectOption(0);
                    }
                }
            }
            else {
                self.selectOption(0);
            }
        }
        else {
            self.removeAttribute('selectable');
            self.span.setAttribute('disabled', '');
            self.select.setAttribute('disabled', '');
        }
    }
}
