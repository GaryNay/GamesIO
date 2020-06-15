import { TemplateRenderer } from "../mixins/TemplateRenderer.js";
import { IMenuSelector } from "./IMenuSelector";
import { ItemsObserver } from "../mixins/ItemsObserver.js";

export class MenuSelector extends TemplateRenderer.extends(HTMLElement) implements IMenuSelector {
    isMouseOver: boolean;
    cssTransition = false;
    transitioningElements = 0;
    attributeIncludeSelf = false;
    attributeElementIds?: string[];
    menuButtonInput: HTMLInputElement;
    isMenuOpen: boolean;
    menuButtonSpan: HTMLSpanElement;
    menuFlyoutSpan: HTMLSpanElement;
    menuContextKey: string;
    selected: (menuContext: any, menuSelectedIndex: string) => void;

    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();

        // User requested element(s): To apply the menu-open attribute, used by CSS selectors
        if (this.hasAttribute('attribute-element')) {
            this.attributeElementIds = [ this.getAttribute('attribute-element') ];
        }
        else if (this.hasAttribute('attribute-elements')) {
            this.attributeElementIds = this.getAttribute('attribute-elements').split(',');
        }

        if (!this.attributeElementIds || this.hasAttribute('include-self')) {
            this.attributeIncludeSelf = true;
        }

        let transitionRun = () => {
            this.transitioningElements++;
            console.log(`MenuSelector: Transition Run (${ this.transitioningElements })`);
        }
        let transitionEnd = () => {
            this.transitioningElements--;
            console.log(`MenuSelector: Transition End (${ this.transitioningElements })`);
            
        }
        if (this.hasAttribute('css-transition')) {
            this.cssTransition = true;
            if (this.attributeElementIds) {
                for (let eachElementId of this.attributeElementIds) {
                    let eachElement = this.sourceDocument.getElementById(eachElementId);
                    if (eachElement) {
                        eachElement.addEventListener('transitionrun', transitionRun);
                        eachElement.addEventListener('transitioncancel', transitionEnd);
                        eachElement.addEventListener('transitionend', transitionEnd);
                    }
                }
            }
            if (this.attributeIncludeSelf) {
                this.addEventListener('transitionrun', transitionRun);
                this.addEventListener('transitioncancel', transitionEnd);
                this.addEventListener('transitionend', transitionEnd);
            }
        }

        if (this.hasAttribute('on-select')) {
            let onselectAttribute = this.getAttribute('on-select').valueOf();
            this.selected = (menuContext, menuSelectedIndex) => {
                let clickPTR = ItemsObserver.GetParentTargetReference(onselectAttribute);
                if (typeof clickPTR.target === 'function') {
                    clickPTR.target.apply(clickPTR.parent, [ menuContext, menuSelectedIndex ]);
                }
            };
        }
        if (this.hasAttribute('menu-context')) {
            this.menuContextKey = this.getAttribute('menu-context').valueOf();
        }

        let selectorTemplateContent = this.importBoundTemplate({}, 'menu-button');
        let menuFlyoutContent: Node[];

        this.sourceDocument = this.sourceDocument || document;

        // Create an input to recieve focus while the menu is open
        //  doing so leverages it's blur event to close the menu
        this.menuButtonInput = this.sourceDocument.createElement('input');
        this.menuButtonInput.type = 'checkbox';
        this.menuButtonInput.style.width = '0';
        this.menuButtonInput.style.height = '0';
        this.appendChild(this.menuButtonInput);

        this.menuButtonSpan = this.sourceDocument.createElement('span');
        this.appendChild(this.menuButtonSpan);

        this.renderElementCollection(<Node[]>selectorTemplateContent, this.menuButtonSpan);

        this.isMenuOpen = false;
        let closeMenu = () => {
            if (this.isMenuOpen) {
                this.isMenuOpen = false;
                this.menuButtonInput.removeEventListener('blur', blurFn);

                if (this.attributeElementIds) {
                    for (let eachId of this.attributeElementIds) {
                        // Remove the menu-open attribute for requested elements
                        this.sourceDocument.getElementById(eachId).removeAttribute('menu-open');
                    }
                }
                if (this.attributeIncludeSelf) {
                    this.removeAttribute('menu-open');
                }

                if (this.cssTransition) {
                    let closerIndex: any;
                    let closer = () => {
                        if (!this.transitioningElements || this.transitioningElements <= 0) {
                            this.removeElementCollection(menuFlyoutContent, this.menuButtonSpan);
                            clearInterval(closerIndex);
                        }
                    }
                    closerIndex = setInterval(closer, 100);
                }
                else {
                    this.removeElementCollection(menuFlyoutContent, this.menuButtonSpan);
                }
            }
        };
        let blurFn = () => {
            if (!this.hasAttribute('persist') && !this.isMouseOver) {
                return closeMenu();
            }
            this.menuButtonInput.focus();
        };

        this.menuButtonSpan.addEventListener('mouseout', () => {
            this.isMouseOver = false;
        });
        this.menuButtonSpan.addEventListener('mouseover', () => {
            this.isMouseOver = true;
        });

        this.menuButtonSpan.addEventListener('click', () => {
            console.log(`MenuSelector: CLICKED (${ this.transitioningElements })`);
            if (!this.transitioningElements || this.transitioningElements <= 0) {
                if (!this.isMenuOpen) {
                    this.isMenuOpen = true;
                    this.isMouseOver = true;

                    this.menuButtonInput.addEventListener('blur', blurFn);

                    // Get the actual menu context from the menuContextKey
                    let menuPtr = this.menuContextKey && ItemsObserver.GetParentTargetReference(this.menuContextKey);

                    // Add the selected function to the target (if it doesn't already exsist, since that would be a user override)
                    if (menuPtr && menuPtr.target && !menuPtr.target.selected) {
                        menuPtr.target.selected = (menuSelectedIndex: string) => {
                            closeMenu();
                            this.selected(menuPtr.target, menuSelectedIndex);
                        };
                    }
                    // Create Flyout Content
                    menuFlyoutContent = <Node[]>this.importBoundTemplate({
                        // Pass the menuContextKey into the template so context values can be referenced by its children
                        ['menu']: `${this.menuContextKey}`
                    }, 'menu-flyout');

                    this.renderElementCollection(menuFlyoutContent, this.menuButtonSpan);

                    setTimeout(() => {
                        if (this.attributeElementIds) {
                            // Set the menu-open attribute for requested elements
                            for (let eachId of this.attributeElementIds) {
                                this.sourceDocument.getElementById(eachId).setAttribute('menu-open', '');
                            }
                        }
                        if (this.attributeIncludeSelf) {
                            this.setAttribute('menu-open', '');
                        }

                        this.menuButtonInput.focus();
                    });
                }
                else {
                    // this.menuButtonInput.focus();
                    // this.hasAttribute('click-persist') ? this.menuButtonInput.focus() : closeMenu();
                }
            }
        });
    }

    disconnectedCallback() {
        if (this.attributeElementIds) {
            for (let eachId of this.attributeElementIds) {
                // Remove the menu-open attribute for requested elements
                let eachElement = this.sourceDocument.getElementById(eachId);
                if (eachElement) {
                    eachElement.removeAttribute('menu-open');
                }
            }
        }

        super.disconnectedCallback();
    }
}
