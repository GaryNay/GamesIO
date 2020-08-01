import { CustomHTMLElement } from "../CustomHTMLElement";

export interface IAttributes {

    executeAttributeTemplatesOnConnect: boolean;
    returnExecutedString(attributeName: string): string;
    executeAttributeTemplates(attributeName?: string): void;
}

export interface AttributeElement extends IAttributes, CustomHTMLElement {}
