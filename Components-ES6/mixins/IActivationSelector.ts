export interface IActivationSelector {

    sourceDocument: HTMLDocument;
    active: boolean;
    inactiveElementId?: string;
    inactiveElement?: HTMLElement;
    activeElementId?: string;
    activeElement?: HTMLElement;
    useAttribute?: string;
    useAttributeValue?: string;

    activate: () => void;
    deactivate: () => void;
}
