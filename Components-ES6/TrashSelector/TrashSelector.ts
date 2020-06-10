import { ItemSelector } from "../mixins/ItemSelector.js";
import { ITrashSelector } from "./ITrashSelector";

/** Adds or removes observed item to provided trash array */
export class TrashSelector extends ItemSelector.extends(HTMLElement) implements ITrashSelector {
    trashItemKey: string;
    trashCollectionKey: string;

    constructor() {
        super();
    }

    connectedCallback() {
        this.sourceDocument = this.sourceDocument || document;

        if (this.hasAttribute('item')) {
            this.trashItemKey = this.getAttribute('item').valueOf();
        }
        if (this.hasAttribute('trash')) {
            this.trashCollectionKey = this.getAttribute('trash').valueOf();
        }

        super.connectedCallback();
    }

    disconnectedCallback() {
        if (this.checked) {
            this.changed(false);
        }
        super.disconnectedCallback();
    }

    changed(checked = this.hasAttribute('checked')) {
        let trashCollection = Function(`return ${this.trashCollectionKey};`)();
        let trashItem = Function(`return ${this.trashItemKey};`)();
        if (!checked) {
            if (trashCollection && trashCollection.length > 0) {
                let filtered = (<any[]>trashCollection).filter((eachItem, eachItemIndex) => {
                    if (eachItem.trashItemKey === this.trashItemKey) {
                        return false;
                    }
                    return true;
                });
                Function(`${this.trashCollectionKey} = arguments[0];`)( filtered );
                return;
            }
            return;
        }
        trashCollection.push({ trashItemKey: this.trashItemKey, trashItem: trashItem, trashSelector: this });
        Function(`${this.trashCollectionKey} = arguments[0];`)( trashCollection );
    }
}
