import { ItemSelector } from "../mixins/ItemSelector";
import { ActivationSelector } from "../mixins/ActivationSelector";
import { ICollapseSelector } from "./ICollapseSelector";

export class CollapseSelector extends ItemSelector.extends(ActivationSelector.extends(HTMLElement)) {

    constructor() {
        super();
    }

    connectedCallback() {
        let self: ICollapseSelector = <any>this;
        ActivationSelector.connectedCallback.apply(self);
        ItemSelector.connectedCallback.apply(self);
    }

    disconnectedCallback() {
        ActivationSelector.disconnectedCallback.apply(this);
        ItemSelector.disconnectedCallback.apply(this);
    }

    changed(checked = this.hasAttribute('checked')) {
        let self: ICollapseSelector = <any>this;
        self.active = checked;
    }
}
