import { CustomHTMLElement } from "../CustomHTMLElement";
import { BlankMixinElement, IBlankMixin } from "./IBlankMixin";

interface Constructor<T> {
    new (): T;
}

export class BlankMixin {


    static extends: <Inherited>(sClass: Constructor<Inherited>) => Constructor<Inherited & BlankMixinElement> = <any>((superclass: Constructor<CustomHTMLElement>) => class extends superclass implements IBlankMixin {
        connectedCallback() {
            super.connectedCallback && super.connectedCallback();
        }
    
        disconnectedCallback() {
            super.disconnectedCallback && super.disconnectedCallback();
        }
    })
}
