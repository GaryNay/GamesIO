import { ItemsObserver } from "../mixins/ItemsObserver.js";
import { IClickDiv } from "./IClickDiv";
import { ItemDiv } from "../ItemDiv/ItemDiv.js";

export class ClickDiv extends ItemDiv implements IClickDiv {
    static clickGroups: { [ groupName: string ]: HTMLElement[] } = {}

    static JoinGroup(joiner: HTMLElement, groupName: string) {
        if (!groupName) {
            groupName = '_gen_';
        }

        if (!ClickDiv.clickGroups[ groupName ]) {
            ClickDiv.clickGroups[ groupName ] = [ joiner ];
        }
        else if (!ClickDiv.clickGroups[ groupName ].includes(joiner)) {
            ClickDiv.clickGroups[ groupName ].push(joiner);
        }
    }

    static LeaveGroup(leaver: HTMLElement, groupName: string) {
        if (!groupName) {
            groupName = '_gen_';
        }

        if (ClickDiv.clickGroups[groupName] && ClickDiv.clickGroups[ groupName ].includes(leaver)) {
            ClickDiv.clickGroups[ groupName ] = ClickDiv.clickGroups[ groupName ].filter((eachMember) => {
                return eachMember !== leaver;
            });
        }
    }

    static GroupClick(groupName: string, attributeName: string, clickValue: string) {
        if (!groupName) {
            groupName = '_gen_';
        }
        for (let eachMember of ClickDiv.clickGroups[ groupName ]) {
            if ((<ClickDiv>eachMember).mirrorValue === clickValue) {
                eachMember.setAttribute(attributeName, '');
            }
            else {
                eachMember.hasAttribute(attributeName) && eachMember.removeAttribute(attributeName);
            }
        }
    }

    static ToggleAttribute(toToggle: HTMLElement, attributeName: string, attributeValue = '') {
        if (toToggle.hasAttribute(attributeName)) {
            toToggle.removeAttribute(attributeName);
        }
        else {
            toToggle.setAttribute(attributeName, '');
        }
    }

    inGroup: boolean = false;
    clickGroupName: string;
    clickAttributeName: string;
    mirrorValue: string;
    clickValue: string;

    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();

        if (this.hasAttribute('click-group')) {
            this.inGroup = true;
            this.clickGroupName = this.getAttribute('click-group').valueOf();

            ClickDiv.JoinGroup(this, this.clickGroupName);
        }

        if (this.hasAttribute('click-attribute')) {
            this.clickAttributeName = this.getAttribute('click-attribute').valueOf();

            this.addEventListener('click', () => {
                if (this.inGroup) {
                    ClickDiv.GroupClick(this.clickGroupName, this.clickAttributeName, this.clickValue);
                    this.setAttribute(this.clickAttributeName, '');
                }
                else {
                    ClickDiv.ToggleAttribute(this, this.clickAttributeName);
                }
            });

        }
        if (this.hasAttribute('click-value')) {
            this.clickValue = this.getAttribute('click-value').valueOf();
            this.update(null, null, this.clickValue);
        }
        if (this.hasAttribute('click-mirror')) {
            this.mirrorValue = this.getAttribute('click-mirror').valueOf();
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        if (this.inGroup) {
            ClickDiv.LeaveGroup(this, this.clickGroupName);
        }
    }

    update(updated, parent, value) {
        super.update(updated, parent, value);
    }
}
