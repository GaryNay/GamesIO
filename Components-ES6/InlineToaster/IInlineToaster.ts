import { ITemplateRenderer } from "../mixins/ITemplateRenderer";

export interface IInlineToaster extends ITemplateRenderer {

    active: boolean;
    duration: number;
    toastKey: string;
    activeToastNumber: number;

    parser: (input: any) => string;
    toast(text: string, templateName?: string, externalCallbackFn?: (confirmed: boolean) => void): void;
}
