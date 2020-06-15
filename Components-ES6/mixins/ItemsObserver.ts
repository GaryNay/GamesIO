import { IItemsObserver, ItemsObserverElement } from "./IItemsObserver";
import { IProxy } from "./IProxy";
import { IProxyHandler } from "./IProxyHandler";
import { CustomHTMLElement } from "../CustomHTMLElement";
import { IItemSelector } from "./IItemSelector";

interface Constructor<T> {
    new (): T;
}

export class ItemsObserver {
    private static _observers: ItemsObserverElement[];
    private static _disableProxyHandler = false;

    static DisableProxies(setTo: boolean) {
        return this._disableProxyHandler = setTo;
    }

    static AddObserver(newObserver: ItemsObserverElement) {
        if (!ItemsObserver._observers) {
            ItemsObserver._observers = [];
        }
        for (let observer of ItemsObserver._observers) {
            if (newObserver === observer) {
                return;
            }
        }
        ItemsObserver._observers.push(newObserver);
    }

    static RemoveObserver(oldObserver: ItemsObserverElement) {
        for (let observerIndex = 0; observerIndex < ItemsObserver._observers.length; observerIndex++) {
            if (oldObserver === ItemsObserver._observers[observerIndex]) {
                ItemsObserver._observers.splice(observerIndex, 1);
            }
        }
    }

    static AddReference(referencedName: string, addReferenceTo: IProxy<any>) {
        if (!addReferenceTo.__referencedToNames) {
            addReferenceTo.__referencedToNames = [referencedName];
        }
        else if (!addReferenceTo.__referencedToNames.includes(referencedName)) {
            addReferenceTo.__referencedToNames.push(referencedName);
        }
    }

    static RemoveReference(referencedName: string, removeRefrenceFrom: IProxy<any>) {
        // This value is being removed could be a reference to another proxy
        // Ensure removing this reference from that proxy (since it still remains to be observed by others)
        removeRefrenceFrom.__referencedToNames = removeRefrenceFrom.__referencedToNames.filter((eachName) => {
            return eachName !== referencedName;
        });
    }

    /** Proxies the parent of qualifiedName and/or ensures all relevant observers are notified */
    static Observe(qualifiedName: string) {
        let ptr = ItemsObserver.GetParentTargetReference(qualifiedName);

        ItemsObserver.DisableProxies(true);
        // To get to target we need to proxy parent first
        if (ptr.parent) {
            if (ptr.target && !ptr.target.__proxyValue && Array.isArray(ptr.target)) {
                // We'll need to proxy the array for changes also
                let observed = new Proxy(ptr.grand[ptr.parentName][ptr.targetName], ItemsObserver.objectProxyHandler) as IProxy<any>;
                observed.__proxyValue = ptr.grand[ptr.parentName][ptr.targetName];
                observed.__proxyName = ptr.parentQualified + `.${ptr.targetName}`;
                ptr.grand[ptr.parentName][ptr.targetName] = observed;
            }
            if (!ptr.parent.__proxyValue) {
                let observed = new Proxy(ptr.grand[ptr.parentName], ItemsObserver.objectProxyHandler) as IProxy<any>;
                observed.__proxyValue = ptr.grand[ptr.parentName];
                observed.__proxyName = ptr.parentQualified;
                ptr.grand[ptr.parentName] = observed;
            }
        }
        ItemsObserver.DisableProxies(false);
    }

    static objectProxyHandler: IProxyHandler = {
        set: (parent: IProxy<any>, property: string, value: any) => {
            if (ItemsObserver._disableProxyHandler) {
                parent[property] = value;
                return true;
            }
            let parentDependantsKeys = ItemsObserver.GetDependantObserverKeys(parent.__proxyName);
            if (parentDependantsKeys) {
                let thisProxyName = `${parent.__proxyName}.${property}`;
                let parentHasDependant = false;
                for (let eachParentDependantKey of Object.keys(parentDependantsKeys)) {
                    let eachParentDependantPtr = ItemsObserver.GetParentTargetReference(eachParentDependantKey);
                    if (eachParentDependantPtr.targetName === property) {
                        parentHasDependant = true;
                        break;
                    }
                }

                if (parentHasDependant) {
                    let dependantKeys = ItemsObserver.GetDependantObserverKeys(thisProxyName);
                    let dependantKeysArray = Object.keys(dependantKeys);
                    if (value && (typeof value === 'object') && dependantKeys && (Array.isArray(value) || dependantKeysArray.length > 1)) {
                        // Any values with dependants will require their parents (this current value) to be proxied
                        if (!value.__proxyValue) {
                            // Create original proxy of value
                            let itemProxy = new Proxy(value, ItemsObserver.objectProxyHandler);
                            // Save the value
                            itemProxy.__proxyValue = value;
                            // Retain property name
                            itemProxy.__proxyName = thisProxyName;
                            // Overwrite with proxy to use it
                            value = parent[property] = itemProxy;
                        }
                        else {
                            if (thisProxyName !== value.__proxyName) {
                                // Already proxied, so lets register this observation target on it
                                ItemsObserver.AddReference(thisProxyName, value);
                            }
                            parent[property] = value;
                        }
                    }
                    else {
                        value = parent[property] = value;
                    }

                    if (dependantKeys) {
                        // We must notify dependant observers of the changes to this value
                        for (let eachDependantKey of dependantKeysArray) {
                            let dependantPtr = ItemsObserver.GetParentTargetReference(eachDependantKey);
                            ItemsObserver.UpdateObservers(eachDependantKey, dependantPtr.parent, dependantPtr.targetName, dependantPtr.target);
                        }
                    }
                }
                else {
                    value = parent[property] = value;
                }

                // Check to see if this value is being removed from a referenced proxy
                if (!value && parent[property] && thisProxyName !== parent[property].__proxyName && parent[property].__referencedToNames) {
                    ItemsObserver.RemoveReference(thisProxyName, parent[property]);
                }

                // // Update those who are observing an array for changes to its index
                if (Array.isArray(parent) && parseInt(property) !== NaN) {
                    // value is the value of a numeric index to this array
                    ItemsObserver.UpdateObservers(parent.__proxyName, parent, property, value);
                }

            }
            else {
                parent[property] = value;
            }
            return true;
        }
    };

    static UpdateObservers(thisProxyName: string, parent: IProxy<any>, property: string, value: any, updatedCallback?: (updatedObserver: ItemsObserverElement) => void) {
        if (!thisProxyName) {
            return;
        }
        for (let eachObserver of ItemsObserver._observers) {
            let matched = false;
            for (let eachObservedTargetKey of eachObserver.observedTargetKeys) {
                matched = ItemsObserver.KeysMatch(thisProxyName, eachObservedTargetKey);
                if (matched) {
                    break;
                }
            }
            if (!matched) {
                if (value && (typeof value === 'object') && value.__referencedToNames) {
                    for (let eachReferenceProxyName of value.__referencedToNames) {
                        for (let eachObservedTargetKey of eachObserver.observedTargetKeys) {
                            // Check to see if the value refers to eachObserver
                            matched = ItemsObserver.KeysMatch(eachReferenceProxyName, eachObservedTargetKey);
                            if (matched) {
                                break;
                            }
                        }
                        if (matched) {
                            break;
                        }
                    }
                }
                if (!matched && parent && (typeof parent === 'object') && parent.__referencedToNames && !value) {
                    for (let eachParentReferenceProxyName of parent.__referencedToNames) {
                        for (let eachObservedTargetKey of eachObserver.observedTargetKeys) {
                            matched = ItemsObserver.KeysMatch(`${eachParentReferenceProxyName}.${property}`, eachObservedTargetKey);
                            if (matched) {
                                break;
                            }
                        }
                        if (matched) {
                            break;
                        }
                    }
                }
            }
            if (matched) {
                if (updatedCallback) {
                    updatedCallback(eachObserver);
                }
                // Add a console.log here to monitor whose getting updated
                eachObserver.update(parent, property, parent ? parent[property] : value);
            }
        }
    }

    static KeysMatch(key1: string, key2: string) {
        return ItemsObserver.ReturnQualifiedByPeriod(key1 || '-') === ItemsObserver.ReturnQualifiedByPeriod(key2 || '!');
    }

    static GetDependantObserverKeys(thisProxyName: string): { [ observedTargetKey: string]: boolean; } {
        if (!thisProxyName) {
            return;
        }
        let uniqueKeys: { [ observedTargetKey: string]: boolean; };
        let thisProxyPtr = ItemsObserver.GetParentTargetReference(thisProxyName);
        let allReferences = [thisProxyName];
        if (thisProxyPtr.target && Array.isArray(thisProxyPtr.target.__referencedToNames)) {
            allReferences = allReferences.concat(thisProxyPtr.target.__referencedToNames);
        }
        else if (thisProxyPtr.parent && Array.isArray(thisProxyPtr.parent.__referencedToNames)) {
            for (let eachReferencedToName of thisProxyPtr.parent.__referencedToNames) {
                allReferences.push(`${eachReferencedToName}.${thisProxyPtr.targetName}`);
            }
        }
        for (let eachObserver of ItemsObserver._observers) {
            for (let eachObservedTargetKey of eachObserver.observedTargetKeys) {
                for (let eachProxyName of allReferences) {
                    if (eachObservedTargetKey.indexOf(`${eachProxyName}.`) === 0 || eachObservedTargetKey === eachProxyName) {
                        if (!uniqueKeys) {
                            uniqueKeys = {};
                        }
                        uniqueKeys[eachObservedTargetKey] = true;
                    }
                }
            }
        }
        return uniqueKeys;
    }

    static GetParentTargetReference(itemsKey: string, initialTarget: any = window): { grand: any, parent: any, parentName: string, parentQualified: string, target: any, targetName: string } {
        let grand: any, parent: any, target = initialTarget, targetPropertyName: string, parentPropertyName: string;
        let qualifiedByPeriod = ItemsObserver.ReturnQualifiedByPeriod(itemsKey);
        // Walk up the itemsKey setting references to get the tip of the nest
        qualifiedByPeriod.split('.').forEach((eachKey) => {
            if (!target) {
                if (!parent) {
                    debugger;
                }
                return;
            }
            grand = parent;
            parent = target;
            parentPropertyName = targetPropertyName;
            target = target[eachKey];
            targetPropertyName = eachKey;
        });
        return {
            grand: grand,
            parent: parent,
            parentName: parentPropertyName,
            parentQualified: qualifiedByPeriod.substr(0, qualifiedByPeriod.lastIndexOf('.')),
            target: target,
            targetName: targetPropertyName
        };
    }

    static ReturnQualifiedByPeriod(itemskey: string): string {
        return (itemskey.split('[').join('.')).split(']').join('');
    }

    static GetKeyProperty(itemsKey: string): string {
        return ItemsObserver.GetParentTargetReference(itemsKey).targetName;
    }

    static DeepCopy<T>(toCopy: T | IProxy<any>): T {
        if (!toCopy) {
            return;
        }
        let toCopyObject: any = <IProxy<any>>(toCopy as any).__proxyValue || toCopy;

        if (Array.isArray(toCopyObject)) {
            let copied: T = [] as any;
            for (let index = 0; index < toCopyObject.length; index++) {
                copied[index] = this.DeepCopy(toCopyObject[index]);
            }
            return copied as any;
        }
        if (typeof toCopyObject === 'object') {
            let copied: T = {} as any;
            for (let property of Object.keys(toCopyObject)) {
                if (toCopyObject[property] && property.indexOf('__') === -1) {
                    copied[property] = this.DeepCopy(toCopyObject[property]);
                }
            }
            return copied;
        }
        if (typeof toCopyObject === 'function') {
            return null;
        }
        return toCopyObject;
    }

    static extends: <Inherited>(sClass: Constructor<Inherited>) => Constructor<Inherited & ItemsObserverElement> = <any>((superclass: Constructor<CustomHTMLElement>) => class extends superclass implements IItemsObserver {
        collectionAttribute: string;
        literalTargetKey: string;
        defaultTargetKey: string;
        defaultTargetProperty: string;
        semanticTargetKey: string;
        observedTargetKey: string;
        observedTargetKeys: string[];

        /** Adds target to observers, Returns extracted target key's object property for reference  */
        addObservedKey(observedTargetKey: string, observe = true): string {
            for (let eachObservedTargetKey of this.observedTargetKeys) {
                if (ItemsObserver.KeysMatch(observedTargetKey, eachObservedTargetKey)) {
                    return;
                }
            }
            this.observedTargetKeys.push(observedTargetKey);
            ItemsObserver.Observe(observedTargetKey);
            let parentTargetReference = ItemsObserver.GetParentTargetReference(observedTargetKey);
            if (observe) {
                this.observe(observedTargetKey, parentTargetReference);
            }
            return parentTargetReference.targetName;
        }
        observe(observedTargetKey?: string, parentTargetReference?) {
            for (let eachObservedTargetKey of observedTargetKey ? [observedTargetKey] : this.observedTargetKeys) {
                parentTargetReference = parentTargetReference || ItemsObserver.GetParentTargetReference(eachObservedTargetKey);
                ItemsObserver.UpdateObservers(eachObservedTargetKey, parentTargetReference.parent, parentTargetReference.targetName, parentTargetReference.target);
            }
        }
        update(updated: {}, key: string, value: any) {
        }
        connectedCallback() {
            super.connectedCallback && super.connectedCallback();

            if (!this.observedTargetKeys || !Array.isArray(this.observedTargetKeys)) {
                this.observedTargetKeys = [];
            }
            ItemsObserver.AddObserver(this);
            let itemAttributeName = this.collectionAttribute || (this.hasAttribute('items') ? 'items' : this.hasAttribute('item') ? 'item' : null);
            if (itemAttributeName && this.hasAttribute(itemAttributeName)) {
                this.literalTargetKey = `${this.getAttribute(itemAttributeName).valueOf()}`;
                this.defaultTargetKey = this.observedTargetKey = ItemsObserver.ReturnQualifiedByPeriod(this.literalTargetKey);
                if (this.semanticTargetKey) {
                    this.observedTargetKey = `${this.observedTargetKey}.${this.semanticTargetKey}`;
                }
                this.defaultTargetProperty = ItemsObserver.GetKeyProperty(this.defaultTargetKey);
                this.addObservedKey(this.observedTargetKey);
            }
        }
    
        disconnectedCallback() {
            super.disconnectedCallback && super.disconnectedCallback();
            ItemsObserver.RemoveObserver(this);
        }
    })
}
