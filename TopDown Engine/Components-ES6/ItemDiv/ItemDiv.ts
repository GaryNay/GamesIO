import { ItemsObserver } from "../Mixins/ItemsObserver";
import { IItemDiv } from "./IItemDiv";

export class ItemDiv extends ItemsObserver.extends(HTMLElement) {

    constructor() {
        super();
    }

    connectedCallback() {
        let self: IItemDiv = <any>this;

        self.sourceDocument = self.sourceDocument || document;
        self.containerSpan = self.sourceDocument.createElement('span');
        self.appendChild(self.containerSpan);

        if (self.hasAttribute('on-click')) {
            let onclickAttribute = self.getAttribute('on-click').valueOf();
            let passThisValue = self.hasAttribute('pass-on-click') ? self.getAttribute('pass-on-click').valueOf() : null;
            self.clicked = () => {
                let clickPTR = ItemsObserver.getParentTargetReference(onclickAttribute);
                if (typeof clickPTR.target === 'function') {
                    let itemPTR = ItemsObserver.getParentTargetReference(self.defaultTargetKey);
                    clickPTR.target.apply(clickPTR.parent, [passThisValue || itemPTR.target]);
                }
            };
            self.containerSpan.addEventListener('click', (e) => {
                self.clicked();
            });
        }

        if (self.hasAttribute('display-property')) {
            self.displayProperty = self.getAttribute('display-property').valueOf();
            self.semanticTargetKey = `${self.displayProperty}`;
        }

        if (self.hasAttribute('alt-display-property')) {
            // Use this property of the observation target to show as value
            self.altDisplayProperty = self.getAttribute('alt-display-property').valueOf();
        }

        if (self.hasAttribute('currency')) {
            // Format the value to appear as currency
            self.formatType = 'currency';
        }
        else if (self.hasAttribute('date')) {
            // Format the value to appear as a date
            self.formatType = 'date';
        }
        else if (self.hasAttribute('phone')) {
            self.formatType = 'phone';
        }

        if (self.hasAttribute('format-regex') && self.hasAttribute('format-replace')) {
            // User has supplied regex
            self.formatRegex = self.getAttribute('format-regex').valueOf();
            self.formatReplace = self.getAttribute('format-replace').valueOf();
        }

        if (self.hasAttribute('format-callback')) {
            // User has supplied a custom callback
            self.formatCallback = ItemsObserver.getParentTargetReference(self.getAttribute('format-callback').valueOf()).target;
        }

        ItemsObserver.connectedCallback.apply(self);
    }

    disconnectedCallback() {
        let self: IItemDiv = <any>this;
        ItemsObserver.disconnectedCallback.apply(self);
    }

    update(updated?: any, key?: string | number, value?: any) {
        let self: IItemDiv = <any>this;
        if (self.containerSpan) {
            let outValue: string;
            if (self.altDisplayProperty) {
                outValue = value[self.altDisplayProperty];
            }
            else {
                outValue = value;
            }

            if (self.formatType === 'currency') {
                if (parseFloat(outValue) !== NaN) {
                    outValue = `$${parseFloat(outValue).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
                }
                else {
                    outValue = '-';
                }
            }
            else if (self.formatType === 'date') {
                if (Date.parse(outValue) !== NaN) {
                    let dateString = new Date(outValue).toISOString();
                    outValue = `${dateString.substr(5, 2)}-${dateString.substr(8, 2)}-${dateString.substr(0, 4)}`;
                }
                else {
                    outValue = '-';
                }
            }
            else if (self.formatType === 'phone') {
                if (parseInt(outValue) !== NaN) {
                    outValue = outValue.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
                }
                {
                    outValue = '-';
                }
            }

            if (self.formatRegex && self.formatReplace) {
                outValue = (outValue || '').replace(new RegExp(self.formatRegex), self.formatReplace);
            }
            if (self.formatCallback) {
                outValue = self.formatCallback(outValue);
            }

            self.containerSpan.innerText = (outValue || '').toString();
        }
    }
}
