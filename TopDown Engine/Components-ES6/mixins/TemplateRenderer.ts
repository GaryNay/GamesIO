import { ITemplateRenderer } from "./ITemplateRenderer";

export class TemplateRenderer {

    static SetTemplate(self: ITemplateRenderer & HTMLElement) {
        self.templateCollection = <any>self.getElementsByTagName('template') as HTMLTemplateElement[];
    }

    static RenderTemplate(template: HTMLTemplateElement, parentElement: Element = document.body, renderBeforeElement?: Element, sourceDocument = document) {
        TemplateRenderer.RenderElementCollection(
            TemplateRenderer.ImportChildren(template.content.childNodes, {}, sourceDocument),
            parentElement,
            renderBeforeElement,
            sourceDocument
        );
    }

    static RenderElementCollection(nodes, parentElement: Element = document.body, renderBeforeElement?: Element, sourceDocument = document) {
        for (let eachElementIndex = 0; eachElementIndex < nodes.length; eachElementIndex++) {
            if (renderBeforeElement) {
                parentElement.insertBefore(nodes[eachElementIndex], renderBeforeElement);
                continue;
            }
            parentElement.appendChild(nodes[eachElementIndex]);
        }
    }

    static ImportChildren(templateChildren: HTMLCollection | NodeList | Node[], aliasObject: { [aliasName: string]: string; }, sourceDocument = document): Node[] {
        let rendered: Node[] = [];
        for (let eachTemplateChildIndex = 0; eachTemplateChildIndex < templateChildren.length; eachTemplateChildIndex++) {
            let eachTemplateChildElement = templateChildren[eachTemplateChildIndex];
            // Dont deep copy here so we can do our own recursive import, with bindings along the way
            let importedNode = sourceDocument.importNode(eachTemplateChildElement, false) as HTMLElement;
            if ((<HTMLTemplateElement>eachTemplateChildElement).content) {
                // Dont manually recursively import children of a benign template,
                //  instead copy the innerHTML
                importedNode.innerHTML = (<HTMLTemplateElement>eachTemplateChildElement).innerHTML;
            }
            else {
                importedNode.nodeValue = eachTemplateChildElement.nodeValue;
                TemplateRenderer.BindAttributeValues(importedNode, aliasObject);
                let nodes = eachTemplateChildElement.childNodes;
                // Iterate, import, and append children recursively
                if (nodes && nodes.length) {
                    let children = TemplateRenderer.ImportChildren(eachTemplateChildElement.childNodes, aliasObject, sourceDocument);
                    for (let eachTemplateChildEachChildIndex = 0; eachTemplateChildEachChildIndex < children.length; eachTemplateChildEachChildIndex++) {
                        importedNode.appendChild(children[eachTemplateChildEachChildIndex]);
                    }
                }
            }

            rendered[eachTemplateChildIndex] = importedNode;
        }
        return rendered;
    }

    /** Replaces attribute values to be bound by {{}} found within supplied aliasObject{} */
    static BindAttributeValues(element: Element, aliasObject: { [aliasName: string]: any }) {
        let elementAttributes = element.attributes;
        if (!elementAttributes || !elementAttributes.length) {
            return;
        }
        for (let eachAttributeIndex = 0; eachAttributeIndex < elementAttributes.length; eachAttributeIndex++) {
            let eachAttribute = elementAttributes[eachAttributeIndex];
            // Returns "{{foo}}" as an array like: [ "{{foo}}", "foo" ] to allow for easy replacement, or null when no matches are present
            let matchesToBind = eachAttribute.value.match(/\{\{([^)]+)\}\}/);
            if (matchesToBind) {
                if (typeof aliasObject[matchesToBind[1]] === 'string') {
                    eachAttribute.value = eachAttribute.value.replace(matchesToBind[0], aliasObject[matchesToBind[1]]);
                }
                else {
                    element[eachAttribute.name] = aliasObject[matchesToBind[1]];
                }
            }
        }
    }

    static connectedCallback() {
        let self: ITemplateRenderer & HTMLElement = <any>this;
        self.sourceDocument = self.sourceDocument || document;
    }

    static disconnectedCallback() {
        return;
    }

    static extends = (superclass) => class extends superclass implements ITemplateRenderer {

        sourceDocument: Document;
        templateCollection: HTMLTemplateElement[];

        importBoundTemplate(aliasObject: { [aliasName: string]: any }, whichTemplate?): Node[] {
            let self: ITemplateRenderer & HTMLElement = <any>this;
            if (!self.templateCollection) {
                TemplateRenderer.SetTemplate(self);
            }
            let templateIndex: number = (typeof whichTemplate === 'number') ? whichTemplate
                : (() => {
                    if (typeof whichTemplate === 'string') {
                        // Find the attribute marked template
                        for (let eachTemplateIndex = 0; eachTemplateIndex < self.templateCollection.length; eachTemplateIndex++) {
                            if (self.templateCollection[eachTemplateIndex].hasAttribute(whichTemplate)) {
                                return eachTemplateIndex;
                            }
                        }
                    }
                    return null;
                })();

            if (!self.templateCollection[templateIndex]) {
                // Consider throw here
                return null;
            }
            return TemplateRenderer.ImportChildren(self.templateCollection[templateIndex].content.childNodes, aliasObject, this.sourceDocument);
        }

        removeElementCollection(nodes, parentElement = this.sourceDocument.body) {
            for (let eachElementIndex = 0; eachElementIndex < nodes.length; eachElementIndex++) {
                parentElement.removeChild(nodes[eachElementIndex]);
            }
        }

        renderElementCollection(nodes, parentElement = this.sourceDocument.body, renderBeforeElement) {
            TemplateRenderer.RenderElementCollection(nodes, parentElement, renderBeforeElement, this.sourceDocument);
        }
    }
}
