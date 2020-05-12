import { IItemSelector } from "../mixins/IItemSelector";
import { IActivationSelector } from "../Mixins/IActivationSelector";

export interface ICollapseSelector extends IItemSelector, IActivationSelector, HTMLElement {
}
