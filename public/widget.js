class ChiCaptcha extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['base-url'];
    }

    connectedCallback() {
        this.render();
        window.addEventListener('message', this.handleMessage.bind(this));
    }

    disconnectedCallback() {
        window.removeEventListener('message', this.handleMessage.bind(this));
    }

    handleMessage(event) {
        const baseUrl = this.getAttribute('base-url');
        if (baseUrl && !baseUrl.startsWith(event.origin)) return;

        if (event.data.type === 'CHI_SOLVED') {
            console.log("Solved!")
            this.dispatchEvent(new CustomEvent('chi-solved', {
                detail: event.data.payload,
                bubbles: true,
                composed: true
            }));
            this.injectHiddenInput(event.data.payload);
        }

        if (event.data.type === 'CHI_RESIZE') {
            const iframe = this.shadowRoot.querySelector('iframe');
            if (iframe) {
                iframe.style.width = `${event.data.width}px`;
                iframe.style.height = `${event.data.height}px`;
            }
        }
    }

    injectHiddenInput(payload) {
        const form = this.closest('form');
        if (form) {
            let input = form.querySelector('input[name="chi-response"]');
            if (!input) {
                input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'chi-response';
                form.appendChild(input);
            }
            input.value = JSON.stringify(payload);
        }
    }

    render() {
        const baseUrl = this.getAttribute('base-url');
        
        if (!baseUrl) {
            this.shadowRoot.innerHTML = `<div style="color:red; font-size:12px;">Chi Error: base-url attribute is required.</div>`;
            return;
        }

        const widgetUrl = `${baseUrl.replace(/\/$/, '')}/widget`;
        
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: inline-block; vertical-align: middle; }
            </style>
            <iframe src="/static/widget.html" title="Chi captcha widget" style="border: none; overflow: hidden;" allowfullscreen="false" width="242" height="50" referrerpolicy="no-referrer"></iframe>
        `;
    }
}

customElements.define('chi-captcha', ChiCaptcha);