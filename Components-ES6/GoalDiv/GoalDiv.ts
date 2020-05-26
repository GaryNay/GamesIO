import { ItemsObserver } from "../mixins/ItemsObserver";
import { IGoalDiv } from "./IGoalDiv";
import { ItemDiv } from "../ItemDiv/ItemDiv";
import { IItemDiv } from "../ItemDiv/IItemDiv";

export class GoalDiv extends ItemsObserver.extends(HTMLElement) {

    itemDiv: ItemDiv;

    constructor() {
        super();
    }

    connectedCallback() {
        let self: IGoalDiv = this as any;

        if (self.hasAttribute('color-callback')) {
            self.getGoalColorStyle = ItemsObserver.getParentTargetReference(self.getAttribute('color-callback')).target || self.getGoalColorStyle;
        }

        self.collectionAttribute = 'value';
        ItemsObserver.connectedCallback.apply(self);

        if (self.hasAttribute('goal')) {
            self.goalProperty = self.addObservedKey(self.getAttribute('goal'));
        }

        self.itemDiv = document.createElement('item-div') as IItemDiv;
        self.itemDiv.setAttribute('currency', '');
        self.itemDiv.setAttribute('item', self.defaultTargetKey);
        self.itemDiv.className = self.className;
        self.parentElement.insertBefore(self.itemDiv, self);

        self.setAttribute('disabled', '');

        self.updateColor();
    }

    disconnectedCallback() {
        ItemsObserver.disconnectedCallback.apply(this);
    }

    update(updated?: any, key?: string | number, value?: any) {
        let self: IGoalDiv = this as any;

        if (key === self.defaultTargetProperty) {
            self.total = value || 0;
        }
        else {
            self.goal = value || 0;
        }

        if (self.itemDiv) {
            self.updateColor();
        }
    }

    updateColor() {
        let self: IGoalDiv = this as any;

        self.itemDiv.style.color = self.getGoalColorStyle(self.total / self.goal);
    }
}