export const isPopupVisible = (state) => state.popup.visible;
export const wasPopupVisible = (state) => state.popup.wasVisible;
export const popupContent = (state) => state.popup.content;
export const displayButtons = (state) => {
    let buttonsArray = state.popup.buttons;
    let buttons = [];
    buttonsArray.forEach((button) => {
        let buttonElement;
        switch (button.color) {
            case 'green':
                buttonElement = document.createElement('green-button');
                break;
            case 'red':
                buttonElement = document.createElement('red-button');
                break;
            case 'redder':
                buttonElement = document.createElement('redder-button');
                break;
            case 'yellow':
                buttonElement = document.createElement('yellow-button');
                break;
            case 'gray':
                buttonElement = document.createElement('gray-button');
                break;
        }
        buttonElement.innerText = button.text;
        buttonElement.addEventListener('click', button.action, {once: true});
        buttons.push(buttonElement);
    })
    return buttons;
};
export const getHistoryPath = (state) => state.selectedByUser.pathHistory;
export const getCurrentPage = (state) => state.selectedByUser.pathHistory[state.selectedByUser.pathHistory.length - 1];
export const getCompanies = (state) => state.companies;
export const isFetchingCompanies = (state) => state.selectedByUser.isFetchingCompanies;
export const getShipments = (state) => {
    let shipments = state.companies[state.selectedByUser.companyId].shipments;
    if (state.selectedByUser.typeOfDocuments === "documents_to_deliver") {
        shipments = filterShipmentsToBeDelivered(shipments);
    } else if (state.selectedByUser.typeOfDocuments === "documents_delivered") {
        shipments = filterShipmentsThatArrived(shipments);
        shipments = filterOutShipmetnsWithPODsSent(shipments);
    }
    // filter shipments that are being searched
    if (state.selectedByUser.shipmentsSearchText !== undefined && state.selectedByUser.shipmentsSearchText !== null) {
        shipments = filterShipmentsBySearchText(shipments, state.selectedByUser.shipmentsSearchText);
    }
    // order shipments by date
    shipments = sortShipmentsByDate(shipments);
    return shipments;
}
export const isFetchingShipments = (state) => state.selectedByUser.isFetchingShipments;
export const getTypeOfDocuments = (state) => state.selectedByUser.typeOfDocuments;
export const getShipmentsSearchText = (state) => state.selectedByUser.shipmentsSearchText;
export const getIsShipmentsSearchBarSelected = (state) => state.selectedByUser.isShipmentsSearchBarSelected;
export const getCurrentShipment = (state) => {
    if (state.selectedByUser.companyId !== null && state.selectedByUser.shipmentIndex !== null) {
        return state.companies[state.selectedByUser.companyId].shipments[state.selectedByUser.shipmentIndex];
    }
    return null;
}
export const isUserConfirmingArrival = (state) => state.selectedByUser.isConfirmingArrival;
export const getShipmentIndex = (state, shipment) => {
    let shipmentIndex;
    state.companies[state.selectedByUser.companyId].shipments.forEach((s, index) => {
        if (s.nfes[0].id === shipment.nfes[0].id){
            shipmentIndex = index;
        }
    })
    return shipmentIndex;
};
export const getCurrentDocument = (state) => {
    return state.selectedByUser.documentIndex === -1 ? 
        state.companies[state.selectedByUser.companyId].shipments[state.selectedByUser.shipmentIndex]['cte'] 
        : 
        state.companies[state.selectedByUser.companyId].shipments[state.selectedByUser.shipmentIndex]['nfes'][state.selectedByUser.documentIndex];
}
export const isUserSendingPOD = (state) => state.selectedByUser.isSendingPOD;
export const wasPODSent = (state) => getCurrentDocument(state)?.POD === "Sent";

const filterShipmentsToBeDelivered = (shipments) => {
    shipments = shipments.filter((shipment) => shipment?.status === undefined)
    return shipments;
}

const filterShipmentsThatArrived = (shipments) => {
    shipments = shipments.filter((shipment) => shipment.status === "arrived")
    return shipments;
}

const filterOutShipmetnsWithPODsSent = (shipments) => {
    // This function requires that all shipments have arrived. Use it only after using filterShipmentsThatArrived() function.
    shipments = shipments.filter((shipment) => {
        let shipmentDocsHavePODs = 0;
        if (shipment?.cte !== undefined) {
            shipmentDocsHavePODs = shipmentDocsHavePODs + !(shipment.cte?.POD === "Sent");
        }
        shipment.nfes.forEach((nfe) => {
            shipmentDocsHavePODs = shipmentDocsHavePODs + !(nfe?.POD === "Sent");
        })
        if (shipmentDocsHavePODs > 0) {
            return true;
        } else {
            return false;
        }
    })
    return shipments;
}

const filterShipmentsBySearchText = (shipments, searchText) => {
    shipments = shipments.filter((shipment) => {
        // filter shipment by search text
        let originName = shipment.origin.name.toLowerCase();
        let destinationName = shipment.destination.name.toLowerCase();
        let originAddress = shipment.origin.address.toLowerCase();
        let destinationAddress = shipment.destination.address.toLowerCase();
        if (originName.includes(searchText) || destinationName.includes(searchText) || originAddress.includes(searchText) || destinationAddress.includes(searchText)) {
            return true;
        } else {
            return false;
        }
    })
    return shipments;
}

const sortShipmentsByDate = (shipments) => {
    shipments.sort((a,b) => a.nfes[0].schedule_date - b.nfes[0].schedule_date);
    return shipments;
}
