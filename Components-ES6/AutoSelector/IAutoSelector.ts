export interface IAutoSelector {
    attributeElementId?: string;
    attributeElement?: HTMLElement;
    attributeValueProperty: string;
    attributeValueKey: string;
    operator: string;
    value: any;
    expressionFn: (value: any) => boolean;
}