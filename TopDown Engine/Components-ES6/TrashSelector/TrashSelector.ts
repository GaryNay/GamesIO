import { ItemSelector } from "../mixins/ItemSelector";
import { ITrashSelector } from "./ITrashSelector";

/** Adds or removes observed item to provided trash array */
export class TrashSelector extends ItemSelector.extends(HTMLElement) {

    constructor() {
        super();
    }

    connectedCallback() {
        let self: ITrashSelector = <any>this;
        self.sourceDocument = self.sourceDocument || document;

        if (self.hasAttribute('item')) {
            self.trashItemKey = self.getAttribute('item').valueOf();
        }
        if (self.hasAttribute('trash')) {
            self.trashCollectionKey = self.getAttribute('trash').valueOf();
        }

        ItemSelector.connectedCallback.apply(self);
    }

    disconnectedCallback() {
        let self: ITrashSelector = <any>this;
        if (self.checked) {
            self.changed(false);
        }
        ItemSelector.disconnectedCallback.apply(self);
    }

    changed(checked = this.hasAttribute('checked')) {
        let self: ITrashSelector = <any>this;
        let trashCollection = Function(`return ${self.trashCollectionKey};`)();
        let trashItem = Function(`return ${self.trashItemKey};`)();
        if (!checked) {
            if (trashCollection && trashCollection.length > 0) {
                let filtered = (<any[]>trashCollection).filter((eachItem, eachItemIndex) => {
                    if (eachItem.trashItemKey === self.trashItemKey) {
                        return false;
                    }
                    return true;
                });
                Function(`${self.trashCollectionKey} = arguments[0];`)( filtered );
                return;
            }
            return;
        }
        trashCollection.push({ trashItemKey: self.trashItemKey, trashItem: trashItem, trashSelector: self });
        Function(`${self.trashCollectionKey} = arguments[0];`)( trashCollection );
    }
}
