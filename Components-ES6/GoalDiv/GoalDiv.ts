import { ItemsObserver } from "../mixins/ItemsObserver.js";
import { IGoalDiv } from "./IGoalDiv";
import { ItemDiv } from "../ItemDiv/ItemDiv";

export class GoalDiv extends ItemsObserver.extends(HTMLElement) implements IGoalDiv {

    itemDiv: ItemDiv;
    markup: string;
    total: number;
    goal: number;
    goalProperty: string;
    getGoalColorStyle: (percent: number) => string;

    constructor() {
        super();
    }

    connectedCallback() {

        if (this.hasAttribute('color-callback')) {
            this.getGoalColorStyle = ItemsObserver.GetParentTargetReference(this.getAttribute('color-callback')).target || this.getGoalColorStyle;
        }

        this.collectionAttribute = 'value';

        super.connectedCallback();

        if (this.hasAttribute('goal')) {
            this.goalProperty = this.addObservedKey(this.getAttribute('goal'));
        }

        this.itemDiv = document.createElement('item-div') as ItemDiv;
        this.itemDiv.setAttribute('currency', '');
        this.itemDiv.setAttribute('item', this.defaultTargetKey);
        this.itemDiv.className = this.className;
        this.parentElement.insertBefore(this.itemDiv, this);

        this.setAttribute('disabled', '');

        this.updateColor();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    update(updated?: any, key?: string | number, value?: any) {
        if (key === this.defaultTargetProperty) {
            this.total = value || 0;
        }
        else {
            this.goal = value || 0;
        }

        if (this.itemDiv) {
            this.updateColor();
        }
    }

    updateColor() {
        this.itemDiv.style.color = this.getGoalColorStyle(this.total / this.goal);
    }
}