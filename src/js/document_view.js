import { store } from '../store/index.js';
import { openPopup, navigateBackAction } from '../store/actions.js';
import { getCurrentShipment, isUserConfirmingArrival } from '../store/selectors.js'
import { arrivalPopupState, deliveryPopupState, popupContentAskingForPOD, issuePopupState, popupWarningPODWasSent, popupForSuccessfullySendingAllPODs } from './popupStates.js';

export const DisplaySelectedDocument = () => {
    let shipment = getCurrentShipment(store.getState());
    if (checkIfAllPODsWereSent(shipment)) {
        store.dispatch(navigateBackAction());
        store.dispatch(openPopup(popupForSuccessfullySendingAllPODs))
        return;
    }
    let docView = document.createElement("div");
    docView.setAttribute("id", "document-view");
    docView.classList.add("overflow-auto", "mt-8");

    docView = setDocHeader(shipment, docView);
    docView = setDocBody(shipment, docView);
    document.querySelector('main #document-view').replaceChildren(docView)

    if (!isUserConfirmingArrival(store.getState())) {
        document.dispatchEvent(new CustomEvent('contentLoaded'));
    }
}

function checkIfAllPODsWereSent(shipment) {
    let allPODsWereSent = true;
    if (shipment?.cte?.POD !== 'Sent') return false;
    shipment.nfes.forEach((nfe) => {
        if (nfe?.POD !== 'Sent') allPODsWereSent = false;
    })
    return allPODsWereSent;
}

function setDocHeader(shipment, docView) {
    let html = `
    <div id="summary" class="border-b-2 border-black">
        <h3 class="text-2xl mb-4 text-center">${shipment.destination.name}</h3>
        <p>
            Entrega
        </p>
        <div class="flex flex-row w-full justify-between items-center">
            <address class="py-10">
                ${shipment.destination.address}
            </address>
            <yellow-button id="arrivalBTN" class="mx-4">
                Chegada
            </yellow-button>
        </div>
        <div class="justify-center text-xs pb-2 hidden" id="delivery-date-section">
            <arrival-flag></arrival-flag>
            <span class="italic pt-1" id="delivery-date-text"></span>
        </div>
    </div>
    `
    docView.innerHTML = html;

    docView.querySelector("#arrivalBTN").addEventListener("click", () => {
        store.dispatch(openPopup(arrivalPopupState));
    });

    if (shipment.status && shipment.status === 'arrived') {
        docView.querySelector("#arrivalBTN").classList.toggle("hidden");
        docView.querySelector("#delivery-date-text").innerHTML = "Chegada em " + FormatedDateFromDate(shipment.time) + " às " + FormatedTimeFromDate(shipment.time);
        docView.querySelector("#delivery-date-section").classList.toggle("hidden");
        docView.querySelector("#delivery-date-section").classList.toggle("flex");
    }
    return docView
}

function setDocBody(shipment, docView) {
    let div = document.createElement("div");
    div.setAttribute("id", "documents");
    div.classList.add("my-8");
    let html = '';
    if (shipment.cte) {
        html = `
        <table class="w-full">
            <tr>
                <th>
                    CT-e:
                </th>
            </tr>
            <tr class="flex flex-row w-full items-center justify-items-center">
                <td class="py-10 w-2/12 text-center">
                    ${shipment.cte.number}
                </td>
                ${shipment.status && shipment.status === 'arrived' && !shipment.cte.status ? 
                `
                <td class="w-5/12 text-center">
                    <green-button>Entrega</green-button>
                </td>
                <td class="w-5/12 text-center">
                    <red-button>Ocorrência</red-button>
                </td>
                `
                    : 
                ''}
                ${shipment.cte.status === 'delivered' ? 
                `<td class='w-8/12 text-center flex flex-col justify-center'>
                    ${shipment.cte?.POD === 'Sent' ? '<gray-button>':'<green-button>'}Entrega Ok${shipment.cte?.POD === 'Sent' ? '</gray-button>':'</green-button>'}
                    <div class='text-xs'>
                        <check-circle></check-circle>
                        <span class='italic pt-4'>Entregue em ${FormatedDateFromDate(shipment.cte.time)} às ${FormatedTimeFromDate(shipment.cte.time)}</span>
                    </div>
                </td>`
                : 
                shipment.cte.status === 'has an issue' ? 
                `
                <td class='w-8/12 text-center flex flex-col justify-center'>
                    ${shipment.cte?.POD === 'Sent' ? '<gray-button>':'<redder-button>'}Ocorrência${shipment.cte?.POD === 'Sent' ? '</gray-button>':'</redder-button>'}
                    <div class='text-xs'>
                        <warn-triangle></warn-triangle>
                        <span class='italic pt-4'>Ocorrência em ${FormatedDateFromDate(shipment.cte.time)} às ${FormatedTimeFromDate(shipment.cte.time)}</span>
                    </div>
                </td>
                `
                    :
                ''}
            </tr>
        </table>
        `
        div.insertAdjacentHTML('beforeend', html);

        if (shipment.status && shipment.status === 'arrived' && !shipment.cte.status) {
            div.querySelector("green-button").addEventListener('click', () => {
                store.dispatch(openPopup(deliveryPopupState(-1)));
            });
            div.querySelector("red-button").addEventListener('click', () => {
                store.dispatch(openPopup(issuePopupState(-1)));
            });
        } else if (shipment.status && shipment.status === 'arrived' && shipment.cte.status === 'delivered' && shipment.cte?.POD !== 'Sent') {
            div.querySelector("green-button").addEventListener('click', () => {
                    store.dispatch(openPopup(popupContentAskingForPOD(-1, 'delivered')))
            });
        } else if (shipment.status && shipment.status === 'arrived' && shipment.cte.status === 'has an issue' && shipment.cte?.POD !== 'Sent') {
            div.querySelector("redder-button").addEventListener('click', () => {
                store.dispatch(openPopup(popupContentAskingForPOD(-1, 'has an issue')))
            });
        } else if (shipment.cte?.POD === 'Sent') {
            div.querySelector("gray-button").addEventListener('click', () => {
                store.dispatch(openPopup(popupWarningPODWasSent("cte")))
            })
        }
    }
    shipment.nfes.forEach((nfe, index) => {
        html = `
        <table class="w-full">
            <tr>
                <th>
                    NF-e:
                </th>
            </tr>
            <tr class="flex flex-row w-full items-center justify-items-center">
                <td class="py-10 w-2/12 text-center">
                    ${nfe.number}
                </td>
                ${shipment.status && shipment.status === 'arrived' && !nfe.status ? 
                `
                <td class="w-5/12 text-center">
                    <green-button>Entrega</green-button>
                </td>
                <td class="w-5/12 text-center">
                    <red-button>Ocorrência</red-button>
                </td>
                `
                    :
                ''} 
                ${nfe.status === 'delivered' ? 
                `<td class='w-8/12 text-center flex flex-col justify-center'>
                    ${nfe?.POD === 'Sent' ? '<gray-button>':'<green-button>'}Entrega Ok${nfe?.POD === 'Sent' ? '</gray-button>':'</green-button>'}
                    <div class='text-xs'>
                        <check-circle></check-circle>
                        <span class='italic pt-4'>Entregue em ${FormatedDateFromDate(nfe.time)} às ${FormatedTimeFromDate(nfe.time)}</span>
                    </div>
                </td>`
                    : 
                nfe.status === 'has an issue' ? 
                `
                <td class='w-8/12 text-center flex flex-col justify-center'>
                    ${nfe?.POD === 'Sent' ? '<gray-button>':'<redder-button>'}Ocorrência${nfe?.POD === 'Sent' ? '</gray-button>':'</redder-button>'}
                    <div class='text-xs'>
                        <warn-triangle></warn-triangle>
                        <span class='italic pt-4'>Ocorrência em ${FormatedDateFromDate(nfe.time)} às ${FormatedTimeFromDate(nfe.time)}</span>
                    </div>
                </td>
                `
                    :
                ''}
            </tr>
        </table>
        `
        div.insertAdjacentHTML('beforeend', html);

        if (shipment.status && shipment.status === 'arrived' && !nfe.status) {
            const greenBTNList = div.querySelectorAll("#documents table tr td green-button");
            const greenEl = greenBTNList[greenBTNList.length -1];
            greenEl.addEventListener('click', () => {
                store.dispatch(openPopup(deliveryPopupState(index)));
            });

            const redBTNList = div.querySelectorAll("#documents table tr td red-button");
            const redEl = redBTNList[redBTNList.length -1]
            redEl.addEventListener('click', () => {
                store.dispatch(openPopup(issuePopupState(index)));
            });
        } else if (shipment.status && shipment.status === 'arrived' && nfe.status === 'delivered' && nfe?.POD !== 'Sent') {
            const greenBTNList = div.querySelectorAll("#documents table tr td green-button");
            const greenEl = greenBTNList[greenBTNList.length -1];
            greenEl.addEventListener('click', () => {
                    store.dispatch(openPopup(popupContentAskingForPOD(index, 'delivered')))
            });
        } else if (shipment.status && shipment.status === 'arrived' && nfe.status === 'has an issue' && nfe?.POD !== 'Sent') {
            const redderBTNList = div.querySelectorAll("#documents table tr td redder-button");
            const redderEl = redderBTNList[redderBTNList.length -1]
            redderEl.addEventListener('click', () => {
                    store.dispatch(openPopup(popupContentAskingForPOD(index, 'has an issue')))
            });
        } else if (nfe?.POD === 'Sent') {
            const grayBTNList = div.querySelectorAll("#documents table tr td gray-button");
            const grayEl = grayBTNList[grayBTNList.length -1]
            grayEl.addEventListener('click', () => {
                store.dispatch(openPopup(popupWarningPODWasSent("nfe")))
            })
        }
    })
    docView.insertAdjacentElement("beforeend", div);
    return docView
}

function FormatedDateFromDate(date) {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return day + "/" + month + "/" + year;
}

function FormatedTimeFromDate(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return (minutes>=10? hours + ":" + minutes : hours + ":0" + minutes);
}