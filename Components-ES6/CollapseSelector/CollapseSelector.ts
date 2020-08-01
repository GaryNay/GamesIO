import { ItemSelector } from "../mixins/ItemSelector.js";
import { ActivationSelector } from "../mixins/ActivationSelector.js";
import { ICollapseSelector } from "./ICollapseSelector";

export class CollapseSelector extends ItemSelector.extends(ActivationSelector.extends(HTMLElement)) implements ICollapseSelector {

    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    changed(checked = this.hasAttribute('checked')) {
        this.active = checked;
    }
}
