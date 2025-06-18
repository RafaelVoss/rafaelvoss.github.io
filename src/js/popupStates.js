import { store } from '../store/index.js';
import { openPopup, closePopup, confirmArrival, confirmDelivery, goToPOD, confirmIssue, sendMessage, removeFile, navigateBackAction, updateStateAfterNavigateBack, stayLoggedIn, logout} from '../store/actions.js';
import { wasPODSent } from '../store/selectors.js';

export const resetPopupState = {
    visible: false,
    wasVisible: false,
    content: '',
    buttons: []
};

export const welcomePopupState = {
    visible: true,
    wasVisible: false,
    content: 'Bem-vindo!<br>Não é necessário fazer login por agora.<br>Teste a vontade o sistema.',
    buttons: [
        {
            color: 'green',
            text: 'Entendi',
            action: () => {
                closeConfirmationPopup();
                document.querySelector('main button yellow-button').click();
                document.querySelector('main button yellow-button').click();
            }
        }
    ]
}

export const failedLogInPopupState = (error) => ({
    visible: true,
    wasVisible: false,
    content: `${error.message.includes('401') ? 'Login ou senha incorretos!<br>Verifique-os e tente novamente.' :
                error.message.includes('internet') ? 'Verifique sua conexão com a internet.' :
                error.message.includes('5') ? 'Servidor fora do ar.<br>Tente novamente em alguns instantes.' : 'Erro desconhecido!<br>Tente novamente em alguns instantes.'}`,
    buttons: [
        {
            color: 'yellow',
            text: 'Fechar',
            action: closeConfirmationPopup
        }
    ]
})

export const popupAskingToLogOut = () => {
    store.dispatch(stayLoggedIn());
    return ({
        visible: true,
        wasVisible: false,
        content: 'Deseja realmente sair?',
        buttons:[
            {
                color: 'red',
                text: 'Sair',
                action: logOutAction
            },
            {
                color: 'green',
                text: 'Ficar',
                action: closeConfirmationPopup
            }
        ]
    });
}

export const failedToRetrieveCompaniesPopupState = (error) => ({
    visible: true,
    wasVisible: false,
    content: `${error.message.includes('internet') ? 'Verifique sua conexão com a internet.' :
                error.message.includes('5') ? 'Servidor fora do ar.<br>Tente novamente em alguns instantes.' : 'Erro desconhecido!<br>Tente novamente em alguns instantes.'}`,
    buttons: [
        {
            color: 'yellow',
            text: 'Fechar',
            action: closeConfirmationPopup
        }
    ]
})

export const failedToRetrieveShipmentsPopupState = (error) => ({
    visible: true,
    wasVisible: false,
    content: `${error.message.includes('internet') ? 'Verifique sua conexão com a internet.' :
                error.message.includes('5') ? 'Servidor fora do ar.<br>Tente novamente em alguns instantes.' : 'Erro desconhecido!<br>Tente novamente em alguns instantes.'}`,
    buttons: [
        {
            color: 'yellow',
            text: 'Fechar',
            action: closeConfirmationPopup
        }
    ]
})

export const arrivalPopupState = {
    visible: true,
    wasVisible: false,
    content: 'Confirmar chegada?',
    buttons: [
        {
            color: 'red',
            text: 'Cancelar',
            action: closeConfirmationPopup
        },
        {
            color: 'green',
            text: 'Confirmar',
            action: confirmArrivalAction
        }
    ]
}

export const popupWarningArrivalConfirmationFailed = (error) => ({
    visible: true,
    wasVisible: false,
    content: `Não foi possível confirmar a sua chegada.<br>${error.message.includes("internet") ? 'Verifique sua conexão com a internet.' : 'Servidor fora do ar.<br>Tente novamente em alguns instantes.'}`,
    buttons: [
        {
            color: 'yellow',
            text: 'Fechar',
            action: closeConfirmationPopup
        }
    ]
})
    
export const arrivalMissingPODsOnDocsPopupState = (htmxCall, currentPage) => {
    return ({
        visible: true,
        wasVisible: false,
        content: 'Esta entrega será acessível somente na área de "Comprovantes de Entrega".<br>Deseja realmente voltar?',
        buttons: [
            {
                color: 'green',
                text: 'Ficar',
                action: closeConfirmationPopup
            },
            {
                color: 'yellow',
                text: 'Voltar',
                action: () => goBackWithoutPODsAction(htmxCall, currentPage)
            }
        ]
    })
}

export const deliveryPopupState = (index) => ({
    visible: true,
    wasVisible: false,
    content: 'Confirmar Entrega?',
    buttons: [
        {
            color: 'red',
            text: 'Cancelar',
            action: closeConfirmationPopup
        },
        {
            color: 'green',
            text: 'Confirmar',
            action: () => confirmDeliveryAction(index)
        }
    ]
});

export const issuePopupState = (index) => ({
    visible: true,
    wasVisible: false,
    content: 'Confirmar Ocorrência?',
    buttons: [
        {
            color: 'red',
            text: 'Cancelar',
            action: closeConfirmationPopup
        },
        {
            color: 'redder',
            text: 'Confirmar',
            action: () => confirmIssueAction(index)
        }
    ]
});

export const takePictureOrChooseFromGaleryPopupState = (inputPhoto) => ({
    visible: true,
    wasVisible: false,
    content: "Tirar foto ou escolher da galeria?",
    buttons: [
        {
            color: 'yellow',
            text: 'Câmera',
            action: () => takePhotoAction(inputPhoto)
        },
        {
            color: 'yellow',
            text: 'Galeria',
            action: () => choosePhotoFromGalleryAction(inputPhoto)
        }
    ]
})

export const recordVideoOrChooseFromGaleryPopupState = (inputVideo) => ({
    visible: true,
    wasVisible: false,
    content: "Gravar vídeo ou escolher da galeria?",
    buttons: [
        {
            color: 'yellow',
            text: 'Câmera',
            action: () => recordVideoAction(inputVideo)
        },
        {
            color: 'yellow',
            text: 'Galeria',
            action: () => chooseVideoFromGalleryAction(inputVideo)
        }
    ]
})

export const popupWarningNoMessage = {
    visible: true,
    wasVisible: false,
    content: "Adicione um texto, foto, vídeo ou áudio antes de enviar!",
    buttons: [
        {
            color: 'yellow',
            text: 'Fechar',
            action: closeConfirmationPopup
        }
    ]
}

export const popupWarningMessageTooShort = {
        visible: true,
    wasVisible: false,
    content: "Dê mais detalhes sobre o ocorrido ou adicione uma foto, vídeo ou áudio!",
    buttons: [
        {
            color: 'yellow',
            text: 'Fechar',
            action: closeConfirmationPopup
        }
    ]
}

export const displayPopupWithFileState = (html, type, index) => ({
    visible: true,
    wasVisible: false,
    content: html,
    buttons: [
        {
            color: 'red',
            text: 'Excluir',
            action: () => removeFileAction(type, index)
        },
        {
            color: 'green',
            text: 'Fechar',
            action: closeConfirmationPopup
        }
    ]
})

export const popupContentAskingForPOD = (index, status) => ({
    visible: true,
    wasVisible: false,
    content: status === "delivered" ? "Adicionar Comprovantes de Entrega?" : "Adicionar Comprovante de Ocorrência?",
    buttons: [
        {
            color: 'red',
            text: 'Fechar',
            action: closeConfirmationPopup
        },
        {
            color: 'green',
            text: 'Adicionar',
            action: () => addPODAction(index)
        }
    ]
})

export const popupWarningPODWasSent = (doc) => ({
    visible: true,
    wasVisible: false,
    content: `Comprovante ${doc === "cte" ? "desse CTe" : "dessa NFe"} já foi enviado à central!`,
    buttons: [
        {
            color: 'yellow',
            text: 'Fechar',
            action: closeConfirmationPopup
        }
    ]
})

export const sendPODPopupState = (content) => ({
    visible: true,
    wasVisible: false,
    content: "Enviar Comprovante?",
    buttons: [
        {
            color: 'red',
            text: 'Fechar',
            action: closeConfirmationPopup
        },
        {
            color: 'green',
            text: 'Enviar',
            action: async () => await sendPODAction(content)
        }
    ]
})

export const popupWarningPODFailedToBeSent = (error) => ({
    visible: true,
    wasVisible: false,
    content: `Comprovante não enviado!<br>${error.message.includes("internet") ? 'Verifique sua conexão com a internet.' : 'Servidor fora do ar.<br>Tente novamente em alguns instantes.'}`,
    buttons: [
        {
            color: 'yellow',
            text: 'Fechar',
            action: closeConfirmationPopup
        }
    ]
})

export const popupForSuccessfullySendingAllPODs = {
    visible: true,
    wasVisible: false,
    content: "Comprovantes enviados à central com sucesso!",
    buttons: [
        {
            color: 'green',
            text: 'Fechar',
            action: closeConfirmationPopup
        }
    ]
}

function logOutAction() {
    store.dispatch(logout());
    closeConfirmationPopup();
}

async function confirmArrivalAction() {
    closeConfirmationPopup();
    store.dispatch(await confirmArrival());
}

function goBackWithoutPODsAction(htmxCall, currentPage) {
    htmxCall(currentPage);
    store.dispatch(updateStateAfterNavigateBack());
    closeConfirmationPopup();
}

function confirmDeliveryAction(index) {
    store.dispatch(confirmDelivery(index));
    store.dispatch(openPopup(popupContentAskingForPOD(index)));
}

function addPODAction(index) {
    store.dispatch(goToPOD(index));
    closeConfirmationPopup();
}

function confirmIssueAction(index) {
    store.dispatch(confirmIssue(index));
    closeConfirmationPopup();
}

async function sendPODAction(content) {
    closeConfirmationPopup();
    store.dispatch(await sendMessage(content));
    if (wasPODSent(store.getState())){
        store.dispatch(navigateBackAction());
    }
}

function takePhotoAction(inputPhoto) {
    closeConfirmationPopup();
    inputPhoto.setAttribute('capture', '');
    inputPhoto.click();
    inputPhoto.removeAttribute('capture');
}
function choosePhotoFromGalleryAction(inputPhoto) {
    closeConfirmationPopup();
    inputPhoto.click();
}
function recordVideoAction(inputVideo) {
    closeConfirmationPopup();
    inputVideo.setAttribute('capture', '');
    inputVideo.click();
    inputVideo.removeAttribute('capture');
}
function chooseVideoFromGalleryAction(inputVideo) {
    closeConfirmationPopup();
    inputVideo.click();
}

function removeFileAction(type, index) {
    store.dispatch(removeFile(type, index));
    closeConfirmationPopup();

}
function closeConfirmationPopup() {
    store.dispatch(closePopup(resetPopupState));
}