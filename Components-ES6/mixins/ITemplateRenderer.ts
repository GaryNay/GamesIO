import { TemplateRenderer } from "./TemplateRenderer";
import { CustomHTMLElement } from "../CustomHTMLElement";

export interface ITemplateRenderer {
    sourceDocument: Document;
    templateCollection: HTMLTemplateElement[];

    importBoundTemplate(aliasObject: { [aliasName: string]: any }, whichTemplate?: number | string): NodeList | Node[];
    removeElementCollection(nodes: Node[], parentElement?: HTMLElement): void;
    renderElementCollection(nodes: Node[], parentElement?: HTMLElement, renderBeforeElement?: Element): void;
}

export interface TemplateRendererElement extends ITemplateRenderer, CustomHTMLElement {}