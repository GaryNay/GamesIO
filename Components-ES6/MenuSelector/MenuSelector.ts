import { TemplateRenderer } from "../mixins/TemplateRenderer";
import { IMenuSelector } from "./IMenuSelector";
import { ItemsObserver } from "../Mixins/ItemsObserver";

export class MenuSelector extends TemplateRenderer.extends(HTMLElement) {

    constructor() {
        super();
    }

    connectedCallback() {
        let self: IMenuSelector = <any>this;

        TemplateRenderer.connectedCallback.apply(self);

        // User requested element(s): To apply the menu-open attribute, used by CSS selectors
        if (self.hasAttribute('attribute-element')) {
            self.attributeElementIds = [ self.getAttribute('attribute-element') ];
        }
        else if (self.hasAttribute('attribute-elements')) {
            self.attributeElementIds = self.getAttribute('attribute-elements').split(',');
        }

        if (self.hasAttribute('on-select')) {
            let onselectAttribute = self.getAttribute('on-select').valueOf();
            self.selected = (menuContext, menuSelectedIndex) => {
                let clickPTR = ItemsObserver.getParentTargetReference(onselectAttribute);
                if (typeof clickPTR.target === 'function') {
                    clickPTR.target.apply(clickPTR.parent, [ menuContext, menuSelectedIndex ]);
                }
            };
        }
        if (self.hasAttribute('menu-context')) {
            self.menuContextKey = self.getAttribute('menu-context').valueOf();
        }

        let selectorTemplateContent = self.importBoundTemplate({}, 'menu-button');
        let menuFlyoutContent: Node[];

        self.sourceDocument = self.sourceDocument || document;

        // Create an input to recieve focus while the menu is open
        //  doing so leverages it's blur event to close the menu
        self.menuButtonInput = self.sourceDocument.createElement('input');
        self.menuButtonInput.type = 'checkbox';
        self.menuButtonInput.style.width = '0';
        self.menuButtonInput.style.height = '0';
        self.appendChild(self.menuButtonInput);

        self.menuButtonSpan = self.sourceDocument.createElement('span');
        self.appendChild(self.menuButtonSpan);

        self.renderElementCollection(<Node[]>selectorTemplateContent, self.menuButtonSpan);

        self.isMenuOpen = false;
        let closeMenu = () => {
            if (self.isMenuOpen) {
                self.isMenuOpen = false;
                if (self.attributeElementIds) {
                    for (let eachId of self.attributeElementIds) {
                    // Remove the menu-open attribute for requested elements
                    self.sourceDocument.getElementById(eachId).removeAttribute('menu-open');
                    }
                }
                self.menuButtonInput.removeEventListener('blur', blurFn);
                self.removeElementCollection(menuFlyoutContent, self.menuButtonSpan);
            }
        };
        let blurFn = () => {
            if (!self.hasAttribute('persist') && !self.isMouseOver) {
                closeMenu();
            }
        };

        self.menuButtonSpan.addEventListener('mouseout', () => {
            self.isMouseOver = false;
        });
        self.menuButtonSpan.addEventListener('mouseover', () => {
            self.isMouseOver = true;
        });

        self.menuButtonSpan.addEventListener('click', () => {
            if (!self.isMenuOpen) {
                self.isMenuOpen = true;
                self.isMouseOver = true;
                if (self.attributeElementIds) {
                    // Set the menu-open attribute for requested elements
                    for (let eachId of self.attributeElementIds) {
                        self.sourceDocument.getElementById(eachId).setAttribute('menu-open', '');
                    }
                }

                self.menuButtonInput.addEventListener('blur', blurFn);

                // Get the actual menu context from the menuContextKey
                let menuPTR = ItemsObserver.getParentTargetReference(self.menuContextKey);
                // Add the selected function to the target (if it doesn't already exsist, since that would be a user override)
                if (!menuPTR.target.selected) {
                    menuPTR.target.selected = (menuSelectedIndex: string) => {
                        closeMenu();
                        self.selected(menuPTR.target, menuSelectedIndex);
                    };
                }
                // Create Flyout Content
                menuFlyoutContent = <Node[]>self.importBoundTemplate({
                    // Pass the menuContextKey into the template so context values can be referenced by its children
                    ['menu']: `${self.menuContextKey}`
                }, 'menu-flyout');

                self.renderElementCollection(menuFlyoutContent, self.menuButtonSpan);
                self.menuButtonInput.focus();
            }
            else {
                closeMenu();
            }
        });
    }

    disconnectedCallback() {
        let self: IMenuSelector = <any>this;
        if (self.attributeElementIds) {
            for (let eachId of self.attributeElementIds) {
                // Remove the menu-open attribute for requested elements
                let eachElement = self.sourceDocument.getElementById(eachId);
                if (eachElement) {
                    eachElement.removeAttribute('menu-open');
                }
            }
        }

        TemplateRenderer.disconnectedCallback.apply(this);
    }
}
