import { IItemSelector } from "../mixins/IItemSelector";

export interface ITrashSelector extends IItemSelector {
    trashItemKey: string;
    trashCollectionKey: string;
}
