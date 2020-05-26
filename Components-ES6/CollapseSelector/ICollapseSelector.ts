import { IItemSelector } from "../mixins/IItemSelector";
import { IActivationSelector } from "../mixins/IActivationSelector";

export interface ICollapseSelector extends IItemSelector, IActivationSelector, HTMLElement {
}
