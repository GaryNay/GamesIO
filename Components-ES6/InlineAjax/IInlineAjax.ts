import { ClientProviders } from "../../ClientProviders/ClientProviders";

export interface IInlineAjax {
    sourceDocument: Document;
    xhrProvider: ClientProviders.XhrProvider;
}