import { IItemSelector } from "../mixins/IItemSelector";

export interface ITrashSelector extends IItemSelector, HTMLElement {
    trashItemKey: string;
    trashCollectionKey: string;
}
