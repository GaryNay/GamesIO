import { CustomHTMLElement } from "../CustomHTMLElement";

export interface IItemsObserver {
    /** Used to define collection attribute name. Defaults to item or items */
    collectionAttribute: string;
    /** Maintains original target key syntax */
    literalTargetKey: string;
    /** Default observer target key from collection attribute */
    defaultTargetKey: string;
    /** Default observer target key's object property for update reference */
    defaultTargetProperty: string;
    /** Used to pass additional observer target info from custom attributes */
    semanticTargetKey: string;
    /** Observed Target Key to internally match on when updating */
    observedTargetKey: string;
    observedTargetKeys: string[];
    /** Abstract update to be called when observing changes */
    update(updated: {}, key: string, value: any);
    /** Returns target key's object property for update reference */
    addObservedKey(observedTargetKey: string, observe?: boolean): string;
    /** Observes target key, or all observed keys if ommitted */
    observe(targetKey?: string);
    
    //deepCopy<T>(toCopy: T | IProxy<T>): T;
}

export interface ItemsObserverElement extends IItemsObserver, CustomHTMLElement {}