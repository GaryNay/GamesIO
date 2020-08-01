import { IItemSelector, ItemSelectorElement } from "./IItemSelector";
import { CustomHTMLElement } from "../CustomHTMLElement";

interface Constructor<T> {
    new (): T;
}

export class ItemSelector {

    static extends: <Inherited>(sClass: Constructor<Inherited>) => Constructor<Inherited & ItemSelectorElement> = <any>((superclass: Constructor<CustomHTMLElement>) => class extends superclass implements IItemSelector {
        sourceDocument: HTMLDocument;
        containerSpan: HTMLSpanElement;
        img: HTMLImageElement;

        get checked() {
            return this.hasAttribute('checked');
        }

        set checked(val) {
            if (val && !this.hasAttribute('checked')) {
                this.setAttribute('checked', '');
                this.changed();
            }
            else if (!val && this.hasAttribute('checked')) {
                this.removeAttribute('checked');
                this.changed();
            }
        }

        changed(forceCheckedTo?: boolean) {
        }

        connectedCallback() {
            super.connectedCallback && super.connectedCallback();

            this.sourceDocument = this.sourceDocument || document;
            this.containerSpan = this.sourceDocument.createElement('span');
    
            this.addEventListener('click', () => {
                this.checked = this.checked ? false : true;
            });
    
            if (this.hasAttribute('img-src')) {
                let src = this.getAttribute('img-src').valueOf();
                if (src) {
                    this.img = this.sourceDocument.createElement('img');
                    this.img.src = src;
                    this.containerSpan.appendChild(this.img);
                }
            }
    
            this.appendChild(this.containerSpan);
    
            if (this.hasAttribute('checked')) {
                this.checked = true;
            }
    
            this.changed();
        }

        disconnectedCallback() {
            super.disconnectedCallback && super.disconnectedCallback();
        }
    })
}
