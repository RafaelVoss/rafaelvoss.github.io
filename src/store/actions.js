import { store } from './index.js';
import { isPopupVisible } from './selectors.js';
import { createSession, getCompanies, getDocumentsToDeliver, createArrival, createMessage } from '../api/api.js';
import { failedLogInPopupState, failedToRetrieveCompaniesPopupState, failedToRetrieveShipmentsPopupState, popupWarningPODFailedToBeSent, popupWarningArrivalConfirmationFailed } from '../js/popupStates.js';

export const login = async (usrInput) => {
    store.dispatch({ type: 'LOGGING_IN', payload: null })
    try {
        const session = await createSession(usrInput)
        store.dispatch({ type: 'LOGIN_SUCCESS', payload: session })
    } catch (error) {
        store.dispatch(openPopup(failedLogInPopupState(error)))
        store.dispatch({ type: 'LOGIN_FAILURE', payload: null });
    }
};
    

export const logout = () => ({
    type: 'LOGOUT',
    payload: null
});

export const navigateBackAction = () => ({
    type: 'NAVIGATE_BACK',
    payload: null
})

export const updateStateAfterNavigateBack = () => ({
    type: 'UPDATE_STATE_AFTER_NAVIGATE_BACK',
    payload: null
})

export const stayLoggedIn = () => ({
    type: 'STAY_LOGGED_IN',
    payload: null
})

export const navigateToHome = () => ({
    type: 'NAVIGATE_TO_HOME',
    payload: null
})

export const editUser = () => ({
    type: 'EDIT_USER',
    payload: null
})

export const changePassword = () => ({
    type: 'CHANGE_PASSWORD',
    payload: null
})

export const map = () => ({
    type: 'MAP',
    payload: null
})

export const downloadDocuments = async () => {
    store.dispatch({ type: 'GETTING_COMPANIES', payload: null });
    try {
        const companies = await getCompanies();
        return { type: 'DOWNLOAD_DOCUMENTS', payload: companies}
    } catch (error) {
        store.dispatch({ type: 'DOWNLOAD_DOCUMENTS', payload: null });
        store.dispatch(navigateBackAction());
        store.dispatch(openPopup(failedToRetrieveCompaniesPopupState(error)));
        return { type: 'DOWNLOAD_DOCUMENTS_FAILURE', payload: null }
    }
}

export const PODs = async () => {
    store.dispatch({ type: 'GETTING_COMPANIES', payload: null });
    try {
        const companies = await getCompanies();
        return { type: 'PODS', payload: companies}
    } catch (error) {
        store.dispatch({ type: 'PODS', payload: null });
        store.dispatch(navigateBackAction());
        store.dispatch(openPopup(failedToRetrieveCompaniesPopupState(error)));
        return { type: 'PODS_FAILURE', payload: null }
    }
}

export const displayShipments = async (companyId) => {
    store.dispatch({ type: 'GETTING_SHIPMENTS', payload: null });
    try {
        const shipments = await getDocumentsToDeliver(companyId);
        return { type: 'DISPLAY_SHIPMENTS', payload: { companyId, shipments } }
    } catch (error) {
        store.dispatch({ type: 'DISPLAY_SHIPMENTS', payload: null });
        store.dispatch(navigateBackAction());
        store.dispatch(openPopup(failedToRetrieveShipmentsPopupState(error)));
        return { type: 'DISPLAY_SHIPMENTS_FAILURE', payload: null }
    }
}

export const searchShipments = (text) => ({
    type: 'SEARCH_SHIPMENTS',
    payload: text
})

export const deselectShipmentsSearchBar = () => ({
    type: 'DESELECT_SHIPMENTS_SEARCH_BAR',
    payload: null
})

export const viewDocument = (index) => ({
    type: 'VIEW_DOCUMENT',
    payload: index
})

export const confirmArrival = async () => {
    store.dispatch({ type: 'CONFIRMING_ARRIVAL', payload: null });
    try {
        // let coords = await getCoordinates();

        // // THE POPUP BELOW IS TO HELP VISUALIZE IF COORDINATES ARE BEING RECIEVED WHEN APP IS BUILD IN A MOBILE DEVICE
        // setTimeout(() => {
        //     store.dispatch(openPopup({
        //         visible: true,
        //         wasVisible: false,
        //         content: `Suas coordenadas:<br>Latitude: ${coords.latitude},<br>Longitude: ${coords.longitude}`,
        //         buttons: []
        //     }))
        // }, 300)
        // // DELETE EVERYTHING ABOVE UP TO HERE

        return await createArrival();
    } catch (error) {
        store.dispatch(openPopup(popupWarningArrivalConfirmationFailed(error)));
        return confirmArrivalFailure;
    }
}

export const confirmArrivalFailure = {
    type: 'CONFIRM_ARRIVAL_FAILURE',
    payload: null
}

function getCoordinates() {
    return new Promise((resolve, reject) => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve(position.coords);
                },
                (error) => {
                console.error('Error getting location:', error);
                reject(error);
                }
            );
        } else {
            const error = new Error('Geolocation is not supported by this browser.');
            console.error('Geolocation is not supported by this browser.');
            reject(error);
        }
    })
}

export const confirmDelivery = (index) => ({
    type: 'CONFIRM_DELIVERY',
    payload: index
});

export const goToPOD = (index) => ({
    type: 'GO_TO_POD',
    payload: index
})

export const confirmIssue = (index) => ({
    type: 'CONFIRM_ISSUE',
    payload: index
});

export const removeFile = (type, index) => ({
    type: 'REMOVE_FILE',
    payload: { type, index }
})

export const saveDocContent = (files, thumbnails, fileType) => ({
    type: 'SAVE_DOC_CONTENT',
    payload: {content: files, thumbnails: thumbnails, type: fileType}
})

export const sendMessage = async (message) => {
    store.dispatch({ type: 'SENDING_MESSAGE', payload: null });
    try{
        return await createMessage(message);
    } catch (error) {
        store.dispatch(openPopup(popupWarningPODFailedToBeSent(error)));
        return sendMessageFailure;
    }
}

export const sendMessageFailure = {
    type: 'SEND_MESSAGE_FAILURE',
    payload: null
}
    
export const openPopup = (popupContent) => ({
    type: 'SET_OPEN_POPUP',
    payload: {...popupContent, wasVisible: isPopupVisible(store.getState())}
});

export const closePopup = (popupContent) => ({
    type: 'SET_CLOSE_POPUP',
    payload: {...popupContent, wasVisible: isPopupVisible(store.getState())}
});


// Simulate an API call that fails if obj is falsy
// insert the following line in the try block:
// await simulateAPIcallError(null);
async function simulateAPIcallError(obj) {
    return await new Promise((resolve, reject) => {
        setTimeout(async () => {
            if (obj) {
                resolve(obj);
            }
            reject(new Error('500: Internal Server Error'));
            // reject(new Error('internet connection error'));
        }, 2000);
    })
}