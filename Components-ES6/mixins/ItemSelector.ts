import { IItemSelector } from "./IItemSelector";

export class ItemSelector {

    static connectedCallback() {
        let self: IItemSelector & HTMLElement = <any>this;
        self.sourceDocument = self.sourceDocument || document;
        self.containerSpan = self.sourceDocument.createElement('span');

        self.addEventListener('click', () => {
            self.checked = self.checked ? false : true;
        });

        if (self.hasAttribute('img-src')) {
            let src = self.getAttribute('img-src').valueOf();
            if (src) {
                self.img = self.sourceDocument.createElement('img');
                self.img.src = src;
                self.containerSpan.appendChild(self.img);
            }
        }

        self.appendChild(self.containerSpan);

        if (self.hasAttribute('checked')) {
            self.checked = true;
        }

        self.changed();
    }

    static disconnectedCallback() {
        let self: IItemSelector & HTMLElement = <any>this;
    }

    static extends = (superclass) => class extends superclass implements IItemSelector {
        sourceDocument: HTMLDocument;
        containerSpan: HTMLSpanElement;
        img: HTMLImageElement;

        get checked() {
            let self: IItemSelector & HTMLElement = <any>this;
            return self.hasAttribute('checked');
        }

        set checked(val) {
            let self: IItemSelector & HTMLElement = <any>this;
            if (val && !self.hasAttribute('checked')) {
                self.setAttribute('checked', '');
                self.changed();
            }
            else if (!val && self.hasAttribute('checked')) {
                self.removeAttribute('checked');
                self.changed();
            }
        }

        changed(forceCheckedTo?: boolean) {
        }
    }
}
