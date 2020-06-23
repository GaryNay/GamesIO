import { ItemsObserver } from "../mixins/ItemsObserver.js";
import { IItemDiv } from "./IItemDiv";

export class ItemDiv extends ItemsObserver.extends(HTMLElement) implements IItemDiv {
    sourceDocument: Document;

    containerSpan?: HTMLSpanElement;
    clicked: () => void;
    displayProperty: string;
    altDisplayProperty: string;
    formatType: 'currency' | 'date' | 'phone';
    formatRegex: string;
    formatReplace: string;
    formatCallback: (input: string) => string;

    constructor() {
        super();
    }

    connectedCallback() {

        this.sourceDocument = this.sourceDocument || document;

        if (this.hasAttribute('on-click')) {
            let onclickAttribute = this.getAttribute('on-click').valueOf();
            let passThisValue = this.hasAttribute('pass-on-click') ? this.getAttribute('pass-on-click').valueOf() : null;
            this.clicked = () => {
                let clickPTR = ItemsObserver.GetParentTargetReference(onclickAttribute);
                if (typeof clickPTR.target === 'function') {
                    let itemPTR = ItemsObserver.GetParentTargetReference(this.defaultTargetKey);
                    clickPTR.target.apply(clickPTR.parent, [passThisValue || itemPTR.target]);
                }
            };
            this.addEventListener('click', (e) => {
                this.clicked();
            });
        }

        if (this.hasAttribute('display-property')) {
            this.displayProperty = this.getAttribute('display-property').valueOf();
            this.semanticTargetKey = `${this.displayProperty}`;
        }

        if (this.hasAttribute('alt-display-property')) {
            // Use this property of the observation target to show as value
            this.altDisplayProperty = this.getAttribute('alt-display-property').valueOf();
        }

        if (this.hasAttribute('currency')) {
            // Format the value to appear as currency
            this.formatType = 'currency';
        }
        else if (this.hasAttribute('date')) {
            // Format the value to appear as a date
            this.formatType = 'date';
        }
        else if (this.hasAttribute('phone')) {
            this.formatType = 'phone';
        }

        if (this.hasAttribute('format-regex') && this.hasAttribute('format-replace')) {
            // User has supplied regex
            this.formatRegex = this.getAttribute('format-regex').valueOf();
            this.formatReplace = this.getAttribute('format-replace').valueOf();
        }

        if (this.hasAttribute('format-callback')) {
            // User has supplied a custom callback
            this.formatCallback = ItemsObserver.GetParentTargetReference(this.getAttribute('format-callback').valueOf()).target;
        }

        super.connectedCallback();

        if (this.childElementCount) {
            for (let eachChild of this.children) {
                if (eachChild.hasAttribute('item-target')) {
                    this.containerSpan = eachChild as HTMLSpanElement;
                    break;
                }
            }
        }

        if (this.hasAttribute('json')) {
            try {
                let str = this.getAttribute('json').valueOf();
                this.update(null, null, JSON.parse(str.replace(/'/g, '"')));
            }
            catch (e) {
            }
        }

        if (this.hasAttribute('value')) {
            this.update(null, null, this.getAttribute('value').valueOf());
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    update(updated?: any, key?: string | number, value?: any) {
        let outValue: string;
        if (this.altDisplayProperty) {
            outValue = value[this.altDisplayProperty];
        }
        else {
            outValue = value;
        }

        if (this.formatType === 'currency') {
            if (parseFloat(outValue) !== NaN) {
                outValue = `$${parseFloat(outValue).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
            }
            else {
                outValue = '-';
            }
        }
        else if (this.formatType === 'date') {
            if (Date.parse(outValue) !== NaN) {
                let dateString = new Date(outValue).toISOString();
                outValue = `${dateString.substr(5, 2)}-${dateString.substr(8, 2)}-${dateString.substr(0, 4)}`;
            }
            else {
                outValue = '-';
            }
        }
        else if (this.formatType === 'phone') {
            if (parseInt(outValue) !== NaN) {
                outValue = outValue.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
            }
            {
                outValue = '-';
            }
        }

        if (this.formatRegex && this.formatReplace) {
            outValue = (outValue || '').replace(new RegExp(this.formatRegex), this.formatReplace);
        }
        if (this.formatCallback) {
            outValue = this.formatCallback(outValue);
        }

        if (this.containerSpan) {
            this.containerSpan.innerText = (outValue || '').toString();
        }
        else {
            this.innerText = (outValue || '').toString();
        }
    }
}
