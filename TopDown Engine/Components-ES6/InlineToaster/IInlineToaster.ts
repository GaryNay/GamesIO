import { ITemplateRenderer } from "../mixins/ITemplateRenderer";
import { IItemsObserver } from "../Mixins/IItemsObserver";

export interface IInlineToaster extends ITemplateRenderer, IItemsObserver, HTMLElement {

    active: boolean;
    duration: number;
    toastKey: string;
    activeToastNumber: number;

    parser: (input: any) => string;
    toast(text: string, templateName?: string, externalCallbackFn?: (confirmed: boolean) => void);
}
