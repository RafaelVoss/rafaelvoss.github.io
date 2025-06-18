import { initialState } from "./index.js";

async function reducer(state, action) {
    console.log(action);
    let newCompanies;
    let newShipments;
    let companyId;
    let shipmentIndex;
    let typeOfDocument;
    let indexOfDocument;
    let content;
    let lastPage = state.selectedByUser.pathHistory[state.selectedByUser.pathHistory.length - 1];
    if (state.selectedByUser.companyId) {
        companyId = state.selectedByUser.companyId;
        if (state.selectedByUser.shipmentIndex || state.selectedByUser.shipmentIndex === 0) {
            shipmentIndex = state.selectedByUser.shipmentIndex;
            if (state.selectedByUser.documentIndex >= 0 && state.selectedByUser.documentIndex !== null) {
                typeOfDocument = 'nfes';
                indexOfDocument = state.selectedByUser.documentIndex;
            } else if (state.selectedByUser.documentIndex === -1) {
                typeOfDocument = 'cte';
                indexOfDocument = null;
            }
        }
    }
    if (lastPage === "messages.html" && action.type !== 'SET_CLOSE_POPUP') {
        saveMessages(state, companyId, shipmentIndex, typeOfDocument, indexOfDocument);
    }
    switch (action.type) {
        case 'LOGGING_IN':
            document.dispatchEvent(new Event('loggingIn'));
            break;
        case 'LOGIN_SUCCESS':
            goToMainPage();
            state.session = action.payload;
            sessionStorage.setItem('pageCount', 1);
            history.pushState({}, "");
            state.selectedByUser.pathHistory.push("main_page.html");
            break;
        case 'LOGIN_FAILURE':
            document.dispatchEvent(new Event('failedToLogIn'));
            state = initialState;
            break;
        case 'LOGOUT':
            state = initialState;
            window.location.href = "index.html";
            break;
        case 'NAVIGATE_BACK':
            decrementPageCount();
            document.dispatchEvent(new CustomEvent('navigateBack'));
            break;
        case 'UPDATE_STATE_AFTER_NAVIGATE_BACK':
            manageUserSelection(state, lastPage);
            state.selectedByUser.pathHistory.pop();
            break
        case 'STAY_LOGGED_IN':
            incrementPageCount();    
            state.selectedByUser.pathHistory.push("main_page.html");
            break;
        case 'NAVIGATE_TO_HOME':
            manageUserSelection(state, "main_page.html");
            state.selectedByUser.pathHistory = ["index.html", "main_page.html"];
            document.dispatchEvent(new CustomEvent('navigateHome'));
            break;
        case 'EDIT_USER':
            incrementPageCount();    
            state.selectedByUser.pathHistory.push("edit_user.html");
            break;
        case 'CHANGE_PASSWORD':
            incrementPageCount();    
            state.selectedByUser.pathHistory.push("change_password.html");
            break;
        case 'MAP': 
            incrementPageCount();    
            state.selectedByUser.pathHistory.push("maps.html");
            break;
        case 'GETTING_COMPANIES':
            document.dispatchEvent(new Event('fetchingCompanies'));
            state.selectedByUser.isFetchingCompanies = true;
            break;
        case 'DOWNLOAD_DOCUMENTS':
            newCompanies = filterForNewCompanies(state, action);
            newCompanies.forEach(company => {
                state.companies[company.id] = company;
            });
            state.selectedByUser.isFetchingCompanies = false;
            incrementPageCount();
            state.selectedByUser.pathHistory.push("select_company.html");
            state.selectedByUser.typeOfDocuments = "documents_to_deliver";
            break;
        case 'DOWNLOAD_DOCUMENTS_FAILURE':
            document.dispatchEvent(new Event('failedToRetrieveCompanies'));
            state.selectedByUser.isFetchingCompanies = false;
            break;
        case 'PODS':
            newCompanies = filterForNewCompanies(state, action);
            newCompanies.forEach(company => {
                state.companies[company.id] = company;
            });
            state.selectedByUser.isFetchingCompanies = false;
            incrementPageCount();
            state.selectedByUser.pathHistory.push("select_company.html");
            state.selectedByUser.typeOfDocuments = "documents_delivered";
            break;
        case 'PODS_FAILURE':
            document.dispatchEvent(new Event('failedToRetrieveCompanies'));
            state.selectedByUser.isFetchingCompanies = false;
            break;
        case 'GETTING_SHIPMENTS':
            document.dispatchEvent(new Event('fetchingShipments'));
            state.selectedByUser.isFetchingShipments = true;
            break;
        case 'DISPLAY_SHIPMENTS':
            if (action.payload) {
                newShipments = filterForNewShipments(state, action, action.payload.companyId);
                newShipments.forEach((shipment) => {
                    state.companies[action.payload.companyId].shipments.push(shipment);
                })
                state.selectedByUser.companyId = action.payload.companyId;
            }
            state.selectedByUser.isFetchingShipments = false;
            incrementPageCount();
            state.selectedByUser.pathHistory.push("document_list.html");
            break;
        case 'DISPLAY_SHIPMENTS_FAILURE':
            document.dispatchEvent(new Event('failedToRetrieveShipments'));
            state.selectedByUser.isFetchingShipments = false;
            break;
        case 'SEARCH_SHIPMENTS':
            state.selectedByUser.shipmentsSearchText = action.payload;
            state.selectedByUser.isShipmentsSearchBarSelected = true;
            break;
        case 'DESELECT_SHIPMENTS_SEARCH_BAR':
            state.selectedByUser.isShipmentsSearchBarSelected = false;
            break;
        case 'VIEW_DOCUMENT':
            state.selectedByUser.shipmentIndex = action.payload;
            incrementPageCount();
            state.selectedByUser.pathHistory.push("document_view.html");
            break;
        case 'CONFIRMING_ARRIVAL':
            document.dispatchEvent(new Event('confirmingArrival'))
            state.selectedByUser.isConfirmingArrival = true;
            break;
        case 'CONFIRM_ARRIVAL':
            document.dispatchEvent(new Event('arrivalConfirmed'))
            state.companies[companyId].shipments[shipmentIndex].status = "arrived";
            state.companies[companyId].shipments[shipmentIndex].time = new Date(Date.now());
            state.selectedByUser.isConfirmingArrival = false;
            break;
        case 'CONFIRM_ARRIVAL_FAILURE':
            document.dispatchEvent(new Event('arrivalFailed'))
            state.companies[companyId].shipments[shipmentIndex].status = "failed to confirm arrival";
            state.selectedByUser.isConfirmingArrival = false;
            break;
        case 'CONFIRM_DELIVERY':
            state.selectedByUser.documentIndex = action.payload;
            if (action.payload === -1) {
                state.companies[companyId].shipments[shipmentIndex]['cte'].status = "delivered";
                state.companies[companyId].shipments[shipmentIndex]['cte'].time = new Date(Date.now());
            } else {
                state.companies[companyId].shipments[shipmentIndex]['nfes'][action.payload].status = "delivered";
                state.companies[companyId].shipments[shipmentIndex]['nfes'][action.payload].time = new Date(Date.now());
            }
            break;
        case 'CONFIRM_ISSUE':
            state.selectedByUser.documentIndex = action.payload;
            incrementPageCount();
            state.selectedByUser.pathHistory.push("messages.html");
            if (action.payload === -1) {
                state.companies[companyId].shipments[shipmentIndex]['cte'].status = "has an issue";
                state.companies[companyId].shipments[shipmentIndex]['cte'].time = new Date(Date.now());
                setEmptyContentArrays(state, 'cte', action.payload, shipmentIndex);
            } else {
                state.companies[companyId].shipments[shipmentIndex]['nfes'][action.payload].status = "has an issue";
                state.companies[companyId].shipments[shipmentIndex]['nfes'][action.payload].time = new Date(Date.now());
                setEmptyContentArrays(state, 'nfes', action.payload, shipmentIndex);
            }
            messages();
            break;
        case 'GO_TO_POD':
            state.selectedByUser.documentIndex = action.payload;
            incrementPageCount();
            state.selectedByUser.pathHistory.push("messages.html");
            if (action.payload === -1) {
                if (!state.companies[companyId].shipments[shipmentIndex]['cte']?.content) {
                    setEmptyContentArrays(state, 'cte', action.payload, shipmentIndex);
                }
            } else {
                if (!state.companies[companyId].shipments[shipmentIndex]['nfes'][action.payload]?.content) {
                    setEmptyContentArrays(state, 'nfes', action.payload, shipmentIndex);
                }
            }
            messages();
            break;
        case 'REMOVE_FILE':
            if (typeOfDocument === 'cte') {
                content = state.companies[companyId].shipments[shipmentIndex][typeOfDocument].content;
                content[action.payload.type + "Files"] = content[action.payload.type + "Files"].filter(file => file !== content[action.payload.type + "Files"][action.payload.index]);
                if (action.payload.type !== 'audio') {
                    content[action.payload.type + "Thumbnails"] = content[action.payload.type + "Thumbnails"].filter(file => file !== content[action.payload.type + "Thumbnails"][action.payload.index]);
                }
                state.companies[companyId].shipments[shipmentIndex][typeOfDocument].content = content;
            } else if (typeOfDocument === 'nfes') {
                content = state.companies[companyId].shipments[shipmentIndex][typeOfDocument][indexOfDocument].content;
                content[action.payload.type + "Files"] = content[action.payload.type + "Files"].filter(file => file !== content[action.payload.type + "Files"][action.payload.index]);
                if (action.payload.type !== 'audio') {
                    content[action.payload.type + "Thumbnails"] = content[action.payload.type + "Thumbnails"].filter(file => file !== content[action.payload.type + "Thumbnails"][action.payload.index]);
                }
                state.companies[companyId].shipments[shipmentIndex][typeOfDocument][indexOfDocument].content = content
            }
            break;
        case 'SAVE_DOC_CONTENT':
            if (typeOfDocument === 'cte') {
                content = state.companies[companyId].shipments[shipmentIndex][typeOfDocument].content;
                content = await updateContent(content, action.payload.content, action.payload.thumbnails, action.payload.type);
                state.companies[companyId].shipments[shipmentIndex][typeOfDocument].content = content;
            } else if (typeOfDocument === 'nfes') {
                content = state.companies[companyId].shipments[shipmentIndex][typeOfDocument][indexOfDocument].content;
                content = await updateContent(content, action.payload.content, action.payload.thumbnails, action.payload.type);
                state.companies[companyId].shipments[shipmentIndex][typeOfDocument][indexOfDocument].content = content
            }
            break;
        case 'SENDING_MESSAGE':
            document.dispatchEvent(new Event('sendingMessage'));
            state.selectedByUser.isSendingPOD = true;
            break;
        case 'MESSAGE_SENT':
            document.dispatchEvent(new Event('messageSent'))
            if (typeOfDocument === 'cte') {
                state.companies[companyId].shipments[shipmentIndex][typeOfDocument].content.message = action.payload.message;
                state.companies[companyId].shipments[shipmentIndex][typeOfDocument].POD = "Sent";
            } else if (typeOfDocument === 'nfes') {
                state.companies[companyId].shipments[shipmentIndex][typeOfDocument][indexOfDocument].content.message = action.payload.message;
                state.companies[companyId].shipments[shipmentIndex][typeOfDocument][indexOfDocument].POD = "Sent";
            }
            state.selectedByUser.isSendingPOD = false;
            break;
        case 'SEND_MESSAGE_FAILURE':
            document.dispatchEvent(new Event('messageFailedToBeSent'));
            if (typeOfDocument === 'cte') {
                state.companies[companyId].shipments[shipmentIndex][typeOfDocument].POD = "Failed to be sent";
            } else if (typeOfDocument === 'nfes') {
                state.companies[companyId].shipments[shipmentIndex][typeOfDocument][indexOfDocument].POD = "Failed to be sent";
            }
            state.selectedByUser.isSendingPOD = false;
            break;
        case 'SET_OPEN_POPUP':
            state.popup = action.payload;
            break;
        case 'SET_CLOSE_POPUP':
            state.popup = action.payload;
            break;
        default:
            console.log("The reducer failed to recognize the action type.");
    }
    return state;
}

export default reducer;

const goToMainPage = () => {
    fetch("main_page.html", {
    method: 'GET',
    headers: {
        'Content-Type': 'text/html'
    },
    })
    .then(response => {
        if (!response.ok) {
        throw new Error('Network response was not ok');
        }
        return response.text();
    })
    .then(html => {
        document.open();
        document.write(html);
        document.close();
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });
};

const incrementPageCount = () => {
    history.pushState({}, "");
    sessionStorage.setItem('pageCount', parseInt(sessionStorage.getItem('pageCount')) + 1);
}

const decrementPageCount = () => {
    sessionStorage.setItem('pageCount', parseInt(sessionStorage.getItem('pageCount')) - 1);
}

const filterForNewCompanies = (state, action) => {
    let newCompanies = action.payload;
    Object.values(state.companies).forEach(company => {
        newCompanies = newCompanies.filter((payloadCompany) => {payloadCompany.id !== company.id})
    })
    return newCompanies;
}

const filterForNewShipments = (state, action, companyId) => {
    let newShipments = action.payload.shipments;
    if (state.companies[companyId]?.shipments === undefined) {
        state.companies[companyId].shipments = [];
        return newShipments;
    }
    Object.values(state.companies[companyId].shipments).forEach(shipment => {
        newShipments = newShipments.filter((payloadShipment) => {
            payloadShipment.nfes[0].id !== shipment.nfes[0].id;
        })
    })
    return newShipments;
}

const manageUserSelection = (state, lastPage) => {
    switch (lastPage) {
        case 'main_page.html':
            state.selectedByUser.typeOfDocuments = null;
            state.selectedByUser.companyId = null;
            state.selectedByUser.shipmentsSearchText = null;
            state.selectedByUser.isShipmentsSearchBarSelected = null;
            state.selectedByUser.shipmentIndex = null;
            state.selectedByUser.documentIndex = null;
            break;
        case 'select_company.html':
            state.selectedByUser.typeOfDocuments = null;
            break;
        case 'document_list.html':
            state.selectedByUser.shipmentsSearchText = null;
            state.selectedByUser.isShipmentsSearchBarSelected = null;
            state.selectedByUser.companyId = null;
            break;
        case 'document_view.html':
            state.selectedByUser.shipmentIndex = null;
            break;
        case 'messages.html':
            state.selectedByUser.documentIndex = null;
            break;
        default:
            console.log("reducer failed to recognize where to navigate back.");
    }
}

const saveMessages = (state, companyId, shipmentIndex, typeOfDocument, indexOfDocument) => {
    let message = document.querySelector('textarea').value;
    if (typeOfDocument === 'cte') {
        state.companies[companyId].shipments[shipmentIndex][typeOfDocument].content.message = message;
    }
    else if (typeOfDocument === 'nfes') {
        state.companies[companyId].shipments[shipmentIndex][typeOfDocument][indexOfDocument].content.message = message;
    }
}

const setEmptyContentArrays = (state, typeOfDocument, indexOfDocument, shipmentIndex) => {
    let content = {photoFiles: [], videoFiles: [], audioFiles: [], photoThumbnails: [], videoThumbnails: []};
    if (typeOfDocument === 'cte') {
        state.companies[state.selectedByUser.companyId].shipments[shipmentIndex][typeOfDocument].content = content;
    } else if (typeOfDocument === 'nfes') {
        state.companies[state.selectedByUser.companyId].shipments[shipmentIndex][typeOfDocument][indexOfDocument].content = content;
    }
    return state;
}

const messages = () => {
    htmx.ajax('GET', '/messages.html', {
    target: 'main', // = hx-target
    swap: 'innerHTML', // = hx-swap
    });
}

function updateContent(oldContent, newContent, thumbnails, type) {
    let updatedContent = oldContent;
    newContent.forEach(async (file, i) => {
        if (type === 'photo') {
            updatedContent.photoFiles.push(file);
            updatedContent.photoThumbnails.push(thumbnails[i]);
        } else if (type === 'video'){
            updatedContent.videoFiles.push(file);
            updatedContent.videoThumbnails.push(thumbnails[i]);
        } else if (type === 'audio'){
            updatedContent.audioFiles.push(file);
        }
    });
    return updatedContent;
}