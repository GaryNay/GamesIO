import { IActivationSelector } from "../Mixins/IActivationSelector";
import { IItemsObserver } from "../Mixins/IItemsObserver";
import { ITemplateRenderer } from "../mixins/ITemplateRenderer";

export interface ITrashConfirmation extends IActivationSelector, IItemsObserver, ITemplateRenderer, HTMLElement {
    active: boolean;
    modalActive: boolean;

    singularText: string;
    pluralText: string;

    displayElements: Element[];
    modalElements: Element[];
    inactiveElementId: string;
    inactiveElement: HTMLElement;

    trashItems: any[];
    confirm: () => void;
}
