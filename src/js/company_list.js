import { store } from '../store/index.js';
import { displayShipments } from '../store/actions.js';
import { getCompanies, isFetchingCompanies } from '../store/selectors.js';

export const DisplayCompanies = async () => {
    if (document.querySelector("main div")?.childNodes.length > 0) return; // Prevents re-rendering if companies are already displayed
    Object.values(getCompanies(store.getState())).forEach(company => {
        let html =`
        <a hx-get="document_list.html" hx-trigger="click" hx-target="main" hx-swap="innerHTML" id="${company.id}">
            <nav-button>${company.name}</nav-button>
        </a>`;
        const container = document.createElement('div');
        container.innerHTML = html;
        const a = container.querySelector('a');
        a.addEventListener("click", async () => {
            store.dispatch(await displayShipments(company.id))
        });
        document.querySelector("main div").appendChild(a);
        container.remove();
    });

    // The code below makes the new htmx code that is inserted to be processed as such. 
    htmx.process(document.querySelector("main div"));

    if (!isFetchingCompanies(store.getState())){
        document.dispatchEvent(new CustomEvent('contentLoaded'));
    }
};