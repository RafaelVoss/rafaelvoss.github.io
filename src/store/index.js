import reducer from './reducer.js';

export const initialState = {
    session: null,
    popup: {
        visible: false,
        wasVisible: false,
        content: '',
        buttons: [],
    },
    companies: {},
    selectedByUser:{
        pathHistory: ['index.html'],
        typeOfDocuments: null,
        companyId: null,
        shipmentIndex: null,
        documentIndex: null,
        file: {
            type: null,
            index: null
        },
        isFetchingCompanies: false,
        isFetchingShipments: false,
        isConfirmingArrival: false,
        isSendingPOD: false
    }
};

let currentState = structuredClone(initialState);

export const store = {
    getState: () => currentState,
    
    dispatch: (action) => {
        reducer(currentState, action);
        store.listeners.forEach((listener) => listener());
        console.log(currentState);
    },
    
    listeners: [],
    
    subscribe: (listener) => {
        store.listeners.push(listener);
    }
};
