// Web Navigation System (replaces IPC communication)
class WebNavigationService {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.initializeNavigation();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        return page.replace('.html', '');
    }

    initializeNavigation() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.page) {
                this.loadPage(event.state.page, false);
            }
        });

        // Set initial state
        history.replaceState({ page: this.currentPage }, '', window.location.href);
    }

    navigateTo(page, addToHistory = true) {
        console.log(`🧭 Navigating to: ${page}`);
        
        const pageMap = {
            'login': 'login.html',
            'dashboard': 'dashboard-simple.html',
            'inquiry': 'inquiry.html',
            'hearing': 'hearing.html',
            'realizar-oitiva': 'realizar-oitiva.html'
        };

        const targetPage = pageMap[page] || `${page}.html`;
        const currentUrl = new URL(window.location);
        currentUrl.pathname = `/${targetPage}`;

        if (addToHistory) {
            history.pushState({ page }, '', currentUrl.href);
        }

        window.location.href = currentUrl.href;
    }

    // Compatibility with existing IPC-based navigation
    send(event, ...args) {
        if (event === 'navigate-to') {
            this.navigateTo(args[0]);
        } else {
            console.warn(`🚨 Unhandled navigation event: ${event}`, args);
        }
    }

    // URL parameter helpers
    getUrlParams() {
        return new URLSearchParams(window.location.search);
    }

    getParam(name) {
        return this.getUrlParams().get(name);
    }

    setParam(name, value) {
        const url = new URL(window.location);
        url.searchParams.set(name, value);
        history.replaceState({ page: this.currentPage }, '', url.href);
    }

    removeParam(name) {
        const url = new URL(window.location);
        url.searchParams.delete(name);
        history.replaceState({ page: this.currentPage }, '', url.href);
    }

    // Authentication-based navigation
    redirectBasedOnAuth(user) {
        const publicPages = ['login', 'index'];
        const currentPage = this.getCurrentPage();

        if (user && publicPages.includes(currentPage)) {
            this.navigateTo('dashboard');
        } else if (!user && !publicPages.includes(currentPage)) {
            this.navigateTo('login');
        }
    }
}

// Create global navigation service
const webNavigation = new WebNavigationService();

// Export for use in modules
export default webNavigation;

// Global compatibility
window.webNavigation = webNavigation;

// Mock IPC renderer for compatibility
window.ipcRenderer = {
    send: (event, ...args) => webNavigation.send(event, ...args),
    on: (event, callback) => {
        console.warn(`🚨 IPC event listener not implemented for web: ${event}`);
    }
};

console.log('🌐 Web navigation system initialized');