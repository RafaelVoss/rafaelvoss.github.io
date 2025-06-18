// THIS WAS THE CLEANEST WAY TO MAKE THE LOGIN PAGE PAGE AND THE REST OF THE APP TO HAVE A WORKING SPINNER.
class LoginSpinner extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }
    
    render() {
        this.shadowRoot.innerHTML = `
        <link href="/src/css/output.css" rel="stylesheet">
        <div id="loading-spinner-bg" class="fixed h-screen w-full z-30 bg-black opacity-40">
        </div>
        <div class="fixed top-1/2 left-1/2 w-16 h-16 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <div id="loading-spinner" class="border-8 border-gray-100 border-t-blue-500 rounded-full w-16 h-16 animate-spin"></div>
        </div>
        `;
    }
}

customElements.define('login-spinner', LoginSpinner);


const spinner = document.querySelector('login-spinner');

function showSpinner() {
    spinner.classList.remove('hidden');
}

function hideSpinner() {
    spinner.classList.add('hidden');
}

document.addEventListener('loggingIn', showSpinner);
document.addEventListener('failedToLogIn', hideSpinner);