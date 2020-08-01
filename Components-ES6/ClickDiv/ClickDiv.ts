import { IClickDiv } from "./IClickDiv";
import { ItemDiv } from "../ItemDiv/ItemDiv.js";
import { group } from "console";

export class ClickDiv extends ItemDiv implements IClickDiv {
    static clickGroups: { [ groupName: string ]: ClickDiv[] } = {}

    static JoinGroup(joiner: ClickDiv, groupsNames: string[]) {
        let groups = groupsNames;
        if (!groups || !groups.length) {
            groups = [ '_gen_' ];
        }

        for (let groupName of groups) {
            if (!ClickDiv.clickGroups[ groupName ]) {
                ClickDiv.clickGroups[ groupName ] = [ joiner ];
            }
            else if (!ClickDiv.clickGroups[ groupName ].includes(joiner)) {
                ClickDiv.clickGroups[ groupName ].push(joiner);
            }
        }
    }6

    static LeaveGroup(leaver: ClickDiv, groupsNames: string[]) {
        let groups = groupsNames;
        if (!groups || !groups.length) {
            groups = [ '_gen_' ];
        }

        for (let groupName of groups) {
            if (ClickDiv.clickGroups[ groupName ] && ClickDiv.clickGroups[ groupName ].includes(leaver)) {
                ClickDiv.clickGroups[ groupName ] = ClickDiv.clickGroups[ groupName ].filter((eachMember) => {
                    return eachMember !== leaver;
                });
            }
        }
    }

    static GroupClick(groupName: string, attributeName: string, clickValue: string, clickDefault = false) {
        if (!groupName) {
            groupName = '_gen_';
        }
        let set = 0, removed = 0;
        for (let eachMember of ClickDiv.clickGroups[ groupName ]) {
            if (eachMember.mirrorValue === clickValue) {
                if (!eachMember.hasAttribute(attributeName)) {
                    eachMember.setAttribute(attributeName, '');
                    set++;
                }
            }
            else if (!eachMember.mirrorValue && clickDefault && (eachMember).clickValue === clickValue) {
                if (!eachMember.hasAttribute(attributeName)) {
                    eachMember.setAttribute(attributeName, '');
                    set++;
                }
            }
            else if (eachMember.hasAttribute(attributeName)) {
                eachMember.removeAttribute(attributeName);
                removed++;
            }
        }
        // console.log(`ClickDiv: ${ groupName }[${ attributeName}] = ${ clickValue } SETS ${ set } & REMOVES ${ removed } of ${ ClickDiv.clickGroups[ groupName ].length }`);
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
    listeningToGroups: string[];
    clickAttributeName: string;
    mirrorValue: string;
    clickValue: string;

    constructor() {
        super();
    }

    connectedCallback() {

        this.listeningToGroups = [];

        if (this.hasAttribute('click-group')) {
            this.inGroup = true;
            this.listeningToGroups = this.getAttribute('click-group').valueOf().split(',');

            this.clickGroupName = this.listeningToGroups[0] || '';

            ClickDiv.JoinGroup(this, this.listeningToGroups);
        }

        if (this.hasAttribute('click-attribute')) {
            this.clickAttributeName = this.getAttribute('click-attribute').valueOf();

            this.addEventListener('click', () => {
                if (this.clickValue) {
                    this.divClick();
                }
            });
        }

        if (this.hasAttribute('click-mirror')) {
            this.mirrorValue = this.getAttribute('click-mirror').valueOf();
            if (this.hasAttribute('click-default')) {
                setTimeout(() => {
                    ClickDiv.GroupClick(this.clickGroupName, this.clickAttributeName, this.clickValue || this.mirrorValue, true);
                }, 100);
            }
        }

        super.connectedCallback();

        if (this.hasAttribute('click-value')) {
            this.clickValue = this.getAttribute('click-value').valueOf();
            if (this.clickValue) this.update(null, null, this.clickValue);
        }

    }

    divClick() {
        if (this.inGroup) {
            ClickDiv.GroupClick(this.clickGroupName, this.clickAttributeName, this.clickValue);
            if (!this.mirrorValue || this.mirrorValue == this.clickValue) {
                this.setAttribute(this.clickAttributeName, '');
            }
        }
        else {
            ClickDiv.ToggleAttribute(this, this.clickAttributeName);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        if (this.inGroup) {
            ClickDiv.LeaveGroup(this, this.listeningToGroups);
        }
    }

    update(updated, parent, value) {
        this.containerSpan && super.update(updated, parent, value);
    }
}
