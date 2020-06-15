import { ITemplateRenderer } from "../mixins/ITemplateRenderer";

export interface IMenuSelector extends ITemplateRenderer {
    isMouseOver: boolean;
    cssTransition: boolean;
    attributeElementIds?: string[];
    menuButtonInput: HTMLInputElement;
    isMenuOpen: boolean;
    menuButtonSpan: HTMLSpanElement;
    menuFlyoutSpan: HTMLSpanElement;
    menuContextKey: string;
    selected: (menuContext: any, menuSelectedIndex: string) => void;
}