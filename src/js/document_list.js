import { store } from '../store/index.js';
import { viewDocument, searchShipments, deselectShipmentsSearchBar } from '../store/actions.js';
import { isFetchingShipments, getShipments, getTypeOfDocuments, getShipmentIndex, getShipmentsSearchText, getIsShipmentsSearchBarSelected } from '../store/selectors.js';

export const DisplayDocumentsToDeliver = () => {
    document.querySelector("main div#docs-container").innerHTML = '';
    let state = store.getState();
    let shipments = getShipments(state);
    let typeOfDocuments = getTypeOfDocuments(state);
    let shipmentsSearchText = getShipmentsSearchText(state);
    let isShipmentsSearchBarSelected = getIsShipmentsSearchBarSelected(state);
    document.querySelector("main #search-bar").innerHTML = `
        <input type="text" class="mr-2 my-4 p-1 self-stretch rounded-md shadow-md shadow-gray-500 grow" placeholder="Pesquisar">
        <search-button></search-button>
    `;
    if (shipments.length === 0 && typeOfDocuments === "documents_to_deliver") {
        const html = `
        <div id="no-docs">
            <h1>Não há cargas para entregar.</h1>
        </div>`;
        document.querySelector("main div#docs-container").innerHTML = html;
    } else if (shipments.length === 0 && typeOfDocuments === "documents_delivered") {
        const html = `
        <div id="no-docs">
            <h1>Não há cargas com documentos para comprovar.</h1>
        </div>`;
        document.querySelector("main div#docs-container").innerHTML = html;
    } else {
        Object.values(shipments).forEach((shipment) => {
            let html = `
            <a hx-get="document_view.html" hx-trigger="click" hx-target="main" hx-swap="innerHTML">
                <doc-button>
                    <span slot="title-slot">${shipment.destination.name}</span>
                    <span slot="description-slot"> 
                        Entrega
                        <address>
                            ${shipment.destination.address}
                        </address>
                    </span> 
                </doc-button>       
            </a>`
            const container = document.createElement('div');
            container.innerHTML = html;
            const a = container.querySelector('a');
            a.addEventListener("click", () => {
                store.dispatch(viewDocument(getShipmentIndex(state, shipment)));
            })
            document.querySelector("main div#docs-container").appendChild(a);
            container.remove();
        })
    }
    
    if (isShipmentsSearchBarSelected) {
        document.querySelector("main #search-bar input").focus();
    }

    if (shipmentsSearchText) {
        document.querySelector("main #search-bar input").value = shipmentsSearchText;
    }

    document.querySelector("main #search-bar input").addEventListener("input", (e) => {
        const searchValue = e.target.value.toLowerCase();
        store.dispatch(searchShipments(searchValue));
    })

    document.querySelector("main #search-bar search-button").addEventListener("click", () => {
        store.dispatch(deselectShipmentsSearchBar());
    })

    htmx.process(document.querySelector("main div#docs-container"));

    if (!isFetchingShipments(state)){
        document.dispatchEvent(new CustomEvent('contentLoaded'));
    }
};