import { IItemsObserver } from "../Mixins/IItemsObserver";
import { IActivationSelector } from "../Mixins/IActivationSelector";

export interface IAutoSelector extends IItemsObserver, IActivationSelector, HTMLElement {
    attributeElementId?: string;
    attributeElement?: HTMLElement;
    attributeValueProperty: string;
    attributeValueKey: string;
    operator: string;
    value: any;
    expressionFn: (value: any) => boolean;
}
