import { store } from '../store/index.js';
import { getHistoryPath, getTypeOfDocuments, getCurrentShipment} from '../store/selectors.js'
import { openPopup, updateStateAfterNavigateBack } from '../store/actions.js';
import { popupAskingToLogOut, arrivalMissingPODsOnDocsPopupState } from './popupStates.js';
import { DisplayEditUser } from './edit_user.js';
import { DisplayChangePassword } from './change_password.js';
import { DisplayMainPage} from './main_page.js';
import { DisplayCompanies } from './company_list.js';
import { DisplayDocumentsToDeliver } from './document_list.js';
import { DisplaySelectedDocument } from './document_view.js';
import { DisplayMessages } from './messages.js'

let contentDispatchedPage = '';
let htmxPage = '';

store.subscribe(() => {
    let historyArray = getHistoryPath(store.getState());
    let currentPage = historyArray[historyArray.length - 1];
    if (currentPage === htmxPage) {
        hydratePage(currentPage);
        contentDispatchedPage = currentPage;
    } else {
        contentDispatchedPage = currentPage;
    }
})

document.addEventListener('htmx:afterSettle', (event) => {
    let htmxReqPage = event.detail.pathInfo.requestPath;
    if (htmxReqPage.startsWith('/')) {
        htmxReqPage = htmxReqPage.slice(1);
    }
    if (htmxReqPage === contentDispatchedPage) {
        hydratePage(htmxReqPage);
        htmxPage = htmxReqPage;
    } else {
        htmxPage = htmxReqPage;
    }
})

document.addEventListener('navigateBack', () => {
    let historyArray = getHistoryPath(store.getState());
    let typeOfDocuments = getTypeOfDocuments(store.getState());
    let doc = getCurrentShipment(store.getState());
    let currentPage = historyArray[historyArray.length - 2];
    if (currentPage === 'index.html') {
        DisplayMainPage();
        store.dispatch(openPopup(popupAskingToLogOut()));
    } else if (currentPage === 'document_list.html' && typeOfDocuments === 'documents_to_deliver' && doc.status === 'arrived' && !checkIfPODsAreSent(doc)) {
        // THE LOGIC ABOVE REQUIRES A POD FOR EACH DOCUMENT REGARDLESS OF THE STATUS BEING 'DELIVERED' OR 'HAS AN ISSUE'
        DisplaySelectedDocument();
        store.dispatch(openPopup(arrivalMissingPODsOnDocsPopupState(htmxCall, currentPage)));
        return;
    } else if ( currentPage === 'main_page.html') {
        DisplayMainPage();
    } else {
        htmxCall(currentPage);
    }
    store.dispatch(updateStateAfterNavigateBack());
})

document.addEventListener('navigateHome', () => {
    DisplayMainPage();
})

const htmxCall = (page) => {
    htmx.ajax('GET', '/' + page, {
    target: 'main',
    swap: 'innerHTML',
    });
}

const hydratePage = async (page) => {
    switch (page) {
        case 'select_company.html':
            await DisplayCompanies();
            break;
        case 'document_list.html':
            DisplayDocumentsToDeliver();
            break;
        case 'document_view.html':
            DisplaySelectedDocument();
            break;
        case 'messages.html':
            DisplayMessages();
            break;
        case 'main_page.html':
            DisplayMainPage();
            break;
        case 'edit_user.html':
            DisplayEditUser();
            break;
        case 'change_password.html':
            DisplayChangePassword();
            break;
    }
}


const checkIfPODsAreSent = (doc) => {
    let countMissingPODs = 0;
    if (doc?.cte !== undefined){
        countMissingPODs += !(doc.cte?.POD === 'Sent')
    }
    doc.nfes.forEach((nfe) => {
        countMissingPODs += !(nfe?.POD === 'Sent')
    })
    if (countMissingPODs > 0) {
        return false;
    } else {
        return true;
    }
}