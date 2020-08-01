import { IActivationSelector } from "../mixins/IActivationSelector";
import { IItemsObserver } from "../mixins/IItemsObserver";
import { ITemplateRenderer } from "../mixins/ITemplateRenderer";

export interface ITrashConfirmation extends IActivationSelector, IItemsObserver, ITemplateRenderer {
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
