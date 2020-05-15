import { IItemsObserver } from "../Mixins/IItemsObserver";
import { IItemDiv } from "../ItemDiv/IItemDiv";

export interface IGoalDiv extends IItemsObserver, HTMLElement {
    updateColor(): any;
    itemDiv: IItemDiv;
    markup: string;
    total: number;
    goal: number;
    goalProperty: string;
    getGoalColorStyle: (percent: number) => string;
}