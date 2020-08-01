import { CustomHTMLElement } from "../CustomHTMLElement";
import { IAttributes, AttributeElement } from "./IAttributes";

interface Constructor<T> {
    new (): T;
}

export class Attributes {
    static TemplateStrings: <Inherited>(sClass: Constructor<Inherited>) => Constructor<Inherited & AttributeElement> = <any>((superclass: Constructor<CustomHTMLElement>) => class extends superclass implements IAttributes {
        executeAttributeTemplatesOnConnect: boolean;

        connectedCallback() {
            if (this.executeAttributeTemplatesOnConnect !== false) {
                this.executeAttributeTemplates();
            }

            super.connectedCallback && super.connectedCallback();
        }
    
        disconnectedCallback() {
            super.disconnectedCallback && super.disconnectedCallback();
        }
        returnExecutedString(value: string) {
            let openerIndex = -1;
            do {
                openerIndex = value.indexOf('${');
                if (openerIndex > -1) {
                    let closerIndex = value.indexOf('}', openerIndex);
                    if (closerIndex > -1) {
                        let leftSide = value.substr(0, openerIndex);
                        let rightSide = value.substr(closerIndex + 1);
                        let expression = value.substr(openerIndex + 2, closerIndex - openerIndex - 2);
                        try {
                            let setValue = `${ leftSide }${ new Function(`return ${ expression };`)() }${ rightSide }`;
                            value = setValue;
                        }
                        catch (e) {
                            break;
                        }
                    }
                }
            } while (openerIndex > -1);
            return value;
        };
        executeAttributeTemplates(attributeName?: string) {
            for (let eachAttributeName of attributeName ? [ attributeName ] : this.getAttributeNames()) {
                let eachAttribute = this.getAttribute(eachAttributeName);
                this.setAttribute(eachAttributeName, this.returnExecutedString(eachAttribute.valueOf()));
            }
        }
    })
}
