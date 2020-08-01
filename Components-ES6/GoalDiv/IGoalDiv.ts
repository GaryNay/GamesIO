import { IItemsObserver } from "../mixins/IItemsObserver";
import { ItemDiv } from "../ItemDiv/ItemDiv";

export interface IGoalDiv extends IItemsObserver {
    updateColor(): any;
    itemDiv: ItemDiv;
    markup: string;
    total: number;
    goal: number;
    goalProperty: string;
    getGoalColorStyle: (percent: number) => string;
}