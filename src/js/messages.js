import { store } from '../store/index.js';
import { saveDocContent, openPopup } from '../store/actions.js';
import { displayPopupWithFileState, sendPODPopupState, takePictureOrChooseFromGaleryPopupState, recordVideoOrChooseFromGaleryPopupState, popupWarningNoMessage, popupWarningMessageTooShort } from './popupStates.js';
import { getCurrentDocument, isUserSendingPOD, getCurrentPage } from '../store/selectors.js';

export const DisplayMessages = () => {
    let doc = getCurrentDocument(store.getState());
    console.log('doc ', doc);

    let html = `
    <div class="flex items-start h-24">
        <div class="w-full p-2 flex flex-col border-y-2 border-slate-800">
            ${doc.status === "delivered" ? '<h2 class="self-center">Entrega</h2>' : '<h2 class="self-center">Ocorrência</h2>'}
            <h3 class="self-center">${doc.description} ${doc.number}</h3>
        </div>
    </div>`;
    document.querySelector('main #page-description').innerHTML = html;

    html =`
    <div id="files_container" class="hidden items-end w-full h-28 pt-7 overflow-x-auto">
        <div id="files" class="flex flex-row flex-nowrap space-x-2">
        </div>
    </div>
    <div id="messages_input" class="flex flex-row grow pt-6 pb-4 items-end">
        <textarea type="text" class="h-full grow mr-2 p-1 pt-28 shadow-md shadow-gray-500 border-2 bg-slate-800 rounded-2xl border-black bg-opacity-50 placeholder:text-slate-300/50 placeholder:text-3xl placeholder:font-extrabold placeholder:text-center" placeholder="Comentário"></textarea>
        <confirm-button class="p-1 pb-1.5 scale-125 hidden"></confirm-button>
        <send-button class="p-1 pb-1.5 scale-125 hidden"></send-button>
    </div>
    <div id="attach_file" class="flex flex-row justify-around items-center h-8">
        <photo-button></photo-button>
        <film-button></film-button>
        <audio-button></audio-button>
    </div>
    <div class="hidden">
        <input type="file" id="capture-photo" accept="image/*" multiple/>
        <input type="file" id="capture-video" accept="video/*" multiple/>
        <input type="file" id="capture-audio" accept="audio/*" capture multiple/>
    </div>
    `;
    document.querySelector('main #messages-container').innerHTML = html;

    setPageState(doc);
    setInitialHeight();
    addUserContentToPage(doc);
    handlePageStateChanges(pageState);

    // ADD AN EVENT LISTENER TO HANDLE VISUAL CHANGES WHEN KEYBOARD IS OPENED OR CLOSED
    if (!window._viewportResizeListenerAdded) {
        window.visualViewport.addEventListener('resize', handleViewportResize);
        window._viewportResizeListenerAdded = true;
    }

    // ADJUSTING TEXTAREA HEIGHT AND OTHER ELEMENTS VISIBILITY DEPENDING ON THE TEXTAREA CONTENT SIZE
    document.querySelector('textarea').addEventListener('input', function(event) {
        pageState.hasMessage = event.target.value.length > 0;
        pageState.message = event.target.value;
        handlePageStateChanges(pageState);
    });
    
    // ADDING FUNCTIONALITY TO BUTTONS
    let photoBTN = document.querySelector('photo-button');
    let videoBTN = document.querySelector('film-button');
    let audioBTN = document.querySelector('audio-button');
    let inputPhoto = document.getElementById('capture-photo');
    let inputVideo = document.getElementById('capture-video');
    let inputAudio = document.getElementById('capture-audio');
    photoBTN.addEventListener('click', function() {
        store.dispatch(openPopup(takePictureOrChooseFromGaleryPopupState(inputPhoto)))
    });
    videoBTN.addEventListener('click', function() {
        store.dispatch(openPopup(recordVideoOrChooseFromGaleryPopupState(inputVideo)))
    });
    audioBTN.addEventListener('click', function() {
        inputAudio.click();
    });

    inputPhoto.addEventListener('change', async () => await handleFiles(inputPhoto.files, doc));
    inputVideo.addEventListener('change', async () => await handleFiles(inputVideo.files, doc));
    inputAudio.addEventListener('change', async () => await handleFiles(inputAudio.files, doc));

    document.querySelector('send-button').addEventListener('click', () => {
        let message = {
                message: document.querySelector('textarea').value,
                photos: doc.content.photoFiles,
                videos: doc.content.videoFiles,
                audios: doc.content.audioFiles
            }
        if (message.message === '' && message.photos.length === 0 && message.videos.length === 0 && message.audios.length === 0) {
            store.dispatch(openPopup(popupWarningNoMessage));
        } else if (message.message.length < 40 && message.photos.length === 0 && message.videos.length === 0 && message.audios.length === 0) {
            store.dispatch(openPopup(popupWarningMessageTooShort));
        } else {
            store.dispatch(openPopup(sendPODPopupState(message)));
        }
    })

    document.querySelector('confirm-button').addEventListener('click', () => {
        console.log('mobile keyboard supposedly closed. Need to veryfy if this works on mobile devices.');
        document.activeElement.blur();
    })

    if (!isUserSendingPOD(store.getState())){
        document.dispatchEvent(new CustomEvent('contentLoaded'));
    }
}

let pageState;
let initialHeight;

function setInitialHeight() {
    initialHeight = window.visualViewport.height;
}

function addUserContentToPage(doc) {
    if (pageState.hasMessage) {
        document.querySelector('textarea').value = doc.content.message;
    }
    if (pageState.hasFiles){
        makeFilesContainerVisible(document.querySelector('#files_container'), doc.content);
    }
}

function setPageState(doc) {
    pageState = {
        isKeyboardVisible: false,
        hasMessage: doc.content?.message ? true : false,
        hasFiles: doc.content?.photoFiles.length + doc.content?.videoFiles.length + doc.content?.audioFiles.length > 0 ? true : false,
        message: doc.content?.message ? doc.content.message : ''
    }
}

function handleViewportResize() {
    if (getCurrentPage(store.getState()) !== 'messages.html') return;
    const currentHeight = window.visualViewport.height;
    const heightDiff = initialHeight - currentHeight;

    if (heightDiff > 150) {
        pageState.isKeyboardVisible = true;
        handlePageStateChanges(pageState);
    } else {
        pageState.isKeyboardVisible = false;
        handlePageStateChanges(pageState);
    }
};

function handlePageStateChanges(state) {
    let msgInputContainer = document.querySelector('#messages_input');
    let filesContainer = document.querySelector('#files_container');
    let textarea = document.querySelector('textarea');
    let confirmButton = document.querySelector('confirm-button');
    let sendButton = document.querySelector('send-button');
    let textareaClasses = ['pt-28', 'h-full', 'placeholder:text-slate-300/50', 'placeholder:text-3xl', 'placeholder:font-extrabold', 'placeholder:text-center']

    textarea.removeAttribute('style');
    filesContainer.removeAttribute('style');
    msgInputContainer.removeAttribute('style');

    // IF PAGE HAS NOTHING ON IT AND KEYBOARD IS NOT VISIBLE
    if (!state.isKeyboardVisible && !state.hasMessage && !state.hasFiles) {
        document.querySelector('#page-description div div h2').innerHTML = 'keyboard fechado e sem conteúdo';
        confirmButton.classList.contains('hidden') ? null : confirmButton.classList.add('hidden');
        sendButton.classList.contains('hidden') ? null : sendButton.classList.add('hidden');
        msgInputContainer.classList.add('grow');
        textareaClasses.forEach(cls => {if(!textarea.classList.contains(cls)) textarea.classList.add(cls)})
    }
    // IF PAGE HAS KEYBOARD VISIBLE
    else if (state.isKeyboardVisible) {
        document.querySelector('#page-description div div h2').innerHTML = 'keyboard ABERTO';
        confirmButton.classList.contains('hidden') ? confirmButton.classList.remove('hidden') : null;
        sendButton.classList.contains('hidden') ? null : sendButton.classList.add('hidden');
        msgInputContainer.classList.remove('grow');
        textareaClasses.forEach(cls => {if(textarea.classList.contains(cls)) textarea.classList.remove(cls)});
        AdjustElementsSize(state);
    }
    // IF PAGE HAS MESSAGE OR FILES AND KEYBOARD IS NOT VISIBLE
    else {
        document.querySelector('#page-description div div h2').innerHTML = 'keyboard fechado';
        confirmButton.classList.contains('hidden') ? null : confirmButton.classList.add('hidden');
        sendButton.classList.contains('hidden') ? sendButton.classList.remove('hidden') : null;
        msgInputContainer.classList.remove('grow');
        textareaClasses.forEach(cls => {if(textarea.classList.contains(cls)) textarea.classList.remove(cls)});
        AdjustElementsSize(state);
    }
}

function AdjustElementsSize(state) {
    let main = document.querySelector('main');
    let pageDescription = document.querySelector('#page-description');
    let filesContainer = document.querySelector('#files_container');
    let msgInputContainer = document.querySelector('#messages_input');
    let textarea = document.querySelector('textarea');
    let mediaButtons = document.querySelector('#attach_file');

    // HEIGHT OF EACH ELEMENT WITHOUT STYLES
    let mainPadding = parseFloat(getComputedStyle(main).paddingTop) + parseFloat(getComputedStyle(main).paddingBottom);
    let mainHeight = main.offsetHeight;
    let pageDescriptionHeight = pageDescription.offsetHeight;
    let filesContainerHeight = filesContainer.offsetHeight;
    let mediaButtonsHeight = mediaButtons.offsetHeight;

    let maxHeight;
    let maxCount_br;
    let count_br = (state.message.match(/\n/g) || []).length;

    // SETTING THE HEIGHT OF THE TEXTAREA AND MSGINPUTCONTAINER
    maxHeight = mainHeight - mainPadding -pageDescriptionHeight - (state.hasFiles ? filesContainerHeight : 0) - (state.isKeyboardVisible ? -1 : 1) * mediaButtonsHeight;
    maxCount_br = Math.floor((maxHeight - 72) / 24);
    if (count_br > maxCount_br) count_br = maxCount_br;
    textarea.style.height = (36 + 24*count_br) + 'px';
    msgInputContainer.style.height = (72 + 24*count_br) + 'px';

    // HIDING THE BUTTONS OF THE BOTTOM OF THE PAGE WHEN KEYBOARD IS VISIBLE
    if (state.isKeyboardVisible && !state.hasFiles) {
        msgInputContainer.style.height = maxHeight + 'px';
    }
    if (state.isKeyboardVisible && state.hasFiles) {
        filesContainer.style.height = maxHeight + filesContainerHeight - msgInputContainer.offsetHeight + 'px';
    }
}

function makeFilesContainerVisible(filesContainer, content) {
    if(filesContainer.classList.contains('hidden')) {
        filesContainer.classList.remove('hidden');
        filesContainer.classList.add('flex');
    }
    addFileContainers(filesContainer, content);
}

function addFileContainers(filesContainer, content) {
    content.photoThumbnails.forEach((file,index) => {
        let photoContainer = document.createElement('div');
        photoContainer.classList.add('border-2', 'bg-slate-300', 'rounded-2xl', 'border-black', 'h-20', 'w-20');
        photoContainer.setAttribute("style", `background-image: url("${content.photoThumbnails[index]}");`);
        addEventListenerToFileContainer(photoContainer, 'photo', index);
        filesContainer.querySelector('#files').appendChild(photoContainer);
    });
    content.videoThumbnails.forEach((file,index) => {
        let videoContainer = document.createElement('div');
        videoContainer.classList.add('flex', 'flex-row', 'justify-center', 'border-2', 'bg-slate-300', 'rounded-2xl', 'border-black', 'h-20', 'w-20');
        videoContainer.setAttribute("style", `background-image: url("${content.videoThumbnails[index]}");`);
        const filmIcon = document.createElement('film-icon');
        filmIcon.classList.add('flex', 'flex-col', 'justify-center');
        addEventListenerToFileContainer(videoContainer, 'video', index);
        videoContainer.appendChild(filmIcon);
        filesContainer.appendChild(videoContainer);
    });
    content.audioFiles.forEach((file,index) => {
        let audioContainer = document.createElement('div');
        audioContainer.classList.add('flex', 'flex-row', 'justify-center', 'border-2', 'bg-slate-300', 'rounded-2xl', 'border-black', 'h-20', 'w-20');
        const audioIcon = document.createElement('audio-sound');
        audioIcon.classList.add('flex', 'flex-col', 'justify-center');
        addEventListenerToFileContainer(audioContainer, 'audio', index);
        audioContainer.appendChild(audioIcon);
        filesContainer.appendChild(audioContainer);
    });
}

// SAVING FILES TO THE STORE
async function handleFiles(files, doc) {
    let fileType = getFilesType(files);
    files = removeRepeatedFiles(files, doc.content[fileType + 'Files']);
    if (!checkAmountOfFiles(files, fileType, doc)){
        console.log('Invalid amount of files');
        return;
    }
    // make the thumbnails here
    if (fileType === 'photo') {
        files.forEach( async (file) => {
            await createPhotoThumbnail(file);
        })
    } else if (fileType === 'video') {
        files.forEach( async (file) => {
            await createVideoThumbnail(file);
        })
    } else if (fileType === 'audio') {
        store.dispatch(saveDocContent(files, [], fileType));
    }
}

function getFilesType(files) {
    if (files[0].type.startsWith('image/')){
        return 'photo';
    }
    else if (files[0].type.startsWith('video/')){
        return 'video';
    }
    else if (files[0].type.startsWith('audio/')){
        return 'audio';
    }
    else {
        alert('Invalid file type');
        return;
    }
}

function removeRepeatedFiles(inputFiles, arrayOfFilesStored) {
    if (arrayOfFilesStored) {
        let files = Array.from(inputFiles);
        return files.filter(file => !arrayOfFilesStored.some(fileStored => fileStored.name === file.name));
    } else {
        return inputFiles;
    }
}

function checkAmountOfFiles (files, type, doc) {
    const maximumPhotos = 5;
    const maximumVideos = 2;
    const maximumAudios = 3;
    const arrayLength = (files) => {
        if (files) {
            return files.length;
        } else {
            return 0;
        }
    }
    if (arrayLength(doc.content?.photoFiles) + files.length > maximumPhotos && type === 'photo') {
        alert(`Try to not attach more than ${maximumPhotos} photos per message`);
        return false;
    }
    else if (arrayLength(doc.content?.videoFiles) + files.length > maximumVideos && type === 'video') {
        alert(`Try to not attach more than ${maximumVideos} videos per message`);
        return false;
    }
    else if (arrayLength(doc.content?.audioFiles) + files.length > maximumAudios && type === 'audio') {
        alert(`Try to not attach more than ${maximumAudios} audios per message`);
        return false;
    }
    return true;
}

// CREATING THUMBNAILS

function createPhotoThumbnail(file) {
    return new Promise(async (resolve, reject) => {
        const url = window.URL.createObjectURL(file, {type: "image/*"});
        const canvas = document.createElement('canvas');
        canvas.width = 80;
        canvas.height = 80;
        const ctx = canvas.getContext("2d");
        const image = new Image();
        try {
            image.onload = async () => {
                URL.revokeObjectURL(url);
                await drawThumbnail(image, ctx, canvas, file, 'photo');
                resolve();
            };
            image.src = url;
        } catch (error) {
            URL.revokeObjectURL(url);
            reject(error);
        }
    })
};

function createVideoThumbnail(file) {
    return new Promise( async (resolve, reject) => {
        try {
            const snapshotTime = 2; // Time in seconds to capture thumbnail
            await getFrameForThumbnail(file, snapshotTime);
            resolve();
        } catch (error) {
            console.error('Error generating thumbnail:', error);
            alert('An error occurred while generating the thumbnail.');
            reject(error);
        } 
    })
};

function drawThumbnail(image, ctx, canvas, file, fileType) {
    return new Promise(async (resolve) => {
        const sprite = await createImageBitmap(image, 0, 0 ,image.width, image.height)
        ctx.drawImage(sprite, 0, 0, canvas.width, canvas.height);
        let dataURL = canvas.toDataURL("image/png");
        store.dispatch(saveDocContent([file], [dataURL], fileType));
        resolve();
    })
};

function getFrameForThumbnail(file, seekTime = 2) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const video = document.createElement('video');

        video.src = url;
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true; // For mobile compatibility

        video.addEventListener('loadedmetadata', () => {
            if (seekTime > video.duration) {
                seekTime = video.duration / 2;
            }
            video.currentTime = seekTime;
        });

        video.addEventListener('seeked', () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
                const thumbnailURL = URL.createObjectURL(blob);
                canvas.width = 80;
                canvas.height = 80;
                let image = new Image();
                image.onload = async () => {
                    await drawThumbnail(image, ctx, canvas, file, 'video');
                    resolve()
                }
                image.src = thumbnailURL;
                video.pause();
                video.src = '';
                video.load();
                URL.revokeObjectURL(url);
                canvas.remove();
                resolve();
            }, 'image/png');
        });

        video.addEventListener('error', (error) => {
            URL.revokeObjectURL(url);
            reject(error);
        });
    });
};

// HANDLING CLICK ON FILE CONTAINER
function addEventListenerToFileContainer(container, fileType, index) {
    container.addEventListener('click', async () => await handleCheckFilePopup(fileType, index));
}

async function handleCheckFilePopup(fileType, index) {
    let fileOnHTMLElement = await getFileOnHTMLElement(fileType, index);
    store.dispatch(openPopup(displayPopupWithFileState(fileOnHTMLElement, fileType, index)));
}

function getFileOnHTMLElement(fileType, index) {
    let content = getCurrentDocument(store.getState()).content;
    let file;
    if (fileType === 'photo') {
        file = content.photoFiles[index];
        return new Promise((resolve) => {
            let img = document.createElement('img');
            const url = URL.createObjectURL(file)
            img.onload = () => {
                resolve(img);
                // URL.revokeObjectURL(url);
            }
            img.src = url;
        })
    }
    else if (fileType === 'video') {
        file = content.videoFiles[index];
        return new Promise((resolve) => {
            let video = document.createElement('video');
            video.setAttribute('controls', '');
            video.classList.add('w-full');
            const url = URL.createObjectURL(file);
            video.addEventListener('loadedmetadata', () => {
                resolve(video);
                // URL.revokeObjectURL(url);
            })
            video.src = url;
        })
    }
    else if (fileType === 'audio') {
        file = content.audioFiles[index];
        return new Promise((resolve) => {
            let audio = document.createElement('audio');
            audio.setAttribute('controls', '');
            const url = URL.createObjectURL(file);
            audio.addEventListener('loadedmetadata', () => {
                resolve(audio);
                // URL.revokeObjectURL(url);
            })
            audio.src = url;
        })
    }
    else {
        return "Deu ruim aí...";
    }
}
