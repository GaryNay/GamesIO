export interface CustomHTMLElement extends HTMLElement {
    connectedCallback(): void;
    disconnectedCallback(): void;
}